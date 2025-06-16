// Datos iniciales
const aulas = [
    // Primer y segundo piso
    { id: 1, capacidad: 45, piso: 1 },
    { id: 2, capacidad: 45, piso: 1 },
    { id: 3, capacidad: 45, piso: 1 },
    { id: 4, capacidad: 45, piso: 1 },
    { id: 5, capacidad: 60, piso: 1 },
    { id: 6, capacidad: 60, piso: 1 },
    { id: 7, capacidad: 30, piso: 1 },
    { id: 8, capacidad: 30, piso: 1 },
    // Tercer y cuarto piso
    { id: 9, capacidad: 60, piso: 3 },
    { id: 10, capacidad: 60, piso: 3 },
    { id: 11, capacidad: 60, piso: 3 },
    { id: 12, capacidad: 60, piso: 3 },
    { id: 13, capacidad: 40, piso: 3 },
    { id: 14, capacidad: 40, piso: 3 },
    // Quinto piso
    { id: 15, capacidad: 120, piso: 5 },
    { id: 16, capacidad: 120, piso: 5 }
];

const grupos = [
    { id: 1, nombre: "Grupo 1", estudiantes: 35, materia: "Cálculo I" },
    { id: 2, nombre: "Grupo 2", estudiantes: 50, materia: "Física I" },
    { id: 3, nombre: "Grupo 3", estudiantes: 120, materia: "Introducción a la Ingeniería" },
    { id: 4, nombre: "Grupo 4", estudiantes: 40, materia: "Redes I" },
    { id: 5, nombre: "Grupo 5", estudiantes: 60, materia: "Álgebra Lineal" }
];

const horarios = [
    { id: 1, inicio: "07:00", fin: "09:15" },
    { id: 2, inicio: "09:15", fin: "11:30" },
    { id: 3, inicio: "11:30", fin: "13:45" },
    { id: 4, inicio: "14:00", fin: "16:15" },
    { id: 5, inicio: "16:15", fin: "18:30" },
    { id: 6, inicio: "18:30", fin: "20:45" }
];

// Funciones de inicialización
function inicializarAplicacion() {
    cargarAulas();
    cargarGrupos();
    cargarHorarios();
    inicializarEventListeners();
    cargarDatosGuardados();
}

function cargarAulas() {
    const container = document.getElementById('aulas-container');
    container.innerHTML = ''; // Limpiar contenedor
    aulas.forEach(aula => {
        const card = document.createElement('div');
        card.className = 'aula-card';
        card.innerHTML = `
            <h4>Aula ${aula.id}</h4>
            <p>Piso: ${aula.piso}</p>
            <p>Capacidad: ${aula.capacidad} estudiantes</p>
        `;
        container.appendChild(card);
    });
}

function cargarGrupos() {
    const container = document.getElementById('grupos-container');
    container.innerHTML = ''; // Limpiar contenedor
    grupos.forEach(grupo => {
        const card = document.createElement('div');
        card.className = 'grupo-card';
        card.innerHTML = `
            <h4>${grupo.nombre}</h4>
            <p>Materia: ${grupo.materia}</p>
            <p>Estudiantes: ${grupo.estudiantes}</p>
        `;
        container.appendChild(card);
    });
}

function cargarHorarios() {
    const container = document.getElementById('horarios-container');
    container.innerHTML = ''; // Limpiar contenedor
    horarios.forEach(horario => {
        const card = document.createElement('div');
        card.className = 'horario-card';
        card.innerHTML = `
            <h4>Bloque ${horario.id}</h4>
            <p>${horario.inicio} - ${horario.fin}</p>
        `;
        container.appendChild(card);
    });
}

function inicializarEventListeners() {
    // Manejo de pestañas
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            cambiarTab(tabId);
        });
    });

    // Botón de optimización
    const optimizeBtn = document.getElementById('optimize-btn');
    optimizeBtn.addEventListener('click', ejecutarOptimizacion);

    // Validación de inputs
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', validarInput);
    });
}

function validarInput(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    
    if (input.id === 'threshold') {
        if (value < 0 || value > 100) {
            input.setCustomValidity('El umbral debe estar entre 0 y 100');
        } else {
            input.setCustomValidity('');
        }
    } else if (input.id === 'penalty') {
        if (value < 0) {
            input.setCustomValidity('La penalización debe ser mayor o igual a 0');
        } else {
            input.setCustomValidity('');
        }
    }
}

function cambiarTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabId}-content`).classList.remove('hidden');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function ejecutarOptimizacion() {
    const threshold = parseFloat(document.getElementById('threshold').value);
    const penalty = parseFloat(document.getElementById('penalty').value);

    if (!validarInputs(threshold, penalty)) {
        mostrarError('Por favor, corrija los valores de entrada');
        return;
    }

    mostrarCargando();

    setTimeout(() => {
        const optimizador = new OptimizadorMILP(aulas, grupos, horarios, threshold, penalty);
        const solucion = optimizador.optimizar();
        const metricas = optimizador.calcularMetricas();

        if (!solucion || !solucion.asignaciones || solucion.asignaciones.length === 0) {
            mostrarError('No se pudo encontrar una asignación válida para los grupos y aulas dadas las restricciones. Intente ajustar los parámetros.');
            return;
        }

        guardarResultados(solucion, metricas);
        mostrarResultados(solucion, metricas);
    }, 100);
}

function validarInputs(threshold, penalty) {
    return !isNaN(threshold) && !isNaN(penalty) &&
           threshold >= 0 && threshold <= 100 &&
           penalty >= 0;
}

function mostrarCargando() {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Optimizando asignaciones...</p>
        </div>
    `;
}

// --- FUNCIÓN CORREGIDA ---
function mostrarResultados(solucion, metricas) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.classList.remove('hidden');

    // 1. Reconstruir la estructura HTML dentro del contenedor de resultados
    resultsContainer.innerHTML = `
        <div class="results-grid"></div>
        <div class="metrics">
            <h3>Métricas de Utilización</h3>
            <div id="metrics-container"></div>
        </div>
    `;
    
    // 2. Ahora sí, buscar los elementos recién creados para llenarlos
    const resultsGrid = resultsContainer.querySelector('.results-grid');
    const metricsContainer = resultsContainer.querySelector('#metrics-container');

    // 3. Llenar la grilla de asignaciones
    resultsGrid.innerHTML = solucion.asignaciones.map(asignacion => {
        const grupo = grupos.find(g => g.id === asignacion.grupo);
        const aula = aulas.find(a => a.id === asignacion.aula);
        const horario = horarios.find(h => h.id === asignacion.horario);
        
        return `
            <div class="result-card">
                <h4>${grupo.nombre} - ${grupo.materia}</h4>
                <p>Aula ${aula.id} (Piso ${aula.piso})</p>
                <p>Horario: ${horario.inicio} - ${horario.fin}</p>
                <p>Utilización: ${((grupo.estudiantes / aula.capacidad) * 100).toFixed(1)}%</p>
            </div>
        `;
    }).join('');

    // 4. Llenar las métricas
    metricsContainer.innerHTML = `
        <div class="metric-card">
            <h4>Métricas Generales</h4>
            <p>Total de Asignaciones: ${metricas.totalAsignaciones}</p>
            <p>Total de Estudiantes: ${metricas.totalEstudiantes}</p>
            <p>Utilización Promedio: ${(metricas.utilizacionPromedio * 100).toFixed(1)}%</p>
            <p>Aulas Utilizadas: ${metricas.aulasUtilizadas}</p>
            <p>Horarios Utilizados: ${metricas.horariosUtilizados}</p>
        </div>
    `;

    // 5. Agregar el botón de exportación
    const exportButton = document.createElement('button');
    exportButton.className = 'export-btn primary-btn';
    exportButton.textContent = 'Exportar Resultados';
    exportButton.onclick = exportarResultados;
    resultsContainer.appendChild(exportButton);
}


function mostrarError(mensaje) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = `
        <div class="error-message">
            <p>${mensaje}</p>
        </div>
    `;
}

function guardarResultados(solucion, metricas) {
    const datos = {
        solucion,
        metricas,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('ultimaOptimizacion', JSON.stringify(datos));
}

function cargarDatosGuardados() {
    const datosGuardados = localStorage.getItem('ultimaOptimizacion');
    if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        // Asegurarse de que el contenedor de resultados esté visible
        document.getElementById('results-container').classList.remove('hidden');
        mostrarResultados(datos.solucion, datos.metricas);
    }
}

function exportarResultados() {
    const datosGuardados = localStorage.getItem('ultimaOptimizacion');
    if (!datosGuardados) return;

    const datos = JSON.parse(datosGuardados);
    const contenido = generarCSV(datos.solucion);
    
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `asignaciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generarCSV(solucion) {
    const headers = ['Grupo', 'Materia', 'Estudiantes', 'Aula', 'Piso', 'Horario', 'Utilización'];
    const rows = solucion.asignaciones.map(asignacion => {
        const grupo = grupos.find(g => g.id === asignacion.grupo);
        const aula = aulas.find(a => a.id === asignacion.aula);
        const horario = horarios.find(h => h.id === asignacion.horario);
        const utilizacion = ((grupo.estudiantes / aula.capacidad) * 100).toFixed(1);
        
        return [
            grupo.nombre,
            grupo.materia,
            grupo.estudiantes,
            aula.id,
            aula.piso,
            `${horario.inicio}-${horario.fin}`,
            `${utilizacion}%`
        ];
    });

    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

document.addEventListener('DOMContentLoaded', inicializarAplicacion);