"""
Déployer le smart contract sur le réseau Geth Docker (PoW)
"""

import json
import sys
import time
from pathlib import Path
from web3 import Web3
from config import PRIMARY_NODE, COMPILED_CONTRACT, NETWORK_ID

# Mot de passe du compte (doit correspondre à celui dans init.sh)
ACCOUNT_PASSWORD = "elkholtihm2002"

def compile_contract():
    """Compile le contrat si nécessaire"""
    from solcx import compile_standard, install_solc, set_solc_version
    from config import CONTRACT_SOURCE, SOLC_VERSION
    
    print("🔧 Compilation du contrat...")
    
    # Installer solc
    install_solc(SOLC_VERSION)
    set_solc_version(SOLC_VERSION)
    
    # Lire le contrat
    with open(CONTRACT_SOURCE, 'r', encoding='utf-8') as f:
        source = f.read()
    
    # Compiler
    compiled = compile_standard({
        "language": "Solidity",
        "sources": {"AssignmentSystem.sol": {"content": source}},
        "settings": {
            "outputSelection": {
                "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.bytecode.sourceMap"]}
            }
        }
    }, solc_version=SOLC_VERSION)
    
    # Extraire
    contract = compiled['contracts']['AssignmentSystem.sol']['AssignmentSystem']
    contract_data = {
        "abi": contract['abi'],
        "bytecode": contract['evm']['bytecode']['object'],
        "compiler_version": SOLC_VERSION
    }
    
    # Sauvegarder
    Path("compiled").mkdir(exist_ok=True)
    with open(COMPILED_CONTRACT, 'w') as f:
        json.dump(contract_data, f, indent=2)
    
    print("✅ Compilation terminée")
    return contract_data

def deploy_contract():
    """
    Déploie le smart contract sur le nœud principal
    """
    
    print("\n" + "="*60)
    print("   DÉPLOIEMENT SUR RÉSEAU GETH DOCKER (PoW)")
    print("="*60)
    
    # Connexion
    print(f"\n🔗 Connexion à {PRIMARY_NODE}...")
    w3 = Web3(Web3.HTTPProvider(PRIMARY_NODE))
    
    print("\n" + "="*60)
    print("   DÉPLOIEMENT SUR RÉSEAU GETH DOCKER (PoA)")
    print("="*60)
    
    # Connexion
    print(f"\n🔗 Connexion à {PRIMARY_NODE}...")
    w3 = Web3(Web3.HTTPProvider(PRIMARY_NODE))
    
    # ADD THIS: Inject PoA middleware
    from web3.middleware import geth_poa_middleware
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    
    if not w3.is_connected():
        raise Exception(f"❌ Impossible de se connecter à {PRIMARY_NODE}")

    
    print(f"✅ Connecté!")
    print(f"📊 Chain ID: {w3.eth.chain_id}")
    print(f"⛓️  Block: {w3.eth.block_number}")
    print(f"🌐 Network ID: {NETWORK_ID}")
    
    # Vérifier si le fichier compilé existe
    if not Path(COMPILED_CONTRACT).exists():
        print("\n⚠️  Contrat non compilé, compilation en cours...")
        contract_data = compile_contract()
    else:
        print("📦 Chargement du contrat compilé...")
        with open(COMPILED_CONTRACT, 'r') as f:
            contract_data = json.load(f)
    
    abi = contract_data['abi']
    bytecode = contract_data['bytecode']
    
    # S'assurer que le bytecode commence par 0x
    if not bytecode.startswith('0x'):
        bytecode = '0x' + bytecode
    
    # Compte deployer
    accounts = w3.eth.accounts
    if not accounts:
        raise Exception("❌ Aucun compte trouvé!")
    
    deployer = accounts[0]
    balance = w3.from_wei(w3.eth.get_balance(deployer), 'ether')
    
    print(f"\n👤 Deployer: {deployer}")
    print(f"💰 Balance: {balance} ETH")
    
    if balance == 0:
        raise Exception("❌ Balance insuffisante! Le compte n'a pas d'ETH.")
    
    # ⭐ DÉVERROUILLER LE COMPTE
    print("\n🔓 Déverrouillage du compte...")
    try:
        # Déverrouiller pour 300 secondes (5 minutes)
        w3.geth.personal.unlock_account(deployer, ACCOUNT_PASSWORD, 300)
        print("✅ Compte déverrouillé")
    except Exception as e:
        print(f"⚠️  Avertissement lors du déverrouillage: {e}")
        print("Le compte est peut-être déjà déverrouillé via --unlock dans Geth")
    
    # Créer le contrat
    print("\n🔨 Création du contrat...")
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Estimer le gas
    print("⛽ Estimation du gas...")
    try:
        gas_estimate = Contract.constructor().estimate_gas({'from': deployer})
        print(f"Gas estimé: {gas_estimate}")
        gas_to_use = gas_estimate + 100000
    except Exception as e:
        print(f"⚠️  Estimation échouée ({e}), utilisation de 4000000")
        gas_to_use = 4000000
    
    # Déployer
    print("\n🚀 Déploiement...")
    print(f"⛽ Gas utilisé: {gas_to_use}")
    
    try:
        tx_hash = Contract.constructor().transact({
            'from': deployer,
            'gas': gas_to_use
        })
    except ValueError as e:
        if 'authentication needed' in str(e):
            print("\n❌ Erreur d'authentification!")
            print("Le compte est toujours verrouillé.")
            print("\n💡 SOLUTIONS:")
            print("1. Vérifie que le mot de passe est correct dans init.sh et deploy_contract.py")
            print("2. Vérifie que --unlock est bien dans la commande geth (init.sh)")
            print("3. Relance les conteneurs: docker compose restart")
            raise
        else:
            raise
    
    print(f"📝 Transaction: {tx_hash.hex()}")
    print("⏳ Attente de confirmation (peut prendre 10-30 secondes sur PoW)...")
    
    # Attendre avec timeout
    try:
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    except Exception as e:
        print(f"\n⚠️  Timeout ou erreur: {e}")
        print("Vérification manuelle de la transaction...")
        
        # Essayer de récupérer quand même
        for i in range(30):
            try:
                receipt = w3.eth.get_transaction_receipt(tx_hash)
                if receipt:
                    break
            except:
                pass
            time.sleep(2)
            print(f"Tentative {i+1}/30...")
        
        if not receipt:
            raise Exception("Transaction non trouvée après 60 secondes")
    
    contract_address = receipt.contractAddress
    
    if not contract_address:
        raise Exception("❌ Déploiement échoué: pas d'adresse de contrat")
    
    print("\n" + "="*60)
    print("✅ CONTRAT DÉPLOYÉ AVEC SUCCÈS!")
    print("="*60)
    print(f"📍 Adresse: {contract_address}")
    print(f"⛽ Gas utilisé: {receipt.gasUsed}")
    print(f"⛓️  Block: {receipt.blockNumber}")
    print(f"✅ Status: {'Success' if receipt.status == 1 else 'Failed'}")
    print("="*60)
    
    # Sauvegarder
    contract_data['contract_address'] = contract_address
    contract_data['deployment_block'] = receipt.blockNumber
    contract_data['deployer'] = deployer
    contract_data['network'] = 'geth-docker-pow'
    contract_data['network_id'] = NETWORK_ID
    contract_data['tx_hash'] = tx_hash.hex()
    
    with open(COMPILED_CONTRACT, 'w') as f:
        json.dump(contract_data, f, indent=2)
    
    print(f"\n💾 Informations sauvegardées dans {COMPILED_CONTRACT}")
    
    # Attendre propagation
    print("\n⏳ Attente de propagation sur les autres nœuds (10s)...")
    time.sleep(10)
    
    # Vérifier que le contrat existe
    print("\n🔍 Vérification du déploiement...")
    code = w3.eth.get_code(contract_address)
    if code == b'' or code == '0x':
        print("⚠️  Attention: Le contrat n'a pas de code!")
    else:
        print(f"✅ Contrat vérifié: {len(code)} bytes de bytecode")
    
    return contract_address, abi, w3

def main():
    try:
        contract_address, abi, w3 = deploy_contract()
        
        print("\n📋 INFORMATIONS POUR L'ÉQUIPE:")
        print("-" * 60)
        print(f"Contract Address: {contract_address}")
        print(f"Primary Node:     {PRIMARY_NODE}")
        print(f"Network ID:       {NETWORK_ID}")
        print(f"Chain ID:         {w3.eth.chain_id}")
        print("-" * 60)
        
        print("\n✅ Déploiement terminé!")
        print("📋 Prochaine étape: python test_network.py")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())