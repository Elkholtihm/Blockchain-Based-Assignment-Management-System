from django.apps import AppConfig


class BlocknetConfig(AppConfig):
    name = 'blocknet'
    #------------hamza----------------
    default_auto_field = 'django.db.models.BigAutoField'
    def ready(self):
        # Import signals to register them
        import blocknet.signals
