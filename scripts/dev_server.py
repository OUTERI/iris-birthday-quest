"""Start a hidden local preview server and exit without blocking the agent."""
from pathlib import Path
import socket
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
with socket.socket() as connection:
    available = connection.connect_ex(('127.0.0.1', 8765)) != 0
if available:
    output = root / 'output'
    output.mkdir(exist_ok=True)
    with (output / 'server.log').open('ab') as log:
        process = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=root, stdout=log, stderr=log, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    print('Preview server PID', process.pid)
else:
    print('Preview server already listening on 8765')
