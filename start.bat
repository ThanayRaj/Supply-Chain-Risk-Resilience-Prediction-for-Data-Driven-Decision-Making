@echo off
title Supply Chain Risk & Resilience Intelligence
echo ======================================================================
echo  Starting Supply Chain Risk & Resilience Decision Support Platform...
echo ======================================================================
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" run_all.py
) else (
    python run_all.py
)
pause
