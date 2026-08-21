/* ============================================================
   HODOM-HSC OS — MAQUETA DE DISEÑO UI/UX (solo HTML, sin backend)
   Datos sintéticos. Ningún dato corresponde a una persona real.
   Vocabulario y contratos: SDD 3.2 (spec/experience.json,
   spec/visual-system.json, spec/actors.json) y mapa operacional
   de roles HODOM-HSC (hd-dt 04-operacional, corte 2026-07-22).
   ============================================================ */

const ENV_NOTICE = "Entorno de desarrollo — datos sintéticos";
const TENANT = "Hospital San Carlos · Unidad HODOM";
const CUTOFF = "17-08-2026 08:14";

/* ---------- E2E-08/S3 · ocurrencia de visita (fuente canónica) ----------
   La ocurrencia identifica el trabajo clínico-operacional de M1 sin
   convertir la salida o el GPS en prueba de atención. El estado mutable,
   el log y las transiciones viven en app.js; estos datos sólo describen el
   contrato que las proyecciones consumen. */
const E2E08_VISIT_OCCURRENCE = Object.freeze({
  id: "VIS-ROSA-M1-0900",
  caseId: "HOD-2026-0131",
  vehicleId: "m1",
  vehicle: "Móvil 1",
  vehicleLabel: "Móvil 1",
  roles: Object.freeze(["enfermero-clinico", "tecnico-enfermeria"]),
  roleLabel: "Enfermería + TENS",
  window: "09:00–10:00",
  scheduledDeparture: "08:45",
  nursingPlan: "v5",
  criticalInstructionRevision: "E2E08-ORD-1",
  packageImpact: "La instrucción crítica del episodio condiciona la preparación; no reemplaza el plan de cuidados.",
  manifestId: "M1",
  packageReviewAt: "08:35",
  manifestDecisionAt: "08:40"
});

const E2E08_S3_PACKAGE = Object.freeze({
  visitId: E2E08_VISIT_OCCURRENCE.id,
  caseId: E2E08_VISIT_OCCURRENCE.caseId,
  vehicleId: E2E08_VISIT_OCCURRENCE.vehicleId,
  vehicleLabel: E2E08_VISIT_OCCURRENCE.vehicleLabel,
  window: E2E08_VISIT_OCCURRENCE.window,
  scheduledDeparture: E2E08_VISIT_OCCURRENCE.scheduledDeparture,
  criticalInstructionRevision: E2E08_VISIT_OCCURRENCE.criticalInstructionRevision,
  nursingPlan: E2E08_VISIT_OCCURRENCE.nursingPlan,
  packageImpact: E2E08_VISIT_OCCURRENCE.packageImpact,
  reviewAt: E2E08_VISIT_OCCURRENCE.packageReviewAt,
  reviewCriterion: "Enfermería define la suficiencia del paquete; revisar no autoriza la salida vehicular."
});

/* Fallback declarativo del corte inicial: no siembra hechos futuros. app.js
   conserva el log append-only vivo y agrega review/decisión/partida sólo por acción. */
const E2E08_S3_TIMELINE = Object.freeze([
  Object.freeze({ id: "E2E08-ORD-1", at: "08:14", event: "criticalInstructionRevision E2E08-ORD-1 activa" })
]);

const E2E08_S3_MANIFEST = Object.freeze({
  id: E2E08_VISIT_OCCURRENCE.manifestId,
  vehicleId: E2E08_VISIT_OCCURRENCE.vehicleId,
  vehicleLabel: E2E08_VISIT_OCCURRENCE.vehicleLabel,
  visitId: E2E08_VISIT_OCCURRENCE.id,
  reviewAt: E2E08_VISIT_OCCURRENCE.packageReviewAt,
  decisionAt: E2E08_VISIT_OCCURRENCE.manifestDecisionAt,
  disposition: "mantener VIS programada; no autoriza salida vehicular total"
});

/* ---------- Personas sintéticas (alias no sensibles) ---------- */
const PEOPLE = {
  elena:  { alias: "Elena F.",  age: 78, tag: "postulada desde Medicina Interna" },
  jorge:  { alias: "Jorge M.",  age: 71, tag: "transferencia en curso al domicilio" },
  rosa:   { alias: "Rosa C.",   age: 69, tag: "episodio activo · día 4" },
  ana:    { alias: "Ana P.",    age: 82, tag: "episodio activo · cuidador con sobrecarga" },
  luis:   { alias: "Luis A.",   age: 75, tag: "cierre de episodio en preparación" },
  marta:  { alias: "Marta G.",  age: 69, tag: "postulación diferida · cuidado interino" },
  carlos: { alias: "Carlos V.", age: 74, tag: "postulación en evaluación" }
};

const CASES = {
  "HOD-2026-0142": { person: "elena",  stage: "Verificación clínica completa · decisión operacional pendiente (brecha V01)" },
  "HOD-2026-0138": { person: "jorge",  stage: "Aceptado · transferencia sin aceptar" },
  "HOD-2026-0131": { person: "rosa",   stage: "Episodio activo · día 4 de 10 estimados" },
  "HOD-2026-0129": { person: "ana",    stage: "Episodio activo · riesgo social" },
  "HOD-2026-0117": { person: "luis",   stage: "Cierre · continuidad APS pendiente de acuse" }
};
const CASES_EXT = {
  "HOD-2026-0136": { person: "marta",  stage: "Diferida por capacidad · reevaluación 18-08-2026" },
  "HOD-2026-0140": { person: "carlos", stage: "En evaluación · 3 de 5 evaluaciones completas" }
};

/* ---------- Obligaciones (WorkItems server-authored) ----------
   Campos según responsibility_column.required_obligation_fields:
   causa, caso, responsable, autoridad, próxima acción, efecto esperado,
   receptor, plazo/condición, estado, riesgo, fallback, revisión, procedencia. */
const WORK = {
  /* ===== R01 · DIRECCIÓN TÉCNICA ===== */
  "direccion-tecnica": [
    {
      id: "OBL-DT-01", scene: "mesa-riesgo",
      title: "Decidir riesgo residual de la cobertura de respuesta 20:00–08:00",
      context: "Programa HODOM · brecha declarada", risk: "A3",
      riskLabel: "Riesgo alto · plazo próximo",
      due: "Revisión vence 19-08-2026", receiver: "Comité de gestión institucional",
      revision: "rev. 4", provenance: "Evaluación de cobertura 15-08-2026"
    },
    {
      id: "OBL-DT-02", scene: "mesa-cartera",
      title: "Ratificar cartera de prestaciones versión 2.3 con impacto clínico declarado",
      context: "Cartera · habilitación operativa", risk: "A2",
      riskLabel: "Decisión requerida",
      due: "Entra en vigencia 01-09-2026", receiver: "Coordinación y equipo asistencial",
      revision: "rev. 2", provenance: "Propuesta técnica 10-08-2026"
    },
    {
      id: "OBL-DT-03", scene: "mesa-hallazgo",
      title: "Responder observación de fiscalización con evidencia de efecto",
      context: "Fiscalización · plazo legal", risk: "A2",
      riskLabel: "Plazo externo",
      due: "Plazo 21-08-2026", receiver: "SEREMI de Salud",
      revision: "rev. 1", provenance: "Acta de fiscalización 31-07-2026"
    },
    {
      id: "OBL-DT-04", scene: "kb-gobierno",
      title: "Publicar la nueva versión del protocolo de escalamiento con vigencia y dueño",
      context: "Base de conocimiento HODOM · protocolo revisado sin publicar", risk: "A2",
      riskLabel: "Conocimiento gobernado, no un Drive paralelo",
      due: "Antes de la respuesta a fiscalización (21-08-2026)", receiver: "Equipo asistencial y coordinación",
      revision: "rev. 3", provenance: "Revisión de escalamiento post-rescate 12-08-2026"
    },
    {
      id: "OBL-DT-05", scene: "nomina-dt",
      title: "Resolver una licencia TENS y la habilitación de terreno de la kinesióloga entrante",
      context: "Nómina única · 2 solicitudes con efecto en la capacidad de la semana", risk: "A2",
      riskLabel: "Capacidad de la semana por confirmar",
      due: "Antes de publicar el programa del 24-08-2026", receiver: "Coordinación (capacidad) · Gestión de Personas (registro)",
      revision: "rev. 1", provenance: "Solicitudes recibidas 15-08-2026"
    }
  ],

  /* ===== R02 · ENFERMERA COORDINADORA ===== */
  "enfermera-coordinadora": [
    {
      id: "OBL-CO-01", scene: "sala-mando",
      title: "Publicar el programa diario y proponer asignaciones del período",
      context: "Período 17-08-2026 · borrador con 9 visitas y 2 móviles", risk: "A2",
      riskLabel: "El período está abierto sin programa publicado",
      due: "Briefing 08:30", receiver: "Equipo asistencial del día",
      revision: "rev. 1", provenance: "Apertura de período 07:45"
    },
    {
      id: "OBL-CO-02", scene: "handoff-jorge",
      title: "Gestionar la aceptación de transferencia de Jorge M. desde Medicina Interna",
      context: "HOD-2026-0138 · handoff entregado sin aceptación", risk: "A3",
      riskLabel: "Responsabilidad aún en el origen",
      due: "Ventana de traslado 11:00–13:00", receiver: "Enfermera coordinadora (esta función)",
      revision: "rev. 3", provenance: "Handoff originado 16-08-2026 18:22"
    },
    {
      id: "OBL-CO-04", scene: "turnos-del-dia",
      title: "Cubrir el turno de TENS de la tarde: ausencia reportada 07:10",
      context: "Turnos del día · misma nómina que administra Dirección Técnica", risk: "A2",
      riskLabel: "3 prestaciones delegadas de la tarde sin ejecutor",
      due: "Antes de las 13:00", receiver: "Equipo asistencial del turno tarde",
      revision: "rev. 1", provenance: "Aviso de ausencia 17-08-2026 07:10"
    }
  ],

  /* ===== R03 · MÉDICO DE ATENCIÓN DIRECTA ===== */
  "medico-atencion-directa": [
    {
      id: "OBL-MD-01", scene: "alerta-potasio",
      title: "Interpretar resultado crítico y definir conducta para Rosa C.",
      context: "HOD-2026-0131 · potasio 6,1 mmol/L informado 07:52", risk: "A4",
      riskLabel: "Crítico inmediato",
      due: "Acción inmediata", receiver: "Médico de atención directa (usted)",
      revision: "rev. 6", provenance: "Laboratorio HSC · resultado verificado 07:50"
    },
    {
      id: "OBL-MD-02", scene: "atencion-rosa",
      title: "Visita programada a Rosa C. — reevaluación y ajuste de plan",
      context: "HOD-2026-0131 · ventana 10:30–11:30", risk: "A1",
      riskLabel: "Programada",
      due: "Hoy 10:30", receiver: "Registro clínico del episodio",
      revision: "rev. 5", provenance: "Programa diario del período"
    },
    {
      id: "OBL-MD-03", scene: "cierre-luis",
      title: "Emitir epicrisis y continuidad de Luis A. para cierre del episodio",
      context: "HOD-2026-0117 · criterio de término cumplido", risk: "A2",
      riskLabel: "Continuidad sin receptor confirmado",
      due: "Entrega a APS 18-08-2026", receiver: "CESFAM receptor · médico de continuidad",
      revision: "rev. 2", provenance: "Decisión de término clínico 15-08-2026"
    },
    {
      id: "OBL-MD-04", scene: "primera-evaluacion-jorge",
      title: "Primera evaluación médica de Jorge M. — el plan que firme reemplaza el de derivación",
      context: "HOD-2026-0138 · condicionada a la aceptación de la transferencia", risk: "A1",
      riskLabel: "Condicionada",
      due: "Dentro de las primeras 24 h del ingreso", receiver: "Registro clínico del episodio",
      revision: "rev. 1", provenance: "Programa diario del período"
    }
  ],

  /* ===== R04 · MÉDICO REGULADOR ===== */
  "medico-regulador": [
    {
      id: "OBL-MR-01", scene: "regulacion-elena",
      title: "Verificación clínica de admisión de Elena F. — la pertinencia clínica es su acto",
      context: "HOD-2026-0142 · evaluaciones convergentes completas, falta su verificación", risk: "A3",
      riskLabel: "Demanda visible · origen conserva responsabilidad",
      due: "Orden justo de la cola: primero", receiver: "Origen derivador y coordinación",
      revision: "rev. 7", provenance: "Solicitud completa verificada 16-08-2026"
    },
    {
      id: "OBL-MR-02", scene: "regulacion-turno",
      title: "Recibir el turno de regulación 20:00–08:00 con pendientes",
      context: "Cobertura de respuesta · diseño resuelto 29-06-2026, activación pendiente (brecha V02)", risk: "A1",
      riskLabel: "Programado · flujo diseñado",
      due: "Hoy 20:00", receiver: "Médico regulador entrante (usted)",
      revision: "rev. 1", provenance: "Contrato de cobertura agosto 2026"
    },
    {
      id: "OBL-MR-03", scene: "regulacion-nocturna",
      title: "Responder la llamada de una cuidadora con el resumen clínico del episodio",
      context: "Franja 20:00–08:00 · flujo diseñado, activación pendiente (brecha V02)", risk: "A3",
      riskLabel: "Escalamiento con umbral declarado",
      due: "Naranja sin respuesta en 15 min escala a rojo", receiver: "Médico regulador (usted)",
      revision: "rev. 1", provenance: "Guion nocturno del episodio · categoría N2-L"
    }
  ],

  /* ===== R05 · ENFERMERO CLÍNICO ===== */
  "enfermero-clinico": [
    {
      id: "OBL-EN-01", scene: "atencion-rosa",
      title: "Visita a Rosa C. — curación, administrar tratamiento y educar al cuidador",
      context: "HOD-2026-0131 · ventana 09:00–10:00 · plan de cuidados vigente", risk: "A2",
      riskLabel: "Resultado crítico informado al médico",
      due: "Hoy 09:00", receiver: "Registro clínico del episodio",
      revision: "rev. 5", provenance: "Programa diario del período"
    },
    {
      id: "OBL-EN-02", scene: "atencion-jorge",
      title: "Primera valoración integral de Jorge M. si la transferencia se acepta hoy",
      context: "HOD-2026-0138 · condicionada a aceptación", risk: "A1",
      riskLabel: "Condicionada",
      due: "Tras aceptación de transferencia", receiver: "Plan de cuidados del episodio",
      revision: "rev. 1", provenance: "Programa diario del período"
    },
    {
      id: "OBL-EN-03", scene: "turno-enfermeria",
      title: "Entregar el turno con riesgos y pendientes",
      context: "Turno día → turno noche", risk: "A1",
      riskLabel: "Programado",
      due: "Hoy 19:30", receiver: "Enfermería de turno noche",
      revision: "rev. 1", provenance: "Ciclo diario de coordinación"
    },
    {
      id: "VIS-ROSA-M1-0900", scene: "e2e08-s3-package",
      title: "Preparar la visita de Rosa C. en Móvil 1 y revisar el paquete",
      context: "HOD-2026-0131 · VIS-ROSA-M1-0900 · Enfermería + TENS · ventana 09:00–10:00",
      risk: "A1", riskLabel: "Revisión de suficiencia antes de la salida",
      due: "Revisión 08:35 · salida programada 08:45",
      receiver: "Enfermería define suficiencia · coordinación dispone el manifiesto",
      revision: "E2E08-ORD-1 · nursingPlan v5",
      provenance: "Programa diario del período · manifiesto M1",
      visitId: E2E08_VISIT_OCCURRENCE.id,
      caseId: E2E08_VISIT_OCCURRENCE.caseId,
      vehicleId: E2E08_VISIT_OCCURRENCE.vehicleId,
      vehicle: E2E08_VISIT_OCCURRENCE.vehicle,
      roles: E2E08_VISIT_OCCURRENCE.roles,
      window: E2E08_VISIT_OCCURRENCE.window,
      scheduledDeparture: E2E08_VISIT_OCCURRENCE.scheduledDeparture,
      nursingPlan: E2E08_VISIT_OCCURRENCE.nursingPlan,
      criticalInstructionRevision: E2E08_VISIT_OCCURRENCE.criticalInstructionRevision,
      packageImpact: E2E08_VISIT_OCCURRENCE.packageImpact
    }
  ],

  /* ===== R06 · KINESIÓLOGO ===== */
  "kinesiologo": [
    {
      id: "OBL-KN-01", scene: "atencion-rosa-kine",
      title: "Sesión kinésica de Rosa C. — objetivo: marcha supervisada 10 m",
      context: "HOD-2026-0131 · plan de rehabilitación vigente", risk: "A1",
      riskLabel: "Programada",
      due: "Hoy 11:30", receiver: "Registro del episodio · plan interdisciplinario",
      revision: "rev. 3", provenance: "Programa diario del período"
    },
    {
      id: "OBL-KN-02", scene: "atencion-jorge-kine",
      title: "Valoración kinésica inicial de Jorge M. tras aceptación",
      context: "HOD-2026-0138 · condicionada a aceptación", risk: "A1",
      riskLabel: "Condicionada",
      due: "Dentro de 24 h del ingreso", receiver: "Plan de rehabilitación",
      revision: "rev. 1", provenance: "Indicación médica del episodio"
    },
    {
      id: "OBL-KN-03", scene: "derivacion-rosa-kine",
      title: "Decidir la derivación recibida: reevaluar objetivo de marcha de Rosa C.",
      context: "HOD-2026-0131 · derivación interna pendiente de emisión por el médico tratante", risk: "A2",
      riskLabel: "Derivación esperando su decisión",
      due: "Hoy antes de la sesión 11:30", receiver: "Kinesiología (usted)",
      revision: "rev. 1", provenance: "Derivación interna del médico tratante"
    }
  ],

  /* ===== R07 · TENS ===== */
  "tecnico-enfermeria": [
    {
      id: "OBL-TS-01", scene: "atencion-rosa-tens",
      title: "Curación delegada de Rosa C. — indicación y supervisión vigentes",
      context: "HOD-2026-0131 · delegación de enfermería", risk: "A1",
      riskLabel: "Delegada con supervisor explícito",
      due: "Hoy 09:40", receiver: "Enfermera supervisora del caso",
      revision: "rev. 2", provenance: "Delegación registrada 15-08-2026"
    },
    {
      id: "OBL-TS-02", scene: "atencion-ana-tens",
      title: "Control de signos y toma de muestra de Ana P.",
      context: "HOD-2026-0129 · delegación vigente · muestra con custodia", risk: "A2",
      riskLabel: "Entorno con alerta social declarada",
      due: "Hoy 10:15", receiver: "Enfermera supervisora · laboratorio",
      revision: "rev. 1", provenance: "Delegación registrada 16-08-2026"
    },
    {
      id: "OBL-TS-03", scene: "cierre-admin-tens",
      title: "Declarar el tiempo administrativo de la semana, separado de sus actos clínicos",
      context: "Doble función · brecha V08 declarada", risk: "A2",
      riskLabel: "Carga sin medir resta capacidad clínica",
      due: "Cierre de semana · hoy 17:00", receiver: "Coordinación · Dirección Técnica (dimensionar)",
      revision: "rev. 1", provenance: "Ciclo semanal de la unidad"
    }
  ],

  /* ===== R09 · FONOAUDIÓLOGO ===== */
  "fonoaudiologo": [
    {
      id: "OBL-FN-01", scene: "atencion-elena-fono",
      title: "Evaluación de deglución de Elena F. — riesgo de aspiración postulado",
      context: "HOD-2026-0142 · indicación dentro de cartera vigente", risk: "A2",
      riskLabel: "Condiciona preparación del domicilio",
      due: "Antes de la decisión de admisión si es posible", receiver: "Decisor de admisión · equipo",
      revision: "rev. 1", provenance: "Indicación médica 16-08-2026"
    }
  ],

  /* ===== R13 · ADMINISTRADOR DE SEGURIDAD ===== */
  "administrador-seguridad": [
    {
      id: "OBL-SEC-01", scene: "sistema-provision",
      title: "Provisionar identidad de la kinesióloga entrante con función y vigencia",
      context: "Acto institucional de designación recibido · sin autoridad clínica por el solo alta", risk: "A1",
      riskLabel: "Trámite con acto de origen",
      due: "Ingreso 24-08-2026", receiver: "Dirección Técnica (ratifica habilitación)",
      revision: "rev. 1", provenance: "Resolución de contratación 14-08-2026"
    },
    {
      id: "OBL-SEC-02", scene: "sistema-breakglass",
      title: "Revisar el acceso de emergencia usado el 15-08-2026 y cerrar el ciclo",
      context: "Break-glass con motivo y vigencia · revisión pendiente", risk: "A2",
      riskLabel: "Revisión obligatoria dentro de plazo",
      due: "Revisión 18-08-2026", receiver: "Administrador de seguridad (usted) · auditoría",
      revision: "rev. 1", provenance: "Bitácora de acceso de emergencia"
    },
    {
      id: "OBL-SEC-03", scene: "sistema-revocacion",
      title: "Revocar acceso del TENS trasladado a otro servicio",
      context: "Fin de función declarado por Gestión de Personas", risk: "A2",
      riskLabel: "Cuenta activa sin función vigente",
      due: "Efecto inmediato al confirmar", receiver: "Gestión de Personas",
      revision: "rev. 1", provenance: "Oficio de traslado 16-08-2026"
    },
    {
      id: "OBL-SEC-04", scene: "sistema-anomalia",
      title: "Investigar dos sesiones simultáneas de una misma cuenta clínica",
      context: "Detección de acceso anómalo · posible cuenta compartida", risk: "A2",
      riskLabel: "Cuenta compartida debilita la autoría",
      due: "Hoy", receiver: "Titular de la cuenta · Dirección Técnica si se confirma",
      revision: "rev. 1", provenance: "Bitácora de acceso · regla de detección"
    }
  ],

  /* ===== R11 · CONDUCTOR ===== */
  "conductor": [
    {
      id: "OBL-DR-01", scene: "ruta-dia",
      title: "Ejecutar ruta Móvil 1 — 4 destinos con ventanas y carga declarada",
      context: "Período 17-08-2026 · salida observada 08:45 · M1", risk: "A1",
      riskLabel: "Programada",
      due: "Salida 08:45", receiver: "Coordinación del período",
      revision: "rev. 1", provenance: "Programa diario publicado"
    },
    {
      id: "OBL-DR-02", scene: "ruta-custodia",
      title: "Entregar muestras del retiro de ayer con cadena de custodia",
      context: "Custodia de muestras · refrigeradas", risk: "A2",
      riskLabel: "Ventana de custodia limitada",
      due: "Antes de 12:00", receiver: "Laboratorio HSC · recepción con acuse",
      revision: "rev. 1", provenance: "Registro de retiro 16-08-2026"
    },
    {
      id: "OBL-DR-03", scene: "geo-jorge",
      title: "Geolocalizar el domicilio de Jorge M. antes del ingreso de mañana",
      context: "HOD-2026-0138 · primera determinación de ubicación con custodia declarada", risk: "A2",
      riskLabel: "Ingreso de mañana 09:00 sin ubicación verificada",
      due: "Hoy, antes de publicar el programa de mañana", receiver: "Coordinación (programa)",
      revision: "rev. 1", provenance: "Aceptación de admisión · domicilio por verificar"
    },
    {
      id: "OBL-DR-04", scene: "ruta-incidente",
      title: "Reportar acceso inseguro en Población B y proponer nuevo orden de paradas",
      context: "Parada 2 del Móvil 1 · usted propone, coordinación decide con criterio clínico", risk: "A2",
      riskLabel: "Visita reprogramada con causa declarada",
      due: "Antes de la ventana 10:15–10:45", receiver: "Coordinación (decide el cambio)",
      revision: "rev. 1", provenance: "Evaluación de entorno en terreno 08:55"
    }
  ],

  /* ===== R12 · ADMINISTRATIVO ===== */
  "administrativo": [
    {
      id: "OBL-AD-01", scene: "admin-registro",
      title: "Registrar postulación recibida por teléfono y derivar al responsable",
      context: "Llamada 08:02 · datos mínimos por completar", risk: "A2",
      riskLabel: "Demanda sin identificador completo",
      due: "Hoy antes de 12:00", receiver: "Coordinación (evaluación de ingreso)",
      revision: "rev. 1", provenance: "Bitácora de llamadas"
    },
    {
      id: "OBL-AD-02", scene: "admin-documentos",
      title: "Completar expediente documental de Jorge M. — consentimiento digitalizado",
      context: "HOD-2026-0138 · documento recibido en papel", risk: "A1",
      riskLabel: "Pendiente visible",
      due: "Antes de la transferencia", receiver: "Expediente del caso",
      revision: "rev. 2", provenance: "Recepción de documentos 16-08-2026"
    },
    {
      id: "OBL-AD-03", scene: "cola-impresion",
      title: "Imprimir y archivar la epicrisis de Luis A. con constancia de entrega",
      context: "HOD-2026-0117 · lo que va a la ficha impresa no queda solo digital", risk: "A1",
      riskLabel: "Pendiente de archivo físico",
      due: "Con el cierre del episodio", receiver: "Ficha clínica única del hospital",
      revision: "rev. 1", provenance: "Epicrisis emitida 17-08-2026"
    },
    {
      id: "OBL-AD-04", scene: "registro-funcionarios",
      title: "Completar el registro de inducción del refuerzo de kinesiología",
      context: "Nómina de funcionarios · separada de la ficha clínica", risk: "A1",
      riskLabel: "Registro sin completar",
      due: "Antes del ingreso 24-08-2026", receiver: "Dirección Técnica (habilitación)",
      revision: "rev. 1", provenance: "Contrato de refuerzo 14-08-2026"
    }
  ],

  /* ===== R18 · MÉDICO TRATANTE DERIVADOR (EXTERNO) ===== */
  "medico-derivador": [
    {
      id: "OBL-EX-01", scene: "interim-marta",
      title: "Declarar el cuidado interino de Marta G. mientras su postulación está diferida",
      context: "HOD-2026-0136 · diferida por capacidad el 16-08-2026", risk: "A2",
      riskLabel: "Diferida · usted conserva la responsabilidad",
      due: "Reevaluación 18-08-2026", receiver: "Coordinación HODOM (reevaluación)",
      revision: "rev. 1", provenance: "Decisión de diferimiento con cuidado interino 16-08-2026"
    },
    {
      id: "OBL-EX-02", scene: "postulacion-carlos",
      title: "Completar la conciliación de medicamentos de la postulación de Carlos V.",
      context: "HOD-2026-0140 · en evaluación · dato mínimo faltante", risk: "A2",
      riskLabel: "Evaluación en curso · falta un dato de origen",
      due: "Antes de la decisión de admisión", receiver: "Médico regulador HODOM",
      revision: "rev. 2", provenance: "Solicitud de completitud 17-08-2026 07:58"
    }
  ],

  /* ===== R10 · OTRO PROFESIONAL (default-deny hasta cartera) ===== */
  "otro-profesional": [
    {
      id: "OBL-OP-01", scene: "habilitacion-otro",
      title: "Solicitud de actuación de terapia ocupacional en el episodio de Rosa C.",
      context: "HOD-2026-0131 · disciplina sin cartera ratificada", risk: "A2",
      riskLabel: "Sin habilitación vigente",
      due: "Sin actuación hasta habilitación", receiver: "Dirección Técnica (cartera) · Gestión de Personas (competencia) · Seguridad (cuenta)",
      revision: "rev. 1", provenance: "Solicitud del médico tratante 16-08-2026"
    }
  ],

  /* ===== R15 · PACIENTE / USUARIO ===== */
  "paciente": [
    {
      id: "OBL-PA-01", scene: "paciente-hoy",
      title: "Su atención de hoy: quién viene, quién responde y qué hacer si algo cambia",
      context: "Día 4 de su hospitalización en casa", risk: "A1",
      riskLabel: "Información para su día",
      due: "Hoy", receiver: "Su médico y enfermería del caso",
      revision: "rev. 1", provenance: "Plan vigente del episodio"
    },
    {
      id: "OBL-PA-02", scene: "consentimiento-procedimiento",
      title: "Decidir sobre la curación con apósito especial propuesta para mañana",
      context: "Una decisión solo suya: con tiempo, con respuestas y sin perder nada si se niega", risk: "A2",
      riskLabel: "Decisión informada pendiente",
      due: "Antes de la visita de mañana, 10:30", receiver: "Enfermería del caso",
      revision: "rev. 1", provenance: "Propuesta de enfermería 17-08-2026"
    },
    {
      id: "OBL-PA-03", scene: "alerta-paciente",
      title: "Avisar un cambio y saber que alguien recibió su aviso",
      context: "Su aviso llega a una persona y tiene acuse: no queda sola entre visitas", risk: "A1",
      riskLabel: "Disponible cuando lo necesite",
      due: "Cuando algo cambie", receiver: "Coordinación (de día) · 131 (de noche, según su tarjeta)",
      revision: "rev. 1", provenance: "Carta de derechos entregada al ingreso"
    }
  ],

  /* ===== R16 · CUIDADOR RESPONSABLE ===== */
  "cuidador": [
    {
      id: "OBL-CU-01", scene: "tarjeta-alarma",
      title: "Su tarjeta de alarma: qué mirar y a quién llamar, de día y de noche",
      context: "La regla de alarma de Ana P., simple y realista", risk: "A1",
      riskLabel: "Téngala a la vista",
      due: "Cuando la necesite", receiver: "Usted observa y avisa · el equipo decide",
      revision: "rev. 2", provenance: "Entregada con teach-back 16-08-2026"
    },
    {
      id: "OBL-CU-02", scene: "reporte-cuidador",
      title: "Reportar un cambio en Ana P. y recibir acuse con orientación",
      context: "Su reporte no se pierde: queda con hora, receptor y seguimiento", risk: "A1",
      riskLabel: "Disponible cuando lo necesite",
      due: "Cuando note un cambio", receiver: "Enfermería del caso (de día) · 131 (de noche, según la tarjeta)",
      revision: "rev. 1", provenance: "Circuito de aviso del episodio"
    },
    {
      id: "OBL-CU-03", scene: "sobrecarga-cuidador",
      title: "Declarar sobrecarga o decir «no puedo más», sin culpa",
      context: "Su declaración obliga a reevaluar el plan, no a culparla", risk: "A2",
      riskLabel: "Usted ya declaró sobrecarga el 16-08 · en seguimiento",
      due: "Cuando usted lo decida", receiver: "Coordinación · función social SIN TITULAR",
      revision: "rev. 1", provenance: "Su declaración del 16-08-2026 21:35"
    }
  ],

  /* ===== R14 · SEREMI / AUTORIDAD SANITARIA ===== */
  "seremi": [
    {
      id: "OBL-SE-01", scene: "fiscalizacion-autorizacion",
      title: "Resolver la autorización sanitaria de la unidad con evidencia de operación real",
      context: "Expediente de autorización · vigencia 3 años con prórroga", risk: "A2",
      riskLabel: "Distingo diseño de operación",
      due: "Resolución dentro del plazo legal", receiver: "Dirección hospitalaria · Dirección Técnica",
      revision: "rev. 1", provenance: "Expediente de autorización sanitaria"
    },
    {
      id: "OBL-SE-02", scene: "fiscalizacion-observacion",
      title: "Emitir observación de fiscalización con plazo y condición inequívocos",
      context: "Visita fiscalizadora · hallazgo con respaldo", risk: "A2",
      riskLabel: "Observación con verificación de cierre",
      due: "Plazo al cumplimiento 21-08-2026", receiver: "Dirección Técnica (respuesta con evidencia)",
      revision: "rev. 1", provenance: "Acta de fiscalización 31-07-2026"
    }
  ],

  /* ===== R17 · REPRESENTANTE LEGAL / FAMILIA ===== */
  "representante-legal": [
    {
      id: "OBL-RL-01", scene: "representante-alcance",
      title: "Verificar su calidad y alcance antes de decidir por la persona",
      context: "Representante ≠ cuidador ≠ contacto · la verificación es previa", risk: "A2",
      riskLabel: "Alcance por verificar, no presumir",
      due: "Antes de cualquier decisión en nombre de la persona", receiver: "Equipo HODOM · registro del episodio",
      revision: "rev. 1", provenance: "Verificación de representación 16-08-2026"
    }
  ],

  /* ===== R19 · ENFERMERÍA/TENS DEL SERVICIO DE ORIGEN ===== */
  "enfermeria-origen": [
    {
      id: "OBL-EO-01", scene: "origen-handoff",
      title: "Entregar handoff completo de Jorge M.: línea base, últimas dosis y pendientes",
      context: "HOD-2026-0138 · la entrega completa evita repetir y omitir", risk: "A2",
      riskLabel: "Transferencia sin completar",
      due: "Antes de liberar al paciente (ventana 11:00–13:00)", receiver: "Receptor HODOM identificado",
      revision: "rev. 1", provenance: "Episodio en origen · Medicina Interna"
    }
  ],

  /* ===== R20 · GESTIÓN DE CAMAS / UGDP ===== */
  "gestion-camas": [
    {
      id: "OBL-GC-01", scene: "camas-cola",
      title: "Proponer candidatos sin prometer cupo: la pertinencia no la decide la presión de camas",
      context: "Cola compartida · cupo nominal NO es cama disponible", risk: "A2",
      riskLabel: "Propuesta sin promesa",
      due: "Orden justo de la cola", receiver: "Coordinación HODOM · decisor clínico",
      revision: "rev. 1", provenance: "Cola de candidatos del día"
    }
  ],

  /* ===== R21 · EQUIPO RECEPTOR UEA ===== */
  "receptor-uea": [
    {
      id: "OBL-UEA-01", scene: "uea-prealerta",
      title: "Acusar la prealerta del rescate antes de que el paciente llegue",
      context: "Prealerta con identidad, situación y tratamientos · acuse obligatorio", risk: "A3",
      riskLabel: "Recepción sin acuse no está confirmada",
      due: "Acuse dentro del umbral de la prealerta", receiver: "Médico regulador HODOM (hasta el acuse)",
      revision: "rev. 1", provenance: "Circuito de rescate HODOM–UEA"
    }
  ],

  /* ===== R22 · SAMU / TRANSPORTE SANITARIO ===== */
  "samu": [
    {
      id: "OBL-SA-01", scene: "samu-despacho",
      title: "Despachar el traslado con ubicación, situación y receptor acordados",
      context: "No resolver la arquitectura institucional durante el despacho", risk: "A2",
      riskLabel: "Despacho con receptor declarado",
      due: "Antes de movilizar el recurso", receiver: "Receptor UEA previsto · regulador",
      revision: "rev. 1", provenance: "Solicitud de traslado regulada"
    }
  ],

  /* ===== R23 · APS / CESFAM ===== */
  "aps-cesfam": [
    {
      id: "OBL-APS-01", scene: "aps-contrarreferencia",
      title: "Aceptar, observar o devolver la contrarreferencia de Luis A. — la epicrisis enviada no es recepción",
      context: "HOD-2026-0117 · continuidad sin receptor confirmado", risk: "A2",
      riskLabel: "Recepción por confirmar con acuse",
      due: "Acuse dentro de 24 h", receiver: "Médico HODOM (hasta el acuse)",
      revision: "rev. 2", provenance: "Epicrisis emitida 17-08-2026 · sin acuse"
    }
  ],

  /* ===== R24 · FARMACIA ===== */
  "farmacia": [
    {
      id: "OBL-FA-01", scene: "farmacia-dispensacion",
      title: "Dispensar a tiempo para las ventanas terapéuticas — el cuidador no busca el medicamento crítico",
      context: "Ciclo del medicamento · conciliación y frontera al alta", risk: "A2",
      riskLabel: "Ventana terapéutica con plazo",
      due: "Antes de la ventana de administración", receiver: "Equipo HODOM · cuidador (entrega)",
      revision: "rev. 1", provenance: "Prescripción válida del episodio"
    }
  ],

  /* ===== R25 · LABORATORIO ===== */
  "laboratorio": [
    {
      id: "OBL-LAB-01", scene: "laboratorio-critico",
      title: "Comunicar el resultado crítico a un receptor clínico con acuse y read-back",
      context: "Resultado crítico sin receptor clínico es un dato que no produce acción", risk: "A4",
      riskLabel: "Crítico sin receptor",
      due: "Read-back inmediato al informar", receiver: "Médico de atención directa (conducta)",
      revision: "rev. 1", provenance: "Procesamiento de muestra verificado"
    }
  ],

  /* ===== R26 · IMAGENOLOGÍA ===== */
  "imagenologia": [
    {
      id: "OBL-IMG-01", scene: "imagenologia-circuito",
      title: "Resolver el apoyo diagnóstico sin desanclar el episodio innecesariamente",
      context: "Circuito de citación y retorno · no enviar a urgencia por defecto", risk: "A2",
      riskLabel: "Diagnóstico programable, no urgencia",
      due: "Citación según prioridad declarada", receiver: "Médico HODOM (integra el informe)",
      revision: "rev. 1", provenance: "Solicitud con pregunta clínica"
    }
  ],

  /* ===== R27 · ESPECIALISTA / TELEMEDICINA ===== */
  "especialista": [
    {
      id: "OBL-ESP-01", scene: "especialista-interconsulta",
      title: "Dejar recomendación con certeza y seguimiento — una videollamada no cierra la interconsulta",
      context: "Interconsulta con pregunta clínica y urgencia definidas", risk: "A2",
      riskLabel: "Recomendación por integrar",
      due: "El equipo tratante integra o justifica", receiver: "Médico HODOM (única conducción del plan)",
      revision: "rev. 1", provenance: "Interconsulta con antecedentes completos"
    }
  ],

  /* ===== R28 · IAAS ===== */
  "iaas": [
    {
      id: "OBL-IA-01", scene: "iaas-vigilancia",
      title: "Adaptar la vigilancia y prevención al domicilio — el protocolo de hospital no se copia a una casa",
      context: "Vigilancia de dispositivos y sospechas con denominadores pertinentes", risk: "A2",
      riskLabel: "Precauciones adaptadas al hogar",
      due: "Según circuito de notificación", receiver: "Equipo HODOM · Dirección Técnica",
      revision: "rev. 1", provenance: "Programa IAAS adaptado a domicilio"
    }
  ],

  /* ===== R29 · CALIDAD / DCSP / OIRS ===== */
  "calidad": [
    {
      id: "OBL-CA-01", scene: "calidad-evento",
      title: "Analizar el evento y exigir cierre con efecto — un formulario completado no es aprendizaje",
      context: "Evento notificado · triage, análisis y acción con dueño y fecha", risk: "A2",
      riskLabel: "Cierre por verificar, no por formulario",
      due: "Análisis con voz del usuario · verificación del efecto", receiver: "Equipo HODOM · jefatura",
      revision: "rev. 1", provenance: "Notificación de evento del episodio"
    }
  ],

  /* ===== R30 · DIRECCIÓN HOSPITALARIA ===== */
  "direccion-hospital": [
    {
      id: "OBL-DH-01", scene: "direccion-riesgo",
      title: "Recibir el riesgo no mitigable por la unidad y decidir: aceptar, reducir, transferir o suspender",
      context: "Gobernanza explícita · financiar la capacidad que hace segura la producción", risk: "A3",
      riskLabel: "Riesgo por decidir con evidencia",
      due: "Decisión con plazo y consecuencia", receiver: "Dirección hospitalaria (decide) · DT (declara)",
      revision: "rev. 1", provenance: "Escalamiento de riesgo residual 15-08-2026"
    }
  ],

  /* ===== R31 · GESTIÓN DE PERSONAS ===== */
  "gestion-personas": [
    {
      id: "OBL-GP-01", scene: "personas-habilitacion",
      title: "Verificar título, registro e inducción HODOM antes de asignar terreno",
      context: "Un certificado vigente no sustituye competencia observada en domicilio", risk: "A2",
      riskLabel: "Habilitación por verificar",
      due: "Antes de asignar terreno (24-08-2026)", receiver: "Dirección Técnica (ratifica habilitación)",
      revision: "rev. 1", provenance: "Ingreso de refuerzo de kinesiología"
    }
  ],

  /* ===== R32 · ABASTECIMIENTO / REAS ===== */
  "logistica-reas": [
    {
      id: "OBL-LR-01", scene: "reas-equipo",
      title: "Declarar el equipo NO disponible antes de aceptar — en inventario sin calibración no está disponible",
      context: "Disponibilidad real: mantención, calibración y consumible", risk: "A2",
      riskLabel: "No prometer prestación materialmente imposible",
      due: "Antes de la planificación de mañana", receiver: "Dirección Técnica · coordinación",
      revision: "rev. 1", provenance: "Inventario y mantención del período"
    }
  ],

  /* ===== R33 · TI / GOBIERNO DE DATOS ===== */
  "ti-datos": [
    {
      id: "OBL-TI-01", scene: "ti-controles",
      title: "Chequear los controles de ciberseguridad MINSAL como controles verificables, no checklist",
      context: "Identidad, bitácora, retención, contingencia, no-ficha-paralela", risk: "A2",
      riskLabel: "Control con evidencia, no decorativo",
      due: "Verificación continua", receiver: "Dirección Técnica · auditoría",
      revision: "rev. 1", provenance: "Controles de cumplimiento MINSAL"
    }
  ],

  /* ===== R34 · RED SOCIAL-TERRITORIAL ===== */
  "red-social": [
    {
      id: "OBL-RS-01", scene: "red-activacion",
      title: "Activar el apoyo con disponibilidad confirmada — una red nominal sin confirmar no existe",
      context: "Solicitud con necesidad, consentimiento, urgencia y responsable", risk: "A2",
      riskLabel: "Apoyo por confirmar con responsable",
      due: "PENDIENTE / NO DETERMINADO", receiver: "Red social-territorial · integración social SIN TITULAR",
      revision: "rev. 1", provenance: "Solicitud de activación de red 16-08-2026"
    }
  ]
};

/* ---------- Catálogo de roles (selector de la maqueta) ---------- */
const ROLES = [
  { id: "direccion-tecnica",     label: "Dirección Técnica",        person: "Daniela Roa V.",   fn: "Dirección Técnica",            scope: "Gobierno del servicio",           extraNav: { id: "mesa", label: "Mesa de Dirección" }, extraNav2: { id: "censo-mapa", label: "Mapa de pacientes" }, extraNav3: { id: "brechas", label: "Recorridos y brechas" } },
  { id: "enfermera-coordinadora",label: "Enfermera coordinadora",   person: "María Soto P.",    fn: "Coordinación clínico-operacional", scope: "Período, demanda y continuidad", extraNav: { id: "sala", label: "Sala de Mando" }, extraNav2: { id: "censo-mapa", label: "Mapa de pacientes" }, extraNav3: { id: "rutas-mapa", label: "Manifiesto M1 · Recorridos y móviles" } },
  { id: "medico-atencion-directa",label:"Médico de atención directa",person: "Camilo Herrera M.",fn: "Medicina · atención directa",   scope: "Casos asignados vigentes", extraNav: { id: "mi-dia", label: "Mi día" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "medico-regulador",      label: "Médico regulador",         person: "Paula Contreras L.",fn: "Regulación · decisión de admisión", scope: "Cola de admisión y escalamiento", extraNav: { id: "brechas", label: "Recorridos" } },
  { id: "enfermero-clinico",     label: "Enfermero clínico",        person: "Javier Núñez A.",  fn: "Enfermería clínica",            scope: "Plan de cuidados asignado", extraNav: { id: "mi-dia", label: "Mi día" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "kinesiologo",           label: "Kinesiólogo",              person: "Francisca Leal R.",fn: "Rehabilitación · kinesiología", scope: "Objetivos funcionales asignados", extraNav: { id: "mi-dia", label: "Mi día" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "tecnico-enfermeria",    label: "TENS",                     person: "Ricardo Pavez S.", fn: "TENS · ejecución delegada",     scope: "Tareas delegadas con supervisor", extraNav: { id: "mi-dia", label: "Mi día" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "fonoaudiologo",         label: "Fonoaudiólogo",            person: "Sofía Miranda B.", fn: "Fonoaudiología",                scope: "Cartera fonoaudiológica", extraNav: { id: "mi-dia", label: "Mi día" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "administrador-seguridad",label:"Administrador de seguridad",person:"Andrés Fuentes G.",fn: "Seguridad de la información",   scope: "Identidades y evidencia · sin acceso clínico", extraNav: { id: "sistema", label: "Sistema" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "conductor",             label: "Conductor",                person: "Héctor Vargas M.", fn: "Conducción y custodia logística",scope: "Rutas y custodias asignadas · sin datos clínicos", extraNav: { id: "ruta", label: "Ruta del día" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "administrativo",        label: "Administrativo",           person: "Claudia Espinoza T.",fn:"Gestión administrativa",        scope: "Registro, documentos y agenda · sin autoría clínica", extraNav: { id: "admin", label: "Cola documental" }, extraNav2: { id: "brechas", label: "Recorridos" } },
  { id: "medico-derivador",      label: "Médico derivador (externo)", person: "Dr. Tomás Ruiz B.", fn: "Médico APS · CESFAM Centro",    scope: "Sus postulaciones · sin acceso al censo interno", extraNav: { id: "postular", label: "Nueva postulación" } },
  { id: "otro-profesional",      label: "Otro profesional (sin habilitar)", person: "Por asignar según disciplina", fn: "Disciplina según cartera (ej. terapia ocupacional)", scope: "Sin habilitación vigente · no ve fichas ni registra actos" },
  { id: "paciente",              label: "Paciente / usuario",          person: "Rosa C. · 69 años", fn: "Titular del episodio HOD-2026-0131", scope: "Su propia atención · con derechos, preferencias y autonomía" },
  { id: "cuidador",              label: "Cuidador responsable",        person: "María José T.",   fn: "Cuidadora de Ana P. · HOD-2026-0129", scope: "Apoyo voluntario y limitado · sin responsabilidad clínica" },

  /* ===== PARTE III — Interfaces externas (no son dotación HODOM) ===== */
  { id: "seremi",                label: "SEREMI / autoridad sanitaria", person: "Fiscalizadora S.", fn: "Autoridad sanitaria · gobernanza externa", scope: "Fiscaliza y resuelve · no es parte del equipo clínico" },
  { id: "representante-legal",   label: "Representante legal / familia", person: "Familiar de Jorge M.", fn: "Representación y apoyo", scope: "Alcance verificado · no desplaza ni vigila al cuidador" },
  { id: "enfermeria-origen",     label: "Enfermería/TENS origen",      person: "Enf. Medicina Interna", fn: "Servicio de origen de la transferencia", scope: "Entrega handoff completo · contactable para discrepancias" },
  { id: "gestion-camas",         label: "Gestión de Camas / UGDP",     person: "Gestión de Camas", fn: "Articulación demanda-cupo-traslados", scope: "Cola compartida · no decide pertinencia clínica" },
  { id: "receptor-uea",          label: "Equipo receptor UEA",         person: "UEA · Hospital San Carlos", fn: "Recepción de rescates", scope: "Acusa prealerta y recibe al paciente" },
  { id: "samu",                  label: "SAMU / transporte sanitario", person: "SAMU Ñuble",      fn: "Respuesta y traslado sanitario", scope: "Despacha con ubicación, situación y receptor acordados" },
  { id: "aps-cesfam",            label: "APS / CESFAM",                person: "CESFAM Centro",    fn: "Continuidad post-HODOM", scope: "Recibe con acuse · epicrisis enviada no es recepción" },
  { id: "farmacia",              label: "Farmacia",                    person: "Farmacia HSC",     fn: "Ciclo del medicamento", scope: "Dispensación a tiempo · cuidador no busca el crítico" },
  { id: "laboratorio",           label: "Laboratorio",                 person: "Laboratorio HSC",  fn: "Procesamiento de muestras", scope: "Resultado crítico con receptor clínico y read-back" },
  { id: "imagenologia",          label: "Imagenología",                person: "Imagenología HSC", fn: "Apoyo diagnóstico", scope: "Resuelve sin desanclar el episodio innecesariamente" },
  { id: "especialista",          label: "Especialista / telemedicina", person: "CAE · especialista", fn: "Decisión especializada", scope: "Recomendación que el equipo tratante integra" },
  { id: "iaas",                  label: "IAAS",                        person: "Programa IAAS HSC", fn: "Infecciones asociadas a la atención", scope: "Vigilancia y prevención adaptadas al domicilio" },
  { id: "calidad",               label: "Calidad / DCSP / OIRS",       person: "Calidad HSC",      fn: "Gestión de calidad y eventos", scope: "Analiza y exige cierre con efecto · no solo formulario" },
  { id: "direccion-hospital",    label: "Dirección hospitalaria",      person: "Dirección HSC",    fn: "Gobernanza y financiamiento de interfaces", scope: "Recibe riesgos no mitigables y decide" },
  { id: "gestion-personas",      label: "Gestión de Personas",         person: "Gestión de Personas HSC", fn: "Habilitación e inducción", scope: "Verifica título, registro e inducción antes del terreno" },
  { id: "logistica-reas",        label: "Abastecimiento / REAS",       person: "Logística HSC",    fn: "Medios materiales y REAS", scope: "Declara disponibilidad real · equipo sin calibrar no está" },
  { id: "ti-datos",              label: "TI / gobierno de datos",      person: "TI HSC",           fn: "Interoperabilidad y gobierno de datos", scope: "Controles verificables · no automatiza ambigüedad" },
  { id: "red-social",            label: "Red social-territorial",      person: "Red municipal",    fn: "Apoyos municipales y comunitarios", scope: "Activa con disponibilidad confirmada · no nominal" }
];

/* ---------- Historia de episodios cerrados (consulta rápida) ----------
   Solo lectura: cierre, continuidad, resumen y línea de tiempo. */
const HISTORY = [
  { caseId: "HOD-2026-0108", alias: "María T.", age: 77, sector: "Centro · urbano",
    closed: "Egresada 14-08-2026 · alta por criterio de término cumplido",
    continuity: "CESFAM Centro · médico de continuidad con acuse 14-08-2026",
    summary: "Episodio de 12 días post neumonía · epicrisis integral firmada · llamada de seguimiento a las 72 h sin novedad",
    reingresos: "0 a 30 días del egreso",
    pasado: [
      ["02-08-2026", "Ingreso desde Medicina Interna con handoff completo"],
      ["07-08-2026", "Control de laboratorio sin alarma · plan ajustado en versión 3"],
      ["11-08-2026", "Criterio de término clínico declarado por el médico tratante"],
      ["14-08-2026", "Egreso con epicrisis integral y acuse de continuidad APS"]
    ] },
  { caseId: "HOD-2026-0091", alias: "José M.", age: 81, sector: "Población B · periurbano",
    closed: "Egresado 03-08-2026 · alta disciplinaria médica y de enfermería",
    continuity: "APS territorial + programa municipal de apoyo a cuidador vigente",
    summary: "Episodio de 21 días · rehabilitación de marcha completada · un reingreso evitado por regulación remota",
    reingresos: "0 a 30 días del egreso",
    pasado: [
      ["13-07-2026", "Ingreso post caída con síndrome confusional en resolución"],
      ["22-07-2026", "Marcha supervisada 20 m alcanzada · objetivo funcional cumplido"],
      ["28-07-2026", "Deterioro nocturno manejado por regulación remota sin traslado"],
      ["03-08-2026", "Egreso con red de apoyo activada y acuse municipal"]
    ] },
  { caseId: "HOD-2026-0074", alias: "Elena S.", age: 88, sector: "Ñiquén · extensión",
    closed: "Episodio cerrado 19-05-2026 · fallecimiento esperado en domicilio",
    continuity: "Cierre con acompañamiento a la familia · sin continuidad APS aplicable",
    summary: "Episodio de 34 días de cuidados de fin de vida en domicilio · protocolo de fallecimiento completado con cierre documental",
    reingresos: "No aplica",
    pasado: [
      ["15-04-2026", "Ingreso a cuidados de fin de vida con voluntad declarada de la persona"],
      ["02-05-2026", "Ajuste de confort con regulación remota · familia instruida"],
      ["19-05-2026", "Fallecimiento en domicilio · certificación y retiro de dispositivos"],
      ["22-05-2026", "Cierre documental y llamada de acompañamiento a la familia"]
    ] }
];

/* ---------- Preparación del día siguiente (J5) ----------
   Necesidades por paciente contra capacidad declarada; la propuesta
   de asignación es borrador hasta publicar (cada función acepta). */
const TOMORROW = {
  date: "18-08-2026",
  needs: [
    { person: "jorge", need: "Ingreso: traslado desde Medicina Interna + primera valoración", window: "09:00–10:30", territory: "por verificar", requirements: "equipo de ingreso · consentimiento versionado", who: "enfermería + medicina" },
    { person: "elena", need: "Ingreso tentativo (condicionado a la decisión operacional · brecha V01): primera valoración · evaluación social PENDIENTE", window: "09:00–10:30", territory: "periurbano", requirements: "evaluación social SIN TITULAR · no sustituida por enfermería", who: "enfermería · función social SIN TITULAR" },
    { person: "rosa", need: "Curación + control de potasio + sesión kinésica", window: "09:00–12:00", territory: "urbano", requirements: "custodia de muestra refrigerada", who: "TENS + kinesiología" },
    { person: "ana", need: "Control de signos · necesidad de evaluación social PENDIENTE", window: "10:00–12:00", territory: "periurbano", requirements: "entorno con alerta declarada · función social SIN TITULAR", who: "TENS · función social SIN TITULAR" },
    { person: "luis", need: "Sin visita: cierre pendiente de acuse APS", window: "—", territory: "urbano", requirements: "—", who: "medicina (remoto)" }
  ],
  capacity: [
    ["Enfermería clínica", "2 titulares · 08:00–20:00"],
    ["TENS", "1 titular · 08:00–17:00"],
    ["Kinesiología", "1 titular · 08:30–17:30"],
    ["Medicina", "1 presencial + regulador remoto 20:00–08:00"],
    ["Trabajo social", "SIN TITULAR · Enfermería observada, incompleta y no equivalente"],
    ["Fonoaudiología", "1 titular · media jornada AM"],
    ["Móviles", "M1 4×4 · R. Soto + M2 · H. Vargas"]
  ],
  proposal: [
    { vehicle: "M1 · R. Soto", stops: ["Ingreso Elena F. 09:00 (enfermería)", "Rosa C. 10:30 (curación TENS + muestra)", "Laboratorio tope 13:00 (custodia)", "Retorno 13:30"] },
    { vehicle: "M2 · H. Vargas", stops: ["Traslado Jorge M. 09:00 (enfermería + médico)", "Ana P. 10:45 (control TENS)", "Rosa C. 11:45 (sesión kinésica)", "Retorno 13:00"] }
  ],
  conflicts: [
    "Trabajo social sin titular: la cobertura por Enfermería es observada, incompleta y no equivalente; límites, riesgo y plan de cierre siguen pendientes o no determinados.",
    "Franja 12:00–14:00 sin margen: cualquier retraso traslada una visita; el orden justo queda declarado al publicar.",
    "El ingreso de Elena F. (09:00) queda tentativo hasta adjudicar la autoría de aceptar/diferir/rechazar (brecha V01): se publica con la condición visible, nunca como hecho."
  ]
};

/* ---------- Títulos de la cola por rol (lenguaje natural) ---------- */
const WORK_TITLES = {
  "medico-derivador": "Mis postulaciones",
  "paciente": "Su atención de hoy",
  "cuidador": "Su apoyo de hoy",
  "otro-profesional": "Su situación de habilitación",
  "seremi": "Fiscalización",
  "representante-legal": "Su representación",
  "enfermeria-origen": "Transferencias por entregar",
  "gestion-camas": "Cola de candidatos",
  "receptor-uea": "Prealertas y recepciones",
  "samu": "Solicitudes de traslado",
  "aps-cesfam": "Contrarreferencias",
  "farmacia": "Dispensaciones del día",
  "laboratorio": "Resultados por informar",
  "imagenologia": "Solicitudes de apoyo diagnóstico",
  "especialista": "Interconsultas",
  "iaas": "Vigilancia y prevención",
  "calidad": "Eventos por analizar",
  "direccion-hospital": "Decisiones de gobernanza",
  "gestion-personas": "Habilitaciones",
  "logistica-reas": "Disponibilidad y REAS",
  "ti-datos": "Controles de datos",
  "red-social": "Solicitudes de apoyo"
};
const WORK_SUBTITLES = {
  "medico-derivador": "Sus postulaciones y lo que cada una necesita de usted, en orden.",
  "paciente": "Qué pasa hoy en su atención, quién responde y qué hacer si algo cambia.",
  "cuidador": "Qué puede hacer usted, qué sigue siendo responsabilidad del equipo y cómo avisar.",
  "otro-profesional": "Su disciplina actúa solo con cartera ratificada y competencia verificada.",
  "seremi": "Expedientes y observaciones: se resuelve con evidencia de operación, no de diseño.",
  "representante-legal": "Su alcance verificado: qué puede hacer y qué sigue siendo del equipo.",
  "enfermeria-origen": "Cada transferencia se entrega completa y con receptor confirmado, o no se libera.",
  "gestion-camas": "Proponga candidatos con motivo; la pertinencia la decide el equipo clínico.",
  "receptor-uea": "Toda prealerta se acusa con hora; sin acuse, la recepción no está confirmada.",
  "samu": "Se despacha con ubicación, situación y receptor acordados — nada se improvisa en la urgencia.",
  "aps-cesfam": "La epicrisis enviada no es recepción: cada continuidad se acepta, observa o devuelve con motivo.",
  "farmacia": "Dispensar a tiempo para las ventanas terapéuticas; el cuidador nunca busca el medicamento crítico.",
  "laboratorio": "Todo resultado crítico se comunica a un receptor clínico con acuse y read-back.",
  "imagenologia": "Apoyo diagnóstico con citación y retorno declarados, sin urgencia por defecto.",
  "especialista": "Cada interconsulta termina en recomendación con certeza, alertas y seguimiento.",
  "iaas": "La prevención se adapta al domicilio real; el protocolo de hospital no se copia a una casa.",
  "calidad": "Ningún evento se cierra por formulario: hay análisis, acción con dueño y verificación del efecto.",
  "direccion-hospital": "Los riesgos que la unidad no puede mitigar se deciden aquí, con plazo y consecuencia.",
  "gestion-personas": "Nadie va a terreno sin título verificado, registro e inducción HODOM completada.",
  "logistica-reas": "Se declara la disponibilidad real: en inventario sin calibración no está disponible.",
  "ti-datos": "Controles verificables con guard vivo y prueba negativa; la ambigüedad de autoridad no se automatiza.",
  "red-social": "Un apoyo existe solo con disponibilidad y responsable confirmados."
};

/* ---------- Journey del episodio (J0–J10) ---------- */
const JOURNEY_STAGES = [
  ["J0", "Gobierno y alistamiento"],
  ["J1", "Detección y derivación"],
  ["J2", "Evaluación paralela"],
  ["J3", "Decisión y consentimiento"],
  ["J4", "Transición al domicilio"],
  ["J5", "Planificación diaria"],
  ["J6", "Atención en domicilio"],
  ["J7", "Monitoreo y soporte"],
  ["J8", "Deterioro y rescate"],
  ["J9", "Egreso y continuidad"],
  ["J10", "Calidad y aprendizaje"]
];

/* ---------- Brechas abiertas V01–V13 (no se cierran por pantalla) ----------
   Vista humana hd-dt 04-operacional, corte 2026-08-18. Referencia de
   lectura; ninguna fila autoriza práctica. */
const BRECHAS = [
  ["V01", "¿Quién emite aceptar/diferir/rechazar tras converger las evaluaciones?", "R02, R03, R04, R20", "ambigüedad de autoridad y RBAC"],
  ["V02", "¿Cuál es el contrato efectivo de respuesta 20:00–08:00?", "R01, R04, R16, R21, R22, R30", "continuidad 24/7 no demostrada"],
  ["V03", "¿Cómo se moviliza cada transición y retorno, con qué autorizador?", "R11, R19, R20, R21, R22", "traslado sin dueño"],
  ["V04", "¿Cuál es el consentimiento HODOM vigente y cómo se separa de procedimientos?", "R03, R05, R15–R17", "consentimiento universal"],
  ["V05", "¿En qué registro clínico institucional vive cada acto HODOM?", "R03–R10, R12, R33", "ficha paralela"],
  ["V06", "¿Cómo ingresa y cierra un evento HODOM en GCL/DCSP?", "todos, esp. R01/R28/R29", "subregistro y falsa mejora"],
  ["V07", "¿Qué cobertura segura existe mientras no hay trabajador social?", "R02, R05, R08, R16, R34", "evaluación social aparente"],
  ["V08", "¿Qué carga y riesgo tiene la función administrativa absorbida por TENS?", "R07, R12, R31", "pérdida de capacidad y mezcla de autoría"],
  ["V09", "¿Qué CESFAM acusa y asume cada continuidad post-HODOM?", "R03, R05, R08, R23, R24", "alta documental sin transferencia"],
  ["V10", "¿Qué disciplinas caben en «otro profesional», con qué cartera?", "R10, R30, R31", "oferta abierta por categoría residual"],
  ["V11", "¿Qué relación tienen PRO 002 y PRO-110?", "R01–R05, R18, R20", "reglas locales contradictorias"],
  ["V12", "¿Qué indicadores se pueden producir desde fuentes vivas?", "R01, R02, R20, R29, R30, R33", "decisiones sobre cifras incomparables"],
  ["V13", "¿Existe una evaluación global del Caso terminado; quién la emite?", "R01, R03, R05, R29, R30, R33", "inventar un evaluador no autorizado"]
];

/* R08 no es una identidad operativa al corte: esta declaración alimenta
   solamente la superficie de gobierno. No asigna cobertura, autoridad ni
   acciones a otro estamento y no cierra V07. */
const SOCIAL_ROLE_GAP = Object.freeze({
  title: "Trabajo social requerido · SIN TITULAR · V07 abierta",
  coverage: "Enfermería: cobertura observada, incompleta y no equivalente",
  limits: "Pendiente / no determinado",
  risk: "Pendiente / no determinado",
  closure: "Pendiente / no determinado"
});

/* ---------- Escenarios end-to-end (validar con personas reales) ---------- */
const E2E = [
  ["E2E-01", "Ingreso hospitalario estándar", "R18/R19 → R02 → R03/R05/R08 → R15/R16 → R24/R11 → equipo", "el origen da alta antes del acuse HODOM"],
  ["E2E-02", "Elegible sin cupo", "R18/R20 → R02/R03 → origen", "«sin cupo» se registra como rechazo clínico"],
  ["E2E-03", "Clínica apta, hogar no viable", "R03 + R05/R08 + R15/R16 → R02/R18", "se presiona al cuidador o enfermería firma diagnóstico social no realizado"],
  ["E2E-04", "Rescate interhospitalario", "hospital origen/R20 → HODOM → transporte → domicilio", "se salta evaluación local o no hay responsable en el trayecto"],
  ["E2E-05", "Cuidador se retira", "R16 → R02/R08/R03 → R30/R34 o rescate", "se culpa al cuidador o se mantiene sin soporte"],
  ["E2E-06", "Deterioro durante visita", "R05/R06/R07/R09 → R03/R04 → R22/R21", "el profesional alerta pero nadie confirma recepción"],
  ["E2E-07", "Deterioro nocturno 20:00–08:00", "R16/R15 → canal → R04/fallback → R22/R21", "el único control es una tarjeta 131 sin contrato activo"],
  ["E2E-08", "Resultado crítico de laboratorio", "R25 → R03/R04 → R02/R05/R15/R16", "el resultado queda publicado sin clínico responsable"],
  ["E2E-09", "Evento adverso o reclamo", "cualquiera → R29/R01 → jefatura/R30", "se cierra al completar formulario"],
  ["E2E-10", "Fallecimiento en domicilio", "equipo/cuidador → circuito clínico y legal → R29/R01/familia", "se improvisan responsables"],
  ["E2E-11", "Alta con continuidad APS compleja", "R03/R05/R06/R08/R09 → R23/R24/R34 → R15/R16", "HODOM cierra con documento enviado sin receptor capaz"],
  ["E2E-12", "Caída del sistema en terreno", "R33 → equipo → contingencia → reconciliación", "aparecen dos fichas verdaderas o se posterga un rescate"],
  ["E2E-13", "Agresión o entorno inseguro", "equipo/R11 → R02/R01 → red seguridad/reingreso", "se obliga al equipo a permanecer o se abandona al paciente"]
];

/* ---------- Etapas del journey: qué pasa y qué se declara ---------- */
const JOURNEY_STAGE_DETAIL = {
  "J0": "Hay cartera, gente habilitada, insumos y canales. Sin alistamiento verificado el episodio no parte: cada capacidad nace con dueño y vigencia.",
  "J1": "Alguien identifica al candidato y lo postula con datos. Postular no es transferir: el origen conserva la responsabilidad hasta la aceptación con acuse.",
  "J2": "Clínica y social/hogar se evalúan por separado. Ninguna evaluación sustituye a la otra; convergen sin mezclar competencias.",
  "J3": "Se acepta, difiere o rechaza con fundamento; el paciente decide libre. Quién emite la decisión operacional sigue abierto (V01): esta etapa lo declara, nunca lo inventa.",
  "J4": "Traslado, medicamentos e información sin vacío de responsabilidad: el origen entrega con handoff completo y el receptor acusa antes de liberar.",
  "J5": "Briefing, prioridades, rutas y contingencias del día: la demanda no servida queda registrada con causal y se escala el mismo día.",
  "J6": "El plan interdisciplinario se ejecuta y registra. Lo no registrado no se reporta; el registro sostiene la continuidad de todos.",
  "J7": "Llamadas, exámenes, farmacia y especialistas entre visitas: un resultado nunca queda sin interpretación ni un aviso sin acuse.",
  "J8": "Alarma reconocida, regulación, transporte y recepción activados: cada eslabón confirma al siguiente antes de soltar.",
  "J9": "Cierre clínico con receptor de continuidad confirmado: la epicrisis enviada no es transferencia; sin acuse, el pendiente permanece en la unidad.",
  "J10": "Eventos analizados, acciones con dueño y fecha: un formulario completado no es aprendizaje; el cierre exige efecto verificado."
};

/* ---------- Matriz de presencia por etapa (síntesis del mapa, corte 18-08-2026) ----------
   ● produce decisión propia · ○ participa · ↔ entrega o recibe handoff · — sin contacto */
const JOURNEY_MATRIX = [
  ["direccion-tecnica",     ["●","○","○","○","○","●","○","○","●","○","●"]],
  ["enfermera-coordinadora",["○","●","●","○","●","●","○","●","●","●","○"]],
  ["medico-atencion-directa",["○","○","●","●","○","○","●","●","●","●","○"]],
  ["medico-regulador",      ["○","—","○","○","—","○","○","●","●","↔","○"]],
  ["enfermero-clinico",     ["○","○","●","○","●","○","●","●","●","●","○"]],
  ["kinesiologo",           ["○","—","○","—","○","○","●","○","○","●","○"]],
  ["tecnico-enfermeria",    ["○","—","—","—","○","○","●","○","○","○","○"]],
  ["trabajador-social",     ["○","—","●","○","○","○","○","○","●","●","○"]],
  ["fonoaudiologo",         ["○","—","○","—","○","○","●","○","○","●","○"]],
  ["otro-profesional",      ["○","—","○","—","○","○","●","○","○","●","○"]],
  ["conductor",             ["○","—","—","—","↔","●","↔","○","↔","↔","○"]],
  ["administrativo",        ["○","●","○","○","↔","○","○","●","↔","↔","○"]],
  ["administrador-seguridad",["●","—","—","—","○","○","○","○","○","○","●"]],
  ["seremi",                ["●","—","—","—","—","—","—","—","—","—","●"]],
  ["paciente",              ["○","○","●","●","●","○","●","●","●","●","○"]],
  ["cuidador",              ["○","○","●","●","●","○","○","●","●","●","○"]],
  ["representante-legal",   ["—","○","○","○","○","—","○","○","○","○","—"]],
  ["medico-derivador",      ["○","●","●","↔","●","—","—","↔","—","↔","○"]],
  ["enfermeria-origen",     ["—","○","○","○","●","—","—","↔","—","—","○"]],
  ["gestion-camas",         ["○","●","○","○","●","○","—","↔","↔","↔","○"]],
  ["receptor-uea",          ["○","—","—","—","—","—","—","○","●","↔","○"]],
  ["samu",                  ["○","—","—","—","↔","—","—","—","●","↔","○"]],
  ["aps-cesfam",            ["○","↔","○","—","—","—","○","○","↔","●","○"]],
  ["farmacia",              ["○","—","—","○","●","○","○","●","○","●","○"]],
  ["laboratorio",           ["○","—","—","—","—","○","○","●","●","—","○"]],
  ["imagenologia",          ["○","—","—","—","—","—","—","●","●","—","○"]],
  ["especialista",          ["○","—","—","—","—","—","○","●","●","○","○"]],
  ["iaas",                  ["●","—","○","—","○","○","●","●","●","○","●"]],
  ["calidad",               ["●","—","—","—","—","—","○","○","●","○","●"]],
  ["direccion-hospital",    ["●","○","○","○","○","○","—","○","●","○","●"]],
  ["gestion-personas",      ["●","—","—","—","—","○","○","—","—","—","●"]],
  ["logistica-reas",        ["●","—","—","—","●","●","●","●","○","○","●"]],
  ["ti-datos",              ["●","●","○","○","○","●","●","●","●","●","●"]],
  ["red-social",            ["○","—","●","○","○","—","○","○","●","●","○"]]
];

/* ---------- Cadenas E2E estructuradas (grupos en paralelo = mismo paso) ---------- */
const E2E_STEPS = {
  "E2E-01": [["medico-derivador","enfermeria-origen"],["enfermera-coordinadora"],["medico-atencion-directa","enfermero-clinico","trabajador-social"],["paciente","cuidador"],["farmacia","conductor"],["__EQUIPO__"]],
  "E2E-02": [["medico-derivador","gestion-camas"],["enfermera-coordinadora","medico-atencion-directa"],["__ORIGEN__"]],
  "E2E-03": [["medico-atencion-directa"],["enfermero-clinico","trabajador-social"],["paciente","cuidador"],["enfermera-coordinadora","medico-derivador"]],
  "E2E-04": [["__HOSPITAL_ORIGEN__","gestion-camas"],["__HODOM__"],["samu","conductor"],["__DOMICILIO__"]],
  "E2E-05": [["cuidador"],["enfermera-coordinadora","trabajador-social","medico-atencion-directa"],["direccion-hospital","red-social"]],
  "E2E-06": [["enfermero-clinico","kinesiologo","tecnico-enfermeria","fonoaudiologo"],["medico-atencion-directa","medico-regulador"],["samu","receptor-uea"]],
  "E2E-07": [["cuidador","paciente"],["__CANAL__"],["medico-regulador"],["samu","receptor-uea"]],
  "E2E-08": [["laboratorio"],["medico-atencion-directa","medico-regulador"],["enfermera-coordinadora","enfermero-clinico","paciente","cuidador"]],
  "E2E-09": [["__CUALQUIERA__"],["calidad","direccion-tecnica"],["direccion-hospital"]],
  "E2E-10": [["__EQUIPO_CUIDADOR__"],["__CIRCUITO_CLINICO_LEGAL__"],["calidad","direccion-tecnica","representante-legal"]],
  "E2E-11": [["medico-atencion-directa","enfermero-clinico","kinesiologo","trabajador-social","fonoaudiologo"],["aps-cesfam","farmacia","red-social"],["paciente","cuidador"]],
  "E2E-12": [["ti-datos"],["__EQUIPO__"],["__CONTINGENCIA__"],["__RECONCILIACION__"]],
  "E2E-13": [["__EQUIPO__","conductor"],["enfermera-coordinadora","direccion-tecnica"],["__RED_SEGURIDAD__"]]
};

/* ---------- Nombres cortos para las cadenas ---------- */
const ROLE_SHORT = {
  "direccion-tecnica":"DT", "enfermera-coordinadora":"Coordinación", "medico-atencion-directa":"Médico directo",
  "medico-regulador":"Regulador", "enfermero-clinico":"Enfermería", "kinesiologo":"Kinesiología",
  "tecnico-enfermeria":"TENS", "trabajador-social":"T. social · AUSENTE", "fonoaudiologo":"Fonoaudiología",
  "otro-profesional":"Otro profesional", "conductor":"Conductor", "administrativo":"Administrativo",
  "administrador-seguridad":"Seguridad", "seremi":"SEREMI", "paciente":"Paciente", "cuidador":"Cuidador/a",
  "representante-legal":"Rep. legal", "medico-derivador":"Derivador", "enfermeria-origen":"Enf. origen",
  "gestion-camas":"Camas/UGDP", "receptor-uea":"UEA receptora", "samu":"SAMU", "aps-cesfam":"APS/CESFAM",
  "farmacia":"Farmacia", "laboratorio":"Laboratorio", "imagenologia":"Imagenología", "especialista":"Especialista",
  "iaas":"IAAS", "calidad":"Calidad", "direccion-hospital":"Dirección hosp.", "gestion-personas":"Gest. Personas",
  "logistica-reas":"Logística/REAS", "ti-datos":"TI/datos", "red-social":"Red social",
  "__EQUIPO__":"Equipo HODOM", "__ORIGEN__":"Origen (sigue responsable)", "__HOSPITAL_ORIGEN__":"Hospital origen",
  "__HODOM__":"HODOM", "__DOMICILIO__":"Domicilio", "__CANAL__":"Canal declarado (V02 abierta)",
  "__CUALQUIERA__":"Cualquier rol", "__EQUIPO_CUIDADOR__":"Equipo / cuidador",
  "__CIRCUITO_CLINICO_LEGAL__":"Circuito clínico y legal", "__CONTINGENCIA__":"Contingencia en terreno",
  "__RECONCILIACION__":"Reconciliación única", "__RED_SEGURIDAD__":"Red de seguridad / reingreso"
};

/* ---------- Cues de anticipación por obligación ----------
   Una línea corta que responde «¿por qué esto y por qué ahora?» antes de
   abrir la tarea. Server-authored: el cliente solo la presenta. */
const WORK_CUES = {
  "OBL-DT-01": "La revisión vence mañana 09:00 — decidir hoy evita el escalamiento automático.",
  "OBL-DT-02": "Sin ratificación, la oferta nueva no puede publicarse el 01-09.",
  "OBL-DT-03": "Plazo legal 21-08 — la evidencia ya está acotada para responder.",
  "OBL-DT-04": "La respuesta a fiscalización necesita esta versión publicada.",
  "OBL-DT-05": "El programa del 24-08 se arma con esta capacidad.",
  "OBL-CO-01": "El equipo espera el programa para salir a las 08:45.",
  "OBL-CO-02": "Ventana de traslado 11:00–13:00 — aceptar antes libera al origen.",
  "OBL-CO-04": "Tres prestaciones de la tarde necesitan ejecutor antes de las 13:00.",
  "OBL-MD-01": "Tras comunicación válida: si no registra conducta a las 08:22, escala al médico regulador.",
  "OBL-MD-02": "Ventana 10:30–11:30 · sale con el Móvil 2 a las 09:05.",
  "OBL-MD-03": "Sin acuse de APS en 24 h se activa la recuperación.",
  "OBL-MD-04": "Se activa cuando la transferencia sea aceptada.",
  "OBL-MR-01": "Primera en la cola — su verificación destraba la decisión.",
  "OBL-MR-02": "Entra a las 20:00 — reciba con pendientes declarados.",
  "OBL-MR-03": "Naranja: 15 min antes de escalar a rojo.",
  "OBL-EN-01": "Ventana 09:00–10:00 · Móvil 1 sale 08:45.",
  "OBL-EN-02": "Condicionada a la aceptación de hoy.",
  "OBL-EN-03": "Entrega de turno 19:30.",
  "VIS-ROSA-M1-0900": "Revisión de suficiencia 08:35 · salida programada 08:45.",
  "OBL-KN-01": "Hoy 11:30 · después de la visita médica.",
  "OBL-KN-02": "Dentro de las 24 h del ingreso.",
  "OBL-KN-03": "Decida antes de la sesión de las 11:30.",
  "OBL-TS-01": "Hoy 09:40 · delegación vigente con supervisora.",
  "OBL-TS-02": "La muestra llega al laboratorio antes de las 12:00.",
  "OBL-TS-03": "Cierre de semana 17:00.",
  "OBL-FN-01": "Condiciona la preparación del domicilio.",
  "OBL-SEC-01": "Ingreso 24-08 — la cuenta no tiene autoridad clínica hasta la designación.",
  "OBL-SEC-02": "La revisión vence 18-08.",
  "OBL-SEC-03": "Cuenta activa sin función — efecto inmediato al confirmar.",
  "OBL-SEC-04": "Dos sesiones simultáneas detectadas 07:40 y 07:44.",
  "OBL-DR-01": "Salida 08:45 · 4 destinos con ventanas.",
  "OBL-DR-02": "Entrega antes de las 12:00.",
  "OBL-DR-03": "Sin ubicación verificada, la parada de mañana no se publica.",
  "OBL-DR-04": "Antes de la ventana 10:15–10:45.",
  "OBL-AD-01": "Hoy antes de las 12:00.",
  "OBL-AD-02": "Antes de la transferencia.",
  "OBL-AD-03": "Con el cierre del episodio.",
  "OBL-AD-04": "Antes del ingreso del 24-08.",
  "OBL-EX-01": "La reevaluación es mañana 18-08.",
  "OBL-EX-02": "Sin la conciliación, la evaluación no converge.",
  "OBL-OP-01": "Sin habilitación no hay actuación — la solicitud queda viva.",
  "OBL-PA-01": "Su médico viene hoy entre 10:30 y 11:30.",
  "OBL-PA-02": "Antes de la visita de mañana 10:30.",
  "OBL-PA-03": "Cuando lo necesite — con acuse.",
  "OBL-CU-01": "Téngala a la vista siempre.",
  "OBL-CU-02": "Cuando lo necesite — con acuse y orientación.",
  "OBL-CU-03": "Puede declarar un cambio ahora; la evaluación social sigue SIN TITULAR.",
  "OBL-SE-01": "El expediente espera resolución con evidencia de operación.",
  "OBL-SE-02": "Plazo al cumplimiento 21-08 — con criterio de cierre declarado.",
  "OBL-RL-01": "Antes de decidir por otra persona, su alcance se verifica.",
  "OBL-EO-01": "Ventana de traslado 11:00–13:00 — sin handoff completo no se libera.",
  "OBL-GC-01": "Tres candidatos esperan en la cola compartida.",
  "OBL-UEA-01": "Prealerta activa — sin su acuse, el regulador no cierra su permanencia.",
  "OBL-SA-01": "El recurso espera despacho con receptor ya acordado.",
  "OBL-APS-01": "Epicrisis enviada ayer sin acuse — a las 24 h escala.",
  "OBL-FA-01": "La ventana terapéutica cierra con la próxima administración.",
  "OBL-LAB-01": "Crítico informado 07:52 — si no hay conducta a las 08:22, escala.",
  "OBL-IMG-01": "Citación sin pasar por urgencia: el episodio no se desancla.",
  "OBL-ESP-01": "La interconsulta espera su recomendación con certeza.",
  "OBL-IA-01": "La oxigenoterapia domiciliaria espera su visación.",
  "OBL-CA-01": "El rescate del 12-08 (42 min) espera análisis con voz del usuario.",
  "OBL-DH-01": "La unidad no puede mitigarlo sola — la decisión es suya.",
  "OBL-GP-01": "Ingreso 24-08 — sin inducción registrada no hay terreno.",
  "OBL-LR-01": "El concentrador en mantención condiciona un ingreso.",
  "OBL-TI-01": "Un control sin guard vivo ni prueba negativa no está cerrado.",
  "OBL-RS-01": "La reevaluación del 18-08 necesita este apoyo confirmado."
};
