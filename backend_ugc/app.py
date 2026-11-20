import os
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

from analyzer import analyze_model_vision, analyze_product_vision

app = Flask(__name__)
CORS(app)


@app.get("/health")
def health() -> Any:
    return jsonify(
        {
            "ok": True,
            "service": "itcafeteria-ugc-flask-analyzer",
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5055"))
    app.run(host="0.0.0.0", port=port)
