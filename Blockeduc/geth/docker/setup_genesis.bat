@echo off
echo ==========================================
echo   PoA GENESIS GENERATOR
echo ==========================================

set SIGNER_ADDR=7E5F4552091A69125d5DfCb7b8C2659029395Bdf

echo.
echo Signer address: 0x%SIGNER_ADDR%
echo.

REM Generate extradata
set VANITY=0000000000000000000000000000000000000000000000000000000000000000
set SEAL=0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000

set EXTRADATA=0x%VANITY%%SIGNER_ADDR%%SEAL%

echo Generated extradata:
echo %EXTRADATA%
echo.

REM Create genesis.json
(
echo {
echo   "config": {
echo     "chainId": 1337,
echo     "homesteadBlock": 0,
echo     "eip150Block": 0,
echo     "eip155Block": 0,
echo     "eip158Block": 0,
echo     "byzantiumBlock": 0,
echo     "constantinopleBlock": 0,
echo     "petersburgBlock": 0,
echo     "istanbulBlock": 0,
echo     "berlinBlock": 0,
echo     "londonBlock": 0,
echo     "clique": {
echo       "period": 1,
echo       "epoch": 30000
echo     }
echo   },
echo   "difficulty": "0x1",
echo   "gasLimit": "0x8000000",
echo   "extradata": "%EXTRADATA%",
echo   "alloc": {
echo     "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf": {
echo       "balance": "100000000000000000000000"
echo     },
echo     "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF": {
echo       "balance": "100000000000000000000000"
echo     },
echo     "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69": {
echo       "balance": "100000000000000000000000"
echo     }
echo   }
echo }
) > genesis.json

echo ✅ genesis.json created!
echo.
echo Next steps:
echo   1. docker compose up -d --build
echo   2. .\connect_nodes.bat
echo   3. cd ..\python ^&^& python deploy_contract.py