# OptiAulas - Optimizador de Horarios Académicos

**OptiAulas** es una aplicación web full-stack diseñada para resolver el complejo problema de la asignación de recursos académicos. Utiliza un potente motor de optimización matemática para generar horarios ideales que maximizan el uso de las aulas y respetan una variedad de reglas y restricciones configurables.

## ✨ Características Principales

  * **Gestión de Datos Dinámica:** Añade, edita y elimina aulas y grupos de estudiantes directamente desde la interfaz.
  * **Motor de Optimización Avanzado:** Utiliza **Google OR-Tools (CP-SAT Solver)** para encontrar la solución óptima, no solo una "buena" solución.
  * **Parámetros Configurables:** Ajusta el **Umbral de Subutilización (δ)** y el **Factor de Penalización (λ)** para influir en las decisiones del optimizador.
  * **Visualización de Resultados Interactiva:**
      * **Horario Visual:** Un grid con códigos de color para entender la calidad de la asignación de un vistazo.
      * **Tabla de Asignaciones:** Todos los detalles de cada clase asignada.
      * **Métricas de Rendimiento (KPIs):** Analiza la eficiencia del horario generado (utilización promedio, penalización total, etc.).
      * **Explicación del Modelo:** Una pestaña dedicada que explica cómo funciona el motor de optimización.
  * **Interfaz Moderna y Responsiva:** Construida con Bootstrap 5 para una experiencia de usuario fluida en cualquier dispositivo.

## 🛠️ Stack Tecnológico

  * **Backend:**
      * **Python 3:** Lenguaje principal.
      * **FastAPI:** Framework web de alto rendimiento para la API.
      * **Uvicorn:** Servidor ASGI para correr la aplicación.
      * **Google OR-Tools:** Biblioteca para la lógica de optimización por restricciones.
  * **Frontend:**
      * **HTML5**
      * **CSS3**
      * **JavaScript (Vanilla JS):** Para toda la lógica de la interfaz y la comunicación con la API.
      * **Bootstrap 5:** Framework para el diseño y la responsividad.

## 📁 Estructura del Proyecto

```
/OptiAulas
│
├── main.py             # Script del backend con FastAPI y la lógica de optimización.
├── index.html          # Archivo principal de la interfaz de usuario.
├── main.js             # Lógica del frontend (manipulación del DOM, llamadas a la API).
├── requirements.txt    # Dependencias de Python para el backend.
└── README.md           # Este archivo.
```

## 🚀 Instalación y Ejecución

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### Prerrequisitos

  * Python 3.8 o superior.
  * `pip` (manejador de paquetes de Python).

### 1\. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/OptiAulas.git
cd OptiAulas
```

### 2\. Configurar el Backend

Es altamente recomendable usar un entorno virtual.

```bash
# Crear un entorno virtual
python -m venv venv

# Activar el entorno virtual
# En Windows:
.\venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar las dependencias de Python
pip install -r requirements.txt
```

*(Asegúrate de que tu archivo `requirements.txt` contenga lo siguiente:)*

```
fastapi
uvicorn[standard]
ortools
```

### 3\. Ejecutar la Aplicación

Una vez instaladas las dependencias, inicia el servidor desde la terminal:

```bash
# El comando 'uvicorn' iniciará el servidor.
# 'main:app' le dice que busque el objeto 'app' en el archivo 'main.py'.
# '--reload' reinicia el servidor automáticamente cuando detecta cambios en el código.
uvicorn main:app --reload
```

### 4\. Acceder a la Aplicación

Abre tu navegador web y navega a la siguiente dirección:

**[enlace sospechoso eliminado]**

¡Listo\! La aplicación OptiAulas debería estar funcionando en tu máquina.

## 💡 Cómo Usar

1.  **Añade Aulas y Grupos:** Utiliza los formularios de la izquierda para poblar los datos iniciales.
2.  **Ajusta los Parámetros:** Modifica los valores de `δ` y `λ` en la sección de configuración para definir qué tan estricto quieres que sea el optimizador con el espacio vacío.
3.  **Optimiza:** Haz clic en el botón **"Optimizar Horario"**.
4.  **Analiza los Resultados:** Explora las diferentes pestañas de resultados para entender el horario generado. Si quieres saber más sobre el proceso, ¡no te pierdas la pestaña **"¿Cómo funciona?"**\!

## 🔭 Posibles Mejoras a Futuro

  - [ ] Implementar el modelo de penalización completo en la función objetivo del solver.
  - [ ] Permitir la importación y exportación de datos desde/hacia archivos CSV o Excel.
  - [ ] Añadir restricciones adicionales (ej. disponibilidad de profesores, equipamiento de aulas).
  - [ ] Integrar una base de datos (como SQLite o PostgreSQL) para persistir los datos.
  - [ ] Añadir un sistema de autenticación de usuarios.

