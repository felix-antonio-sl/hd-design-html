/* ============================================================
   FICHAS CLÍNICAS ADAPTADAS — proyección por caso (server-authored).
   Tres lentes: Pulso (ahora), Plan (intención vigente con autoría
   por disciplina) y Pasado (línea de tiempo). Datos sintéticos.
   El plan médico de un postulado aún no existe: la ficha muestra
   el plan de origen vigente y lo declarado para el ingreso.
   ============================================================ */

const FICHAS = {

  "HOD-2026-0131": {
    personKey: "rosa", risk: "A4", riskText: "Conducta de resultado crítico en curso",
    journey: "J6",
    band: { territory: "Villa A · urbano", precision: "ubicación exacta", caregiver: "Hija, 52 años · carga media · teach-back verificado", contact: "Canal institucional · cuidador" },
    responsibility: { now: "Médico de atención directa (plan médico) · enfermería (cuidados)", next: "Control de potasio 13:50 con custodia · resultado esperado 15:30", coverage: "Regulador remoto 20:00–08:00 con fallback declarado (diseño, brecha V02)" },
    pulso: [
      ["Hoy", "Visita médica 10:30–11:30 · curación TENS 09:40 (completada) · sesión kinésica 11:30"],
      ["Vigilancia activa", "K+ 6,1 (07:52) → control 13:50 · derivar si ≥ 6,3 o síntomas"],
      ["Alerta activa", "Resultado crítico recibido 07:52 — conducta médica pendiente de registro"],
      ["Últimos signos", "TA 128/76 · FC 78 · SatO2 95% · sin síntomas nuevos (registro nocturno)"],
      ["Riesgo nocturno", "N2 — guion nocturno escrito y vía pre-acordada con la cuidadora"]
    ],
    plan: [
      { name: "Plan médico", author: "Medicina · C. Herrera", version: "Versión 5 · 16-08-2026", items: [
        "Objetivo: estabilizar función renal y completar antibiótico (día 4 de 7).",
        "Decisión sobre IECA pendiente de registro por el médico de atención directa.",
        "Monitoreo: potasio 13:50 hoy · criterio de derivación declarado.",
        "Reevaluación: con el resultado de las 15:30."
      ]},
      { name: "Plan de cuidados", author: "Enfermería · J. Núñez", version: "Versión 5 · 16-08-2026", items: [
        "Curación sacro día por medio, delegada a TENS con supervisión vigente.",
        "Vigilancia de signos en cada visita.",
        "Educación a cuidador: alarmas con teach-back verificado 16-08."
      ]},
      { name: "Plan de rehabilitación", author: "Kinesiología · F. Leal", version: "Versión 3 · 15-08-2026", items: [
        "Objetivo: marcha supervisada 10 m (línea base 4 m el 14-08).",
        "Restricción: fatiga respiratoria · suspender si SatO2 < 92%.",
        "Próxima sesión: hoy 11:30."
      ]},
      { name: "Plan social", author: "Trabajo social · V. Reyes", version: "Versión 1 · 15-08-2026", items: [
        "Cuidadora idónea · carga media · sin segundo cuidador declarado.",
        "Sin brecha actual · reevaluación al egreso."
      ]}
    ],
    pasado: [
      ["12-08-2026", "Postulación desde Medicina Interna con resumen completo"],
      ["13-08-2026", "Cinco evaluaciones convergentes completas"],
      ["14-08-2026", "Admisión aceptada · ingreso y línea base en domicilio"],
      ["16-08-2026", "Educación a cuidador con teach-back verificado"],
      ["17-08-2026 07:52", "Resultado crítico K+ 6,1 publicado · comunicación y conducta pendientes de registro"]
    ]
  },

  "HOD-2026-0138": {
    personKey: "jorge", risk: "A3", riskText: "Transferencia sin aceptar · ventana 11:00–13:00",
    journey: "J4",
    band: { territory: "En origen (Medicina Interna)", precision: "domicilio por verificar al ingreso", caregiver: "Esposa, 68 años · evaluación social completada", contact: "Canal institucional · origen" },
    responsibility: { now: "Medicina Interna (hasta la aceptación)", next: "Ventana de traslado 11:00–13:00 · recepción preparada", coverage: "Coordinación del período HODOM" },
    pulso: [
      ["Transferencia", "Handoff entregado 16-08 18:22 · aceptación HODOM pendiente"],
      ["Preparación", "Expediente documental completo · logística confirmada"],
      ["Condición al origen", "Estable · plan de origen vigente (ningún plan HODOM antes de la aceptación)"],
      ["Riesgo nocturno", "Por categorizar al ingreso"]
    ],
    plan: [
      { name: "Plan de origen vigente", author: "Medicina Interna HSC", version: "Resumen en handoff · 16-08-2026", items: [
        "Rige el plan del origen hasta que la transferencia sea aceptada.",
        "La primera valoración de enfermería abre el plan de cuidados HODOM.",
        "La valoración kinésica inicial queda condicionada a la aceptación."
      ]}
    ],
    pasado: [
      ["15-08-2026", "Postulación desde Medicina Interna"],
      ["16-08-2026", "Evaluaciones completas · admisión aceptada con ingreso programado"],
      ["16-08-2026 18:22", "Handoff de transferencia entregado · esperando aceptación"],
      ["17-08-2026 07:45", "Recepción declarada preparada por coordinación"]
    ]
  },

  "HOD-2026-0129": {
    personKey: "ana", risk: "A3", riskText: "Cuidador con sobrecarga declarada",
    journey: "J6",
    band: { territory: "Población B · periurbano", precision: "ubicación exacta", caregiver: "Hija, 54 años · sobrecarga declarada 16-08 21:35", contact: "Canal institucional · cuidadora" },
    responsibility: { now: "Médico tratante · trabajo social (plan social)", next: "Reevaluación social 18-08 o antes si hay quiebre", coverage: "Regulador remoto 20:00–08:00 (diseño, brecha V02)" },
    pulso: [
      ["Hoy", "Control de signos y muestra TENS 10:15 (completada) · muestra en custodia al laboratorio"],
      ["Alerta activa", "Sobrecarga del cuidador — suprimible solo con reevaluación social"],
      ["Entorno", "Posible entorno tenso declarado · regla de repliegue vigente para el equipo"],
      ["Riesgo nocturno", "N2-L — guion escrito y vía pre-acordada · carga de ruta declarada en la planificación"]
    ],
    plan: [
      { name: "Plan médico", author: "Medicina · C. Herrera", version: "Versión 2 · 14-08-2026", items: [
        "Vigilancia de signos por visita · muestra de hoy con resultado esperado.",
        "Sin cambios de tratamiento hasta reevaluación social."
      ]},
      { name: "Plan de cuidados", author: "Enfermería · J. Núñez", version: "Versión 2 · 14-08-2026", items: [
        "Control de signos y toma de muestra delegado a TENS con supervisión.",
        "Reporte inmediato de cualquier señal de quiebre del cuidado."
      ]},
      { name: "Plan social", author: "Trabajo social · V. Reyes", version: "Versión 2 · 17-08-2026", items: [
        "Sobrecarga moderada-alta · programa municipal de apoyo activado (acuse en 72 h).",
        "Relevo familiar parcial en articulación.",
        "Reevaluación 18-08 o antes si hay quiebre."
      ]}
    ],
    pasado: [
      ["05-08-2026", "Ingreso HODOM desde urgencia"],
      ["14-08-2026", "Plan vigente versión 2"],
      ["16-08-2026 21:35", "Cuidadora declara sobrecarga por canal institucional"],
      ["17-08-2026", "Evaluación social en terreno · red de apoyo activada"]
    ]
  },

  "HOD-2026-0117": {
    personKey: "luis", risk: "A2", riskText: "Cierre pendiente de acuse APS",
    journey: "J9",
    band: { territory: "Centro · urbano", precision: "ubicación exacta", caregiver: "Esposa, 73 años · educación reforzada al cierre", contact: "Canal institucional · pareja" },
    responsibility: { now: "Médico de atención directa (hasta acuse APS)", next: "Acuse de aceptación del CESFAM · fallback a las 24 h", coverage: "Regulador remoto hasta el cierre efectivo" },
    pulso: [
      ["Cierre", "Criterio de término cumplido 15-08 · epicrisis entregada · acuse APS pendiente"],
      ["Pendientes", "Conciliación entregada · educación reforzada · control en 72 h citado"],
      ["Hoy", "Sin visita programada · la responsabilidad sigue en HODOM hasta el acuse"],
      ["Riesgo nocturno", "N1 — cierre con seguimiento a las 72 h"]
    ],
    plan: [
      { name: "Plan de cierre", author: "Medicina · C. Herrera", version: "Versión 2 · 15-08-2026", items: [
        "Epicrisis emitida y handoff de continuidad entregado al CESFAM.",
        "Control a las 72 h citado y confirmado por el receptor.",
        "Fallback: si no hay acuse en 24 h, la recuperación se activa con el canal declarado."
      ]},
      { name: "Plan de cuidados al egreso", author: "Enfermería · J. Núñez", version: "Versión 2 · 15-08-2026", items: [
        "Educación de cuidador reforzada con teach-back final.",
        "Cierre de plan de cuidados con Barthel de egreso registrado."
      ]}
    ],
    pasado: [
      ["07-08-2026", "Ingreso HODOM desde Medicina Interna"],
      ["15-08-2026", "Decisión de término clínico declarada"],
      ["17-08-2026", "Epicrisis emitida · handoff de continuidad entregado · esperando acuse"]
    ]
  },

  "HOD-2026-0142": {
    personKey: "elena", risk: "A3", riskText: "Verificación clínica completa · decisión operacional pendiente (V01)",
    journey: "J3",
    band: { territory: "Sector Norte · periurbano", precision: "ubicación aproximada", caregiver: "Esposo, 79 años · autovalente · voluntad declarada", contact: "Hija · solo comunicación autorizada" },
    responsibility: { now: "Origen (hasta decisión y transferencia) · coordinación prepara de forma tentativa", next: "Adjudicación de la autoría de la decisión (brecha V01) · ingreso tentativo 18-08-2026 09:00", coverage: "Coordinación del período" },
    pulso: [
      ["Admisión", "Verificación clínica del médico regulador registrada 17-08 08:05: apta con vigilancia renal · decisión operacional pendiente de autoría (brecha V01)"],
      ["Preparación del domicilio", "Consistencias espesadas · postura 90° · supervisión en comidas (fono)"],
      ["Domicilio", "Apto con adecuación menor · acceso verificado por enfermería"],
      ["Riesgo nocturno", "Por categorizar al ingreso"]
    ],
    plan: [
      { name: "Preparación declarada", author: "Coordinación + equipo evaluador", version: "17-08-2026", items: [
        "El plan HODOM se abre con la primera evaluación médica al ingreso: ese plan nace con autoría del médico HODOM y reemplaza el de derivación y traspaso.",
        "Riesgo de aspiración comunicado: consistencias y postura al cuidador con teach-back.",
        "Ingreso tentativo 18-08 09:00, condicionado a la decisión operacional (brecha V01); la capacidad es un snapshot, no una promesa futura."
      ]}
    ],
    pasado: [
      ["15-08-2026", "Postulación desde Medicina Interna"],
      ["15-08 a 16-08", "Evaluaciones de domicilio, social y capacidad completadas"],
      ["17-08-2026 07:40", "Evaluación de deglución: riesgo de aspiración · plan de consistencias"],
      ["17-08-2026 08:05", "Verificación clínica de admisión registrada por el médico regulador · decisión operacional en validación de autoría (V01)"]
    ]
  }
};
