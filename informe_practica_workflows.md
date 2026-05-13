# Informe Técnico de Práctica Profesional

## Portada institucional

**Título del informe:** Desarrollo, integración y validación de funcionalidades para un sistema de workflows  
**Programa académico:** Ingeniería de Software  
**Estudiante:** Andres Chaves  
**Empresa / Proyecto:** Orquestium / Proyseival / Sistema de Workflows  
**Modalidad:** Práctica profesional  
**Fecha:** Mayo de 2026  

## Introducción

Durante la práctica profesional se participó en el desarrollo, integración, validación y documentación de funcionalidades relacionadas con un sistema de workflows. El trabajo se centró principalmente en la construcción de un editor visual de flujos, la integración de ejecución en segundo plano, la creación y mejora de nodos funcionales, el manejo de variables dinámicas, la persistencia de configuraciones y la validación del comportamiento del sistema mediante pruebas manuales y unitarias.

Además del desarrollo directo sobre workflows, se realizaron actividades complementarias relacionadas con la implementación de Spec Driven Development usando OpenSpec y GitHub Copilot, la configuración de workflows de integración continua en GitHub Actions, la documentación de integraciones externas y el levantamiento de fallos funcionales en módulos de Orquestium y Proyseival.

Estas actividades permitieron aplicar conocimientos propios de la Ingeniería de Software, como análisis de requerimientos, diseño de soluciones, desarrollo frontend y backend, automatización, pruebas, documentación técnica, control de versiones y validación de flujos de negocio.

## Abstract

During the professional internship, several features were developed, improved and validated for a workflow automation system. The work included background execution using Inngest, the implementation of a visual workflow editor, the development of multiple node types, dynamic variable mapping, schema normalization, frontend unit testing and local network deployment using Nginx.

Complementary activities included the implementation of a Spec Driven Development workflow using OpenSpec and GitHub Copilot, the creation of a GitHub Actions CI workflow, documentation of an external integration between WhatsApp and Zoho CRM through n8n, and functional issue reporting for Orquestium and Proyseival modules.

This experience strengthened software engineering skills in frontend and backend development, system integration, testing, debugging, documentation, agile work and professional problem solving.

## Objetivo general

Diseñar, implementar y mejorar funcionalidades de un sistema de workflows, integrando ejecución en segundo plano, edición visual de flujos, nodos configurables, manejo de variables dinámicas, validaciones de ejecución y pruebas que permitan automatizar procesos de forma flexible, estable y verificable.

## Objetivos específicos

- Integrar Inngest para permitir la ejecución de workflows en background.
- Construir y mejorar un editor visual de workflows con drag and drop, conexiones, paneles de propiedades y persistencia.
- Implementar nodos funcionales como Trigger, HTTP, Webhook Trigger, Database, Delay, Notificación, If/Else, Formulario, Code y Email.
- Corregir errores relacionados con interpolación de variables, schemas y consumo de datos entre nodos.
- Validar flujos reales mediante pruebas manuales y pruebas unitarias en Angular.
- Implementar un enfoque de Spec Driven Development usando OpenSpec y GitHub Copilot.
- Configurar un workflow de GitHub Actions para validar backend y frontend.
- Documentar integraciones y reportar hallazgos funcionales del sistema.

## Justificación

Los sistemas basados en workflows permiten automatizar procesos, conectar módulos, ejecutar decisiones lógicas, transformar datos y reducir tareas manuales. Para que este tipo de sistema sea útil, debe contar con un editor visual claro, nodos configurables, ejecución confiable y una forma consistente de compartir datos entre pasos.

Las actividades desarrolladas fueron necesarias porque fortalecieron la estabilidad del motor de workflows, ampliaron las capacidades del editor visual, mejoraron la experiencia de configuración de los usuarios y permitieron validar el comportamiento real de los flujos. Asimismo, la incorporación de especificaciones, pruebas unitarias e integración continua contribuyó a mejorar la calidad del desarrollo y la trazabilidad de los cambios.

## Descripción de actividades realizadas

### Integración de Inngest y ejecución en background

Se trabajó en la integración de Inngest para permitir que los workflows pudieran ejecutarse en segundo plano. Esta actividad incluyó el registro de funciones Inngest, la creación del endpoint de ejecución del workflow, la inyección de servicios del motor al runtime y el manejo de eventos de entrada.

Esta integración permitió separar la configuración visual del flujo de su ejecución real, facilitando que los procesos pudieran correr de manera asíncrona y con mejor control del contexto de entrada.

### Editor visual de Workflows

Se implementaron y ajustaron funcionalidades del editor visual de workflows. Entre las principales actividades se encuentran la creación de un canvas con drag and drop de nodos, conexión entre nodos, panel de propiedades según el tipo de nodo, persistencia de nodos y conexiones, simulación visual del recorrido del flujo y corrección del mapeo de variables dentro del Data Explorer.

El editor visual permitió que los usuarios pudieran construir flujos de forma gráfica, configurando cada paso sin depender únicamente de código.

### Nodo Trigger

Se configuró el nodo Trigger como punto de entrada principal del workflow. También se validó que solo pudiera existir un trigger inicial dentro del flujo, evitando ambigüedades al momento de ejecutar el proceso.

### Nodo HTTP

Se desarrolló y ajustó el nodo HTTP para permitir la configuración de método, URL, headers y body. También se agregó soporte de variables dinámicas en URL y body mediante expresiones como `{{ variable }}`. Se realizaron pruebas manuales desde el editor, guardado de schema de respuesta esperada y alineación entre la respuesta de prueba y la ejecución real del runtime, incluyendo `statusCode`, `body` y `headers`.

### Nodo Webhook Trigger

Se implementó el nodo Webhook Trigger para recibir payloads externos e iniciar flujos desde solicitudes reales. Se trabajó en el mapeo de `body`, `headers` y `query` al contexto del workflow, permitiendo que los datos recibidos fueran usados por nodos posteriores.

### Nodo Database

Se implementaron operaciones CRUD dentro del flujo, incluyendo configuración de tabla, tipo de operación y mapeo columna-valor con variables dinámicas. También se realizaron validaciones de columnas permitidas, inserción de registros con datos provenientes del flujo, mensajes claros cuando no existían datos para `INSERT` y pruebas de creación desde el editor.

### Nodo Delay

Se configuró el nodo Delay para permitir pausas por duración o por fecha. También se habilitó el uso de variables dinámicas en el tiempo de espera y se validó la ejecución con pausa real dentro del flujo.

### Nodo Notificación

Se trabajó en la configuración de destinatario y mensaje dinámico, incluyendo placeholders con variables del flujo. El objetivo fue permitir que el flujo pudiera generar una salida o alerta basada en los datos procesados.

### Nodo If / Else

Se desarrolló y validó el nodo If / Else para evaluar condiciones con Valor 1, operador y Valor 2. Se trabajó con operadores como igual, contiene y no vacío. También se validó el enrutamiento de ejecución hacia la rama verdadera o falsa según el resultado de la condición, usando pruebas reales con casos `true` y `false`.

### Mejoras del nodo Formulario

Se realizó un refactor del nodo Formulario para pasar de campos estáticos a campos dinámicos. Esto permitió crear, editar y eliminar múltiples campos dentro del formulario, soportar distintos tipos de dato como texto y número, mantener compatibilidad con `title` y `description`, y enviar las respuestas del formulario al flujo para consumo en nodos siguientes mediante `$json`.

También se corrigió la validación de campos del formulario para evitar fallos por nombres incorrectos y datos vacíos. Se ajustaron identificadores con espacios, como `nombre ` o `monto `, para convertirlos en claves válidas dentro del flujo.

### Corrección de variables en workflows

Se corrigieron problemas de interpolación y mapeo de variables usando expresiones como `{{ campo }}`. También se trabajó en la compatibilidad con nodos anteriores, estabilidad de ejecución, conversión incorrecta de `dataSchema` de array a objeto, normalización del schema HTTP para el Data Explorer, restauración de variables cortas y compatibilidad con rutas largas como `$node` cuando aplicaba.

Estas correcciones fueron verificadas mediante flujos reales como `Form -> HTTP -> IF -> Database`.

### Categorización de nodos

Se organizó funcionalmente el toolbox de nodos por categorías:

- Entrada: Trigger, Webhook Trigger, Formulario.
- Integración: HTTP.
- Lógica: If / Else, Delay, Code.
- Persistencia: Database.
- Salida: Notificación.

Esta categorización mejoró la comprensión del editor y facilitó la ubicación de nodos según su propósito dentro del flujo.

### Nodo Code JavaScript

Se creó un nuevo nodo Code para transformar y procesar datos JSON dentro del flujo usando JavaScript. Este nodo fue integrado en backend y frontend, agregado al editor visual y ubicado dentro de la categoría Lógica.

Las actividades incluyeron agregar el tipo `CODE` al enum de nodos, crear el handler backend para ejecutar scripts con contexto `$json`, `$node` y `$globals`, registrar el handler en el motor de ejecución, crear la migración de base de datos para incluir el tipo en el enum, agregar el nodo al toolbox del editor, validar compilación frontend/backend y probar un flujo real con transformación de datos hacia el siguiente nodo.

### Nodo Email mediante Spec Driven Development

Como parte de una prueba práctica de Spec Driven Development, se creó una especificación OpenSpec para agregar un nodo Email al editor de workflows. La especificación incluyó `proposal.md`, `design.md` y `tasks.md`.

El nodo fue implementado inicialmente solo en frontend. Se agregó el tipo `EMAIL`, una etiqueta visual, ícono, color, descripción en el toolbox y un componente de propiedades con los campos `to`, `subject` y `message`. No se implementó envío real de correos ni manejo de credenciales, ya que esto quedó fuera del alcance de la prueba.

### Configuración de pruebas unitarias en frontend

Se configuró y validó el entorno de pruebas unitarias `.spec.ts` en Angular. Las pruebas cubrieron módulos como Project, Tasks y Workflows.

En Project se validó la comunicación HTTP con backend, carga de datos, creación y eliminación de proyectos, navegación hacia el detalle y comportamiento de componentes. En Tasks se validó la consulta de tareas, filtrado por proyecto, creación, actualización y eliminación. En Workflows se validó la obtención, creación, eliminación y ejecución de workflows, así como reglas del editor visual, drag and drop, restricción de un único Trigger, selección de nodos, eliminación local y ordenamiento topológico.

Los comandos documentados incluyeron ejecuciones específicas con `npx ng test --include=...` y ejecución general mediante `npx ng test`.

### Implementación de Spec Driven Development con OpenSpec y GitHub Copilot

Se revisó cómo trabajar con especificaciones antes de modificar código. Para ello se inicializó OpenSpec en el proyecto, se integraron reglas de LIDR ai-specs y se configuraron instrucciones para GitHub Copilot.

También se creó una especificación para agregar integración continua al proyecto, ubicada en `openspec/changes/add-ci-node-angular/`, con archivos `proposal.md`, `design.md` y `tasks.md`. A partir de esa especificación, se creó un workflow de GitHub Actions en `.github/workflows/ci.yml`.

El workflow ejecuta validaciones separadas para backend y frontend usando Node.js 20, `actions/checkout@v4`, `actions/setup-node@v4`, `npm ci` y `npm run build`. Fue probado en un Pull Request hacia `main` y luego después del merge por evento `push`, obteniendo checks exitosos para backend y frontend.

### Documentación de integración externa

Se elaboró documentación de integración para conectar Relacción Lite Plus con Zoho CRM mediante n8n. El flujo documentado consistió en usar un nodo Webhook para recibir datos desde WhatsApp y un nodo de acción en Zoho CRM para crear un posible cliente.

El mapeo incluyó datos como nombre, teléfono y último mensaje, usando variables dinámicas como `{{ $json.body.name }}`, `{{ $json.body.number }}` y `{{ $json.body.lastMessage.text }}`. Esta documentación permitió relacionar los conceptos de workflows desarrollados en el sistema con un caso real de automatización externa.

### Levantamiento de fallos funcionales en Orquestium y Proyseival

Se documentaron fallos funcionales encontrados en módulos como catálogo, inventario, ventas, logística, producción, recursos, proveedores, comercial, solicitudes y garantías. Entre los hallazgos se identificaron errores visuales, problemas de paginación, textos en inglés dentro de la interfaz, validaciones incompletas, inconsistencias en estados inicial/final, datos que no persistían correctamente, valores económicos en cero, errores 422, historiales incompletos y problemas de navegación o detalle.

Estos reportes contribuyeron al control de calidad del sistema, permitiendo identificar comportamientos que requerían corrección o validación adicional.

## Metodología de trabajo

La metodología aplicada combinó prácticas ágiles, trabajo incremental y validación continua. Las actividades se organizaron por módulos y funcionalidades, priorizando cambios pequeños y verificables. Para las tareas de desarrollo se siguió un flujo de análisis, implementación, prueba manual, ajuste y documentación.

También se aplicó Spec Driven Development en actividades específicas. Este enfoque consistió en definir primero la especificación del cambio, luego documentar el diseño, dividir el trabajo en tareas y finalmente implementar la solución. Esta metodología permitió reducir ambigüedad, mejorar la comunicación con herramientas de IA como GitHub Copilot y validar que los cambios cumplieran criterios definidos previamente.

## Herramientas utilizadas

- Angular para el desarrollo frontend.
- Node.js y NestJS para el backend.
- Inngest para ejecución de procesos en background.
- Nginx como proxy inverso para acceso en red local.
- OpenSpec para documentación de especificaciones.
- GitHub Copilot como asistente de desarrollo guiado por especificaciones.
- GitHub Actions para integración continua.
- Git y GitHub para control de versiones y Pull Requests.
- Trello para seguimiento de algunas actividades.
- n8n para documentación de automatización externa.
- Zoho CRM como sistema destino en la integración documentada.
- Jasmine/Karma y archivos `.spec.ts` para pruebas unitarias en Angular.

## Habilidades esperadas y adquiridas

### Habilidades esperadas

- Desarrollo frontend y backend.
- Integración de sistemas.
- Manejo de control de versiones.
- Trabajo en equipo.
- Documentación técnica.
- Pruebas y validación de software.
- Análisis de requerimientos y flujos de negocio.

### Habilidades adquiridas o fortalecidas

- Implementación de editores visuales basados en nodos.
- Manejo de ejecución asíncrona y workflows en background.
- Integración de servicios mediante Inngest.
- Uso de variables dinámicas y contexto de ejecución en workflows.
- Implementación de pruebas unitarias en Angular.
- Aplicación de Spec Driven Development con OpenSpec.
- Configuración de GitHub Actions para CI.
- Documentación de integraciones externas.
- Levantamiento y clasificación de fallos funcionales.
- Depuración de errores entre frontend, backend y runtime.

### Habilidades pendientes de fortalecer

- Mayor automatización de pruebas end-to-end.
- Cobertura más amplia de pruebas para flujos completos.
- Monitoreo avanzado de ejecuciones en background.
- Documentación técnica más estandarizada por módulo.

## Obstáculos enfrentados y soluciones aplicadas

Uno de los principales obstáculos fue el manejo correcto de variables dinámicas entre nodos. Algunas expresiones no se resolvían correctamente o existían diferencias entre los datos mostrados en el editor y los datos disponibles en el runtime. Para resolverlo, se normalizaron schemas, se corrigió la conversión de `dataSchema`, se restauró el soporte de variables cortas y se validó la compatibilidad con rutas largas.

También se identificaron limitaciones en el nodo Formulario, ya que inicialmente trabajaba con campos estáticos. Esto se solucionó mediante un refactor que permitió campos dinámicos, distintos tipos de dato, edición de múltiples campos y envío de respuestas al contexto `$json`.

Otro obstáculo fue la necesidad de alinear las pruebas manuales de nodos, especialmente HTTP, Database e If/Else, con la ejecución real del motor. Se solucionó ajustando la estructura de respuesta, validando status, headers y body, y probando flujos completos.

En el trabajo con OpenSpec y LIDR ai-specs se presentó un error 404 al intentar instalar un paquete mediante npm. Como solución, se usó el repositorio oficial de LIDR ai-specs y se copiaron manualmente los archivos necesarios al proyecto.

En la validación funcional de Orquestium y Proyseival se encontraron errores de persistencia, visualización y reglas de negocio. Estos fueron documentados de forma estructurada para facilitar su revisión y corrección posterior.

## Cronograma de actividades

| Semana | Actividades principales |
|---|---|
| 1-2 | Revisión del proyecto, análisis del sistema de workflows y reconocimiento de frontend/backend. |
| 3-4 | Integración inicial de Inngest, registro de funciones y endpoint de ejecución. |
| 5-6 | Desarrollo del editor visual: canvas, drag and drop, conexión de nodos y paneles de propiedades. |
| 7-8 | Implementación y ajustes de nodos Trigger, HTTP, Webhook Trigger y Database. |
| 9-10 | Implementación de nodos Delay, Notificación e If/Else; validación de ramas true/false. |
| 11 | Refactor del nodo Formulario y corrección de variables dinámicas. |
| 12 | Implementación del nodo Code y validación de flujos reales. |
| 13 | Configuración de pruebas unitarias `.spec.ts` para Project, Tasks y Workflows. |
| 14 | Implementación de OpenSpec, GitHub Copilot y workflow CI con GitHub Actions. |
| 15 | Documentación de integración externa con n8n, Relacción Lite Plus y Zoho CRM. |
| 16 | Levantamiento de fallos funcionales, documentación final y consolidación de evidencias. |

## Flujo lógico o arquitectónico del sistema

El sistema permite que un usuario cree un workflow desde un editor visual. El flujo inicia mediante un nodo de entrada, como Trigger, Webhook Trigger o Formulario. A partir de ese punto, los datos recibidos se almacenan en el contexto de ejecución y pueden ser consumidos por los nodos siguientes mediante variables dinámicas como `$json`, `{{ campo }}` o rutas basadas en nodos anteriores.

Durante la ejecución, el motor procesa cada nodo según su tipo. Un nodo HTTP puede consumir servicios externos; un nodo If/Else puede evaluar condiciones y decidir la ruta de ejecución; un nodo Database puede insertar, actualizar o consultar datos; un nodo Delay puede pausar el flujo; un nodo Code puede transformar información mediante JavaScript; y un nodo Notificación puede generar una salida hacia un usuario o destinatario.

La ejecución en background se apoya en Inngest, permitiendo que los eventos de entrada sean gestionados de manera asíncrona. El frontend permite configurar visualmente el flujo, el backend mantiene la lógica de ejecución y la base de datos conserva la configuración de nodos, conexiones y tipos de workflow.

## Relación con el perfil profesional

La práctica se relaciona directamente con el perfil profesional del ingeniero de software porque permitió aplicar competencias de análisis, diseño, desarrollo, pruebas, documentación, integración y mantenimiento de sistemas. El trabajo realizado exigió comprender requerimientos funcionales, transformar necesidades en componentes técnicos y validar que las soluciones funcionaran dentro de un sistema real.

Además, la experiencia fortaleció el uso de herramientas modernas de desarrollo, control de versiones, automatización, pruebas unitarias e integración continua. También permitió desarrollar criterio técnico para detectar fallos, documentar evidencias, proponer mejoras y trabajar con metodologías guiadas por especificaciones.

## Conclusiones

La práctica profesional permitió participar en el desarrollo de un sistema de workflows con funcionalidades reales de automatización, integración y procesamiento de datos. Se implementaron nodos configurables, se mejoró el editor visual, se corrigieron problemas de variables dinámicas y se validó la ejecución de flujos completos.

El uso de Inngest permitió fortalecer la ejecución en segundo plano, mientras que las pruebas unitarias ayudaron a validar servicios y componentes críticos del frontend. La implementación de OpenSpec y GitHub Actions aportó una forma más ordenada de trabajar, donde los cambios se especifican antes de implementarse y se validan automáticamente mediante CI.

También se comprendió la importancia de documentar integraciones, evidencias y fallos funcionales, ya que estos elementos permiten mejorar la trazabilidad del trabajo y facilitan la comunicación técnica con otros miembros del equipo.

## Recomendaciones

Se recomienda mantener documentación técnica actualizada para cada tipo de nodo, incluyendo descripción, propiedades configurables, variables disponibles, ejemplos de uso y posibles errores. También se recomienda ampliar la cobertura de pruebas end-to-end para validar flujos completos desde el editor hasta la ejecución real.

Es conveniente registrar todas las actividades realizadas en herramientas de seguimiento como Trello, incluso aquellas que surgen como correcciones o mejoras durante el desarrollo. Esto ayuda a conservar trazabilidad y a demostrar con mayor claridad el avance realizado durante la práctica.

Finalmente, se recomienda continuar usando Spec Driven Development para nuevas funcionalidades, especialmente cuando se trabaje con herramientas de IA, ya que este enfoque reduce ambigüedades y permite implementar cambios de forma más controlada.

## Anexos o evidencias

- **Anexo 1:** Pruebas Unitarias Workflows. Evidencia de pruebas en Project, Tasks y Workflows.
- **Anexo 2:** Implementación de Spec Driven Development con OpenSpec y GitHub Copilot.
- **Anexo 3:** Spec Orquestium. Documento explicativo sobre especificaciones, reglas, tareas y criterios de aceptación.
- **Anexo 4:** OrquestiumFinal. Levantamiento de fallos funcionales en módulos de catálogo, inventario, ventas, logística, producción y comercial.
- **Anexo 5:** Fallos Proyseival. Reporte de fallos en garantías, ejecución de pasos, solicitudes y validaciones.
- **Anexo 6:** Documentación de Integración. Automatización Relacción Lite Plus hacia Zoho CRM mediante n8n.

