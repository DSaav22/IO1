import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from ortools.sat.python import cp_model
from typing import List, Dict, Any, Optional

# --- Modelos de Datos (Pydantic) ---

class Aula(BaseModel):
    id: str
    capacidad: int = Field(gt=0, description="La capacidad debe ser un entero positivo")

class Grupo(BaseModel):
    nombre: str
    estudiantes: int = Field(gt=0, description="El número de estudiantes debe ser un entero positivo")

class Parametros(BaseModel):
    delta: float = Field(ge=0, le=0.5, description="Umbral de subutilización (0.0 a 0.5)")
    lambda_penalizacion: float = Field(ge=0, description="Factor de penalización (>= 0)")

class InputPayload(BaseModel):
    aulas: List[Aula]
    grupos: List[Grupo]
    parametros: Parametros
    horarios: List[str]

# --- Aplicación FastAPI ---

app = FastAPI(
    title="OptiAulas API",
    description="API para la optimización de asignación de aulas.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Lógica del Endpoint de Optimización ---

@app.post("/api/v1/optimize", tags=["Optimización"])
async def optimize_schedule(payload: InputPayload):
    """
    Ejecuta el motor de optimización CP-SAT para asignar grupos a aulas.
    """
    aulas = payload.aulas
    grupos = payload.grupos
    params = payload.parametros
    horarios = payload.horarios

    # --- Pre-validación y Pre-procesamiento ---

    max_capacidad_aula = max(aula.capacidad for aula in aulas) if aulas else 0
    grupos_imposibles = [grupo for grupo in grupos if grupo.estudiantes > max_capacidad_aula]
    
    # Filtramos los grupos que sí pueden ser asignados
    grupos_asignables = [grupo for grupo in grupos if grupo.estudiantes <= max_capacidad_aula]

    if not aulas or not grupos_asignables or not horarios:
        # Se añade grupos_imposibles a no_asignados para el frontend
        todos_grupos_no_asignados = [g.nombre for g in grupos]
        return {
            "status": "error",
            "message": "Datos insuficientes. Se requieren aulas, grupos asignables y horarios para la optimización.",
            "asignaciones": [],
            "metricas": {},
            "grupos_no_asignados": todos_grupos_no_asignados, # Incluye todos los grupos si no hay suficiente data
            "parametros_usados": params # Devuelve los parámetros para consistencia
        }

    num_grupos = len(grupos_asignables)
    num_aulas = len(aulas)
    num_horarios = len(horarios)
    
    # Mapeo a índices enteros para el solver
    map_grupo_idx = {i: grupo for i, grupo in enumerate(grupos_asignables)}
    map_aula_idx = {j: aula for j, aula in enumerate(aulas)}
    map_horario_idx = {t: horario for t, horario in enumerate(horarios)}
    
    # --- Instanciación del Modelo CP-SAT ---
    
    model = cp_model.CpModel()
    
    # --- Definición de Variables ---
    
    # x[i, j, t] es booleana: 1 si grupo i se asigna a aula j en horario t
    x = {}
    for i in range(num_grupos):
        for j in range(num_aulas):
            # Filtrado de asignaciones imposibles (reduce el espacio de búsqueda)
            if map_grupo_idx[i].estudiantes <= map_aula_idx[j].capacidad:
                for t in range(num_horarios):
                    x[i, j, t] = model.NewBoolVar(f'x_{i}_{j}_{t}')

    # --- Definición de Restricciones ---

    # 1. Cada grupo se asigna como máximo una vez.
    for i in range(num_grupos):
        vars_asignacion_grupo = []
        for j in range(num_aulas):
            # Solo añadir variables que existen
            if map_grupo_idx[i].estudiantes <= map_aula_idx[j].capacidad:
                for t in range(num_horarios):
                    # Asegurarse de que la clave (i,j,t) exista en el diccionario x
                    if (i, j, t) in x: 
                        vars_asignacion_grupo.append(x[i, j, t])
        if vars_asignacion_grupo: # Solo agregar la restricción si hay variables posibles
            model.AddAtMostOne(vars_asignacion_grupo)
        # Si un grupo no puede ser asignado a ninguna aula (ya sea por tamaño o por falta de slots)
        # Esto ya se maneja al filtrar `grupos_asignables` y en el post-procesamiento.


    # 2. Cada par (aula, horario) es ocupado por como máximo un grupo.
    for j in range(num_aulas):
        for t in range(num_horarios):
            vars_ocupacion_aula = []
            for i in range(num_grupos):
                if (i,j,t) in x: # Asegurarse de que la clave (i,j,t) exista en el diccionario x
                    vars_ocupacion_aula.append(x[i, j, t])
            model.AddAtMostOne(vars_ocupacion_aula)
            
    # --- Función Objetivo ---
    
    # Beneficio principal: Suma de estudiantes asignados
    total_beneficio = model.NewIntVar(0, sum(g.estudiantes for g in grupos_asignables), 'total_beneficio')
    model.Add(total_beneficio == sum(
        x[i, j, t] * map_grupo_idx[i].estudiantes
        for i, j, t in x
    ))

    # Penalización por subutilización excesiva
    total_penalizacion_absoluta = model.NewIntVar(0, sum(a.capacidad * num_horarios for a in aulas), 'total_penalizacion_absoluta') 
    penalizaciones_acumuladas_vars = []

    for i in range(num_grupos):
        for j in range(num_aulas):
            for t in range(num_horarios):
                if (i, j, t) in x: # Solo si esta asignación es posible
                    grupo = map_grupo_idx[i]
                    aula = map_aula_idx[j]

                    capacidad_vacia = aula.capacidad - grupo.estudiantes
                    umbral_subutilizacion_abs = int(params.delta * aula.capacidad) # Convertir a entero para comparación

                    # Crear una variable booleana para indicar si esta asignación particular tiene penalización
                    has_penalty = model.NewBoolVar(f'has_penalty_{i}_{j}_{t}')
                    
                    # Condición: si el grupo está asignado (x[i,j,t] == 1) AND la capacidad_vacia > umbral
                    model.Add(capacidad_vacia > umbral_subutilizacion_abs).OnlyEnforceIf(has_penalty)
                    model.Add(capacidad_vacia <= umbral_subutilizacion_abs).OnlyEnforceIf(has_penalty.Not())
                    
                    # Variable auxiliar para almacenar la penalización de esta asignación si aplica
                    this_assignment_penalty_value = model.NewIntVar(0, aula.capacidad, f'this_assignment_penalty_{i}_{j}_{t}')
                    
                    # Si has_penalty es verdadero Y x[i,j,t] es verdadero, la penalización es 'capacidad_vacia'
                    # CP-SAT requiere que la expresión esté presente en ambos lados de OnlyEnforceIf
                    model.Add(this_assignment_penalty_value == capacidad_vacia).OnlyEnforceIf(has_penalty)
                    model.Add(this_assignment_penalty_value == 0).OnlyEnforceIf(has_penalty.Not())
                    
                    # Sumar esta penalización al total, PERO SOLO SI EL GRUPO ESTÁ ASIGNADO (x[i,j,t] == 1)
                    # Es decir, la penalización solo se cuenta si la asignación real ocurre.
                    final_penalty_for_x_ijt = model.NewIntVar(0, aula.capacidad, f'final_penalty_for_x_{i}_{j}_{t}')
                    model.Add(final_penalty_for_x_ijt == this_assignment_penalty_value).OnlyEnforceIf(x[i,j,t])
                    model.Add(final_penalty_for_x_ijt == 0).OnlyEnforceIf(x[i,j,t].Not())

                    penalizaciones_acumuladas_vars.append(final_penalty_for_x_ijt)

    if penalizaciones_acumuladas_vars:
        model.Add(total_penalizacion_absoluta == sum(penalizaciones_acumuladas_vars))
    else:
        model.Add(total_penalizacion_absoluta == 0)

    # Función objetivo final: Maximizar (beneficio) - (lambda * penalización)
    # CP-SAT trabaja con enteros, por lo que convertimos lambda_penalizacion a entero para la multiplicación
    # Esto puede causar pérdida de precisión si lambda es decimal, pero es común en CP-SAT.
    # Una alternativa más precisa sería multiplicar todo por un factor grande (e.g., 100) y luego dividir al reportar.
    
    # Para manejar decimales en lambda_penalizacion de forma más robusta:
    # Multiplicamos por un factor (e.g., 1000) para trabajar con enteros y luego dividimos al reportar la función objetivo.
    SCALING_FACTOR = 1000 
    scaled_lambda = int(params.lambda_penalizacion * SCALING_FACTOR)

    # El objetivo es maximizar, así que la penalización se resta.
    # Escalamos el total_beneficio también para mantener la proporción
    model.Maximize(
        (total_beneficio * SCALING_FACTOR) - (scaled_lambda * total_penalizacion_absoluta)
    )

    # --- Ejecución del Solver ---
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0 # Límite de tiempo para la optimización
    status = solver.Solve(model)
    
    # --- Procesamiento de Resultados ---
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        asignaciones = []
        grupos_asignados_idx = set()
        aulas_utilizadas_ids = set() # Usar un conjunto para IDs de aulas utilizadas

        utilizacion_total_por_asignacion = 0
        penalizacion_total_acumulada_reportada = 0 # Esta es la suma de las penalizaciones calculadas post-solución

        for i, j, t in x:
            if solver.Value(x[i, j, t]) == 1: # Si el grupo i se asignó al aula j en el horario t
                grupo = map_grupo_idx[i]
                aula = map_aula_idx[j]
                horario = map_horario_idx[t]
                
                utilizacion = (grupo.estudiantes / aula.capacidad) * 100
                
                penalizacion_aplicada_para_reporte = 0
                umbral_subutilizacion_abs = params.delta * aula.capacidad
                # Calcular la penalización si la capacidad vacía excede el umbral para el REPORTE
                if aula.capacidad - grupo.estudiantes > umbral_subutilizacion_abs:
                    penalizacion_aplicada_para_reporte = aula.capacidad - grupo.estudiantes # Cantidad de asientos vacíos sobre el umbral

                asignaciones.append({
                    "grupo": grupo.nombre,
                    "aula": aula.id,
                    "horario": horario,
                    "estudiantes": grupo.estudiantes,
                    "capacidad": aula.capacidad,
                    "utilizacion": round(utilizacion, 2),
                    "penalizacion_aplicada": penalizacion_aplicada_para_reporte # Guardar la penalización calculada
                })
                grupos_asignados_idx.add(i)
                aulas_utilizadas_ids.add(aula.id)
                utilizacion_total_por_asignacion += utilizacion
                penalizacion_total_acumulada_reportada += penalizacion_aplicada_para_reporte # Sumar para la métrica total

        # Grupos no asignados: los que son imposibles + los que no fueron asignados por el solver
        grupos_no_asignados_final = [g.nombre for g in grupos_imposibles]
        grupos_no_asignados_final.extend([g.nombre for i, g in map_grupo_idx.items() if i not in grupos_asignados_idx])
        
        num_asignaciones_realizadas = len(asignaciones)
        utilizacion_promedio = (utilizacion_total_por_asignacion / num_asignaciones_realizadas) if num_asignaciones_realizadas > 0 else 0

        # El valor objetivo del solver debe ser desescalado para reportarlo correctamente si se escaló
        # Esto es importante para el KPI "Valor Objetivo (Z)"
        reported_objective_value = solver.ObjectiveValue() / SCALING_FACTOR if SCALING_FACTOR != 1 else solver.ObjectiveValue()

        return {
            "status": "success",
            "message": "Optimización completada exitosamente.",
            "asignaciones": asignaciones,
            "metricas": {
                "valor_objetivo_z": round(reported_objective_value, 2),
                "utilizacion_promedio": round(utilizacion_promedio, 2),
                "penalizacion_total_acumulada": penalizacion_total_acumulada_reportada,
                "aulas_utilizadas": len(aulas_utilizadas_ids),
            },
            "grupos_no_asignados": sorted(list(set(grupos_no_asignados_final))), # Asegurar unicidad y ordenar
            "parametros_usados": params # Devolver los parámetros con los que se ejecutó
        }

    else: # No se encontró una solución o hubo un error
        # Si no se encontró solución, todos los grupos asignables también se consideran no asignados en este contexto
        todos_grupos_no_asignados = [g.nombre for g in grupos]
        return {
            "status": "error",
            "message": f"El solver no pudo encontrar una solución óptima o factible. Estado: {solver.StatusName(status)}",
            "asignaciones": [],
            "metricas": {
                "valor_objetivo_z": "N/A",
                "utilizacion_promedio": "N/A",
                "penalizacion_total_acumulada": "N/A",
                "aulas_utilizadas": 0,
            },
            "grupos_no_asignados": sorted(list(set(todos_grupos_no_asignados))), # Todos los grupos si no hay solución
            "parametros_usados": params
        }

# --- Servir Frontend ---
# Esto debe declararse DESPUÉS de todas las rutas de la API para que las rutas de la API tengan precedencia.
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# --- Punto de entrada para Uvicorn (si se ejecuta el script directamente) ---
if __name__ == "__main__":
    import uvicorn
    # Para ejecutar: uvicorn main:app --reload
    uvicorn.run(app, host="0.0.0.0", port=8000)