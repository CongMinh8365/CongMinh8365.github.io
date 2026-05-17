from __future__ import annotations

import base64
import json
import re
import shutil
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 5500


def safe_join(*parts: str) -> Path:
    target = ROOT.joinpath(*parts).resolve()
    if target != ROOT and ROOT not in target.parents:
        raise ValueError("Path escapes project root")
    return target


def require_slug(value: str) -> str:
    if not re.fullmatch(r"[a-z0-9-]+", value or ""):
        raise ValueError("Invalid event slug")
    return value


def require_filename(value: str, suffix: str | None = None) -> str:
    if not value or "/" in value or "\\" in value or value in {".", ".."}:
        raise ValueError("Invalid filename")
    if suffix and not value.endswith(suffix):
        raise ValueError(f"Filename must end with {suffix}")
    return value


class BlogHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path not in {"/__upload-local", "/__write-index"}:
            self.send_error(404, "Unknown endpoint")
            return

        try:
            payload = self.read_json()
            if path == "/__upload-local":
                self.handle_upload(payload)
            else:
                self.handle_write_index(payload)
            self.write_json({"ok": True})
        except Exception as exc:  # noqa: BLE001 - return the exact local helper error.
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(exc)}).encode("utf-8"))

    def read_json(self) -> dict:
        size = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(size)
        return json.loads(raw.decode("utf-8"))

    def write_json(self, data: dict) -> None:
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_upload(self, payload: dict) -> None:
        event_slug = require_slug(payload.get("eventSlug", ""))
        writeup_filename = require_filename(payload.get("writeupFilename", ""), ".md")
        markdown = payload.get("markdown", "")
        posts_js = payload.get("postsJs", "")

        if not isinstance(markdown, str) or not isinstance(posts_js, str):
            raise ValueError("Invalid upload payload")

        post_dir = safe_join("posts", event_slug)
        post_dir.mkdir(parents=True, exist_ok=True)
        safe_join("posts", event_slug, writeup_filename).write_text(markdown, encoding="utf-8", newline="\n")

        for asset in payload.get("assets", []):
            folder = asset.get("folder")
            if folder not in {"files", "images"}:
                raise ValueError("Invalid asset folder")

            filename = require_filename(asset.get("filename", ""))
            content = base64.b64decode(asset.get("contentBase64", ""), validate=True)
            asset_dir = safe_join("posts", event_slug, folder)
            asset_dir.mkdir(parents=True, exist_ok=True)
            safe_join("posts", event_slug, folder, filename).write_bytes(content)

        old_file = payload.get("oldFile") or ""
        if old_file:
            old_path = safe_join(*old_file.split("/"))
            if old_path.exists() and old_path.is_file():
                old_path.unlink()

        safe_join("assets", "js", "posts.js").write_text(posts_js, encoding="utf-8", newline="\n")

    def handle_write_index(self, payload: dict) -> None:
        posts_js = payload.get("postsJs", "")
        if not isinstance(posts_js, str):
            raise ValueError("Invalid posts.js content")

        for relative in payload.get("deleteFiles", []):
            target = safe_join(*str(relative).split("/"))
            if target.exists() and target.is_file():
                target.unlink()

        for relative in payload.get("deleteDirs", []):
            target = safe_join(*str(relative).split("/"))
            if target.exists() and target.is_dir():
                shutil.rmtree(target)

        safe_join("assets", "js", "posts.js").write_text(posts_js, encoding="utf-8", newline="\n")


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), BlogHandler)
    print(f"Serving CTF blog with local upload helper at http://{HOST}:{PORT}/")
    print("Press Ctrl+C to stop.")
    server.serve_forever()


if __name__ == "__main__":
    main()
