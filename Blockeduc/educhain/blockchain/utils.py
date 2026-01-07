from cryptography.fernet import Fernet
from django.conf import settings

def decrypt_private_key(encrypted_key):
    """Decrypt user's private key from database"""
    if not encrypted_key:
        raise ValueError("No encrypted key provided")
    
    try:
        cipher = Fernet(settings.BLOCKCHAIN_ENCRYPTION_KEY.encode())
        return cipher.decrypt(encrypted_key.encode()).decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt private key: {e}")

def encrypt_private_key(private_key):
    """Encrypt private key before storing in database"""
    if not private_key:
        raise ValueError("No private key provided")
    
    try:
        cipher = Fernet(settings.BLOCKCHAIN_ENCRYPTION_KEY.encode())
        return cipher.encrypt(private_key.encode()).decode()
    except Exception as e:
        raise ValueError(f"Failed to encrypt private key: {e}")