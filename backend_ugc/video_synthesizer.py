import base64
import io
import math
import os
import shutil
import subprocess
import tempfile
import textwrap
import wave
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

RESAMPLE_LANCZOS = getattr(getattr(Image, "Resampling", Image), "LANCZOS")
RESAMPLE_BILINEAR = getattr(getattr(Image, "Resampling", Image), "BILINEAR")

APP_ROOT = Path(__file__).resolve().parent.parent
BUNDLED_FONTS_DIR = APP_ROOT / "backend_wcg" / "assets" / "fonts"
SYSTEM_FONTS_DIR = Path("/usr/share/fonts/truetype/dejavu")


def resolve_ffmpeg(explicit_path: Optional[str] = None) -> str:
    candidates = [
        explicit_path or "",
        os.environ.get("FFMPEG_PATH", ""),
        "/usr/bin/ffmpeg",
        shutil.which("ffmpeg") or "",
    ]
    for cand in candidates:
        c = cand.strip()
        if c and os.path.exists(c):
            return c
    raise RuntimeError("FFmpeg binary Python companion environment mein available nahi hai.")


def hex_to_rgb(hex_str: str, fallback: Tuple[int, int, int] = (16, 185, 129)) -> Tuple[int, int, int]:
    cleaned = str(hex_str or "").strip().lstrip("#")
    if len(cleaned) == 3:
        cleaned = "".join(ch * 2 for ch in cleaned)
    if len(cleaned) != 6:
        return fallback
    try:
        return (int(cleaned[0:2], 16), int(cleaned[2:4], 16), int(cleaned[4:6], 16))
    except ValueError:
        return fallback


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = (
        [
            str(SYSTEM_FONTS_DIR / "DejaVuSans-Bold.ttf"),
            str(BUNDLED_FONTS_DIR / "Cinzel-Bold.ttf"),
            str(SYSTEM_FONTS_DIR / "DejaVuSerif-Bold.ttf"),
        ]
        if bold
        else [
            str(SYSTEM_FONTS_DIR / "DejaVuSans.ttf"),
            str(BUNDLED_FONTS_DIR / "CormorantGaramond-SemiBold.ttf"),
            str(SYSTEM_FONTS_DIR / "DejaVuSerif.ttf"),
        ]
    )
    for fp in candidates:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size=max(12, int(size)))
            except OSError:
                continue
    return ImageFont.load_default()


def decode_data_url_to_image(data_url: str) -> Optional[Image.Image]:
    if not data_url:
        return None
    raw = str(data_url).strip()
    if "," in raw and raw.startswith("data:"):
        _, b64 = raw.split(",", 1)
    else:
        b64 = raw
    try:
        img_bytes = base64.b64decode(b64)
        img = Image.open(io.BytesIO(img_bytes))
        return img.convert("RGBA")
    except Exception:
        return None


def get_canvas_size(aspect_ratio: str) -> Tuple[int, int]:
    if aspect_ratio == "16:9":
        return (1280, 720)
    if aspect_ratio == "1:1":
        return (1080, 1080)
    return (1080, 1920)


def fit_cover(img: Image.Image, target_w: int, target_h: int, anchor_y: float = 0.5) -> Image.Image:
    sw, sh = img.size
    if sw <= 0 or sh <= 0:
        return Image.new("RGBA", (target_w, target_h), (15, 23, 42, 255))
    scale = max(target_w / sw, target_h / sh)
    nw = max(target_w, int(round(sw * scale)))
    nh = max(target_h, int(round(sh * scale)))
    resized = img.resize((nw, nh), RESAMPLE_LANCZOS)
    left = max(0, (nw - target_w) // 2)
    top = max(0, min(nh - target_h, int(round((nh - target_h) * anchor_y))))
    return resized.crop((left, top, left + target_w, top + target_h))


def fit_contain(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    sw, sh = img.size
    if sw <= 0 or sh <= 0:
        return Image.new("RGBA", (max_w, max_h), (255, 255, 255, 0))
    scale = min(max_w / sw, max_h / sh)
    nw = max(2, int(round(sw * scale)))
    nh = max(2, int(round(sh * scale)))
    return img.resize((nw, nh), RESAMPLE_LANCZOS)


def build_ambient_backdrop(img: Image.Image, w: int, h: int, tint_rgb: Tuple[int, int, int]) -> Image.Image:
    bg = fit_cover(img, w, h, anchor_y=0.45).convert("RGB")
    bg = bg.filter(ImageFilter.GaussianBlur(radius=32))
    bg = ImageEnhance.Brightness(bg).enhance(0.55)
    tint_layer = Image.new("RGB", (w, h), tint_rgb)
    blended = Image.blend(bg, tint_layer, alpha=0.18)
    return blended.convert("RGBA")


def build_product_card(product_img: Image.Image, card_w: int, card_h: int, accent_rgb: Tuple[int, int, int]) -> Image.Image:
    card = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 242))
    inner = fit_contain(product_img, int(card_w * 0.88), int(card_h * 0.88))
    ix = (card_w - inner.width) // 2
    iy = (card_h - inner.height) // 2
    card.alpha_composite(inner, (ix, iy))
    draw = ImageDraw.Draw(card, "RGBA")
    draw.rectangle([0, 0, card_w - 1, card_h - 1], outline=(*accent_rgb, 180), width=4)
    return card


def draw_text_overlay(
    canvas: Image.Image,
    hook_text: str,
    voiceover_text: str,
    brand_label: str,
    caption_mode: str,
    accent_rgb: Tuple[int, int, int],
    scene_progress: float,
    is_final_scene: bool = False,
) -> Image.Image:
    if caption_mode == "no_text":
        return canvas

    w, h = canvas.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    # Fade alpha gently at start/end of scene
    alpha_mult = min(1.0, scene_progress / 0.12) if scene_progress < 0.12 else 1.0
    a_fill = int(235 * alpha_mult)
    a_box = int(205 * alpha_mult)

    hook_font = load_font(int(h * (0.032 if caption_mode == "bold_hook" else 0.025)), bold=True)
    sub_font = load_font(int(h * 0.023), bold=True)
    brand_font = load_font(int(h * 0.018), bold=True)

    # 1. Top On-Screen Hook Badge
    hook_clean = " ".join(str(hook_text or "").split()).strip()
    if hook_clean:
        max_chars = 36 if w >= 1200 else 24
        lines = textwrap.wrap(hook_clean, width=max_chars)[:2]
        line_h = int(hook_font.size * 1.28)
        block_h = line_h * len(lines) + 26
        max_tw = max(draw.textbbox((0, 0), ln, font=hook_font)[2] for ln in lines)
        box_w = min(w - 64, max_tw + 52)
        bx0 = (w - box_w) // 2
        by0 = int(h * 0.075)
        draw.rounded_rectangle(
            [bx0, by0, bx0 + box_w, by0 + block_h],
            radius=12,
            fill=(15, 23, 42, a_box),
            outline=(*accent_rgb, a_fill),
            width=3,
        )
        for idx, ln in enumerate(lines):
            tw = draw.textbbox((0, 0), ln, font=hook_font)[2]
            tx = (w - tw) // 2
            ty = by0 + 13 + idx * line_h
            draw.text((tx, ty), ln, font=hook_font, fill=(255, 255, 255, a_fill))

    # 2. Spoken Voiceover Subtitle Pill (Bottom Safe Zone)
    vo_clean = " ".join(str(voiceover_text or "").split()).strip()
    if vo_clean:
        max_chars = 44 if w >= 1200 else 30
        lines = textwrap.wrap(vo_clean, width=max_chars)[:3]
        line_h = int(sub_font.size * 1.3)
        block_h = line_h * len(lines) + 22
        max_tw = max(draw.textbbox((0, 0), ln, font=sub_font)[2] for ln in lines)
        box_w = min(w - 64, max_tw + 44)
        bx0 = (w - box_w) // 2
        by0 = int(h * 0.77)
        draw.rounded_rectangle(
            [bx0, by0, bx0 + box_w, by0 + block_h],
            radius=10,
            fill=(9, 13, 22, int(215 * alpha_mult)),
        )
        for idx, ln in enumerate(lines):
            tw = draw.textbbox((0, 0), ln, font=sub_font)[2]
            tx = (w - tw) // 2
            ty = by0 + 11 + idx * line_h
            draw.text((tx, ty), ln, font=sub_font, fill=(248, 250, 252, a_fill))

    # 3. Bottom Brand / CTA Strip
    brand_clean = str(brand_label or "").strip().upper()
    if brand_clean:
        tw = draw.textbbox((0, 0), brand_clean, font=brand_font)[2]
        pad_x = 30
        box_w = min(w - 64, tw + pad_x * 2)
        box_h = int(brand_font.size * 1.9)
        bx0 = (w - box_w) // 2
        by0 = int(h * 0.90)
        bg_col = (*accent_rgb, int(240 * alpha_mult)) if is_final_scene else (255, 255, 255, int(235 * alpha_mult))
        fg_col = (255, 255, 255, 255) if is_final_scene else (15, 23, 42, 255)
        draw.rounded_rectangle([bx0, by0, bx0 + box_w, by0 + box_h], radius=8, fill=bg_col)
        tx = (w - tw) // 2
        ty = by0 + (box_h - brand_font.size) // 2 - 2
        draw.text((tx, ty), brand_clean, font=brand_font, fill=fg_col)

    out = canvas.copy()
    out.alpha_composite(overlay)
    return out


def render_scene_frame(
    scene: Dict[str, Any],
    scene_idx: int,
    total_scenes: int,
    progress: float,
    w: int,
    h: int,
    product_img: Image.Image,
    model_img: Image.Image,
    has_separate_model: bool,
    primary_rgb: Tuple[int, int, int],
    accent_rgb: Tuple[int, int, int],
    caption_mode: str,
    brand_name: str,
    cta_text: str,
    cached_assets: Dict[str, Any],
) -> np.ndarray:
    focus = str(scene.get("visualFocus") or "product_hero")
    is_final = scene_idx == total_scenes - 1
    eased = 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, progress)))

    if focus == "model_avatar" and has_separate_model:
        base_cover = cached_assets.get("model_over")
        if base_cover is None:
            over_w = int(round(w * 1.12))
            over_h = int(round(h * 1.12))
            base_cover = fit_cover(model_img, over_w, over_h, anchor_y=0.35)
            cached_assets["model_over"] = base_cover
        ow, oh = base_cover.size
        zoom = 1.0 + 0.06 * eased
        crop_w = max(2, int(round(w / zoom)))
        crop_h = max(2, int(round(h / zoom)))
        pan_x = int(round((ow - crop_w) * (0.5 + 0.14 * math.sin(progress * math.pi))))
        pan_y = int(round((oh - crop_h) * (0.35 + 0.12 * eased)))
        pan_x = max(0, min(ow - crop_w, pan_x))
        pan_y = max(0, min(oh - crop_h, pan_y))
        canvas = base_cover.crop((pan_x, pan_y, pan_x + crop_w, pan_y + crop_h)).resize((w, h), RESAMPLE_BILINEAR)

    elif focus == "split_model_product" and has_separate_model:
        bg = cached_assets.get("bg_model")
        if bg is None:
            bg = build_ambient_backdrop(model_img, w, h, primary_rgb)
            cached_assets["bg_model"] = bg
        canvas = bg.copy()
        is_wide = w > h
        if is_wide:
            mw, mh = int(w * 0.52), int(h * 0.78)
            pw, ph = int(w * 0.36), int(h * 0.68)
            mx, my = int(w * 0.05), (h - mh) // 2
            px, py = int(w * 0.59), (h - ph) // 2
        else:
            mw, mh = int(w * 0.88), int(h * 0.44)
            pw, ph = int(w * 0.68), int(h * 0.28)
            mx, my = (w - mw) // 2, int(h * 0.15)
            px, py = (w - pw) // 2, int(h * 0.50)

        mod_panel = cached_assets.get("split_mod")
        if mod_panel is None:
            mod_panel = fit_cover(model_img, mw, mh, anchor_y=0.32)
            cached_assets["split_mod"] = mod_panel
        prod_card = cached_assets.get("split_prod")
        if prod_card is None:
            prod_card = build_product_card(product_img, pw, ph, accent_rgb)
            cached_assets["split_prod"] = prod_card

        slide_offset = int(round((1.0 - eased) * 28))
        canvas.alpha_composite(mod_panel, (mx, my - slide_offset // 2))
        canvas.alpha_composite(prod_card, (px, py + slide_offset))

    elif focus == "product_macro":
        macro_src = cached_assets.get("macro_src")
        if macro_src is None:
            macro_src = fit_cover(product_img, int(w * 1.42), int(h * 1.42), anchor_y=0.5)
            cached_assets["macro_src"] = macro_src
        ow, oh = macro_src.size
        pan_x = int(round((ow - w) * (0.30 + 0.40 * eased)))
        pan_y = int(round((oh - h) * (0.45 + 0.12 * math.sin(progress * math.pi))))
        pan_x = max(0, min(ow - w, pan_x))
        pan_y = max(0, min(oh - h, pan_y))
        canvas = macro_src.crop((pan_x, pan_y, pan_x + w, pan_y + h))

    else:
        # product_hero or reveal_lockup
        bg = cached_assets.get("bg_prod")
        if bg is None:
            bg = build_ambient_backdrop(product_img, w, h, primary_rgb)
            cached_assets["bg_prod"] = bg
        canvas = bg.copy()
        card_w = int(w * (0.76 if w <= h else 0.52))
        card_h = int(h * (0.52 if w <= h else 0.66))
        prod_card = cached_assets.get("hero_card")
        if prod_card is None:
            prod_card = build_product_card(product_img, card_w, card_h, accent_rgb)
            cached_assets["hero_card"] = prod_card
        scale = (1.03 - 0.04 * eased) if focus == "reveal_lockup" else (0.96 + 0.06 * eased)
        sw = max(2, int(round(card_w * scale)))
        sh = max(2, int(round(card_h * scale)))
        scaled_card = prod_card.resize((sw, sh), RESAMPLE_BILINEAR)
        canvas.alpha_composite(scaled_card, ((w - sw) // 2, (h - sh) // 2))

    label_bottom = cta_text if is_final else brand_name
    composited = draw_text_overlay(
        canvas=canvas,
        hook_text=str(scene.get("onScreenHook") or scene.get("title") or ""),
        voiceover_text=str(scene.get("voiceoverLine") or ""),
        brand_label=label_bottom,
        caption_mode=caption_mode,
        accent_rgb=accent_rgb,
        scene_progress=progress,
        is_final_scene=is_final,
    )
    return np.asarray(composited.convert("RGB"), dtype=np.uint8)


def synthesize_audio_bed_wav(out_wav_path: Path, duration_sec: float, mood: str) -> None:
    sr = 44100
    n_samples = max(sr, int(round(duration_sec * sr)))
    t = np.linspace(0.0, duration_sec, n_samples, endpoint=False, dtype=np.float32)

    if mood == "none":
        stereo = np.zeros((n_samples, 2), dtype=np.int16)
    else:
        if mood == "luxury_minimal":
            f1, f2, pulse_hz = 146.83, 220.00, 1.25
        elif mood == "kinetic_bass":
            f1, f2, pulse_hz = 110.00, 164.81, 3.20
        else:
            f1, f2, pulse_hz = 196.00, 293.66, 2.40

        envelope = 0.65 + 0.35 * np.sin(2.0 * math.pi * pulse_hz * t)
        wave_l = (0.045 * np.sin(2.0 * math.pi * f1 * t) + 0.025 * np.sin(2.0 * math.pi * f2 * t)) * envelope
        wave_r = (0.045 * np.sin(2.0 * math.pi * f1 * t + 0.25) + 0.025 * np.sin(2.0 * math.pi * (f2 * 1.002) * t)) * envelope

        fade_len = min(n_samples // 4, int(0.45 * sr))
        if fade_len > 0:
            ramp_in = np.linspace(0.0, 1.0, fade_len, dtype=np.float32)
            ramp_out = np.linspace(1.0, 0.0, fade_len, dtype=np.float32)
            wave_l[:fade_len] *= ramp_in
            wave_r[:fade_len] *= ramp_in
            wave_l[-fade_len:] *= ramp_out
            wave_r[-fade_len:] *= ramp_out

        interleaved = np.stack([wave_l, wave_r], axis=1)
        stereo = np.clip(interleaved * 32767.0, -32767, 32767).astype(np.int16)

    with wave.open(str(out_wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())


def synthesize_ugc_commercial_mp4(payload: Dict[str, Any], output_mp4_path: Path) -> Dict[str, Any]:
    ffmpeg_bin = resolve_ffmpeg(payload.get("ffmpegPath"))
    storyboard = payload.get("storyboard") or {}
    settings = payload.get("settings") or {}
    product_analysis = payload.get("productAnalysis") or {}
    scenes: List[Dict[str, Any]] = list(storyboard.get("scenes") or [])
    if not scenes:
        raise ValueError("Storyboard scenes missing for Python MP4 synthesis.")

    aspect_ratio = str(storyboard.get("aspectRatio") or settings.get("aspectRatio") or "9:16")
    w, h = get_canvas_size(aspect_ratio)
    fps = 24

    product_img = decode_data_url_to_image(str(payload.get("productImageDataUrl") or ""))
    model_img = decode_data_url_to_image(str(payload.get("modelImageDataUrl") or ""))
    if product_img is None and model_img is None:
        raise ValueError("Kam az kam Product ya Model image provide karein.")

    has_separate_model = product_img is not None and model_img is not None
    if product_img is None:
        product_img = model_img
    if model_img is None:
        model_img = product_img
    assert product_img is not None and model_img is not None

    palette = product_analysis.get("colorPalette") or ["#0F172A", "#10B981"]
    primary_rgb = hex_to_rgb(palette[0] if len(palette) > 0 else "#0F172A", (15, 23, 42))
    accent_rgb = hex_to_rgb(palette[1] if len(palette) > 1 else palette[0], (16, 185, 129))

    caption_mode = str(settings.get("captionMode") or "bold_hook")
    brand_name = str(settings.get("brandName") or product_analysis.get("brandName") or "BRAND CAMPAIGN").strip()
    cta_text = str(settings.get("callToAction") or brand_name).strip()
    audio_mood = str(settings.get("audioBedMood") or "upbeat_ugc")

    voiceover_clips: List[Dict[str, Any]] = []
    for vo in list(payload.get("voiceoverClips") or []):
        if vo and vo.get("wavBase64"):
            voiceover_clips.append(vo)

    with tempfile.TemporaryDirectory(prefix="py_ugc_") as tmp_str:
        tmp_dir = Path(tmp_str)
        raw_video_mp4 = tmp_dir / "python_video_silent.mp4"
        bed_wav = tmp_dir / "bed.wav"

        # 1. Pipe NumPy + Pillow synthesized RGB frames straight into FFmpeg H.264 encoder
        ff_vid_cmd = [
            ffmpeg_bin,
            "-y",
            "-loglevel",
            "error",
            "-f",
            "rawvideo",
            "-vcodec",
            "rawvideo",
            "-s",
            f"{w}x{h}",
            "-pix_fmt",
            "rgb24",
            "-r",
            str(fps),
            "-i",
            "pipe:0",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(raw_video_mp4),
        ]

        proc = subprocess.Popen(
            ff_vid_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        assert proc.stdin is not None

        cached_assets: Dict[str, Any] = {}
        crossfade_frames = 6 if len(scenes) > 1 else 0
        total_frames_written = 0
        prev_tail_frames: List[np.ndarray] = []

        scene_start_cursor = 0.0
        try:
            for s_idx, sc in enumerate(scenes):
                dur = max(1.5, float(sc.get("durationSec") or 3.0))
                n_frames = max(fps, int(round(dur * fps)))
                scene_frames: List[np.ndarray] = []

                for f_i in range(n_frames):
                    prog = f_i / max(1, n_frames - 1)
                    arr = render_scene_frame(
                        scene=sc,
                        scene_idx=s_idx,
                        total_scenes=len(scenes),
                        progress=prog,
                        w=w,
                        h=h,
                        product_img=product_img,
                        model_img=model_img,
                        has_separate_model=has_separate_model,
                        primary_rgb=primary_rgb,
                        accent_rgb=accent_rgb,
                        caption_mode=caption_mode,
                        brand_name=brand_name,
                        cta_text=cta_text,
                        cached_assets=cached_assets,
                    )
                    scene_frames.append(arr)

                # Blend crossfade overlap with previous scene tail frames cleanly in NumPy
                if s_idx > 0 and crossfade_frames > 0 and len(prev_tail_frames) == crossfade_frames:
                    for k in range(crossfade_frames):
                        alpha = (k + 1) / float(crossfade_frames + 1)
                        blended = (
                            prev_tail_frames[k].astype(np.float32) * (1.0 - alpha)
                            + scene_frames[k].astype(np.float32) * alpha
                        ).astype(np.uint8)
                        proc.stdin.write(blended.tobytes())
                        total_frames_written += 1
                    start_idx = crossfade_frames
                else:
                    start_idx = 0

                if s_idx < len(scenes) - 1 and crossfade_frames > 0:
                    end_idx = len(scene_frames) - crossfade_frames
                    prev_tail_frames = scene_frames[end_idx:]
                else:
                    end_idx = len(scene_frames)
                    prev_tail_frames = []

                for k in range(start_idx, end_idx):
                    proc.stdin.write(scene_frames[k].tobytes())
                    total_frames_written += 1

                scene_start_cursor += dur

            proc.stdin.flush()
            proc.stdin.close()
            proc.stdin = None
        except Exception:
            proc.kill()
            raise

        _, stderr_bytes = proc.communicate(timeout=180)
        if proc.returncode != 0:
            tail_err = stderr_bytes.decode("utf-8", errors="ignore")[-1200:]
            raise RuntimeError(f"Python FFmpeg frame synthesis failed: {tail_err}")

        actual_duration_sec = total_frames_written / float(fps)

        # 2. Synthesize audio bed in NumPy + mix optional TTS voiceover WAVs into final AAC MP4
        synthesize_audio_bed_wav(bed_wav, actual_duration_sec, audio_mood)

        mix_cmd: List[str] = [ffmpeg_bin, "-y", "-i", str(raw_video_mp4), "-i", str(bed_wav)]
        filter_parts: List[str] = []
        audio_inputs = ["[1:a]"]

        vo_count = 0
        for v_idx, vo in enumerate(voiceover_clips):
            wav_bytes = base64.b64decode(vo["wavBase64"])
            vo_path = tmp_dir / f"vo_{v_idx}.wav"
            vo_path.write_bytes(wav_bytes)
            mix_cmd.extend(["-i", str(vo_path)])
            in_idx = 2 + vo_count
            delay_ms = max(0, int(round(float(vo.get("startOffsetSec") or 0.0) * 1000)))
            lbl = f"vo{vo_count}"
            filter_parts.append(
                f"[{in_idx}:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.35,adelay={delay_ms}|{delay_ms}[{lbl}]"
            )
            audio_inputs.append(f"[{lbl}]")
            vo_count += 1

        if len(audio_inputs) == 1:
            filter_parts.append("[1:a]anull[aout]")
        else:
            filter_parts.append(
                f"{''.join(audio_inputs)}amix=inputs={len(audio_inputs)}:duration=longest:dropout_transition=0.2,dynaudnorm[aout]"
            )

        output_mp4_path.parent.mkdir(parents=True, exist_ok=True)
        mix_cmd.extend(
            [
                "-filter_complex",
                ";".join(filter_parts),
                "-map",
                "0:v",
                "-map",
                "[aout]",
                "-t",
                f"{actual_duration_sec:.2f}",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-ac",
                "2",
                "-ar",
                "44100",
                "-movflags",
                "+faststart",
                str(output_mp4_path),
            ]
        )

        mix_proc = subprocess.run(mix_cmd, capture_output=True, text=True, timeout=120)
        if mix_proc.returncode != 0:
            raise RuntimeError(f"Audio mux failed: {mix_proc.stderr[-1000:]}")

    return {
        "ok": True,
        "engine": "python-flask (Pillow + NumPy + FFmpeg) · External Video Gen Bypassed",
        "filename": output_mp4_path.name,
        "durationSec": round(actual_duration_sec, 1),
        "hasVoiceover": vo_count > 0,
        "voiceoverScenesRendered": vo_count,
        "externalVideoModelsBypassed": True,
    }
