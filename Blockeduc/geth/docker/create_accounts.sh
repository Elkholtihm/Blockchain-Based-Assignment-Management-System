#!/bin/bash

PASSWORD="elkholtihm2002"

echo "Creating account keystores..."
mkdir -p accounts/node1 accounts/node2 accounts/node3

# Create 3 accounts
for i in 1 2 3; do
  echo "Creating account for node$i..."
  echo $PASSWORD > /tmp/password.txt
  
  geth account new --password /tmp/password.txt --keystore ./accounts/node$i
  
  # Get the address
  ADDRESS=$(ls ./accounts/node$i | grep UTC | sed 's/.*--//')
  echo "Node$i address: 0x$ADDRESS"
done

rm /tmp/password.txt
echo "Done! Update genesis.json with these addresses."