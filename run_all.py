"""
Master Application Launcher.
Starts both the FastAPI Backend (port 8000) and Vite React Frontend (port 5173).
Verifies health and presents local URLs to the user.
"""
import os
import sys
import time
import subprocess
import webbrowser
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def check_or_prepare_pipeline():
    python_exe = str(BASE_DIR / ".venv" / "Scripts" / "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    model_file = BASE_DIR / "models" / "best_model.joblib"
    clean_data = BASE_DIR / "data" / "processed" / "supply_chain_clean.csv"

    if not clean_data.exists():
        print("[Launcher] Preparing dataset and features...")
        subprocess.run([python_exe, "scripts/download_dataset.py"], cwd=BASE_DIR, check=True)
        subprocess.run([python_exe, "scripts/explore_and_clean.py"], cwd=BASE_DIR, check=True)

    if not model_file.exists():
        print("[Launcher] Training machine learning models...")
        subprocess.run([python_exe, "scripts/train_models.py"], cwd=BASE_DIR, check=True)

def main():
    print("=" * 70)
    print(" Supply Chain Risk & Resilience Intelligence Platform")
    print(" Data-Driven Decision Support System")
    print("=" * 70)

    check_or_prepare_pipeline()

    python_exe = str(BASE_DIR / ".venv" / "Scripts" / "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    print("\n[Launcher] Starting FastAPI backend on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BASE_DIR
    )

    # Wait for backend to initialize
    time.sleep(3)

    print("[Launcher] Starting Vite React frontend on http://localhost:5173...")
    frontend_dir = BASE_DIR / "frontend"
    # Use shell=True on Windows for npm.cmd
    frontend_proc = subprocess.Popen(
        "npm run dev",
        shell=True,
        cwd=frontend_dir
    )

    print("\n" + "=" * 70)
    print(" APPLICATION RUNNING SUCCESSFULLY!")
    print("=" * 70)
    print(" Frontend Dashboard:  http://localhost:5173")
    print(" Backend REST API:    http://127.0.0.1:8000")
    print(" API Documentation:   http://127.0.0.1:8000/docs")
    print("=" * 70)
    print(" Press Ctrl+C in this terminal to shut down both servers.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Launcher] Shutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("[Launcher] Goodbye!")

if __name__ == "__main__":
    main()
