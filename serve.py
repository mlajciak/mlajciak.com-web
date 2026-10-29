#!/usr/bin/env python3
"""Static server. Files in pages/ are also reachable at /name."""

import os
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        self._route_page()
        return super().do_GET()

    def _route_page(self):
        request = unquote(urlsplit(self.path).path)
        if request in ("", "/"):
            return
        candidate = (ROOT / request.lstrip("/")).resolve()
        try:
            candidate.relative_to(ROOT.resolve())
        except ValueError:
            return
        if candidate.exists():
            return
        suffix = Path(request).suffix
        if suffix and suffix != ".html":
            return
        self.path = "/index.html"


class Server(ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


def main():
    port = int(os.environ.get("PORT", "8000"))
    server = Server(("::", port), Handler)
    print(f"Serving http://127.0.0.1:{port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
