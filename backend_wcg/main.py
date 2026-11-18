import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from renderer import (
    ASSETS_DIR,
    CUSTOM_MUSIC_DIR,
    CUSTOM_TEMPLATES_DIR,
    OUTPUT_DIR,
    render_wedding_card_video,
)

app = FastAPI(
    title="IT Cafeteria WCG Python Renderer",
    version="1.1.0",
    description="MoviePy + Pillow 9:16 multi-part wedding card video generator with persistent upload library",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LIBRARY_MANIFEST = ASSETS_DIR / "library.json"


def _load_manifest() -> Dict[str, List[Dict[str, Any]]]:
    if not LIBRARY_MANIFEST.exists():
        return {"templates": [], "songs": []}
    try:
        data = json.loads(LIBRARY_MANIFEST.read_text(encoding="utf-8"))
        return {
            "templates": list(data.get("templates") or []),
            "songs": list(data.get("songs") or []),
        }
    except Exception:
        return {"templates": [], "songs": []}


def _save_manifest(manifest: Dict[str, List[Dict[str, Any]]]) -> None:
    LIBRARY_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    LIBRARY_MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


class CardDetails(BaseModel):
    invocation: str = "IN THE NAME OF ALLAH · THE MOST MERCIFUL"
    hostLine1: str = "Mr. & Mrs. Jalal Din (Late)"
    relationLine1: str = "Request the pleasure of your company at the Wedding Ceremony of their Beloved Nephew"
    hostLine2: str = "Mr. & Mrs. M Amjad Rana"
    relationLine2: str = "Invite you to celebrate the Wedding Ceremony of their Beloved Daughter"
    groomName: str = "Hamza"
    brideName: str = "Ayesha"
    specialTitle: str = "Special Kidz"
    specialNames: str = "Ammal Fatima, Mehroosh"
    part2Blessing: str = "In Sha Allah"
    part2Intro: str = "JOIN US FOR A JOYFUL EVENING OF"
    eventTitle: str = "Mehndi"
    eventSubtitle: str = '"Rasm-e-Hina"'
    weddingDate: str = "Thursday 26 November 2026"
    timing1: str = "Mehndi .................... 6:00 PM"
    timing2: str = "Dinner .................... 7:00 PM"
    venueName: str = "RAUF MARQUI"
    venueAddress: str = "Mughalpura Road, Baja Line, Near Railway Power House, Lahore"
    func1Title: str = "Mehndi"
    func1Subtitle: str = '"Rasm-e-Hina" & Dholki Night'
    func1Date: str = "Friday 27 November 2026"
    func1Timing: str = "Mehndi 6:30 PM  ·  Dinner 8:00 PM"
    func1Venue: str = "RAUF MARQUI · Mughalpura Road, Lahore"
    func2Title: str = "Barat"
    func2Subtitle: str = "Istiqbal-e-Barat & Rukhsati"
    func2Date: str = "Saturday 28 November 2026"
    func2Timing: str = "Barat 7:30 PM  ·  Dinner 9:00 PM"
    func2Venue: str = "ROYAL PALM MARQUEE · Canal Road, Lahore"
    func3Title: str = "Walima"
    func3Subtitle: str = "Sunnat-e-Walima Reception"
    func3Date: str = "Sunday 29 November 2026"
    func3Timing: str = "Arrival 1:30 PM  ·  Lunch 2:30 PM"
    func3Venue: str = "PEARL CONTINENTAL · Mall Road, Lahore"


class StylingConfig(BaseModel):
    primaryColor: str = "#145339"
    accentColor: str = "#E7C26B"
    textColor: str = "#FFFFFF"
    displayFont: str = "Cormorant Garamond"
    scriptFont: str = "Great Vibes"
    spacingScale: float = 1.0
    transitionStyle: str = "crossfade"
    cleanSampleText: bool = True


class RenderRequest(BaseModel):
    templateId: str = "pakistani-emerald-mehndi-multipart"
    partCount: int = Field(default=2, ge=1, le=3)
    durationSeconds: float = Field(default=19.0, ge=16.0, le=22.0)
    quality: str = "1080p"
    musicId: str = "mehndi-laga-ke-rakhna"
    musicVolume: float = Field(default=0.78, ge=0.0, le=1.0)
    card: CardDetails
    styling: StylingConfig = StylingConfig()


@app.get("/health")
def health() -> Dict[str, Any]:
    manifest = _load_manifest()
    return {
        "ok": True,
        "service": "wcg-python-moviepy",
        "s1_present": (ASSETS_DIR / "s1.jpeg").exists(),
        "s2_present": (ASSETS_DIR / "s2.jpeg").exists(),
        "custom_templates": len(manifest["templates"]),
        "custom_songs": len(manifest["songs"]),
    }


@app.get("/library")
def get_library() -> Dict[str, Any]:
    return {"ok": True, **_load_manifest()}


@app.post("/upload/template")
async def upload_template(
    name: str = Form("Custom Wedding Card"),
    category: str = Form("Mehndi"),
    part1: UploadFile = File(...),
    part2: Optional[UploadFile] = File(None),
    part3: Optional[UploadFile] = File(None),
) -> Dict[str, Any]:
    CUSTOM_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    ext1 = Path(part1.filename or "card.jpg").suffix.lower() or ".jpg"
    if ext1 not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Unsupported image format (use JPG/PNG/WebP)")

    tpl_id = f"custom_tpl_{int(time.time() * 1000)}"
    f1_name = f"{tpl_id}_p1{ext1}"
    f1_bytes = await part1.read()
    (CUSTOM_TEMPLATES_DIR / f1_name).write_bytes(f1_bytes)

    f2_name: Optional[str] = None
    if part2 is not None and part2.filename:
        ext2 = Path(part2.filename).suffix.lower() or ".jpg"
        if ext2 in {".jpg", ".jpeg", ".png", ".webp"}:
            f2_name = f"{tpl_id}_p2{ext2}"
            (CUSTOM_TEMPLATES_DIR / f2_name).write_bytes(await part2.read())

    f3_name: Optional[str] = None
    if part3 is not None and part3.filename:
        ext3 = Path(part3.filename).suffix.lower() or ".jpg"
        if ext3 in {".jpg", ".jpeg", ".png", ".webp"}:
            f3_name = f"{tpl_id}_p3{ext3}"
            (CUSTOM_TEMPLATES_DIR / f3_name).write_bytes(await part3.read())

    part_count = 3 if f3_name else (2 if f2_name else 1)
    item = {
        "id": tpl_id,
        "name": name.strip() or tpl_id,
        "category": category if category in {"Mehndi", "Barat", "Walima", "Nikah"} else "Mehndi",
        "partCount": part_count,
        "part1Filename": f1_name,
        "part2Filename": f2_name,
        "part3Filename": f3_name,
        "part1Url": f"/assets/custom_templates/{f1_name}",
        "part2Url": f"/assets/custom_templates/{f2_name}" if f2_name else None,
        "part3Url": f"/assets/custom_templates/{f3_name}" if f3_name else None,
    }
    manifest = _load_manifest()
    manifest["templates"].insert(0, item)
    _save_manifest(manifest)
    return {"ok": True, "template": item}


@app.post("/upload/song")
async def upload_song(
    title: str = Form("Custom Wedding Track"),
    category: str = Form("Custom"),
    audio: UploadFile = File(...),
) -> Dict[str, Any]:
    CUSTOM_MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(audio.filename or "song.mp3").suffix.lower() or ".mp3"
    if ext not in {".mp3", ".wav", ".m4a", ".ogg"}:
        raise HTTPException(status_code=400, detail="Unsupported audio format (use MP3/WAV/M4A)")

    song_id = f"custom_song_{int(time.time() * 1000)}"
    fname = f"{song_id}{ext}"
    (CUSTOM_MUSIC_DIR / fname).write_bytes(await audio.read())

    item = {
        "id": song_id,
        "title": title.strip() or fname,
        "category": category,
        "filename": fname,
        "audioUrl": f"/assets/custom_music/{fname}",
    }
    manifest = _load_manifest()
    manifest["songs"].insert(0, item)
    _save_manifest(manifest)
    return {"ok": True, "song": item}


@app.get("/assets/{kind}/{filename}")
def get_saved_asset(kind: str, filename: str):
    if kind not in {"custom_templates", "custom_music"}:
        raise HTTPException(status_code=400, detail="Invalid asset folder")
    safe_name = os.path.basename(filename)
    file_path = ASSETS_DIR / kind / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(path=str(file_path))


@app.post("/render")
def render_card(request: RenderRequest) -> Dict[str, Any]:
    try:
        out_path = render_wedding_card_video(request.model_dump())
        return {
            "ok": True,
            "filename": out_path.name,
            "downloadPath": f"/download/{out_path.name}",
            "durationSeconds": request.durationSeconds,
            "resolution": "720x1280" if request.quality == "720p" else "1080x1920",
            "engine": "python-moviepy-pillow",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Video render failed: {exc}") from exc


@app.get("/download/{filename}")
def download_video(filename: str):
    safe_name = os.path.basename(filename)
    file_path = OUTPUT_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Rendered video not found")
    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
        filename=safe_name,
    )
