class OptimizadorMILP {
    constructor(aulas, grupos, horarios, threshold, penalty) {
        this.aulas = aulas;
        this.grupos = grupos;
        this.horarios = horarios;
        this.threshold = threshold / 100; // Convertir a decimal
        this.penalty = penalty;
        this.solucion = null;
    }

    // Función objetivo: Maximizar estudiantes asignados - penalización por subutilización
    calcularFuncionObjetivo(asignaciones) {
        let totalEstudiantes = 0;
        let penalizacionTotal = 0;

        asignaciones.forEach(asignacion => {
            const grupo = this.grupos.find(g => g.id === asignacion.grupo);
            const aula = this.aulas.find(a => a.id === asignacion.aula);
            
            // Si por alguna razón no se encuentra el grupo o aula, no sumar nada.
            if (!grupo || !aula) return;

            const estudiantes = grupo.estudiantes;
            const capacidad = aula.capacidad;
            
            totalEstudiantes += estudiantes;
            
            // Calcular penalización por subutilización
            const espacioLibre = capacidad - estudiantes;
            if (espacioLibre > capacidad * this.threshold) {
                penalizacionTotal += espacioLibre * this.penalty;
            }
        });

        return totalEstudiantes - penalizacionTotal;
    }

    // Verificar restricción de capacidad
    verificarCapacidad(grupo, aula) {
        const capacidadAula = this.aulas.find(a => a.id === aula).capacidad;
        const estudiantesGrupo = this.grupos.find(g => g.id === grupo).estudiantes;
        return estudiantesGrupo <= capacidadAula;
    }

    // Algoritmo de optimización
    optimizar() {
        const maxIteraciones = 1000; // Límite de iteraciones para evitar bucles infinitos

        // Generar solución inicial
        let asignacionesActuales = this.generarSolucionInicial();
        let valorActual = this.calcularFuncionObjetivo(asignacionesActuales);

        // --- CORRECCIÓN CLAVE ---
        // La mejor solución debe inicializarse con la solución inicial,
        // no con un array vacío. Esto garantiza que siempre se devuelva una
        // solución válida, incluso si no se encuentran mejoras.
        let mejorSolucion = [...asignacionesActuales];
        let mejorValor = valorActual;

        for (let iteracion = 0; iteracion < maxIteraciones; iteracion++) {
            // Generar vecino (nueva solución)
            let nuevaAsignacion = this.generarVecino(asignacionesActuales);
            let nuevoValor = this.calcularFuncionObjetivo(nuevaAsignacion);

            // Actualizar si la nueva solución es mejor
            if (nuevoValor > valorActual) {
                asignacionesActuales = nuevaAsignacion;
                valorActual = nuevoValor;

                if (valorActual > mejorValor) {
                    mejorSolucion = [...asignacionesActuales];
                    mejorValor = valorActual;
                }
            }
        }

        this.solucion = {
            asignaciones: mejorSolucion,
            valorObjetivo: mejorValor
        };

        return this.solucion;
    }

    // Generar solución inicial válida
    generarSolucionInicial() {
        let asignaciones = [];
        let aulasHorariosOcupados = new Set();
        
        // --- MEJORA IMPORTANTE ---
        // Ordenar los grupos de mayor a menor. Esto prioriza la asignación
        // de los grupos más grandes, que son los más difíciles de ubicar,
        // resultando en una solución inicial mucho más robusta.
        const gruposOrdenados = [...this.grupos].sort((a, b) => b.estudiantes - a.estudiantes);

        for (const grupo of gruposOrdenados) {
            let asignado = false;
            for (const horario of this.horarios) {
                for (const aula of this.aulas) {
                    // Verificar capacidad
                    if (!this.verificarCapacidad(grupo.id, aula.id)) continue;
                    
                    // Verificar que el aula no esté ocupada en ese horario
                    const clave = `${aula.id}-${horario.id}`;
                    if (aulasHorariosOcupados.has(clave)) continue;
                    
                    // Asignar
                    asignaciones.push({
                        grupo: grupo.id,
                        aula: aula.id,
                        horario: horario.id
                    });
                    aulasHorariosOcupados.add(clave);
                    asignado = true;
                    break; // Salir del bucle de aulas
                }
                if (asignado) break; // Salir del bucle de horarios
            }
        }
        return asignaciones;
    }

    // Generar vecino (nueva solución)
    generarVecino(asignaciones) {
        if (asignaciones.length === 0) return []; // No se puede generar vecino de una solución vacía

        let nuevaAsignacion = [...asignaciones];
        
        const indiceAleatorio = Math.floor(Math.random() * nuevaAsignacion.length);
        const asignacionAModificar = nuevaAsignacion[indiceAleatorio];

        // Intentar encontrar una nueva aula y horario válidos
        for (const aula of this.aulas) {
            if (!this.verificarCapacidad(asignacionAModificar.grupo, aula.id)) continue;

            for (const horario of this.horarios) {
                const clave = `${aula.id}-${horario.id}`;
                const ocupante = nuevaAsignacion.find(a => a.aula === aula.id && a.horario === horario.id);

                // El slot está disponible si no hay ocupante o si el ocupante es el mismo grupo que estamos moviendo
                if (!ocupante || ocupante.grupo === asignacionAModificar.grupo) {
                    nuevaAsignacion[indiceAleatorio] = {
                        ...asignacionAModificar,
                        aula: aula.id,
                        horario: horario.id
                    };
                    return nuevaAsignacion;
                }
            }
        }

        return nuevaAsignacion; // Devolver la asignación original si no se encontró un movimiento válido
    }

    // Calcular métricas de utilización
    calcularMetricas() {
        if (!this.solucion || !this.solucion.asignaciones || this.solucion.asignaciones.length === 0) return null;

        const metricas = {
            totalAsignaciones: this.solucion.asignaciones.length,
            totalEstudiantes: 0,
            utilizacionPromedio: 0,
            aulasUtilizadas: new Set(),
            horariosUtilizados: new Set()
        };

        this.solucion.asignaciones.forEach(asignacion => {
            const grupo = this.grupos.find(g => g.id === asignacion.grupo);
            const aula = this.aulas.find(a => a.id === asignacion.aula);
            
            if (!grupo || !aula) return;

            metricas.totalEstudiantes += grupo.estudiantes;
            metricas.aulasUtilizadas.add(asignacion.aula);
            metricas.horariosUtilizados.add(asignacion.horario);
            
            metricas.utilizacionPromedio += grupo.estudiantes / aula.capacidad;
        });

        metricas.utilizacionPromedio /= metricas.totalAsignaciones;
        metricas.aulasUtilizadas = metricas.aulasUtilizadas.size;
        metricas.horariosUtilizados = metricas.horariosUtilizados.size;

        return metricas;
    }
}