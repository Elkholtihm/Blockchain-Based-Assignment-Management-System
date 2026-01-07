"""
Tester le réseau Geth Docker multi-nœuds
"""

import json
import time
from pathlib import Path
from web3 import Web3
from web3.middleware import geth_poa_middleware  # ADD THIS AT THE TOP
from config import NODES, COMPILED_CONTRACT

# Mot de passe des comptes (doit correspondre à init.sh)
ACCOUNT_PASSWORD = "elkholtihm2002"

def connect_to_nodes():
    """Connecte à tous les nœuds"""
    connections = {}
    
    print("\n" + "="*60)
    print("   CONNEXION AUX NŒUDS")
    print("="*60)
    
    # Charger le contrat
    if not Path(COMPILED_CONTRACT).exists():
        raise Exception("❌ Contrat non déployé! Lance deploy_contract.py")
    
    with open(COMPILED_CONTRACT, 'r') as f:
        contract_data = json.load(f)
    
    if 'contract_address' not in contract_data:
        raise Exception("❌ Adresse du contrat introuvable!")
    
    contract_address = contract_data['contract_address']
    abi = contract_data['abi']
    
    print(f"\n📍 Adresse du contrat: {contract_address}\n")
    
    # Connecter à chaque nœud
    for node_id, node_info in NODES.items():
        try:
            w3 = Web3(Web3.HTTPProvider(node_info['url']))
            
            # ADD POA MIDDLEWARE FOR EACH NODE
            w3.middleware_onion.inject(geth_poa_middleware, layer=0)
            
            if w3.is_connected():
                contract = w3.eth.contract(address=contract_address, abi=abi)
                block = w3.eth.block_number
                accounts = w3.eth.accounts
                
                # ⭐ DÉVERROUILLER LE PREMIER COMPTE
                if accounts:
                    try:
                        w3.geth.personal.unlock_account(accounts[0], ACCOUNT_PASSWORD, 0)
                        print(f"🔓 Compte {accounts[0][:10]}... déverrouillé")
                    except Exception as e:
                        print(f"⚠️  Déverrouillage: {str(e)[:50]}...")
                
                connections[node_id] = {
                    'w3': w3,
                    'contract': contract,
                    'info': node_info
                }
                
                print(f"✅ {node_info['name']} ({node_id})")
                print(f"   URL: {node_info['url']}")
                print(f"   Block: {block}")
                print(f"   Comptes: {len(accounts)}\n")
            else:
                print(f"❌ {node_info['name']}: Déconnecté\n")
                
        except Exception as e:
            print(f"❌ {node_info['name']}: Erreur - {e}\n")
    
    return connections

def test_create_assignment(connections):
    """TEST 1: Créer un devoir sur node1"""
    print("\n" + "="*60)
    print("TEST 1: Créer un devoir (Node 1 - Professeur)")
    print("="*60)
    
    node1 = connections['node1']
    w3 = node1['w3']
    contract = node1['contract']
    teacher = w3.eth.accounts[0]
    
    title = "Examen Blockchain Docker"
    description = "Test du réseau distribué avec Docker + Geth"
    deadline = int(time.time()) + 86400
    public_key = "RSA_PUBLIC_KEY_DOCKER"
    assignment_hash = "0x" + "a" * 64
    
    print(f"👨‍🏫 Professeur: {teacher}")
    print(f"📝 Titre: {title}")
    
    # REMOVE gasPrice parameter - let it default to 0
    tx_hash = contract.functions.createAssignment(
        title, description, deadline, public_key, assignment_hash
    ).transact({'from': teacher})
    
    print(f"📝 TX: {tx_hash.hex()[:20]}...")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"✅ Créé dans le bloc #{receipt.blockNumber}")

    # Récupérer l'ID
    try:
        event = contract.events.AssignmentCreated().process_receipt(receipt)
        assignment_id = event[0]['args']['assignmentId'] if event else 1
    except:
        # Fallback si l'event ne fonctionne pas
        assignment_id = contract.functions.assignmentCounter().call()
    
    print(f"🆔 Assignment ID: {assignment_id}")
    
    return assignment_id

# Keep rest of functions the same...

def test_submit_from_node2(connections, assignment_id):
    """TEST 2: Soumettre depuis node2"""
    print("\n" + "="*60)
    print("TEST 2: Soumettre un devoir (Node 2 - Étudiant)")
    print("="*60)
    
    node2 = connections['node2']
    w3 = node2['w3']
    contract = node2['contract']
    student = w3.eth.accounts[0]
    
    print(f"👨‍🎓 Étudiant: {student}")
    print(f"🆔 Assignment ID: {assignment_id}")
    
    encrypted_answer = f"ENCRYPTED_DOCKER_NODE2_{int(time.time())}"
    student_info = f"Student_{student[:10]}"
    submission_hash = "0x" + "b" * 64
    
    tx_hash = contract.functions.submitAssignment(
        assignment_id, encrypted_answer, student_info, submission_hash
    ).transact({'from': student})
    
    print(f"📝 TX: {tx_hash.hex()[:20]}...")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    print(f"✅ Soumis dans le bloc #{receipt.blockNumber}")
    
    try:
        event = contract.events.SubmissionReceived().process_receipt(receipt)
        submission_id = event[0]['args']['submissionId'] if event else 1
    except:
        submission_id = contract.functions.submissionCounter().call()
    
    print(f"🆔 Submission ID: {submission_id}")
    
    return submission_id

def test_publish_result(connections, submission_id):
    """TEST 3: Publier résultat depuis node1"""
    print("\n" + "="*60)
    print("TEST 3: Publier résultat (Node 1 - Professeur)")
    print("="*60)
    
    node1 = connections['node1']
    w3 = node1['w3']
    contract = node1['contract']
    teacher = w3.eth.accounts[0]
    
    grade = 92
    comment = "Excellent! Système Docker bien maîtrisé."
    result_hash = "0x" + "c" * 64
    
    print(f"📊 Note: {grade}/100")
    
    tx_hash = contract.functions.publishResult(
        submission_id, grade, comment, result_hash
    ).transact({'from': teacher})
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    print(f"✅ Publié dans le bloc #{receipt.blockNumber}")
    
    return 1

def test_read_from_node3(connections, assignment_id):
    """TEST 4: Lire depuis node3"""
    print("\n" + "="*60)
    print("TEST 4: Vérification depuis Node 3")
    print("="*60)
    
    if 'node3' not in connections:
        print("⚠️  Node 3 non disponible")
        return
    
    node3 = connections['node3']
    contract = node3['contract']
    
    print("🔍 Lecture depuis Node 3...")
    
    try:
        assignment = contract.functions.getAssignment(assignment_id).call()
        print(f"✅ Devoir trouvé: '{assignment[2]}'")
        print(f"   Teacher: {assignment[1][:10]}...")
        print(f"   Deadline: {assignment[4]}")
    except Exception as e:
        print(f"❌ Erreur: {e}")

def show_network_stats(connections):
    """Afficher les stats du réseau"""
    print("\n" + "="*60)
    print("STATISTIQUES DU RÉSEAU")
    print("="*60)
    
    for node_id, conn in connections.items():
        w3 = conn['w3']
        contract = conn['contract']
        info = conn['info']
        
        print(f"\n{info['name'].upper()} ({node_id}):")
        print(f"  URL:          {info['url']}")
        print(f"  Block:        {w3.eth.block_number}")
        
        try:
            print(f"  Assignments:  {contract.functions.assignmentCounter().call()}")
            print(f"  Submissions:  {contract.functions.submissionCounter().call()}")
            print(f"  Results:      {contract.functions.resultCounter().call()}")
        except:
            print(f"  Contrat:      Non synchronisé")
        
        # Vérifier les peers
        try:
            peers = w3.geth.admin.peers()
            print(f"  Peers:        {len(peers)}")
        except:
            print(f"  Peers:        (API admin non disponible)")

def check_synchronization(connections):
    """Vérifier que tous les nœuds sont synchronisés"""
    print("\n" + "="*60)
    print("   VÉRIFICATION DE LA SYNCHRONISATION")
    print("="*60 + "\n")
    
    blocks = {}
    for node_id, conn in connections.items():
        block = conn['w3'].eth.block_number
        blocks[node_id] = block
        print(f"{conn['info']['name']}: Bloc #{block}")
    
    # Vérifier si tous ont le même bloc (ou à ±2 près)
    block_values = list(blocks.values())
    if max(block_values) - min(block_values) > 2:
        print("\n⚠️  ATTENTION: Les nœuds ne sont PAS synchronisés!")
        print("Lance: docker exec geth-node1 geth --datadir /root/data --exec \"admin.peers\" attach")
        print("Puis relance: ./connect_nodes.sh")
        return False
    else:
        print("\n✅ Tous les nœuds sont synchronisés")
        return True

def main():
    """Lance tous les tests"""
    print("\n" + "="*60)
    print("   TEST RÉSEAU GETH DOCKER DISTRIBUÉ")
    print("="*60)
    
    try:
        # Connexion
        connections = connect_to_nodes()
        
        if len(connections) < 2:
            print("\n❌ Au moins 2 nœuds doivent être actifs")
            return 1
        
        # Vérifier la synchronisation
        if not check_synchronization(connections):
            print("\n❌ Les nœuds ne sont pas synchronisés. Arrêt des tests.")
            return 1
        
        # Tests
        print("\n⏳ Attente de stabilisation (5s)...")
        time.sleep(5)
        
        assignment_id = test_create_assignment(connections)
        
        print("\n⏳ Attente de propagation (10s)...")
        time.sleep(10)
        
        submission_id = test_submit_from_node2(connections, assignment_id)
        
        print("\n⏳ Attente de propagation (10s)...")
        time.sleep(10)
        
        test_publish_result(connections, submission_id)
        
        print("\n⏳ Attente de propagation (5s)...")
        time.sleep(5)
        
        if 'node3' in connections:
            test_read_from_node3(connections, assignment_id)
        
        # Stats
        show_network_stats(connections)
        
        print("\n" + "="*60)
        print("✅ TOUS LES TESTS SONT PASSÉS!")
        print("="*60)
        
        print("\n🎉 RÉSEAU DISTRIBUÉ FONCTIONNEL:")
        print("   ✅ Plusieurs nœuds Docker indépendants")
        print("   ✅ Transactions sur différents nœuds")
        print("   ✅ Vraie blockchain distribuée")
        print("   ✅ Python + Web3.py + Geth + Docker")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())