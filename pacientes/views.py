from django.shortcuts import render
from django.http import JsonResponse
from api_google.sheets import atualizar_multiplos_campos_por_cns, obter_dados_pacientes
from geopy.geocoders import Nominatim
import time
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST

geolocator = Nominatim(user_agent="guilhermemerlini2307@gmail.com")
cache_coordenadas = {}


def mapa_pacientes(request):
    return render(request, 'pacientes/mapa.html')

def api_dados_pacientes(request):
    dados_brutos = obter_dados_pacientes()
    pacientes_prontos = []

    for p in dados_brutos:
        rua = p.get('Endereço_Rua', '')
        numero = p.get('Endereço_Número', '')
        
        endereco_busca = f"{rua}, {numero}, Porto Alegre, RS"

        if endereco_busca in cache_coordenadas:
            lat, lng = cache_coordenadas[endereco_busca]
        else:
            try:
                location = geolocator.geocode(endereco_busca)
                if location:
                    lat, lng = location.latitude, location.longitude
                else:
                    lat, lng = None, None

                cache_coordenadas[endereco_busca] = (lat, lng)
                
                time.sleep(1) 
            except Exception as e:
                print(f"Erro no Geopy para {endereco_busca}: {e}")
                lat, lng = None, None

        p_atualizado = p.copy()

        p_atualizado['Endereço'] = endereco_busca
        p_atualizado['Latitude'] = lat
        p_atualizado['Longitude'] = lng

        pacientes_prontos.append(p_atualizado)

    return JsonResponse(pacientes_prontos, safe=False)
    
@require_POST
def api_atualizar_multiplos(request):
    try:
        dados = json.loads(request.body)
        
        cns = dados.get('cns')
        campos = dados.get('campos')
        
        if not cns or not campos:
            return JsonResponse({
                "status": "erro", 
                "mensagem": "Parâmetros incompletos. CNS ou campos ausentes."
            }, status=400)
        
        sucesso, mensagem = atualizar_multiplos_campos_por_cns(cns, campos)
        
        if sucesso:
            return JsonResponse({"status": "sucesso", "mensagem": mensagem})
        else:
            return JsonResponse({"status": "erro", "mensagem": mensagem}, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({"status": "erro", "mensagem": "O corpo da requisição não é um JSON válido."}, status=400)
    except Exception as e:
        return JsonResponse({"status": "erro", "mensagem": f"Erro interno no servidor: {str(e)}"}, status=500)