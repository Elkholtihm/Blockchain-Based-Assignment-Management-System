from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import User
from blockchain.interact import create_user_account, fund_new_user
from blockchain.utils import encrypt_private_key
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_blockchain_profile(sender, instance, created, **kwargs):
    """
    Automatically create blockchain profile when a new User is created
    Only for professors and students (not admins)
    """
    
    # Only for NEW users who are professors or students
    if created and instance.role.rolename in ['professor', 'student']:
        
        # Check if already has blockchain profile
        if instance.has_blockchain_profile:
            logger.info(f"Blockchain profile already exists for {instance.email}")
            return
        
        try:
            logger.info(f"Creating blockchain profile for {instance.email} ({instance.role.rolename})")
            
            # Step 1: Create blockchain account
            account_result = create_user_account()
            
            if not account_result['success']:
                logger.error(f"Failed to create blockchain account: {account_result.get('error')}")
                return
            
            # Step 2: Encrypt the private key
            encrypted_key = encrypt_private_key(account_result['private_key'])
            
            # Step 3: Update User model with blockchain info
            instance.wallet_address = account_result['address']
            instance.encrypted_private_key = encrypted_key
            instance.blockchain_profile_created_at = timezone.now()
            instance.save(update_fields=['wallet_address', 'encrypted_private_key', 'blockchain_profile_created_at'])
            
            logger.info(f"✅ Blockchain profile created for {instance.email}")
            logger.info(f"   Wallet address: {account_result['address']}")
            
            # Step 4: Fund the account
            try:
                fund_result = fund_new_user(account_result['address'], amount_eth=1000.0)
                if fund_result['success']:
                    logger.info(f"✅ Account funded with 1000 ETH")
                else:
                    logger.warning(f"Failed to fund account: {fund_result.get('error')}")
            except Exception as e:
                logger.warning(f"Funding failed (non-critical): {e}")
            
        except Exception as e:
            logger.error(f"❌ Error creating blockchain profile for {instance.email}: {e}")