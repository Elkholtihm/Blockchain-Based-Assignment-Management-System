"""
Blockchain Interaction Layer for Django Backend
All functions for blockchain operations
"""

from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# ===== CONFIGURATION =====
NODE_URL = "http://localhost:8545"
CONTRACT_PATH = Path(__file__).parent / "compiled" / "AssignmentSystem.json"

# Funded accounts (from your 3 nodes - unlimited funds)
FUNDING_ACCOUNTS = [
    {
        'address': '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
        'password': 'elkholtihm2002'
    },
    {
        'address': '0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF',
        'password': 'elkholtihm2002'
    },
    {
        'address': '0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69',
        'password': 'elkholtihm2002'
    }
]

# ===== HELPER FUNCTIONS =====
def _get_web3():
    """Get Web3 instance with PoA middleware"""
    w3 = Web3(Web3.HTTPProvider(NODE_URL))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    return w3


def _get_contract():
    """Load smart contract"""
    w3 = _get_web3()
    
    with open(CONTRACT_PATH, 'r') as f:
        contract_data = json.load(f)
    
    contract = w3.eth.contract(
        address=contract_data['contract_address'],
        abi=contract_data['abi']
    )
    
    return w3, contract


def _sign_and_send_transaction(w3: Web3, tx: dict, private_key: str) -> Dict:
    """Sign transaction with private key and send"""
    try:
        # Sign transaction
        account = Account.from_key(private_key)
        signed_tx = account.sign_transaction(tx)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
        
        return {
            'success': True,
            'tx_hash': tx_hash.hex(),
            'block_number': receipt.blockNumber,
            'gas_used': receipt.gasUsed
        }
        
    except Exception as e:
        logger.error(f"Transaction failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ===== ACCOUNT MANAGEMENT =====
def create_user_account() -> Dict:
    """
    Create new blockchain account for user (teacher or student)
    
    Returns:
        {
            'success': bool,
            'address': str,           # Ethereum address (store in DB)
            'private_key': str,       # Private key (encrypt and store in DB)
            'error': str (if failed)
        }
    
    Usage in Django:
        result = create_user_account()
        if result['success']:
            UserProfile.objects.create(
                user=request.user,
                ethereum_address=result['address'],
                encrypted_private_key=encrypt(result['private_key'])
            )
    """
    try:
        # Generate new account
        account = Account.create()
        
        logger.info(f"New account created: {account.address}")
        
        return {
            'success': True,
            'address': account.address,
            'private_key': account.key.hex()
        }
        
    except Exception as e:
        logger.error(f"Failed to create account: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_account_balance(address: str) -> Dict:
    """
    Get account balance in ETH
    
    Args:
        address: Ethereum address
        
    Returns:
        {
            'success': bool,
            'balance': float,  # Balance in ETH
            'balance_wei': int,  # Balance in Wei
            'error': str (if failed)
        }
    """
    try:
        w3 = _get_web3()
        balance_wei = w3.eth.get_balance(address)
        balance_eth = w3.from_wei(balance_wei, 'ether')
        
        return {
            'success': True,
            'balance': float(balance_eth),
            'balance_wei': balance_wei
        }
        
    except Exception as e:
        logger.error(f"Failed to get balance: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def fund_new_user(user_address: str, amount_eth: float = 1000.0) -> Dict:
    """
    Send ETH to new user from funding account
    """
    try:
        w3 = _get_web3()
        
        # Use first funding account with its PRIVATE KEY
        funding_account = FUNDING_ACCOUNTS[0]
        
        # Import private key (from your setup - these are the deterministic keys)
        funding_private_keys = {
            '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf': '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF': '0x0000000000000000000000000000000000000000000000000000000000000002',
            '0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69': '0x0000000000000000000000000000000000000000000000000000000000000003'
        }
        
        from_address = funding_account['address']
        private_key = funding_private_keys[from_address]
        
        # Build transaction
        tx = {
            'from': from_address,
            'to': user_address,
            'value': w3.to_wei(amount_eth, 'ether'),
            'gas': 21000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(from_address),
            'chainId': 1337
            }
        
        # Sign and send
        account = Account.from_key(private_key)
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        # Get new balance
        new_balance = w3.from_wei(w3.eth.get_balance(user_address), 'ether')
        
        logger.info(f"Funded {user_address} with {amount_eth} ETH")
        
        return {
            'success': True,
            'tx_hash': tx_hash.hex(),
            'balance': float(new_balance)
        }
        
    except Exception as e:
        logger.error(f"Failed to fund account: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def refund_user_if_needed(user_address: str, min_balance: float = 10.0) -> Dict:
    """
    Check user balance and refund if below threshold
    
    Args:
        user_address: User's Ethereum address
        min_balance: Minimum balance threshold (default: 10 ETH)
        
    Returns:
        {
            'success': bool,
            'refunded': bool,  # True if refund was needed
            'balance': float,  # Current balance after check
            'error': str (if failed)
        }
    
    Usage in Django:
        # Before student submits assignment
        refund_user_if_needed(student.ethereum_address, min_balance=5.0)
    """
    try:
        # Check balance
        balance_result = get_account_balance(user_address)
        
        if not balance_result['success']:
            return balance_result
        
        current_balance = balance_result['balance']
        
        # Refund if needed
        if current_balance < min_balance:
            refund_amount = 100.0  # Add 100 ETH
            fund_result = fund_new_user(user_address, refund_amount)
            
            if fund_result['success']:
                logger.info(f"Refunded {user_address}: {refund_amount} ETH")
                return {
                    'success': True,
                    'refunded': True,
                    'balance': fund_result['balance']
                }
            else:
                return fund_result
        
        return {
            'success': True,
            'refunded': False,
            'balance': current_balance
        }
        
    except Exception as e:
        logger.error(f"Failed to check/refund account: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ===== ASSIGNMENT FUNCTIONS =====

def create_assignment(
    teacher_address: str,
    teacher_private_key: str,
    title: str,
    description: str,
    deadline_timestamp: int,
    rsa_public_key: str,
    assignment_file_hash: str
) -> Dict:
    """
    Teacher creates new assignment
    
    Args:
        teacher_address: Teacher's Ethereum address (from DB)
        teacher_private_key: Teacher's private key (decrypt from DB)
        title: Assignment title
        description: Assignment description
        deadline_timestamp: Unix timestamp
        rsa_public_key: Teacher's RSA public key
        assignment_file_hash: SHA256 hash of assignment file
        
    Returns:
        {
            'success': bool,
            'assignment_id': int,
            'tx_hash': str,
            'block_number': int,
            'error': str (if failed)
        }
    
    Usage in Django:
        assignment_hash = hashlib.sha256(assignment_file.read()).hexdigest()
        result = create_assignment(
            teacher_address=teacher.profile.ethereum_address,
            teacher_private_key=decrypt(teacher.profile.private_key),
            title=request.POST['title'],
            description=request.POST['description'],
            deadline_timestamp=int(deadline.timestamp()),
            rsa_public_key=teacher.profile.rsa_public_key,
            assignment_file_hash=assignment_hash
        )
    """
    try:
        w3, contract = _get_contract()
        
        # Format hash
        if not assignment_file_hash.startswith('0x'):
            assignment_file_hash = '0x' + assignment_file_hash
        
        # Build transaction
        tx = contract.functions.createAssignment(
            title,
            description,
            deadline_timestamp,
            rsa_public_key,
            assignment_file_hash
        ).build_transaction({
            'from': teacher_address,
            'gas': 4000000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(teacher_address)
        })
        
        # Sign and send
        result = _sign_and_send_transaction(w3, tx, teacher_private_key)
        
        if result['success']:
            # Get assignment ID
            assignment_id = contract.functions.assignmentCounter().call()
            
            logger.info(f"Assignment created: ID={assignment_id}")
            
            return {
                'success': True,
                'assignment_id': assignment_id,
                'tx_hash': result['tx_hash'],
                'block_number': result['block_number']
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to create assignment: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_assignment(assignment_id: int) -> Dict:
    """
    Get assignment details
    
    Args:
        assignment_id: Assignment ID
        
    Returns:
        {
            'success': bool,
            'id': int,
            'teacher': str,
            'title': str,
            'description': str,
            'deadline': int,
            'public_key': str,
            'assignment_hash': str,
            'is_active': bool,
            'error': str (if failed)
        }
    """
    try:
        _, contract = _get_contract()
        data = contract.functions.getAssignment(assignment_id).call()
        
        return {
            'success': True,
            'id': data[0],
            'teacher': data[1],
            'title': data[2],
            'description': data[3],
            'deadline': data[4],
            'public_key': data[5],
            'assignment_hash': data[6],
            'is_active': data[7]
        }
        
    except Exception as e:
        logger.error(f"Failed to get assignment: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_all_assignments() -> Dict:
    """
    Get all assignments
    
    Returns:
        {
            'success': bool,
            'assignments': List[Dict],
            'count': int,
            'error': str (if failed)
        }
    """
    try:
        _, contract = _get_contract()
        count = contract.functions.assignmentCounter().call()
        
        assignments = []
        for i in range(1, count + 1):
            assignment = get_assignment(i)
            if assignment['success']:
                assignments.append(assignment)
        
        return {
            'success': True,
            'assignments': assignments,
            'count': len(assignments)
        }
        
    except Exception as e:
        logger.error(f"Failed to get assignments: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_assignment_submissions(assignment_id: int) -> Dict:
    """
    Get all submissions for assignment
    
    Args:
        assignment_id: Assignment ID
        
    Returns:
        {
            'success': bool,
            'submission_ids': List[int],
            'count': int,
            'error': str (if failed)
        }
    """
    try:
        _, contract = _get_contract()
        submission_ids = contract.functions.getAssignmentSubmissions(assignment_id).call()
        
        return {
            'success': True,
            'submission_ids': list(submission_ids),
            'count': len(submission_ids)
        }
        
    except Exception as e:
        logger.error(f"Failed to get submissions: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ===== SUBMISSION FUNCTIONS =====
def submit_assignment(
    student_address: str,
    student_private_key: str,
    assignment_id: int,
    encrypted_answer: str,
    student_name: str,
    submission_file_hash: str
) -> Dict:
    """
    Student submits assignment
    
    Args:
        student_address: Student's Ethereum address (from DB)
        student_private_key: Student's private key (decrypt from DB)
        assignment_id: Assignment ID
        encrypted_answer: RSA-encrypted answer
        student_name: Student's name/ID
        submission_file_hash: SHA256 hash of submission
        
    Returns:
        {
            'success': bool,
            'submission_id': int,
            'tx_hash': str,
            'block_number': int,
            'timestamp': int,
            'error': str (if failed)
        }
    
    Usage in Django:
        # Encrypt answer with teacher's public key
        encrypted = rsa_encrypt(answer, teacher.rsa_public_key)
        submission_hash = hashlib.sha256(answer.encode()).hexdigest()
        
        result = submit_assignment(
            student_address=student.profile.ethereum_address,
            student_private_key=decrypt(student.profile.private_key),
            assignment_id=assignment_id,
            encrypted_answer=encrypted,
            student_name=student.get_full_name(),
            submission_file_hash=submission_hash
        )
    """
    try:
        # Auto-refund if needed
        refund_user_if_needed(student_address, min_balance=5.0)
        
        w3, contract = _get_contract()
        
        # Format hash
        if not submission_file_hash.startswith('0x'):
            submission_file_hash = '0x' + submission_file_hash
        
        # Build transaction
        tx = contract.functions.submitAssignment(
            assignment_id,
            encrypted_answer,
            student_name,
            submission_file_hash
        ).build_transaction({
            'from': student_address,
            'gas': 3000000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(student_address)
        })
        
        # Sign and send
        result = _sign_and_send_transaction(w3, tx, student_private_key)
        
        if result['success']:
            # Get submission ID
            submission_id = contract.functions.submissionCounter().call()
            timestamp = w3.eth.get_block(result['block_number']).timestamp
            
            logger.info(f"Submission created: ID={submission_id}")
            
            return {
                'success': True,
                'submission_id': submission_id,
                'tx_hash': result['tx_hash'],
                'block_number': result['block_number'],
                'timestamp': timestamp
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to submit assignment: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_submission(submission_id: int) -> Dict:
    """
    Get submission details
    
    Args:
        submission_id: Submission ID
        
    Returns:
        {
            'success': bool,
            'id': int,
            'assignment_id': int,
            'student': str,
            'encrypted_answer': str,
            'student_info': str,
            'submission_hash': str,
            'timestamp': int,
            'is_graded': bool,
            'error': str (if failed)
        }
    """
    try:
        _, contract = _get_contract()
        data = contract.functions.getSubmission(submission_id).call()
        
        return {
            'success': True,
            'id': data[0],
            'assignment_id': data[1],
            'student': data[2],
            'encrypted_answer': data[3],
            'student_info': data[4],
            'submission_hash': data[5],
            'timestamp': data[6],
            'is_graded': data[7]
        }
        
    except Exception as e:
        logger.error(f"Failed to get submission: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_student_submissions(student_address: str) -> Dict:
    """
    Get all submissions by student
    
    Args:
        student_address: Student's Ethereum address
        
    Returns:
        {
            'success': bool,
            'submission_ids': List[int],
            'count': int,
            'error': str (if failed)
        }
    """
    try:
        _, contract = _get_contract()
        submission_ids = contract.functions.getStudentSubmissions(student_address).call()
        
        return {
            'success': True,
            'submission_ids': list(submission_ids),
            'count': len(submission_ids)
        }
        
    except Exception as e:
        logger.error(f"Failed to get student submissions: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ===== GRADING FUNCTIONS =====

def publish_result(
    teacher_address: str,
    teacher_private_key: str,
    submission_id: int,
    grade: int,
    comment: str,
    result_file_hash: str
) -> Dict:
    """
    Teacher publishes grading result
    
    Args:
        teacher_address: Teacher's Ethereum address (from DB)
        teacher_private_key: Teacher's private key (decrypt from DB)
        submission_id: Submission ID
        grade: Grade (0-100)
        comment: Grading comment
        result_file_hash: SHA256 hash of result details
        
    Returns:
        {
            'success': bool,
            'result_id': int,
            'tx_hash': str,
            'block_number': int,
            'error': str (if failed)
        }
    
    Usage in Django:
        result_hash = hashlib.sha256(f"{grade}{comment}".encode()).hexdigest()
        result = publish_result(
            teacher_address=teacher.profile.ethereum_address,
            teacher_private_key=decrypt(teacher.profile.private_key),
            submission_id=submission_id,
            grade=85,
            comment="Good work!",
            result_file_hash=result_hash
        )
    """
    try:
        w3, contract = _get_contract()
        
        # Format hash
        if not result_file_hash.startswith('0x'):
            result_file_hash = '0x' + result_file_hash
        
        # Build transaction
        tx = contract.functions.publishResult(
            submission_id,
            grade,
            comment,
            result_file_hash
        ).build_transaction({
            'from': teacher_address,
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(teacher_address)
        })
        
        # Sign and send
        result = _sign_and_send_transaction(w3, tx, teacher_private_key)
        
        if result['success']:
            # Get result ID
            result_id = contract.functions.resultCounter().call()
            
            logger.info(f"Result published: ID={result_id}")
            
            return {
                'success': True,
                'result_id': result_id,
                'tx_hash': result['tx_hash'],
                'block_number': result['block_number']
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to publish result: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_result(result_id: int) -> Dict:
    """
    Get result details
    
    Args:
        result_id: Result ID
        
    Returns:
        {
            'success': bool,
            'id': int,
            'submission_id': int,
            'grade': int,
            'comment': str,
            'result_hash': str,
            'timestamp': int,
            'error': str (if failed)
        }
    """
    try:
        _, contract = _get_contract()
        data = contract.functions.getResult(result_id).call()
        
        return {
            'success': True,
            'id': data[0],
            'submission_id': data[1],
            'grade': data[2],
            'comment': data[3],
            'result_hash': data[4],
            'timestamp': data[5]
        }
        
    except Exception as e:
        logger.error(f"Failed to get result: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_submission_result(submission_id: int) -> Dict:
    """
    Get result for specific submission
    
    Args:
        submission_id: Submission ID
        
    Returns:
        Same as get_result() or None if not graded yet
    """
    try:
        _, contract = _get_contract()
        result_id = contract.functions.submissionResults(submission_id).call()
        
        if result_id > 0:
            return get_result(result_id)
        
        return {
            'success': True,
            'graded': False,
            'message': 'Submission not graded yet'
        }
        
    except Exception as e:
        logger.error(f"Failed to get submission result: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ===== ADMIN/INFO FUNCTIONS =====

def get_blockchain_info() -> Dict:
    """
    Get blockchain network info
    
    Returns:
        {
            'success': bool,
            'connected': bool,
            'chain_id': int,
            'block_number': int,
            'contract_address': str,
            'assignment_count': int,
            'submission_count': int,
            'result_count': int,
            'error': str (if failed)
        }
    """
    try:
        w3, contract = _get_contract()
        
        return {
            'success': True,
            'connected': w3.is_connected(),
            'chain_id': w3.eth.chain_id,
            'block_number': w3.eth.block_number,
            'contract_address': contract.address,
            'assignment_count': contract.functions.assignmentCounter().call(),
            'submission_count': contract.functions.submissionCounter().call(),
            'result_count': contract.functions.resultCounter().call()
        }
        
    except Exception as e:
        logger.error(f"Failed to get blockchain info: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_transaction_receipt(tx_hash: str) -> Dict:
    """
    Get transaction details
    
    Args:
        tx_hash: Transaction hash
        
    Returns:
        {
            'success': bool,
            'block_number': int,
            'gas_used': int,
            'status': int,  # 1 = success, 0 = failed
            'error': str (if failed)
        }
    """
    try:
        w3 = _get_web3()
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        
        return {
            'success': True,
            'block_number': receipt.blockNumber,
            'gas_used': receipt.gasUsed,
            'status': receipt.status
        }
        
    except Exception as e:
        logger.error(f"Failed to get transaction: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ===== TESTING FUNCTION =====

if __name__ == "__main__":
    print("=== Blockchain Interface Test ===\n")
    
    # Test 1: Get blockchain info
    print("1. Blockchain Info:")
    info = get_blockchain_info()
    print(f"   Connected: {info.get('connected')}")
    print(f"   Block: {info.get('block_number')}")
    print(f"   Assignments: {info.get('assignment_count')}\n")
    
    # Test 2: Create new account
    print("2. Create Account:")
    account = create_user_account()
    if account['success']:
        print(f"   Address: {account['address']}")
        print(f"   Private Key: {account['private_key'][:20]}...\n")
        
        # Test 3: Fund account
        print("3. Fund Account:")
        fund = fund_new_user(account['address'], 100.0)
        if fund['success']:
            print(f"   Balance: {fund['balance']} ETH\n")
        
        # Test 4: Check balance
        print("4. Check Balance:")
        balance = get_account_balance(account['address'])
        print(f"   Balance: {balance.get('balance')} ETH\n")
    
    print("=== Test Complete ===")