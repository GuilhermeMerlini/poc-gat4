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
        # 1. Monta a string do endereço lendo as colunas da tua aba DM
        rua = p.get('Endereço_Rua', '')
        numero = p.get('Endereço_Número', '')
        
        # Adiciona a cidade fixa para garantir a precisão do Geopy
        endereco_busca = f"{rua}, {numero}, Porto Alegre, RS"

        # 2. O Filtro de Cache
        if endereco_busca in cache_coordenadas:
            # Se o endereço já tá no cache, puxa instantaneamente
            lat, lng = cache_coordenadas[endereco_busca]
        else:
            # Se é a primeira vez vendo esse endereço, bate na API
            try:
                location = geolocator.geocode(endereco_busca)
                if location:
                    lat, lng = location.latitude, location.longitude
                else:
                    lat, lng = None, None

                # Salva no cache pra não ter que buscar de novo
                cache_coordenadas[endereco_busca] = (lat, lng)
                
                # O sleep obrigatório pra não tomar ban do Nominatim
                time.sleep(1) 
            except Exception as e:
                print(f"Erro no Geopy para {endereco_busca}: {e}")
                lat, lng = None, None

        # 3. Prepara o dicionário final
        # O método .copy() clona todos os dados originais (CNS, Exames, etc)
        p_atualizado = p.copy()
        
        # Injetamos as três chaves exatas que o teu script.js tá esperando
        p_atualizado['Endereço'] = endereco_busca
        p_atualizado['Latitude'] = lat
        p_atualizado['Longitude'] = lng

        pacientes_prontos.append(p_atualizado)

    return JsonResponse(pacientes_prontos, safe=False)
    
@require_POST
def api_atualizar_multiplos(request):
    try:
        # 1. Lê o pacotão JSON que veio do fetch do JavaScript
        dados = json.loads(request.body)
        
        cns = dados.get('cns')
        campos = dados.get('campos') # Isso aqui recebe o objeto { 'Campo1': 'Valor1', 'Campo2': 'Valor2' }
        
        # Validação básica de segurança
        if not cns or not campos:
            return JsonResponse({
                "status": "erro", 
                "mensagem": "Parâmetros incompletos. CNS ou campos ausentes."
            }, status=400)
        
        # 2. Dispara a função do teu motor do Google Sheets
        sucesso, mensagem = atualizar_multiplos_campos_por_cns(cns, campos)
        
        if sucesso:
            return JsonResponse({"status": "sucesso", "mensagem": mensagem})
        else:
            # Se der erro na busca do CNS ou na API do Google, devolve o erro estruturado em JSON
            return JsonResponse({"status": "erro", "mensagem": mensagem}, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({"status": "erro", "mensagem": "O corpo da requisição não é um JSON válido."}, status=400)
    except Exception as e:
        # Se qualquer outra coisa explodir no Python, captura aqui para não quebrar o front-end
        return JsonResponse({"status": "erro", "mensagem": f"Erro interno no servidor: {str(e)}"}, status=500)