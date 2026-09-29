fetch('/pacientes/api/dados/') 
    .then(response => response.json())
    .then(data => {
        patientData = data;
        applyFilters();
    })
    .catch(error => console.error('Erro ao carregar dados da API:', error));

function salvarFormularioCompleto(cns) {
    const painel = document.getElementById('patientInfo');
    const inputs = painel.querySelectorAll('.edit-field');
    
    const btnSalvar = document.getElementById('btn-salvar-tudo');
    const btnEditar = document.getElementById('btn-toggle-edit');
    
    let dadosModificados = {};
    
    inputs.forEach(input => {
        const nomeDoCampoNaPlanilha = input.getAttribute('data-campo');
        let valorAtualizado = input.value;
        
        if (nomeDoCampoNaPlanilha === 'Valor último HbA1c' && valorAtualizado !== "") {
            valorAtualizado = valorAtualizado.replace('.', ',') + '%';
        }
        
        dadosModificados[nomeDoCampoNaPlanilha] = valorAtualizado;
    });

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    const textoOriginal = btnSalvar.innerText;
    btnSalvar.innerText = 'Salvando... ⏳';
    btnSalvar.disabled = true;
    btnEditar.disabled = true;
    btnSalvar.style.opacity = '0.7';

    fetch('/pacientes/api/atualizar-multiplos/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            cns: cns,
            campos: dadosModificados
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'sucesso') {
            btnSalvar.innerText = 'Salvo! ✔️';
            btnSalvar.style.opacity = '1';
            
            const paciente = patientData.find(p => p.CNS === cns);
            if (paciente) {
                Object.assign(paciente, dadosModificados);
                applyFilters();
            }
            
            setTimeout(() => {
                alternarModoEdicao(); 
                
                btnSalvar.innerText = textoOriginal;
                btnSalvar.disabled = false;
                btnEditar.disabled = false;
            }, 1200);

        } else {
            throw new Error(data.mensagem);
        }
    })
    .catch(error => {
        console.error("Erro na requisição:", error);
        btnSalvar.innerText = 'Erro ❌';
        btnSalvar.style.backgroundColor = '#ef4444';
        btnSalvar.style.opacity = '1';
        
        setTimeout(() => {
            btnSalvar.innerText = textoOriginal;
            btnSalvar.style.backgroundColor = '';
            btnSalvar.disabled = false;
            btnEditar.disabled = false;
        }, 3000);
    });
}