"""
Configuration pour le réseau Geth Docker
"""

# URLs des nœuds Geth Docker
NODES = {
    "node1": {
        "url": "http://localhost:8545",  # Professeur (bootstrap)
        "name": "Professeur",
        "role": "teacher"
    },
    "node2": {
        "url": "http://localhost:8555",  # Étudiant 1
        "name": "Étudiant 1",
        "role": "student"
    },
    "node3": {
        "url": "http://localhost:8565",  # Étudiant 2
        "name": "Étudiant 2",
        "role": "student"
    }
}

# URL du nœud principal (bootstrap)
PRIMARY_NODE = NODES["node1"]["url"]

# Network ID
NETWORK_ID = 1337
CHAIN_ID = 1337

# Chemins des fichiers
CONTRACT_SOURCE = "../contracts/AssignmentSystem.sol"
COMPILED_CONTRACT = "compiled/AssignmentSystem.json"

# Configuration du compilateur
SOLC_VERSION = "0.8.17"

# Mot de passe des comptes (défini dans Docker)
PASSWORD = "blockchain123"