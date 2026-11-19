import json
import math
import os
import textwrap
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from moviepy.editor import AudioFileClip, VideoClip, concatenate_videoclips

CANVAS_W = 1080
CANVAS_H = 1920
ASSETS_DIR = Path(__file__).resolve().parent / "assets"
CUSTOM_TEMPLATES_DIR = ASSETS_DIR / "custom_templates"
CUSTOM_MUSIC_DIR = ASSETS_DIR / "custom_music"
OUTPUT_DIR = Path(__file__).resolve().parent / "renders"
CUSTOM_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
CUSTOM_MUSIC_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _hex_to_rgb(hex_color: str, fallback: Tuple[int, int, int] = (255, 255, 255)) -> Tuple[int, int, int]:
    cleaned = (hex_color or "").strip().lstrip("#")
    if len(cleaned) == 3:
        cleaned = "".join(c * 2 for c in cleaned)
    if len(cleaned) != 6:
        return fallback
    try:
        return tuple(int(cleaned[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]
    except ValueError:
        return fallback


def _load_font(size: int, style: str = "serif", bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates: List[str] = []
    if style == "script":
        candidates.extend([
            str(ASSETS_DIR / "fonts" / "GreatVibes-Regular.ttf"),
            str(ASSETS_DIR / "fonts" / "DejaVuSerif-Bold.ttf"),
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        ])
    elif bold:
        candidates.extend([
            str(ASSETS_DIR / "fonts" / "Cinzel-Bold.ttf"),
            str(ASSETS_DIR / "fonts" / "DejaVuSerif-Bold.ttf"),
            str(ASSETS_DIR / "fonts" / "DejaVuSans-Bold.ttf"),
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ])
    else:
        candidates.extend([
            str(ASSETS_DIR / "fonts" / "CormorantGaramond-SemiBold.ttf"),
            str(ASSETS_DIR / "fonts" / "DejaVuSerif.ttf"),
            str(ASSETS_DIR / "fonts" / "DejaVuSans.ttf"),
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ])

    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def _create_luxury_card_backdrop(
    primary_hex: str,
    accent_hex: str,
    title_hint: str = "WEDDING SUITE",
) -> Image.Image:
    """Programmatic 1080x1920 Pakistani architectural luxury backdrop with Mughal arch & gold filigree."""
    p_rgb = _hex_to_rgb(primary_hex, (17, 79, 55))
    a_rgb = _hex_to_rgb(accent_hex, (232, 194, 102))

    y_idx = np.linspace(0, 1, CANVAS_H, dtype=np.float32)[:, None]
    x_idx = np.linspace(-1, 1, CANVAS_W, dtype=np.float32)[None, :]
    radial = np.clip(1.0 - 0.38 * (x_idx ** 2 + ((y_idx - 0.45) * 1.4) ** 2), 0.45, 1.15)

    base = np.zeros((CANVAS_H, CANVAS_W, 3), dtype=np.uint8)
    for c in range(3):
        channel = np.clip(p_rgb[c] * radial * (0.85 + 0.25 * (1.0 - y_idx)), 0, 255)
        base[:, :, c] = channel.astype(np.uint8)

    img = Image.fromarray(base, mode="RGB").convert("RGBA")
    draw = ImageDraw.Draw(img, "RGBA")

    # Double filigree gold border
    draw.rectangle([42, 42, CANVAS_W - 42, CANVAS_H - 42], outline=(*a_rgb, 210), width=4)
    draw.rectangle([60, 60, CANVAS_W - 60, CANVAS_H - 60], outline=(*a_rgb, 115), width=2)

    # Inner Mughal arch frame
    arch_points = [
        (110, CANVAS_H - 120),
        (110, 420),
        (160, 260),
        (290, 175),
        (540, 115),
        (790, 175),
        (920, 260),
        (970, 420),
        (970, CANVAS_H - 120),
    ]
    draw.line(arch_points + [arch_points[0]], fill=(*a_rgb, 170), width=3)

    # Corner diamond medallions
    for cx, cy in [(60, 60), (CANVAS_W - 60, 60), (60, CANVAS_H - 60), (CANVAS_W - 60, CANVAS_H - 60)]:
        r = 16
        draw.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=(*a_rgb, 225))

    return img.convert("RGB")


def _fit_and_clean_multipart_image(
    img_path: Path,
    patch_box: Tuple[float, float, float, float],
    sample_point: Tuple[float, float],
    clean_sample_text: bool = True,
    analysis: Optional[Dict] = None,
    patch_mode: str = "seamless",
    accent_rgb: Tuple[int, int, int] = (231, 194, 107),
) -> Tuple[Image.Image, Tuple[int, int, int, int]]:
    """Fits a wedding card image into 1080x1920 vertical canvas with ambient blurred backdrop,
    masks pre-existing text boxes using analyzed hideBoxes (or fallback patch_box), and returns
    (composed_canvas, safe_pixel_rect_on_1080x1920)."""
    src = Image.open(img_path).convert("RGB")

    # Ambient vertical blur canvas so any card aspect fills 9:16 cleanly
    bg = src.resize((CANVAS_W, CANVAS_H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=34))
    dark_overlay = Image.new("RGBA", (CANVAS_W, CANVAS_H), (6, 20, 14, 95))
    canvas = Image.alpha_composite(bg.convert("RGBA"), dark_overlay).convert("RGB")

    # Fit card nicely centered inside 1080x1460 inside 9:16
    scale = min(CANVAS_W / src.width, 1460 / src.height)
    new_w = int(src.width * scale)
    new_h = int(src.height * scale)
    card = src.resize((new_w, new_h), Image.Resampling.LANCZOS)

    paste_x = (CANVAS_W - new_w) // 2
    paste_y = (CANVAS_H - new_h) // 2

    safe_box = (analysis or {}).get("safeBox") or {
        "x": patch_box[0],
        "y": patch_box[1],
        "w": max(0.36, patch_box[2] - patch_box[0]),
        "h": max(0.28, patch_box[3] - patch_box[1]),
    }

    # Resolve interior sampled patch color
    patch_hex = (analysis or {}).get("patchColor")
    if patch_hex:
        sampled_color = _hex_to_rgb(str(patch_hex), (25, 97, 52))
    else:
        sx = min(card.width - 1, max(0, int(card.width * sample_point[0])))
        sy = min(card.height - 1, max(0, int(card.height * sample_point[1])))
        sampled_color = card.getpixel((sx, sy))

    if clean_sample_text and patch_mode != "direct":
        hide_boxes = (analysis or {}).get("hideBoxes") or [safe_box]
        patch_mask = Image.new("L", card.size, 0)
        m_draw = ImageDraw.Draw(patch_mask)
        for hb in hide_boxes:
            x1 = max(0, int(card.width * float(hb.get("x", 0.22))))
            y1 = max(0, int(card.height * float(hb.get("y", 0.22))))
            x2 = min(card.width, int(card.width * (float(hb.get("x", 0.22)) + float(hb.get("w", 0.56)))))
            y2 = min(card.height, int(card.height * (float(hb.get("y", 0.22)) + float(hb.get("h", 0.48)))))
            if x2 > x1 and y2 > y1:
                m_draw.rounded_rectangle([x1, y1, x2, y2], radius=32, fill=248)
        patch_mask = patch_mask.filter(ImageFilter.GaussianBlur(radius=16))
        solid_fill = Image.new("RGB", card.size, sampled_color)
        card = Image.composite(solid_fill, card, patch_mask)

    if patch_mode == "plaque":
        sx1 = max(4, int(card.width * float(safe_box.get("x", 0.22))))
        sy1 = max(4, int(card.height * float(safe_box.get("y", 0.22))))
        sx2 = min(card.width - 4, int(card.width * (float(safe_box.get("x", 0.22)) + float(safe_box.get("w", 0.56)))))
        sy2 = min(card.height - 4, int(card.height * (float(safe_box.get("y", 0.22)) + float(safe_box.get("h", 0.48)))))
        if sx2 > sx1 + 20 and sy2 > sy1 + 20:
            card_rgba = card.convert("RGBA")
            plaque_ov = Image.new("RGBA", card.size, (0, 0, 0, 0))
            p_draw = ImageDraw.Draw(plaque_ov, "RGBA")
            p_draw.rounded_rectangle(
                [sx1, sy1, sx2, sy2],
                radius=24,
                fill=(*sampled_color, 215),
                outline=(*accent_rgb, 195),
                width=3,
            )
            card = Image.alpha_composite(card_rgba, plaque_ov).convert("RGB")

    canvas.paste(card, (paste_x, paste_y))
    safe_rect = (
        paste_x + int(new_w * float(safe_box.get("x", 0.22))),
        paste_y + int(new_h * float(safe_box.get("y", 0.22))),
        max(220, int(new_w * float(safe_box.get("w", 0.56)))),
        max(240, int(new_h * float(safe_box.get("h", 0.48)))),
    )
    return canvas, safe_rect


def _draw_typewriter_lines(
    base_img: Image.Image,
    items: List[Dict],
    t_local: float,
    text_rgb: Tuple[int, int, int],
    accent_rgb: Tuple[int, int, int],
    spacing_scale: float = 1.0,
    safe_rect: Tuple[int, int, int, int] = (120, 300, 840, 1300),
) -> np.ndarray:
    frame = base_img.copy().convert("RGBA")
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    sx, sy, sw, sh = safe_rect
    pad_x = max(18, int(sw * 0.08))
    pad_y = max(22, int(sh * 0.075))
    inner_w = max(200, sw - pad_x * 2)
    inner_h = max(220, sh - pad_y * 2)
    center_x = sx + sw // 2
    box_scale = min(1.14, max(0.58, min(inner_w / 540.0, inner_h / 760.0)))
    min_y = sy + pad_y
    max_y = sy + sh - pad_y

    for item in items:
        start_t = item["start"]
        dur = max(0.25, item.get("type_dur", 1.2))
        if t_local < start_t:
            continue

        progress = min(1.0, (t_local - start_t) / dur)
        raw_text = str(item["text"] or "")
        if not raw_text.strip():
            continue
        visible_chars = max(1, int(math.ceil(len(raw_text) * progress)))
        shown_text = raw_text[:visible_chars]
        alpha = int(255 * min(1.0, (t_local - start_t) / 0.25))

        color = accent_rgb if item.get("accent") else text_rgb
        fs = max(16, int(item.get("size", 42) * box_scale))
        font = _load_font(
            size=fs,
            style=item.get("style", "serif"),
            bold=bool(item.get("bold", False)),
        )

        slot_y = float(item.get("slot_y", 0.5))
        base_y = int(min_y + slot_y * (max_y - min_y))
        approx_chars = max(14, int(inner_w / max(8.0, fs * 0.52)))
        wrapped = textwrap.wrap(shown_text, width=approx_chars) or [shown_text]
        line_h = int(fs * 1.18 * spacing_scale)
        half_h = ((len(wrapped) - 1) * line_h) // 2
        base_y = max(min_y + half_h + fs // 2, min(max_y - half_h - fs // 2, base_y))
        cur_y = base_y - half_h

        if item.get("box_border") and progress > 0.1:
            bw = min(inner_w + 16, 540)
            bh = max(56, len(wrapped) * line_h + 22)
            bx1, by1 = center_x - bw // 2, base_y - bh // 2
            draw.rounded_rectangle(
                [bx1, by1, bx1 + bw, by1 + bh],
                radius=14,
                outline=(*accent_rgb, int(alpha * 0.9)),
                width=3,
            )

        for line in wrapped:
            bbox = draw.textbbox((0, 0), line, font=font)
            tw = bbox[2] - bbox[0]
            tx = center_x - tw // 2
            draw.text((tx + 2, cur_y + 3), line, font=font, fill=(0, 0, 0, int(alpha * 0.55)))
            draw.text((tx, cur_y), line, font=font, fill=(*color, alpha))
            cur_y += line_h

    composed = Image.alpha_composite(frame, overlay).convert("RGB")
    return np.array(composed)


def render_wedding_card_video(payload: Dict) -> Path:
    """Renders a 18-20s vertical (1080x1920) 1-part, 2-part, or 3-part wedding card MP4 using Pillow + MoviePy."""
    template_id = str(payload.get("templateId") or "pakistani-emerald-mehndi-multipart")
    part_count = int(payload.get("partCount") or 2)
    if part_count not in (1, 2, 3):
        part_count = 2
    duration = float(payload.get("durationSeconds") or 19.0)
    duration = max(16.0, min(22.0, duration))
    crossfade_dur = 0.85

    styling = payload.get("styling") or {}
    primary_color = styling.get("primaryColor") or "#145339"
    secondary_color = styling.get("secondaryColor") or primary_color
    accent_color = styling.get("accentColor") or "#E7C26B"
    text_color = styling.get("textColor") or "#FFFFFF"
    spacing_scale = float(styling.get("spacingScale") or 1.0)
    clean_sample_text = bool(styling.get("cleanSampleText", True))
    patch_mode = str(styling.get("patchMode") or "seamless")

    text_rgb = _hex_to_rgb(text_color, (255, 255, 255))
    accent_rgb = _hex_to_rgb(accent_color, (231, 194, 107))

    s1_path = ASSETS_DIR / "s1.jpeg"
    s2_path = ASSETS_DIR / "s2.jpeg"
    manifest_path = ASSETS_DIR / "library.json"
    custom_p1: Optional[Path] = None
    custom_p2: Optional[Path] = None
    custom_p3: Optional[Path] = None
    p1_analysis: Optional[Dict] = None
    p2_analysis: Optional[Dict] = None
    p3_analysis: Optional[Dict] = None

    if template_id.startswith("custom_tpl_") and manifest_path.exists():
        try:
            lib = json.loads(manifest_path.read_text(encoding="utf-8"))
            for item in lib.get("templates") or []:
                if item.get("id") == template_id:
                    f1 = os.path.basename(str(item.get("part1Filename") or ""))
                    f2 = os.path.basename(str(item.get("part2Filename") or ""))
                    f3 = os.path.basename(str(item.get("part3Filename") or ""))
                    if f1 and (CUSTOM_TEMPLATES_DIR / f1).exists():
                        custom_p1 = CUSTOM_TEMPLATES_DIR / f1
                    if f2 and (CUSTOM_TEMPLATES_DIR / f2).exists():
                        custom_p2 = CUSTOM_TEMPLATES_DIR / f2
                    elif custom_p1 is not None:
                        custom_p2 = custom_p1
                    if f3 and (CUSTOM_TEMPLATES_DIR / f3).exists():
                        custom_p3 = CUSTOM_TEMPLATES_DIR / f3
                    elif custom_p2 is not None:
                        custom_p3 = custom_p2
                    p1_analysis = item.get("part1Analysis")
                    p2_analysis = item.get("part2Analysis") or p1_analysis
                    p3_analysis = item.get("part3Analysis") or p2_analysis or p1_analysis
                    break
        except Exception:
            pass

    default_safe_rect = (130, 310, 820, 1280)
    p1_safe = default_safe_rect
    p2_safe = default_safe_rect
    p3_safe = default_safe_rect

    if custom_p1 is not None and custom_p2 is not None:
        p1_bg, p1_safe = _fit_and_clean_multipart_image(
            custom_p1, (0.22, 0.22, 0.78, 0.70), (0.50, 0.45), clean_sample_text, p1_analysis, patch_mode, accent_rgb
        )
        p2_bg, p2_safe = _fit_and_clean_multipart_image(
            custom_p2, (0.22, 0.22, 0.78, 0.70), (0.50, 0.45), clean_sample_text, p2_analysis, patch_mode, accent_rgb
        )
        if custom_p3 is not None:
            p3_bg, p3_safe = _fit_and_clean_multipart_image(
                custom_p3, (0.22, 0.22, 0.78, 0.70), (0.50, 0.45), clean_sample_text, p3_analysis, patch_mode, accent_rgb
            )
        else:
            p3_bg, p3_safe = p1_bg, p1_safe
    elif template_id == "pakistani-emerald-mehndi-multipart" and s1_path.exists() and s2_path.exists():
        s1_builtin = {
            "safeBox": {"x": 0.235, "y": 0.245, "w": 0.53, "h": 0.42},
            "hideBoxes": [{"x": 0.235, "y": 0.238, "w": 0.53, "h": 0.325}, {"x": 0.22, "y": 0.568, "w": 0.56, "h": 0.102}],
            "patchColor": "#1B7A72",
        }
        s2_builtin = {
            "safeBox": {"x": 0.275, "y": 0.145, "w": 0.455, "h": 0.555},
            "hideBoxes": [{"x": 0.365, "y": 0.132, "w": 0.27, "h": 0.082}, {"x": 0.27, "y": 0.214, "w": 0.46, "h": 0.495}],
            "patchColor": "#196134",
        }
        p1_bg, p1_safe = _fit_and_clean_multipart_image(
            s1_path, (0.235, 0.245, 0.765, 0.665), (0.50, 0.45), clean_sample_text, s1_builtin, patch_mode, accent_rgb
        )
        p2_bg, p2_safe = _fit_and_clean_multipart_image(
            s2_path, (0.275, 0.145, 0.73, 0.70), (0.55, 0.35), clean_sample_text, s2_builtin, patch_mode, accent_rgb
        )
        p3_bg, p3_safe = p1_bg, p1_safe
    else:
        p1_bg = _create_luxury_card_backdrop(primary_color, accent_color)
        p2_bg = _create_luxury_card_backdrop(secondary_color, accent_color)
        p3_bg = _create_luxury_card_backdrop(primary_color, accent_color)

    card = payload.get("card") or {}

    if part_count == 1:
        single_items = [
            {"text": card.get("invocation", "IN THE NAME OF ALLAH · THE MOST MERCIFUL"), "slot_y": 0.05, "size": 21, "accent": True, "start": 0.3, "type_dur": 0.9},
            {"text": f"{card.get('hostLine1', '')}  &  {card.get('hostLine2', '')}", "slot_y": 0.145, "size": 32, "bold": True, "start": 1.0, "type_dur": 1.2},
            {"text": "Cordially Invite You to the Wedding Celebration of", "slot_y": 0.24, "size": 24, "start": 2.1, "type_dur": 1.0},
            {"text": f"{card.get('groomName', 'Hamza')}  &  {card.get('brideName', 'Ayesha')}", "slot_y": 0.345, "size": 52, "style": "script", "accent": True, "start": 3.0, "type_dur": 1.1},
            {"text": card.get("eventTitle", "Wedding Ceremony"), "slot_y": 0.465, "size": 56, "bold": True, "accent": True, "start": 3.9, "type_dur": 1.0},
            {"text": card.get("eventSubtitle", ""), "slot_y": 0.56, "size": 28, "start": 4.8, "type_dur": 0.9},
            {"text": f"Programme  ·  {card.get('weddingDate', '')}", "slot_y": 0.655, "size": 30, "bold": True, "accent": True, "start": 5.6, "type_dur": 1.1},
            {"text": card.get("timing1", ""), "slot_y": 0.735, "size": 27, "start": 6.6, "type_dur": 0.9},
            {"text": card.get("timing2", ""), "slot_y": 0.80, "size": 27, "start": 7.4, "type_dur": 0.9},
            {"text": card.get("venueName", ""), "slot_y": 0.885, "size": 36, "bold": True, "accent": True, "start": 8.2, "type_dur": 0.9},
            {"text": card.get("venueAddress", ""), "slot_y": 0.96, "size": 22, "start": 9.0, "type_dur": 1.2},
        ]
        final_clip = VideoClip(
            lambda t: _draw_typewriter_lines(p1_bg, single_items, t, text_rgb, accent_rgb, spacing_scale, p1_safe),
            duration=duration,
        )
    elif part_count == 3:
        seg_dur = (duration + crossfade_dur * 2.0) / 3.0
        tscale = seg_dur / 9.9
        f1_items = [
            {"text": card.get("invocation", "IN THE NAME OF ALLAH · THE MOST MERCIFUL"), "slot_y": 0.06, "size": 21, "accent": True, "start": 0.2 * tscale, "type_dur": 0.8 * tscale},
            {"text": f"{card.get('hostLine1', '')} & {card.get('hostLine2', '')}", "slot_y": 0.17, "size": 31, "bold": True, "start": 0.9 * tscale, "type_dur": 1.0 * tscale},
            {"text": f"{card.get('groomName', 'Hamza')}  &  {card.get('brideName', 'Ayesha')}", "slot_y": 0.30, "size": 48, "style": "script", "accent": True, "start": 1.8 * tscale, "type_dur": 1.0 * tscale},
            {"text": f"FUNCTION 1  ·  {card.get('func1Title', 'Mehndi')}", "slot_y": 0.45, "size": 54, "bold": True, "accent": True, "start": 2.6 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func1Subtitle", '"Rasm-e-Hina" & Dholki Night'), "slot_y": 0.57, "size": 29, "start": 3.4 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func1Date", "Friday 27 November 2026"), "slot_y": 0.69, "size": 32, "bold": True, "accent": True, "start": 4.2 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func1Timing", "Mehndi 6:30 PM · Dinner 8:00 PM"), "slot_y": 0.80, "size": 27, "start": 5.0 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func1Venue", "RAUF MARQUI · Lahore"), "slot_y": 0.92, "size": 27, "bold": True, "accent": True, "start": 5.8 * tscale, "type_dur": 0.9 * tscale, "box_border": True},
        ]
        f2_items = [
            {"text": "FUNCTION 2  ·  ROYAL CEREMONY", "slot_y": 0.08, "size": 24, "bold": True, "accent": True, "start": 0.2 * tscale, "type_dur": 0.8 * tscale},
            {"text": card.get("func2Title", "Barat"), "slot_y": 0.24, "size": 70, "style": "script", "accent": True, "start": 0.9 * tscale, "type_dur": 1.0 * tscale},
            {"text": card.get("func2Subtitle", "Istiqbal-e-Barat & Rukhsati"), "slot_y": 0.40, "size": 32, "start": 1.8 * tscale, "type_dur": 0.9 * tscale},
            {"text": f"{card.get('groomName', 'Hamza')}  &  {card.get('brideName', 'Ayesha')}", "slot_y": 0.54, "size": 36, "bold": True, "accent": True, "start": 2.6 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func2Date", "Saturday 28 November 2026"), "slot_y": 0.68, "size": 34, "bold": True, "accent": True, "start": 3.4 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func2Timing", "Barat 7:30 PM · Dinner 9:00 PM"), "slot_y": 0.79, "size": 29, "start": 4.2 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func2Venue", "ROYAL PALM MARQUEE · Lahore"), "slot_y": 0.92, "size": 29, "bold": True, "accent": True, "start": 5.0 * tscale, "type_dur": 1.0 * tscale, "box_border": True},
        ]
        f3_items = [
            {"text": "FUNCTION 3  ·  GRAND RECEPTION", "slot_y": 0.08, "size": 24, "bold": True, "accent": True, "start": 0.2 * tscale, "type_dur": 0.8 * tscale},
            {"text": card.get("func3Title", "Walima"), "slot_y": 0.24, "size": 70, "style": "script", "accent": True, "start": 0.9 * tscale, "type_dur": 1.0 * tscale},
            {"text": card.get("func3Subtitle", "Sunnat-e-Walima Reception"), "slot_y": 0.40, "size": 32, "start": 1.8 * tscale, "type_dur": 0.9 * tscale},
            {"text": f"{card.get('groomName', 'Hamza')}  &  {card.get('brideName', 'Ayesha')}", "slot_y": 0.54, "size": 36, "bold": True, "accent": True, "start": 2.6 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func3Date", "Sunday 29 November 2026"), "slot_y": 0.68, "size": 34, "bold": True, "accent": True, "start": 3.4 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func3Timing", "Arrival 1:30 PM · Lunch 2:30 PM"), "slot_y": 0.79, "size": 29, "start": 4.2 * tscale, "type_dur": 0.9 * tscale},
            {"text": card.get("func3Venue", "PEARL CONTINENTAL · Lahore"), "slot_y": 0.92, "size": 29, "bold": True, "accent": True, "start": 5.0 * tscale, "type_dur": 1.0 * tscale, "box_border": True},
        ]
        c1 = VideoClip(lambda t: _draw_typewriter_lines(p1_bg, f1_items, t, text_rgb, accent_rgb, spacing_scale, p1_safe), duration=seg_dur)
        c2 = VideoClip(lambda t: _draw_typewriter_lines(p2_bg, f2_items, t, text_rgb, accent_rgb, spacing_scale, p2_safe), duration=seg_dur).crossfadein(crossfade_dur)
        c3 = VideoClip(lambda t: _draw_typewriter_lines(p3_bg, f3_items, t, text_rgb, accent_rgb, spacing_scale, p3_safe), duration=seg_dur).crossfadein(crossfade_dur)
        final_clip = concatenate_videoclips([c1, c2, c3], padding=-crossfade_dur, method="compose")
    else:
        part1_dur = (duration + crossfade_dur) / 2.0
        part2_dur = (duration + crossfade_dur) / 2.0
        part1_items = [
            {"text": card.get("invocation", "IN THE NAME OF ALLAH · THE MOST MERCIFUL"), "slot_y": 0.06, "size": 21, "accent": True, "start": 0.4, "type_dur": 1.1},
            {"text": card.get("hostLine1", "Mr. & Mrs. Jalal Din (Late)"), "slot_y": 0.19, "size": 38, "bold": True, "start": 1.3, "type_dur": 1.4},
            {"text": card.get("relationLine1", "Request the pleasure of your company at the Wedding of their Beloved Nephew"), "slot_y": 0.33, "size": 25, "start": 2.6, "type_dur": 1.6},
            {"text": card.get("hostLine2", "Mr. & Mrs. M Amjad Rana"), "slot_y": 0.49, "size": 38, "bold": True, "accent": True, "start": 4.0, "type_dur": 1.3},
            {"text": card.get("relationLine2", "Cordially invite you to the Wedding Ceremony of their Beloved Daughter"), "slot_y": 0.63, "size": 25, "start": 5.1, "type_dur": 1.5},
            {"text": f"{card.get('groomName', 'Hamza')}  &  {card.get('brideName', 'Ayesha')}", "slot_y": 0.77, "size": 48, "style": "script", "accent": True, "start": 6.2, "type_dur": 1.3},
            {"text": f"{card.get('specialTitle', 'Special Invitees')}: {card.get('specialNames', 'Ammal Fatima, Mehroosh')}", "slot_y": 0.92, "size": 24, "start": 7.2, "type_dur": 1.4, "box_border": True},
        ]

        part2_items = [
            {"text": card.get("part2Blessing", "In Sha Allah"), "slot_y": 0.06, "size": 34, "accent": True, "style": "serif", "bold": True, "start": 0.5, "type_dur": 0.9},
            {"text": card.get("part2Intro", "JOIN US FOR A JOYFUL EVENING OF"), "slot_y": 0.15, "size": 22, "start": 1.2, "type_dur": 1.1},
            {"text": card.get("eventTitle", "Mehndi"), "slot_y": 0.28, "size": 70, "style": "script", "accent": True, "start": 2.0, "type_dur": 1.1},
            {"text": card.get("eventSubtitle", '"Rasm-e-Hina" Celebration'), "slot_y": 0.40, "size": 30, "start": 3.0, "type_dur": 1.1},
            {"text": f"Programme  ·  {card.get('weddingDate', 'Thursday 26 November 2026')}", "slot_y": 0.53, "size": 32, "bold": True, "accent": True, "start": 3.9, "type_dur": 1.4},
            {"text": card.get("timing1", "Mehndi ..................... 6:00 PM"), "slot_y": 0.64, "size": 28, "start": 5.1, "type_dur": 1.0},
            {"text": card.get("timing2", "Dinner ..................... 7:00 PM"), "slot_y": 0.72, "size": 28, "start": 5.9, "type_dur": 1.0},
            {"text": card.get("venueName", "RAUF MARQUI"), "slot_y": 0.84, "size": 36, "bold": True, "accent": True, "start": 6.7, "type_dur": 1.0},
            {"text": card.get("venueAddress", "Mughalpura Road, Baja Line, Near Railway Power House, Lahore"), "slot_y": 0.94, "size": 23, "start": 7.5, "type_dur": 1.4},
        ]

        clip1 = VideoClip(
            lambda t: _draw_typewriter_lines(p1_bg, part1_items, t, text_rgb, accent_rgb, spacing_scale, p1_safe),
            duration=part1_dur,
        )
        clip2 = VideoClip(
            lambda t: _draw_typewriter_lines(p2_bg, part2_items, t, text_rgb, accent_rgb, spacing_scale, p2_safe),
            duration=part2_dur,
        ).crossfadein(crossfade_dur)

        final_clip = concatenate_videoclips([clip1, clip2], padding=-crossfade_dur, method="compose")

    out_name = f"wcg_{template_id}_{part_count}p_{int(os.times().elapsed * 100)}.mp4"
    out_path = OUTPUT_DIR / out_name

    music_id = str(payload.get("musicId") or "mehndi-laga-ke-rakhna").strip()
    music_volume = max(0.0, min(1.0, float(payload.get("musicVolume", 0.78))))
    music_path: Optional[Path] = None
    if music_id != "none" and music_volume > 0.01:
        for ext in (".mp3", ".wav", ".m4a", ".ogg"):
            cand = CUSTOM_MUSIC_DIR / f"{os.path.basename(music_id)}{ext}"
            if cand.exists():
                music_path = cand
                break
        if music_path is None:
            builtin = ASSETS_DIR / "music" / f"{os.path.basename(music_id)}.m4a"
            if builtin.exists():
                music_path = builtin

    audio_clip = None
    if music_path is not None:
        try:
            audio_clip = (
                AudioFileClip(str(music_path))
                .subclip(0, min(duration, 29.5))
                .volumex(music_volume)
                .audio_fadein(0.6)
                .audio_fadeout(1.4)
            )
            final_clip = final_clip.set_audio(audio_clip)
        except Exception:
            audio_clip = None

    final_clip.write_videofile(
        str(out_path),
        fps=24,
        codec="libx264",
        audio=bool(audio_clip is not None),
        audio_codec="aac" if audio_clip is not None else None,
        preset="medium",
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        logger=None,
    )
    if audio_clip is not None:
        audio_clip.close()
    return out_path
