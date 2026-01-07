@echo off
echo Starting EduChain Project...
echo.

REM Get script location (Blockeduc folder)
set ROOT_DIR=%~dp0
set VENV_DIR=%ROOT_DIR%..\venv

REM Activate venv
call "%VENV_DIR%\Scripts\activate.bat"

REM Go to project root
cd /d "%ROOT_DIR%"

REM 1. Blockchain
echo [1/3] Starting Blockchain...
cd geth\docker
docker compose down
docker volume rm docker_node1-data docker_node2-data docker_node3-data 2>nul
docker compose up -d --build
timeout /t 30 /nobreak
call connect_nodes.bat
cd ..\python
python deploy_contract.py
if %ERRORLEVEL% NEQ 0 (
    echo Contract deployment failed!
    pause
    exit /b 1
)

REM 2. Backend
echo [2/3] Starting Django...
cd /d "%ROOT_DIR%\educhain"
python manage.py migrate
echo Creating blockchain profiles for users...
python manage.py create_blockchain_profiles
echo.
start "Django" cmd /k "call "%VENV_DIR%\Scripts\activate.bat" && cd /d "%ROOT_DIR%\educhain" && python manage.py runserver"
timeout /t 5 /nobreak



REM 3. Frontend
echo [3/3] Starting React...
cd /d "%ROOT_DIR%\frontend"
start "React" cmd /k "npm run dev"

echo.
echo All services started!
echo Django: http://localhost:8000
echo React: http://localhost:5173
echo.
pause