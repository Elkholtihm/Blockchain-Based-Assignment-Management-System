from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone
from blocknet.models import User
from blockchain.interact import create_user_account, fund_new_user
from blockchain.utils import encrypt_private_key


class Command(BaseCommand):
    help = 'Create blockchain profiles for all users without one'

    def handle(self, *args, **options):
        # Get users without blockchain profiles
        users_without_profiles = User.objects.filter(
                    role__rolename__in=['professor', 'student']
                ).filter(
                    Q(wallet_address__isnull=True) | Q(wallet_address='') | 
                    Q(encrypted_private_key__isnull=True) | Q(encrypted_private_key='')
                )

        count = users_without_profiles.count()
        self.stdout.write(f"\nFound {count} users without blockchain profiles\n")

        for user in users_without_profiles:
            try:
                self.stdout.write(f"Creating profile for {user.email}...")
                
                account = create_user_account()
                encrypted_key = encrypt_private_key(account['private_key'])
                
                # Update User model
                user.wallet_address = account['address']
                user.encrypted_private_key = encrypted_key
                user.blockchain_profile_created_at = timezone.now()
                user.save(update_fields=['wallet_address', 'encrypted_private_key', 'blockchain_profile_created_at'])
                fund_new_user(account['address'], 1000.0)
                
                self.stdout.write(self.style.SUCCESS(f"Created for {user.email}"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed for {user.email}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"\n✅ Done!"))