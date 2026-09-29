// --- MOTOR DE TRIAGEM (RISK SCORE) ---
function getRiskData(patient) {
    let score = 0;

    if (patient['Avaliação pé DM'] !== 'Avaliado') {
        score += 4;
    }

    const hba1cRaw = patient['Valor último HbA1c'];
    if (hba1cRaw && hba1cRaw.trim() !== "") {
        const hba1c = parseFloat(hba1cRaw.replace(',', '.'));
        if (hba1c >= 9.0) score += 5;
        else if (hba1c >= 7.5) score += 2;
    }

    const consDateString = patient['Data próxima consulta'];
    if (consDateString && consDateString.trim() !== "") {
        const consDate = convertBrDate(consDateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        consDate.setHours(0, 0, 0, 0);
        
        const daysDifference = Math.ceil((consDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (daysDifference < -15) score += 5;
        else if (daysDifference < 0) score += 3;
    } else {
        score += 5;
    }

    if (score >= 11) return { label: 'Risco Crítico', color: '#ef4444', score: score };
    if (score >= 8)  return { label: 'Risco Alto', color: '#f97316', score: score };
    if (score >= 4)  return { label: 'Risco Médio', color: '#f1c70e', score: score };
    return { label: 'Risco Baixo', color: '#22c55e', score: score };
}

// --- FUNÇÃO AJUDANTE PARA A CONSULTA ISOLADA ---
function getConsultaStatus(patient) {
    const consDateString = patient['Data próxima consulta'];
    if (!consDateString || consDateString.trim() === "") return 'delayed';
    
    const consDate = convertBrDate(consDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    consDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.ceil((consDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < -15) return 'delayed';
    if (daysDiff < 0) return 'attention';
    return 'ontime';
}

// --- DATE & COLOR UTILS ---
function convertBrDate(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('/'); 
    return new Date(parts[2], parts[1] - 1, parts[0]);
}