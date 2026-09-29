const map = L.map('map', { maxZoom: 19, zoomControl: false }).setView([-30.0346, -51.2177], 13);
let patientData = [];
let markerGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    zoomToBoundsOnClick: false,
    disableClusteringAtZoom: 13
}).addTo(map);

markerGroup.on('clusterclick', function (a) {
    a.layer.spiderfy();
});

// --- MAP INITIALIZATION ---
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);


// --- MAP RENDERING ---
function renderMarkers(dataToRender) {
    markerGroup.clearLayers();

    const groupedPatients = {};

    dataToRender.forEach(patient => {
        if (patient.Latitude && patient.Longitude) {
            const key = `${patient.Latitude},${patient.Longitude}`;
            if (!groupedPatients[key]) {
                groupedPatients[key] = [];
            }
            groupedPatients[key].push(patient);
        }
    });

    Object.values(groupedPatients).forEach(group => {
        const lat = group[0].Latitude;
        const lng = group[0].Longitude;

        if (group.length === 1) {
            const patient = group[0];
            const risk = getRiskData(patient); 
    
            const marker = L.circleMarker([lat, lng], {
                color: '#f3f0f0', 
                weight: 2,        
                fillColor: risk.color,
                fillOpacity: 0.9, 
                radius: 8
            }).addTo(markerGroup); 

            marker.bindPopup(`
                <b>${patient.Nome}</b><br>
                Idade: ${patient.Idade}<br>
                <span style="color: ${risk.color}; font-weight: bold;">${risk.label} (${risk.score} pts)</span><br>
                <button onclick="showPatientInfo('${patient.CNS}')">Ver detalhes</button>
            `);
        
        } else {
            const maxScore = Math.max(...group.map(p => getRiskData(p).score));
            
            let bgHex = '#22c55e';
            if (maxScore >= 11) bgHex = '#ef4444'; 
            else if (maxScore >= 8) bgHex = '#f97316';
            else if (maxScore >= 4) bgHex = '#f1c70e';

            const groupIcon = L.divIcon({
                className: 'cluster-pin', 
                html: `<div class="cluster-dot" style="background-color: ${bgHex};">${group.length}</div>`,
                iconSize: [32, 32], 
                iconAnchor: [16, 16] 
            });

            const marker = L.marker([lat, lng], { icon: groupIcon }).addTo(markerGroup); 

            let popupHtml = `<div style="max-height: 200px; overflow-y: auto; padding-right: 5px;">`;
            popupHtml += `<b style="color: var(--cor-primaria); font-size: 14px;">🏠 ${group.length} pacientes neste endereço</b><hr style="margin: 8px 0;">`;
            
            group.forEach(patient => {
                popupHtml += `
                    <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--cor-borda);">
                        <b>${patient.Nome}</b><br>
                        Idade: ${patient.Idade}<br>
                        <button onclick="showPatientInfo('${patient.CNS}')" style="margin-top: 6px; padding: 4px 8px; font-size: 0.8rem;">Ver detalhes</button>
                    </div>
                `;
            });
            popupHtml += `</div>`;

            marker.bindPopup(popupHtml);
        }
    });
}
