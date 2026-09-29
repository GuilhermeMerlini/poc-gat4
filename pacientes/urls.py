from django.urls import path
from . import views

urlpatterns = [
    path('mapa/', views.mapa_pacientes, name='mapa_pacientes'),
    
    path('api/dados/', views.api_dados_pacientes, name='api_dados_pacientes'),

    path('api/atualizar-multiplos/', views.api_atualizar_multiplos, name='api_atualizar_multiplos')
]