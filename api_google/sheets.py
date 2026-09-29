import gspread
from oauth2client.service_account import ServiceAccountCredentials 
import os
from django.conf import settings


def extrair_cabecalhos_dm(valores_da_planilha):
    cabecalhos = []
    indice_cabecalho = -1

    for i, linha in enumerate(valores_da_planilha):
        if "CNS" in linha:
            indice_cabecalho = i
            break

    if indice_cabecalho != -1:
        linha_cima = valores_da_planilha[indice_cabecalho]
        linha_baixo = valores_da_planilha[indice_cabecalho + 1]
        
        macro_atual = ""
        
        for j in range(len(linha_cima)):
            cel_cima = linha_cima[j].strip()
            
            cel_baixo = linha_baixo[j].strip() if j < len(linha_baixo) else ""
            
            if cel_cima != "":
                macro_atual = cel_cima
                
            if cel_baixo != "":
                nome_coluna = f"{macro_atual}_{cel_baixo}"
            else:
                nome_coluna = macro_atual
                
            cabecalhos.append(nome_coluna)

    return cabecalhos

def extrair_cabecalhos_pe(valores_da_planilha):
    cabecalhos = []
    
    cabecalhos.append("CNS")
    cabecalhos.append("Estabelecimento que cadastrou vínculo (pac-prog saúde)")
    cabecalhos.append("Tipo de diabetes")
    cabecalhos.append("Data de validade do laudo")
    cabecalhos.append("2º QUADRI (maio-agosto)")
    cabecalhos.append("3º QUADRI (setembro-dezembro)")

    return cabecalhos

def obter_dados_pacientes():
    scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
    ]
    caminho_credenciais = os.path.join(settings.BASE_DIR, 'data', 'credentials.json')
    credentials = ServiceAccountCredentials.from_json_keyfile_name(caminho_credenciais, scopes=scopes)
    file = gspread.authorize(credentials)
    SHEET_ID = "1ADZgEZk3EXFOQ9HUkkTZJtBhEFqQ85polBRVei5uC3k"
    workbook = file.open_by_key(SHEET_ID)
    aba_dm = workbook.worksheet("DM")
    aba_pe = workbook.worksheet("Exame pé diabético")

    cabecalhos_dm = extrair_cabecalhos_dm(aba_dm.get_all_values())
    cabecalhos_pe = extrair_cabecalhos_pe(aba_pe.get_all_values())

    valores_dm = aba_dm.get_all_values()
    valores_pe = aba_pe.get_all_values()

    pacientes_master = {}

    for linha in valores_dm[2:]:
        if len(linha) < 3 or not str(linha[2]).strip():
            continue

        tamanho_faltante = len(cabecalhos_dm) - len(linha)
        if tamanho_faltante > 0:
            linha.extend([""] * tamanho_faltante)

        paciente = dict(zip(cabecalhos_dm, linha))

        chaves_extras_pe = cabecalhos_pe[1:]
        
        for chave in chaves_extras_pe:
            paciente[chave] = None
        
        cns = paciente.get("CNS")
        if cns:
            pacientes_master[cns] = paciente

    indices_pe = {
        2: cabecalhos_pe[0],   # CNS
        9: cabecalhos_pe[1],   # Estabelecimento...
        10: cabecalhos_pe[2],  # Tipo de diabetes
        11: cabecalhos_pe[3],  # Data de validade...
        12: cabecalhos_pe[4],  # 2º QUADRI
        13: cabecalhos_pe[5]   # 3º QUADRI
    }

    for linha in valores_pe[4:]:
        if len(linha) <= 2 or not str(linha[2]).strip():
            continue

        dados_pe = {}
        
        for idx, nome_coluna in indices_pe.items():
            valor = linha[idx].strip() if idx < len(linha) else ""
            dados_pe[nome_coluna] = valor

        cns_pe = dados_pe.get("CNS")

        if cns_pe and cns_pe in pacientes_master:
            pacientes_master[cns_pe].update(dados_pe)

    pacientes_final = list(pacientes_master.values())

    return pacientes_final

def atualizar_multiplos_campos_por_cns(cns, dicionario_campos):
    scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
    ]

    caminho_credenciais = os.path.join(settings.BASE_DIR, 'data', 'credentials.json')
    credentials = ServiceAccountCredentials.from_json_keyfile_name(caminho_credenciais, scopes=scopes)
    file = gspread.authorize(credentials)
    SHEET_ID = "1ADZgEZk3EXFOQ9HUkkTZJtBhEFqQ85polBRVei5uC3k"
    workbook = file.open_by_key(SHEET_ID)
    
    aba_dm = workbook.worksheet("DM")
    valores_dm = aba_dm.get_all_values()
    cabecalhos_dm = extrair_cabecalhos_dm(valores_dm)
    
    idx_coluna_cns = cabecalhos_dm.index("CNS")
    linha_idx = None
    for i, linha in enumerate(valores_dm):
        if len(linha) > idx_coluna_cns and str(linha[idx_coluna_cns]).strip() == str(cns):
            linha_idx = i + 1
            break
            
    if not linha_idx:
        return False, "Paciente não encontrado."
        
    for nome_campo, novo_valor in dicionario_campos.items():
        if nome_campo in cabecalhos_dm:
            col_idx = cabecalhos_dm.index(nome_campo) + 1
            aba_dm.update_cell(linha_idx, col_idx, novo_valor)
            
    return True, "Todos os campos atualizados."
