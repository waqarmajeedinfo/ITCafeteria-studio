# WCG (Wedding Card Generator) — Python FastAPI + MoviePy Backend

## Folder & Assets Structure
```text
backend_wcg/
├── main.py              # FastAPI server (/render, /download/{filename}, /health)
├── renderer.py          # Pillow + MoviePy 9:16 (1080x1920) multi-part typewriter renderer
├── requirements.txt     # Python packages for OnRender
└── assets/
    ├── s1.jpeg          # Multi-part Template Part 1 (Host Invitation & Family Intro)
    ├── s2.jpeg          # Multi-part Template Part 2 (Event Title, Programme & Venue)
    └── fonts/           # Optional custom .ttf fonts (Cinzel, Cormorant Garamond, Great Vibes)
```

## OnRender Deployment Instructions
1. Create a **New Web Service** on Render linked to this repository.
2. Set **Root Directory** to `backend_wcg`.
3. Set **Environment** to `Python 3`.
4. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Start Command**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Copy your Render service URL (e.g. `https://itcafeteria-wcg-python.onrender.com`) and set it as `WCG_PYTHON_URL` in the main `itcafeteria-studio` Node service environment variables so `/api/wcg/render` delegates directly to MoviePy + Pillow.
   *(If `WCG_PYTHON_URL` is omitted, the Node Express server automatically uses its built-in FFmpeg + LibASS 9:16 multi-part renderer so video generation stays 100% live.)*
