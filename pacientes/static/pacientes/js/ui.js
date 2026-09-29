// --- FUNÇÕES DE UI E RESET ---
function toggleAccordion(contentId, headerElement) {
    const content = document.getElementById(contentId);
    content.classList.toggle('hidden');
    headerElement.classList.toggle('closed');
}

function clearFilters() {
    document.getElementById('filter-foot').checked = false;
    document.getElementById('filter-hba1c').value = '';
    document.getElementById('filter-age').value = 'all';

    document.getElementById('filter-on-time').checked = false;
    document.getElementById('filter-attention').checked = false;
    document.getElementById('filter-delayed').checked = false;

    document.getElementById('filter-risk-low').checked = false;
    document.getElementById('filter-risk-medium').checked = false;
    document.getElementById('filter-risk-high').checked = false;
    document.getElementById('filter-risk-critical').checked = false;

    applyFilters();
}

function applyFilters() {
    const isFootExamChecked = document.getElementById('filter-foot').checked;
    const hba1cThreshold = document.getElementById('filter-hba1c').value;
    const ageFilter = document.getElementById('filter-age').value;

    // Lendo os checkboxes de Consulta
    const showConsOnTime = document.getElementById('filter-on-time').checked;
    const showConsAttention = document.getElementById('filter-attention').checked;
    const showConsDelayed = document.getElementById('filter-delayed').checked;

    // Lendo os checkboxes do Score de Risco
    const showRiskLow = document.getElementById('filter-risk-low').checked;
    const showRiskMedium = document.getElementById('filter-risk-medium').checked;
    const showRiskHigh = document.getElementById('filter-risk-high').checked;
    const showRiskCritical = document.getElementById('filter-risk-critical').checked;

    let filteredData = patientData.filter(patient => {
        // 1. Filtro do Pé
        if (isFootExamChecked && patient['Avaliação pé DM'] !== 'Avaliado') return false;
        
        // 2. Filtro de HbA1c
        if (hba1cThreshold && hba1cThreshold !== "") {
            const rawValue = patient['Valor último HbA1c'];
            if (!rawValue) return false; 
            const hba1cValue = parseFloat(rawValue.replace(',', '.'));
            if (hba1cValue < parseFloat(hba1cThreshold)) return false;
        }

        // 3. Filtro de Idade
        if (ageFilter !== 'all') {
            const age = parseInt(patient.Idade, 10);
            if (ageFilter === 'under40' && age >= 40) return false;
            if (ageFilter === '40to59' && (age < 40 || age >= 60)) return false;
            if (ageFilter === '60plus' && age < 60) return false;
        }

        // 4. Filtro de Consulta
        const allConsUnchecked = !showConsOnTime && !showConsAttention && !showConsDelayed;
        if (!allConsUnchecked) {
            const consStatus = getConsultaStatus(patient);
            if (consStatus === 'ontime' && !showConsOnTime) return false;
            if (consStatus === 'attention' && !showConsAttention) return false;
            if (consStatus === 'delayed' && !showConsDelayed) return false;
        }

        // 5. Filtro do Score de Risco
        const allRiskUnchecked = !showRiskLow && !showRiskMedium && !showRiskHigh && !showRiskCritical;
        if (!allRiskUnchecked) {
            const riskColor = getRiskData(patient).color;
            if (riskColor === '#22c55e' && !showRiskLow) return false;
            if (riskColor === '#f1c70e' && !showRiskMedium) return false;
            if (riskColor === '#f97316' && !showRiskHigh) return false;
            if (riskColor === '#ef4444' && !showRiskCritical) return false;
        }

        return true;
    });

    // --- ATUALIZAÇÃO DAS MÉTRICAS (Com o bug da cor e do parâmetro corrigidos) ---
    document.getElementById('total-patients').innerText = filteredData.length;

    document.getElementById('metric-green').innerText = filteredData.filter(p => getRiskData(p).color === '#22c55e').length;
    document.getElementById('metric-yellow').innerText = filteredData.filter(p => getRiskData(p).color === '#f1c70e').length;
    document.getElementById('metric-orange').innerText = filteredData.filter(p => getRiskData(p).color === '#f97316').length;
    document.getElementById('metric-red').innerText = filteredData.filter(p => getRiskData(p).color === '#ef4444').length;

    document.getElementById('metric-foot').innerText = filteredData.filter(p => p['Avaliação pé DM'] === 'Avaliado').length;

    // Renderiza o mapa com a galera que sobreviveu a todos os filtros
    renderMarkers(filteredData);
}

// --- PATIENT INFO PANEL ---
function showPatientInfo(cns) {
    const patient = patientData.find(p => p.CNS === cns);
    if (!patient) return;

    const markerColor = getRiskData(patient['Data próxima consulta']);
    const textStyle = markerColor === '#22c55e' ? '' : `color: ${markerColor}; font-weight: bold;`;

    let footExamHtml = "";

    // Alerta de Pé
    let badgePe = "";
    if (patient['Avaliação pé DM'] !== 'Avaliado') {
        badgePe = `<span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Pendente</span>`;
    }

    // Alerta de HbA1c
    let badgeHba1c = "";
    const hba1cRaw = patient['Valor último HbA1c'];
    if (hba1cRaw && hba1cRaw.trim() !== "") {
        const hba1cValue = parseFloat(hba1cRaw.replace(',', '.'));
        if (hba1cValue >= 9.0) { 
            badgeHba1c = `<span style="background-color: #ffedd5; color: #9a3412; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px; font-weight: bold; border: 1px solid #fdba74;">Elevado</span>`;
        }
    }

    // Alerta de Consulta
    let badgeConsulta = "";
    const consStatus = getConsultaStatus(patient);
    if (consStatus === 'delayed') {
        badgeConsulta = `<span style="background-color: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px; font-weight: bold; border: 1px solid #fde047;">Atrasada</span>`;
    }

    let hba1cLimpo = "";
    if (patient['Valor último HbA1c']) {
        hba1cLimpo = patient['Valor último HbA1c'].replace('%', '').replace(',', '.').trim();
    }

    if (patient['PMDID'] === "Sim") {
        footExamHtml = `
            <p><strong>Estabelecimento que cadastrou vínculo (pac-prog saúde):</strong> ${patient['Estabelecimento que cadastrou vínculo (pac-prog saúde)']}</p>
            <p><strong>Tipo de diabetes:</strong> ${patient['Tipo de diabetes']}</p>
            <p><strong>Data de validade do laudo:</strong> ${patient['Data de validade do laudo']}</p>
            <p><strong>2º QUADRI (maio-agosto):</strong> ${patient['2º QUADRI (maio-agosto)']}</p>
            <p><strong>3º QUADRI (setembro-dezembro):</strong> ${patient['3º QUADRI (setembro-dezembro)']}</p>
        `;
    } else {
        footExamHtml = `<p><strong>Paciente sem mais informações do exame de pé DM</strong></p>`;
    }

    const patientInfoPanel = document.getElementById('patientInfo');
    patientInfoPanel.style.display = 'block';

    setTimeout(() => {
        patientInfoPanel.classList.add('visible');
    }, 10);
    
    patientInfoPanel.innerHTML = `
        <button id="btn-close-info" onclick="closePatientInfo()" style="float: right; cursor: pointer;">X</button>

        <h2>${patient.Nome}</h2>
        <p><strong>CNS:</strong> ${patient.CNS}</p>
        <p><strong>Idade:</strong> ${patient.Idade}</p>
        <p><strong>Telefone:</strong> ${patient['Telefone']}</p>
        <p><strong>Endereço:</strong> ${patient['Endereço']}</p>

        <hr>

        <p><Strong>Data da última consulta:</Strong> ${patient['Data última consulta']}</p>
        <div class="campo-grupo" style="margin-bottom: 8px;">
            <strong>Data da próxima consulta:</strong> 
            <span class="view-field" style="${textStyle}">${patient['Data próxima consulta']}</span>
            <input type="text" class="edit-field" data-campo="Data próxima consulta" value="${patient['Data próxima consulta']}" style="display: none; width: 90px; padding: 4px;">
            ${badgeConsulta}
        </div>

        <hr>

        <div class="campo-grupo" style="margin-bottom: 8px;">
            <strong>Data do último HbA1c:</strong> 
            <span class="view-field" style="${textStyle}">${patient['Data último HbA1c']}</span>
            <input type="text" class="edit-field" data-campo="Data último HbA1c" value="${patient['Data último HbA1c']}" style="display: none; width: 90px; padding: 4px;">
        </div>

        <div class="campo-grupo" style="margin-bottom: 8px;">
            <strong>Valor do último HbA1c:</strong>
            <span class="view-field">${patient['Valor último HbA1c']}</span>
            <input type="number" class="edit-field" step="0.1" data-campo="Valor último HbA1c" value="${hba1cLimpo}" style="display: none; width: 70px; padding: 4px;">
            <span class="edit-field" style="display: none; margin-left: 4px; font-weight: bold;">%</span>
            ${badgeHba1c}
        </div>

        <p><strong>Solicitação HB1AC (E-SUS):</strong> ${patient['Solicitação HB1AC E-SUS']}</p>
        <p><strong>Solicitação HB1AC (GERCON):</strong> ${patient['Solicitação HB1AC GERCON']}</p>
        <p><strong>Registro: </strong> ${patient['Registro']}</p>

        <hr>

        <div class="campo-grupo" style="margin-bottom: 8px;">
                <strong>Avaliação do pé DM:</strong>
                <span class="view-field">${patient['Avaliação pé DM']}</span>
                <select class="edit-field" data-campo="Avaliação pé DM" style="display: none; padding: 4px;">
                    <option value="Avaliado" ${patient['Avaliação pé DM'] === 'Avaliado' ? 'selected' : ''}>Avaliado</option>
                    <option value="Não Avaliado" ${patient['Avaliação pé DM'] !== 'Avaliado' ? 'selected' : ''}>Não avaliado</option>
                </select>
                ${badgePe}
        </div>
        <p><strong>${patient['Data avaliação pé DM'] ? 'Data da avaliação pé DM:' : ''}</strong> ${patient['Data avaliação pé DM']}</p>
        ${footExamHtml}

        <div class="action-buttons-container">
            <button id="btn-salvar-tudo" onclick="salvarFormularioCompleto('${patient.CNS}')" style="display: none;">Salvar</button>
            <button id="btn-toggle-edit" onclick="alternarModoEdicao()">✏️ Editar</button>
        </div>
    `;
}

function closePatientInfo() {
    const patientInfoPanel = document.getElementById('patientInfo');
    patientInfoPanel.classList.remove('visible');

    setTimeout(() => {
        patientInfoPanel.style.display = 'none';
    }, 100);
}

function alternarModoEdicao() {
    const painel = document.getElementById('patientInfo');
    painel.classList.toggle('modo-edicao-ativo');
    
    const btnSalvar = document.getElementById('btn-salvar-tudo');
    const btnEditar = document.getElementById('btn-toggle-edit');
    
    if (painel.classList.contains('modo-edicao-ativo')) {
        btnSalvar.style.display = 'block';
        btnEditar.innerText = '❌ Cancelar';
    } else {
        btnSalvar.style.display = 'none';
        btnEditar.innerText = '✏️ Editar';
    }
}



