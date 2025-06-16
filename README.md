# Sistema de Optimización de Asignación de Aulas

Un sistema web front-end para asignar aulas a grupos de estudiantes de forma óptima, basado en un modelo de optimización heurístico. La aplicación busca maximizar la cantidad de estudiantes asignados mientras penaliza la subutilización de los espacios.
-----

## 📋 Sobre el Proyecto

Este proyecto es una aplicación web del lado del cliente (frontend) diseñada para resolver el complejo problema de la asignación de horarios y aulas en una institución educativa. Utiliza un algoritmo de optimización para encontrar una solución que no solo cumpla con las restricciones básicas (como la capacidad del aula), sino que también busque la eficiencia en el uso de los recursos.

La lógica de optimización se ejecuta completamente en el navegador del usuario, sin necesidad de un backend.

-----

## ✨ Características Principales

  - **Asignación Inteligente:** Asigna automáticamente grupos de estudiantes a aulas y horarios disponibles.
  - **Optimización de Recursos:** El algoritmo busca maximizar el número de estudiantes asignados y penaliza las aulas que quedan con demasiados asientos vacíos.
  - **Parámetros Configurables:** Permite al usuario ajustar el **Umbral de Subutilización (δ)** y el **Factor de Penalización (λ)** para afinar los resultados del modelo.
  - **Interfaz Clara y Tabulada:** Muestra los datos de Aulas, Grupos y Horarios de forma organizada.
  - **Visualización de Resultados:** Presenta la solución final en tarjetas fáciles de leer, mostrando la utilización de cada aula asignada.
  - **Métricas de Rendimiento:** Calcula y muestra métricas clave como la utilización promedio, el total de aulas usadas y el número de estudiantes asignados.
  - **Persistencia de Datos:** Guarda la última optimización realizada en el `localStorage` del navegador para que los resultados no se pierdan al recargar la página.
  - **Exportación a CSV:** Permite descargar los resultados de la asignación en un archivo `.csv` para su uso en otras aplicaciones como Excel.

-----

## 🛠️ Tecnologías Utilizadas

  - **HTML5:** Para la estructura de la página.
  - **CSS3:** Para los estilos y el diseño visual (el archivo `styles.css` no se incluye en este repositorio, pero es parte del proyecto).
  - **JavaScript (Vanilla):** Para toda la lógica de la aplicación, manipulación del DOM y el algoritmo de optimización. No se utilizaron frameworks externos.

-----

## 🚀 ¿Cómo Usarlo?

Este proyecto no requiere ninguna instalación ni servidor. Para ejecutarlo localmente, solo sigue estos pasos:

1.  **Clona o descarga el repositorio:**
    ```sh
    git clone https://github.com/tu-usuario/tu-repositorio.git
    ```
2.  **Navega a la carpeta del proyecto:**
    ```sh
    cd tu-repositorio
    ```
3.  **Abre el archivo `index.html` en tu navegador web preferido (como Chrome, Firefox, etc.).**

¡Y listo\! La aplicación se ejecutará localmente en tu navegador.

-----

## 🧠 ¿Cómo Funciona el Optimizador?

El núcleo de la aplicación reside en la clase `OptimizadorMILP` (en `milp.js`), que aunque su nombre sugiere Programación Lineal Entera Mixta, en realidad implementa un **algoritmo heurístico de búsqueda local** similar a *Hill Climbing*.

1.  **Generación de Solución Inicial:**

      - Primero, los grupos se ordenan de mayor a menor según el número de estudiantes. Esto es crucial para dar prioridad a los grupos más difíciles de ubicar.
      - Luego, el algoritmo itera sobre los grupos ordenados y los asigna a la primera combinación `aula-horario` válida que encuentra.

2.  **Proceso de Optimización:**

      - Se parte de la solución inicial.
      - El algoritmo entra en un bucle que se repite un número determinado de veces (`maxIteraciones`).
      - En cada iteración, intenta realizar una pequeña modificación a la solución actual (por ejemplo, cambiar un grupo a una nueva aula u horario) para generar una solución "vecina".
      - Evalúa esta nueva solución con una **función objetivo** que calcula un puntaje basado en los estudiantes asignados menos una penalización por las aulas subutilizadas.
      - Si la nueva solución tiene un puntaje más alto, se convierte en la solución actual y el proceso continúa.

3.  **Resultado Final:**

      - Después de todas las iteraciones, el sistema devuelve la mejor solución encontrada durante todo el proceso.

-----

## 📂 Estructura de Archivos

```
.
├── index.html         # Archivo principal de la página
├── script.js          # Lógica del DOM, datos y eventos
├── milp.js            # Clase y lógica del optimizador
└── styles.css         # Estilos visuales de la aplicación
```

-----
