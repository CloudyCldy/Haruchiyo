import { DictionaryEntry } from "./types";

export const initialDictionaryEntries: DictionaryEntry[] = [
  // 1. Gestión de proyectos
  {
    id: "project-charter",
    term: "Project Charter (Acta de Constitución)",
    synonyms: ["Acta de Constitución del Proyecto", "Project Charter", "Carta del Proyecto"],
    definition: "Documento emitido formalmente por el patrocinador o iniciador que autoriza formalmente la existencia de un proyecto y confiere al director del proyecto la autoridad para asignar recursos organizacionales a las actividades del proyecto.",
    beginnerExplanation: "Es el documento oficial de nacimiento del proyecto. Resume para qué sirve, quién lo lidera, qué presupuesto tiene y cuándo debería estar terminado.",
    category: "gestion_proyectos",
    example: "El Project Charter de Sakura Coffee definió el lanzamiento de la app móvil en 4 meses, autorizando al Project Manager a gestionar 5 desarrolladores y \$50,000 USD de presupuesto.",
    relatedConcepts: ["alcance", "hito", "gestion_cambio"],
    recommendations: ["Asegurar la firma de todos los patrocinadores clave antes de iniciar la ejecución.", "Mantener el documento conciso (1-3 páginas) evitando detalles técnicos prematuros."],
    translations: { es: "Acta de Constitución del Proyecto", en: "Project Charter" },
    searchVariants: ["project charter", "acta constitucion", "carta de proyecto", "charter"]
  },
  {
    id: "wbs-edt",
    term: "WBS / EDT (Estructura de Desglose del Trabajo)",
    synonyms: ["EDT", "WBS", "Work Breakdown Structure", "Estructura de Desglose del Trabajo"],
    definition: "Descomposición jerárquica y orientada a entregables del trabajo total que debe ejecutar el equipo del proyecto para lograr los objetivos y crear los entregables requeridos. Cada nivel descendente representa una definición cada vez más detallada del trabajo.",
    beginnerExplanation: "Es un mapa o diagrama que divide un proyecto grande en pedazos más pequeños y manejables, como cajitas dentro de cajitas.",
    category: "gestion_proyectos",
    example: "En Haitani, la WBS nivel 1 tiene 'Módulo de Facturación', nivel 2 'Integración MercadoPago' y nivel 3 'Endpoint de Webhook'.",
    relatedConcepts: ["project-charter", "ruta-critica", "hito"],
    recommendations: ["Aplicar la regla del 100%: la suma de los paquetes de trabajo debe representar el 100% del alcance y nada más.", "El nivel más bajo debe ser un paquete de trabajo medible asignable a un responsable."],
    translations: { es: "Estructura de Desglose del Trabajo (EDT)", en: "Work Breakdown Structure (WBS)" },
    searchVariants: ["wbs", "edt", "work breakdown", "desglose del trabajo"]
  },
  {
    id: "ruta-critica",
    term: "Ruta Crítica (CPM - Critical Path Method)",
    synonyms: ["CPM", "Critical Path", "Camino Crítico"],
    definition: "Secuencia de actividades dependientes de principio a fin del proyecto que determina la duración total mínima posible del mismo. Cualquier retraso en una actividad de la ruta crítica retrasará la fecha de finalización del proyecto.",
    beginnerExplanation: "Es la cadena de tareas más larga que no tiene tiempo libre; si alguna de estas tareas se atrasa un solo día, todo el proyecto se atrasará ese día.",
    category: "gestion_proyectos",
    example: "Si la autenticación tarda 5 días y el catálogo 3 días antes de las pruebas de integración, la autenticación está en la ruta crítica.",
    relatedConcepts: ["wbs-edt", "hito", "metricas-analisis"],
    recommendations: ["Monitorear las tareas de la ruta crítica en cada reunión de seguimiento semanal.", "Calcular la holgura (slack) de las tareas que no están en la ruta crítica para reasignar recursos."],
    translations: { es: "Ruta Crítica", en: "Critical Path Method (CPM)" },
    searchVariants: ["ruta critica", "cpm", "camino critico", "critical path"]
  },
  {
    id: "hito",
    term: "Hito (Milestone)",
    synonyms: ["Milestone", "Punto de Control", "Entrega Clave"],
    definition: "Punto o evento de referencia significativo dentro del cronograma del proyecto con duración cero (0 días), que marca la finalización de una fase o la entrega de un resultado crítico.",
    beginnerExplanation: "Una fecha clave o bandera de llegada que marca un logro importante del equipo, como 'Lanzamiento de versión beta'.",
    category: "gestion_proyectos",
    example: "Hito M1: 'Base de datos y autenticación desplegadas en staging el 15 de Octubre'. Duración: 0 días.",
    relatedConcepts: ["project-charter", "ruta-critica", "sprint"],
    recommendations: ["No confundir un hito con una tarea larga; el hito es un estado o momento cumplido.", "Vincular los pagos del cliente o la aprobación de stakeholders al cumplimiento de hitos."],
    translations: { es: "Hito", en: "Milestone" },
    searchVariants: ["hito", "milestone", "hitos", "milestones"]
  },

  // 2. Scrum y Agile
  {
    id: "sprint",
    term: "Sprint",
    synonyms: ["Iteración", "Timebox", "Ciclo de Sprint"],
    definition: "Evento de longitud fija de un mes o menos (típicamente 2 semanas) que contiene y encapsula todos los demás eventos de Scrum, donde se crea un incremento de producto potencialmente entregable y de valor.",
    beginnerExplanation: "Un periodo corto y protegido (habitualmente de 2 semanas) donde el equipo se concentra en construir una lista acordada de tareas sin interrupciones externas.",
    category: "scrum_agile",
    example: "El equipo de Haitani ejecutó el Sprint 4 del 1 al 14 de octubre con el objetivo de habilitar el panel de análisis de riesgos.",
    relatedConcepts: ["product-backlog", "sprint-backlog", "definition-of-done"],
    recommendations: ["Mantener la duración de los sprints consistente para calibrar con precisión la velocidad.", "No cambiar el objetivo del Sprint a mitad de camino salvo situaciones excepcionales acordadas con el Product Owner."],
    translations: { es: "Sprint / Iteración", en: "Sprint" },
    searchVariants: ["sprint", "iteracion", "ciclo sprint", "sprints"]
  },
  {
    id: "product-backlog",
    term: "Product Backlog (Pila de Producto)",
    synonyms: ["Pila de Producto", "Backlog del Producto", "Product Backlog"],
    definition: "Lista ordenada y viva de todo lo que se conoce que es necesario en el producto. Es la única fuente de requisitos para cualquier cambio que se realice en el producto, bajo la responsabilidad del Product Owner.",
    beginnerExplanation: "Una lista ordenada de todas las ideas, funciones, mejoras y correcciones que quisiéramos que tenga el sistema en el futuro.",
    category: "scrum_agile",
    example: "El Product Backlog de Sanzu contiene historias como 'Soporte para OpenAI Provider' y 'Búsqueda por sinónimos en diccionario'.",
    relatedConcepts: ["sprint-backlog", "user-story", "product-owner"],
    recommendations: ["Realizar refinamiento continuo (Backlog Refinement) para que los ítems superiores estén listos para el siguiente sprint.", "Priorizar por valor de negocio y riesgo técnico, no por orden de llegada."],
    translations: { es: "Pila del Producto", en: "Product Backlog" },
    searchVariants: ["product backlog", "pila del producto", "backlog", "pila de producto"]
  },
  {
    id: "sprint-backlog",
    term: "Sprint Backlog",
    synonyms: ["Pila de Sprint", "Backlog del Sprint"],
    definition: "Conjunto de elementos del Product Backlog seleccionados para el Sprint, junto con el objetivo del Sprint (Sprint Goal) y un plan de acción detallado para entregar el incremento.",
    beginnerExplanation: "La lista de tareas que el equipo prometió hacer durante las dos semanas del sprint actual para cumplir el objetivo acordado.",
    category: "scrum_agile",
    example: "Para el Sprint 2, el Sprint Backlog incluyó 8 historias sumando 34 puntos de historia con el Sprint Goal de 'Completar pasarela de cobros'.",
    relatedConcepts: ["sprint", "product-backlog", "daily-scrum"],
    recommendations: ["El equipo de desarrollo es el único dueño del Sprint Backlog.", "Hacer visible el avance diariamente actualizando el estado de cada tarea en el tablero."],
    translations: { es: "Pila del Sprint", en: "Sprint Backlog" },
    searchVariants: ["sprint backlog", "pila del sprint", "backlog del sprint"]
  },
  {
    id: "daily-scrum",
    term: "Daily Scrum (Reunión Diaria)",
    synonyms: ["Daily Standup", "Daily", "Reunión Diaria"],
    definition: "Evento de inspección y adaptación de máximo 15 minutos para los desarrolladores del Scrum Team, llevado a cabo cada día hábil para sincronizar actividades y crear un plan para las siguientes 24 horas hacia el Sprint Goal.",
    beginnerExplanation: "Una reunión de pie muy rápida de 15 minutos donde cada uno cuenta qué hizo ayer, qué hará hoy y si tiene algo que lo está trabando.",
    category: "scrum_agile",
    example: "En la Daily de las 9:30 AM, el dev de backend avisó que la API de pagos devolvía error 502, coordinando ayuda inmediata.",
    relatedConcepts: ["sprint", "impedimento", "scrum-master"],
    recommendations: ["No convertir la Daily en un reporte de estatus para el jefe; es para que el equipo sincronice su trabajo.", "Resolver discusiones profundas fuera de los 15 minutos ('parking lot')."],
    translations: { es: "Reunión Diaria de Scrum", en: "Daily Scrum / Standup" },
    searchVariants: ["daily", "daily scrum", "standup", "reunion diaria"]
  },
  {
    id: "definition-of-done",
    term: "Definition of Done (DoD - Definición de Terminado)",
    synonyms: ["DoD", "Criterios de Terminado", "Definición de Hecho"],
    definition: "Descripción formal del estado del incremento cuando cumple las medidas de calidad requeridas para el producto. En el momento en que un elemento del Product Backlog cumple la Definición de Terminado, nace un Incremento.",
    beginnerExplanation: "La lista de chequeo de calidad que debe cumplir cualquier tarea para poder decir 'está 100% terminada' (por ejemplo: código revisado, pruebas pasadas y documentado).",
    category: "scrum_agile",
    example: "DoD de Haitani: 'Código con cobertura > 80%, pruebas Playwright exitosas, PR aprobado por 2 pares y desplegado en staging'.",
    relatedConcepts: ["definition-of-ready", "acceptance-criteria", "code-review"],
    recommendations: ["Toda la organización debe compartir y respetar los estándares mínimos de la DoD.", "No dar por finalizada una tarea si no cumple todos los puntos de la DoD."],
    translations: { es: "Definición de Terminado", en: "Definition of Done (DoD)" },
    searchVariants: ["dod", "definition of done", "definicion de terminado", "criterios de terminado"]
  },
  {
    id: "definition-of-ready",
    term: "Definition of Ready (DoR - Definición de Listo)",
    synonyms: ["DoR", "Criterios de Preparación", "Definición de Preparado"],
    definition: "Conjunto de condiciones y acuerdos que un elemento del Product Backlog debe satisfacer antes de ser admitido en la planificación del sprint, asegurando que esté claro, estimado y sin bloqueos previos.",
    beginnerExplanation: "Una regla para no empezar tareas a ciegas. Si una tarea no tiene descripción clara, criterios de aceptación o diseño, no entra al sprint.",
    category: "scrum_agile",
    example: "DoR de Sanzu: 'Historia con formato Como/Quiero/Para, criterios Given-When-Then, estimada en puntos y dependencias resueltas'.",
    relatedConcepts: ["definition-of-done", "user-story", "product-backlog"],
    recommendations: ["Evitar que la DoR se convierta en una barrera burocrática inflexible; debe fomentar la claridad colaborativa.", "Revisar la DoR en retrospectivas si entran historias mal comprendidas al sprint."],
    translations: { es: "Definición de Listo / Preparado", en: "Definition of Ready (DoR)" },
    searchVariants: ["dor", "definition of ready", "definicion de listo", "criterios de preparacion"]
  },
  {
    id: "user-story",
    term: "User Story (Historia de Usuario)",
    synonyms: ["Historia de Usuario", "User Story", "HU"],
    definition: "Explicación informal y general de una característica de software escrita desde la perspectiva del usuario final o cliente, con el objetivo de articular cómo proporcionará valor de negocio.",
    beginnerExplanation: "Una frase sencilla que describe qué necesita el usuario y por qué: 'Como [usuario], quiero [acción] para [beneficio]'.",
    category: "scrum_agile",
    example: "'Como administrador de Haitani, quiero exportar las tareas a PDF para presentar informes semanales a la gerencia'.",
    relatedConcepts: ["acceptance-criteria", "product-backlog", "story-points"],
    recommendations: ["Seguir el modelo INVEST: Independiente, Negociable, Valiosa, Estimable, Pequeña (Small) y Testeable.", "Acompañar siempre la historia con criterios de aceptación claros."],
    translations: { es: "Historia de Usuario", en: "User Story" },
    searchVariants: ["historia de usuario", "user story", "hu", "historias de usuario"]
  },
  {
    id: "acceptance-criteria",
    term: "Criterios de Aceptación (Acceptance Criteria)",
    synonyms: ["Criterios de Aceptación", "Acceptance Criteria", "Criterios de Éxito"],
    definition: "Conjunto de condiciones específicas y verificables que debe satisfacer una historia de usuario para que sea aceptada por el Product Owner o usuario final, frecuentemente formuladas en formato BDD (Given / When / Then).",
    beginnerExplanation: "Los requisitos puntuales que se prueban para decir si la función hace exactamente lo que el cliente pidió.",
    category: "scrum_agile",
    example: "Dado que el usuario no tiene sesión activa, cuando hace clic en /admin, entonces el sistema lo redirige al login con código 401.",
    relatedConcepts: ["user-story", "definition-of-done", "qa-testing"],
    recommendations: ["Escribir los criterios de aceptación antes de comenzar a programar.", "Usarlos directamente como base para los casos de prueba automatizados en Playwright o Jest."],
    translations: { es: "Criterios de Aceptación", en: "Acceptance Criteria" },
    searchVariants: ["criterios de aceptacion", "acceptance criteria", "criterios de exito"]
  },

  // 3. Kanban y Lean
  {
    id: "wip-limit",
    term: "WIP Limit (Límite de Trabajo en Progreso)",
    synonyms: ["Límite WIP", "Work In Progress Limit", "Límite de Trabajo en Proceso"],
    definition: "Estrategia fundamental en Kanban que restringe la cantidad máxima de elementos que pueden existir simultáneamente en una columna o etapa del flujo de trabajo, forzando a 'terminar antes de empezar'.",
    beginnerExplanation: "Un freno para evitar el caos. Si la columna 'En Desarrollo' tiene un límite de 3 tareas, nadie puede agarrar una cuarta tarea hasta que termine una de las 3 anteriores.",
    category: "kanban_lean",
    example: "Al limitar la columna 'En Revisión' a un máximo de 2 PRs, los desarrolladores dejan de codificar para revisar los PRs acumulados.",
    relatedConcepts: ["lead-time", "cycle-time", "cuello-botella"],
    recommendations: ["Empezar con límites conservadores (ej. número de personas + 1) e ir ajustando con base en los cuellos de botella observados.", "Nunca ignorar una alerta de límite WIP sobrepasado."],
    translations: { es: "Límite de Trabajo en Progreso", en: "Work in Progress (WIP) Limit" },
    searchVariants: ["wip limit", "limite wip", "work in progress", "trabajo en progreso"]
  },
  {
    id: "lead-time",
    term: "Lead Time (Tiempo de Entrega)",
    synonyms: ["Tiempo de Entrega", "Lead Time"],
    definition: "Tiempo total transcurrido desde que una solicitud o requisito es formulado o ingresado al sistema hasta que es entregado completamente al usuario o cliente en producción.",
    beginnerExplanation: "El reloj total: desde el segundo en que el cliente pidió una función hasta el día en que ya la está usando en la app.",
    category: "kanban_lean",
    example: "Un cliente reportó una mejora el 1 de septiembre y se desplegó en producción el 20 de septiembre: Lead Time = 19 días.",
    relatedConcepts: ["cycle-time", "throughput", "wip-limit"],
    recommendations: ["Medir el Lead Time para gestionar las expectativas de los clientes y acuerdos de nivel de servicio (SLA).", "Atacar los tiempos de espera pasivos (colas) para reducir el Lead Time sin sobrecargar al equipo."],
    translations: { es: "Tiempo de Entrega", en: "Lead Time" },
    searchVariants: ["lead time", "tiempo de entrega", "tiempo total"]
  },
  {
    id: "cycle-time",
    term: "Cycle Time (Tiempo de Ciclo)",
    synonyms: ["Tiempo de Ciclo", "Cycle Time"],
    definition: "Tiempo transcurrido desde que el equipo comienza efectivamente a trabajar en una tarea o ítem (estado 'En Proceso') hasta que dicha tarea se completa y satisface la Definición de Terminado.",
    beginnerExplanation: "El tiempo real de trabajo activo: desde que un desarrollador mueve la tarjeta a 'Haciendo' hasta que pasa a 'Terminada'.",
    category: "kanban_lean",
    example: "Una tarea de autenticación comenzó a programarse el lunes y se aprobó el miércoles: Cycle Time = 2 días (aunque estuvo 10 días en el backlog).",
    relatedConcepts: ["lead-time", "wip-limit", "throughput"],
    recommendations: ["El Cycle Time es el mejor indicador de la eficiencia técnica del proceso de desarrollo.", "Analizar las tareas con Cycle Time atípicamente largo en las retrospectivas."],
    translations: { es: "Tiempo de Ciclo", en: "Cycle Time" },
    searchVariants: ["cycle time", "tiempo de ciclo", "tiempo ciclo"]
  },
  {
    id: "cuello-botella",
    term: "Cuello de Botella (Bottleneck)",
    synonyms: ["Bottleneck", "Punto de Congestión", "Restricción de Flujo"],
    definition: "Etapa en una cadena de procesos cuya capacidad es menor que la demanda colocada sobre ella, determinando y limitando la capacidad máxima de entrega de todo el sistema (Teoría de Restricciones).",
    beginnerExplanation: "El embudo o paso más lento del proceso que frena a todos los demás, como cuando hay 10 programadores haciendo funciones pero solo 1 persona revisando código.",
    category: "kanban_lean",
    example: "En Haitani, las tareas se apilaban en 'Revisión QA' porque el entorno de pruebas tardaba 2 horas en desplegar cada versión.",
    relatedConcepts: ["wip-limit", "cycle-time", "lead-time"],
    recommendations: ["Identificar la restricción y subordinar todo el ritmo de trabajo a la capacidad de esa etapa.", "Elevar la restricción mediante automatización (pruebas automáticas, CI/CD)."],
    translations: { es: "Cuello de Botella", en: "Bottleneck" },
    searchVariants: ["cuello de botella", "bottleneck", "congestion", "embudo"]
  },

  // 4. XP y prácticas de desarrollo
  {
    id: "tdd",
    term: "TDD (Test-Driven Development)",
    synonyms: ["Desarrollo Guiado por Pruebas", "Test Driven Development", "TDD"],
    definition: "Práctica de desarrollo de software donde los requisitos se traducen en casos de prueba muy específicos antes de escribir el código de producción, siguiendo el ciclo Red-Green-Refactor (Rojo, Verde, Refactorizar).",
    beginnerExplanation: "Escribir primero la prueba que falla, luego escribir el código justo y necesario para que pase la prueba, y al final limpiar y mejorar el código.",
    category: "xp_practicas",
    example: "En Sanzu, primero se creó el test que esperaba 422 ante un sprint con fechas invertidas, y luego se escribió la validación Zod.",
    relatedConcepts: ["refactoring", "pair-programming", "pruebas-unitarias"],
    recommendations: ["No omitir la fase de refactorización; el código verde debe dejarse limpio y mantenible.", "Mantener las pruebas unitarias rápidas e independientes de servicios externos."],
    translations: { es: "Desarrollo Guiado por Pruebas (TDD)", en: "Test-Driven Development (TDD)" },
    searchVariants: ["tdd", "test driven development", "desarrollo guiado por pruebas", "red green refactor"]
  },
  {
    id: "refactoring",
    term: "Refactorización (Refactoring)",
    synonyms: ["Refactoring", "Refactor", "Limpieza de Código"],
    definition: "Proceso sistemático de modificar el diseño interno de un programa de software para mejorar su estructura, legibilidad y mantenibilidad sin alterar en absoluto su comportamiento observable externo.",
    beginnerExplanation: "Mejorar cómo está escrito el código por dentro para que sea más claro y fácil de mantener, asegurando que la app siga haciendo exactamente lo mismo por fuera.",
    category: "xp_practicas",
    example: "Extraer la lógica duplicada de autenticación en `server/services/sanzuClient.js` sin alterar las rutas que consumen el servicio.",
    relatedConcepts: ["tdd", "deuda-tecnica", "principios-solid"],
    recommendations: ["Tener pruebas automatizadas sólidas antes de iniciar una refactorización para garantizar que nada se rompa.", "Hacer refactorizaciones pequeñas y continuas en lugar de grandes reescrituras acumuladas."],
    translations: { es: "Refactorización", en: "Refactoring" },
    searchVariants: ["refactoring", "refactorizacion", "refactor", "limpieza de codigo"]
  },
  {
    id: "pair-programming",
    term: "Pair Programming (Programación en Parejas)",
    synonyms: ["Programación en Pares", "Pair Programming"],
    definition: "Técnica de desarrollo de software de Extreme Programming donde dos programadores trabajan juntos en una sola estación de trabajo. Uno, el Conductor (Driver), escribe el código mientras que el otro, el Observador o Navegante (Navigator), revisa cada línea conforme se introduce y piensa en la estrategia.",
    beginnerExplanation: "Dos personas trabajando juntas en la misma pantalla: una teclea y la otra piensa en el panorama general y busca posibles errores en vivo.",
    category: "xp_practicas",
    example: "Dos ingenieros resolvieron la sincronización multi-tenant de Haitani en 3 horas sin introducir fallos de seguridad.",
    relatedConcepts: ["tdd", "code-review", "deuda-tecnica"],
    recommendations: ["Rotar los roles de Conductor y Navegante frecuentemente (cada 20-30 minutos).", "Excelente para tareas complejas o para incorporar desarrolladores novatos al proyecto."],
    translations: { es: "Programación en Parejas", en: "Pair Programming" },
    searchVariants: ["pair programming", "programacion en parejas", "programacion en pares"]
  },

  // 5. Ingeniería de software
  {
    id: "requisitos-funcionales",
    term: "Requisitos Funcionales",
    synonyms: ["Requerimientos Funcionales", "Functional Requirements"],
    definition: "Declaraciones de los servicios que debe prestar el sistema, de cómo debe reaccionar a entradas particulares y de cómo debe comportarse en situaciones concretas, describiendo el 'qué hace' el sistema.",
    beginnerExplanation: "Lo que el software sabe hacer concretamente: 'El usuario puede iniciar sesión con correo y contraseña' o 'El sistema calcula el costo total con IVA'.",
    category: "ingenieria_software",
    example: "Requisito funcional RF-01: 'Haitani debe permitir al administrador registrar un nuevo miembro asignándole rol de admin o member'.",
    relatedConcepts: ["requisitos-no-funcionales", "user-story", "acceptance-criteria"],
    recommendations: ["Documentar cada requisito con identificador único y criterios de validación.", "Evitar ambigüedades como 'la búsqueda debe ser fácil'."],
    translations: { es: "Requisitos Funcionales", en: "Functional Requirements" },
    searchVariants: ["requisitos funcionales", "requerimientos funcionales", "functional requirements"]
  },
  {
    id: "requisitos-no-funcionales",
    term: "Requisitos No Funcionales (NFR)",
    synonyms: ["Requerimientos No Funcionales", "Non-Functional Requirements", "NFR"],
    definition: "Restricciones de los servicios o funciones ofrecidos por el sistema. Incluyen restricciones de tiempo, del proceso de desarrollo, estándares y atributos de calidad como rendimiento, seguridad, disponibilidad y escalabilidad.",
    beginnerExplanation: "Cómo de bien debe funcionar el sistema: su rapidez, seguridad, disponibilidad y capacidad de aguantar miles de usuarios a la vez.",
    category: "ingenieria_software",
    example: "RNF-02: 'La API de Sanzu debe responder el cálculo de métricas en menos de 200 ms bajo una carga de 100 peticiones concurrentes'.",
    relatedConcepts: ["requisitos-funcionales", "arquitectura-software", "seguridad"],
    recommendations: ["Hacerlos medibles cuantitativamente (ej. tiempo de respuesta, porcentaje de uptime, estándares de cifrado).", "Diseñar la arquitectura desde el día 1 considerando los NFRs críticos."],
    translations: { es: "Requisitos No Funcionales", en: "Non-Functional Requirements (NFR)" },
    searchVariants: ["requisitos no funcionales", "nfr", "requerimientos no funcionales"]
  },
  {
    id: "deuda-tecnica",
    term: "Deuda Técnica (Technical Debt)",
    synonyms: ["Technical Debt", "Tech Debt", "Deuda Tecnológica"],
    definition: "Metáfora acuñada por Ward Cunningham que describe el costo acumulado a futuro que implica tomar decisiones técnicas rápidas y atajos de diseño en el presente en lugar de usar un enfoque de mejor calidad pero más lento.",
    beginnerExplanation: "Hacer código rápido y descuidado hoy para salir del paso, sabiendo que en el futuro tendrás que pagar 'intereses' perdiendo más tiempo arreglando errores y refactorizando.",
    category: "ingenieria_software",
    example: "No escribir pruebas automáticas para la autenticación permitió lanzar 3 días antes, pero causó 2 semanas de retraso arreglando fallos de regresión en producción.",
    relatedConcepts: ["refactoring", "tdd", "principios-solid"],
    recommendations: ["Dedicar un 15-20% de la capacidad de cada sprint al pago de deuda técnica.", "Registrar y visibilizar los ítems de deuda técnica en el Product Backlog."],
    translations: { es: "Deuda Técnica", en: "Technical Debt" },
    searchVariants: ["deuda tecnica", "technical debt", "tech debt"]
  },
  {
    id: "principios-solid",
    term: "Principios SOLID",
    synonyms: ["SOLID Principles", "Reglas SOLID"],
    definition: "Acrónimo de cinco principios de diseño orientado a objetos y arquitectura de software formulados por Robert C. Martin: Single Responsibility (S), Open/Closed (O), Liskov Substitution (L), Interface Segregation (I) y Dependency Inversion (D).",
    beginnerExplanation: "Cinco buenas prácticas de diseño para que el código sea modular, fácil de entender, extensible y no se rompa cuando se agregue una nueva función.",
    category: "ingenieria_software",
    example: "El cliente `sanzuClient.js` sigue el principio de Responsabilidad Única (SRP) ocupándose únicamente de la comunicación HTTP segura con Sanzu.",
    relatedConcepts: ["inyeccion-dependencias", "arquitectura-software", "refactoring"],
    recommendations: ["Comprender la intención de cada principio antes de sobre-diseñar o agregar capas innecesarias.", "Prestar especial atención a la Inversión de Dependencias para facilitar pruebas automatizadas con mocks."],
    translations: { es: "Principios SOLID", en: "SOLID Principles" },
    searchVariants: ["solid", "principios solid", "solid principles"]
  },

  // 6. Programación y arquitectura
  {
    id: "inyeccion-dependencias",
    term: "Inyección de Dependencias (Dependency Injection)",
    synonyms: ["Dependency Injection", "DI", "Inversión de Control"],
    definition: "Patrón de diseño de software en el que un objeto recibe otras dependencias de las que necesita para operar desde el exterior, en lugar de crearlas internamente, desacoplando la construcción del uso.",
    beginnerExplanation: "En lugar de que una función fabrique su propia herramienta internamente, se la pasas desde afuera como parámetro, lo que permite cambiarla fácilmente por una falsa en las pruebas.",
    category: "programacion_arquitectura",
    example: "Pasar la instancia de `database` a los controladores de Express (`req.app.locals.database`) en lugar de requerir una conexión fija global.",
    relatedConcepts: ["principios-solid", "pruebas-unitarias", "microservicios"],
    recommendations: ["Facilita enormemente las pruebas unitarias permitiendo inyectar mocks o stubs en memoria.", "No sobre-complejizar con contenedores DI pesados si una inyección por parámetros o constructor es suficiente."],
    translations: { es: "Inyección de Dependencias", en: "Dependency Injection" },
    searchVariants: ["inyeccion de dependencias", "dependency injection", "di"]
  },
  {
    id: "microservicios",
    term: "Arquitectura de Microservicios",
    synonyms: ["Microservices", "Microservicios"],
    definition: "Estilo arquitectónico que estructura una aplicación como una colección de servicios autónomos, débilmente acoplados, desplegables de forma independiente y organizados en torno a capacidades de negocio, comunicándose mediante protocolos ligeros (HTTP/REST, gRPC, colas).",
    beginnerExplanation: "Separar un sistema gigante en varios programas pequeños y especializados que trabajan juntos hablando por la red (como Haitani para la gestión y Sanzu para la inteligencia).",
    category: "programacion_arquitectura",
    example: "Haitani (Express + PostgreSQL) opera independientemente de Sanzu (Next.js + MongoDB), comunicándose por peticiones HTTP/JSON autenticadas con API Key.",
    relatedConcepts: ["api-rest", "inyeccion-dependencias", "cloud-despliegues"],
    recommendations: ["Evitar microservicios si el equipo es pequeño y no domina la observabilidad distribuida; un monolito modular suele ser mejor punto de partida.", "Mantener bases de datos separadas por servicio para evitar acoplamiento oculto."],
    translations: { es: "Microservicios", en: "Microservices Architecture" },
    searchVariants: ["microservicios", "microservices", "arquitectura de microservicios"]
  },

  // 7. APIs e integraciones
  {
    id: "api-rest",
    term: "API REST (Representational State Transfer)",
    synonyms: ["RESTful API", "REST API", "Servicio REST"],
    definition: "Estilo arquitectónico para sistemas hipermedia distribuidos que utiliza los métodos estándar de HTTP (GET, POST, PUT, DELETE, PATCH), URI jerárquicas como identificadores de recursos y representaciones sin estado (stateless) típicamente en formato JSON.",
    beginnerExplanation: "Una ventanilla digital donde dos programas se hablan: uno pide datos con una dirección web y el otro le responde con información estructurada en texto JSON.",
    category: "apis_integraciones",
    example: "`GET /api/v1/projects/1/health` devuelve la puntuación de salud de un proyecto en formato JSON.",
    relatedConcepts: ["idempotencia", "rate-limiting", "api-key"],
    recommendations: ["Usar códigos de estado HTTP semánticos correctos (200, 201, 400, 401, 403, 404, 409, 422, 500).", "Versionar la API en la ruta (`/api/v1/`) o mediante encabezados para evitar cambios incompatibles."],
    translations: { es: "API REST", en: "REST API" },
    searchVariants: ["api rest", "rest api", "restful", "api"]
  },
  {
    id: "idempotencia",
    term: "Idempotencia (Idempotence)",
    synonyms: ["Idempotencia", "Idempotence", "Operación Idempotente"],
    definition: "Propiedad de ciertas operaciones y métodos HTTP (GET, PUT, DELETE, HEAD) mediante la cual ejecutar la misma solicitud una o múltiples veces consecutivas produce exactamente el mismo resultado y estado en el servidor sin efectos secundarios adicionales.",
    beginnerExplanation: "Como presionar el botón de apagar una luz que ya está apagada: no importa cuántas veces lo toques, el resultado final no cambia ni se duplican las cosas.",
    category: "apis_integraciones",
    example: "`PUT /api/v1/partner/projects/proj-1/sprints` reemplaza la lista completa de sprints garantizando que reintentar la llamada tras un fallo de red no creará duplicados.",
    relatedConcepts: ["api-rest", "rate-limiting", "webhooks"],
    recommendations: ["Implementar claves de idempotencia (`Idempotency-Key`) en peticiones POST financieras o de creación crítica.", "Diseñar los reintentos automáticos de clientes HTTP únicamente sobre operaciones idempotentes o seguras."],
    translations: { es: "Idempotencia", en: "Idempotency" },
    searchVariants: ["idempotencia", "idempotence", "idempotente"]
  },
  {
    id: "rate-limiting",
    term: "Rate Limiting (Límite de Peticiones)",
    synonyms: ["Límite de Tasa", "Rate Limiting", "Limitación de Tráfico"],
    definition: "Técnica de control de tráfico y seguridad que restringe el número de solicitudes que un cliente, IP o token puede realizar a una API dentro de una ventana de tiempo predefinida, respondiendo típicamente con HTTP 429 Too Many Requests.",
    beginnerExplanation: "Un guardia que frena a los usuarios que hacen demasiadas preguntas por minuto para que el servidor no se sature ni colapse.",
    category: "apis_integraciones",
    example: "Sanzu limita las peticiones a un máximo de 60 solicitudes por minuto por IP, devolviendo el encabezado `Retry-After: 60` si se supera.",
    relatedConcepts: ["api-rest", "seguridad", "api-key"],
    recommendations: ["Incluir encabezados informativos `X-RateLimit-Limit`, `X-RateLimit-Remaining` y `Retry-After`.", "Permitir límites diferenciados para usuarios anónimos versus clientes partner autenticados."],
    translations: { es: "Límite de Peticiones", en: "Rate Limiting" },
    searchVariants: ["rate limiting", "limite de peticiones", "rate limit", "limite de tasa"]
  },

  // 8. Bases de datos
  {
    id: "propiedades-acid",
    term: "Propiedades ACID",
    synonyms: ["ACID", "Atomicidad Consistencia Aislamiento Durabilidad"],
    definition: "Conjunto de cuatro garantías clave que ofrece un sistema de gestión de bases de datos relacionales durante transacciones: Atomicidad (todo o nada), Consistencia (respeto de reglas e integridad), Aislamiento (transacciones concurrentes no interfieren) y Durabilidad (los datos confirmados sobreviven a fallos).",
    beginnerExplanation: "La regla de oro de los bancos: si transfieres dinero, o sale de tu cuenta y llega a la otra, o se cancela todo, pero el dinero nunca desaparece a la mitad.",
    category: "bases_datos",
    example: "Al registrar una organización en Haitani, la creación del tenant, el usuario administrador y la configuración de GitHub se realizan dentro de una transacción PostgreSQL `BEGIN ... COMMIT`.",
    relatedConcepts: ["migracion-db", "postgresql", "orm-prisma"],
    recommendations: ["Usar transacciones para operaciones multi-tabla que requieran consistencia absoluta.", "Mantener las transacciones lo más breves posible para evitar bloqueos (locks) de filas."],
    translations: { es: "Propiedades ACID", en: "ACID Properties" },
    searchVariants: ["acid", "propiedades acid", "atomicidad", "transacciones"]
  },
  {
    id: "migracion-db",
    term: "Migración de Base de Datos",
    synonyms: ["Database Migration", "Migración de Esquema"],
    definition: "Conjunto de scripts versionados y controlados que aplican cambios incrementales y reversibles en la estructura del esquema (tablas, columnas, índices, restricciones) o en los datos de una base de datos.",
    beginnerExplanation: "Un historial ordenado de cambios para la base de datos (como commits de Git), para que todos los programadores y servidores tengan exactamente las mismas tablas.",
    category: "bases_datos",
    example: "Ejecutar `prisma db push` o un script `db:init` para crear de forma idempotente las tablas de tareas y sprints sin perder los datos existentes.",
    relatedConcepts: ["propiedades-acid", "orm-prisma", "git-devops"],
    recommendations: ["Hacer las migraciones hacia adelante y hacia atrás (up y down).", "Diseñar migraciones que permitan despliegues zero-downtime (ej. añadir columnas opcionales primero antes de hacerlas obligatorias)."],
    translations: { es: "Migración de Base de Datos", en: "Database Migration" },
    searchVariants: ["migracion", "database migration", "migracion de esquema", "migraciones"]
  },

  // 9. Git y DevOps
  {
    id: "pull-request",
    term: "Pull Request (PR) / Merge Request",
    synonyms: ["PR", "Pull Request", "Merge Request", "Solicitud de Extracción"],
    definition: "Mecanismo colaborativo en plataformas como GitHub o GitLab mediante el cual un desarrollador notifica al equipo que ha completado un conjunto de cambios en una rama y solicita que sean revisados e integrados en la rama principal.",
    beginnerExplanation: "Una propuesta formal para unir tus cambios al proyecto general, para que tus compañeros revisen que todo funciona bien antes de mezclarlo.",
    category: "git_devops",
    example: "PR #42 en Haitani: 'feat: Añadir exportación de tareas a PDF con soporte multi-tenant'.",
    relatedConcepts: ["ci-cd", "code-review", "pruebas-unitarias"],
    recommendations: ["Mantener los PRs pequeños (< 300 líneas de código) para facilitar revisiones minuciosas y rápidas.", "Exigir que todas las pruebas automatizadas pasen en verde antes de permitir el merge."],
    translations: { es: "Solicitud de Extracción (PR)", en: "Pull Request (PR)" },
    searchVariants: ["pr", "pull request", "merge request", "solicitud de extraccion"]
  },
  {
    id: "ci-cd",
    term: "CI/CD (Integración y Despliegue Continuo)",
    synonyms: ["CI/CD", "Integración Continua", "Despliegue Continuo", "Entrega Continua"],
    definition: "Práctica de DevOps combinada: Integración Continua (CI), donde los cambios de código se compilan y prueban automáticamente en cada commit; y Entrega/Despliegue Continuo (CD), donde los cambios validados se liberan automáticamente en entornos de prueba o producción.",
    beginnerExplanation: "Un robot automático que corre tus pruebas cada vez que guardas código en GitHub, y si todo sale bien, lo publica en internet solito.",
    category: "git_devops",
    example: "El pipeline de GitHub Actions corre `npm test` en Haitani y, tras aprobarse el PR, despliega automáticamente la nueva versión en Render.",
    relatedConcepts: ["pull-request", "pruebas-unitarias", "cloud-despliegues"],
    recommendations: ["Un pipeline de CI rápido (< 5 minutos) incentiva a los desarrolladores a integrar cambios con frecuencia.", "Bloquear cualquier despliegue automático si fallan los tests de seguridad o integración."],
    translations: { es: "Integración y Despliegue Continuo (CI/CD)", en: "Continuous Integration & Continuous Delivery (CI/CD)" },
    searchVariants: ["ci cd", "ci/cd", "integracion continua", "despliegue continuo"]
  },

  // 10. QA y testing
  {
    id: "pruebas-unitarias",
    term: "Pruebas Unitarias (Unit Tests)",
    synonyms: ["Unit Tests", "Tests Unitarios", "Pruebas de Unidad"],
    definition: "Pruebas de software automáticas de grano fino que aíslan una sección específica de código (función, método o módulo) y verifican que se comporte exactamente como se espera en condiciones controladas, aislando cualquier dependencia externa mediante mocks.",
    beginnerExplanation: "Pruebas pequeñitas y veloces que verifican una sola función o cálculo matemático aislado, sin tocar bases de datos ni internet.",
    category: "qa_testing",
    example: "Verificar con Jest que la función `calculateHealthScore(tasks, risks)` devuelva 85 cuando hay 1 riesgo y cero tareas bloqueadas.",
    relatedConcepts: ["pruebas-integracion", "pruebas-e2e", "tdd"],
    recommendations: ["Deben ejecutarse en milisegundos para poder correrse continuamente durante el desarrollo.", "Seguir el patrón AAA: Arrange (Preparar), Act (Actuar), Assert (Afirmar)."],
    translations: { es: "Pruebas Unitarias", en: "Unit Tests" },
    searchVariants: ["pruebas unitarias", "unit tests", "tests unitarios", "prueba unitaria"]
  },
  {
    id: "pruebas-e2e",
    term: "Pruebas de Extremo a Extremo (E2E / Playwright)",
    synonyms: ["E2E Testing", "End-to-End Tests", "Pruebas E2E", "Playwright"],
    definition: "Metodología de prueba que verifica el flujo de una aplicación de principio a fin, simulando el comportamiento real de un usuario en un navegador web o dispositivo para asegurar que todos los componentes integrados (frontend, backend, base de datos) funcionen armónicamente.",
    beginnerExplanation: "Un robot que abre una ventana real de Chrome, escribe el usuario y la contraseña, hace clic en los botones y revisa que la pantalla muestre lo correcto.",
    category: "qa_testing",
    example: "La prueba Playwright en `test/e2e/auth.spec.js` abre el navegador, completa el formulario de acceso y valida la redirección al panel.",
    relatedConcepts: ["pruebas-unitarias", "pruebas-integracion", "ci-cd"],
    recommendations: ["Reservar las pruebas E2E para los flujos más críticos de negocio (login, pagos, creación de proyectos) debido a que son más lentas de ejecutar.", "Usar selectores estables (`data-testid` o roles accesibles) para evitar pruebas frágiles."],
    translations: { es: "Pruebas de Extremo a Extremo", en: "End-to-End (E2E) Testing" },
    searchVariants: ["e2e", "pruebas e2e", "playwright", "end to end"]
  },

  // 11. Seguridad informática
  {
    id: "api-key",
    term: "API Key (Clave de Integración)",
    synonyms: ["Clave API", "API Token", "Partner Key"],
    definition: "Identificador único y secreto transmitido en los encabezados HTTP (típicamente `X-Api-Key`) utilizado para autenticar y autorizar a un programa o servicio externo que consume una API, sin requerir interacción de un usuario humano.",
    beginnerExplanation: "Una contraseña secreta y larga que un sistema le da a otro para que puedan hablarse con confianza y seguridad.",
    category: "seguridad",
    example: "Haitani envía el header `X-Api-Key: sz_live_...` a Sanzu para autenticar sus llamadas de análisis e inteligencia de proyectos.",
    relatedConcepts: ["jwt", "rate-limiting", "api-rest"],
    recommendations: ["Guardar únicamente el hash criptográfico (SHA-256) de la clave en la base de datos de la API.", "Nunca exponer la API Key en el código del navegador web (frontend) ni en repositorios públicos."],
    translations: { es: "Clave API", en: "API Key" },
    searchVariants: ["api key", "clave api", "api token", "partner key"]
  },
  {
    id: "jwt",
    term: "JWT (JSON Web Token)",
    synonyms: ["JSON Web Token", "JWT Token", "Bearer Token"],
    definition: "Estándar abierto (RFC 7519) que define un formato compacto y autónomo para transmitir información de forma segura entre partes como un objeto JSON, firmado digitalmente mediante un secreto (HMAC) o par de claves pública/privada (RSA/ECDSA).",
    beginnerExplanation: "Un pase digital firmado que el servidor le entrega al usuario al iniciar sesión; el usuario lo muestra en cada visita para demostrar quién es sin tener que pedirle la contraseña de nuevo.",
    category: "seguridad",
    example: "Al hacer login en Sanzu, se genera un JWT con expiración de 7 días que se envía en el header `Authorization: Bearer <token>`.",
    relatedConcepts: ["api-key", "seguridad", "api-rest"],
    recommendations: ["Establecer tiempos de expiración prudentes y nunca almacenar información confidencial sin cifrar en el payload.", "Usar cookies `HttpOnly` y `Secure` si se maneja en aplicaciones web para mitigar ataques XSS."],
    translations: { es: "Token Web JSON (JWT)", en: "JSON Web Token (JWT)" },
    searchVariants: ["jwt", "json web token", "bearer token"]
  },

  // 12. Cloud y despliegues
  {
    id: "health-check",
    term: "Health Check (Comprobación de Disponibilidad)",
    synonyms: ["Healthcheck", "Endpoint de Salud", "Liveness Probe"],
    definition: "Ruta o mecanismo HTTP especializado (`GET /health` o `/api/v1/health`) expuesto por una aplicación para que balanceadores de carga, monitores o sistemas externos determinen si el servicio está operativo y listo para recibir tráfico.",
    beginnerExplanation: "Un chequeo médico constante: una ruta rápida donde el sistema contesta 'sigo vivo y funcionando bien'.",
    category: "cloud_despliegues",
    example: "`GET /api/v1/health` devuelve `{ status: 'healthy', timestamp: '...' }` con código HTTP 200.",
    relatedConcepts: ["cloud-despliegues", "microservicios", "ci-cd"],
    recommendations: ["Distinguir entre liveness (el proceso no está congelado) y readiness (la base de datos y dependencias están conectadas).", "Asegurar que la respuesta sea extremadamente rápida y ligera."],
    translations: { es: "Comprobación de Estado / Salud", en: "Health Check" },
    searchVariants: ["health check", "healthcheck", "liveness", "salud"]
  },

  // 13. Métricas y análisis
  {
    id: "velocidad-equipo",
    term: "Velocidad del Equipo (Velocity)",
    synonyms: ["Velocidad de Sprint", "Velocity", "Puntos por Sprint"],
    definition: "Medida empírica de la cantidad de trabajo (expresada habitualmente en puntos de historia o tareas terminadas) que un equipo de desarrollo completa y entrega satisfactoriamente conforme a la Definición de Terminado durante un sprint típico.",
    beginnerExplanation: "El promedio de puntos de historia que el equipo es capaz de terminar en un sprint de dos semanas, lo que ayuda a calcular cuánto podrán hacer en el próximo.",
    category: "metricas_analisis",
    example: "Si el equipo completó 28, 32 y 30 puntos en los últimos 3 sprints, su velocidad promedio estimada es de 30 puntos.",
    relatedConcepts: ["sprint", "burndown-chart", "story-points"],
    recommendations: ["No comparar la velocidad entre diferentes equipos; cada equipo tiene su propia calibración de puntos.", "No usar la velocidad como métrica de productividad punitiva, sino como herramienta de previsibilidad."],
    translations: { es: "Velocidad del Equipo", en: "Team Velocity" },
    searchVariants: ["velocidad", "velocity", "velocidad del equipo", "puntos de sprint"]
  },
  {
    id: "burndown-chart",
    term: "Gráfico Burndown (Burndown Chart)",
    synonyms: ["Gráfico de Quemado", "Sprint Burndown", "Burndown Chart"],
    definition: "Representación gráfica que muestra el trabajo pendiente acumulado a lo largo del tiempo durante un sprint o versión, comparando la línea ideal de avance contra la línea real del trabajo completado.",
    beginnerExplanation: "Un gráfico con una línea que baja hacia cero: muestra cuántas tareas quedan por hacer cada día del sprint para saber si llegaremos a tiempo al final.",
    category: "metricas_analisis",
    example: "Un burndown horizontal a mitad de sprint alertó de que el equipo no estaba cerrando tareas, destapando un problema en el servidor de pruebas.",
    relatedConcepts: ["velocidad-equipo", "sprint-backlog", "cuello-botella"],
    recommendations: ["Actualizar el estado de las tareas diariamente para que el gráfico refleje la realidad.", "Si la línea no baja, investigar bloqueos en lugar de exigir horas extra."],
    translations: { es: "Gráfico de Quemado / Burndown", en: "Burndown Chart" },
    searchVariants: ["burndown", "burndown chart", "grafico de quemado", "grafico burndown"]
  },

  // 14. Gestión de riesgos e incidencias
  {
    id: "matriz-riesgos",
    term: "Matriz de Riesgos (Probabilidad x Impacto)",
    synonyms: ["Risk Matrix", "Matriz Probabilidad Impacto", "Evaluación de Riesgos"],
    definition: "Herramienta visual y analítica para evaluar y priorizar riesgos de proyecto multiplicando la probabilidad de ocurrencia por el impacto potencial (Severidad = Probabilidad × Impacto), clasificándolos en niveles bajo, medio, alto o crítico.",
    beginnerExplanation: "Una tabla que te dice qué problemas potenciales son más peligrosos: una combinación de qué tan probable es que ocurran y qué tan grave sería el daño si pasan.",
    category: "riesgos_incidencias",
    example: "En Sanzu, un riesgo con Probabilidad ALTA (3) e Impacto CRÍTICO (4) recibe una puntuación de severidad de 12/12, activando un plan de contingencia inmediato.",
    relatedConcepts: ["plan-mitigacion", "incidencia", "gestion-proyectos"],
    recommendations: ["Revisar la matriz de riesgos en cada reunión de hito o planificación de sprint.", "Asignar un responsable (Risk Owner) a cada riesgo de severidad media o superior."],
    translations: { es: "Matriz de Riesgos", en: "Risk Matrix (Probability x Impact)" },
    searchVariants: ["matriz de riesgos", "riesgos", "risk matrix", "evaluacion de riesgos"]
  },
  {
    id: "plan-mitigacion",
    term: "Plan de Mitigación de Riesgos",
    synonyms: ["Estrategia de Mitigación", "Plan de Contingencia", "Mitigation Plan"],
    definition: "Conjunto de acciones preventivas o correctivas diseñadas específicamente para reducir la probabilidad de ocurrencia de un riesgo o para amortiguar su impacto en los objetivos del proyecto en caso de materializarse.",
    beginnerExplanation: "El plan 'por si las moscas': lo que vas a hacer con anticipación para que un problema no suceda, o para no quedar atrapado si ocurre.",
    category: "riesgos_incidencias",
    example: "Mitigación del riesgo de caída de Sanzu: Haitani implementó un modo local offline que responde con métricas cacheadas de PostgreSQL.",
    relatedConcepts: ["matriz-riesgos", "incidencia", "health-check"],
    recommendations: ["Elegir entre 4 estrategias de riesgo: Evitar, Mitigar, Transferir o Aceptar.", "Presupuestar tiempo y recursos para ejecutar las acciones de mitigación preventivas."],
    translations: { es: "Plan de Mitigación", en: "Risk Mitigation Plan" },
    searchVariants: ["plan de mitigacion", "mitigacion", "mitigacion de riesgos", "plan de contingencia"]
  },

  // 15. Colaboración y equipos
  {
    id: "matriz-raci",
    term: "Matriz RACI",
    synonyms: ["RACI Matrix", "Matriz de Responsabilidades", "RACI"],
    definition: "Matriz de asignación de responsabilidades que clarifica el rol de los miembros del equipo en cada actividad del proyecto dividiéndolos en: Responsible (quien ejecuta la tarea), Accountable (el único que aprueba y responde por el resultado), Consulted (a quien se consulta previamente) e Informed (a quien se mantiene al tanto).",
    beginnerExplanation: "Un cuadro claro que dice: quién hace el trabajo (R), quién tiene la última palabra (A), a quién hay que pedirle opinión (C) y a quién solo hay que avisarle cuando esté listo (I).",
    category: "colaboracion_equipos",
    example: "Despliegue a producción: Developer es Responsible, Tech Lead es Accountable, QA es Consulted y Project Manager es Informed.",
    relatedConcepts: ["project-charter", "code-review", "gestion-proyectos"],
    recommendations: ["Asegurar que haya exactamente UN Accountable (A) por cada tarea para evitar responsabilidades difusas.", "Revisar que una sola persona no tenga demasiadas 'R' acumuladas para evitar sobrecarga."],
    translations: { es: "Matriz RACI", en: "RACI Matrix" },
    searchVariants: ["matriz raci", "raci", "raci matrix", "responsabilidades"]
  },
  {
    id: "bus-factor",
    term: "Bus Factor (Factor de Autobús)",
    synonyms: ["Truck Factor", "Factor Camión", "Riesgo de Concentración de Conocimiento"],
    definition: "Métrica que representa el número mínimo de integrantes clave de un equipo cuyo cese abrupto de participación (metafóricamente 'ser atropellados por un autobús') dejaría al proyecto incapacitado para continuar debido a la pérdida de conocimiento crítico no compartido.",
    beginnerExplanation: "¿Cuántas personas tendrían que faltar en el equipo para que nadie sepa cómo seguir adelante o arreglar el sistema? Si la respuesta es 1, estás en grave peligro.",
    category: "colaboracion_equipos",
    example: "Si solo un ingeniero conoce la contraseña del servidor y la arquitectura de Sanzu, el Bus Factor del proyecto es 1.",
    relatedConcepts: ["pair-programming", "code-review", "deuda-tecnica"],
    recommendations: ["Fomentar la documentación clara de arquitecturas y procedimientos operativos.", "Utilizar pair programming y revisiones de código cruzadas para elevar el Bus Factor a mínimo 2 o 3."],
    translations: { es: "Factor de Autobús", en: "Bus Factor" },
    searchVariants: ["bus factor", "factor de autobus", "truck factor", "factor camion"]
  }
];
