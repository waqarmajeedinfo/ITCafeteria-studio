import os
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from renderer import ASSETS_DIR, OUTPUT_DIR, render_wedding_card_video

app = FastAPI(
    title="IT Cafeteria WCG Python Renderer",
    version="1.0.0",
    description="MoviePy + Pillow 9:16 multi-part wedding card video generator",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    durationSeconds: float = Field(default=19.0, ge=16.0, le=22.0)
    card: CardDetails
    styling: StylingConfig = StylingConfig()


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "wcg-python-moviepy",
        "s1_present": (ASSETS_DIR / "s1.jpeg").exists(),
        "s2_present": (ASSETS_DIR / "s2.jpeg").exists(),
    }


@app.post("/render")
def render_card(request: RenderRequest) -> Dict[str, Any]:
    try:
        out_path = render_wedding_card_video(request.model_dump())
        return {
            "ok": True,
            "filename": out_path.name,
            "downloadPath": f"/download/{out_path.name}",
            "durationSeconds": request.durationSeconds,
            "resolution": "1080x1920",
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
