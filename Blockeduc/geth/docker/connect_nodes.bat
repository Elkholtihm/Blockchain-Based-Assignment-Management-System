@echo off
chcp 65001 >nul
echo ==========================================
echo   CONNEXION DES NŒUDS (PoA Network)
echo ==========================================

REM Wait for nodes to start
echo ⏳ Waiting for nodes to start (15s)...
timeout /t 15 /nobreak >nul

REM Get Node1's enode
echo 🔍 Getting Node1 enode...
for /f "delims=" %%i in ('docker exec geth-node1 geth --datadir /root/data --exec "admin.nodeInfo.enode" attach 2^>nul') do set ENODE1=%%i

REM Remove quotes
set ENODE1=%ENODE1:"=%

if "%ENODE1%"=="" (
    echo ❌ Failed to get Node1 enode
    echo Make sure Node1 is running: docker compose ps
    exit /b 1
)

REM Replace localhost with Docker IP
set ENODE1_FIXED=%ENODE1:127.0.0.1=172.25.0.10%
set ENODE1_FIXED=%ENODE1_FIXED:[::]=172.25.0.10%

echo ✅ Node1 enode: %ENODE1_FIXED:~0,60%...

REM Connect Node2 to Node1
echo.
echo 🔗 Connecting Node2 to Node1...
docker exec geth-node2 geth --datadir /root/data --exec "admin.addPeer('%ENODE1_FIXED%')" attach 2>nul
timeout /t 3 /nobreak >nul

for /f "delims=" %%i in ('docker exec geth-node2 geth --datadir /root/data --exec "admin.peers.length" attach 2^>nul') do set PEERS2=%%i
echo ✅ Node2 connected to %PEERS2% peer(s)

REM Connect Node3 to Node1
echo.
echo 🔗 Connecting Node3 to Node1...
docker exec geth-node3 geth --datadir /root/data --exec "admin.addPeer('%ENODE1_FIXED%')" attach 2>nul
timeout /t 3 /nobreak >nul

for /f "delims=" %%i in ('docker exec geth-node3 geth --datadir /root/data --exec "admin.peers.length" attach 2^>nul') do set PEERS3=%%i
echo ✅ Node3 connected to %PEERS3% peer(s)

REM Wait for sync
echo.
echo ⏳ Waiting for sync (10s)...
timeout /t 10 /nobreak >nul

REM Verify network
echo.
echo ==========================================
echo   NETWORK STATUS
echo ==========================================

echo.
echo 📊 Node1 (Sealer):
for /f "delims=" %%i in ('docker exec geth-node1 geth --datadir /root/data --exec "admin.peers.length" attach 2^>nul') do set NODE1_PEERS=%%i
echo    Peers: %NODE1_PEERS%
for /f "delims=" %%i in ('docker exec geth-node1 geth --datadir /root/data --exec "eth.blockNumber" attach 2^>nul') do set NODE1_BLOCK=%%i
echo    Block: %NODE1_BLOCK%
for /f "delims=" %%i in ('docker exec geth-node1 geth --datadir /root/data --exec "eth.mining" attach 2^>nul') do set NODE1_MINING=%%i
echo    Sealing: %NODE1_MINING%

echo.
echo 📊 Node2 (Observer):
for /f "delims=" %%i in ('docker exec geth-node2 geth --datadir /root/data --exec "admin.peers.length" attach 2^>nul') do set NODE2_PEERS=%%i
echo    Peers: %NODE2_PEERS%
for /f "delims=" %%i in ('docker exec geth-node2 geth --datadir /root/data --exec "eth.blockNumber" attach 2^>nul') do set NODE2_BLOCK=%%i
echo    Block: %NODE2_BLOCK%

echo.
echo 📊 Node3 (Observer):
for /f "delims=" %%i in ('docker exec geth-node3 geth --datadir /root/data --exec "admin.peers.length" attach 2^>nul') do set NODE3_PEERS=%%i
echo    Peers: %NODE3_PEERS%
for /f "delims=" %%i in ('docker exec geth-node3 geth --datadir /root/data --exec "eth.blockNumber" attach 2^>nul') do set NODE3_BLOCK=%%i
echo    Block: %NODE3_BLOCK%

echo.
echo ==========================================
echo ✅ PoA NETWORK READY!
echo ==========================================
echo.
echo Blocks should be created every 1 second
echo Ready to deploy: cd ..\python ^&^& python deploy_contract.py
echo.