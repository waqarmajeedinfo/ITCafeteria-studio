import math
import os
import textwrap
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from moviepy.editor import VideoClip, concatenate_videoclips

CANVAS_W = 1080
CANVAS_H = 1920
ASSETS_DIR = Path(__file__).resolve().parent / "assets"
OUTPUT_DIR = Path(__file__).resolve().parent / "renders"
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
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        ])
    elif bold:
        candidates.extend([
            str(ASSETS_DIR / "fonts" / "Cinzel-Bold.ttf"),
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ])
    else:
        candidates.extend([
            str(ASSETS_DIR / "fonts" / "CormorantGaramond-SemiBold.ttf"),
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
) -> Image.Image:
    """Fits a wedding card image into 1080x1920 vertical canvas with ambient blurred backdrop
    and optionally blends out baked-in sample text in the center zone while preserving floral artwork."""
    src = Image.open(img_path).convert("RGB")

    # Ambient vertical blur canvas so 4:5 cards fill 9:16 cleanly with zero harsh letterboxing
    bg = src.resize((CANVAS_W, CANVAS_H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=34))
    dark_overlay = Image.new("RGBA", (CANVAS_W, CANVAS_H), (6, 20, 14, 95))
    canvas = Image.alpha_composite(bg.convert("RGBA"), dark_overlay).convert("RGB")

    # Fit card nicely centered at 1080x1350..1460 inside 9:16
    scale = min(CANVAS_W / src.width, 1460 / src.height)
    new_w = int(src.width * scale)
    new_h = int(src.height * scale)
    card = src.resize((new_w, new_h), Image.Resampling.LANCZOS)

    if clean_sample_text:
        sx = min(card.width - 1, max(0, int(card.width * sample_point[0])))
        sy = min(card.height - 1, max(0, int(card.height * sample_point[1])))
        sampled_color = card.getpixel((sx, sy))

        x1 = int(card.width * patch_box[0])
        y1 = int(card.height * patch_box[1])
        x2 = int(card.width * patch_box[2])
        y2 = int(card.height * patch_box[3])

        patch_mask = Image.new("L", card.size, 0)
        m_draw = ImageDraw.Draw(patch_mask)
        m_draw.rounded_rectangle([x1, y1, x2, y2], radius=36, fill=248)
        patch_mask = patch_mask.filter(ImageFilter.GaussianBlur(radius=16))

        solid_fill = Image.new("RGB", card.size, sampled_color)
        card = Image.composite(solid_fill, card, patch_mask)

    paste_x = (CANVAS_W - new_w) // 2
    paste_y = (CANVAS_H - new_h) // 2
    canvas.paste(card, (paste_x, paste_y))
    return canvas


def _draw_typewriter_lines(
    base_img: Image.Image,
    items: List[Dict],
    t_local: float,
    text_rgb: Tuple[int, int, int],
    accent_rgb: Tuple[int, int, int],
    spacing_scale: float = 1.0,
) -> np.ndarray:
    frame = base_img.copy().convert("RGBA")
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    center_x = CANVAS_W // 2
    for item in items:
        start_t = item["start"]
        dur = max(0.25, item.get("type_dur", 1.2))
        if t_local < start_t:
            continue

        progress = min(1.0, (t_local - start_t) / dur)
        raw_text = str(item["text"] or "")
        visible_chars = max(1, int(math.ceil(len(raw_text) * progress)))
        shown_text = raw_text[:visible_chars]
        alpha = int(255 * min(1.0, (t_local - start_t) / 0.25))

        color = accent_rgb if item.get("accent") else text_rgb
        font = _load_font(
            size=item.get("size", 42),
            style=item.get("style", "serif"),
            bold=bool(item.get("bold", False)),
        )

        base_y = int(CANVAS_H * 0.5 + (item["y_rel"] * CANVAS_H * spacing_scale))
        wrapped = textwrap.wrap(shown_text, width=item.get("wrap", 34)) or [shown_text]
        line_h = int(item.get("size", 42) * 1.24)
        cur_y = base_y - ((len(wrapped) - 1) * line_h) // 2

        for line in wrapped:
            bbox = draw.textbbox((0, 0), line, font=font)
            tw = bbox[2] - bbox[0]
            tx = center_x - tw // 2
            # Drop shadow for legibility
            draw.text((tx + 2, cur_y + 3), line, font=font, fill=(0, 0, 0, int(alpha * 0.55)))
            draw.text((tx, cur_y), line, font=font, fill=(*color, alpha))
            cur_y += line_h

        if item.get("box_border") and progress > 0.1:
            bw, bh = 540, 118
            bx1, by1 = center_x - bw // 2, base_y - bh // 2
            draw.rounded_rectangle(
                [bx1, by1, bx1 + bw, by1 + bh],
                radius=14,
                outline=(*accent_rgb, int(alpha * 0.9)),
                width=3,
            )

    composed = Image.alpha_composite(frame, overlay).convert("RGB")
    return np.array(composed)


def render_wedding_card_video(payload: Dict) -> Path:
    """Renders a 18-20s vertical (1080x1920) multi-part wedding card MP4 using Pillow + MoviePy."""
    template_id = str(payload.get("templateId") or "pakistani-emerald-mehndi-multipart")
    duration = float(payload.get("durationSeconds") or 19.0)
    duration = max(16.0, min(22.0, duration))
    crossfade_dur = 0.9
    part1_dur = (duration + crossfade_dur) / 2.0
    part2_dur = (duration + crossfade_dur) / 2.0

    styling = payload.get("styling") or {}
    primary_color = styling.get("primaryColor") or "#145339"
    accent_color = styling.get("accentColor") or "#E7C26B"
    text_color = styling.get("textColor") or "#FFFFFF"
    spacing_scale = float(styling.get("spacingScale") or 1.0)
    clean_sample_text = bool(styling.get("cleanSampleText", True))

    text_rgb = _hex_to_rgb(text_color, (255, 255, 255))
    accent_rgb = _hex_to_rgb(accent_color, (231, 194, 107))

    s1_path = ASSETS_DIR / "s1.jpeg"
    s2_path = ASSETS_DIR / "s2.jpeg"

    if template_id == "pakistani-emerald-mehndi-multipart" and s1_path.exists() and s2_path.exists():
        p1_bg = _fit_and_clean_multipart_image(
            s1_path,
            patch_box=(0.24, 0.21, 0.77, 0.69),
            sample_point=(0.50, 0.45),
            clean_sample_text=clean_sample_text,
        )
        p2_bg = _fit_and_clean_multipart_image(
            s2_path,
            patch_box=(0.27, 0.12, 0.75, 0.72),
            sample_point=(0.55, 0.35),
            clean_sample_text=clean_sample_text,
        )
    else:
        p1_bg = _create_luxury_card_backdrop(primary_color, accent_color)
        p2_bg = _create_luxury_card_backdrop(primary_color, accent_color)

    card = payload.get("card") or {}
    part1_items = [
        {"text": card.get("invocation", "IN THE NAME OF ALLAH · THE MOST MERCIFUL"), "y_rel": -0.23, "size": 26, "accent": True, "start": 0.4, "type_dur": 1.1, "wrap": 40},
        {"text": card.get("hostLine1", "Mr. & Mrs. Jalal Din (Late)"), "y_rel": -0.15, "size": 44, "bold": True, "start": 1.3, "type_dur": 1.4},
        {"text": card.get("relationLine1", "Request the pleasure of your company at the Wedding of their Beloved Nephew"), "y_rel": -0.08, "size": 30, "start": 2.6, "type_dur": 1.6, "wrap": 34},
        {"text": card.get("hostLine2", "Mr. & Mrs. M Amjad Rana"), "y_rel": 0.01, "size": 44, "bold": True, "accent": True, "start": 4.0, "type_dur": 1.3},
        {"text": card.get("relationLine2", "Cordially invite you to the Wedding Ceremony of their Beloved Daughter"), "y_rel": 0.08, "size": 30, "start": 5.1, "type_dur": 1.5, "wrap": 34},
        {"text": f"{card.get('groomName', 'Hamza')}  &  {card.get('brideName', 'Ayesha')}", "y_rel": 0.145, "size": 48, "style": "script", "accent": True, "start": 6.2, "type_dur": 1.3},
        {"text": f"{card.get('specialTitle', 'Special Invitees')}: {card.get('specialNames', 'Ammal Fatima, Mehroosh')}", "y_rel": 0.215, "size": 28, "start": 7.2, "type_dur": 1.4, "wrap": 36, "box_border": True},
    ]

    part2_items = [
        {"text": card.get("part2Blessing", "In Sha Allah"), "y_rel": -0.26, "size": 36, "accent": True, "style": "serif", "bold": True, "start": 0.5, "type_dur": 0.9},
        {"text": card.get("part2Intro", "JOIN US FOR A JOYFUL EVENING OF"), "y_rel": -0.20, "size": 24, "start": 1.2, "type_dur": 1.1, "wrap": 40},
        {"text": card.get("eventTitle", "Mehndi"), "y_rel": -0.14, "size": 76, "style": "script", "accent": True, "start": 2.0, "type_dur": 1.1},
        {"text": card.get("eventSubtitle", '"Rasm-e-Hina" Celebration'), "y_rel": -0.075, "size": 32, "start": 3.0, "type_dur": 1.1},
        {"text": f"Programme  ·  {card.get('weddingDate', 'Thursday 26 November 2026')}", "y_rel": -0.005, "size": 34, "bold": True, "accent": True, "start": 3.9, "type_dur": 1.4, "wrap": 36},
        {"text": card.get("timing1", "Mehndi ..................... 6:00 PM"), "y_rel": 0.055, "size": 31, "start": 5.1, "type_dur": 1.0},
        {"text": card.get("timing2", "Dinner ..................... 7:00 PM"), "y_rel": 0.10, "size": 31, "start": 5.9, "type_dur": 1.0},
        {"text": card.get("venueName", "RAUF MARQUI"), "y_rel": 0.175, "size": 40, "bold": True, "accent": True, "start": 6.7, "type_dur": 1.0},
        {"text": card.get("venueAddress", "Mughalpura Road, Baja Line, Near Railway Power House, Lahore"), "y_rel": 0.235, "size": 27, "start": 7.5, "type_dur": 1.4, "wrap": 36},
    ]

    clip1 = VideoClip(
        lambda t: _draw_typewriter_lines(p1_bg, part1_items, t, text_rgb, accent_rgb, spacing_scale),
        duration=part1_dur,
    )
    clip2 = VideoClip(
        lambda t: _draw_typewriter_lines(p2_bg, part2_items, t, text_rgb, accent_rgb, spacing_scale),
        duration=part2_dur,
    ).crossfadein(crossfade_dur)

    final_clip = concatenate_videoclips([clip1, clip2], padding=-crossfade_dur, method="compose")
    out_name = f"wcg_{template_id}_{int(os.times().elapsed * 100)}.mp4"
    out_path = OUTPUT_DIR / out_name

    final_clip.write_videofile(
        str(out_path),
        fps=24,
        codec="libx264",
        audio=False,
        preset="medium",
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        logger=None,
    )
    return out_path
