from django.urls import path
from . import views

urlpatterns = [
    # A rota visual que o enfermeiro acessa no navegador
    path('mapa/', views.mapa_pacientes, name='mapa_pacientes'),
    
    # A rota invisível que o teu JavaScript vai chamar nos bastidores
    path('api/dados/', views.api_dados_pacientes, name='api_dados_pacientes'),

    path('api/atualizar-multiplos/', views.api_atualizar_multiplos, name='api_atualizar_multiplos')
]