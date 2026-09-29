// --- EVENT LISTENERS ---
document.getElementById('filter-foot').addEventListener('change', applyFilters);
document.getElementById('filter-hba1c').addEventListener('input', applyFilters);
document.getElementById('filter-on-time').addEventListener('change', applyFilters);
document.getElementById('filter-attention').addEventListener('change', applyFilters);
document.getElementById('filter-delayed').addEventListener('change', applyFilters);
document.getElementById('filter-age').addEventListener('change', applyFilters);
document.getElementById('filter-risk-low').addEventListener('change', applyFilters);
document.getElementById('filter-risk-medium').addEventListener('change', applyFilters);
document.getElementById('filter-risk-high').addEventListener('change', applyFilters);
document.getElementById('filter-risk-critical').addEventListener('change', applyFilters);

document.getElementById('btn-toggle-panel').addEventListener('click', function() {
    const panel = document.getElementById('generalInfo');
    panel.classList.toggle('collapsed');

    setTimeout(() => {
        map.invalidateSize();
    }, 300);

    this.innerHTML = panel.classList.contains('collapsed') ? '❯' : '❮';
});