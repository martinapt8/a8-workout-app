#!/usr/bin/env python3
"""
Simple HTTP server for testing the A8 Workout Challenge app locally
Usage: python3 serve.py
Then open: http://localhost:8000/?user=mritty85
"""

import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = MyHTTPRequestHandler

print("=" * 60)
print("🚀 A8 Workout Challenge - Local Test Server")
print("=" * 60)
print(f"\nServer running at: http://localhost:{PORT}/")
print(f"\nTest your app at: http://localhost:{PORT}/?user=mritty85")
print("\nPress Ctrl+C to stop the server")
print("=" * 60)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
