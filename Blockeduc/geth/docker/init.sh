#!/bin/sh

echo "=========================================="
echo "  INITIALISATION NOEUD GETH (PoA Clique)"
echo "=========================================="

# STEP 1: Initialize genesis FIRST (before creating accounts)
if [ ! -d "/root/data/geth" ]; then
    echo "Initializing blockchain with genesis..."
    geth --datadir /root/data init /root/genesis.json
    echo "Genesis initialization complete"
else
    echo "Blockchain already initialized"
fi

# STEP 2: Create password
echo "elkholtihm2002" > /root/password.txt

# STEP 3: Import/create account
ACCOUNT_EXISTS=$(geth --datadir /root/data account list 2>/dev/null | grep -c "0x")

if [ "$ACCOUNT_EXISTS" -eq 0 ]; then
    echo "Creating account from private key..."
    
    if [ "$HOSTNAME" = "geth-node1" ]; then
        PRIVATE_KEY="0000000000000000000000000000000000000000000000000000000000000001"
        EXPECTED_ADDR="0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf"
    elif [ "$HOSTNAME" = "geth-node2" ]; then
        PRIVATE_KEY="0000000000000000000000000000000000000000000000000000000000000002"
        EXPECTED_ADDR="0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF"
    else
        PRIVATE_KEY="0000000000000000000000000000000000000000000000000000000000000003"
        EXPECTED_ADDR="0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69"
    fi
    
    echo $PRIVATE_KEY > /tmp/private_key.txt
    geth account import --datadir /root/data --password /root/password.txt /tmp/private_key.txt
    rm /tmp/private_key.txt
    
    echo "Account imported: $EXPECTED_ADDR"
else
    echo "Account already exists"
fi

ACCOUNT=$(geth --datadir /root/data account list | head -n 1 | grep -o "0x[0-9a-fA-F]*")
echo ""
echo "Account address: $ACCOUNT"

echo ""
echo "=========================================="
echo "  STARTING NODE"
echo "=========================================="
echo ""

if [ "$IS_SEALER" = "true" ]; then
    echo "Mode: SEALER (PoA Authority)"
    exec geth \
      --datadir /root/data \
      --networkid 1337 \
      --port ${P2P_PORT:-30303} \
      --http \
      --http.addr "0.0.0.0" \
      --http.port 8545 \
      --http.corsdomain "*" \
      --http.api "eth,net,web3,personal,admin,clique,txpool,debug,miner" \
      --ws \
      --ws.addr "0.0.0.0" \
      --ws.port 8546 \
      --ws.origins "*" \
      --ws.api "eth,net,web3,personal,admin,clique,txpool,debug,miner" \
      --allow-insecure-unlock \
      --unlock "$ACCOUNT" \
      --password /root/password.txt \
      --mine \
      --miner.etherbase "$ACCOUNT" \
      --miner.gasprice 0 \
      --miner.gaslimit 8000000 \
      --txpool.pricelimit 0 \
      --txpool.pricebump 0 \
      --txpool.nolocals \
      --txpool.globalslots 8192 \
      --txpool.globalqueue 2048 \
      --nodiscover \
      --maxpeers 25 \
      --syncmode "full" \
      --verbosity 3
else
    echo "Mode: OBSERVER (Non-sealer)"
    exec geth \
      --datadir /root/data \
      --networkid 1337 \
      --port ${P2P_PORT:-30303} \
      --http \
      --http.addr "0.0.0.0" \
      --http.port 8545 \
      --http.corsdomain "*" \
      --http.api "eth,net,web3,personal,admin,clique,txpool,debug" \
      --ws \
      --ws.addr "0.0.0.0" \
      --ws.port 8546 \
      --ws.origins "*" \
      --ws.api "eth,net,web3,personal,admin,clique,txpool,debug" \
      --allow-insecure-unlock \
      --unlock "$ACCOUNT" \
      --password /root/password.txt \
      --txpool.pricelimit 0 \
      --txpool.pricebump 0 \
      --txpool.nolocals \
      --nodiscover \
      --maxpeers 25 \
      --syncmode "full" \
      --verbosity 3
fi