"""Local-only probe over the unchanged production export; never deploy this server."""
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
assert (ROOT / 'out/index.html').is_file(), 'Run npm run build first'
assert (ROOT / 'dist/planner/index.js').is_file(), 'Run npm run build:planner first'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'out'), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/':
            data = (ROOT / 'out/index.html').read_bytes().replace(
                b'</body>', b'<script type="module" src="/__probe.js"></script></body>')
            mime = 'text/html; charset=utf-8'
        elif path == '/__probe.js':
            data = (ROOT / 'scripts/browser_probe.js').read_bytes()
            mime = 'text/javascript'
        elif path == '/__scenario.json':
            data = (ROOT / 'data/scenario.json').read_bytes()
            mime = 'application/json'
        elif path.startswith('/__planner/'):
            target = (ROOT / 'dist/planner' / path.removeprefix('/__planner/')).resolve()
            if not target.is_relative_to(ROOT / 'dist/planner') or not target.is_file() or target.suffix != '.js':
                self.send_error(404)
                return
            data, mime = target.read_bytes(), 'text/javascript'
        else:
            return super().do_GET()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != '/__report' or self.headers.get('Origin') != 'http://127.0.0.1:4174':
            self.send_error(403)
            return
        size = int(self.headers.get('Content-Length', 0))
        if not 0 < size <= 2_000_000:
            self.send_error(413)
            return
        report = json.loads(self.rfile.read(size))
        assert len(report['samples']) >= 50 and all(s['matched'] for s in report['samples'])
        destination = ROOT / 'docs/benchmarks/p4-browser.json'
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        self.send_response(204)
        self.end_headers()


if __name__ == '__main__':
    print('Production export + local probe: http://127.0.0.1:4174', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4174), Handler).serve_forever()
