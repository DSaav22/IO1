/**
 * OptiAulas Frontend Logic
 * Arquitecto: Senior Full-Stack AI
 * Fecha: 2024-05-20
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- State Management & Global Variables ---
    const API_URL = 'http://127.0.0.1:8000/api/v1/optimize';
    let aulas = [];
    let grupos = [];
    const horarios = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'];
    let deleteCallback = null;

    // --- DOM Element References ---
    const aulasTbody = document.getElementById('aulas-table-body');
    const gruposTbody = document.getElementById('grupos-table-body');
    const formAddAula = document.getElementById('form-add-aula');
    const formAddGrupo = document.getElementById('form-add-grupo');
    const deltaSlider = document.getElementById('delta-slider');
    const deltaValueSpan = document.getElementById('delta-value');
    const lambdaInput = document.getElementById('lambda-input');
    const optimizeButton = document.getElementById('optimize-button');
    const resultsPanel = document.getElementById('results-panel');
    const alertsContainer = document.getElementById('alerts-container');
    const deleteConfirmModal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const deleteModalBodyText = document.getElementById('delete-modal-body-text');

    // --- Data Initialization ---

    /**
     * Carga los datos de demostración iniciales en el estado y la UI.
     */
    function loadDemoData() {
        const demoAulas = [
            { id: 'A-101', capacidad: 30 },
            { id: 'A-102', capacidad: 35 },
            { id: 'A-201', capacidad: 25 },
            { id: 'A-205', capacidad: 40 },
            { id: 'B-110', capacidad: 50 },
            { id: 'B-112', capacidad: 50 },
            { id: 'B-220', capacidad: 45 },
            { id: 'B-301', capacidad: 20 },
            { id: 'C-LAB1 (Cómputo)', capacidad: 22 },
            { id: 'C-LAB2 (Física)', capacidad: 28 },
            { id: 'D-100 (Aud. Menor)', capacidad: 80 },
            { id: 'D-200 (Aud. Principal)', capacidad: 180 },
            { id: 'E-101', capacidad: 60 },
            { id: 'E-SUM', capacidad: 75 },
            { id: 'F-105', capacidad: 30 },
            { id: 'F-106', capacidad: 35 }
        ];
        const demoGrupos = [
            { nombre: 'Cálculo I', estudiantes: 120 },
            { nombre: 'Álgebra Lineal', estudiantes: 78 },
            { nombre: 'Intro. a la Programación', estudiantes: 75 },
            { nombre: 'Física General', estudiantes: 60 },
            { nombre: 'Química Orgánica', estudiantes: 55 },
            { nombre: 'Estructuras de Datos', estudiantes: 49 },
            { nombre: 'Bases de Datos', estudiantes: 44 },
            { nombre: 'Termodinámica', estudiantes: 48 },
            { nombre: 'Historia del Arte Moderno', estudiantes: 38 },
            { nombre: 'Literatura Comparada', estudiantes: 33 },
            { nombre: 'Filosofía Antigua', estudiantes: 30 },
            { nombre: 'Redes de Computadoras', estudiantes: 34 },
            { nombre: 'Sistemas Operativos', estudiantes: 40 },
            { nombre: 'Inteligencia Artificial', estudiantes: 28 },
            { nombre: 'Taller de Robótica', estudiantes: 21 },
            { nombre: 'Cálculo Avanzado', estudiantes: 24 },
            { nombre: 'Geometría Diferencial', estudiantes: 20 },
            { nombre: 'Seminario de Tesis I', estudiantes: 18 },
            { nombre: 'Econometría', estudiantes: 26 },
            { nombre: 'Marketing Digital', estudiantes: 32 },
            { nombre: 'Fotografía Básica', estudiantes: 22 },
            { nombre: 'Macroeconomía I', estudiantes: 190 } // Grupo imposible
        ];
        aulas = demoAulas;
        grupos = demoGrupos;
        renderAulas();
        renderGrupos();
    }

    // --- Rendering Functions ---

    /**
     * Renderiza la tabla de aulas a partir del estado actual.
     */
    function renderAulas() {
        aulasTbody.innerHTML = '';
        aulas.forEach((aula, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${aula.id}</td>
                <td>${aula.capacidad}</td>
                <td><button class="btn btn-danger btn-sm" data-type="aula" data-index="${index}" title="Eliminar"><i class="bi bi-trash-fill"></i></button></td>
            `;
            aulasTbody.appendChild(tr);
        });
    }

    /**
     * Renderiza la tabla de grupos a partir del estado actual.
     */
    function renderGrupos() {
        gruposTbody.innerHTML = '';
        grupos.forEach((grupo, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${grupo.nombre}</td>
                <td>${grupo.estudiantes}</td>
                <td><button class="btn btn-danger btn-sm" data-type="grupo" data-index="${index}" title="Eliminar"><i class="bi bi-trash-fill"></i></button></td>
            `;
            gruposTbody.appendChild(tr);
        });
    }

    // --- CRUD and Data Management ---

    /**
     * Maneja la adición de una nueva aula.
     * @param {Event} e - El evento del formulario.
     */
    function handleAddAula(e) {
        e.preventDefault();
        const idInput = document.getElementById('aula-id');
        const capacidadInput = document.getElementById('aula-capacidad');

        if (aulas.some(a => a.id === idInput.value.trim())) {
            showAlert(`El aula con ID "${idInput.value}" ya existe.`, 'warning');
            return;
        }

        aulas.push({
            id: idInput.value.trim(),
            capacidad: parseInt(capacidadInput.value)
        });
        renderAulas();
        formAddAula.reset();
    }

    /**
     * Maneja la adición de un nuevo grupo.
     * @param {Event} e - El evento del formulario.
     */
    function handleAddGrupo(e) {
        e.preventDefault();
        const nombreInput = document.getElementById('grupo-nombre');
        const estudiantesInput = document.getElementById('grupo-estudiantes');
        
        if (grupos.some(g => g.nombre === nombreInput.value.trim())) {
            showAlert(`El grupo con nombre "${nombreInput.value}" ya existe.`, 'warning');
            return;
        }
        
        grupos.push({
            nombre: nombreInput.value.trim(),
            estudiantes: parseInt(estudiantesInput.value)
        });
        renderGrupos();
        formAddGrupo.reset();
    }

    /**
     * Prepara y muestra el modal de confirmación para eliminar un ítem.
     * @param {string} type - 'aula' o 'grupo'.
     * @param {number} index - El índice del ítem en su respectivo array.
     */
    function confirmDelete(type, index) {
        const item = type === 'aula' ? aulas[index] : grupos[index];
        const itemName = item.id || item.nombre;
        deleteModalBodyText.textContent = `¿Está seguro de que desea eliminar ${itemName}? Esta acción no se puede deshacer.`;
        deleteCallback = () => {
            if (type === 'aula') {
                aulas.splice(index, 1);
                renderAulas();
            } else {
                grupos.splice(index, 1);
                renderGrupos();
            }
        };
        deleteConfirmModal.show();
    }

    // --- API Communication ---

    /**
     * Recopila datos del UI, llama a la API de optimización y maneja la respuesta.
     */
    async function handleOptimize() {
        // Validación previa en frontend
        if (aulas.length === 0 || grupos.length === 0) {
            showAlert("Debe haber al menos un aula y un grupo para optimizar.", "warning");
            return;
        }
        
        const maxCapacidad = Math.max(...aulas.map(a => a.capacidad));
        const gruposImposibles = grupos.filter(g => g.estudiantes > maxCapacidad);

        if (gruposImposibles.length > 0) {
            const nombres = gruposImposibles.map(g => g.nombre).join(', ');
            showAlert(`<strong>Pre-validación fallida:</strong> Los siguientes grupos tienen más estudiantes que el aula más grande y no podrán ser asignados: <strong>${nombres}</strong>.`, 'warning', 10000);
        }

        const payload = {
            aulas: aulas,
            grupos: grupos,
            parametros: {
                delta: parseFloat(deltaSlider.value) / 100,
                lambda_penalizacion: parseFloat(lambdaInput.value)
            },
            horarios: horarios
        };

        setLoadingState(true);
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Error de comunicación con el servidor.');
            }

            renderResults(data);
            showAlert(data.message || 'Optimización finalizada.', 'success');

        } catch (error) {
            console.error('Error en la optimización:', error);
            showAlert(`Error en la optimización: ${error.message}`, 'danger');
            resetResultsPanel();
        } finally {
            setLoadingState(false);
        }
    }

    /**
     * Cambia el estado del botón de optimizar a 'cargando' o 'normal'.
     * @param {boolean} isLoading - Si se debe mostrar el estado de carga.
     */
    function setLoadingState(isLoading) {
        if (isLoading) {
            optimizeButton.disabled = true;
            optimizeButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Optimizando...
            `;
        } else {
            optimizeButton.disabled = false;
            optimizeButton.innerHTML = '<i class="bi bi-magic"></i> Optimizar Horario';
        }
    }
    
    // --- Results Rendering ---

    /**
     * Renderiza todo el panel de resultados con pestañas.
     * @param {object} resultData - El objeto de respuesta de la API.
     */
    function renderResults(resultData) {
        // Desempaquetamos los datos, incluyendo los parámetros usados que ahora enviaremos desde el backend
        const { asignaciones, metricas, grupos_no_asignados, parametros_usados } = resultData;
    
        resultsPanel.innerHTML = `
            <ul class="nav nav-tabs" id="resultsTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="visual-tab" data-bs-toggle="tab" data-bs-target="#visual-content" type="button" role="tab">Horario Visual</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="table-tab" data-bs-toggle="tab" data-bs-target="#table-content" type="button" role="tab">Tabla de Asignaciones</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="metrics-tab" data-bs-toggle="tab" data-bs-target="#metrics-content" type="button" role="tab">Métricas de Rendimiento</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="process-tab" data-bs-toggle="tab" data-bs-target="#process-content" type="button" role="tab"><strong>¿Cómo funciona?</strong></button>
                </li>
            </ul>
            <div class="tab-content pt-3" id="resultsTabContent">
                <div class="tab-pane fade show active" id="visual-content" role="tabpanel"></div>
                <div class="tab-pane fade" id="table-content" role="tabpanel"></div>
                <div class="tab-pane fade" id="metrics-content" role="tabpanel"></div>
                <div class="tab-pane fade p-3" id="process-content" role="tabpanel"></div>
            </div>
        `;
    
        // Llamadas a las funciones de renderizado existentes
        document.getElementById('visual-content').innerHTML = renderVisualSchedule(asignaciones);
        document.getElementById('table-content').innerHTML = renderAssignmentsTable(asignaciones);
        document.getElementById('metrics-content').innerHTML = renderMetrics(metricas, grupos_no_asignados);
    
        // ¡Nueva llamada!
        document.getElementById('process-content').innerHTML = renderOptimizationProcess(parametros_usados);
    
        // Habilitar tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, { html: true });
        });
    }
    
    /**
     * Resetea el panel de resultados a su estado inicial.
     */
    function resetResultsPanel() {
        resultsPanel.innerHTML = `
            <div class="text-center text-muted p-5">
                <h4><i class="bi bi-clock-history"></i> Esperando optimización</h4>
                <p>Configure sus datos y presione 'Optimizar' para generar el horario perfecto.</p>
            </div>`;
    }

    /**
     * Genera el HTML para la cuadrícula del horario visual.
     * @param {Array} asignaciones - La lista de asignaciones.
     * @returns {string} El HTML de la cuadrícula.
     */
    function renderVisualSchedule(asignaciones) {
        if (aulas.length === 0) return '<p class="text-center">No hay aulas para mostrar.</p>';

        let gridHtml = '<div class="table-responsive"><div id="visual-schedule-grid" class="d-grid" style="--bs-columns: ' + (horarios.length + 1) + ';">';
        // Headers (horarios)
        gridHtml += '<div></div>'; // Esquina vacía
        horarios.forEach(h => gridHtml += `<div class="fw-bold text-center p-2 small">${h}</div>`);
        
        // Filas (aulas)
        const sortedAulas = [...aulas].sort((a,b) => a.id.localeCompare(b.id));
        sortedAulas.forEach(aula => {
            gridHtml += `<div class="fw-bold text-center p-2 small">${aula.id}</div>`; // Header de aula
            horarios.forEach(horario => {
                const asignacion = asignaciones.find(a => a.aula === aula.id && a.horario === horario);
                if (asignacion) {
                    const delta = parseFloat(deltaSlider.value) / 100;
                    let colorClass = '';
                    if (asignacion.utilizacion > 90) {
                        colorClass = 'bg-success text-white'; // Verde Intenso
                    } else if (asignacion.utilizacion >= (1 - delta) * 100) {
                        colorClass = 'bg-success-subtle'; // Verde Claro
                    } else {
                        colorClass = 'bg-warning-subtle'; // Amarillo
                    }
                    const tooltipContent = `
                        <strong>Grupo:</strong> ${asignacion.grupo}<br>
                        <strong>Nº Est.:</strong> ${asignacion.estudiantes}<br>
                        <strong>Aula:</strong> ${asignacion.aula} (${asignacion.capacidad})<br>
                        <strong>Utilización:</strong> ${asignacion.utilizacion}%<br>
                        <strong>Penalización:</strong> ${asignacion.penalizacion_aplicada}
                    `;
                    gridHtml += `<div class="cell ${colorClass}" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltipContent}">
                                    <strong>${asignacion.grupo}</strong>
                                 </div>`;
                } else {
                    gridHtml += '<div class="cell"></div>'; // Celda vacía
                }
            });
        });
        gridHtml += '</div></div>';
        return gridHtml;
    }
    
    /**
     * Genera el HTML para la tabla de asignaciones detallada.
     * @param {Array} asignaciones - La lista de asignaciones.
     * @returns {string} El HTML de la tabla.
     */
    function renderAssignmentsTable(asignaciones) {
        if (asignaciones.length === 0) return '<p class="text-center">No se realizaron asignaciones.</p>';
        
        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Grupo</th>
                            <th>Aula</th>
                            <th>Horario</th>
                            <th>Nº Estudiantes</th>
                            <th>Capacidad</th>
                            <th>Utilización (%)</th>
                            <th>Penalización</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        asignaciones.forEach(a => {
            tableHtml += `
                <tr>
                    <td>${a.grupo}</td>
                    <td>${a.aula}</td>
                    <td>${a.horario}</td>
                    <td>${a.estudiantes}</td>
                    <td>${a.capacidad}</td>
                    <td>${a.utilizacion}</td>
                    <td>${a.penalizacion_aplicada}</td>
                </tr>
            `;
        });
        tableHtml += '</tbody></table></div>';
        return tableHtml;
    }
    
    /**
     * Genera el HTML para el dashboard de métricas de rendimiento.
     * @param {object} metricas - El objeto de métricas.
     * @param {Array} grupos_no_asignados - La lista de nombres de grupos no asignados.
     * @returns {string} El HTML del dashboard.
     */
    function renderMetrics(metricas, grupos_no_asignados) {
        return `
            <div class="row g-4">
                <div class="col-md-4 col-lg-2">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                            <div class="value">${metricas.valor_objetivo_z ?? 'N/A'}</div>
                            <div class="label">Valor Objetivo (Z)</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-2">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                             <div class="value">${metricas.utilizacion_promedio ?? 'N/A'}%</div>
                            <div class="label">Utilización Promedio</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-2">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                             <div class="value">${metricas.penalizacion_total_acumulada ?? 'N/A'}</div>
                            <div class="label">Penalización Total</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-2">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                             <div class="value">${metricas.aulas_utilizadas ?? 'N/A'}</div>
                            <div class="label">Aulas Utilizadas</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-8 col-lg-4">
                     <div class="card h-100">
                        <div class="card-header small">Grupos No Asignados</div>
                        <div class="card-body p-2" style="max-height: 150px; overflow-y: auto;">
                            ${grupos_no_asignados && grupos_no_asignados.length > 0
                                ? `<ul class="list-group list-group-flush">${grupos_no_asignados.map(g => `<li class="list-group-item small py-1">${g}</li>`).join('')}</ul>`
                                : '<p class="text-center text-muted small mt-3">¡Todos los grupos fueron asignados!</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Genera el HTML con la explicación del modelo de optimización.
     * @param {object} parametros - Los parámetros usados en la optimización.
     * @returns {string} El HTML del contenido explicativo.
     */
    function renderOptimizationProcess(parametros) {
        const deltaPercent = (parametros.delta * 100).toFixed(0);
        const lambda = parametros.lambda_penalizacion;

        return `
            <h4>El Proceso de Optimización: ¿Cómo funciona 'OptiAulas'?</h4>
            <p>
                OptiAulas no realiza una asignación al azar. Utiliza un enfoque de <strong>Inteligencia Artificial</strong> y <strong>Optimización Matemática</strong> llamado 
                <strong>Programación por Restricciones (Constraint Programming)</strong>. Le damos al sistema un objetivo, le imponemos reglas y él se encarga de encontrar la mejor solución posible.
            </p>
            <hr>

            <h5>Paso 1: Modelado Matemático</h5>
            <p>
                Traducimos el problema a un lenguaje que el computador entiende. Definimos variables, restricciones y una función objetivo.
            </p>

            <h5>Paso 2: Variables de Decisión</h5>
            <p>
                La decisión fundamental es si un grupo debe ser asignado a un aula en un horario específico. Creamos una variable booleana (0 o 1) para cada posible combinación:
            </p>
            <p class="text-center bg-light p-2 rounded">
                <code>$x_{ijt}$ = 1 si el grupo <i>i</i> se asigna al aula <i>j</i> en el horario <i>t</i>, y 0 en caso contrario.</code>
            </p>
            
            <h5>Paso 3: Restricciones (Las Reglas del Juego)</h5>
            <p>Estas son las reglas inquebrantables que el modelo debe seguir:</p>
            <ul>
                <li><strong>Unicidad de Grupo:</strong> Un grupo solo puede ser asignado a una única aula y horario. No puede estar en dos sitios a la vez.</li>
                <li><strong>Exclusividad de Aula:</strong> Un aula en un horario específico solo puede ser ocupada por un único grupo.</li>
                <li><strong>Capacidad Mínima:</strong> Un grupo solo puede ser asignado a un aula si su número de estudiantes es menor o igual a la capacidad del aula.</li>
            </ul>

            <h5>Paso 4: La Función Objetivo (¿Qué significa "Mejor"?)</h5>
            <p>
                Aquí es donde su configuración entra en juego. El objetivo es maximizar una "puntuación total" que se calcula así:
            </p>
            <p class="text-center">
                <strong>Puntuación = (Beneficio por Asignaciones) - (Costo por Penalizaciones)</strong>
            </p>
            <p>
                <ul>
                    <li><strong>Beneficio:</strong> Se busca asignar la mayor cantidad de grupos posible, dando prioridad a los más grandes para maximizar el número de estudiantes con un horario.</li>
                    <li>
                        <strong>Penalización por Subutilización:</strong> Aquí usamos los parámetros <strong>δ (delta)</strong> y <strong>λ (lambda)</strong>.
                        <br>
                        En esta ejecución, se penalizó cualquier asignación que dejara más de un <strong>${deltaPercent}%</strong> de la capacidad del aula vacía (parámetro δ).
                        El "costo" o penalización por cada asiento vacío que excede este umbral se multiplicó por <strong>${lambda}</strong> (parámetro λ) para ajustar su importancia en la decisión final.
                    </li>
                </ul>
            </p>
            <p class="text-center bg-light p-2 rounded">
                <code>Maximizar Z = $\sum_{i,j,t} (\text{beneficio}_i \cdot x_{ijt}) - \lambda \cdot \sum_{i,j,t} (\text{penalización}_{ij} \cdot x_{ijt})$</code>
            </p>

            <h5>Paso 5: Solución</h5>
            <p>
                Finalmente, le entregamos este modelo matemático al solver <strong>Google OR-Tools (CP-SAT)</strong>. Él explora eficientemente billones de combinaciones posibles para encontrar la que da el valor más alto en la función objetivo (Z), garantizando que todas las reglas se cumplan. El resultado de ese análisis es el horario que ves en las otras pestañas.
            </p>
        `;
    }


    // --- UI Helpers & Event Listeners ---

    /**
     * Muestra una alerta Bootstrap dinámica.
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - 'success', 'warning', 'danger', etc.
     * @param {number} duration - Duración en ms antes de desaparecer.
     */
    function showAlert(message, type = 'info', duration = 5000) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertsContainer.append(wrapper);
        setTimeout(() => {
            wrapper.remove();
        }, duration);
    }
    
    // --- Event Listeners ---
    formAddAula.addEventListener('submit', handleAddAula);
    formAddGrupo.addEventListener('submit', handleAddGrupo);

    deltaSlider.addEventListener('input', (e) => {
        deltaValueSpan.textContent = `${e.target.value}%`;
    });

    [aulasTbody, gruposTbody].forEach(tbody => {
        tbody.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('button.btn-danger');
            if (deleteButton) {
                const { type, index } = deleteButton.dataset;
                confirmDelete(type, parseInt(index));
            }
        });
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (deleteCallback) {
            deleteCallback();
            deleteCallback = null;
            deleteConfirmModal.hide();
        }
    });

    optimizeButton.addEventListener('click', handleOptimize);

    // --- Initial Execution ---
    loadDemoData();
}); 