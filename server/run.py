import os
import socket
import re
import uvicorn
from app.config import settings

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks whether a TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind((host if host != "0.0.0.0" else "", port))
            return False
        except OSError:
            return True

def find_available_port(preferred: int, host: str = "127.0.0.1", max_scan: int = 100) -> int:
    """Returns preferred port if available; otherwise scans for any available port."""
    if preferred > 0 and not is_port_in_use(preferred, host):
        return preferred
    
    start_scan = preferred if preferred > 0 else 8000
    for candidate in range(start_scan, start_scan + max_scan):
        if not is_port_in_use(candidate, host):
            return candidate

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

def sync_client_env(active_port: int) -> None:
    """Updates client/.env.local with the active server port if present."""
    client_env_path = os.path.abspath(
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "client", ".env.local")
    )
    if not os.path.exists(client_env_path):
        return

    try:
        with open(client_env_path, "r", encoding="utf-8") as f:
            content = f.read()

        target_url = f"http://localhost:{active_port}"
        if "NEXT_PUBLIC_API_URL=" in content:
            new_content = re.sub(
                r"NEXT_PUBLIC_API_URL=[^\r\n]*",
                f"NEXT_PUBLIC_API_URL={target_url}",
                content
            )
        else:
            new_content = f"NEXT_PUBLIC_API_URL={target_url}\n" + content

        if new_content != content:
            with open(client_env_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"[CLIENT CONFIG] Synchronized client/.env.local to NEXT_PUBLIC_API_URL={target_url}")
    except Exception as e:
        print(f"[CLIENT CONFIG WARNING] Could not sync client/.env.local: {e}")

if __name__ == "__main__":
    configured_port = settings.PORT
    active_port = find_available_port(configured_port, settings.HOST)

    if active_port != configured_port:
        print(f"[PORT SCAN] Port {configured_port} is already in use. Switched to available port {active_port}.")

    sync_client_env(active_port)

    print(f"[SERVER] Starting FastAPI Server on http://{settings.HOST}:{active_port}")
    print(f"[SERVER] API Documentation available at http://{settings.HOST}:{active_port}/docs")

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=active_port,
        reload=True
    )
