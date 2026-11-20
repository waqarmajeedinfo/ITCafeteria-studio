import os
import shutil
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Dict

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from analyzer import analyze_model_vision, analyze_product_vision
from video_synthesizer import synthesize_ugc_commercial_mp4

app = Flask(__name__)
CORS(app)

APP_ROOT = Path(__file__).resolve().parent.parent
UGC_RENDERS_DIR = Path(os.environ.get("UGC_RENDERS_DIR", str(APP_ROOT / "data" / "ugc-renders")))
UGC_RENDERS_DIR.mkdir(parents=True, exist_ok=True)

PY_JOBS: Dict[str, Dict[str, Any]] = {}


def _check_libs() -> Dict[str, Any]:
    import numpy
    import PIL

    return {
        "flask": True,
        "pillow": getattr(PIL, "__version__", "installed"),
        "numpy": getattr(numpy, "__version__", "installed"),
        "ffmpeg": bool(shutil.which("ffmpeg") or os.path.exists("/usr/bin/ffmpeg")),
    }


@app.get("/health")
def health() -> Any:
    return jsonify(
        {
            "ok": True,
            "service": "itcafeteria-ugc-flask-companion",
            "mode": "python-direct-synthesis",
            "externalVideoModelsBypassed": True,
            "libraries": _check_libs(),
            "hasGeminiKey": bool((os.environ.get("GEMINI_API_KEY") or "").strip()),
        }
    )


@app.post("/analyze-product")
def route_analyze_product() -> Any:
    body: Dict[str, Any] = request.get_json(silent=True) or {}
    img = str(body.get("productImageDataUrl") or "")
    hint = str(body.get("brandHint") or "")
    try:
        result = analyze_product_vision(img, hint)
        return jsonify({"ok": True, "analysis": result})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400


@app.post("/analyze-model")
def route_analyze_model() -> Any:
    body: Dict[str, Any] = request.get_json(silent=True) or {}
    img = str(body.get("modelImageDataUrl") or "")
    try:
        result = analyze_model_vision(img)
        return jsonify({"ok": True, "analysis": result})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400


@app.post("/synthesize-video")
def route_synthesize_video() -> Any:
    body: Dict[str, Any] = request.get_json(silent=True) or {}
    job_id = str(body.get("jobId") or f"ugc_py_{int(time.time() * 1000)}_{uuid.uuid4().hex[:4]}")
    filename = f"{Path(job_id).name}.mp4"
    out_path = UGC_RENDERS_DIR / filename

    if body.get("async") is True:
        PY_JOBS[job_id] = {"jobId": job_id, "status": "rendering", "startedAt": time.time()}

        def _worker() -> None:
            try:
                res = synthesize_ugc_commercial_mp4(body, out_path)
                PY_JOBS[job_id]["status"] = "completed"
                PY_JOBS[job_id]["result"] = {
                    **res,
                    "videoUrl": f"/api/ugc/download/{filename}",
                    "downloadUrl": f"/api/ugc/download/{filename}?download=1",
                }
            except Exception as exc:
                PY_JOBS[job_id]["status"] = "failed"
                PY_JOBS[job_id]["error"] = str(exc)

        threading.Thread(target=_worker, daemon=True).start()
        return jsonify({"ok": True, "status": "rendering", "jobId": job_id})

    try:
        res = synthesize_ugc_commercial_mp4(body, out_path)
        return jsonify(
            {
                **res,
                "status": "completed",
                "jobId": job_id,
                "videoUrl": f"/api/ugc/download/{filename}",
                "downloadUrl": f"/api/ugc/download/{filename}?download=1",
            }
        )
    except Exception as exc:
        return jsonify({"ok": False, "status": "failed", "jobId": job_id, "error": str(exc)}), 500


@app.get("/jobs/<job_id>")
def route_job_status(job_id: str) -> Any:
    job = PY_JOBS.get(job_id)
    if not job:
        return jsonify({"ok": False, "status": "failed", "error": "Python render job not found"}), 404
    elapsed = max(0, int(round(time.time() - float(job.get("startedAt") or time.time()))))
    if job["status"] == "completed":
        return jsonify({**job["result"], "status": "completed", "jobId": job_id, "elapsedSec": elapsed})
    if job["status"] == "failed":
        return jsonify({"ok": False, "status": "failed", "jobId": job_id, "elapsedSec": elapsed, "error": job.get("error", "Render failed")}), 500
    return jsonify({"ok": True, "status": "rendering", "jobId": job_id, "elapsedSec": elapsed})


@app.get("/download/<filename>")
def route_download(filename: str) -> Any:
    safe_name = Path(filename).name
    target = UGC_RENDERS_DIR / safe_name
    if not safe_name or not target.exists():
        return jsonify({"ok": False, "error": "File not found"}), 404
    as_att = request.args.get("download") == "1"
    return send_file(str(target), mimetype="video/mp4", as_attachment=as_att, download_name=safe_name)


if __name__ == "__main__":
    port = int(os.environ.get("UGC_PYTHON_PORT", os.environ.get("PORT", "5055")))
    app.run(host="127.0.0.1" if os.environ.get("UGC_PYTHON_BIND_ALL") != "1" else "0.0.0.0", port=port, threaded=True)
