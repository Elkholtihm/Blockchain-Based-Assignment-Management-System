from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('blocknet.urls')),  # Replace 'blocknet' with actual app name
]