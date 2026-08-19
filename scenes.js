/* ============================================================
   ESCENAS — contenido situado por obligación.
   Cada escena declara: cabecera de responsabilidad, alertas
   gobernadas (condición, severidad, receptor, acción, supresión,
   escalamiento, vencimiento, autoridad), bloques de contenido y
   AvailableActions (available | blocked_explainable | hidden).
   Una sola acción primaria ordinaria por escena (ER-UX-004).
   ============================================================ */

/* La proyección S3 viva pertenece exclusivamente a app.js. Las escenas
   declarativas no mantienen un adapter paralelo ni una segunda línea temporal. */

const SCENES = {

  /* ================= DIRECCIÓN TÉCNICA ================= */
  "mesa": {
    kind: "derived", navRoot: true,
    title: "Mesa de Dirección",
    subtitle: "Decisiones, riesgos, normas y tareas de gobierno — información de referencia con hora de actualización: la Mesa no decide ni asigna por sí misma",
    cutoff: CUTOFF, revision: "corte 08:14",
    blocks: [
      { type: "notice", tone: "info", text: "Esta información se genera desde los registros del servicio. Ninguna cifra mostrada aquí crea autoridad, prioridad ni asignación por sí sola." },
      { type: "kvgrid", heading: "Situación institucional", items: [
        ["Casos activos", "5"], ["Demanda no servida", "1 diferida con cuidado interino"],
        ["Cobertura nocturna", "contrato vigente · brecha de rescate en revisión"],
        ["Dotación objetivo vs presente", "trabajo social sin titular hoy · cobertura provisional declarada"],
        ["Decisiones institucionales abiertas", "3"], ["Hallazgos con plazo", "1 (fiscalización)"]
      ]},
      { type: "table", heading: "Riesgos y problemas que requieren decisión", cols: ["Riesgo", "Condición", "Responsable", "Vence"], rows: [
        ["Cobertura de respuesta 20:00–08:00 sin fallback probado", "En revisión · rescate del 12-08 con demora de 42 min", "Dirección Técnica", "19-08-2026"],
        ["Función trabajo social sin titular", "Cobertura provisional por enfermería con límites declarados", "Dirección Técnica", "18-08-2026"],
        ["Cartera v2.3 sin ratificar", "Dos prestaciones ofrecidas sin respaldo versionado", "Dirección Técnica", "01-09-2026"]
      ]}
    ],
    actions: [
      { id: "dt-decidir", label: "Emitir decisión institucional", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La decisión quedará atribuida a Dirección Técnica con alcance y vigencia declarados.",
        outcome: { happened: "Decisión institucional emitida y versionada (DI-2026-018).", changed: "La cobertura nocturna queda con fallback obligatorio y revisión en 30 días.", responsible: "Dirección Técnica conserva la verificación del efecto.", next: "Coordinación recibe la obligación de operar el fallback desde el 18-08-2026." } }
    ]
  },
  "mesa-riesgo": {
    kind: "derived", title: "Riesgo residual — cobertura de respuesta 20:00–08:00",
    header: { caseId: "Programa HODOM", person: null, responsible: "Dirección Técnica", revision: "rev. 4", provenance: "Evaluación de cobertura 15-08-2026", cutoff: CUTOFF, risk: "A3", riskText: "Brecha de rescate nocturno sin compensación probada" },
    alerts: [
      { level: "A3", condition: "Rescate del 12-08-2026 con demora de 42 minutos sobre el contrato", severity: "Alta", receptor: "Dirección Técnica", action: "Decidir riesgo residual", suppression: "No suprimible mientras el fallback no esté probado", escalation: "Dirección hospitalaria si no hay decisión al 19-08", expiry: "19-08-2026 09:00", authority: "Contrato de cobertura agosto 2026" }
    ],
    blocks: [
      { type: "section", heading: "Hechos", items: [
        "El rescate del 12-08-2026 23:10 tuvo demora de 42 min sobre el tiempo contractual; el desenlace fue favorable sin daño.",
        "La causa fue una sola línea de contacto sin fallback probado entre 20:00 y 08:00.",
        "El contrato declara canal, receptor, tiempo esperado y fallback; el fallback nunca se ejercitó."
      ]},
      { type: "section", heading: "Alternativas con consecuencia", items: [
        "Aceptar el riesgo residual con revisión en 30 días y fallback por doble canal desde el 18-08.",
        "Suspender ingresos con dependencia alta hasta probar fallback — reduce demanda no servida a cero y traslada presión a Gestión de Camas.",
        "Rechazar el riesgo y escalar a dirección hospitalaria para dotación nocturna."
      ]}
    ],
    actions: [
      { id: "dt-riesgo", label: "Aceptar riesgo residual con fallback y revisión", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Aceptar riesgo residual no lo elimina: queda atribuido, con revisión y fallback obligatorio.",
        outcome: { happened: "Riesgo residual aceptado con condiciones (DI-2026-018).", changed: "Fallback por doble canal obligatorio desde 18-08-2026 20:00; revisión 16-09-2026.", responsible: "Dirección Técnica (aceptación) · Coordinación (operar fallback).", next: "Prueba de fallback programada 18-08-2026 21:00 con acuse." } },
      { id: "dt-riesgo-escalar", label: "Escalar a dirección hospitalaria", kind: "exit", availability: "available" }
    ]
  },
  "mesa-cartera": {
    kind: "derived", title: "Cartera de prestaciones v2.3 — ratificación",
    header: { caseId: "Habilitación operativa", person: null, responsible: "Dirección Técnica", revision: "rev. 2", provenance: "Propuesta técnica 10-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Prestaciones ofrecidas sin respaldo versionado" },
    blocks: [
      { type: "section", heading: "Cambios respecto de v2.2", items: [
        "Agrega terapia ocupacional como disciplina habilitable con cartera y competencia configuradas.",
        "Declara teleatención como canal con los mismos límites de registro que la atención presencial.",
        "Retira una prestación sin uso en 12 meses; la demanda histórica queda conservada como historia."
      ]},
      { type: "kvgrid", heading: "Impacto declarado", items: [
        ["Impacto clínico", "Sí — requiere ratificación de Dirección Técnica"],
        ["Reversión", "Probada: volver a v2.2 no borra actos ya firmados"],
        ["Vigencia propuesta", "01-09-2026"]
      ]}
    ],
    actions: [
      { id: "dt-cartera", label: "Ratificar cartera v2.3 con vigencia 01-09-2026", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Ratificar habilita la oferta; no crea competencias individuales por sí sola.",
        outcome: { happened: "Cartera v2.3 ratificada con vigencia 01-09-2026.", changed: "Terapia ocupacional queda habilitable; la prestación retirada deja de ofrecerse.", responsible: "Dirección Técnica · cada disciplina queda default-deny hasta configurar cartera y competencia.", next: "Seguridad registra la habilitación operativa; coordinación actualiza la oferta publicada." } }
    ]
  },
  "mesa-hallazgo": {
    kind: "derived", title: "Observación de fiscalización — respuesta con evidencia",
    header: { caseId: "Fiscalización SEREMI · acta 31-07-2026", person: null, responsible: "Dirección Técnica", revision: "rev. 1", provenance: "Acta de fiscalización 31-07-2026", cutoff: CUTOFF, risk: "A2", riskText: "Plazo externo 21-08-2026" },
    blocks: [
      { type: "section", heading: "Observación recibida", items: [
        "La fiscalización pide evidencia de aplicación del protocolo de escalamiento, no solo su existencia documental.",
        "Se adjunta: bitácora de escalamientos con acuse (3 meses), dos verificaciones de efecto y la matriz de cobertura vigente."
      ]}
    ],
    actions: [
      { id: "dt-hallazgo", label: "Enviar respuesta con paquete de evidencia acotado", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El paquete contiene solo evidencia autorizada para este alcance; nunca el censo clínico completo.",
        outcome: { happened: "Respuesta enviada con paquete acotado (3 piezas de evidencia).", changed: "El hallazgo queda en estado: respuesta entregada, verificación de cierre pendiente.", responsible: "SEREMI verifica; Dirección Técnica conserva la obligación si reabre.", next: "Acuse técnico del canal; verificación de cierre esperada dentro del plazo legal." } }
    ]
  },

  /* ================= COORDINACIÓN ================= */
  "sala": {
    kind: "derived", navRoot: true,
    title: "Sala de Mando",
    subtitle: "Período 17-08-2026 · demanda, capacidad, desviaciones y continuidad — información de referencia con corte, no es un panel de semáforos",
    cutoff: CUTOFF, revision: "período rev. 1",
    s3: {
      kind: "manifest",
      manifest: "M1",
      visitId: "VIS-ROSA-M1-0900",
      reviewAt: "08:35",
      decisionAt: "08:40",
      decision: "disponer VIS en M1; no autorizar salida vehicular total"
    },
    blocks: [
      { type: "kvgrid", heading: "Panorama del período", items: [
        ["Demanda", "3 postulaciones activas · 1 diferida con cuidado interino"],
        ["Capacidad hoy", "9 visitas planificables · 2 móviles · franja crítica 12:00–14:00"],
        ["Desviaciones", "1 visita reprogramada por acceso inseguro · 1 ruta con retraso 20 min"],
        ["Brecha declarada", "Trabajo social sin titular · cobertura provisional con límites"],
        ["Demanda no servida", "1 prestación de ayer reprogramada con causa y orden justo"]
      ]},
      { type: "table", heading: "Despliegue y rutas", cols: ["Móvil", "Conductor", "Destinos", "Estado"], rows: [
        ["Móvil 1", "R. Soto", "3 destinos · ventanas 09:00–13:00", "En ruta · sin desviación"],
        ["Móvil 2", "H. Vargas", "4 destinos · ventanas 08:45–12:30", "Retraso 20 min · causa declarada"]
      ]},
      { type: "link", nav: "manana", label: "Preparar el programa de mañana", text: "Mañana · 18-08-2026: 2 ingresos y 3 casos con visita · el borrador cruza necesidades de cada paciente con la capacidad declarada" },
      { type: "notice", tone: "attention", text: "El período está abierto y el programa diario aún no se publica. Publicar el programa es la acción que ordena el día; no reemplaza ninguna decisión clínica." }
    ],
    actions: [
      { id: "co-publicar", label: "Publicar programa diario y proponer asignaciones", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Publicar fija la versión del programa; las asignaciones requieren aceptación de cada función.",
        outcome: { happened: "Programa diario publicado (período 17-08-2026, rev. 2).", changed: "9 visitas y 2 móviles quedan con asignación propuesta y notificada.", responsible: "Cada función acepta su asignación; coordinación conserva lo no aceptado.", next: "Aceptaciones visibles en la Sala; lo no aceptado en 30 min se escala." } },
      { id: "co-handoff-turno", label: "Preparar handoff de turno", kind: "exit", availability: "available" },
      { id: "co-cerrar", label: "Cerrar período sin perder pendientes", kind: "exit", availability: "blocked_explainable",
        explanation: { cause: "El período tiene 4 obligaciones sin receptor y un handoff de transferencia sin aceptar.", kept: "Todo el trabajo no servido queda conservado con orden justo y riesgo.", exit: "Asigne receptores o declare demanda no servida antes de cerrar." } }
    ]
  },
  "sala-mando": { alias: "sala" },
  "handoff-jorge": {
    kind: "handoff", title: "Transferencia de Jorge M. — revisar y aceptar o rechazar",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Medicina Interna (hasta la aceptación)", revision: "rev. 3", provenance: "Handoff originado 16-08-2026 18:22", cutoff: CUTOFF, risk: "A3", riskText: "Responsabilidad aún en el origen · ventana de traslado 11:00–13:00" },
    blocks: [
      { type: "section", heading: "Contenido del handoff", items: [
        "Resumen clínico, pendientes, medicación conciliada y seguimiento indicado — completos según contrato.",
        "Receptor propuesto: enfermería HODOM del turno día, con médico de respaldo identificado.",
        "La entrega informacional tiene acuse técnico; la aceptación de responsabilidad es un acto distinto y está pendiente."
      ]},
      { type: "notice", tone: "info", text: "Enviado, recibido técnicamente, acusado y aceptado son hechos distintos. Solo su aceptación competente transfiere la responsabilidad." }
    ],
    actions: [
      { id: "co-aceptar", label: "Aceptar transferencia de responsabilidad", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Aceptar es atómico: desde este instante HODOM responde por Jorge M.",
        outcome: { happened: "Transferencia aceptada con recepción preparada (traslado 11:00–13:00).", changed: "La responsabilidad pasa del origen a HODOM; el episodio queda listo para apertura en domicilio.", responsible: "Coordinación HODOM (operacional) · médico de atención directa (clínica).", next: "Primera valoración de enfermería condicionada a llegada; logística confirmada." } },
      { id: "co-rechazar", label: "Responder negativamente con motivo", kind: "exit", availability: "available",
        outcome: null,
        note: "Responder negativo conserva al origen como responsable y abre recuperación con motivo y próxima acción." }
    ]
  },
  "caso-ana-social": {
    kind: "scene", title: "Brecha de función — evaluación social de Ana P.",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Coordinación (brecha) · cobertura provisional enfermería", revision: "rev. 2", provenance: "Alerta de sobrecarga 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Evaluación social pendiente · titular ausente" },
    blocks: [
      { type: "section", heading: "Situación", items: [
        "El cuidador declaró sobrecarga el 16-08-2026 21:35; la evaluación social corresponde a trabajo social.",
        "La función no tiene titular hoy. La cobertura provisional por enfermería está declarada con límites: no emite diagnóstico social.",
        "El caso declara riesgo residual y alternativa autorizada: evaluación por trabajador social el 18-08 o reevaluación anticipada si hay quiebre."
      ]}
    ],
    actions: [
      { id: "co-social", label: "Declarar cobertura y reevaluación del riesgo residual", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Declarar cobertura no convierte a enfermería en autora de la evaluación social.",
        outcome: { happened: "Cobertura provisional declarada con límites y reevaluación agendada.", changed: "La brecha queda visible con dueño y fecha; nadie figura como autor de una evaluación que no emitió.", responsible: "Coordinación (brecha) · trabajo social al reincorporarse.", next: "Reevaluación 18-08-2026 o antes si el cuidador declara quiebre." } }
    ]
  },

  /* ================= MÉDICO ATENCIÓN DIRECTA ================= */
  "alerta-potasio": {
    kind: "scene", title: "Resultado crítico — Rosa C. · potasio 6,1 mmol/L",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Médico de atención directa", revision: "rev. 6", provenance: "Laboratorio HSC · verificado 07:50", cutoff: CUTOFF, risk: "A4", riskText: "Crítico inmediato — acción ahora" },
    alerts: [
      { level: "A4", condition: "Potasio 6,1 mmol/L en paciente con ERC, informado 07:52", severity: "Crítica", receptor: "Médico de atención directa", action: "Interpretar y definir conducta con read-back", suppression: "No suprimible; se retira solo con conducta registrada", escalation: "Si no hay conducta registrada a las 08:22, escala a médico regulador", expiry: "Vence al registrar conducta", authority: "Protocolo de resultado crítico HSC", channel: "Si el sistema no responde: llamada directa al médico regulador, por el canal declarado en el contrato de cobertura" }
    ],
    blocks: [
      { type: "figure", value: "K+ 6,1 mmol/L", label: "Resultado crítico · verificado 07:50 · informado 07:52 (hace 22 min)" },
      { type: "kvgrid", heading: "Contexto mínimo", items: [
        ["Tendencia", "Creatinina en ascenso · función renal en vigilancia"],
        ["Última conducta", "Decisión sobre IECA pendiente de registro médico"],
        ["Paciente", "Estable según registro nocturno · sin síntomas nuevos reportados por cuidador"],
        ["Opciones", "Conducta en domicilio con control urgente · visita médica inmediata · derivación a urgencia"]
      ]}
    ],
    actions: [
      { id: "md-k", label: "Registrar interpretación y conducta con read-back", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El read-back confirma que el receptor repitió el contenido crítico correctamente.",
        outcome: { happened: "Interpretación registrada: hiperkalemia confirmada; conducta: suspensión definitiva de IECA, control de potasio en 6 h y criterio de derivación si ≥ 6,3 o síntomas.", changed: "La alerta crítica queda con conducta y receptor; el equipo de terreno recibe la indicación.", responsible: "Médico de atención directa (conducta) · enfermería (vigilancia y control).", next: "Control 13:50 con custodia de muestra; derivación automática si criterio." } },
      { id: "md-k-escalar", label: "Activar derivación a urgencia", kind: "exit", availability: "available" }
    ]
  },
  "atencion-rosa": {
    kind: "care", title: "Atención — Rosa C.",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Equipo asignado del episodio", revision: "rev. 5", provenance: "Programa diario · visita ventana 10:30–11:30", cutoff: CUTOFF, risk: "A2", riskText: "Conducta de resultado crítico en curso" },
    careStates: ["planned_visit", "arrival_recorded", "encounter_active", "closure_ready"],
    blocks: [
      { type: "section", heading: "Pulso — ahora", items: [
        "Visita programada 10:30–11:30 · médico tratante.",
        "Resultado crítico recibido 07:52; control de potasio 13:50 y decisión sobre IECA quedan pendientes de conducta médica.",
        "Cuidador instruido ayer con teach-back de alarmas; comprensión verificada."
      ]},
      { type: "section", heading: "Plan — intención vigente", items: [
        "Objetivo médico: estabilizar función renal y completar ciclo antibiótico (día 4 de 7).",
        "Plan de cuidados: curación sacro día por medio, vigilancia de signos cada visita.",
        "Rehabilitación: marcha supervisada 10 m, sesión kinésica 11:30.",
        "Operacional: móvil 2, ventana declarada, contingencia por acceso con escalera."
      ]}
    ],
    actions: [
      { id: "md-visita", label: "Registrar resultado de visita", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "El resultado queda atribuido a la visita y a usted; offline se reconcilia con idempotencia.",
        outcome: { happened: "Resultado de visita registrado: paciente sin síntomas nuevos; control de potasio tomado 13:52 con custodia.", changed: "La visita queda con resultado; la obligación de interpretar el nuevo control queda creada para usted.", responsible: "Médico tratante (interpretación del nuevo resultado) · enfermería (vigilancia).", next: "Resultado esperado 15:30; si ≥ 6,3 se activa derivación según conducta de la mañana." } },
      { id: "md-encuentro", label: "Abrir encuentro asistencial", kind: "exit", availability: "available", mode: "queued_intent" }
    ]
  },
  "cierre-luis": {
    kind: "scene", title: "Cierre de episodio — Luis A.",
    header: { caseId: "HOD-2026-0117", person: "luis", responsible: "Médico de atención directa", revision: "rev. 2", provenance: "Decisión de término clínico 15-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Continuidad sin receptor confirmado" },
    blocks: [
      { type: "section", heading: "Condición de cierre", items: [
        "Criterio de término clínico cumplido y declarado; el cierre exige destino, aceptación y pendientes explícitos.",
        "Receptor propuesto: CESFAM territorial con médico de continuidad identificado.",
        "Pendientes: conciliación de medicamentos, educación de cuidador reforzada, control en 72 h."
      ]},
      { type: "notice", tone: "attention", text: "Emitir documento no transfiere responsabilidad: el cierre se completa solo con aceptación del receptor." }
    ],
    actions: [
      { id: "md-cierre", label: "Emitir epicrisis y entregar continuidad a APS", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La epicrisis queda firmada; la responsabilidad se transfiere solo cuando APS acepta.",
        outcome: { happened: "Epicrisis emitida y handoff de continuidad entregado al CESFAM receptor.", changed: "El episodio queda en cierre pendiente de aceptación; usted conserva la responsabilidad hasta el acuse de aceptación.", responsible: "Usted hasta aceptación · médico de continuidad CESFAM después.", next: "Si no hay aceptación en 24 h, la recuperación se activa con el fallback declarado." } }
    ]
  },

  /* ================= MÉDICO REGULADOR ================= */
  "regulacion-elena": {
    kind: "scene", title: "Verificación clínica de admisión — Elena F.",
    header: { caseId: "HOD-2026-0142", person: "elena", responsible: "Médico regulador (verificación clínica) · origen conserva la responsabilidad", revision: "rev. 7", provenance: "Solicitud completa 16-08-2026", cutoff: CUTOFF, risk: "A3", riskText: "Cola con orden justo · primera en espera" },
    blocks: [
      { type: "table", heading: "Cinco evaluaciones convergentes (autores separados)", cols: ["Dimensión", "Autor", "Resultado", "Fecha"], rows: [
        ["Pertinencia clínica (verificación de admisión)", "Médico regulador — este acto, usted", "Por registrar ahora", "hoy"],
        ["Domicilio y territorio", "Enfermería", "Apto con adecuación menor", "15-08 12:40"],
        ["Cuidador y capacidad de cuidado", "Trabajo social", "Cuidador idóneo · carga media", "15-08 17:05"],
        ["Capacidad operacional situada", "Coordinación", "Cupo disponible desde 18-08 09:00", "16-08 18:00"],
        ["Deglución (cartera fonoaudiología)", "Fonoaudiología", "Riesgo de aspiración · plan de consistencias", "17-08 07:40"]
      ]},
      { type: "kvgrid", heading: "Capacidad situada (corte 08:14)", items: [
        ["Cupo", "1 disponible desde mañana 09:00"],
        ["Limitante", "Cobertura nocturna con fallback en revisión — declarado (brecha V02)"],
        ["Procedencia", "Snapshot de capacidad · no es una promesa futura"]
      ]},
      { type: "notice", tone: "attention", text: "Su acto es la verificación clínica de admisión (estabilidad y requerimientos cubribles en domicilio, según los requisitos de ingreso del DS 1/2022, arts. 15–17). Quién emite la decisión operacional aceptar/diferir/rechazar sigue en validación (brecha V01): esta pantalla no se la atribuye a nadie. Mientras tanto, la demanda conserva orden justo y el origen sigue respondiendo." }
    ],
    actions: [
      { id: "mr-verificar", label: "Registrar verificación clínica: apta para HODOM con vigilancia", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La verificación queda con su autoría de médico regulador; no es una aceptación operacional ni abre el episodio.",
        outcome: { happened: "Verificación clínica de admisión registrada: apta para HODOM con vigilancia renal.", changed: "Las cinco dimensiones quedan convergentes; la decisión operacional sigue pendiente de autoría adjudicada (V01 declarada).", responsible: "Origen (hasta decisión y transferencia) · coordinación (orden justo de la cola).", next: "La autoría de aceptar/diferir/rechazar se adjudica en gobernanza; al adjudicarse, la cola se destraba con motivo y receptor." } },
      { id: "mr-decidir", label: "Emitir aceptar / diferir / rechazar", kind: "exit", availability: "blocked_explainable",
        explanation: { cause: "La autoría de esta decisión está en validación (brecha V01): el sistema no la cierra por pantalla ni la presume suya por ser quien verifica.", kept: "La postulación conserva orden justo; el origen sigue responsable; su verificación clínica queda registrada.", exit: "Dirección Técnica gobierna la adjudicación de la autoría; cuando exista un decisor autorizado, esta acción se habilita con su nombre." } }
    ],
    note: "Un acto clínico, uno solo: verificar la admisión no es aceptar, diferir ni rechazar. Ninguna salida deja la demanda sin dueño."
  },
  "regulacion-turno": {
    kind: "scene", title: "Turno de regulación 20:00–08:00 (flujo diseñado)",
    header: { caseId: "Cobertura de respuesta", person: null, responsible: "Médico regulador entrante", revision: "rev. 1", provenance: "Contrato de cobertura agosto 2026", cutoff: CUTOFF, risk: "A1", riskText: "Programado · activación pendiente" },
    blocks: [
      { type: "notice", tone: "attention", text: "Brecha V02 declarada: la respuesta 20:00–08:00 es un diseño resuelto (29-06-2026) pendiente de activación con UEA/SDM. Esta escena muestra el flujo diseñado, no una práctica demostrada." },
      { type: "kvgrid", heading: "Contrato de cobertura (diseño)", items: [
        ["Canal", "Llamada + mensajería institucional · probado hoy 07:55"],
        ["Receptor", "Médico regulador entrante (usted) · reemplazo declarado"],
        ["Tiempo esperado de respuesta", "Según contrato · con fallback por doble canal desde 18-08"],
        ["Pendientes del turno saliente", "1 control de potasio con criterio de derivación · 1 cuidador en vigilancia de sobrecarga"]
      ]}
    ],
    actions: [
      { id: "mr-turno", label: "Aceptar handoff de turno con pendientes", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Aceptar el turno lo deja como receptor de escalamiento de la franja.",
        outcome: { happened: "Handoff de turno aceptado con dos pendientes declarados.", changed: "Usted es el receptor de escalamiento 20:00–08:00; la cobertura queda con prueba de contacto registrada.", responsible: "Médico regulador (franja) · coordinación de noche (operacional).", next: "Cualquier escalamiento llega con contexto; usted permanece hasta acuse del receptor si activa rescate." } }
    ]
  },
  "regulacion-nocturna": {
    kind: "scene", title: "Llamada de una cuidadora — 23:40 (flujo diseñado)",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Médico regulador de la franja", revision: "rev. 1", provenance: "Guion nocturno del episodio · categoría N2-L", cutoff: "17-08-2026 23:40", risk: "A3", riskText: "Naranja: respuesta esperada dentro de 15 min" },
    alerts: [
      { level: "A3", condition: "Cuidadora reporta SatO₂ 92 % con agitación nueva — umbral naranja del guion nocturno", severity: "Alta", receptor: "Médico regulador", action: "Orientar con el resumen clínico y definir conducta; si el eslabón no puede ejecutar, escala, no se silencia", suppression: "Se apaga con conducta registrada y acuse del ejecutor", escalation: "Naranja sin respuesta en 15 min escala a rojo: activación 131 con vía pre-acordada", expiry: "Vence al cerrar el episodio de llamada", authority: "Guion nocturno escrito del episodio (categoría N2-L)", channel: "Si el sistema no responde: llamada directa al número declarado en el contrato de cobertura" }
    ],
    blocks: [
      { type: "notice", tone: "attention", text: "Brecha V02 declarada: la respuesta 20:00–08:00 es un diseño resuelto (29-06-2026) pendiente de activación con UEA/SDM — esta escena muestra el flujo diseñado, no una práctica demostrada." },
      { type: "kvgrid", heading: "Resumen clínico suficiente (llega con la llamada)", items: [
        ["Episodio", "HOD-2026-0129 · día 12 · plan versión 2 · sin visita médica diaria programada mañana"],
        ["Vigilancia vigente", "Signos en cada visita · muestra de hoy con resultado esperado"],
        ["Riesgo nocturno", "N2-L · guion escrito y vía pre-acordada con la cuidadora"],
        ["Lo que reporta la cuidadora", "SatO₂ 92 % con agitación nueva hace 20 min"]
      ]},
      { type: "notice", tone: "info", text: "Su indicación queda como una versión firmada por usted, distinguida de la conducción del médico tratante: mañana el equipo ve qué indicó el regulador y por qué." }
    ],
    actions: [
      { id: "mr-indicacion", label: "Registrar indicación remota versionada", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La indicación queda firmada por usted como regulador, con hora y conducta; no edita el plan del tratante.",
        outcome: { happened: "Indicación remota registrada: posición y pausa según guion, SatO₂ cada 30 min y rellamada a las 00:10.", changed: "La cuidadora recibe orientación con acuse; la llamada queda cerrada con conducta, receptor y hora.", responsible: "Usted (esta indicación) · médico tratante (conducción del plan: la ve mañana).", next: "Si SatO₂ < 90 % o empeora: activación 131 con vía pre-acordada; usted permanece hasta acuse del receptor." } },
      { id: "mr-rescate", label: "Activar rescate 131 y permanecer hasta acuse", kind: "exit", availability: "available",
        note: "Activar abre la cadena: SAMU despachado con ubicación y situación → receptor prealertado → usted permanece hasta el acuse. La cadena nunca se cierra por silencio." }
    ]
  },

  /* ================= ENFERMERO CLÍNICO ================= */
  "atencion-jorge": {
    kind: "scene", title: "Primera valoración — Jorge M.",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Enfermería clínica", revision: "rev. 1", provenance: "Condicionada a aceptación de transferencia", cutoff: CUTOFF, risk: "A1", riskText: "Condicionada" },
    blocks: [
      { type: "notice", tone: "info", text: "Esta obligación se activa cuando la transferencia sea aceptada. Preparar no la adelanta: la responsabilidad sigue en el origen." },
      { type: "section", heading: "Al activarse", items: [
        "Valoración inicial integral: riesgos, funcionalidad, piel, dispositivos, tratamiento.",
        "Verificación observable del hogar: acceso, contacto, cuidador — sin sustituir el diagnóstico social.",
        "Línea base y plan de cuidados con frecuencias, educación y umbral de escalamiento."
      ]}
    ],
    actions: [
      { id: "en-jorge", label: "Abrir valoración inicial", kind: "primary", availability: "blocked_explainable",
        explanation: { cause: "La transferencia de Jorge M. aún no es aceptada; el paciente no está bajo responsabilidad HODOM.", kept: "La obligación queda conservada y visible con su condición.", exit: "Coordinación gestiona la aceptación; usted será notificado al activarse." } }
    ]
  },
  "turno-enfermeria": {
    kind: "scene", title: "Entrega de turno — enfermería día → noche",
    header: { caseId: "Ciclo diario", person: null, responsible: "Enfermería de turno día", revision: "rev. 1", provenance: "Ciclo diario de coordinación", cutoff: CUTOFF, risk: "A1", riskText: "Programado 19:30" },
    blocks: [
      { type: "table", heading: "Riesgos y pendientes que viajan", cols: ["Caso", "Pendiente", "Riesgo", "Receptor noche"], rows: [
        ["HOD-2026-0131 · Rosa C.", "Control de potasio 13:50 · criterio de derivación", "Alto si ≥ 6,3", "Enfermería noche"],
        ["HOD-2026-0129 · Ana P.", "Cuidador en vigilancia de sobrecarga", "Quiebre del cuidado", "Enfermería noche · escalamiento a coordinación"],
        ["HOD-2026-0138 · Jorge M.", "Ingreso probable mañana 09:00", "Sin riesgo nuevo", "Turno día siguiente"]
      ]}
    ],
    actions: [
      { id: "en-turno", label: "Preparar handoff de turno", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El handoff se entrega al turno noche; la entrega se completa con acuse y aceptación.",
        outcome: { happened: "Handoff de turno preparado con 3 pendientes y riesgos declarados.", changed: "El turno noche recibe la propuesta; usted conserva la responsabilidad hasta su aceptación.", responsible: "Enfermería día (hasta aceptación) · enfermería noche (después).", next: "Entrega 19:30 con acuse; lo no aceptado queda con coordinación." } }
    ]
  },

  /* ================= KINESIÓLOGO ================= */
  "atencion-rosa-kine": {
    kind: "care", title: "Sesión kinésica — Rosa C.",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Kinesiología", revision: "rev. 3", provenance: "Plan de rehabilitación vigente", cutoff: CUTOFF, risk: "A1", riskText: "Programada 11:30" },
    blocks: [
      { type: "section", heading: "Objetivo funcional vigente", items: [
        "Marcha supervisada 10 m con apoyo; línea base: 4 m con asistencia el 14-08.",
        "Restricción declarada: fatiga respiratoria; suspender si SatO2 < 92%.",
        "Educación a cuidador: movilización segura y prevención de caídas (teach-back pendiente)."
      ]}
    ],
    actions: [
      { id: "kn-rosa", label: "Registrar intervención y respuesta", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "Registra intervención, tolerancia y resultado; offline se reconcilia después.",
        outcome: { happened: "Intervención registrada: marcha 8 m con supervisión, tolerancia adecuada, SatO2 ≥ 94%.", changed: "El objetivo se actualiza a 12 m para la próxima sesión; el plan interdisciplinario recibe la respuesta.", responsible: "Kinesiología (plan motor) · enfermería (vigilancia).", next: "Próxima sesión 19-08; si hay deterioro respiratorio se escala al médico tratante." } },
      { id: "kn-escalar", label: "Escalar deterioro funcional o respiratorio", kind: "exit", availability: "available" }
    ]
  },
  "atencion-jorge-kine": {
    kind: "scene", title: "Valoración kinésica inicial — Jorge M.",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Kinesiología", revision: "rev. 1", provenance: "Indicación médica del episodio", cutoff: CUTOFF, risk: "A1", riskText: "Condicionada a aceptación" },
    blocks: [
      { type: "notice", tone: "info", text: "Se activa tras la aceptación de la transferencia. La valoración fija línea base, factibilidad y plan con frecuencia acordada con coordinación." }
    ],
    actions: [
      { id: "kn-jorge", label: "Abrir valoración kinésica", kind: "primary", availability: "blocked_explainable",
        explanation: { cause: "La transferencia aún no es aceptada; no hay episodio activo en domicilio.", kept: "La indicación y la obligación quedan conservadas.", exit: "Espere la activación o consulte a coordinación por la ventana." } }
    ]
  },

  /* ================= TENS ================= */
  "atencion-rosa-tens": {
    kind: "scene", title: "Curación delegada — Rosa C.",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "TENS asignado · supervisora: enfermería del caso", revision: "rev. 2", provenance: "Delegación registrada 15-08-2026", cutoff: CUTOFF, risk: "A1", riskText: "Delegación vigente con límites" },
    blocks: [
      { type: "kvgrid", heading: "Delegación que autoriza esta tarea", items: [
        ["Indicación", "Curación sacro con apósito según pauta · registrada 15-08"],
        ["Supervisor", "Enfermera del caso · contacto por canal institucional"],
        ["Límites", "No evaluar evolución de herida ni cambiar pauta; comunicar hallazgos de inmediato"],
        ["Vigencia", "Hasta reevaluación de enfermería del 18-08"]
      ]}
    ],
    actions: [
      { id: "ts-rosa", label: "Registrar ejecución y respuesta observada", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "Registra ejecución delegada y respuesta observada; la autoría de la indicación es de enfermería.",
        outcome: { happened: "Curación ejecutada según pauta; piel sin signos nuevos; respuesta observada registrada.", changed: "La supervisora recibe el reporte; la próxima curación queda programada.", responsible: "Enfermera supervisora (indicación) · TENS (ejecución).", next: "Cualquier desviación se escala de inmediato a la supervisora." } },
      { id: "ts-ajustar", label: "Ajustar pauta de curación", kind: "exit", availability: "hidden" },
      { id: "ts-escalar", label: "Comunicar desviación a la supervisora", kind: "exit", availability: "available" }
    ]
  },
  "atencion-ana-tens": {
    kind: "scene", title: "Control de signos y toma de muestra — Ana P.",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "TENS asignado · supervisora: enfermería", revision: "rev. 1", provenance: "Delegación 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Entorno con alerta social declarada" },
    alerts: [
      { level: "A2", condition: "Cuidador con sobrecarga declarada; posible entorno tenso", severity: "Media", receptor: "TENS y supervisora", action: "Ejecutar solo lo delegado; reportar cualquier señal de quiebre", suppression: "Suprimible al completar la visita sin hallazgos", escalation: "Supervisora → coordinación → trabajo social", expiry: "18-08-2026", authority: "Declaración de riesgo residual del caso" }
    ],
    blocks: [
      { type: "section", heading: "Tarea delegada", items: [
        "Control de signos y toma de muestra con custodia refrigerada; entrega a laboratorio antes de 12:00 vía conductor.",
        "No administrar medicamentos en esta visita: la delegación no lo cubre.",
        "Si el entorno se torna inseguro: repliegue y reporte; ninguna tarea vale más que la seguridad."
      ]}
    ],
    actions: [
      { id: "ts-ana", label: "Registrar ejecución y entregar muestra a custodia", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "La muestra queda con cadena de custodia: emisor, transportista, receptor esperado y tiempo.",
        outcome: { happened: "Signos registrados sin desviación; muestra entregada a custodia del Móvil 2 (10:25).", changed: "Laboratorio recibe la muestra dentro de ventana; la supervisora recibe el reporte.", responsible: "Supervisora (interpretación) · conductor (custodia en tránsito).", next: "Resultado de laboratorio con conducta del responsable." } },
      { id: "ts-ana-med", label: "Administrar medicamento oral", kind: "exit", availability: "blocked_explainable",
        explanation: { cause: "La delegación vigente no cubre administración de medicamentos en esta visita.", kept: "El plan del paciente no cambia; nada queda ejecutado fuera de competencia.", exit: "Escale a la supervisora: ella decide si ajusta la delegación o ejecuta ella misma." } }
    ]
  },

  /* ================= TRABAJADOR SOCIAL ================= */
  "social-ana": {
    kind: "scene", title: "Evaluación social de urgencia — Ana P.",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Trabajo social", revision: "rev. 2", provenance: "Alerta de sobrecarga 16-08-2026 21:35", cutoff: CUTOFF, risk: "A3", riskText: "Riesgo de quiebre del cuidado" },
    alerts: [
      { level: "A3", condition: "Cuidador declaró que no puede sostener el cuidado tal como está", severity: "Alta", receptor: "Trabajo social", action: "Evaluar voluntad, capacidad y sobrecarga; activar red", suppression: "No suprimible hasta reevaluación", escalation: "Coordinación y médico tratante si hay quiebre inminente", expiry: "18-08-2026", authority: "Alerta declarada por el cuidador" }
    ],
    blocks: [
      { type: "section", heading: "Hechos (separados del juicio)", items: [
        "Cuidador principal: hija, 54 años, trabaja jornada parcial; declaró sobrecarga el 16-08 21:35.",
        "Red observable: un vecino colabora con compras; sin segundo cuidador declarado.",
        "Vivienda y acceso evaluados como aptos al ingreso; la brecha actual es de carga, no de infraestructura."
      ]},
      { type: "section", heading: "Alternativas de red", items: [
        "Relevo familiar parcial + ajuste de frecuencia de visitas (decisión clínica, no social).",
        "Articulación con municipalidad: programa de apoyo a cuidadores con acuse y seguimiento.",
        "Si hay quiebre: reevaluación de viabilidad del episodio con el decisor de admisión."
      ]}
    ],
    actions: [
      { id: "tso-ana", label: "Registrar evaluación y activar red de apoyo", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "La evaluación mantiene autoría disciplinar; las acciones de red piden acuse.",
        outcome: { happened: "Evaluación social registrada: sobrecarga moderada-alta; se activa programa municipal de apoyo y relevo familiar parcial.", changed: "El caso recibe plan social con acciones y receptores; el riesgo de quiebre queda en vigilancia con fecha.", responsible: "Trabajo social (plan social) · coordinación (ajuste operacional si corresponde).", next: "Acuse de municipalidad en 72 h; reevaluación 18-08 o antes si hay quiebre." } }
    ]
  },
  "social-elena": {
    kind: "scene", title: "Evaluación social de admisión — Elena F.",
    header: { caseId: "HOD-2026-0142", person: "elena", responsible: "Trabajo social", revision: "rev. 1", provenance: "Visita domiciliaria 15-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Admisión esperando convergencia" },
    blocks: [
      { type: "section", heading: "Resultado de la visita del 15-08", items: [
        "Cuidador propuesto: esposo, 79 años, autovalente; voluntad declarada y comprensión verificada.",
        "Capacidad de cuidado: idónea para tareas no profesionales del plan, con carga media.",
        "Se distingue: cuidador (esposo) · representante legal (no requerido, capacidad conservada) · contacto (hija, solo comunicación autorizada)."
      ]}
    ],
    actions: [
      { id: "tso-elena", label: "Firmar y entregar evaluación social al decisor", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Firmar la entrega como una de las cinco evaluaciones que el decisor integra.",
        outcome: { happened: "Evaluación social firmada y entregada: cuidador idóneo, carga media, roles distinguidos.", changed: "La admisión queda con las cinco evaluaciones completas; el decisor puede integrar.", responsible: "Decisor de admisión (integración y decisión).", next: "Decisión de admisión con motivo y receptor." } }
    ]
  },

  /* ================= FONOAUDIÓLOGO ================= */
  "atencion-elena-fono": {
    kind: "scene", title: "Evaluación de deglución — Elena F.",
    header: { caseId: "HOD-2026-0142", person: "elena", responsible: "Fonoaudiología", revision: "rev. 1", provenance: "Indicación médica 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Condiciona preparación del domicilio" },
    blocks: [
      { type: "section", heading: "Evaluación realizada", items: [
        "Disfagia orofaríngea leve-moderada post evento neurológico; riesgo de aspiración con líquidos finos.",
        "Recomendación: consistencias espesadas, postura 90°, supervisión en comidas, alarmas de atragantamiento.",
        "Educación a cuidador con teach-back: comprensión verificada de consistencias y postura."
      ]}
    ],
    actions: [
      { id: "fn-elena", label: "Entregar evaluación y recomendaciones al equipo", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "Las recomendaciones quedan enlazadas al plan; no son un plan paralelo.",
        outcome: { happened: "Evaluación fonoaudiológica entregada con recomendaciones de consistencia, postura y alarmas.", changed: "El plan de cuidados y la preparación del domicilio incorporan la medida; la admisión queda con evaluación completa.", responsible: "Equipo tratante (integrar) · fonoaudiología (seguimiento).", next: "Reevaluación a la semana del ingreso; riesgo de aspiración comunicado a enfermería." } }
    ]
  },

  /* ================= ADMINISTRADOR DE SEGURIDAD ================= */
  "sistema": {
    kind: "derived", navRoot: true,
    title: "Sistema — seguridad e identidades",
    subtitle: "Dar de alta, designar, vigilar y revocar accesos. Sin acceso clínico: la capacidad técnica no otorga autoridad clínica",
    cutoff: CUTOFF, revision: "corte 08:14",
    blocks: [
      { type: "kvgrid", heading: "Estado de accesos", items: [
        ["Identidades activas", "23 · 14 tipos de rol provisionables"],
        ["Cuentas sin función vigente", "1 (TENS trasladado — revocación pendiente)"],
        ["Accesos de emergencia abiertos", "0 · 1 en revisión obligatoria"],
        ["Bitácora", "Íntegra · última verificación 16-08-2026"]
      ]},
      { type: "notice", tone: "info", text: "Dar de alta una identidad no otorga autoridad clínica: la función, la relación y la vigencia se vinculan mediante actos institucionales separados." }
    ],
    actions: [
      { id: "sec-provisionar", label: "Provisionar identidad con rol del catálogo", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El alta crea identidad y credencial; la habilitación clínica requiere acto de Dirección Técnica.",
        outcome: { happened: "Identidad provisionada para kinesióloga entrante con rol 'kinesiologo'.", changed: "La cuenta existe sin autoridad clínica; la función queda pendiente del acto de designación.", responsible: "Seguridad (identidad) · Dirección Técnica (habilitación).", next: "Designación con alcance y vigencia antes del ingreso 24-08-2026." } }
    ]
  },
  "sistema-provision": { alias: "sistema" },
  "sistema-breakglass": {
    kind: "scene", title: "Revisión de acceso de emergencia — 15-08-2026",
    header: { caseId: "Break-glass BG-2026-004", person: null, responsible: "Administrador de seguridad", revision: "rev. 1", provenance: "Bitácora de acceso de emergencia", cutoff: CUTOFF, risk: "A2", riskText: "Revisión obligatoria dentro de plazo" },
    blocks: [
      { type: "kvgrid", heading: "Acceso de emergencia declarado", items: [
        ["Motivo", "Médico regulador sin sesión durante escalamiento nocturno verificado"],
        ["Duración", "22 min · vigencia declarada al activar"],
        ["Autorización", "Doble control: regulador + coordinación de turno"],
        ["Alcance", "Solo lectura del caso en escalamiento · sin exportación"]
      ]},
      { type: "section", heading: "Revisión posterior (obligatoria)", items: [
        "El uso fue proporcional al motivo declarado; no hubo acceso fuera del caso.",
        "Causa raíz: sesión expirada sin reautenticación oportuna — se corrige con aviso previo de expiración.",
        "Cierre: sin hallazgo de abuso; queda evidencia para auditoría."
      ]}
    ],
    actions: [
      { id: "sec-bg", label: "Cerrar revisión sin hallazgo y registrar causa raíz", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Cerrar deja la evidencia íntegra para auditoría; no borra el evento.",
        outcome: { happened: "Revisión cerrada sin hallazgo; causa raíz registrada con acción correctiva.", changed: "El ciclo break-glass queda completo: motivo, vigencia, uso, revisión y cierre.", responsible: "Seguridad (cierre) · DT recibe la acción correctiva de sesión.", next: "Verificación de la corrección en la próxima revisión de accesos." } }
    ]
  },
  "sistema-revocacion": {
    kind: "scene", title: "Revocación de acceso — TENS trasladado",
    header: { caseId: "Identidad ID-4471", person: null, responsible: "Administrador de seguridad", revision: "rev. 1", provenance: "Oficio de traslado 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Cuenta activa sin función vigente" },
    alerts: [
      { level: "A2", condition: "Cuenta con acceso activo y función terminada el 16-08-2026", severity: "Media", receptor: "Administrador de seguridad", action: "Revocar con efecto inmediato", suppression: "No suprimible hasta revocar", escalation: "Si sigue activa en 24 h escala a DT", expiry: "18-08-2026", authority: "Oficio de traslado de Gestión de Personas" }
    ],
    blocks: [
      { type: "section", heading: "Antes de revocar", items: [
        "Sesiones activas: ninguna. Tareas delegadas vigentes: ninguna (transferidas el 16-08).",
        "La revocación conserva la historia de accesos; no borra registros ni autorías pasadas."
      ]}
    ],
    actions: [
      { id: "sec-revocar", label: "Revocar acceso con efecto inmediato", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Efecto inmediato: la identidad deja de autenticar; la historia queda íntegra.",
        outcome: { happened: "Acceso revocado con efecto inmediato (ID-4471).", changed: "La cuenta queda sin autenticación; autorías y accesos históricos se conservan para auditoría.", responsible: "Seguridad (revocación) · Gestión de Personas (fin de función).", next: "Revisión trimestral de privilegios confirma la consistencia." } }
    ]
  },

  /* ================= CONDUCTOR ================= */
  "ruta": {
    kind: "derived", navRoot: true,
    title: "Ruta del día — Móvil 1",
    subtitle: "Destinos, ventanas, contacto autorizado, pasajeros y carga. Solo hitos logísticos: sin ficha, diagnóstico ni plan clínico",
    cutoff: CUTOFF, revision: "programa rev. 2",
    s3: {
      kind: "departure",
      manifest: "M1",
      visitId: "VIS-ROSA-M1-0900",
      scheduledDeparture: "08:45",
      privacy: "La salida observada no prueba personas, paquete, visita ni atención."
    },
    blocks: [
      { type: "table", heading: "Itinerario", cols: ["#", "Destino", "Ventana", "Pasajeros / carga", "Estado"], rows: [
        ["1", "Parada 1 · Villa A", "09:00–10:00", "Carga sanitaria declarada", "En ruta · hito independiente"],
        ["2", "Parada 2 · Población B", "10:15–10:45", "Carga declarada · custodia", "Pendiente de hito"],
        ["3", "Laboratorio HSC", "antes de 12:00", "Custodia: muestra (cadena declarada)", "En curso"],
        ["4", "Retorno a base", "12:30", "Cajas bajo custodia declarada", "Pendiente"]
      ]},
      { type: "table", heading: "Bitácora del móvil", cols: ["Ítem", "Registro", "Hora"], rows: [
        ["Chequeo vehicular", "Completado: frenos, luces, neumáticos, botiquín y combustible", "08:30"],
        ["Odómetro de salida", "48.210 km · el de llegada cierra la jornada", "08:45"],
        ["Estado en vivo", "En visita → tiempo muerto → alimentación, según se registre", "—"],
        ["Mantención", "Próxima a los 50.000 km · sin hitos vencidos", "—"],
        ["Cajas y botiquines", "2 bajo custodia declarada · el vehículo nunca es bodega", "—"]
      ]},
      { type: "notice", tone: "attention", text: "Retraso de 20 min por taco declarado a coordinación 08:50; la reprogramación es decisión de coordinación, no del conductor." }
    ],
    actions: [
      { id: "dr-hito", label: "Registrar hito de ruta", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "El hito queda con hora y custodia; offline se reconcilia al recuperar señal.",
        outcome: { happened: "Hito registrado: llegada a Laboratorio HSC 11:12; muestra entregada con acuse de recepción.", changed: "La custodia se cierra con receptor real y hora; coordinación ve el efecto sin datos clínicos.", responsible: "Laboratorio (muestra) · coordinación (programa).", next: "Destino 4 con ventana ajustada por coordinación." } },
      { id: "dr-seguridad", label: "Declarar condición de seguridad de la ruta", kind: "exit", availability: "available",
        note: "Declarar «ruta segura / no segura» queda con hora y tramo; la visita de riesgo alto se hace en dupla. Apoyar en riesgo al equipo nunca es decidir prioridad clínica." },
      { id: "dr-contingencia", label: "Reportar contingencia de ruta", kind: "exit", availability: "available" }
    ]
  },
  "ruta-dia": { alias: "ruta" },
  "ruta-custodia": {
    kind: "scene", title: "Custodia de muestras — cadena declarada",
    header: { caseId: "Custodia CUS-2026-0312", person: null, responsible: "Conductor Móvil 2 (tránsito)", revision: "rev. 1", provenance: "Registro de retiro 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Ventana de custodia hasta 12:00" },
    blocks: [
      { type: "kvgrid", heading: "Cadena de custodia", items: [
        ["Contenido", "Muestra refrigerada (detalle clínico no requerido)"],
        ["Custodio emisor", "TENS del retiro · 16-08 18:40"],
        ["Transportista", "Conductor Móvil 2"],
        ["Receptor esperado", "Laboratorio HSC · recepción con acuse"],
        ["Condición", "Refrigerada · contenedor sellado"]
      ]}
    ],
    actions: [
      { id: "dr-custodia", label: "Confirmar entrega con acuse del receptor", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "La entrega se completa con acuse del receptor real, no por llegar al lugar.",
        outcome: { happened: "Entrega confirmada con acuse de Laboratorio HSC 11:12.", changed: "La custodia queda cerrada con receptor real, hora y condición.", responsible: "Laboratorio (muestra recibida).", next: "Sin pendiente de custodia para esta ruta." } }
    ]
  },

  /* ================= ADMINISTRATIVO ================= */
  "admin": {
    kind: "derived", navRoot: true,
    title: "Cola documental y de registro",
    subtitle: "Registro, completitud, comunicaciones y agenda — sin autoría ni decisión clínica",
    cutoff: CUTOFF, revision: "corte 08:14",
    blocks: [
      { type: "table", heading: "Pendientes administrativos", cols: ["Ítem", "Faltante", "Responsable siguiente", "Plazo"], rows: [
        ["Postulación telefónica 08:02", "Identificador único y datos mínimos", "Coordinación", "Hoy 12:00"],
        ["Expediente HOD-2026-0138", "Consentimiento digitalizado", "Archivo del caso", "Antes de transferencia"],
        ["Citación control L. A.", "Confirmación de recepción", "APS receptora", "18-08-2026"]
      ]}
    ],
    actions: [
      { id: "ad-reg", label: "Registrar postulación con datos mínimos", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Registrar no decide elegibilidad: crea la entrada atribuible y la deriva al responsable.",
        outcome: { happened: "Postulación registrada con identificador único y datos mínimos verificados.", changed: "La demanda entra a la cola con estado, responsable, fecha y motivo.", responsible: "Coordinación (evaluación de ingreso).", next: "Coordinación solicita las evaluaciones competentes." } }
    ]
  },
  "admin-registro": { alias: "admin" },
  "admin-documentos": {
    kind: "scene", title: "Expediente documental — HOD-2026-0138",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Gestión administrativa", revision: "rev. 2", provenance: "Recepción de documentos 16-08-2026", cutoff: CUTOFF, risk: "A1", riskText: "Pendiente visible" },
    blocks: [
      { type: "section", heading: "Completitud documental", items: [
        "Consentimiento de modalidad firmado en papel: recibido · pendiente de digitalizar y versionar.",
        "Epicrisis del origen: recibida y archivada con procedencia.",
        "Custodia documental: repositorio con versión y permisos; usted custodia, no interpreta contenido clínico."
      ]}
    ],
    actions: [
      { id: "ad-doc", label: "Digitalizar consentimiento y versionar expediente", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El documento queda versionado con procedencia; la validez clínica del consentimiento no la emite este rol.",
        outcome: { happened: "Consentimiento digitalizado y expediente versionado (rev. 3).", changed: "El caso queda con expediente completo para la transferencia.", responsible: "Gestión administrativa (custodia) · el equipo clínico (contenido).", next: "Coordinación ve el expediente completo antes de aceptar la transferencia." } },
      { id: "ad-evaluar", label: "Evaluar elegibilidad clínica", kind: "exit", availability: "blocked_explainable",
        explanation: { cause: "La evaluación clínica es autoría de las funciones clínicas; su función es registro y custodia.", kept: "El expediente y la cola quedan conservados.", exit: "Derive a coordinación; su trazabilidad ya quedó registrada." } }
    ]
  },

  /* ================= PLAN: ajuste, propuesta y derivación interna ================= */
  "plan-ajuste-rosa": {
    kind: "scene", title: "Ajustar el plan médico — Rosa C.",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Médico de atención directa", revision: "rev. 5", provenance: "Plan médico vigente", cutoff: CUTOFF, risk: "A2", riskText: "Plan vigente · ajuste versionado" },
    blocks: [
      { type: "kvgrid", heading: "Lo que una nueva versión declara", items: [
        ["Objetivo", "El resultado humano que se persigue, no la lista de tareas"],
        ["Monitoreo", "Qué se mide, quién lo registra y con qué frecuencia"],
        ["Reevaluación", "Cuándo se vuelve a evaluar, con fecha o condición"],
        ["Criterio de escalamiento", "Qué umbral gatilla aviso o rescate, declarado"],
        ["Vigencia", "Desde cuándo rige; la versión anterior queda como historia"]
      ]},
      { type: "notice", tone: "info", text: "Ajustar el plan médico crea la versión 6 con su autoría: el equipo ve el cambio con motivo y vigencia; nadie edita la versión vigente en silencio." }
    ],
    actions: [
      { id: "md-ajuste", label: "Firmar nueva versión del plan médico", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La versión 6 queda firmada por usted; la 5 se conserva como historia.",
        outcome: { happened: "Plan médico versión 6 firmado: meta de potasio < 5,5 en 48 h, control 13:50 y criterio de derivación mantenidos.", changed: "El equipo recibe la nueva versión con motivo; las delegaciones vigentes se revisan contra el cambio.", responsible: "Usted (plan médico) · enfermería ajusta cuidados si corresponde.", next: "Control 13:50 con custodia; reevaluación con resultado 15:30." } },
      { id: "md-derivar", label: "Derivar internamente a otra disciplina", kind: "exit", availability: "available", goto: "derivacion-rosa" }
    ]
  },
  "plan-cambio-rosa": {
    kind: "scene", title: "Proponer cambio en el plan — Rosa C.",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "El responsable del plan decide", revision: "rev. 1", provenance: "Propuesta de su función", cutoff: CUTOFF, risk: "A2", riskText: "Propuesta sin decidir" },
    blocks: [
      { type: "kvgrid", heading: "Su propuesta declara", items: [
        ["Problema o necesidad", "Qué observó, con evidencia y hora"],
        ["Cambio propuesto", "Qué objetivo, frecuencia o umbral sugiere, y por qué"],
        ["Monitoreo y reevaluación", "Cómo se sabrá si funcionó y cuándo se revisa"],
        ["Su autoría", "Su función firma la propuesta; el dueño del plan decide"]
      ]},
      { type: "notice", tone: "info", text: "Proponer no cambia el plan: el responsable recibe la propuesta con su evidencia y decide con motivo. Usted ve la respuesta." }
    ],
    actions: [
      { id: "prop-enviar", label: "Enviar propuesta al responsable del plan", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "La propuesta queda con su autoría y evidencia; el plan vigente no cambia hasta la decisión.",
        outcome: { happened: "Propuesta registrada y enviada al responsable del plan con evidencia.", changed: "El responsable recibe la obligación de decidir con motivo; nada cambia en el plan vigente.", responsible: "Responsable del plan (decisión) · usted (autoría de la propuesta).", next: "Si acepta, el plan cambia en nueva versión; si no, usted recibe el motivo." } }
    ]
  },
  "derivacion-rosa": {
    kind: "scene", title: "Derivación interna — Rosa C. → kinesiología",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Médico de atención directa (plan) · kinesiología decide", revision: "rev. 1", provenance: "Decisión del médico tratante 17-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Derivación esperando aceptación" },
    blocks: [
      { type: "kvgrid", heading: "Lo que se deriva", items: [
        ["Qué se pide", "Reevaluar el objetivo de marcha: progresión de 10 m a 12 m tras dos sesiones con buena tolerancia"],
        ["A quién", "Kinesiología · dentro de su cartera y competencia declaradas"],
        ["Motivo clínico", "Tolerancia adecuada (SatO2 ≥ 94%) en las dos últimas sesiones"],
        ["Urgencia", "Antes de la próxima sesión de hoy 11:30"]
      ]},
      { type: "notice", tone: "info", text: "Derivar no cambia el plan: kinesiología decide y, si acepta, su ajuste queda con su autoría. Usted conserva la responsabilidad del plan médico." }
    ],
    actions: [
      { id: "md-derivar-enviar", label: "Enviar derivación interna", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La derivación queda con motivo, autor y receptor; no obliga a kinesiología a aceptar.",
        outcome: { happened: "Derivación enviada a kinesiología con motivo y marco de decisión.", changed: "Kinesiología recibe la obligación de decidir; nada cambia en los planes vigentes.", responsible: "Usted (plan médico) · kinesiología (decisión de la derivación).", next: "Si acepta, el objetivo nuevo queda con autoría kinésica; si declina, usted recibe el motivo." } }
    ]
  },
  "derivacion-rosa-kine": {
    kind: "scene", title: "Derivación recibida — reevaluar marcha de Rosa C.",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Kinesiología (decisión)", revision: "rev. 1", provenance: "Derivación interna pendiente de emisión", cutoff: CUTOFF, risk: "A2", riskText: "Esperando su decisión" },
    blocks: [
      { type: "kvgrid", heading: "Contenido de la derivación", items: [
        ["Solicita", "Médico de atención directa · C. Herrera"],
        ["Qué se pide", "Reevaluar progresión del objetivo de marcha: de 10 m a 12 m"],
        ["Motivo declarado", "Tolerancia adecuada en dos sesiones · SatO2 ≥ 94%"],
        ["Su criterio", "Restricción respiratoria vigente: suspender si SatO2 < 92%"]
      ]},
      { type: "notice", tone: "info", text: "Aceptar incorpora el cambio a su plan con su autoría; declinar devuelve el motivo al médico tratante sin cambiar el plan vigente." }
    ],
    actions: [
      { id: "kn-aceptar-deriv", label: "Aceptar derivación y ajustar objetivo", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "El objetivo pasa a 12 m con su autoría kinésica y su criterio de suspensión.",
        outcome: { happened: "Derivación aceptada: objetivo de marcha ajustado a 12 m con criterio SatO2 ≥ 92%.", changed: "El plan de rehabilitación queda en versión 4 con su autoría; el médico recibe el acuse.", responsible: "Kinesiología (plan motor) · médico tratante (plan médico).", next: "La sesión de hoy 11:30 evalúa con el nuevo objetivo; la respuesta se registra en la visita." } },
      { id: "kn-declinar-deriv", label: "Declinar con motivo clínico", kind: "exit", availability: "available" }
    ]
  },

  /* ================= MÉDICO DERIVADOR (EXTERNO, R18) ================= */
  "postular": {
    kind: "derived", navRoot: true,
    title: "Nueva postulación a HODOM",
    subtitle: "Resumen clínico mínimo con autor y contacto — postular no transfiere la responsabilidad: usted la conserva hasta que HODOM acepta",
    cutoff: CUTOFF, revision: "canal rev. 1",
    blocks: [
      { type: "kvgrid", heading: "Datos mínimos que esta postulación exige", items: [
        ["Diagnóstico y situación", "Motivo de postulación, estabilidad y riesgos declarados"],
        ["Tratamiento vigente", "Medicación conciliada, pendientes y exámenes en curso"],
        ["Cuidador y domicilio", "Quién cuida, acceso, teléfono y territorio (sector o dirección)"],
        ["Contacto y autoría", "Usted como autor, con su canal para aclaraciones"]
      ]},
      { type: "notice", tone: "attention", text: "Postular no es transferir la responsabilidad: mientras HODOM evalúa, el paciente sigue bajo su cuidado. Si hay urgencia, use el canal de rescate de su servicio, no esta vía." }
    ],
    actions: [
      { id: "ex-enviar", label: "Enviar postulación trazable", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La postulación entra a la cola de admisión con autor, hora y contenido mínimo completo.",
        outcome: { happened: "Postulación registrada (HOD-2026-0143) con autoría y datos mínimos completos.", changed: "La cola de admisión la recibe en orden justo; usted ve el estado sin llamar por teléfono.", responsible: "Usted conserva la responsabilidad clínica hasta la aceptación · regulación HODOM evalúa.", next: "Si falta un dato mínimo se le pide por este canal; la decisión llega con motivo y alternativa." } }
    ]
  },
  "interim-marta": {
    kind: "scene", title: "Cuidado interino — Marta G. (postulación diferida)",
    header: { caseId: "HOD-2026-0136", person: "marta", responsible: "Usted (origen) hasta la aceptación", revision: "rev. 1", provenance: "Diferimiento con cuidado interino 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Diferida · reevaluación 18-08-2026" },
    blocks: [
      { type: "kvgrid", heading: "Situación", items: [
        ["Decisión", "Diferida por capacidad: 1 cupo comprometido hasta el 18-08 09:00"],
        ["Qué no significa", "No es rechazo ni admisión: la postulación sigue viva con orden justo"],
        ["Su rol ahora", "Sostener el cuidado interino declarado y avisar cualquier cambio"],
        ["Reevaluación", "18-08-2026 · coordinación la ejecuta con capacidad vigente"]
      ]},
      { type: "section", heading: "Cuidado interino declarado", items: [
        "Plan de origen vigente: antibiótico hasta 20-08 · control de signos diario por APS.",
        "Umbral de llamada: fiebre sobre 38°, disnea o confusión nueva → canal de rescate APS.",
        "Contacto HODOM para aclaraciones: coordinación del período, canal institucional."
      ]}
    ],
    actions: [
      { id: "ex-interim", label: "Declarar cuidado interino vigente", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Declara que el plan interino sigue vigente y que usted conserva la responsabilidad hasta la aceptación.",
        outcome: { happened: "Cuidado interino declarado vigente con su autoría y hora.", changed: "La reevaluación del 18-08 parte de un estado conocido; la diferida no queda en silencio.", responsible: "Usted (cuidado) · coordinación HODOM (reevaluación).", next: "Reevaluación 18-08-2026; si hay cambio de estado antes, repórtelo por este canal." } },
      { id: "ex-retirar", label: "Retirar la postulación con motivo", kind: "exit", availability: "available" }
    ]
  },
  "postulacion-carlos": {
    kind: "scene", title: "Postulación en evaluación — Carlos V.",
    header: { caseId: "HOD-2026-0140", person: "carlos", responsible: "Usted (origen) · regulación HODOM evalúa", revision: "rev. 2", provenance: "Postulación recibida 16-08-2026 15:40", cutoff: CUTOFF, risk: "A2", riskText: "Falta un dato mínimo de origen" },
    blocks: [
      { type: "kvgrid", heading: "Estado de la evaluación", items: [
        ["Evaluaciones completas", "3 de 5 · clínica, domicilio y territorio, capacidad operacional"],
        ["Pendiente de usted", "Conciliación de medicamentos completa (solicitada hoy 07:58)"],
        ["Pendiente de HODOM", "Evaluación social y de deglución si aplica"],
        ["Orden justo", "Segunda en la cola · sin promesa de aceptación"]
      ]}
    ],
    actions: [
      { id: "ex-conciliacion", label: "Adjuntar conciliación de medicamentos", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La conciliación queda adjunta con su autoría y hora; completa el dato mínimo.",
        outcome: { happened: "Conciliación adjuntada (rev. 3) con su autoría.", changed: "La evaluación queda completa de su lado; regulación puede converger.", responsible: "Usted (datos de origen) · regulación (decisión).", next: "Decisión con motivo y alternativa por este canal." } }
    ]
  },

  /* ================= DIRECCIÓN TÉCNICA: conocimiento y nómina ================= */
  "kb-gobierno": {
    kind: "scene", title: "Base de conocimiento HODOM — protocolos con versión, dueño y vigencia",
    header: { caseId: "Gobierno del conocimiento", person: null, responsible: "Dirección Técnica", revision: "rev. 3", provenance: "Revisión de escalamiento post-rescate 12-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Protocolo revisado sin publicar" },
    blocks: [
      { type: "table", heading: "Protocolos y su estatuto", cols: ["Pieza", "Estatuto", "Dueño", "Vigencia"], rows: [
        ["Escalamiento con umbrales (amarillo ≤30 min · naranja ≤15 min · rojo 131)", "Revisión lista para publicar", "Dirección Técnica", "Al publicar"],
        ["PRO 002 (2022)", "Vigente", "Dirección Técnica", "Vigente"],
        ["PRO-110 (2019)", "Histórico · relación con PRO 002 por adjudicar (brecha V11)", "Dirección Técnica", "Sin vigencia"],
        ["Ciclo del medicamento 0.3", "Borrador con veredicto NO-GO · no opera", "Dirección Técnica + farmacia", "Sin vigencia"],
        ["Circuito REAS", "Borrador · no opera hasta visación IAAS y recinto de disposición", "IAAS + logística", "Sin vigencia"]
      ]},
      { type: "notice", tone: "info", text: "La base de conocimiento vive aquí, con versión y dueño: un protocolo en un Drive paralelo no existe para el equipo. Publicar declara diseño vigente; la práctica se demuestra en los registros, no en el documento." }
    ],
    actions: [
      { id: "dt-kb", label: "Publicar escalamiento versión 4 con vigencia y dueño", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La versión 4 reemplaza a la 3 como vigente; la 3 se conserva como historia con su período de vigencia.",
        outcome: { happened: "Protocolo de escalamiento versión 4 publicado con dueño y vigencia declarados.", changed: "El equipo ve la versión vigente desde hoy; la respuesta a fiscalización puede citar una fuente recuperable.", responsible: "Dirección Técnica (contenido) · cada función (aplicación registrada).", next: "Evidencia de aplicación: bitácora de escalamientos con acuse, verificable en 30 días." } }
    ]
  },
  "nomina-dt": {
    kind: "scene", title: "Nómina, turnos y habilitaciones — decisión de capacidad",
    header: { caseId: "Nómina única de la unidad", person: null, responsible: "Dirección Técnica", revision: "rev. 1", provenance: "Solicitudes recibidas 15-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Capacidad de la semana por confirmar" },
    blocks: [
      { type: "table", heading: "Solicitudes sobre la nómina", cols: ["Solicitud", "Efecto en capacidad", "Condición", "Estado"], rows: [
        ["Licencia de una TENS 19-08 al 22-08", "Turno tarde sin TENS delegable 2 días", "Reemplazo interno con delegación vigente", "Por resolver"],
        ["Habilitación de terreno · kinesióloga entrante", "Suma 20 h/semana de rehabilitación", "Inducción HODOM 44 h: completadas 32 de 44", "Bloqueada hasta completar inducción"]
      ]},
      { type: "notice", tone: "info", text: "Administrar personas aquí nunca es un acto clínico: ninguna aprobación de esta pantalla firma una indicación ni modifica un plan. Observar el desempeño tiene finalidad de habilitación, no es una ficha paralela de las personas." }
    ],
    actions: [
      { id: "dt-licencia", label: "Aprobar licencia con reemplazo declarado", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La licencia queda aprobada con reemplazo y efecto en la capacidad publicada.",
        outcome: { happened: "Licencia aprobada del 19-08 al 22-08 con reemplazo interno declarado.", changed: "La capacidad de la semana se actualiza; coordinación ve el turno tarde cubierto con delegación vigente.", responsible: "Dirección Técnica (decisión) · coordinación (reasignar).", next: "El programa del 19-08 se publica con la capacidad real." } },
      { id: "dt-habilitar", label: "Habilitar terreno a la kinesióloga entrante", kind: "exit", availability: "blocked_explainable",
        explanation: { cause: "La inducción HODOM de 44 horas va en 32: habilitar terreno antes dejaría a la persona actuando sin la formación exigida por la norma.", kept: "La solicitud queda registrada; la cuenta creada por Seguridad sigue sin autoridad clínica.", exit: "Completar la inducción (faltan 12 h) y volver a esta decisión con el registro completo." } }
    ]
  },

  /* ================= COORDINACIÓN: turnos del día ================= */
  "turnos-del-dia": {
    kind: "scene", title: "Turnos del día — ausencia de TENS turno tarde",
    header: { caseId: "Período 17-08-2026", person: null, responsible: "Coordinación del período", revision: "rev. 1", provenance: "Aviso de ausencia 07:10", cutoff: CUTOFF, risk: "A2", riskText: "3 prestaciones delegadas de la tarde sin ejecutor" },
    blocks: [
      { type: "section", heading: "Lo que se sabe", items: [
        "La TENS del turno tarde avisó ausencia a las 07:10; tres prestaciones delegadas de la tarde necesitan ejecutor.",
        "Reemplazo disponible: TENS del turno día con delegación vigente y sin sobrecarga declarada; acepta extensión.",
        "La nómina es la misma que administra Dirección Técnica: este cambio no crea dotación ni altera contratos."
      ]},
      { type: "notice", tone: "attention", text: "Cubrir con reemplazo no amplía competencias: las tres prestaciones ya tienen delegación registrada y supervisora identificada." }
    ],
    actions: [
      { id: "co-reemplazo", label: "Confirmar reemplazo y republicar las asignaciones afectadas", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El reemplazo queda con las mismas delegaciones y supervisoras; cada prestación conserva su trazabilidad.",
        outcome: { happened: "Reemplazo confirmado: TENS del turno día cubre la tarde con extensión declarada.", changed: "Las tres prestaciones quedan con ejecutor y supervisora; el programa de la tarde se republica.", responsible: "Coordinación (asignación) · supervisora de cada caso (clínica).", next: "Dirección Técnica ve la variación de capacidad en la nómina única." } },
      { id: "co-reducir", label: "Declarar reducción de capacidad y priorizar visitas críticas", kind: "exit", availability: "available",
        note: "Declarar reducción no esconde la demanda: las visitas no cubiertas quedan registradas con causal y se escalan el mismo día." }
    ]
  },

  /* ================= MÉDICO ATENCIÓN DIRECTA: primera evaluación ================= */
  "primera-evaluacion-jorge": {
    kind: "scene", title: "Primera evaluación médica — Jorge M.",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Médico de atención directa", revision: "rev. 1", provenance: "Programa diario del período", cutoff: CUTOFF, risk: "A1", riskText: "Condicionada a la aceptación de la transferencia" },
    blocks: [
      { type: "notice", tone: "info", text: "La verificación clínica de admisión ya la hizo el médico regulador: ese acto es de él, no suyo. Su acto aquí es otro: al evaluar por primera vez en domicilio, usted actualiza la situación clínica, los diagnósticos y el plan — y ese plan nace con su autoría y reemplaza el de derivación y traspaso." },
      { type: "section", heading: "Lo que esta primera evaluación produce", items: [
        "Situación clínica actualizada con criterios verificables, no adjetivos.",
        "Diagnósticos del episodio HODOM con su autoría.",
        "Plan médico versión 1 del episodio: objetivo, monitoreo, reevaluación y criterio de escalamiento — reemplaza el plan de derivación.",
        "Derivaciones internas que estime, con motivo; cada receptor decide con su propio criterio."
      ]}
    ],
    actions: [
      { id: "md-primera", label: "Abrir la primera evaluación médica", kind: "primary", availability: "blocked_explainable",
        explanation: { cause: "La transferencia de Jorge M. aún no es aceptada: el paciente no está bajo responsabilidad HODOM y no hay episodio abierto en domicilio.", kept: "La obligación queda conservada y visible con su condición; el plan del origen sigue rigiendo.", exit: "Coordinación gestiona la aceptación; al producirse el ingreso, esta evaluación se activa y usted es notificado." } }
    ]
  },

  /* ================= E2E-08/S3: paquete VIS de M1 ================= */
  "e2e08-s3-package": {
    kind: "scene", title: "Preparación de VIS-ROSA-M1-0900 — paquete antes de salir",
    s3: {
      kind: "package",
      visitId: "VIS-ROSA-M1-0900",
      manifest: "M1",
      reviewAt: "08:35",
      scheduledDeparture: "08:45",
      role: "enfermero-clinico",
      reviewCriterion: "Enfermería define suficiencia; revisar no autoriza salida vehicular."
    },
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Enfermería clínica · coordinación dispone M1", revision: "E2E08-ORD-1 · nursingPlan v5", provenance: "Programa diario · VIS-ROSA-M1-0900", cutoff: CUTOFF, risk: "A1", riskText: "Revisión de suficiencia antes de salida" },
    blocks: [
      { type: "kvgrid", heading: "Paquete de VIS-ROSA-M1-0900", items: [
        ["Ocurrencia", "VIS-ROSA-M1-0900 · HOD-2026-0131 · Móvil 1 (M1)"],
        ["Equipo y ventana", "Enfermería + TENS · 09:00–10:00"],
        ["Salida programada", "08:45 · observación de salida pertenece a Conductor"],
        ["criticalInstructionRevision", "E2E08-ORD-1 · instrucción crítica vigente"],
        ["nursingPlan", "v5 · plan de cuidados con autoría de Enfermería"],
        ["packageImpact", "La instrucción crítica condiciona la preparación y puede exigir revisión; no reemplaza el nursingPlan ni autoriza la salida."]
      ]},
      { type: "notice", tone: "info", text: "A las 08:35 Enfermería revisa la suficiencia del paquete. La revisión deja receipt y conserva la decisión de salida en Coordinación; GPS o partida no demuestran atención." }
    ],
    actions: [
      { id: "review-package", label: "Revisar suficiencia del paquete · 08:35", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La revisión registra suficiencia del paquete VIS-ROSA-M1-0900; no autoriza ni registra la salida vehicular.",
        outcome: { happened: "Revisión de paquete registrada a las 08:35 con Enfermería como autora.", changed: "El paquete conserva criticalInstructionRevision E2E08-ORD-1, packageImpact y nursingPlan v5; no se registra partida.", responsible: "Enfermería define suficiencia · Coordinación conserva la disposición del manifiesto M1.", next: "Coordinación revisa la disposición VIS en M1 a las 08:40." } },
      { id: "package-gap", label: "Declarar faltante del paquete", kind: "exit", availability: "available",
        note: "El faltante queda visible con causa; no habilita salida por silencio y coordinación conserva la disposición." }
    ]
  },

  /* ================= ENFERMERO CLÍNICO: paquete de visita ================= */
  "paquete-visita-rosa": {
    kind: "scene", title: "Paquete de la visita — Rosa C. (verificación antes de salir)",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Enfermería clínica", revision: "rev. 1", provenance: "Programa diario · revisión M1 08:35", cutoff: CUTOFF, risk: "A1", riskText: "Suficiencia previa a la salida programada 08:45" },
    blocks: [
      { type: "kvgrid", heading: "El paquete declara", items: [
        ["Plan vigente", "Curación sacro día por medio · vigilancia de signos · teach-back de alarmas (versión 5)"],
        ["Alarmas del episodio", "Amarillo: respuesta ≤ 30 min · naranja: ≤ 15 min · rojo: 131 directo · NEWS2 como apoyo"],
        ["Riesgo nocturno", "N2 — guion nocturno escrito y vía pre-acordada con la cuidadora"],
        ["Insumos", "Set de curación · apósitos según pauta · registro de respuesta"],
        ["Contactos", "Cuidador por canal institucional · coordinación del período · regulador según horario"]
      ]},
      { type: "notice", tone: "info", text: "Si el paquete está incompleto no se sale «a ver qué pasa»: se declara el faltante y coordinación decide. Registrar sin señal es posible; se sincroniza al volver." }
    ],
    actions: [
      { id: "en-paquete", label: "Confirmar suficiencia del paquete M1 · 08:35", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "La confirmación deja receipt de suficiencia; no autoriza ni registra la salida vehicular.",
        outcome: { happened: "Suficiencia del paquete VIS-ROSA-M1-0900 revisada a las 08:35.", changed: "Plan, alarmas, insumos y contactos quedan visibles para Coordinación; la partida sigue siendo una observación separada.", responsible: "Usted (revisión de suficiencia) · Coordinación (disposición del manifiesto M1).", next: "Coordinación revisa la disposición VIS a las 08:40; ninguna pantalla afirma partida." } },
      { id: "en-faltante", label: "Declarar faltante del paquete", kind: "exit", availability: "available",
        note: "Declarar un faltante no cancela la visita por silencio: coordinación decide con el riesgo declarado y la visita queda reprogramada con causa si corresponde." }
    ]
  },

  /* ================= TENS: separación de lo administrativo (V08) ================= */
  "cierre-admin-tens": {
    kind: "scene", title: "Tiempo administrativo de la semana — declaración separada",
    header: { caseId: "Doble función TENS · brecha V08", person: null, responsible: "TENS con función administrativa absorbida", revision: "rev. 1", provenance: "Ciclo semanal de la unidad", cutoff: CUTOFF, risk: "A2", riskText: "Carga sin medir resta capacidad clínica" },
    blocks: [
      { type: "section", heading: "Por qué se declara", items: [
        "La función administrativa no tiene cargo dedicado: hoy la absorbe una persona TENS y nadie la mide (brecha V08).",
        "Declararla no la legitima ni la convierte en autoría clínica: la hace visible para que Dirección Técnica la dimensione.",
        "Sus actos clínicos de la semana ya están registrados con delegación y supervisora; esto es tiempo, no clínica."
      ]},
      { type: "kvgrid", heading: "Su semana", items: [
        ["Actos clínicos delegados", "14 · todos con indicación y supervisora registradas"],
        ["Tiempo administrativo estimado", "6,5 h · postulaciones telefónicas, impresiones y agenda"],
        ["Efecto declarado", "2 prestaciones clínicas reprogramadas con causa esta semana"]
      ]}
    ],
    actions: [
      { id: "ts-cierre", label: "Declarar 6,5 h administrativas de la semana", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "La declaración queda separada de sus actos clínicos y visible para quien dimensiona.",
        outcome: { happened: "Semana declarada: 14 actos clínicos delegados y 6,5 h administrativas absorbidas.", changed: "La carga administrativa queda medida y visible; la brecha V08 tiene datos propios.", responsible: "Coordinación (capacidad) · Dirección Técnica (dimensionar la absorción).", next: "La dimensión de esta función es decisión de Dirección Técnica; su declaración la alimenta cada semana." } }
    ]
  },

  /* ================= OTRO PROFESIONAL: default-deny (V10) ================= */
  "habilitacion-otro": {
    kind: "scene", title: "Terapia ocupacional — solicitud de actuación sin habilitación",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Dirección Técnica (cartera) · Seguridad (cuenta)", revision: "rev. 1", provenance: "Solicitud del médico tratante 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Disciplina sin cartera ratificada" },
    blocks: [
      { type: "kvgrid", heading: "Lo que falta antes de actuar", items: [
        ["Cartera", "Terapia ocupacional entra como habilitable en la cartera v2.3 — aún no ratificada (vigencia propuesta 01-09-2026)"],
        ["Competencia", "Título y registro verificables por Gestión de Personas antes de terreno"],
        ["Indicación", "Del médico tratante, con motivo y alcance — recibida 16-08-2026"],
        ["Responsabilidad", "Quien habilita responde por la decisión; la categoría «otro profesional» no es un permiso abierto"]
      ]},
      { type: "notice", tone: "info", text: "Sin habilitación, esta cuenta no ve fichas ni registra actos: no es un castigo, es la regla que protege al paciente y a la disciplina (brecha V10 declarada)." }
    ],
    actions: [
      { id: "op-actuar", label: "Actuar en el episodio", kind: "primary", availability: "blocked_explainable",
        explanation: { cause: "Su disciplina no está en la cartera vigente: la v2.3 la haría habilitable, pero no está ratificada todavía.", kept: "La solicitud del médico queda registrada con motivo; la derivación sigue en la cola con su condición visible: el paciente no la pierde.", exit: "Dirección Técnica ratifica cartera y competencia, Gestión de Personas verifica y Seguridad provisiona. Recién entonces esta pantalla ofrece actuar." } }
    ]
  },

  /* ================= CONDUCTOR: geolocalización (K13) e incidente ================= */
  "geo-jorge": {
    kind: "scene", title: "Geolocalizar domicilio — Jorge M. (primera determinación)",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Conductor Móvil 2 · coordinación verifica", revision: "rev. 1", provenance: "Aceptación de admisión · domicilio por verificar", cutoff: CUTOFF, risk: "A2", riskText: "Ingreso de mañana 09:00 sin ubicación verificada" },
    blocks: [
      { type: "kvgrid", heading: "Lo que se registra", items: [
        ["Coordenada", "La que marca el equipo en terreno — con precisión declarada: exacta, aproximada o por sector"],
        ["Referencia adjunta", "Foto de la fachada, texto o audio de referencia, según lo que el lugar permita"],
        ["Puntos de apoyo", "Acceso vehicular, escaleras, portón, referencias de llegada"],
        ["Lo que NO se registra", "Diagnóstico, ficha, plan: usted ve destinos y ventanas, jamás contenido clínico"]
      ]},
      { type: "notice", tone: "attention", text: "La foto y la coordenada entran con custodia declarada: finalidad (llegar al domicilio), acceso (coordinación y conductores de la ruta) y retención (el episodio). Que hoy lleguen por canal informal funciona, pero no tiene custodia resuelta (tesis K13): registrarlas aquí las pone bajo regla. La ubicación nunca prueba que una visita o atención se hizo." }
    ],
    actions: [
      { id: "dr-geo", label: "Registrar ubicación con precisión y referencia", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "La ubicación queda con precisión declarada y la referencia bajo custodia; offline se sincroniza al volver.",
        outcome: { happened: "Ubicación de Jorge M. registrada: exacta, con foto de fachada y acceso vehicular declarados.", changed: "El programa de mañana puede publicar la parada de ingreso con ubicación verificada.", responsible: "Coordinación (programa) · usted (registro de terreno).", next: "Si la precisión fuera «por sector», la persona queda en el mapa con esa condición declarada — nunca como punto exacto." } }
    ]
  },
  "ruta-incidente": {
    kind: "scene", title: "Acceso inseguro en Población B — reporte y propuesta de cambio",
    header: { caseId: "Parada 2 · Móvil 1", person: null, responsible: "Conductor Móvil 1 · coordinación decide", revision: "rev. 1", provenance: "Evaluación de entorno en terreno 08:55", cutoff: CUTOFF, risk: "A2", riskText: "Visita reprogramada con causa declarada" },
    blocks: [
      { type: "kvgrid", heading: "Evaluación del entorno (antes de ingresar)", items: [
        ["Hallazgo", "Terceros en estado de alteración en el acceso · sin vía de escape despejada"],
        ["Regla aplicada", "Condiciones mínimas no cumplidas → no ingresar, registrar y reprogramar"],
        ["Presencia contactada", "La cuidadora confirma la situación y avisa cuando ceda"],
        ["Su propuesta", "Mover la parada al final de la mañana y avisar a la supervisora"]
      ]},
      { type: "notice", tone: "info", text: "Usted propone; coordinación decide con criterio clínico. Ninguna prioridad clínica la fija el conductor — y la visita pendiente nunca desaparece: se resuelve hoy o se escala." }
    ],
    actions: [
      { id: "dr-incidente", label: "Enviar reporte y propuesta de nuevo orden", kind: "primary", availability: "available", mode: "reconcilable_write",
        confirm: "El reporte queda con hora, causa y propuesta; la decisión es de coordinación.",
        outcome: { happened: "Reporte enviado 08:58: acceso inseguro, visita reprogramada propuesta al final de la mañana.", changed: "Coordinación recibe la decisión con la causa declarada; la demanda queda visible hasta resolverse.", responsible: "Coordinación (reprogramación) · supervisora del caso (avisada).", next: "Coordinación confirma el nuevo orden; si la visita no se resuelve hoy, escala a Dirección Técnica." } }
    ]
  },

  /* ================= ADMINISTRATIVO: impresión y nómina no clínica ================= */
  "cola-impresion": {
    kind: "scene", title: "Impresión y archivo — epicrisis de Luis A.",
    header: { caseId: "HOD-2026-0117", person: "luis", responsible: "Gestión administrativa", revision: "rev. 1", provenance: "Epicrisis emitida 17-08-2026", cutoff: CUTOFF, risk: "A1", riskText: "Pendiente de archivo físico" },
    blocks: [
      { type: "kvgrid", heading: "Lo que va a la ficha impresa", items: [
        ["Documento", "Epicrisis del episodio HOD-2026-0117 (versión firmada por el médico)"],
        ["Destino", "Ficha clínica única del hospital · la carpeta del episodio se agrega al egreso"],
        ["Constancia", "Impresa, archivada y entregada con fecha y responsable — la ficha no sale de custodia"],
        ["Lo que usted NO hace", "Interpretar el contenido clínico: custodia y completitud, no lectura"]
      ]}
    ],
    actions: [
      { id: "ad-print", label: "Marcar impresa y archivada con constancia", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La constancia queda con fecha, documento y responsable de archivo.",
        outcome: { happened: "Epicrisis impresa y archivada en la ficha clínica única con constancia 17-08-2026.", changed: "El cierre documental del episodio queda completo; lo digital y lo impreso coinciden.", responsible: "Gestión administrativa (custodia) · médico tratante (contenido).", next: "El expediente del egreso queda recuperable para fiscalización sin depender de memoria." } }
    ]
  },
  "registro-funcionarios": {
    kind: "scene", title: "Registro de funcionarios — inducción del refuerzo de kinesiología",
    header: { caseId: "Nómina de funcionarios (no clínica)", person: null, responsible: "Gestión administrativa", revision: "rev. 1", provenance: "Contrato de refuerzo 14-08-2026", cutoff: CUTOFF, risk: "A1", riskText: "Registro sin completar" },
    blocks: [
      { type: "kvgrid", heading: "Ficha administrativa del funcionario", items: [
        ["Ingreso", "24-08-2026 · refuerzo estacional de kinesiología"],
        ["Inducción HODOM", "32 de 44 horas registradas · evidencia por sesión"],
        ["Vigencias", "Título y registro verificados por Gestión de Personas 14-08-2026"],
        ["Separación", "Esta ficha es administrativa: la autoría clínica vive en los registros del episodio, nunca aquí"]
      ]}
    ],
    actions: [
      { id: "ad-func", label: "Registrar 8 h de inducción de hoy", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El registro queda con evidencia y hora; habilitar terreno es decisión de Dirección Técnica con la inducción completa.",
        outcome: { happened: "Inducción registrada: 40 de 44 horas con evidencia por sesión.", changed: "La nómina muestra el avance real; la habilitación de terreno sigue bloqueada hasta completar 44 h.", responsible: "Gestión administrativa (registro) · Dirección Técnica (habilitación).", next: "Última sesión 21-08; luego la decisión de habilitación queda disponible para Dirección Técnica." } }
    ]
  },

  /* ================= ADMINISTRADOR DE SEGURIDAD: anomalía ================= */
  "sistema-anomalia": {
    kind: "scene", title: "Acceso anómalo — dos sesiones simultáneas de una cuenta",
    header: { caseId: "Alerta de integridad ID-3390", person: null, responsible: "Administrador de seguridad", revision: "rev. 1", provenance: "Bitácora de acceso · regla de detección", cutoff: CUTOFF, risk: "A2", riskText: "Cuenta compartida debilita la autoría" },
    alerts: [
      { level: "A2", condition: "La misma cuenta clínica autenticó desde dos equipos a la vez (07:40 y 07:44)", severity: "Media", receptor: "Administrador de seguridad", action: "Suspender la segunda sesión y pedir confirmación al titular", suppression: "Se apaga con titular confirmado o cuenta suspendida", escalation: "Si se confirma cuenta compartida: Dirección Técnica y revisión de privilegios", expiry: "Hoy", authority: "Política de mínimo privilegio y bitácora íntegra" }
    ],
    blocks: [
      { type: "section", heading: "Qué se ve en la bitácora (sin exponer datos personales)", items: [
        "Identificador interno ID-3390 · rol clínico · dos sesiones concurrentes con 4 min de diferencia.",
        "Ningún acceso fuera de casos asignados; la bitácora se conserva íntegra para investigar.",
        "La sospecha es cuenta compartida, no intrusión: el segundo equipo es del pabellón de la unidad."
      ]}
    ],
    actions: [
      { id: "sec-anomalia", label: "Suspender la segunda sesión y notificar al titular", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La suspensión es de la sesión, no de la cuenta; el titular confirma o la cuenta queda suspendida.",
        outcome: { happened: "Segunda sesión suspendida 08:20; titular notificado para confirmar.", changed: "La autoría vuelve a ser atribuible a una persona por sesión; la bitácora conserva el evento completo.", responsible: "Seguridad (suspensión) · titular (confirmación) · Dirección Técnica si se confirma compartida.", next: "Sin confirmación en 24 h, la cuenta queda suspendida y se abre revisión de privilegios." } }
    ]
  },

  /* ================= PACIENTE (R15) ================= */
  "paciente-hoy": {
    kind: "scene", title: "Su atención de hoy — Rosa C.",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Médico tratante (plan) · enfermería (cuidados)", revision: "rev. 1", provenance: "Plan vigente del episodio", cutoff: CUTOFF, risk: "A1", riskText: "Información para su día" },
    blocks: [
      { type: "kvgrid", heading: "Hoy", items: [
        ["Visitas", "El médico entre 10:30 y 11:30 · la kinesióloga a las 11:30"],
        ["Quién responde ahora", "Su médico tratante por el plan · la enfermera por los cuidados · coordinación por horarios"],
        ["Un examen pendiente", "Control de potasio hoy 13:50 · el médico lo interpreta cuando llega el resultado"],
        ["Si algo cambia", "Use «Avisar un cambio» (abajo) de día; de noche siga la tarjeta de alarma"]
      ]},
      { type: "notice", tone: "info", text: "Una visita programada no es respuesta continua: entre visitas usted tiene un canal de aviso con acuse y, de noche, la tarjeta con el 131. Sus preferencias y las condiciones de su hogar son parte del plan." }
    ],
    actions: [
      { id: "pa-entendido", label: "Entendido", kind: "primary", availability: "available", mode: "reconcilable_write", immediate: true,
        outcome: { happened: "Información de hoy registrada como comprendida.", changed: "El equipo sabe que tiene el panorama de hoy; nada clínico cambió.", responsible: "Usted (su episodio) · el equipo (cada acto con su autor).", next: "Si algo cambia, el aviso con acuse está disponible en su pantalla principal." } },
      { id: "pa-duda", label: "Tengo una duda sobre mi atención", kind: "exit", availability: "available",
        note: "Su duda llega a coordinación del período con su caso y hora; alguien responde con acuse. Preguntar nunca condiciona su atención." }
    ]
  },
  "consentimiento-procedimiento": {
    kind: "scene", title: "Decisión sobre un procedimiento — curación con apósito especial",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Usted decide · enfermería ejecuta si usted acepta", revision: "rev. 1", provenance: "Propuesta de enfermería 17-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Decisión informada pendiente" },
    blocks: [
      { type: "notice", tone: "attention", text: "El consentimiento de la modalidad HODOM (que usted ya firmó) y el de cada procedimiento son cosas distintas: una firma no es una autorización universal. El texto vigente y su separación están en validación (brecha V04); esta pantalla muestra el flujo diseñado." },
      { type: "kvgrid", heading: "Lo que se le propone", items: [
        ["Qué es", "Curación del sacro con apósito especial, día por medio"],
        ["Beneficio esperado", "Cicatrización más rápida con menos cambios de apósito"],
        ["Riesgos y molestias", "Dolor breve al retirar · reacción de la piel (poco frecuente)"],
        ["Alternativas", "Seguir con la curación convencional · pedir segunda opinión"],
        ["Sus derechos", "Pedir tiempo, preguntar, aceptar o negarse — negarse no la deja sin atención"]
      ]}
    ],
    actions: [
      { id: "pa-consentir", label: "Consentir este procedimiento", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Su consentimiento queda registrado solo para este procedimiento, con fecha; puede retirarlo cuando quiera.",
        outcome: { happened: "Consentimiento del procedimiento registrado (solo este procedimiento).", changed: "Enfermería puede ejecutarlo mañana; la modalidad y los demás procedimientos siguen con sus propios consentimientos.", responsible: "Usted (decisión) · enfermería (ejecución registrada).", next: "Si se arrepiente, lo retira por este mismo canal y se gestiona el cese sin que se la abandone." } },
      { id: "pa-tiempo", label: "Pedir tiempo o segunda opinión", kind: "exit", availability: "available",
        note: "Pedir tiempo deja la propuesta en espera con registro; el plan vigente sigue igual y usted no pierde nada." },
      { id: "pa-rechazar", label: "No aceptar este procedimiento", kind: "exit", availability: "available",
        note: "Su rechazo se registra y se firma; queda con acta, carta de indicaciones y la red de rescate declarada — rechazar no la deja desprotegida." }
    ]
  },
  "alerta-paciente": {
    kind: "scene", title: "Avisar un cambio — canal con acuse",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Coordinación del período recibe (día) · 131 según tarjeta (noche)", revision: "rev. 1", provenance: "Circuito de aviso del episodio", cutoff: CUTOFF, risk: "A1", riskText: "Disponible cuando lo necesite" },
    blocks: [
      { type: "section", heading: "Cómo funciona", items: [
        "Usted avisa con palabras simples; el aviso queda con hora y llega a una persona, no a una bandeja.",
        "Recibe acuse: quién recibió y qué sigue. Sin acuse, el aviso escala solo.",
        "De noche (20:00–08:00) la indicación realista es la tarjeta de alarma: si se cumple lo que dice, llame al 131 sin esperar."
      ]}
    ],
    actions: [
      { id: "pa-aviso", label: "Enviar aviso de un cambio", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El aviso queda con hora y su caso; el acuse llega a este mismo canal.",
        outcome: { happened: "Aviso enviado y recibido por coordinación del período (acuse 08:26).", changed: "Su reporte queda en el episodio con receptor y seguimiento; no se pierde entre visitas.", responsible: "Coordinación (orientar) · enfermería del caso (seguimiento).", next: "Si en 30 min no hay orientación, el aviso escala al responsable declarado." } }
    ]
  },

  /* ================= CUIDADOR (R16) ================= */
  "tarjeta-alarma": {
    kind: "scene", title: "Su tarjeta de alarma — Ana P.",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Usted observa y avisa · la decisión clínica es del equipo", revision: "rev. 2", provenance: "Entregada con teach-back 16-08-2026", cutoff: CUTOFF, risk: "A1", riskText: "Téngala a la vista" },
    blocks: [
      { type: "figure", value: "SatO₂ bajo 90 → llame al 131", label: "También entre 91 y 93 si hay cansancio o agitación: no espere a la mañana" },
      { type: "kvgrid", heading: "De día (08:00–20:00)", items: [
        ["Canal", "Aviso por la app o llamada a coordinación · siempre con acuse"],
        ["Si la visita se retrasa", "Avisa por el canal; el retraso se declara con causa y nueva hora"],
        ["Si nadie contesta", "El aviso escala solo; usted no se queda sin respuesta"]
      ]},
      { type: "kvgrid", heading: "De noche (20:00–08:00)", items: [
        ["Regla", "Binaria: se cumple la tarjeta → 131 · no se cumple → anote y avise a primera hora"],
        ["Por qué 131", "La respuesta institucional nocturna está en validación (brecha V02): la tarjeta no le promete un médico de noche, le da la vía real"],
        ["Lo que usted NO hace", "No manipula dispositivos ni decide medicamentos: observa y reporta"]
      ]}
    ],
    actions: [
      { id: "cu-tarjeta", label: "Confirmo que está a la vista y la entiendo", kind: "primary", availability: "available", mode: "reconcilable_write", immediate: true,
        outcome: { happened: "Tarjeta registrada como comprendida y a la vista.", changed: "El equipo sabe que la instrucción llegó; la reevaluación práctica sigue agendada.", responsible: "Usted (observar y avisar) · el equipo (decidir y actuar).", next: "Reevaluación con demostración el 18-08; si algo se cumple antes, 131 sin esperar." } }
    ]
  },
  "reporte-cuidador": {
    kind: "scene", title: "Reportar un cambio — con acuse y seguimiento",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Enfermería del caso recibe (día)", revision: "rev. 1", provenance: "Circuito de aviso del episodio", cutoff: CUTOFF, risk: "A1", riskText: "Disponible cuando lo necesite" },
    blocks: [
      { type: "section", heading: "Lo que pasa con su reporte", items: [
        "Queda con hora y su relación con el caso; llega a enfermería del caso, no a una bandeja.",
        "Recibe acuse (quién recibió) y orientación (qué hacer ahora).",
        "Si el cambio es de los que marca la tarjeta, no use este canal: llame al 131 directo."
      ]}
    ],
    actions: [
      { id: "cu-reporte", label: "Enviar reporte de un cambio", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El reporte queda con hora; el acuse y la orientación llegan a este mismo canal.",
        outcome: { happened: "Reporte recibido por enfermería del caso (acuse 08:31) con orientación registrada.", changed: "El episodio incorpora su observación con seguimiento; usted no queda sola con el dato.", responsible: "Enfermería del caso (orientación) · coordinación (si requiere visita).", next: "Seguimiento en la próxima visita o antes si la orientación lo indica." } }
    ]
  },
  "sobrecarga-cuidador": {
    kind: "scene", title: "Declarar sobrecarga o decir «no puedo más»",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Coordinación y trabajo social reevalúan el plan", revision: "rev. 1", provenance: "Su declaración del 16-08-2026 21:35", cutoff: CUTOFF, risk: "A2", riskText: "En seguimiento desde su declaración" },
    blocks: [
      { type: "notice", tone: "info", text: "Su rol es voluntario, limitado y sin responsabilidad clínica: declarar sobrecarga o retiro nunca es abandonar a Ana P. — obliga al equipo a reevaluar el plan. La culpa no es un dato del sistema." },
      { type: "kvgrid", heading: "Su declaración del 16-08", items: [
        ["Estado", "Recibida con acuse · reevaluación social agendada 18-08"],
        ["Mientras tanto", "Programa municipal de apoyo activado · relevo familiar en articulación"],
        ["Si hay quiebre antes", "Declárelo aquí mismo: la reevaluación se adelanta; no se le pide aguantar"]
      ]}
    ],
    actions: [
      { id: "cu-retiro", label: "Declarar que no puedo sostener el rol", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La declaración queda con hora y sin juicio; activa la reevaluación del plan, no un reproche.",
        outcome: { happened: "Retiro del rol declarado con hora y acuse.", changed: "El episodio entra en reevaluación inmediata: la viabilidad del cuidado se revisa con trabajo social y coordinación; Ana P. no queda sin respuesta.", responsible: "Coordinación (reevaluar) · trabajo social (plan) · médico tratante (viabilidad).", next: "Se le confirma la decisión y el plan alterno; su cuidado hasta ese momento queda reconocido en el registro." } },
      { id: "cu-seguir", label: "Seguir colaborando con el apoyo activado", kind: "exit", availability: "available",
        note: "Queda registrado que continúa con el apoyo municipal y el relevo en articulación; la reevaluación del 18-08 se mantiene." }
    ]
  },

  /* ================= R14 · SEREMI / AUTORIDAD SANITARIA ================= */
  "fiscalizacion-autorizacion": {
    kind: "scene", title: "Autorización sanitaria — resolver con evidencia de operación",
    header: { caseId: "Expediente de autorización", person: null, responsible: "SEREMI de Salud (resuelve) · DT (declara)", revision: "rev. 1", provenance: "Expediente en curso · vigencia 3 años con prórroga", cutoff: CUTOFF, risk: "A2", riskText: "Diseño y operación se evalúan por separado" },
    blocks: [
      { type: "notice", tone: "info", text: "Un protocolo demuestra diseño, no práctica; un checklist levantado demuestra revisión, no cumplimiento. La resolución distingue uno de otra con evidencia recuperable." },
      { type: "kvgrid", heading: "Lo que se revisa", items: [
        ["Cartera y elegibilidad", "Cartera vigente versionada, con límites declarados"],
        ["Dotación y habilitación", "Nómina única con inducción registrada; brechas con plan y plazo declarados"],
        ["Protocolos y aplicación", "Protocolo versionado con dueño + evidencia de uso en terreno"],
        ["Cobertura 24/7", "Contrato de contactabilidad declarado; la brecha nocturna se presenta con plan, no como cerrada"]
      ]},
      { type: "section", heading: "Lo que no es evidencia", items: [
        "La autorización matriz o un documento oficial como prueba automática de cumplimiento.",
        "La memoria del equipo: todo antecedente debe ser atribuible y recuperable."
      ]}
    ],
    actions: [
      { id: "se-resolver", label: "Resolver el expediente con evidencia de operación real", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La resolución queda con fundamento, alcance y verificación de cierre declarados.",
        outcome: { happened: "Expediente resuelto con evidencia de operación, no solo de diseño.", changed: "La unidad queda con autorización y condiciones explícitas, o con observaciones con plazo.", responsible: "SEREMI (resolución) · Dirección Técnica (cumplimiento verificable).", next: "Si hay condiciones, cada una nace con plazo y verificación de cierre; la unidad responde desde registros, no desde memoria." } }
    ]
  },
  "fiscalizacion-observacion": {
    kind: "scene", title: "Observación de fiscalización — plazo y condición inequívocos",
    header: { caseId: "Acta de fiscalización 31-07-2026", person: null, responsible: "SEREMI (emite) · Dirección Técnica (responde)", revision: "rev. 1", provenance: "Visita fiscalizadora con respaldo", cutoff: CUTOFF, risk: "A2", riskText: "Plazo al cumplimiento 21-08-2026" },
    blocks: [
      { type: "kvgrid", heading: "La observación", items: [
        ["Hallazgo", "Cobertura de respuesta 20:00–08:00 sin fallback ejercitado"],
        ["Condición", "Fallback operativo con prueba y acuse, o suspensión de ingresos con dependencia alta"],
        ["Plazo", "21-08-2026 · con evidencia de efecto, no solo de emisión"],
        ["Verificación de cierre", "La observación se cierra cuando la evidencia demuestra el cambio, no cuando se responde el oficio"]
      ]},
      { type: "notice", tone: "info", text: "La inspección consultiva previa al expediente resuelve objeciones en diseño, no en fiscalización: lo observado en terreno manda." }
    ],
    actions: [
      { id: "se-observacion", label: "Emitir observación con plazo y verificación de cierre", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La observación queda emitida con condición, plazo y forma de verificación inequívocos.",
        outcome: { happened: "Observación emitida con plazo 21-08-2026 y criterio de cierre declarado.", changed: "La unidad queda con la obligación de responder con evidencia de efecto.", responsible: "Dirección Técnica recibe la obligación (visible en su cola).", next: "Verificación de cierre al plazo: la observación se cierra con evidencia, no con el oficio." } }
    ]
  },

  /* ================= R17 · REPRESENTANTE LEGAL / FAMILIA ================= */
  "representante-alcance": {
    kind: "scene", title: "Verificación de representación — alcance antes de decidir",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Equipo HODOM verifica · usted declara", revision: "rev. 1", provenance: "Verificación de representación 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Alcance por verificar, no presumir" },
    blocks: [
      { type: "notice", tone: "info", text: "Representante legal, cuidador y familiar de contacto son tres cosas distintas: la disponibilidad de un familiar no lo convierte en representante ni en cuidador." },
      { type: "kvgrid", heading: "Su alcance verificado", items: [
        ["Qué puede", "Recibir la información autorizada por el paciente · participar en cambios mayores, rescate y egreso según la voluntad de Jorge M."],
        ["Qué no es", "No desplaza ni vigila al cuidador · no decide atención diaria · no firma consentimientos fuera de su alcance"],
        ["Cómo se verifica", "Documento de representación registrado · alcance declarado con fecha y revisión"]
      ]}
    ],
    actions: [
      { id: "rl-alcance", label: "Registrar el alcance verificado de la representación", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El alcance queda registrado con fecha y respaldo; toda decisión posterior lo consulta.",
        outcome: { happened: "Representación verificada y registrada con alcance explícito.", changed: "El equipo sabe qué decisiones la incluyen y cuáles no; la familia no es tratada como cuidador ni como representante sin serlo.", responsible: "Equipo HODOM (respeta el alcance) · registro del episodio (conserva el respaldo).", next: "Participación en cambios mayores según lo registrado; revisión si el alcance cambia." } }
    ]
  },

  /* ================= R19 · ENFERMERÍA/TENS DEL SERVICIO DE ORIGEN ================= */
  "origen-handoff": {
    kind: "scene", title: "Entrega del handoff de Jorge M. — completa o no se libera",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Origen conserva la responsabilidad hasta el acuse HODOM", revision: "rev. 1", provenance: "Episodio en origen · Medicina Interna", cutoff: CUTOFF, risk: "A2", riskText: "Ventana de traslado 11:00–13:00" },
    alerts: [
      { level: "A2", condition: "Liberar al paciente sin receptor confirmado o con indicaciones enmendadas", severity: "Alta", receptor: "Enfermería del servicio de origen", action: "Completar el handoff y confirmar receptor antes de liberar", suppression: "No suprimible hasta la entrega con acuse", escalation: "Coordinación HODOM si el receptor no confirma", expiry: "Al acuse del receptor", authority: "Regla de transferencia sin vacío de responsabilidad" }
    ],
    blocks: [
      { type: "section", heading: "Contenido completo del handoff", items: [
        "Línea base: signos, funcionalidad, piel, dispositivos y alergias.",
        "Últimas dosis administradas con hora — sin ellas el receptor repite u omite.",
        "Pendientes: exámenes en curso, curaciones programadas, contactos.",
        "Medicamentos, insumos y documentos concordantes con el plan (incluida la epicrisis breve si aplica)."
      ]},
      { type: "kvgrid", heading: "Antes de liberar", items: [
        ["Hora y transporte", "Confirmados con coordinación HODOM"],
        ["Receptor", "Identificado y con acuse — sin acuse no hay liberación"],
        ["Contacto posterior", "Usted queda contactable para aclarar discrepancias tempranas"]
      ]}
    ],
    actions: [
      { id: "eo-entregar", label: "Confirmar entrega completa y liberar al paciente", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Liberar al paciente transfiere la responsabilidad al receptor que acusó. Sin acuse, la responsabilidad sigue siendo suya.",
        outcome: { happened: "Handoff completo entregado con acuse del receptor HODOM.", changed: "La responsabilidad se transfiere en el acuse, no antes; el origen queda contactable para discrepancias.", responsible: "Receptor HODOM (desde el acuse) · origen (aclaraciones tempranas).", next: "Primera valoración HODOM en domicilio dentro de 24 h." } },
      { id: "eo-aclarar", label: "Solicitar aclaración antes de liberar", kind: "exit", availability: "available",
        note: "La liberación se detiene con causa declarada; el paciente no viaja con dudas." }
    ]
  },

  /* ================= R20 · GESTIÓN DE CAMAS / UGDP ================= */
  "camas-cola": {
    kind: "scene", title: "Cola compartida de candidatos — proponer sin prometer cupo",
    header: { caseId: "Cola de candidatos", person: null, responsible: "Gestión de Camas propone · el equipo HODOM decide pertinencia", revision: "rev. 1", provenance: "Cola del día 17-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Cupo nominal NO es cama disponible" },
    blocks: [
      { type: "notice", tone: "info", text: "La presión de camas no es aceptación: la pertinencia clínica y la viabilidad domiciliaria las deciden responsables competentes. Quién emite aceptar/diferir/rechazar sigue abierto (brecha V01) — la cola muestra estados, nunca los fuerza." },
      { type: "table", heading: "Cola compartida (postulados · aceptados · diferidos · rechazados)", cols: ["Candidato", "Estado", "Motivo declarado", "Responsable ahora"], rows: [
        ["HOD-2026-0142 · Elena F., 78", "Verificación clínica completa", "Decisión operacional pendiente (V01)", "Equipo HODOM"],
        ["HOD-2026-0140 · Carlos V., 74", "En evaluación", "Falta conciliación de medicamentos del origen", "Derivador (completar)"],
        ["HOD-2026-0136 · Marta G., 69", "Diferida por capacidad", "Sin cupo · cuidado interino declarado · reevaluación 18-08", "Origen (interino) · HODOM (reevaluación)"]
      ]},
      { type: "notice", tone: "attention", text: "Un diferimiento por capacidad nunca se registra como rechazo clínico: son decisiones distintas con consecuencias distintas." }
    ],
    actions: [
      { id: "gc-proponer", label: "Proponer candidato a la cola sin prometer cupo", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La propuesta queda en la cola con motivo; no compromete aceptación ni cupo.",
        outcome: { happened: "Candidato propuesto a la cola compartida con motivo declarado.", changed: "La cola lo muestra como propuesto; la decisión sigue en el equipo HODOM según su proceso.", responsible: "Gestión de Camas (propone) · equipo HODOM (evalúa y decide).", next: "Seguimiento del estado en la cola; movilización solo con acuse del receptor." } }
    ]
  },

  /* ================= R21 · EQUIPO RECEPTOR UEA ================= */
  "uea-prealerta": {
    kind: "scene", title: "Prealerta de rescate — acusar antes de que el paciente llegue",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Regulador HODOM permanece hasta su acuse", revision: "rev. 1", provenance: "Circuito de rescate HODOM–UEA", cutoff: CUTOFF, risk: "A3", riskText: "Sin acuse, la recepción no está confirmada" },
    alerts: [
      { level: "A3", condition: "Prealerta de rescate sin acuse del equipo receptor", severity: "Alta", receptor: "Equipo receptor UEA", action: "Acusar con hora y preparar la recepción", suppression: "No suprimible hasta el acuse", escalation: "Escala a dirección de guardia si no hay acuse en el umbral", expiry: "Al acuse con hora", authority: "Interfaz HODOM–UEA acordada", channel: "Si el canal falla: llamada directa al número declarado en la interfaz" }
    ],
    blocks: [
      { type: "kvgrid", heading: "La prealerta trae", items: [
        ["Identidad y situación", "Ana P., 82 años · deterioro respiratorio en domicilio"],
        ["Antecedentes y tratamientos", "Resumen clínico actualizado, no una reconstrucción por teléfono"],
        ["Dispositivos", "Vía periférica funcionando · oxígeno en curso"],
        ["Quién regula y receptor previsto", "Regulador HODOM declarado · UEA como receptor — nada se improvisa en la urgencia"]
      ]},
      { type: "notice", tone: "attention", text: "El contrato de respuesta 20:00–08:00 está en activación pendiente (brecha V02): esta prealerta existe por la interfaz acordada; fuera de horario la cadena se declara, no se presume." }
    ],
    actions: [
      { id: "uea-acuse", label: "Acusar la prealerta y preparar la recepción", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El acuse queda con hora; desde él, usted es el receptor esperado y el regulador HODOM puede cerrar su permanencia.",
        outcome: { happened: "Prealerta acusada con hora y equipo preparado.", changed: "La recepción está confirmada: el paciente no llega a un servicio que no lo espera.", responsible: "UEA (recepción) · regulador HODOM (hasta la entrega con acuse en destino).", next: "Recepción, priorización al arribo y reconciliación de lo realizado por HODOM con autoría propia." } }
    ]
  },

  /* ================= R22 · SAMU / TRANSPORTE SANITARIO ================= */
  "samu-despacho": {
    kind: "scene", title: "Despacho del traslado — ubicación, situación y receptor primero",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "SAMU ejecuta · regulador y receptor ya declarados", revision: "rev. 1", provenance: "Solicitud de traslado regulada", cutoff: CUTOFF, risk: "A2", riskText: "No resolver la arquitectura durante el despacho" },
    blocks: [
      { type: "kvgrid", heading: "Antes de despachar", items: [
        ["Ubicación y acceso", "Domicilio georreferenciado con referencia de acceso (sin canal informal: la coordenada tiene custodia declarada · tesis K13)"],
        ["Situación clínica y riesgos", "Resumen estructurado del episodio y del deterioro"],
        ["Contacto en destino", "Cuidador con teléfono declarado"],
        ["Quién regula y quién recibe", "Regulador HODOM y UEA receptora ya acordados — el 131 no sustituye el contrato HODOM–UEA"]
      ]},
      { type: "notice", tone: "info", text: "Quién autoriza cada transición y retorno sigue abierto (brecha V03): el despacho usa la regulación declarada; no la inventa." }
    ],
    actions: [
      { id: "sa-despachar", label: "Despachar el recurso con receptor declarado", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El despacho queda con recurso, destino y receptor; la custodia del paciente viaja declarada.",
        outcome: { happened: "Recurso despachado con ubicación, situación y receptor acordados.", changed: "El traslado corre con custodia declarada y handoff documentado en curso.", responsible: "SAMU (traslado) · regulador (hasta acuse de entrega).", next: "Entrega al receptor UEA con acuse: la custodia se cierra ahí, no al arribo." } }
    ]
  },

  /* ================= R23 · APS / CESFAM ================= */
  "aps-contrarreferencia": {
    kind: "scene", title: "Contrarreferencia de Luis A. — la epicrisis enviada no es recepción",
    header: { caseId: "HOD-2026-0117", person: "luis", responsible: "HODOM conserva la responsabilidad hasta su acuse", revision: "rev. 2", provenance: "Epicrisis emitida 17-08-2026 · sin acuse", cutoff: CUTOFF, risk: "A2", riskText: "Recepción por confirmar" },
    alerts: [
      { level: "A2", condition: "Epicrisis enviada sin acuse de la APS receptora", severity: "Media", receptor: "APS / CESFAM receptor", action: "Aceptar, observar o devolver con motivo", suppression: "No suprimible: sin acuse, el pendiente permanece en la unidad y el cupo no se libera", escalation: "Coordinación HODOM a las 24 h sin acuse", expiry: "Al acuse con decisión", authority: "Regla de continuidad con receptor confirmado (brecha V09: qué CESFAM acusa cada continuidad sigue abierta)" }
    ],
    blocks: [
      { type: "kvgrid", heading: "La contrarreferencia trae", items: [
        ["Diagnóstico y evolución", "Resumen del episodio en lenguaje claro"],
        ["Conciliación de medicamentos", "Qué se suspende, qué se mantiene, qué se inicia"],
        ["Dispositivos y funcionalidad", "Estado al egreso y riesgos declarados"],
        ["Pendientes y prestaciones", "Curaciones, controles y rehabilitación con quién asume cada una"]
      ]}
    ],
    actions: [
      { id: "aps-aceptar", label: "Aceptar la continuidad con acuse", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El acuse confirma que puede y acepta continuar las prestaciones declaradas; el alta queda efectiva solo desde ese acuse.",
        outcome: { happened: "Continuidad aceptada con acuse y prestaciones asignadas.", changed: "El episodio HODOM puede cerrar: la transferencia es efectiva, no documental.", responsible: "APS/CESFAM (continuidad) · HODOM (seguimiento de 72 h).", next: "Primera atención de continuidad agendada; quiebres se retroalimentan a HODOM." } },
      { id: "aps-devolver", label: "Devolver con motivo", kind: "exit", availability: "available",
        note: "La devolución con motivo deja el pendiente en HODOM con la causa visible; el paciente no queda sin responsable." }
    ]
  },

  /* ================= R24 · FARMACIA ================= */
  "farmacia-dispensacion": {
    kind: "scene", title: "Dispensación en ventana — el cuidador no busca el medicamento crítico",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Farmacia dispensa · equipo entrega · cuidador no media", revision: "rev. 1", provenance: "Prescripción válida del episodio", cutoff: CUTOFF, risk: "A2", riskText: "Ventana terapéutica con plazo" },
    blocks: [
      { type: "kvgrid", heading: "Lo que sostiene la dispensación", items: [
        ["Prescripción y conciliación", "Prescripción válida con conciliación al episodio — sin ella no se dispensa"],
        ["Tiempo", "Preparación y entrega dentro de la ventana terapéutica declarada"],
        ["Cadena de frío y stock", "Cadena íntegra; faltantes se resuelven por el canal, nunca derivándolos al cuidador"],
        ["Frontera al alta", "Al egreso se declara qué sostiene cada tratamiento para no perder ni duplicar"]
      ]},
      { type: "notice", tone: "info", text: "El ciclo completo del medicamento (gates G0–G7) sigue sin adjudicar: esta escena cubre la dispensación del episodio vigente; no cierra el ciclo." }
    ],
    actions: [
      { id: "fa-dispensar", label: "Confirmar dispensación en ventana con entrega declarada", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La dispensación queda con hora, contenido y custodia de entrega al equipo.",
        outcome: { happened: "Dispensación confirmada dentro de la ventana con custodia de entrega.", changed: "El equipo lleva el medicamento; el cuidador no sale a buscarlo ni media faltantes.", responsible: "Farmacia (preparación) · equipo HODOM (entrega y administración según plan).", next: "Devoluciones y residuos se registran al cierre de la entrega." } }
    ]
  },

  /* ================= R25 · LABORATORIO ================= */
  "laboratorio-critico": {
    kind: "scene", title: "Resultado crítico — comunicar a un receptor clínico con read-back",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Laboratorio informa · médico de atención directa responde", revision: "rev. 1", provenance: "Muestra procesada y verificada 07:50", cutoff: CUTOFF, risk: "A4", riskText: "Crítico sin receptor no produce acción" },
    alerts: [
      { level: "A4", condition: "Potasio 6,1 mmol/L verificado sin conducta registrada", severity: "Crítica", receptor: "Médico de atención directa", action: "Comunicar con acuse y read-back; el médico interpreta y define conducta", suppression: "No suprimible; se retira solo con conducta registrada", escalation: "Sin conducta a las 08:22 escala al médico regulador", expiry: "Al registrar conducta", authority: "Protocolo de resultado crítico HSC", channel: "Si el sistema no responde: llamada directa al regulador, por el canal declarado en el contrato de cobertura" }
    ],
    blocks: [
      { type: "figure", value: "K+ 6,1 mmol/L", label: "Resultado crítico · verificado 07:50 · informado 07:52" },
      { type: "kvgrid", heading: "La cadena que sí produce acción", items: [
        ["Identificación inequívoca", "Muestra y paciente sin ambigüedad"],
        ["Custodia", "Toma, embalaje, temperatura y tiempo trazables"],
        ["Receptor clínico", "El resultado se comunica a una persona que puede definir conducta, con acuse"],
        ["Read-back", "El receptor repite el valor y queda registrado — informar no es notificar al aire"]
      ]}
    ],
    actions: [
      { id: "lab-informar", label: "Confirmar comunicación con read-back del médico", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La comunicación queda con hora, receptor y read-back registrado.",
        outcome: { happened: "Resultado crítico comunicado al médico con read-back registrado 07:52.", changed: "El dato produce acción: el médico de atención directa tiene la obligación visible en su cola.", responsible: "Médico de atención directa (interpretación y conducta).", next: "El médico registra conducta; sin ella, escala al regulador a las 08:22." } }
    ]
  },

  /* ================= R26 · IMAGENOLOGÍA ================= */
  "imagenologia-circuito": {
    kind: "scene", title: "Apoyo diagnóstico sin desanclar el episodio",
    header: { caseId: "HOD-2026-0131", person: "rosa", responsible: "Imagenología resuelve · médico HODOM integra", revision: "rev. 1", provenance: "Solicitud con pregunta clínica y prioridad", cutoff: CUTOFF, risk: "A2", riskText: "Diagnóstico programable, no urgencia por defecto" },
    blocks: [
      { type: "kvgrid", heading: "El circuito que no rompe el episodio", items: [
        ["Solicitud válida", "Pregunta clínica y prioridad declaradas — sin ellas no se agenda"],
        ["Citación y retorno", "Preparación, traslado y retorno acordados con coordinación — sin pasar por urgencia salvo indicación"],
        ["Hallazgos críticos", "Se comunican con acuse, como cualquier resultado crítico"],
        ["Integración", "El informe lo integra el médico HODOM al plan único del episodio"]
      ]}
    ],
    actions: [
      { id: "img-citar", label: "Confirmar citación y retorno sin pasar por urgencia", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La citación queda con preparación, traslado y retorno declarados.",
        outcome: { happened: "Examen citado con circuito de ida y vuelta declarado.", changed: "El episodio no se desancla: el paciente va y vuelve con el plan intacto.", responsible: "Imagenología (examen e informe) · médico HODOM (integración).", next: "Informe con acuse; hallazgos críticos por el circuito de resultado crítico." } }
    ]
  },

  /* ================= R27 · ESPECIALISTA / TELEMEDICINA ================= */
  "especialista-interconsulta": {
    kind: "scene", title: "Interconsulta — recomendación con certeza, alertas y seguimiento",
    header: { caseId: "HOD-2026-0138", person: "jorge", responsible: "Especialista recomienda · médico HODOM integra y conduce", revision: "rev. 1", provenance: "Interconsulta con antecedentes completos", cutoff: CUTOFF, risk: "A2", riskText: "Una videollamada no cierra la interconsulta" },
    blocks: [
      { type: "kvgrid", heading: "Condiciones para aportar", items: [
        ["Pregunta clínica", "Definida, con antecedentes, exámenes y urgencia declarados"],
        ["Calidad de información y privacidad", "Identidad verificada, canal adecuado, apoyo local si el examen lo requiere — sin fingir equivalencia cuando no existe"],
        ["Lo que se deja", "Recomendación + nivel de certeza + alertas + seguimiento propuesto"]
      ]},
      { type: "notice", tone: "info", text: "El equipo tratante acepta, adapta o justifica la recomendación y cierra los pendientes: la conducción del plan sigue siendo única." }
    ],
    actions: [
      { id: "esp-recomendar", label: "Emitir recomendación con certeza y seguimiento", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La recomendación queda registrada con certeza, alertas y seguimiento; la decisión final es del equipo tratante.",
        outcome: { happened: "Recomendación emitida con nivel de certeza y seguimiento declarado.", changed: "El médico HODOM tiene la obligación de integrarla o justificar su desvío.", responsible: "Médico HODOM (integración y conducción única del plan).", next: "Seguimiento según lo propuesto; la interconsulta se cierra cuando el equipo tratante registra su decisión." } }
    ]
  },

  /* ================= R28 · IAAS ================= */
  "iaas-vigilancia": {
    kind: "scene", title: "Vigilancia IAAS adaptada al domicilio",
    header: { caseId: "Programa IAAS · domicilio", person: null, responsible: "IAAS adapta · equipo ejecuta · DT verifica", revision: "rev. 1", provenance: "Programa IAAS adaptado a domicilio", cutoff: CUTOFF, risk: "A2", riskText: "El protocolo de hospital no se copia a una casa" },
    blocks: [
      { type: "section", heading: "Lo que se adapta, no se copia", items: [
        "Precauciones según cartera, dispositivos, procedimientos y entornos reales de los hogares.",
        "Protocolos, insumos, EPP e higiene ejecutables en domicilios heterogéneos.",
        "Vigilancia de dispositivos y sospechas con denominadores pertinentes al domicilio.",
        "Circuito de notificación, investigación y medidas sin perder el contexto domiciliario."
      ]},
      { type: "notice", tone: "attention", text: "Pendiente de visación IAAS: la oxigenoterapia domiciliaria (práctica histórica ≤1 L/min) no se instala «como siempre» — espera visación con evidencia de aplicabilidad." }
    ],
    actions: [
      { id: "ia-visar", label: "Visar el protocolo adaptado con evidencia de aplicabilidad", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La visación declara que el protocolo es aplicable, conocido y ejecutable en los domicilios reales de la cartera.",
        outcome: { happened: "Protocolo adaptado a domicilio visado con evidencia de aplicabilidad.", changed: "El equipo tiene una regla ejecutable en terreno, no un documento de hospital traducido.", responsible: "IAAS (vigilancia) · Dirección Técnica (verificación del efecto).", next: "Vigilancia con denominadores declarados; sospechas entran al circuito de notificación." } }
    ]
  },

  /* ================= R29 · CALIDAD / DCSP / OIRS ================= */
  "calidad-evento": {
    kind: "scene", title: "Evento notificado — analizar y exigir cierre con efecto",
    header: { caseId: "Evento EV-2026-014", person: null, responsible: "Calidad (análisis y cierre) · equipo (voz del usuario)", revision: "rev. 1", provenance: "Rescate del 12-08-2026 con demora de 42 min", cutoff: CUTOFF, risk: "A2", riskText: "Un formulario completado no es aprendizaje" },
    blocks: [
      { type: "kvgrid", heading: "El circuito que sí aprende", items: [
        ["Triage y tipo", "Evento, complicación, reclamo, mortalidad o falla de continuidad — cada uno con su método"],
        ["Análisis", "Causas y barreras con voz del usuario, sin reducir a error individual"],
        ["Acción", "Con dueño y fecha; sin ella el evento no se cierra"],
        ["Verificación", "Se comprueba que la acción cambió el proceso — si no, el evento sigue abierto"]
      ]},
      { type: "notice", tone: "info", text: "Cómo ingresa y cierra un evento HODOM en GCL/DCSP sigue abierto (brecha V06): este circuito lo declara; no lo da por resuelto." }
    ],
    actions: [
      { id: "ca-analizar", label: "Abrir análisis con método y voz del usuario", kind: "primary", availability: "available", mode: "only_online",
        confirm: "El análisis queda con método declarado, participantes y fecha; la acción correctiva nacerá con dueño y verificación.",
        outcome: { happened: "Análisis abierto con método y voz del usuario incluida.", changed: "El evento no se cierra por formulario: queda abierto hasta la acción con efecto verificado.", responsible: "Calidad (conduce el análisis) · Dirección Técnica (verifica el efecto).", next: "Acción correctiva con dueño y fecha; verificación de efecto al plazo." } }
    ]
  },

  /* ================= R30 · DIRECCIÓN HOSPITALARIA ================= */
  "direccion-riesgo": {
    kind: "scene", title: "Riesgo no mitigable por la unidad — decidir con plazo y consecuencia",
    header: { caseId: "Programa HODOM", person: null, responsible: "Dirección hospitalaria decide · DT declara", revision: "rev. 1", provenance: "Escalamiento de riesgo residual 15-08-2026", cutoff: CUTOFF, risk: "A3", riskText: "Aceptar, reducir, transferir o suspender — explícito" },
    blocks: [
      { type: "section", heading: "El riesgo escalado", items: [
        "Cobertura de respuesta 20:00–08:00 sin fallback probado; rescate del 12-08 con demora de 42 minutos y desenlace favorable sin daño.",
        "La unidad no puede mitigarlo sola: requiere dotación, contrato o decisión de suspensión."
      ]},
      { type: "kvgrid", heading: "Lo que no se puede hacer", items: [
        ["Exigir producción sin financiar", "Más ingresos sin capacidad de respuesta, apoyo social, administración y continuidad que la hacen segura"],
        ["Confundir campaña con capacidad", "La dotación de campaña no es capacidad estructural"]
      ]}
    ],
    actions: [
      { id: "dh-decidir", label: "Decidir el riesgo con plazo y consecuencia", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La decisión queda explícita: aceptar, reducir, transferir o suspender, con plazo y consecuencia declarados.",
        outcome: { happened: "Riesgo decidido a nivel hospitalario con plazo y consecuencia.", changed: "La unidad opera con una decisión explícita, no con un riesgo heredado sin dueño.", responsible: "Dirección hospitalaria (decisión) · Dirección Técnica (operación dentro de lo decidido).", next: "La decisión se comunica con efecto en cartera, dotación o cobertura; su cumplimiento se verifica al plazo." } }
    ]
  },

  /* ================= R31 · GESTIÓN DE PERSONAS ================= */
  "personas-habilitacion": {
    kind: "scene", title: "Habilitación antes del terreno — título, registro e inducción",
    header: { caseId: "Ingreso refuerzo de kinesiología", person: null, responsible: "Gestión de Personas verifica · DT ratifica la habilitación", revision: "rev. 1", provenance: "Contrato de refuerzo 14-08-2026 · ingreso 24-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Certificado vigente no sustituye competencia observada" },
    blocks: [
      { type: "kvgrid", heading: "Antes de asignar terreno", items: [
        ["Título y registro", "Verificados antes del ingreso, no después"],
        ["Inducción HODOM", "44 horas teórica, práctica y supervisada, con registro — sin ella no hay actuación autónoma"],
        ["Matriz de competencias", "Qué puede ejecutar, con qué supervisión; ausencias y restricciones vigentes para coordinación"],
        ["Al retiro o cambio", "Los accesos se revocan con el mismo circuito"]
      ]},
      { type: "notice", tone: "info", text: "Esta habilitación destraba la provision de la cuenta (Seguridad) y la decisión de terreno de Dirección Técnica — tres actos distintos que no se presumen entre sí." }
    ],
    actions: [
      { id: "gp-habilitar", label: "Habilitar a terreno con inducción completada", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La habilitación queda con evidencia de título, registro e inducción; la ratificación de terreno es de Dirección Técnica.",
        outcome: { happened: "Refuerzo habilitado con inducción de 44 h registrada.", changed: "Dirección Técnica puede ratificar terreno; Seguridad puede provisionar la cuenta con función declarada.", responsible: "Gestión de Personas (registro) · DT (ratificación de terreno) · Seguridad (cuenta).", next: "Matriz de competencias disponible para coordinación al armar el programa del 24-08." } }
    ]
  },

  /* ================= R32 · ABASTECIMIENTO / REAS ================= */
  "reas-equipo": {
    kind: "scene", title: "Disponibilidad real — en inventario sin calibración no está disponible",
    header: { caseId: "Período 17-08-2026", person: null, responsible: "Logística declara · DT y coordinación planifican con lo real", revision: "rev. 1", provenance: "Inventario y mantención del período", cutoff: CUTOFF, risk: "A2", riskText: "No prometer prestación materialmente imposible" },
    blocks: [
      { type: "table", heading: "Disponibilidad declarada del período", cols: ["Equipo / insumo", "Estado real", "Disponible"], rows: [
        ["Oxsímetro M1", "Calibrado 05-08-2026", "Sí"],
        ["Concentrador O₂ portátil", "En mantención hasta 19-08", "No — se declara antes de aceptar"],
        ["Stock de apósitos de curación", "Sobre stock mínimo", "Sí"],
        ["Circuito REAS", "Sin visación IAAS ni recinto de disposición", "No opera — la familia no manipula residuos; el vehículo nunca es bodega"]
      ]},
      { type: "notice", tone: "attention", text: "Si el concentrador se necesita para un ingreso antes del 19-08, se declara NO disponible hoy: la planificación se ajusta o se escala, nunca se promete." }
    ],
    actions: [
      { id: "lr-declarar", label: "Declarar la disponibilidad real del período", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La declaración queda con fecha; cualquier planificación posterior usa estos estados, no el inventario nominal.",
        outcome: { happened: "Disponibilidad real declarada para el período.", changed: "Coordinación y DT planifican con lo que efectivamente existe; el ingreso que requiere el concentrador queda condicionado y visible.", responsible: "Logística (estado real) · DT (decisión sobre lo condicionado).", next: "Revisión al cierre de mantención 19-08; retiro y devolución de insumos con trazabilidad." } }
    ]
  },

  /* ================= R33 · TI / GOBIERNO DE DATOS ================= */
  "ti-controles": {
    kind: "scene", title: "Controles MINSAL — verificables, no checklist decorativo",
    header: { caseId: "Gobierno de datos HODOM", person: null, responsible: "TI verifica · DT y auditoría reciben", revision: "rev. 1", provenance: "Controles de cumplimiento MINSAL", cutoff: CUTOFF, risk: "A2", riskText: "No automatizar una ambigüedad de autoridad" },
    blocks: [
      { type: "table", heading: "Controles con evidencia viva", cols: ["Control", "Qué demuestra", "Estado"], rows: [
        ["Identidad y episodio compartido", "Una identidad de episodio evita duplicación entre postulación, atención, llamada, examen y alta", "Verificable con guard vivo"],
        ["Bitácora íntegra", "Acceso y cambio recuperables sin alterar evidencia", "Verificable con prueba negativa"],
        ["Retención y linaje", "Cada dato con origen y tiempo de retención declarado", "Verificable"],
        ["Contingencia y reconciliación", "Caída del sistema sin bifurcar la verdad; reconciliación posterior única", "Diseñado · ejercicio pendiente"],
        ["No-ficha-paralela", "Cada acto HODOM mapeado al registro clínico institucional y su propietario (brecha V05 abierta)", "Declarado, no cerrado"]
      ]},
      { type: "notice", tone: "info", text: "Un control se declara cerrado solo con un guard vivo y una prueba negativa que lo defiende; la presencia de un documento no es un control." }
    ],
    actions: [
      { id: "ti-verificar", label: "Verificar controles con evidencia y declarar los pendientes", kind: "primary", availability: "available", mode: "only_online",
        confirm: "Cada control queda con su evidencia o con su brecha declarada; ninguno se da por cumplido por checklist.",
        outcome: { happened: "Controles verificados con evidencia; pendientes declarados con plan.", changed: "DT y auditoría ven el estado real: qué está defendido por un guard vivo y qué sigue abierto.", responsible: "TI (verificación) · Dirección Técnica (decide sobre lo pendiente).", next: "Las brechas de datos (V05) permanecen visibles hasta su resolución con autoridad." } }
    ]
  },

  /* ================= R34 · RED SOCIAL-TERRITORIAL ================= */
  "red-activacion": {
    kind: "scene", title: "Activación de apoyo — con disponibilidad confirmada o no existe",
    header: { caseId: "HOD-2026-0129", person: "ana", responsible: "Red social-territorial activa · trabajo social integra", revision: "rev. 1", provenance: "Solicitud de activación de red 16-08-2026", cutoff: CUTOFF, risk: "A2", riskText: "Red nominal sin confirmar no existe" },
    blocks: [
      { type: "kvgrid", heading: "La solicitud trae", items: [
        ["Necesidad", "Apoyo a cuidador con sobrecarga declarada (relevo y acompañamiento)"],
        ["Consentimiento", "De la persona y del cuidador, registrado"],
        ["Urgencia y responsable", "Antes de la reevaluación del 18-08 · solicitante identificado"]
      ]},
      { type: "section", heading: "Lo que activa significa", items: [
        "Aceptar, rechazar o programar con fundamento y plazo realista — nunca «activada» sin disponibilidad confirmada.",
        "Las gestiones abiertas se transfieren al egreso: no terminan con el episodio clínico."
      ]}
    ],
    actions: [
      { id: "rs-activar", label: "Confirmar apoyo con disponibilidad y responsable", kind: "primary", availability: "available", mode: "only_online",
        confirm: "La activación queda con recurso, disponibilidad y responsable confirmados — con fecha y plazo.",
        outcome: { happened: "Apoyo activado con disponibilidad y responsable confirmados.", changed: "El plan de Ana P. cuenta con un apoyo real, no nominal; la reevaluación del 18-08 lo verifica.", responsible: "Red municipal (ejecuta) · trabajo social (integra al plan).", next: "Seguimiento en la reevaluación; al egreso, las gestiones abiertas se transfieren con acuse." } },
      { id: "rs-programar", label: "Programar con plazo realista y fundamento", kind: "exit", availability: "available",
        note: "La programación queda con plazo y fundamento; la solicitud no desaparece mientras tanto." }
    ]
  }
};
