from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import requests


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        path = qs.get('path', [''])[0]

        response = requests.get(f'https://boardgamegeek.com/{path}')

        self.send_response(response.status_code)
        self.send_header('Content-Type', response.headers.get('Content-Type', 'text/plain'))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response.content)
