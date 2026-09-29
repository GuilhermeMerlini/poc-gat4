# PetSaúde - Mapeamento de Pacientes

Este projeto é uma aplicação web (Django) desenvolvida para o acompanhamento e mapeamento de pacientes. Ele possui integração com a API do Google Sheets para obtenção e sincronização dos dados e utiliza mapas interativos.

## Como rodar o projeto localmente

Siga o passo a passo abaixo para configurar e executar a aplicação na sua máquina.

### Pré-requisitos
- [Python 3.x](https://www.python.org/) instalado.
- Arquivo `credentials.json` (Service Account do Google Cloud) com acesso à planilha do projeto.

### 1. Configurar as credenciais do Google
Para que a integração com o Google Sheets funcione:
1. Crie uma pasta chamada `data` na raiz do projeto (se ela ainda não existir).
2. Coloque o arquivo `credentials.json` dentro da pasta `data/`.
*(Nota: este arquivo é ignorado pelo Git por segurança, você deve obtê-lo com os administradores do projeto).*

### 2. Criar e ativar o ambiente virtual
Recomenda-se o uso de um ambiente virtual para não causar conflitos com outras bibliotecas da sua máquina.

**No Linux/Mac:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**No Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Instalar as dependências
Com o ambiente virtual ativado, instale as bibliotecas necessárias listadas no `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Configurar o Banco de Dados
A aplicação utiliza o SQLite por padrão. Para criar as tabelas necessárias no banco de dados, execute:
```bash
python manage.py migrate
```

### 5. Iniciar o Servidor
Por fim, rode o servidor de desenvolvimento do Django:
```bash
python manage.py runserver
```

Após executar o comando, o terminal exibirá um link (geralmente `http://127.0.0.1:8000/`). Basta abrir este endereço no seu navegador para acessar o sistema!

---

**⚠️ Dúvidas comuns:**
- Se aparecer um erro de permissão no mapa ("API KEY REQUIRED"), limpe o cache do seu navegador (`Ctrl + F5` ou `Cmd + Shift + R`). O projeto foi atualizado para utilizar o OpenStreetMap gratuito.
- Nunca adicione o arquivo `credentials.json`, `db.sqlite3` ou a pasta `.venv` nos seus commits do Git. Eles já estão listados no `.gitignore`.
