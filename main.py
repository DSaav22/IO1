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
    Ejecuta el motor de optimización MILP para asignar grupos a aulas.
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
        return {
            "status": "error",
            "message": "Datos insuficientes. Se requieren aulas, grupos asignables y horarios para la optimización.",
            "asignaciones": [],
            "metricas": {},
            "grupos_no_asignados": [g.nombre for g in grupos]
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
            if map_grupo_idx[i].estudiantes <= map_aula_idx[j].capacidad:
                for t in range(num_horarios):
                    vars_asignacion_grupo.append(x[i, j, t])
        model.AddAtMostOne(vars_asignacion_grupo)

    # 2. Cada par (aula, horario) es ocupado por como máximo un grupo.
    for j in range(num_aulas):
        for t in range(num_horarios):
            vars_ocupacion_aula = []
            for i in range(num_grupos):
                 if (i,j,t) in x:
                    vars_ocupacion_aula.append(x[i, j, t])
            model.AddAtMostOne(vars_ocupacion_aula)
            
    # --- Función Objetivo (SIMPLIFICADA PARA DEPURACIÓN) ---
    
    # Temporalmente, solo maximizaremos el número de estudiantes asignados,
    # ignorando la penalización para aislar el error.
    total_students_assigned = sum(
    x[i, j, t] * map_grupo_idx[i].estudiantes
    for i, j, t in x
    )
    model.Maximize(total_students_assigned)
    
    # --- Ejecución del Solver ---
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.Solve(model)
    
    # --- Procesamiento de Resultados ---
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        asignaciones = []
        grupos_asignados_idx = set()
        aulas_utilizadas = set()
        utilizacion_total = 0
        penalizacion_total_acumulada = 0

        for i, j, t in x:
            if solver.Value(x[i, j, t]) == 1:
                grupo = map_grupo_idx[i]
                aula = map_aula_idx[j]
                horario = map_horario_idx[t]
                utilizacion = (grupo.estudiantes / aula.capacidad) * 100
                
                penalizacion_aplicada = 0
                umbral_subutilizacion_abs = params.delta * aula.capacidad
                if aula.capacidad - grupo.estudiantes > umbral_subutilizacion_abs:
                    penalizacion_aplicada = aula.capacidad - grupo.estudiantes

                asignaciones.append({
                    "grupo": grupo.nombre,
                    "aula": aula.id,
                    "horario": horario,
                    "estudiantes": grupo.estudiantes,
                    "capacidad": aula.capacidad,
                    "utilizacion": round(utilizacion, 2),
                    "penalizacion_aplicada": penalizacion_aplicada
                })
                grupos_asignados_idx.add(i)
                aulas_utilizadas.add(aula.id)
                utilizacion_total += utilizacion
                penalizacion_total_acumulada += penalizacion_aplicada

        grupos_no_asignados_final = [g.nombre for i, g in map_grupo_idx.items() if i not in grupos_asignados_idx]
        grupos_no_asignados_final.extend([g.nombre for g in grupos_imposibles])

        num_asignaciones = len(asignaciones)
        utilizacion_promedio = (utilizacion_total / num_asignaciones) if num_asignaciones > 0 else 0

        return {
            "status": "success",
            "message": "Optimización completada.",
            "asignaciones": asignaciones,
            "metricas": {
                "valor_objetivo_z": round(solver.ObjectiveValue(), 2),
                "utilizacion_promedio": round(utilizacion_promedio, 2),
                "penalizacion_total_acumulada": penalizacion_total_acumulada,
                "aulas_utilizadas": len(aulas_utilizadas),
            },
            "grupos_no_asignados": sorted(list(set(grupos_no_asignados_final))),
            "parametros_usados": params
        }

    else:
        return {
            "status": "error",
            "message": "No se encontró una solución óptima o factible en el tiempo límite.",
            "asignaciones": [],
            "metricas": {},
            "grupos_no_asignados": [g.nombre for g in grupos]
        }

# --- Servir Frontend ---
# Esto debe declararse DESPUÉS de todas las rutas de la API.
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# --- Punto de entrada para Uvicorn (si se ejecuta el script directamente) ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 