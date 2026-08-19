/* ============================================================
   HODOM-HSC OS — maqueta. Motor de interacción.
   Sin backend: el "servidor" es data.js + scenes.js. El cliente
   solo presenta proyecciones server-authored y nunca reconstruye
   autoridad (frontend_seam, spec/experience.json).
   ============================================================ */

const E2E08_MEDICAL_SCENE = "e2e08-medical";
const E2E08_EVENT_ID = "E2E08-K-ROSA";
const E2E08_SESSION_ID = "criticalResultRosa";
const E2E08_S3_STREAM = "e2e08-s3";
const E2E01_SESSION_ID = "admissionHandoffJorge";
const E2E07_REHEARSAL_MODE = "v02_rehearsal";
const E2E07_SESSION_ID = "v02NocturnalRehearsal";
const E2E07_HIDDEN_LEGACY_WORK = new Set(["OBL-MR-02", "OBL-MR-03", "OBL-CU-02", "OBL-SA-01", "OBL-UEA-01"]);

function newE2E01Session() {
  return {
    sessionId: E2E01_SESSION_ID,
    caseId: "HOD-2026-0138",
    log: []
  };
}

function newE2E07Session() {
  return {
    sessionId: E2E07_SESSION_ID,
    caseId: "HOD-2026-0129",
    mode: E2E07_REHEARSAL_MODE,
    log: []
  };
}

/* S3 conserva sus hechos en el mismo log append-only de la sesión.  La
   maqueta no persiste estado entre cargas: estos son los hechos conocidos al
   corte inicial, y las acciones sólo agregan nuevos hechos con IDs estables.
   Una eventual fuente más reciente puede exponer E2E08_VISIT_OCCURRENCE;
   mientras tanto, estos valores son el fallback vinculante de la maqueta. */
function e2e08S3Occurrence() {
  const source = typeof E2E08_VISIT_OCCURRENCE !== "undefined" && E2E08_VISIT_OCCURRENCE
    ? E2E08_VISIT_OCCURRENCE : {};
  const pick = (keys, fallback) => {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
    }
    return fallback;
  };
  const vehicleRaw = String(pick(["vehicleId", "vehicle", "mobileId"], "M1"));
  const vehicle = /móvil\s*1|mobile\s*1|^m1$/i.test(vehicleRaw) ? "M1" : vehicleRaw;
  return {
    id: String(pick(["id", "visitId", "visitOccurrenceId"], "VIS-ROSA-M1-0900")),
    patient: String(pick(["patient", "patientName", "person"], "Rosa C.")),
    vehicle,
    vehicleLabel: /m1/i.test(vehicle) ? "Móvil 1" : vehicleRaw,
    window: String(pick(["window", "timeWindow", "visitWindow"], "09:00–10:00")),
    departureAt: String(pick(["departureAt", "departure", "vehicleDepartureAt"], "08:45")),
    nursingPlan: String(pick(["nursingPlan", "carePlan", "planVersion"], "v5")),
    instructionRevision: String(pick(["criticalInstructionRevision", "instructionRevision"], "E2E08-ORD-1"))
  };
}

function e2e08S3InitialEvents() {
  return [{
    stream: E2E08_S3_STREAM,
    id: "E2E08-ORD-1",
    type: "criticalInstructionRevision",
    at: "08:14",
    actor: "medico-atencion-directa",
    emitter: "Médico de atención directa",
    intendedReceiver: "enfermero-clinico",
    origin: "medical-order",
    outcome: "critical_instruction_revision_active",
    status: "active",
    revision: "E2E08-ORD-1",
    packageImpact: "criticalInstructionRevision afecta la instrucción crítica; nursingPlan v5 conserva su propia autoría",
    text: "criticalInstructionRevision E2E08-ORD-1 · 08:14 · autoría médica · packageImpact separa la instrucción crítica del nursingPlan v5."
  }];
}

function newE2E08Session() {
  const session = {
    sessionId: E2E08_SESSION_ID,
    caseId: "HOD-2026-0131",
    eventId: E2E08_EVENT_ID,
    result: "Potasio 6,1 mmol/L",
    reportedAt: "07:52",
    timeoutAt: "08:22",
    intendedReceiver: "Médico de atención directa",
    communication: null,
    timeoutReached: false,
    directConduct: null,
    referralIntent: null,
    reconciliation: null,
    regulatoryConduct: null,
    conflict: null,
    pendingActionId: null,
    pendingBasisToken: null,
    pendingBasisReviewId: null,
    manifestBasisToken: null,
    manifestBasisReviewId: null,
    log: [
      {
        version: 1, priorVersion: 0,
        type: "critical_result_published", at: "07:52",
        actor: "laboratorio", emitter: "Laboratorio HSC",
        intendedReceiver: "medico-atencion-directa",
        origin: "laboratorio-critico", outcome: "resultado_publicado_recepcion_pendiente",
        text: "Resultado crítico publicado por Laboratorio; receptor previsto aún no confirma recepción."
      }
    ]
  };
  session.log.push(...e2e08S3InitialEvents());
  return session;
}

const state = {
  role: "enfermera-coordinadora",
  view: "work",            // work | navroot | scene
  sceneId: null,
  caseId: null,            // ficha abierta
  caseFrom: null,          // vista de origen al abrir la ficha
  q: "",                   // consulta de búsqueda
  sim: "normal",           // normal | loading | empty | denied | conflict | stale | offline | unavailable | session_expired
  device: "auto",
  done: new Set(),         // obligaciones completadas (efecto durable simulado)
  pendingConfirm: null,    // actionId en confirmación
  receipt: null,           // último OutcomeReceipt
  rejection: null,         // panel de salida no primaria
  queued: null,            // intención en cola por offline
  lens: "pulso",
  e2e01: newE2E01Session(),
  e2e07: newE2E07Session(),
  e2e08: newE2E08Session()
};

/* Acceso a ficha clínica: conductor y administrativo nunca; el derivador
   externo solo ve el estado de sus postulaciones, nunca la ficha interna. */
const CLINICAL_FICHA = new Set(["direccion-tecnica", "enfermera-coordinadora", "medico-atencion-directa", "medico-regulador", "enfermero-clinico", "kinesiologo", "tecnico-enfermeria", "trabajador-social", "fonoaudiologo"]);
const SEARCH_ACCESS = new Set([...CLINICAL_FICHA]);
/* Recorridos y brechas son una herramienta de gobierno/auditoría, no una
   segunda tarea para quienes están ejecutando cuidado en terreno. */
const GOVERNANCE_ACCESS = new Set(["direccion-tecnica", "medico-regulador", "seremi", "direccion-hospital", "calidad", "gestion-camas", "ti-datos"]);

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function roleDef() { return ROLES.find((r) => r.id === state.role); }
function sceneDef(id) {
  if (id === E2E08_MEDICAL_SCENE) return { kind: "scene", title: "E2E-08 · Resultado crítico de Rosa C." };
  let s = SCENES[id];
  if (s && s.alias) s = SCENES[s.alias];
  return e2e01SceneDef(id, s);
}

/* E2E-01 es una cadena concreta de admisión, no un reducer genérico. La
   entrega informacional ya está presente en el handoff rev. 3; sólo una
   aceptación atribuida crea el primer evento de esta sesión. Aceptar no
   fabrica liberación, llegada ni primera evaluación. */
function e2e01Event(type) {
  return state.e2e01.log.find((entry) => entry.type === type) || null;
}

function e2e01Accepted() { return Boolean(e2e01Event("coordination_accepted")); }
function e2e01OriginReleased() { return Boolean(e2e01Event("origin_release_recorded")); }

function e2e01AppendEvent(type, details) {
  const version = state.e2e01.log.length + 1;
  const entry = {
    version,
    priorVersion: version - 1,
    type,
    actor: details.actor,
    acceptingReceiver: details.acceptingReceiver || "",
    intendedReceiver: details.intendedReceiver,
    origin: details.origin,
    outcome: details.outcome,
    text: details.text
  };
  state.e2e01.log.push(entry);
  return entry;
}

function e2e01ProjectWorkItems(items) {
  const accepted = e2e01Accepted();
  const released = e2e01OriginReleased();
  return items
    .filter((item) => !(item.id === "OBL-CO-02" && accepted))
    .filter((item) => !(item.id === "OBL-EO-01" && released))
    .map((item) => {
      if (["OBL-MD-04", "OBL-EN-02", "OBL-KN-02"].includes(item.id) && accepted) return {
        ...item,
        title: item.id === "OBL-EN-02"
          ? "Primera valoración integral de Jorge M. — llegada pendiente"
          : item.id === "OBL-KN-02"
            ? "Valoración kinésica inicial de Jorge M. — llegada pendiente"
            : item.title,
        context: `${state.e2e01.caseId} · transferencia aceptada · llegada pendiente`,
        riskLabel: "Llegada pendiente",
        provenance: "Aceptación de Coordinación HODOM · evento v1"
      };
      if (item.id === "OBL-EO-01" && accepted && !released) return {
        ...item,
        title: "Confirmar liberación de Jorge M. con la aceptación HODOM como referencia",
        context: `${state.e2e01.caseId} · aceptación HODOM v1 · llegada no está registrada`,
        riskLabel: "Liberación referenciada pendiente",
        provenance: "Aceptación de Coordinación HODOM · evento v1"
      };
      return item;
    });
}

function e2e01SceneDef(id, source) {
  if (!source || !["handoff-jorge", "origen-handoff", "primera-evaluacion-jorge", "atencion-jorge", "atencion-jorge-kine"].includes(id)) return source;
  const accepted = e2e01Accepted();
  const released = e2e01OriginReleased();

  if (id === "handoff-jorge" && accepted) return {
    ...source,
    header: {
      ...source.header,
      responsible: "HODOM desde la aceptación de Coordinación",
      revision: "rev. 4",
      provenance: "Aceptación de Coordinación HODOM · evento v1",
      riskText: "HODOM responde · llegada pendiente"
    },
    blocks: [{
      type: "notice", tone: "info",
      text: "Transferencia aceptada por Coordinación HODOM. La responsabilidad ya está en HODOM; este hecho no registra liberación, llegada ni primera evaluación."
    }, {
      type: "section", heading: "Contenido aceptado del handoff",
      items: [
        ...((source.blocks?.[0]?.items || []).slice(0, 2)),
        "La entrega informacional y la aceptación v1 quedan registradas como hechos separados; la liberación y la llegada siguen pendientes."
      ]
    }],
    actions: []
  };

  if (id === "origen-handoff") {
    if (!accepted) return {
      ...source,
      header: {
        ...source.header,
        responsible: "Origen conserva la responsabilidad · Medicina Interna · hasta la aceptación HODOM",
        riskText: "Aceptación HODOM pendiente"
      },
      actions: (source.actions || []).map((action) => action.id === "eo-entregar" ? {
        ...action,
        availability: "blocked_explainable",
        explanation: {
          cause: "La entrega informacional está completa, pero Coordinación HODOM todavía no acepta la responsabilidad. No existe un acuse de aceptación que autorice liberar.",
          kept: "El origen conserva la responsabilidad y Jorge M. no se libera; la información entregada permanece disponible sin convertirse en recepción competente.",
          exit: "Coordinación gestiona y registra la aceptación. El origen podrá confirmar la liberación sólo con esa referencia."
        }
      } : action)
    };
    if (!released) return {
      ...source,
      header: {
        ...source.header,
        responsible: "HODOM desde aceptación v1 · origen confirma la liberación",
        revision: "rev. 2",
        provenance: "Aceptación de Coordinación HODOM · evento v1",
        riskText: "Aceptación vigente · liberación aún no registrada · llegada pendiente"
      },
      blocks: [{
        type: "notice", tone: "info",
        text: "Coordinación HODOM aceptó la responsabilidad en el evento v1. Ahora el origen puede confirmar la liberación con esa referencia; la llegada permanece pendiente y no se demuestra desde este acto."
      }, ...(source.blocks || [])],
      actions: (source.actions || []).map((action) => action.id === "eo-entregar" ? {
        ...action,
        label: "Confirmar liberación referenciada a aceptación HODOM v1",
        availability: "available",
        confirm: "La liberación quedará vinculada a la aceptación HODOM v1. No registra llegada ni la confirma en el domicilio.",
        outcome: {
          happened: "Liberación desde Medicina Interna registrada con referencia a la aceptación HODOM v1.",
          changed: "Jorge M. puede iniciar el traslado; no se afirma llegada al domicilio.",
          responsible: "HODOM desde la aceptación · origen continúa contactable para discrepancias.",
          next: "Coordinación registra la llegada antes de habilitar la primera evaluación médica."
        }
      } : action)
    };
    return {
      ...source,
      header: {
        ...source.header,
        responsible: "HODOM · liberación registrada, llegada pendiente",
        revision: "rev. 3",
        provenance: "Liberación de origen · evento v2",
        riskText: "Traslado posible · llegada aún no registrada"
      },
      blocks: [{
        type: "notice", tone: "info",
        text: "El origen registró la liberación con referencia a la aceptación v1. HODOM conserva la responsabilidad; todavía no existe un hito de llegada."
      }, ...(source.blocks || [])],
      actions: []
    };
  }

  const arrivalGate = {
    "primera-evaluacion-jorge": { actionId: "md-primera", actor: "Médico", act: "primera evaluación", blocks: source.blocks || [] },
    "atencion-jorge": { actionId: "en-jorge", actor: "Enfermería", act: "primera valoración", blocks: (source.blocks || []).slice(1) },
    "atencion-jorge-kine": { actionId: "kn-jorge", actor: "Kinesiología", act: "valoración kinésica", blocks: [] }
  }[id];
  if (arrivalGate && accepted) return {
    ...source,
    header: {
      ...source.header,
      responsible: `HODOM desde aceptación v1 · ${arrivalGate.actor} actuará después de la llegada`,
      revision: "rev. 2",
      provenance: "Aceptación de Coordinación HODOM · evento v1",
      riskText: "Transferencia aceptada · llegada pendiente"
    },
    blocks: [{
      type: "notice", tone: "info",
      text: `Transferencia aceptada: la responsabilidad está en HODOM. ${released ? "La liberación del origen ya está registrada, pero " : "La liberación del origen y "}la llegada al domicilio aún no está registrada, por lo que la ${arrivalGate.act} permanece bloqueada.`
    }, ...arrivalGate.blocks],
    actions: (source.actions || []).map((action) => action.id === arrivalGate.actionId ? {
      ...action,
      availability: "blocked_explainable",
      explanation: {
        cause: "La transferencia fue aceptada, pero la llegada de Jorge M. al domicilio no está registrada. Aceptación no equivale a llegada.",
        kept: "HODOM conserva la responsabilidad aceptada; el plan del origen sigue vigente hasta la primera evaluación.",
        exit: "Coordinación confirma y registra la llegada por el canal autorizado; recién entonces se habilita esta valoración."
      }
    } : action)
  };

  return source;
}

function e2e01ProjectCase(caseId, source) {
  if (!source || caseId !== state.e2e01.caseId || !e2e01Accepted()) return source;
  const released = e2e01OriginReleased();
  return {
    ...source,
    riskText: "Transferencia aceptada · llegada pendiente",
    responsibility: {
      ...source.responsibility,
      now: "HODOM desde aceptación de Coordinación v1",
      next: released
        ? "Liberación de origen v2 registrada · llegada pendiente"
        : "Liberación de origen pendiente · llegada aún no registrada"
    },
    pulso: (source.pulso || []).map(([key, value]) => {
      if (key === "Transferencia") return [key, released
        ? "Aceptación HODOM v1 y liberación de origen v2 registradas · llegada pendiente"
        : "Aceptación HODOM v1 registrada · liberación y llegada pendientes"];
      if (key === "Condición al origen") return [key, "HODOM conserva la responsabilidad; el plan de origen sigue vigente hasta la primera evaluación tras la llegada"];
      return [key, value];
    }),
    plan: (source.plan || []).map((plan) => ({
      ...plan,
      items: (plan.items || []).map((item) => {
        if (/Rige el plan del origen hasta que la transferencia sea aceptada/i.test(item)) return "El plan del origen sigue vigente hasta la primera evaluación; HODOM ya conserva la responsabilidad aceptada.";
        if (/primera valoración de enfermería/i.test(item)) return "La primera valoración de enfermería permanece condicionada a la llegada registrada.";
        if (/valoración kinésica inicial/i.test(item)) return "La valoración kinésica inicial permanece condicionada a la llegada registrada.";
        return item;
      })
    })),
    pasado: [
      ...(source.pasado || []),
      ["Sesión de maqueta · v1", "Coordinación HODOM aceptó la responsabilidad; HODOM responde sin que este evento pruebe llegada."],
      ...(released ? [["Sesión de maqueta · v2", "Medicina Interna registró la liberación referenciada; llegada no observada y valoraciones pendientes."]] : [])
    ]
  };
}

function e2e01ProjectCensus(items) {
  const accepted = e2e01Accepted();
  const released = e2e01OriginReleased();
  if (!accepted) return items;
  return items.map((item) => item.id === state.e2e01.caseId ? {
    ...item,
    today: released
      ? "Aceptación HODOM v1 · liberación de origen v2 · llegada no observada"
      : "Aceptación HODOM v1 · liberación y llegada pendientes"
  } : item);
}

function e2e01EventAttrs(entry) {
  return `data-e2e01-event="${esc(entry.type === "coordination_accepted" ? "coordination-accepted" : "origin-release-recorded")}" data-e2e01-actor="${esc(entry.actor)}" data-e2e01-accepting-receiver="${esc(entry.acceptingReceiver)}" data-e2e01-intended-receiver="${esc(entry.intendedReceiver)}" data-e2e01-origin="${esc(entry.origin)}" data-e2e01-outcome="${esc(entry.outcome)}" data-e2e01-prior-version="${esc(entry.priorVersion)}" data-e2e01-version="${esc(entry.version)}"`;
}

function e2e01ReadableTrace(entry) {
  if (entry.type === "coordination_accepted") return {
    event: `v${entry.version} · aceptación de responsabilidad · versión previa v${entry.priorVersion}`,
    actor: "Enfermera coordinadora HODOM",
    origin: "Medicina Interna",
    receiverLabel: "Receptor que acepta",
    receiver: "Enfermera coordinadora HODOM",
    nextLabel: "Siguiente receptor",
    next: "Médico de atención directa",
    outcome: "Responsabilidad aceptada por HODOM; llegada pendiente"
  };
  return {
    event: `v${entry.version} · liberación de origen · versión previa v${entry.priorVersion}`,
    actor: "Enfermería/TENS de Medicina Interna",
    origin: "Aceptación HODOM v1",
    receiverLabel: "Receptor informado",
    receiver: "Coordinación HODOM",
    nextLabel: "Siguiente hito",
    next: "Llegada registrada por el canal autorizado",
    outcome: "Liberación registrada; llegada no observada"
  };
}

function e2e01TraceRowsHtml(entry) {
  const trace = e2e01ReadableTrace(entry);
  return `<dt>Evento</dt><dd>${esc(trace.event)}</dd>
      <dt>Actor</dt><dd>${esc(trace.actor)}</dd>
      <dt>Origen${entry.type === "origin_release_recorded" ? " del evento" : ""}</dt><dd>${esc(trace.origin)}</dd>
      <dt>${esc(trace.receiverLabel)}</dt><dd>${esc(trace.receiver)}</dd>
      <dt>${esc(trace.nextLabel)}</dt><dd>${esc(trace.next)}</dd>
      <dt>Resultado trazable</dt><dd>${esc(trace.outcome)}</dd>`;
}

function e2e01LogHtml() {
  if (!["enfermeria-origen", "enfermera-coordinadora", "medico-atencion-directa"].includes(state.role)) return "";
  if (!state.e2e01.log.length) return "";
  return `<details class="e2e08-log" data-e2e01-log>
    <summary>Traza de la transferencia</summary>
    <ol>${state.e2e01.log.map((entry) => {
      const trace = e2e01ReadableTrace(entry);
      return `<li data-e2e01-event-entry ${e2e01EventAttrs(entry)}><span>v${esc(entry.version)} ← v${esc(entry.priorVersion)}</span>
        · <b>Actor:</b> ${esc(trace.actor)} · <b>Origen:</b> ${esc(trace.origin)}
        · <b>${esc(trace.receiverLabel)}:</b> ${esc(trace.receiver)}
        · <b>${esc(trace.nextLabel)}:</b> ${esc(trace.next)}
        · <b>Resultado:</b> ${esc(trace.outcome)}</li>`;
    }).join("")}</ol>
  </details>`;
}

function e2e01RoleStatusHtml() {
  const accepted = e2e01Event("coordination_accepted");
  if (!accepted || !["enfermeria-origen", "enfermera-coordinadora", "medico-atencion-directa"].includes(state.role)) return "";
  const released = e2e01OriginReleased();
  const next = state.role === "enfermeria-origen" && !released
    ? "Confirme la liberación con referencia a la aceptación v1; esto no registra llegada."
    : "La llegada sigue pendiente; la primera evaluación médica continúa bloqueada hasta ese hito.";
  return `<section class="outcome-receipt" data-e2e01-handoff-status role="status" aria-label="Estado de transferencia de Jorge M.">
      <h2>Transferencia aceptada · llegada pendiente</h2>
      <dl><dt>Caso</dt><dd>${esc(state.e2e01.caseId)}</dd>
        <dt>Responsabilidad</dt><dd>HODOM desde la aceptación de Coordinación v1.</dd>
        <dt>Límite</dt><dd>${released ? "Liberación registrada; " : "Liberación todavía no registrada; "}no existe llegada observada ni primera evaluación.</dd>
        <dt>Próximo paso</dt><dd>${esc(next)}</dd></dl>
    </section>${e2e01LogHtml()}`;
}

function e2e01AcceptanceReceiptHtml(entry) {
  return `<div class="outcome-receipt" role="status" aria-label="Aceptación atribuida de transferencia" ${e2e01EventAttrs(entry)}>
    <h2 tabindex="-1">Transferencia aceptada</h2>
    <dl>${e2e01TraceRowsHtml(entry)}
      <dt>Qué ocurrió</dt><dd>Coordinación HODOM aceptó el handoff rev. 3 de Medicina Interna para ${esc(state.e2e01.caseId)}.</dd>
      <dt>Qué cambió</dt><dd>La responsabilidad pasa del origen a HODOM desde este evento v1.</dd>
      <dt>Responsable ahora</dt><dd>Coordinación conserva la continuidad; el médico de atención directa actuará sólo después de la llegada.</dd>
      <dt>Límite</dt><dd>La primera evaluación permanece condicionada a llegada. No afirma arribo, atención ni acto clínico.</dd>
      <dt>Próximo paso</dt><dd>Medicina Interna puede confirmar la liberación con esta referencia; traslado 11:00–13:00 y llegada siguen separados.</dd></dl>
  </div>`;
}

function e2e01ReleaseReceiptHtml(entry) {
  return `<div class="outcome-receipt" role="status" aria-label="Liberación atribuida desde origen" ${e2e01EventAttrs(entry)}>
    <h2 tabindex="-1">Liberación referenciada</h2>
    <dl>${e2e01TraceRowsHtml(entry)}
      <dt>Qué ocurrió</dt><dd>Medicina Interna confirmó la liberación con referencia a la aceptación HODOM v1.</dd>
      <dt>Qué cambió</dt><dd>Jorge M. puede iniciar el traslado; la llegada sigue pendiente y no está observada.</dd>
      <dt>Responsable ahora</dt><dd>HODOM desde la aceptación; origen queda contactable para discrepancias.</dd>
      <dt>Próximo paso</dt><dd>Coordinación registra la llegada antes de habilitar la primera evaluación médica.</dd></dl>
  </div>`;
}

function e2e01ConfirmAction(actionId) {
  let entry = null;
  let html = "";
  if (actionId === "co-aceptar" && state.role === "enfermera-coordinadora" && !e2e01Accepted()) {
    entry = e2e01AppendEvent("coordination_accepted", {
      actor: "enfermera-coordinadora",
      acceptingReceiver: "enfermera-coordinadora",
      intendedReceiver: "medico-atencion-directa",
      origin: "medicina-interna",
      outcome: "responsibility-accepted-hodom",
      text: "Coordinación HODOM aceptó el handoff rev. 3; HODOM asume responsabilidad sin inferir liberación, llegada ni evaluación."
    });
    html = e2e01AcceptanceReceiptHtml(entry);
  } else if (actionId === "eo-entregar" && state.role === "enfermeria-origen" && e2e01Accepted() && !e2e01OriginReleased()) {
    entry = e2e01AppendEvent("origin_release_recorded", {
      actor: "enfermeria-origen",
      intendedReceiver: "enfermera-coordinadora",
      origin: "coordination-accepted-v1",
      outcome: "origin-release-recorded-arrival-pending",
      text: "Medicina Interna registró la liberación con referencia a aceptación v1; llegada pendiente."
    });
    html = e2e01ReleaseReceiptHtml(entry);
  } else return false;

  state.pendingConfirm = null;
  state.confirmTrigger = null;
  render();
  const host = $("#action-result");
  if (host) {
    host.innerHTML = html;
    bindMainEvents();
    focusActionResult();
  }
  return true;
}

/* E2E-08 es un hilo explícito, no un motor de eventos genérico. La cola
   médica sólo recibe una proyección cuando existe el evento causal y el actor
   puede asumir la siguiente decisión. */
function e2e08ProjectionForRole(role = state.role) {
  const s = state.e2e08;
  if (role === "medico-atencion-directa"
    && s.communication === "success"
    && !s.timeoutReached
    && !s.directConduct
    && !s.referralIntent
    && !s.reconciliation
    && !s.regulatoryConduct) {
    return {
      id: "E2E08-MD-01",
      scene: E2E08_MEDICAL_SCENE,
      title: "Interpretar resultado crítico y definir conducta para Rosa C.",
      context: `${s.caseId} · ${s.result} comunicado con read-back · conducta pendiente`,
      risk: "A4",
      riskLabel: "Conducta clínica pendiente",
      due: `Antes de ${s.timeoutAt}`,
      receiver: "Médico de atención directa (usted)",
      revision: "E2E-08",
      provenance: `Comunicación de Laboratorio ${s.reportedAt}`
    };
  }
  if (role === "medico-regulador"
    && s.timeoutReached
    && !s.regulatoryConduct) {
    return {
      id: "E2E08-MR-01",
      scene: E2E08_MEDICAL_SCENE,
      title: "Recibir escalamiento del resultado crítico de Rosa C.",
      context: `${s.caseId} · sin conducta a las ${s.timeoutAt} · recuperación reguladora`,
      risk: "A4",
      riskLabel: "Escalamiento por timeout",
      due: `Ahora · después de ${s.timeoutAt}`,
      receiver: "Médico regulador (usted)",
      revision: "E2E-08",
      provenance: `Timeout unidireccional ${s.timeoutAt}`
    };
  }
  return null;
}

function e2e08WorkItems() {
  const base = e2e01ProjectWorkItems((WORK[state.role] || []).filter((w) => !state.done.has(w.id)
    && !E2E07_HIDDEN_LEGACY_WORK.has(w.id)
    && w.id !== "OBL-MD-01"
    && !(w.id === "OBL-LAB-01" && state.e2e08.communication)));
  const e2e08Projection = e2e08ProjectionForRole();
  const e2e07Projection = e2e07ProjectionForRole();
  return [e2e08Projection, e2e07Projection, ...base].filter(Boolean);
}

function workItems() { return e2e08WorkItems(); }

function e2e08LegacyEntries() {
  return state.e2e08.log.filter((entry) => entry.stream !== E2E08_S3_STREAM);
}

function e2e08EventEntryHtml(entry) {
  return `<li data-e2e08-entry data-e2e08-version="${esc(entry.version)}" data-e2e08-prior-version="${esc(entry.priorVersion)}" data-e2e08-actor="${esc(entry.actor)}" data-e2e08-emitter="${esc(entry.emitter)}" data-e2e08-intended-receiver="${esc(entry.intendedReceiver)}" data-e2e08-origin="${esc(entry.origin)}" data-e2e08-outcome="${esc(entry.outcome)}"><span>v${esc(entry.version)} ← v${esc(entry.priorVersion)}</span> · <span>${esc(entry.at)}</span> · ${esc(entry.text)}</li>`;
}

function e2e08AppendEvent(type, text, at = "08:22", details = {}) {
  const version = e2e08LegacyEntries().length + 1;
  const actor = details.actor || state.role || "sistema";
  state.e2e08.log.push({
    version,
    priorVersion: version - 1,
    type,
    at,
    actor,
    emitter: details.emitter || roleDef()?.label || actor,
    intendedReceiver: details.intendedReceiver || "medico-atencion-directa",
    origin: details.origin || state.sceneId || E2E08_SESSION_ID,
    outcome: details.outcome || type,
    text
  });
  document.querySelectorAll("[data-e2e08-log]").forEach((host) => {
    const list = `<ol>${e2e08LegacyEntries().map(e2e08EventEntryHtml).join("")}</ol>`;
    if (host.querySelector("ol")) host.querySelector("ol").outerHTML = list;
    else host.innerHTML = list;
  });
}

function e2e08LogHtml() {
  return `<div class="e2e08-log" data-e2e08-log aria-label="Bitácora append-only del evento">
    <h3>Log append-only</h3>
    <ol>${e2e08LegacyEntries().map(e2e08EventEntryHtml).join("")}</ol>
  </div>`;
}

function e2e08TimeoutControlHtml() {
  const s = state.e2e08;
  const visibleTo = new Set(["laboratorio", "medico-atencion-directa", "medico-regulador"]);
  if (!visibleTo.has(state.role) || !s.communication || s.timeoutReached || s.directConduct || s.referralIntent || s.regulatoryConduct) return "";
  return `<section class="e2e08-time-control" aria-label="Control sintético del timeout ${esc(s.timeoutAt)}">
    <p>Mientras no exista conducta, el límite ${esc(s.timeoutAt)} permanece alcanzable aunque cambie la vista o el rol de la maqueta.</p>
    <button class="btn exit" data-e2e08-action="timeout-0822">Alcanzar timeout ${esc(s.timeoutAt)}</button>
  </section>`;
}

function e2e08SessionSummaryHtml() {
  const s = state.e2e08;
  const communication = s.communication === "success"
    ? `<div class="e2e08-projection" data-e2e08-receipt="communication" aria-label="Comunicación confirmada con receptor y read-back">
        <h3>Receipt de comunicación</h3>
        <p>Laboratorio comunicó a ${esc(s.intendedReceiver)}; receptor humano confirmó y dejó read-back.</p>
      </div>`
    : s.communication === "failed"
      ? `<div class="e2e08-projection" data-e2e08-recovery="communication" aria-label="Recuperación de comunicación fallida">
          <h3>Recuperación de comunicación</h3>
          <p>Laboratorio conserva la responsabilidad; no hubo recepción humana. La siguiente acción es escalar si no hay respuesta.</p>
        </div>` : "";
  const timeout = s.timeoutReached
    ? `<div class="e2e08-projection" data-e2e08-recovery="timeout" aria-label="Recuperación por timeout 08:22">
        <h3>Escalamiento regulador desde ${esc(s.timeoutAt)}</h3>
        <p>La transición fue unidireccional: publicación y fallo permanecen en el log; no se inventa conducta clínica.</p>
      </div>` : "";
  const reconciliation = s.reconciliation
    ? `<div class="e2e08-projection" data-e2e08-reconciliation aria-label="Intento directo pendiente de reconciliación">
        <h3>Reconciliación pendiente</h3>
        <p>El intento directo posterior al timeout queda como intento durable; no se transforma en conducta clínica sin decisión autorizada.</p>
      </div>` : "";
  const regulatory = s.regulatoryConduct ? e2e08RegulatoryConductHtml() : "";
  const direct = s.directConduct ? e2e08DirectConductHtml() : "";
  const referral = s.referralIntent ? e2e08ReferralHtml() : "";
  const conflict = s.conflict
    ? `<div class="e2e08-projection" data-e2e08-conflict aria-label="Conflicto de versión pendiente de reconciliación">
        <h3>Conflicto posterior</h3>
        <p>El intento directo llega sobre una versión ya resuelta por el regulador. Se conserva la conducta reguladora y se abre reconciliación; no hay overwrite.</p>
      </div>` : "";
  return `<section class="e2e08-session-summary" data-e2e08-session="${E2E08_SESSION_ID}" data-e2e08-event-id="${E2E08_EVENT_ID}" aria-label="Sesión ${E2E08_SESSION_ID}">
    <h2>Sesión ${E2E08_SESSION_ID}</h2>
    <dl>
      <dt>caseId</dt><dd>${esc(s.caseId)}</dd>
      <dt>eventId</dt><dd>${esc(s.eventId)}</dd>
      <dt>result</dt><dd>${esc(s.result)}</dd>
      <dt>reportedAt</dt><dd>${esc(s.reportedAt)}</dd>
      <dt>timeoutAt</dt><dd>${esc(s.timeoutAt)}</dd>
      <dt>intendedReceiver</dt><dd>${esc(s.intendedReceiver)} (intención, no recepción humana)</dd>
    </dl>
    ${communication}${timeout}${reconciliation}${direct}${referral}${regulatory}${conflict}
    ${e2e08TimeoutControlHtml()}
    ${e2e08LogHtml()}
  </section>`;
}

/* ================= E2E-08 / S3 =================
   S3 intentionally has no packageReview/currentManifest/departure/cancellation
   mutable slots.  The following projections derive their answer from the
   append-only stream above; transitions below only append a new record. */

function e2e08S3Entries() {
  return state.e2e08.log.filter((entry) => entry.stream === E2E08_S3_STREAM);
}

function e2e08S3Latest(types) {
  const wanted = new Set(Array.isArray(types) ? types : [types]);
  return [...e2e08S3Entries()].reverse().find((entry) => wanted.has(entry.type)) || null;
}

function e2e08S3HasType(type) {
  return e2e08S3Entries().some((entry) => entry.type === type);
}

function e2e08S3HasReference(type, refId) {
  return e2e08S3Entries().some((entry) => entry.type === type
    && (entry.refId === refId || entry.reviewId === refId || entry.manifestId === refId));
}

function latestCriticalInstruction() {
  return e2e08S3Entries().filter((entry) => entry.type === "criticalInstructionRevision"
    && entry.status !== "proposed").slice(-1)[0] || null;
}

function currentPackageReview() {
  const review = e2e08S3Latest("package_review");
  if (!review) return null;
  const invalidated = e2e08S3HasReference("package_review_invalidated", review.id);
  return { ...review, valid: !invalidated };
}

function e2e08S3ReviewIsValid() {
  const review = currentPackageReview();
  return Boolean(review && review.valid !== false && review.status === "sufficient");
}

function e2e08S3NeedsReview() {
  const review = currentPackageReview();
  return !review || review.valid === false;
}

function e2e08S3BasisToken() {
  const instruction = latestCriticalInstruction();
  const material = e2e08S3Latest("material_change_declared");
  return `E2E08-BASIS-${instruction?.revision || "E2E08-ORD-1"}-NP5-${material?.id || "BASE"}`;
}

function currentManifestDecision() {
  const decision = e2e08S3Latest("manifest_decision");
  if (!decision) return null;
  const invalidated = e2e08S3HasReference("manifest_decision_invalidated", decision.id);
  return { ...decision, valid: !invalidated };
}

function e2e08S3ManifestIsValid() {
  const decision = currentManifestDecision();
  return Boolean(decision && decision.valid !== false);
}

function vehicleDeparture() {
  return e2e08S3Latest(["vehicle_departure_observed", "vehicle_departure_blocked"]);
}

/* Adaptador específico para los renderers geográficos: deriva cada lectura
   desde la ocurrencia canónica y el log S3, sin crear otro estado mutable. */
function e2e08S3SceneProjection() {
  const o = e2e08S3Occurrence();
  const source = typeof E2E08_VISIT_OCCURRENCE !== "undefined" ? E2E08_VISIT_OCCURRENCE : {};
  const review = currentPackageReview();
  const manifestDecision = currentManifestDecision();
  const departure = vehicleDeparture();
  const cancellation = e2e08S3UrgentCancellation();
  return {
    visit: { ...source, id: o.id, vehicle: o.vehicleLabel, vehicleLabel: o.vehicleLabel, window: o.window, scheduledDeparture: o.departureAt, nursingPlan: o.nursingPlan, criticalInstructionRevision: o.instructionRevision, roles: source.roles || ["enfermero-clinico", "tecnico-enfermeria"] },
    package: source,
    criticalInstruction: latestCriticalInstruction(),
    packageReview: review,
    manifestDecision,
    departure,
    urgentCancellation: cancellation,
    referralIntent: e2e08S3ReferralIntent(),
    coordinationAck: e2e08S3CoordinationAck(),
    coordinationWithdraw: e2e08S3CoordinationWithdraw(),
    routeAmendment: e2e08S3RouteAmendment(),
    driverContact: e2e08S3DriverContact(),
    invalidation: e2e08S3Invalidation(),
    manifest: typeof E2E08_S3_MANIFEST !== "undefined" ? E2E08_S3_MANIFEST : { id: "M1", visitId: o.id, vehicleLabel: o.vehicleLabel, reviewAt: "08:35", decisionAt: "08:40" },
    log: [...e2e08S3Entries(), { id: "E2E08-S3-DEPARTURE-WINDOW", at: o.departureAt, type: "departure_window_declared", kind: "scheduled", event: "ventana de salida M1 programada" }]
  };
}

function hdDesignE2E08S3TemporalProjection() {
  const departure = vehicleDeparture();
  const cancellation = e2e08S3UrgentCancellation();
  return {
    source: "app.e2e08.log",
    scheduledDeparture: e2e08S3Occurrence().departureAt,
    departureObserved: departure?.type === "vehicle_departure_observed",
    departureBlocked: departure?.type === "vehicle_departure_blocked",
    cancellation,
    visitState: cancellation ? "cancelada" : departure?.type === "vehicle_departure_observed" ? "en ruta" : "programada"
  };
}

function e2e08S3AppendEvent(event) {
  const existing = e2e08S3Entries().find((entry) => entry.id === event.id);
  if (existing) return existing;
  const entries = e2e08S3Entries();
  const lastAt = entries.length ? entries[entries.length - 1].at : null;
  const minutes = (value) => {
    const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const requested = minutes(event.at);
  const previous = minutes(lastAt);
  const at = requested !== null && previous !== null && requested < previous ? lastAt : event.at;
  const record = Object.freeze({
    stream: E2E08_S3_STREAM,
    ...event,
    at,
    text: event.text || event.outcome || event.type
  });
  state.e2e08.log.push(record);
  return record;
}

function e2e08S3NextId(prefix, type) {
  const count = e2e08S3Entries().filter((entry) => entry.type === type).length + 1;
  return count === 1 ? prefix : `${prefix}-R${count}`;
}

function e2e08S3Invalidation() {
  return e2e08S3Latest("material_change_declared");
}

function e2e08S3UrgentCancellation() {
  return e2e08S3Latest("cancelled_by_medical_order");
}

function e2e08S3ReferralIntent() {
  return e2e08S3Latest("referral_intent");
}

function e2e08S3CoordinationAck() {
  return e2e08S3Latest("coordination_acknowledged_medical_order");
}

function e2e08S3CoordinationWithdraw() {
  return e2e08S3Latest("coordination_withdraw_vis");
}

function e2e08S3RouteAmendment() {
  return e2e08S3Latest("route_amendment_initiated");
}

function e2e08S3DriverContact() {
  return e2e08S3Latest("driver_contact_attempted");
}

function e2e08S3CareAck() {
  return e2e08S3Latest("care_unit_message_acknowledged");
}

function e2e08S3WorkItem(role = state.role) {
  const occurrence = e2e08S3Occurrence();
  const byRole = {
    "enfermero-clinico": {
      id: occurrence.id, scene: "e2e08-s3-nursing",
      title: "Revisar paquete de VIS-ROSA-M1-0900 antes de partir",
      context: `${occurrence.id} · ${occurrence.vehicleLabel} · revisión de suficiencia 08:35`,
      risk: "A1", riskLabel: "Revisión previa a partida", due: "08:35", receiver: "Coordinación"
    },
    "enfermera-coordinadora": {
      id: occurrence.id, scene: "e2e08-s3-coordination",
      title: "Mantener o retener VIS-ROSA-M1-0900 en el manifiesto",
      context: `${occurrence.id} · ${occurrence.vehicleLabel} · decisión de manifiesto 08:40`,
      risk: "A2", riskLabel: "Decisión de coordinación", due: "08:40", receiver: "Conductor M1"
    },
    conductor: {
      id: occurrence.id, scene: "e2e08-s3-driver",
      title: "Registrar partida o bloqueo del Móvil 1",
      context: `${occurrence.vehicleLabel} · partida ${occurrence.departureAt} · registro logístico`,
      risk: "A1", riskLabel: "Hito de partida", due: occurrence.departureAt, receiver: "Coordinación"
    },
    "medico-atencion-directa": {
      id: occurrence.id, scene: "e2e08-s3-medical",
      title: "Emitir instrucción crítica o decidir cancelación urgente de VIS",
      context: `${occurrence.id} · instrucción médica y continuidad A4`,
      risk: "A4", riskLabel: "Decisión médica", due: "Ahora", receiver: "Enfermería y Coordinación"
    }
  };
  return byRole[role] || null;
}

function e2e08S3WorkMatches(work) {
  const item = e2e08S3WorkItem();
  if (!item || !work) return false;
  const occurrence = e2e08S3Occurrence();
  return work.id === item.id || work.legacyId === item.id || work.visitId === occurrence.id
    || (work.scene === "e2e08-s3-package" && work.id === occurrence.id);
}

function e2e08S3OpenAttrs(work) {
  const item = e2e08S3WorkItem();
  return e2e08S3WorkMatches(work) && item ? ` data-e2e08-s3-open="${esc(item.id)}"` : "";
}

/* El corte inicial puede abrir la obligación desde la cola, pero conserva la
   misma única acción primaria para las cargas satélite que no recorren antes
   el mapa o la escena. El receipt sigue entrando en el log y en #action-result. */
function e2e08S3QueueSurfaceHtml() {
  if (!["enfermero-clinico", "enfermera-coordinadora", "conductor", "medico-atencion-directa"].includes(state.role) || !e2e08S3WorkItem()) return "";
  const o = e2e08S3Occurrence();
  if (state.role !== "enfermero-clinico") {
    const item = e2e08S3WorkItem();
    const openAttr = `data-e2e08-s3-open="${esc(o.id)}"`;
    return `<section data-e2e08-s3="queue-entry" class="block" aria-label="Obligación S3 ${esc(item.title)}">
      <h2>${esc(item.title)}</h2><p>${esc(item.context)}</p>
      <button class="btn" ${openAttr}${e2e08S3OpenAttrs({ id: o.id, visitId: o.id })} aria-label="Abrir obligación ${esc(o.id)}">Abrir obligación ${esc(o.id)}</button>
    </section>`;
  }
  return `<section data-s3-review data-review-time="08:35" data-package-review="E2E08-REVIEW-0835" class="block" aria-label="Review de paquete S3 en cola">
    <h2>Revisión de paquete · 08:35</h2>
    <p>criticalInstructionRevision ${esc(o.instructionRevision)} · nursingPlan ${esc(o.nursingPlan)} · suficiencia a clasificar por Enfermería.</p>
    ${e2e08S3ActionsHtml(["review-package", "review-package-missing"], "Revisión de Enfermería")}
    <div id="action-result" role="region" aria-label="Resultado de acción"></div>
  </section>`;
}

function e2e08S3PrivateCopyHtml() {
  const cancellation = e2e08S3UrgentCancellation();
  if (!cancellation || !["paciente", "cuidador"].includes(state.role)) return "";
  const node = state.role === "paciente" ? "patient-cancellation-copy" : "caregiver-cancellation-copy";
  const label = state.role === "paciente" ? "Mensaje para paciente" : "Mensaje para cuidador";
  const ack = e2e08S3CareAck();
  return `<section data-e2e08-s3="${node}" class="outcome-receipt" aria-label="${label}">
    <h2>${label}</h2>
    <p>La visita de las 09:00 fue cancelada; el equipo médico sigue a cargo y confirmará la continuidad.</p>
    ${!ack ? `<div class="action-item"><button class="btn primary" data-e2e08-s3-action="care-unit-message-acknowledge" data-s3-action="care-unit-message-acknowledge" data-e2e08-action="care-unit-message-acknowledge" data-action="care-unit-message-acknowledge" aria-label="Acusar mensaje de cancelación en unidad de cuidado" tabindex="0">Acusar mensaje de cancelación</button></div>` : ""}
    ${ack ? `<div data-e2e08-s3-event data-e2e08-event-id="${esc(ack.id)}" data-e2e08-at="${esc(ack.at)}">care_unit_message_acknowledged</div>` : ""}
    <div id="action-result" role="region" aria-label="Resultado de acción"></div>
  </section>`;
}

function e2e08RoleContinuationHtml() {
  const s = state.e2e08;
  if (state.role !== "medico-atencion-directa") return "";
  if (s.timeoutReached && !s.regulatoryConduct && !s.reconciliation) {
    return `<section class="e2e08-continuation" aria-label="Reconciliación del intento directo">
      <h2>Intento directo posterior al timeout</h2>
      <p>Puede dejar constancia del intento; hasta la decisión reguladora no se crea una conducta clínica.</p>
      <button class="btn primary" data-e2e08-action="post-timeout-direct-attempt">Registrar intento para reconciliación</button>
      <div id="action-result" role="region" aria-label="Resultado de acción"></div>
    </section>`;
  }
  if (s.regulatoryConduct && !s.conflict) {
    return `<section class="e2e08-continuation" aria-label="Reconciliación posterior a conducta reguladora">
      <h2>Intento directo sobre una conducta reguladora vigente</h2>
      <p>El intento se conserva como versión concurrente y no reemplaza la conducta ya registrada.</p>
      <button class="btn exit" data-e2e08-action="post-regulatory-direct-attempt">Registrar intento para reconciliación</button>
      <div id="action-result" role="region" aria-label="Resultado de acción"></div>
    </section>`;
  }
  return "";
}

/* ================= E2E-07 / S4 · ENSAYO NOCTURNO V02 =================
   Estado específico de la maqueta: vive sólo mientras el selector permanece
   en modo ensayo. Los hechos se agregan; las colas son proyecciones causales. */

function e2e07IsRehearsal() { return state.sim === E2E07_REHEARSAL_MODE; }
function e2e07Event(outcome) { return state.e2e07.log.find((entry) => entry.outcome === outcome) || null; }

function e2e07AppendEvent({ id, actor, at, origin, outcome, intendedReceiver, text }) {
  const version = state.e2e07.log.length + 1;
  state.e2e07.log.push({
    id, version, priorVersion: version - 1, actor, at, origin, outcome,
    intendedReceiver, text
  });
  document.querySelectorAll("[data-e2e07-log]").forEach((host) => {
    host.innerHTML = e2e07LogEntriesHtml();
  });
}

function e2e07ProjectionForRole(role = state.role) {
  if (!e2e07IsRehearsal()) return null;
  const called = e2e07Event("synthetic_131_call_recorded");
  const rescue = e2e07Event("simulated_rescue_requested");
  const dispatchObserved = e2e07Event("simulated_dispatch_observed");
  const dispatchBlocked = e2e07Event("simulated_dispatch_blocked");
  const ueaAck = e2e07Event("simulated_prealert_acknowledged");
  if (role === "cuidador" && !called) return {
    id: "E2E07-CU-01", scene: "e2e07-care-call",
    title: "Ensayar una llamada nocturna al 131 para Ana P.",
    context: "Ensayo V02 · 23:40 sintética · no activa el 131 real", risk: "A1",
    riskLabel: "Ensayo no operativo", due: "Ahora, dentro del ensayo",
    receiver: "Médico regulador simulado", revision: "S4", provenance: "Ensayo nocturno V02"
  };
  if (role === "medico-regulador" && called && !rescue) return {
    id: "E2E07-MR-01", scene: "e2e07-regulator",
    title: "Responder la llamada sintética y simular rescate",
    context: "HOD-2026-0129 · llamada de ensayo 23:40 · SatO₂ 92 % con agitación", risk: "A3",
    riskLabel: "Ensayo con umbral de 15 min", due: "Dentro de 15 min sintéticos",
    receiver: "SAMU simulado", revision: "S4", provenance: called.id
  };
  if (role === "samu" && rescue && !dispatchObserved && !dispatchBlocked) return {
    id: "E2E07-SA-01", scene: "e2e07-samu",
    title: "Registrar el resultado del despacho simulado",
    context: "Solicitud de ensayo con ubicación, situación y UEA receptora", risk: "A2",
    riskLabel: "Despacho simulado pendiente", due: "Antes de proyectar prealerta",
    receiver: "UEA simulada · regulador", revision: "S4", provenance: rescue.id
  };
  if (role === "receptor-uea" && dispatchObserved && !ueaAck) return {
    id: "E2E07-UEA-01", scene: "e2e07-uea",
    title: "Acusar la prealerta simulada del ensayo",
    context: "Prealerta creada sólo por despacho simulado observado", risk: "A3",
    riskLabel: "Acuse simulado pendiente", due: "Dentro del umbral del ensayo",
    receiver: "Médico regulador simulado", revision: "S4", provenance: dispatchObserved.id
  };
  return null;
}

function e2e07BannerHtml() {
  if (!e2e07IsRehearsal()) return "";
  return `<div class="context-banner attention" data-e2e07-rehearsal-banner role="status" aria-label="Ensayo nocturno V02 no operativo">
    <span><b>Ensayo nocturno V02 · no operativo</b></span>
    <span>Nada aquí envía una llamada, activa el 131 real, despacha SAMU real ni confirma atención.</span>
  </div>`;
}

function e2e07LogEntriesHtml() {
  if (!state.e2e07.log.length) return `<p>Sin hechos simulados todavía.</p>`;
  return `<ol>${state.e2e07.log.map((entry) => `<li data-e2e07-event
    data-e2e07-event-id="${esc(entry.id)}" data-e2e07-version="${esc(entry.version)}"
    data-e2e07-prior-version="${esc(entry.priorVersion)}" data-e2e07-actor="${esc(entry.actor)}"
    data-e2e07-at="${esc(entry.at)}" data-e2e07-origin="${esc(entry.origin)}"
    data-e2e07-outcome="${esc(entry.outcome)}" data-e2e07-intended-receiver="${esc(entry.intendedReceiver)}">
    v${esc(entry.version)} ← v${esc(entry.priorVersion)} · ${esc(entry.at)} · ${esc(entry.text)}</li>`).join("")}</ol>`;
}

function e2e07LogHtml() {
  if (!e2e07IsRehearsal() || !["cuidador", "medico-regulador", "samu", "receptor-uea"].includes(state.role)) return "";
  return `<details class="e2e08-log" aria-label="Traza técnica del ensayo E2E-07">
    <summary>Traza técnica del ensayo</summary>
    <div data-e2e07-log>${e2e07LogEntriesHtml()}</div>
  </details>`;
}

function e2e07RoleStatusHtml() {
  if (!e2e07IsRehearsal()) return "";
  const blocked = e2e07Event("simulated_dispatch_blocked");
  const ack = e2e07Event("simulated_prealert_acknowledged");
  let status = "";
  if (state.role === "medico-regulador" && blocked) status = `
    <section class="recovery-panel" data-e2e07-recovery role="alert" aria-label="Despacho simulado bloqueado, continuidad reguladora abierta">
      <h2>Despacho simulado bloqueado</h2>
      <dl><dt>Qué ocurrió</dt><dd>SAMU registró una falla dentro del ensayo; no se emitió prealerta.</dd>
        <dt>Qué se mantiene</dt><dd>El regulador permanece responsable; no existe acuse UEA ni recepción.</dd>
        <dt>Recuperación</dt><dd>Revisar el bloqueo y ensayar el canal alternativo sin convertir silencio en acuse.</dd></dl>
    </section>`;
  if (state.role === "medico-regulador" && ack) status = `
    <section class="outcome-receipt" data-e2e07-continuity role="status" aria-label="Acuse UEA simulado y continuidad reguladora">
      <h2>Acuse UEA simulado recibido</h2>
      <dl><dt>Qué ocurrió</dt><dd>UEA acusó la prealerta dentro del ensayo.</dd>
        <dt>Qué cambió</dt><dd>La permanencia reguladora puede cerrarse en el ensayo.</dd>
        <dt>Límite</dt><dd>No prueba llegada, traslado completado, recepción del paciente ni atención.</dd>
        <dt>Continuidad</dt><dd>El circuito real sigue sujeto a la activación institucional de V02.</dd></dl>
    </section>`;
  return status + e2e07LogHtml();
}

/* ================= SHELL ================= */

function navTargets(r) {
  return [r.extraNav, r.extraNav2, r.extraNav3, SEARCH_ACCESS.has(r.id) ? { id: "buscar", label: "Buscar" } : null]
    .filter(Boolean)
    .filter((n) => n.id !== "brechas" || GOVERNANCE_ACCESS.has(r.id));
}

function renderShell() {
  const r = roleDef();
  const careShell = CARE_UNIT.has(r.id);
  document.body.classList.toggle("force-mobile", state.device === "mobile");
  document.body.classList.toggle("force-desktop", state.device === "desktop");
  document.body.classList.toggle("care-unit", careShell);

  $("#role-select").value = state.role;
  $("#sim-select").value = state.sim;
  document.querySelectorAll(".mk-device").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.device === state.device))
  );

  const workLabel = WORK_TITLES[r.id] || "Tareas del día";
  const pending = workItems().length;
  const workCurrent = ["work", "scene", "case"].includes(state.view);
  const vistas = navTargets(r);
  const careIdentity = r.id === "paciente" ? "Hospitalización en casa · Día 4"
    : r.id === "conductor" ? `${r.fn} · sin datos clínicos`
    : r.fn;

  $("#app").innerHTML = `
    <header class="app-header">
      <div class="brand">
        <strong>HODOM</strong>
        <span class="tenant">${esc(TENANT)}</span>
        <span class="env-chip">${esc(ENV_NOTICE)}</span>
      </div>
      <div class="identity">
        <span class="who">${esc(r.person)}</span>
        <span class="fn-chip">${esc(careIdentity)}</span>
        <span class="cutoff-chip" title="Hora de actualización de los datos">Datos actualizados ${esc(CUTOFF)}</span>
      </div>
    </header>
    <div class="shell-body">
      ${careShell ? "" : `<aside class="app-side" aria-label="Secciones">
        <button class="side-goto" data-pal-open aria-label="Ir a cualquier vista, tarea o caso (atajo: Control+K)">
          <span>Ir a…</span><span class="side-kbd">Ctrl K</span>
        </button>
        <div class="side-sec">
          <div class="side-sec-name">Trabajo</div>
          <button class="side-item" data-nav="work" ${workCurrent ? 'aria-current="page"' : ""}>
            <span>${esc(workLabel)}</span>${pending ? `<span class="side-count" aria-label="${pending} pendientes">${pending}</span>` : ""}
          </button>
        </div>
        ${vistas.length ? `<div class="side-sec">
          <div class="side-sec-name">Vistas</div>
          ${vistas.map((n) => `<button class="side-item" data-nav="${esc(n.id)}" ${state.view === n.id ? 'aria-current="page"' : ""}><span>${esc(n.label)}</span></button>`).join("")}
        </div>` : ""}
      </aside>`}
      <div class="shell-main">
        ${careShell ? "" : `<nav class="app-nav" aria-label="Navegación principal">
          <button data-nav="work" ${state.view === "work" ? 'aria-current="page"' : ""}>${esc(workLabel)}</button>
          ${vistas.map((n) =>
            `<button data-nav="${esc(n.id)}" ${state.view === n.id ? 'aria-current="page"' : ""}>${esc(n.label)}</button>`
          ).join("")}
        </nav>`}
        <main class="app-main" id="main" tabindex="-1"></main>
      </div>
    </div>
    <div id="palette-host"></div>
  `;

  document.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", () => {
      state.view = b.dataset.nav;
      if (state.view === "work") state.sceneId = null;
      state.receipt = null; state.rejection = null; state.pendingConfirm = null;
      render();
    })
  );
  $("[data-pal-open]")?.addEventListener("click", openPalette);

  renderMain();
}

/* ================= ESTADOS SIMULADOS (ER-UX-005) ================= */

function simPanel() {
  const panels = {
    loading: `
      <div class="state-panel" role="status">
        <div class="state-kind">Cargando</div>
        <h2>Buscando la información más reciente…</h2>
        <p>Todavía no hay nada que mostrar. La identidad, el riesgo y las acciones aparecen recién cuando el sistema entrega los datos.</p>
        <div class="skeleton" aria-hidden="true"><div style="width:70%"></div><div style="width:45%"></div><div style="width:60%"></div></div>
      </div>`,
    empty: `
      <div class="state-panel">
        <div class="state-kind">Sin pendientes por ahora</div>
        <h2>No tiene tareas pendientes para su función en este momento</h2>
        <p>Función: <b>${esc(roleDef().fn)}</b> · datos actualizados ${esc(CUTOFF)}.</p>
        <p>Esto no significa que todo el trabajo esté hecho ni que no exista trabajo en la unidad.</p>
        <button class="btn" data-sim-exit>Actualizar</button>
      </div>`,
    denied: `
      <div class="state-panel attention">
        <div class="state-kind">Sin permiso</div>
        <h2>No tiene permiso para abrir esta tarea</h2>
        <div class="recovery-panel" style="margin-top:12px">
          <dl>
            <dt>Motivo</dt><dd>Esta tarea pertenece a un caso que no está asignado a su función.</dd>
            <dt>Qué se mantiene</dt><dd>La tarea sigue con su responsable; nada se modificó.</dd>
            <dt>Qué puede hacer</dt><dd>Pedir la asignación a coordinación, cambiar su función activa o avisar la inconsistencia.</dd>
          </dl>
        </div>
        <button class="btn" data-sim-exit>Volver a Mi trabajo</button>
      </div>`,
    conflict: `
      <div class="state-panel attention">
        <div class="state-kind">Información modificada</div>
        <h2>Esta información cambió mientras usted la revisaba</h2>
        <div class="recovery-panel" style="margin-top:12px">
          <dl>
            <dt>Versión actual</dt><dd>Versión 6 — coordinación reprogramó la ventana a las 08:11.</dd>
            <dt>Su acción</dt><dd>Quedó guardada sobre la versión 5; no se aplicó ni se perdió.</dd>
            <dt>Qué hacer</dt><dd>Revise la versión nueva y confirme si su acción sigue válida. Nada se sobreescribe en silencio.</dd>
          </dl>
        </div>
        <button class="btn primary" data-sim-exit>Ver versión vigente</button>
      </div>`,
    unavailable: `
      <div class="state-panel attention">
        <div class="state-kind">Sistema sin respuesta</div>
        <h2>El sistema no respondió dentro del tiempo esperado</h2>
        <p>No se supone nada: nada quedó enviado, recibido ni aceptado. La responsabilidad sigue donde estaba.</p>
        <p>Vuelva a intentar o use el canal alternativo declarado para este caso.</p>
        <button class="btn" data-sim-exit>Reintentar</button>
      </div>`
  };
  return panels[state.sim] || null;
}

function contextBanner() {
  if (e2e07IsRehearsal()) return e2e07BannerHtml();
  if (state.sim === "offline") {
    return `<div class="context-banner offline" role="status">
      <span><b>Sin conexión</b> · datos guardados en este equipo (${esc(CUTOFF)}).</span>
      <span>Cada tarea indica qué puede hacer ahora y qué quedará pendiente de envío. Nada se sobrescribe al reconectar.</span>
    </div>`;
  }
  if (state.sim === "stale") {
    return `<div class="context-banner offline" role="status">
      <span><b>Datos desactualizados</b> — esta información tiene 47 min y ya existe una versión más reciente.</span>
      <span>Actualice antes de tomar decisiones que dependen de información vigente.</span>
    </div>`;
  }
  return "";
}

/* ================= MI TRABAJO ================= */

/* Línea «ahora»: solo orientación y conteo. El porqué concreto vive una vez,
   dentro de la tarea prioritaria. */
function ahoraLine(items) {
  const nouns = {
    "medico-derivador": "postulaciones en su cola",
    "paciente": "cosas de su atención de hoy",
    "cuidador": "cosas de su apoyo de hoy"
  };
  const markers = {
    "medico-derivador": "Empiece por la primera",
    "paciente": "Empiece por lo principal",
    "cuidador": "Empiece por lo principal"
  };
  const noun = nouns[state.role] || "tareas pendientes";
  const marker = markers[state.role] || "Empiece por la más urgente";
  return `${items.length} ${noun} · ${marker}`;
}

/* Unidad de cuidado: los rótulos de gestión se traducen a lenguaje de
   cuidado (ER-UX-003); la semántica queda en el dato. */
const CARE_UNIT = new Set(["paciente", "cuidador"]);

function offlineCapability(w) {
  const s = sceneDef(w.scene);
  const primary = (s && s.actions || []).find((a) => a.kind === "primary" && a.availability !== "hidden");
  if (!primary || primary.availability !== "available") return { tone: "readonly", text: "Solo lectura sin conexión" };
  if (primary.mode === "reconcilable_write") return { tone: "available", text: "Disponible sin conexión · pendiente de envío" };
  if (primary.mode === "queued_intent") return { tone: "available", text: "Puede prepararla sin conexión · pendiente de envío" };
  return { tone: "online", text: "Necesita conexión para actuar" };
}

function offlineCapabilityHtml(w) {
  if (state.sim !== "offline") return "";
  const c = offlineCapability(w);
  return `<span class="offline-capability ${esc(c.tone)}">${esc(c.text)}</span>`;
}

function renderWork() {
  const items = workItems();
  const r = roleDef();
  const workTitle = WORK_TITLES[r.id] || "Tareas del día";
  const e2e08Active = state.e2e08.communication || state.e2e08.timeoutReached
    || state.e2e08.directConduct || state.e2e08.referralIntent;
  const e2e08Summary = e2e08Active ? e2e08SessionSummaryHtml() : "";
  const e2e08Continuation = e2e08Active ? e2e08RoleContinuationHtml() : "";
  const e2e08S3PrivateCopy = e2e08S3PrivateCopyHtml();
  const e2e08S3QueueSurface = e2e08S3QueueSurfaceHtml();
  const e2e01RoleStatus = e2e01RoleStatusHtml();
  const e2e07RoleStatus = e2e07RoleStatusHtml();

  const simHtml = simPanel();
  if (simHtml && state.sim !== "offline" && state.sim !== "stale") return simHtml;

  if (items.length === 0) {
    return `
      <h1 class="view-title">${workTitle}</h1>
      ${contextBanner()}
      ${e2e08S3PrivateCopy}
      ${e2e08Summary}
      ${e2e08Continuation}
      ${e2e08S3QueueSurface}
      ${e2e01RoleStatus}
      ${e2e07RoleStatus}
      <div class="state-panel">
        <div class="state-kind">Sin pendientes por ahora</div>
        <h2>No tiene tareas pendientes para su función en este momento</h2>
        <p>Función: <b>${esc(r.fn)}</b> · datos actualizados ${esc(CUTOFF)}.</p>
        <p>Esto no significa que todo el trabajo esté hecho ni que no exista trabajo en la unidad.</p>
        <button class="btn" data-refresh>Actualizar</button>
      </div>`;
  }

  /* work_one: una sola obligación → anuncio + navegación automática */
  if (items.length === 1) {
    const w = items[0];
    return `
      <h1 class="view-title">${workTitle}</h1>
      ${contextBanner()}
      ${e2e08S3PrivateCopy}
      ${e2e08Summary}
      ${e2e08Continuation}
      ${e2e01RoleStatus}
      ${e2e07RoleStatus}
      <div class="state-panel">
        <div class="state-kind">Una tarea pendiente</div>
        <h2>${esc(w.title)}</h2>
        <p>${esc(w.context)}</p>
        ${offlineCapabilityHtml(w)}
        <p>Esta es su única tarea pendiente.</p>
        <button class="btn primary" data-open="${esc(w.id)}"${e2e08S3OpenAttrs(w)}>Abrir la tarea</button>
      </div>`;
  }

  const care = CARE_UNIT.has(state.role);
  const lis = items.map((w, i) => `
    <li>
        <button class="work-item ${i === 0 ? "hero" : ""}" data-open="${esc(w.id)}"${e2e08S3OpenAttrs(w)}${w.id === "E2E08-MD-01" ? ' data-e2e08-task-role="direct"' : w.id === "E2E08-MR-01" ? ' data-e2e08-task-role="regulator"' : ""}>
        <span class="wi-top">
          <span class="wi-title">${esc(w.title)}</span>
          <span class="risk ${esc(w.risk)}">${care ? esc(state.role === "paciente" && w.risk === "A2" ? "Necesita su decisión" : w.riskLabel) : `${esc(w.risk)} · ${esc(w.riskLabel)}`}</span>
        </span>
        <span class="wi-context">${esc(w.context)}</span>
        ${WORK_CUES[w.id] ? `<span class="wi-cue">${esc(WORK_CUES[w.id])}</span>` : ""}
        ${offlineCapabilityHtml(w)}
        <span class="wi-meta wi-need">
          <span>${care ? "Cuándo" : "Plazo"}: ${esc(w.due)}</span>
          <span>${care ? "Quién responde" : "Responsable siguiente"}: ${esc(w.receiver)}</span>
        </span>
      </button>
    </li>`).join("");

  return `
    <h1 class="view-title">${workTitle}</h1>
    ${WORK_SUBTITLES[r.id] ? `<p class="view-subtitle">${esc(WORK_SUBTITLES[r.id])}</p>` : ""}
    ${contextBanner()}
    ${e2e08S3PrivateCopy}
    ${e2e08Summary}
    ${e2e08Continuation}
    ${e2e08S3QueueSurface}
    ${e2e01RoleStatus}
    ${e2e07RoleStatus}
    <p class="ahora-line">${esc(ahoraLine(items))}</p>
    <ul class="work-list">${lis}</ul>`;
}

function e2e08ActionById(sceneId, actId) {
  if (sceneId === "laboratorio-critico" && (actId === "communicate-success" || actId === "lab-informar")) {
    return { id: "communicate-success", label: "Confirmar comunicación con read-back del médico", kind: "primary", availability: "available", mode: "only_online", confirm: "La comunicación queda con hora, receptor y read-back registrado." };
  }
  if (sceneId === "laboratorio-critico" && actId === "communicate-failed") {
    return { id: actId, label: "Declarar que no hubo respuesta del receptor", kind: "exit", availability: "available", mode: "only_online", confirm: "La falta de respuesta queda registrada sin convertir la intención en recepción." };
  }
  if (sceneId === E2E08_MEDICAL_SCENE) {
    const actions = {
      "record-conduct": { id: actId, label: "Registrar interpretación y conducta médica", kind: "primary", availability: "available", mode: "only_online", confirm: "La conducta queda atribuida al médico de atención directa y separada de la comunicación." },
      "urgent-digital-referral": { id: actId, label: "Registrar derivación urgente terminal digital", kind: "exit", availability: "available", mode: "only_online", confirm: "Se registra la intención durable de derivar; la intención no es un outcome clínico." },
      "post-timeout-direct-attempt": { id: actId, label: "Registrar intento directo para reconciliación", kind: "primary", availability: "available", mode: "only_online", confirm: "El intento queda en reconciliación y no crea conducta clínica por sí solo." },
      "record-regulatory-conduct": { id: actId, label: "Registrar conducta reguladora", kind: "primary", availability: "available", mode: "only_online", confirm: "La conducta queda atribuida al médico regulador y conserva la versión reguladora." },
      "post-regulatory-direct-attempt": { id: actId, label: "Registrar intento directo sobre la versión reguladora", kind: "exit", availability: "available", mode: "only_online", confirm: "El intento se conserva como conflicto de versión sin sobrescribir la conducta reguladora." }
    };
    return actions[actId] || null;
  }
  return null;
}

function e2e08S3ActionById(actId) {
  const role = state.role;
  const occurrence = e2e08S3Occurrence();
  const actions = {
    "review-package": {
      id: actId, label: "Revisar suficiencia · criticalInstructionRevision E2E08-ORD-1 · nursingPlan v5 · 08:35", kind: "primary",
      confirm: "Clasifica la suficiencia del paquete y deja una revisión atribuida a Enfermería; no autoriza partida."
    },
    "review-package-missing": {
      id: actId, label: "Declarar paquete faltante · 08:35", kind: "exit",
      confirm: "Registra que el paquete está faltante; Coordinación debe retener VIS y no puede disponerla como suficiente."
    },
    "manifest-retain": {
      id: actId, label: "Mantener VIS en manifiesto M1 · 08:40", kind: "primary",
      confirm: "Revalida el basisToken de la review vigente y conserva la visita en M1; no autoriza salida total."
    },
    "record-critical-instruction": {
      id: actId, label: "Registrar instrucción crítica médica", kind: "primary",
      confirm: "Registra la revisión de instrucción crítica con autoría médica y packageImpact explícito."
    },
    "material-change": {
      id: actId,
      label: vehicleDeparture()?.type === "vehicle_departure_observed" ? "Declarar cambio material post-salida" : "Declarar cambio material pre-salida",
      kind: "exit",
      confirm: vehicleDeparture()?.type === "vehicle_departure_observed"
        ? "Conserva la partida y abre continuidades médica y coordinadora separadas."
        : "Invalida prospectivamente la review y la decisión dependiente sin sobrescribir sus hechos."
    },
    "cancelled_by_medical_order": {
      id: actId, label: "Cancelar VIS por orden médica urgente", kind: "exit",
      confirm: "Registra la orden médica de cancelación y mantiene el handoff A4 hasta su acuse."
    },
    "referral_intent": {
      id: actId, label: "Registrar referral intent urgente", kind: "exit",
      confirm: "Registra la intención de derivación separada; no afirma traslado, recepción ni cuidado realizado."
    },
    "vehicle_departure_observed": {
      id: actId, label: `Registrar vehicle_departure_observed · ${occurrence.vehicleLabel} ${occurrence.departureAt}`, kind: "primary",
      confirm: "Registra sólo el hito logístico de partida con la referencia causal visible."
    },
    "vehicle_departure_blocked": {
      id: actId, label: `Registrar vehicle_departure_blocked · ${occurrence.vehicleLabel} ${occurrence.departureAt}`, kind: "exit",
      confirm: "Registra sólo el bloqueo logístico de la partida y conserva la visita pendiente."
    },
    "coordination-ack-order": {
      id: actId, label: "Acusar orden médica urgente", kind: "primary",
      confirm: "Registra el acuse de Coordinación como hecho separado de retirar la VIS."
    },
    "coordination-withdraw-vis": {
      id: actId, label: "Retirar VIS del manifiesto", kind: "exit",
      confirm: "Registra el retiro de VIS del manifiesto como hecho separado del acuse."
    },
    "route-amendment-ack": {
      id: actId, label: "Acusar cambio logístico de ruta", kind: "primary",
      confirm: "Registra sólo el acuse logístico de la enmienda de ruta."
    },
    "route-amendment-failed": {
      id: actId, label: "Declarar falla del cambio logístico", kind: "exit",
      confirm: "Registra sólo la falla logística y deja la recuperación con Coordinación."
    },
    "initiate-route-amendment": {
      id: actId, label: "Iniciar route amendment de M1", kind: "primary",
      confirm: "Registra la enmienda logística como hecho separado del contacto con el conductor."
    },
    "contact-driver": {
      id: actId, label: "Registrar intento de contacto con conductor", kind: "primary",
      confirm: "Registra el intento de contacto como hecho separado de la enmienda de ruta."
    },
    "care-unit-message-acknowledge": {
      id: actId, label: "Acusar mensaje de cancelación", kind: "primary",
      confirm: "Registra care_unit_message_acknowledged; antes de este hecho no se afirma lectura."
    }
  };
  const review = currentPackageReview();
  const manifest = currentManifestDecision();
  const cancellation = e2e08S3UrgentCancellation();
  const pendingManifest = state.e2e08.manifestBasisToken
    && review && review.basisToken !== state.e2e08.manifestBasisToken;
  const allowed = {
    "review-package": role === "enfermero-clinico" && e2e08S3NeedsReview(),
    "review-package-missing": role === "enfermero-clinico" && e2e08S3NeedsReview(),
    "manifest-retain": role === "enfermera-coordinadora" && !cancellation && !e2e08S3ManifestIsValid() && (e2e08S3ReviewIsValid() || pendingManifest),
    "record-critical-instruction": role === "medico-atencion-directa" && !e2e08S3Entries().some((entry) => entry.type === "criticalInstructionRevision" && entry.status === "proposed"),
    "material-change": role === "medico-atencion-directa"
      && !e2e08S3HasType("material_change_declared") && !e2e08S3HasType("postdeparture_material_change"),
    "cancelled_by_medical_order": role === "medico-atencion-directa" && !cancellation,
    "referral_intent": role === "medico-atencion-directa" && Boolean(cancellation) && !e2e08S3ReferralIntent(),
    "vehicle_departure_observed": role === "conductor" && !vehicleDeparture() && e2e08S3ManifestIsValid() && !cancellation,
    "vehicle_departure_blocked": role === "conductor" && !vehicleDeparture() && e2e08S3ManifestIsValid() && !cancellation,
    "coordination-ack-order": role === "enfermera-coordinadora" && Boolean(cancellation) && !e2e08S3CoordinationAck(),
    "coordination-withdraw-vis": role === "enfermera-coordinadora" && Boolean(cancellation) && Boolean(e2e08S3CoordinationAck()) && !e2e08S3CoordinationWithdraw(),
    "initiate-route-amendment": role === "enfermera-coordinadora" && vehicleDeparture()?.type === "vehicle_departure_observed"
      && Boolean(cancellation) && Boolean(e2e08S3CoordinationWithdraw()) && !e2e08S3RouteAmendment(),
    "contact-driver": role === "enfermera-coordinadora" && Boolean(e2e08S3RouteAmendment()) && !e2e08S3DriverContact(),
    "route-amendment-ack": role === "conductor" && Boolean(e2e08S3RouteAmendment()) && !e2e08S3HasType("route-amendment-ack"),
    "route-amendment-failed": role === "conductor" && Boolean(e2e08S3RouteAmendment()) && !e2e08S3HasType("route-amendment-failed"),
    "care-unit-message-acknowledge": ["paciente", "cuidador"].includes(role) && Boolean(cancellation) && !e2e08S3CareAck()
  };
  if (actId === "manifest-retain" && role === "enfermera-coordinadora" && !cancellation && !manifest && !e2e08S3ReviewIsValid() && !pendingManifest) {
    return { ...actions[actId], kind: "exit", blocked: true, availability: "blocked_explainable", label: "Manifest-retain bloqueado: requiere review vigente", explanation: {
      cause: "No existe una review de Enfermería vigente para este manifiesto.",
      kept: "La visita permanece programada y no se agrega una decisión de manifiesto.",
      exit: "Abra Enfermería, clasifique suficiencia y vuelva a Coordinación."
    }};
  }
  if (!allowed[actId]) return null;
  if (actId === "manifest-retain" && pendingManifest) {
    return { ...actions[actId], kind: "exit", staleBasis: true, basisToken: state.e2e08.manifestBasisToken, label: "Revalidar manifiesto: basisToken obsoleto" };
  }
  return actions[actId];
}

function e2e08CurrentActionById(actId) {
  return e2e08S3ActionById(actId)
    || e2e08ActionById(state.sceneId, actId)
    || e2e08ActionById(E2E08_MEDICAL_SCENE, actId);
}

function e2e08S3ActionButtonHtml(action) {
  if (!action) return "";
  const cls = action.kind === "primary" ? "btn primary" : "btn exit";
  const interoperableAction = {
    "manifest-retain": "decide-vis-disposition",
    "vehicle_departure_observed": "departure-observed",
    "vehicle_departure_blocked": "departure-blocked",
    "cancelled_by_medical_order": "urgent-referral-intent",
    "referral_intent": "referral-intent",
    "coordination-ack-order": "coordination-ack-order",
    "coordination-withdraw-vis": "coordination-withdraw-vis",
    "initiate-route-amendment": "initiate-route-amendment",
    "contact-driver": "contact-driver",
    "route-amendment-ack": "route-amendment-ack",
    "route-amendment-failed": "route-amendment-failed"
  }[action.id] || action.id;
  const basis = action.id === "manifest-retain"
    ? (action.basisToken || currentPackageReview()?.basisToken || "") : "";
  const basisAttr = basis ? ` data-e2e08-basis-token="${esc(basis)}"` : "";
  const blockedAttr = action.blocked ? ' data-av="blocked_explainable"' : ' data-av="available"';
  return `<div class="action-item"><button class="${cls}" data-e2e08-s3-action="${esc(action.id)}" data-s3-action="${esc(interoperableAction)}" data-e2e08-action="${esc(action.id)}" data-action="${esc(interoperableAction)}"${basisAttr}${blockedAttr} aria-label="${esc(action.label)}" tabindex="0">${esc(action.label)}</button><span class="mode-note">requiere internet</span></div>`;
}

function e2e08S3ActionsHtml(ids, label = "Acciones S3", note = "") {
  const actions = ids.map((id) => e2e08S3ActionById(id)).filter(Boolean);
  if (!actions.length) return "";
  return `<section data-e2e08-s3="actions" data-scene-actions class="action-bar scene-actions" aria-label="${esc(label)}">${actions.map(e2e08S3ActionButtonHtml).join("")}${note ? `<p class="mode-note">${esc(note)}</p>` : ""}</section>`;
}

function e2e08S3HeaderHtml(title, subtitle, roleSafe = false) {
  const o = e2e08S3Occurrence();
  return `<button class="crumb" data-back>← ${esc(WORK_TITLES[state.role] || "Tareas del día")}</button>
    <h1 class="view-title">${esc(title)}</h1>
    <p class="view-subtitle">${esc(subtitle)}</p>
    <div class="resp-header"><div class="rh-line1"><span class="rh-person">${roleSafe ? "Móvil 1 · registro logístico" : esc(o.patient)}</span><span class="risk A4">${roleSafe ? "A1 · logística" : "A4 · continuidad"}</span></div>
      <div class="rh-grid">${roleSafe ? `<span>Ruta: <b>${esc(o.vehicleLabel)}</b></span>` : `<span>VIS: <b>${esc(o.id)}</b></span>`}<span>Unidad: <b>${esc(o.vehicleLabel)}</b></span><span>Ventana: <b>${esc(o.window)}</b></span></div></div>`;
}

function e2e08S3EventLogHtml() {
  if (["conductor", "paciente", "cuidador"].includes(state.role)) return "";
  const entries = e2e08S3Entries();
  return `<details class="e2e08-s3-log"><summary>Traza técnica S3 (solo para roles operativos)</summary><ol>${entries.map((entry) => `<li data-e2e08-s3-event data-e2e08-s3-entry data-e2e08-event-id="${esc(entry.id)}" data-e2e08-at="${esc(entry.at)}"><span>${esc(entry.at)}</span> · ${esc(entry.text)}</li>`).join("")}</ol></details>`;
}

function e2e08S3PackageHtml() {
  const o = e2e08S3Occurrence();
  const instruction = latestCriticalInstruction();
  const review = currentPackageReview();
  return `<section data-e2e08-s3="package" data-s3-review data-review-time="08:35" data-package-review="E2E08-REVIEW-0835" class="block" aria-label="Paquete de visita S3">
    <h2>Paquete ${esc(o.id)}</h2>
    <p>${esc(o.vehicleLabel)} · ventana ${esc(o.window)} · salida ${esc(o.departureAt)}.</p>
    <dl class="kv"><dt>criticalInstructionRevision</dt><dd>${esc(instruction?.revision || "E2E08-ORD-1")}</dd>
      <dt>nursingPlan</dt><dd>${esc(o.nursingPlan)}</dd>
      <dt>Review vigente</dt><dd>${!review ? "Pendiente; revisión programada 08:35, aún no registrada" : review.valid === false ? "Revisión invalidada; requiere nueva revisión" : review.status === "sufficient" ? "Suficiencia clasificada a las 08:35" : "Paquete faltante; requiere completar antes de disponer VIS"}</dd></dl>
    <div class="table-scroll"><table class="data"><tbody>
      <tr><th>Plan vigente</th><td>nursingPlan v5 con autoría propia</td></tr>
      <tr><th>Alarmas del episodio</th><td>Semáforo Amarillo · contacto 131 si escala</td></tr>
      <tr><th>Riesgo nocturno</th><td>N2</td></tr>
      <tr><th>Insumos</th><td>Insumos de curación y verificación de paquete</td></tr>
      <tr><th>Contactos</th><td>Coordinación y equipo médico responsable</td></tr>
    </tbody></table></div>
    <div data-e2e08-package-impact class="notice-info"><p class="notice-text"><b>packageImpact</b>: autoría médica de la instrucción crítica; el nursingPlan v5 conserva su propia autoría y referencias separadas.</p></div>
  </section>`;
}

function e2e08S3ReviewReceiptHtml() {
  const review = currentPackageReview();
  return `<div data-e2e08-s3="package-review-receipt" data-s3-receipt="package-review" data-review-receipt data-review-time="08:35" class="outcome-receipt" role="status" aria-label="Review de paquete registrada a las 08:35">
    <h2 tabindex="-1">Review registrada · 08:35</h2>
    <dl><dt>Qué ocurrió</dt><dd>La review de Enfermería clasificó el paquete como ${review?.status === "sufficient" ? "suficiente" : "faltante"} para ${esc(review?.instructionRevision || "E2E08-ORD-1")} y nursingPlan ${esc(review?.nursingPlan || "v5")}.</dd>
      <dt>Qué cambió</dt><dd>${review?.status === "sufficient" ? "La revisión quedó disponible para Coordinación con su basisToken" : "Coordinación debe retener VIS hasta que exista una nueva review suficiente"}; no cambia la partida.</dd>
      <dt>Límite</dt><dd>Review no equivale a autorización ni a registro de salida.</dd></dl>
  </div>`;
}

function e2e08S3ManifestHtml() {
  const o = e2e08S3Occurrence();
  const review = currentPackageReview();
  const decision = currentManifestDecision();
  const cancellation = e2e08S3UrgentCancellation();
  const token = review?.basisToken || "sin review vigente";
  const decisionLabel = cancellation
    ? "cancelada por orden médica; retención previa sin vigencia"
    : !decision ? "pendiente; aún no existe decisión de manifiesto"
      : decision.valid === false ? "invalidada prospectivamente" : "mantener VIS en M1";
  return `<section data-e2e08-s3="manifest" data-s3-manifest="M1" data-manifest="M1" class="block" aria-label="Manifiesto S3">
    <h2>Manifiesto de Coordinación</h2>
    <p>${cancellation ? `${esc(o.id)} cancelada por orden médica urgente; Coordinación conserva trazabilidad y debe retirar VIS.` : !review ? `${esc(o.id)} sin disposición: la review de Enfermería aún no existe.` : review.status !== "sufficient" ? `${esc(o.id)} retenida por paquete faltante; no puede disponerse en ${esc(o.vehicleLabel)}.` : !decision ? `${esc(o.id)} pendiente de disposición en ${esc(o.vehicleLabel)}; review suficiente vigente.` : `${esc(o.id)} se mantiene en ${esc(o.vehicleLabel)} con la decisión de 08:40.`}</p>
    <dl class="kv"><dt>VIS</dt><dd>${esc(o.id)}</dd><dt>Basis de review</dt><dd data-e2e08-s3="basis-token" data-e2e08-basis-token="${esc(token)}">${esc(token)}</dd>
      <dt>Decisión vigente</dt><dd>${decisionLabel}</dd></dl>
  </section>`;
}

function e2e08S3ManifestProjectionHtml() {
  const o = e2e08S3Occurrence();
  const departure = vehicleDeparture();
  const cancellation = e2e08S3UrgentCancellation();
  return `<section data-e2e08-s3="manifest-projection" class="block" aria-label="Proyección causal del manifiesto">
    <h2>Proyección causal de partida</h2>
    <p>${departure ? "vehicle_departure_observed" : "La ventana de partida"} ${esc(o.departureAt)} y ${esc(o.id)} permiten inferir el vínculo causal con el manifiesto y su review, con límites explícitos.</p>
    <p>No prueba identidad, integridad del envío, ejecución de la visita ni atención completada.</p>
  </section>
  <section data-e2e08-s3="visit-scheduled" class="block"><h2>${cancellation ? "Visita cancelada" : "Visita programada"}</h2><p>${cancellation ? `${esc(o.id)} fue cancelada por orden médica; la programación quedó cancelada.` : `${esc(o.id)} permanece programada para ${esc(o.window)}; la inferencia de partida no prueba atención.`}</p></section>`;
}

function e2e08S3CriticalInstructionHtml() {
  const instruction = latestCriticalInstruction();
  return `<section data-e2e08-s3="critical-instruction" class="block" aria-label="Instrucción crítica médica">
    <h2>criticalInstructionRevision ${esc(instruction?.revision || "E2E08-ORD-1")}</h2>
    <dl class="kv"><dt>Autoría</dt><dd>Autoría médica: médico de atención directa.</dd><dt>packageImpact</dt><dd>La instrucción crítica afecta el paquete; nursingPlan v5 sigue separado.</dd><dt>Próxima revisión</dt><dd>Potencial E2E08-ORD-2 si cambia materialmente el paquete; no se inventa una versión global posterior.</dd></dl>
  </section>`;
}

function e2e08S3InvalidationHtml() {
  const invalidation = e2e08S3Invalidation();
  if (!invalidation) return "";
  const reviewInvalidation = e2e08S3Latest("package_review_invalidated");
  const manifestInvalidation = e2e08S3Latest("manifest_decision_invalidated");
  return `<section data-e2e08-s3="predeparture-invalidation" class="recovery-panel" role="alert" aria-label="Invalidación pre-salida">
    <h2>Invalidación pre-salida</h2>
    <p>El cambio material de ${esc(invalidation.at)} invalida prospectivamente la review de Enfermería${reviewInvalidation ? ` (${esc(reviewInvalidation.refId)})` : ""} y la decisión de manifest${manifestInvalidation ? ` (${esc(manifestInvalidation.refId)})` : ""}.</p>
    <p>Los hechos se preservan como IDs inmutables en log append-only; no hay overwrite.</p>
  </section>
  <section data-e2e08-s3="reopen-sequence" class="block"><h2>Reapertura ordenada</h2><p>Primero Enfermería; luego Coordinación. La nueva review precede a toda nueva decisión.</p></section>`;
}

function e2e08S3BasisRecoveryHtml(context = {}) {
  if (!context.pendingToken && !state.e2e08.pendingBasisToken) return "";
  const o = e2e08S3Occurrence();
  const review = context.review || currentPackageReview();
  const previous = context.pendingToken || state.e2e08.pendingBasisToken || "basisToken no capturado";
  const current = review?.basisToken || "review vigente ausente";
  const conflict = previous !== current ? "Conflicto detectado: el basisToken capturado ya no coincide." : "La base fue revalidada sin conflicto.";
  return `<details data-e2e08-s3="basis-conflict-recovery" class="block"><summary>Ruta técnica de recovery por conflicto de basisToken</summary><p>${esc(conflict)} Se conserva el log append-only y no se escribe manifest_decision.</p><p>basisToken A: ${esc(previous)} · basisToken B: ${esc(current)}</p><p>eventId ${esc(E2E08_EVENT_ID)} · E2E08-ORD-1 · ${esc(o.id)} · IDs inmutables preservados.</p></details>`;
}

function e2e08S3DepartureReceiptHtml(kind) {
  const o = e2e08S3Occurrence();
  return `<div data-e2e08-s3="departure-receipt" data-s3-receipt="departure" class="outcome-receipt" role="status" aria-label="Receipt logístico de partida">
    <h2>${kind === "vehicle_departure_observed" ? "Partida observada" : "Partida bloqueada"} · ${esc(o.vehicleLabel)} ${esc(o.departureAt)}</h2>
    <p>${esc(kind)} registrado como hecho logístico. Referencia causal: manifest decision · review vigente.</p>
    <p>Este receipt no prueba identidad, integridad del envío, ejecución de la visita ni atención completada.</p>
    <details><summary>Secuencia temporal causal</summary><ol aria-label="Secuencia temporal causal"><li data-e2e08-s3-entry data-e2e08-at="08:14">08:14 · instrucción de origen</li><li data-e2e08-s3-entry data-e2e08-at="08:35">08:35 · revisión previa</li><li data-e2e08-s3-entry data-e2e08-at="08:40">08:40 · decisión logística</li><li data-e2e08-s3-entry data-e2e08-at="08:45">08:45 · hito de partida</li></ol></details>
  </div>`;
}

function e2e08S3UrgentHtml() {
  const cancellation = e2e08S3UrgentCancellation();
  if (!cancellation) return "";
  const referral = e2e08S3ReferralIntent();
  const ack = e2e08S3CoordinationAck();
  const o = e2e08S3Occurrence();
  return `<section data-e2e08-s3="urgent-cancellation" data-s3-receipt="medical-urgency" data-urgent-referral-intent class="recovery-panel" role="alert" aria-label="Cancelación urgente A4">
    <h2>Cancelación urgente · A4 · recovery y handoff</h2>
    <p><b>cancelled_by_medical_order</b> · ${esc(cancellation.at)} · orden médica con autoría preservada.</p>
    <p>${referral ? `<b>referral_intent</b> · ${esc(referral.at)} · intención separada de cualquier traslado.` : "El referral intent queda pendiente como hecho separado."}</p>
    <p>${ack ? "Coordinación acusó la orden; las continuidades siguientes siguen separadas." : "La recuperación médica A4 y el handoff siguen pendientes hasta acuse de Coordinación."} No se afirma cuidado, recepción ni evidencia de traslado.</p>
  </section>
  <section data-e2e08-s3="urgent-handoff" class="block"><h2>Handoff urgente ${ack ? "con acuse" : "pendiente"}</h2><p>${ack ? "El acuse quedó registrado; la continuidad siguiente permanece visible." : `La continuidad de ${esc(o.id)} requiere acuse explícito; cancelar ordinariamente no oculta este handoff.`}</p></section>
  <section data-e2e08-s3="continuity-medical" data-e2e08-causal-event-id="${esc((ack || cancellation).id)}" class="block"><h2>Continuidad médica</h2><p>Intento médico separado · ${ack ? "acuse registrado" : "acuse pendiente"} · falla posible · timeout declarado; no equivale a recepción ni cuidado realizado.</p></section>
  <section data-e2e08-s3="continuity-coordination" data-e2e08-causal-event-id="${esc((ack || cancellation).id)}" class="block"><h2>Continuidad coordinadora</h2><p>Intento de Coordinación separado · ${ack ? "acuse registrado" : "acuse pendiente"} · falla posible · timeout declarado; no equivale a retiro ni traslado.</p></section>`;
}

function e2e08S3PostDepartureMaterialHtml() {
  const change = e2e08S3Latest("postdeparture_material_change");
  if (!change) return "";
  return `<section data-e2e08-s3="postdeparture-material-change" class="recovery-panel" role="alert"><h2>Cambio material post-salida</h2><p>La partida M1 se conserva; no se invalidan retrospectivamente review ni manifiesto.</p></section>
    <section data-e2e08-s3="continuity-medical" data-e2e08-causal-event-id="${esc(change.id)}" class="block"><h2>Continuidad médica</h2><p>Intento médico post-salida · acuse pendiente · falla posible · timeout declarado.</p></section>
    <section data-e2e08-s3="continuity-coordination" data-e2e08-causal-event-id="${esc(change.id)}" class="block"><h2>Continuidad coordinadora</h2><p>Intento coordinador post-salida · acuse pendiente · falla posible · timeout declarado.</p></section>`;
}

function e2e08S3CoordinationUrgentHtml() {
  if (!e2e08S3UrgentCancellation()) return "";
  const ack = e2e08S3CoordinationAck();
  const withdraw = e2e08S3CoordinationWithdraw();
  return `<section data-e2e08-s3="coordination-urgent-cancellation" class="recovery-panel" role="alert" aria-label="Cancelación urgente coordinada">
    <h2>Coordinación: acuse y retiro separados</h2>
    <p>${ack ? `Acuse de orden médica registrado ${esc(ack.at)}.` : "Acuse de orden médica pendiente."}</p>
    <p>${withdraw ? `VIS retirada del manifiesto ${esc(withdraw.at)}.` : "Retiro de VIS del manifiesto pendiente."}</p>
  </section>
  ${withdraw ? `<section data-e2e08-s3="manifest-withdrawal" data-e2e08-event-id="${esc(withdraw.id)}" class="block"><h2>VIS retirada del manifiesto</h2><p>El retiro de ${esc(e2e08S3Occurrence().id)} quedó reconocido y separado del acuse en M1.</p></section>` : ""}
  <section data-e2e08-s3="urgent-handoff" class="block"><h2>Handoff urgente ${ack ? "con acuse" : "pendiente"}</h2><p>${ack ? "Acuse registrado: la continuidad siguiente queda a cargo del equipo correspondiente." : "El handoff urgente sigue visible y requiere acuse explícito."}</p></section>
  <section data-e2e08-s3="continuity-medical" data-e2e08-causal-event-id="${esc((ack || e2e08S3UrgentCancellation()).id)}" class="block"><h2>Continuidad médica</h2><p>Intento médico separado · ${ack ? "acuse registrado" : "acuse pendiente"} · falla posible · timeout declarado.</p></section>
  <section data-e2e08-s3="continuity-coordination" data-e2e08-causal-event-id="${esc((ack || e2e08S3UrgentCancellation()).id)}" class="block"><h2>Continuidad coordinadora</h2><p>Intento coordinador separado · ${ack ? "acuse registrado" : "acuse pendiente"} · falla posible · timeout declarado.</p></section>`;
}

function e2e08S3RouteHtml() {
  const departure = vehicleDeparture();
  const cancellation = e2e08S3UrgentCancellation();
  if (!cancellation || departure?.type !== "vehicle_departure_observed") return "";
  const route = e2e08S3RouteAmendment();
  const contact = e2e08S3DriverContact();
  return `<section data-e2e08-s3="route-amendment" data-s3-route-amendment data-route-amendment data-e2e08-causal-event-id="${esc((route || cancellation).id)}" class="block"><h2>Route amendment</h2><p>${route ? "Enmienda logística iniciada" : "Enmienda logística pendiente de iniciar"}; requiere acuse o declaración de falla del conductor.</p></section>
    <section data-e2e08-s3="contact" data-s3-contact data-contact-continuity data-e2e08-causal-event-id="${esc((contact || cancellation).id)}" class="block"><h2>Contacto</h2><p>${contact ? "Intento de contacto registrado" : "Intento de contacto pendiente"}; es un hecho separado de la route amendment.</p></section>`;
}

function e2e08S3DriverHtml() {
  const o = e2e08S3Occurrence();
  const departure = vehicleDeparture();
  const urgent = Boolean(e2e08S3UrgentCancellation());
  const routeReady = Boolean(e2e08S3RouteAmendment());
  const departureState = departure?.type === "vehicle_departure_observed"
    ? "Partida observada" : departure?.type === "vehicle_departure_blocked" ? "Partida bloqueada" : "Partida aún no observada ni bloqueada";
  return `${e2e08S3HeaderHtml("Móvil 1 · registro logístico", "Sólo hitos de partida y cambios de ruta; sin superficie clínica.", true)}
    <section data-e2e08-s3="departure-state" data-s3-departure="M1" class="block"><h2>Estado de partida</h2><p>${esc(departureState)} · unidad ${esc(o.vehicleLabel)} · hora declarada ${esc(o.departureAt)}.</p></section>
    <div class="block"><h2>Itinerario logístico</h2><p>Custodia logística declarada · Odómetro de salida como hito; nunca es bodega.</p><div class="table-scroll"><table class="data"><thead><tr><th>#</th><th>Unidad</th><th>Ventana</th><th>Estado</th></tr></thead><tbody><tr><td>1</td><td>${esc(o.vehicleLabel)}</td><td>${esc(o.window)}</td><td>${departure?.type === "vehicle_departure_observed" ? "Partida observada" : departure?.type === "vehicle_departure_blocked" ? "Partida bloqueada" : "Pendiente de hito"}</td></tr></tbody></table></div></div>
    ${urgent ? e2e08S3RouteHtml() : ""}
    ${departure || urgent ? "" : `<p class="notice-text">El conductor sólo registra vehicle_departure_observed o vehicle_departure_blocked; la unidad conserva sólo la referencia logística.</p>`}
    ${routeReady ? e2e08S3ActionsHtml(["route-amendment-ack", "route-amendment-failed"], "Cambio logístico de ruta") : !departure && !urgent ? e2e08S3ActionsHtml(["vehicle_departure_observed", "vehicle_departure_blocked"], "Partida M1", "se guarda sin señal y envía después") : ""}
    <div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
}

function renderE2E08S3Scene() {
  if (state.role === "enfermero-clinico") {
    return `${e2e08S3HeaderHtml("Revisión del paquete de VIS-ROSA-M1-0900", "Una obligación: revisar suficiencia antes de la partida.")}
      ${e2e08S3PackageHtml()}${e2e08S3InvalidationHtml()}
      ${e2e08S3ActionsHtml(["review-package", "review-package-missing"], "Revisión de Enfermería")}
      ${e2e08S3EventLogHtml()}<div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
  }
  if (state.role === "enfermera-coordinadora") {
    return `${e2e08S3HeaderHtml("Manifiesto de VIS-ROSA-M1-0900", "Una obligación: mantener o retener la visita en M1.")}
      ${e2e08S3ManifestHtml()}${e2e08S3ManifestProjectionHtml()}${e2e08S3CoordinationUrgentHtml()}${e2e08S3RouteHtml()}${e2e08S3PostDepartureMaterialHtml()}${e2e08S3BasisRecoveryHtml()}
      ${e2e08S3ActionsHtml(["manifest-retain", "coordination-ack-order", "coordination-withdraw-vis", "initiate-route-amendment", "contact-driver"], "Decisiones de Coordinación")}
      ${e2e08S3EventLogHtml()}<div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
  }
  if (state.role === "conductor") return e2e08S3DriverHtml();
  if (state.role === "medico-atencion-directa") {
    return `${e2e08S3HeaderHtml("Decisión médica sobre VIS-ROSA-M1-0900", "Una obligación: emitir instrucción o activar recovery urgente.")}
      ${e2e08S3CriticalInstructionHtml()}${e2e08S3UrgentHtml()}${e2e08S3PostDepartureMaterialHtml()}
      ${e2e08S3ActionsHtml(["record-critical-instruction", "material-change", "cancelled_by_medical_order", "referral_intent"], "Decisión médica")}
      ${e2e08S3EventLogHtml()}<div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
  }
  return `<div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
}

function e2e08LaboratoryActions() {
  if (state.e2e08.communication) return [];
  return [
    e2e08ActionById("laboratorio-critico", "communicate-success"),
    e2e08ActionById("laboratorio-critico", "communicate-failed")
  ];
}

function e2e08MedicalActions() {
  const s = state.e2e08;
  if (state.role === "medico-atencion-directa" && s.timeoutReached && !s.regulatoryConduct && !s.reconciliation) {
    return [e2e08ActionById(E2E08_MEDICAL_SCENE, "post-timeout-direct-attempt")];
  }
  if (state.role === "medico-atencion-directa" && s.regulatoryConduct && !s.conflict) {
    return [e2e08ActionById(E2E08_MEDICAL_SCENE, "post-regulatory-direct-attempt")];
  }
  if (state.role === "medico-atencion-directa" && s.communication === "success" && !s.directConduct && !s.referralIntent) {
    return [
      e2e08ActionById(E2E08_MEDICAL_SCENE, "record-conduct"),
      e2e08ActionById(E2E08_MEDICAL_SCENE, "urgent-digital-referral")
    ];
  }
  if (state.role === "medico-regulador" && s.timeoutReached && !s.regulatoryConduct) {
    return [e2e08ActionById(E2E08_MEDICAL_SCENE, "record-regulatory-conduct")];
  }
  return [];
}

function e2e08ActionButtonHtml(a) {
  if (!a) return "";
  const cls = a.kind === "primary" ? "btn primary" : "btn exit";
  return `<div class="action-item"><button class="${cls}" data-e2e08-action="${esc(a.id)}">${esc(a.label)}</button><span class="mode-note">requiere internet</span></div>`;
}

function renderE2E08MedicalScene() {
  const s = state.e2e08;
  const source = sceneDef("alerta-potasio");
  const alert = source.alerts[0];
  const figure = source.blocks.find((block) => block.type === "figure");
  const actions = e2e08MedicalActions().map(e2e08ActionButtonHtml).join("");
  return `<button class="crumb" data-back>← ${esc(WORK_TITLES[state.role] || "Tareas del día")}</button>
    <h1 class="view-title">${esc(source.title)}</h1>
    <div class="resp-header">
      <div class="rh-line1"><span class="rh-person">Rosa C. · 69 años</span><span class="risk A4">A4 · resultado crítico</span></div>
      <div class="rh-grid"><span>Caso: <b>${esc(s.caseId)}</b></span><span>Responsable: <b>${esc(s.intendedReceiver)}</b></span><span>Evento: <b>${esc(s.eventId)}</b></span></div>
    </div>
    <div class="alert A4">
      <div class="al-top"><span class="al-level">A4</span><span class="al-cond">${esc(alert.condition)}</span></div>
      <div class="alert-summary">
        <p><b>Qué hacer ahora</b><br>${esc(alert.action)}</p>
        <p class="alert-time"><b>Límite</b> · ${esc(String(alert.expiry).replace(/^Vence\s*:?[ ]*/i, ""))}</p>
      </div>
      <details class="alert-governance">
        <summary>Por qué aparece y cómo escala</summary>
        <dl><dt>Quién responde</dt><dd>${esc(alert.receptor)}</dd>
          <dt>Cuándo se apaga</dt><dd>${esc(alert.suppression)}</dd>
          <dt>Si no se resuelve</dt><dd>${esc(alert.escalation)}</dd>
          <dt>Respaldo</dt><dd>${esc(alert.authority)}</dd>
          <dt>Canal alternativo</dt><dd>${esc(alert.channel)}</dd></dl>
      </details>
    </div>
    <section data-scene-actions class="action-bar scene-actions critical-action-bar" aria-label="Acciones E2E-08">${actions}</section>
    <div class="scene-support">
      <div class="block figure-block"><p class="figure-value">${esc(figure.value)}</p><p class="figure-label">${esc(figure.label)}</p></div>
      ${e2e08SessionSummaryHtml()}
    </div>
    <div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
}

function e2e08ResultHeading(title) {
  return `<h2 tabindex="-1">${esc(title)}</h2>`;
}

function e2e08CommunicationSuccessHtml() {
  const s = state.e2e08;
  return `<div class="outcome-receipt" data-e2e08-receipt="communication" role="status" aria-label="Comunicación exitosa con receptor y read-back">
    ${e2e08ResultHeading("Comunicación registrada")}
    <dl><dt>Qué ocurrió</dt><dd>Laboratorio comunicó ${esc(s.result)} al médico con read-back confirmado ${esc(s.reportedAt)}.</dd>
      <dt>Qué cambió</dt><dd>La recepción humana queda confirmada y la obligación visible del médico queda activada; la conducta clínica todavía pertenece al médico.</dd>
      <dt>Responsable ahora</dt><dd>${esc(s.intendedReceiver)} (interpretación y conducta).</dd>
      <dt>Próximo paso</dt><dd>Registrar conducta antes de ${esc(s.timeoutAt)} o escalar al regulador.</dd></dl>
  </div>`;
}

function e2e08CommunicationFailureHtml() {
  const s = state.e2e08;
  return `<div class="recovery-panel" data-e2e08-recovery="communication" role="alert" aria-label="Comunicación fallida: recuperación con responsable y siguiente acción">
    ${e2e08ResultHeading("Comunicación sin respuesta")}
    <dl><dt>Responsable</dt><dd>Laboratorio conserva la responsabilidad hasta que exista recepción humana.</dd>
      <dt>Qué se mantiene</dt><dd>${esc(s.result)} publicado; intendedReceiver no equivale a recepción.</dd>
      <dt>Siguiente acción</dt><dd>Esperar respuesta por el canal declarado y escalar de forma unidireccional a las ${esc(s.timeoutAt)}.</dd></dl>
    <button class="btn exit" data-e2e08-action="timeout-0822">Alcanzar timeout ${esc(s.timeoutAt)}</button>
  </div>`;
}

function e2e08TimeoutHtml() {
  const s = state.e2e08;
  return `<div class="recovery-panel" data-e2e08-recovery="timeout" role="alert" aria-label="Timeout ${esc(s.timeoutAt)}: recuperación reguladora">
    ${e2e08ResultHeading(`Timeout ${s.timeoutAt} alcanzado`)}
    <dl><dt>Transición</dt><dd>La recuperación escala al médico regulador; la publicación y el fallo permanecen en el log.</dd>
      <dt>Conducta clínica</dt><dd>No registrada por este evento; queda pendiente de una decisión autorizada.</dd>
      <dt>Próximo paso</dt><dd>El regulador recibe la proyección para decidir y registrar su propia conducta.</dd></dl>
  </div>`;
}

function e2e08ReconciliationHtml() {
  return `<div class="recovery-panel" data-e2e08-reconciliation role="alert" aria-label="Intento directo post-timeout pendiente de reconciliación">
    ${e2e08ResultHeading("Intento directo en reconciliación")}
    <dl><dt>Qué ocurrió</dt><dd>El intento posterior al timeout queda registrado con su autoría, sin inventar conducta clínica.</dd>
      <dt>Qué se mantiene</dt><dd>La recuperación reguladora sigue pendiente; ninguna versión clínica fue sobrescrita.</dd>
      <dt>Próximo paso</dt><dd>El médico regulador debe decidir y registrar la conducta autorizada.</dd></dl>
  </div>`;
}

function e2e08DirectConductHtml() {
  const s = state.e2e08;
  return `<div class="outcome-receipt" data-clinical-outcome data-outcome-kind="clinical" role="status" aria-label="Conducta médica directa registrada">
    ${e2e08ResultHeading("Conducta médica registrada")}
    <dl><dt>Conducta</dt><dd>${esc(s.directConduct.text)}</dd>
      <dt>Autoría</dt><dd>Médico de atención directa; separada del receipt de comunicación.</dd>
      <dt>Próximo paso</dt><dd>Continuar vigilancia y reconciliar sólo nuevas versiones autorizadas.</dd></dl>
  </div>`;
}

function e2e08ReferralHtml() {
  return `<div class="outcome-receipt" data-e2e08-receipt="referral-intent" role="status" aria-label="Intención de derivación urgente terminal digital registrada">
    ${e2e08ResultHeading("Intención de derivación registrada")}
    <dl><dt>Qué ocurrió</dt><dd>Derivación urgente terminal digital registrada como intención durable.</dd>
      <dt>Qué cambió</dt><dd>El siguiente sistema recibe la intención; no se afirma recepción ni outcome clínico.</dd>
      <dt>Responsable ahora</dt><dd>Médico de atención directa hasta el handoff válido.</dd></dl>
  </div>`;
}

function e2e08RegulatoryConductHtml() {
  const s = state.e2e08;
  return `<div class="outcome-receipt" data-clinical-outcome data-outcome-kind="clinical" role="status" aria-label="Conducta reguladora registrada con autoría">
    ${e2e08ResultHeading("Conducta reguladora registrada")}
    <dl><dt>Conducta</dt><dd>${esc(s.regulatoryConduct.text)}</dd>
      <dt>Autoría</dt><dd>Médico regulador; esta versión no es reemplazable por un intento directo posterior.</dd>
      <dt>Próximo paso</dt><dd>Reconciliar cualquier intento concurrente sin overwrite.</dd></dl>
  </div>`;
}

function e2e08ConflictHtml() {
  return `<div class="recovery-panel" data-e2e08-conflict role="alert" aria-label="Conflicto de versión: conducta reguladora preservada">
    ${e2e08ResultHeading("Conflicto de versión")}
    <dl><dt>Qué ocurrió</dt><dd>El intento directo llegó después de la conducta reguladora.</dd>
      <dt>Qué se mantiene</dt><dd>La conducta reguladora conserva su autoría y contenido; no se sobrescribe.</dd>
      <dt>Próximo paso</dt><dd>Reconciliar las versiones con el responsable declarado.</dd></dl>
  </div>`;
}

function e2e08GuardHtml() {
  return `<div class="recovery-panel" role="alert" aria-label="Acción E2E-08 no autorizada para este actor">
    ${e2e08ResultHeading("Acción no autorizada")}
    <p>La sesión conserva el responsable vigente; este actor no puede registrar la conducta solicitada.</p>
  </div>`;
}

function e2e08ConfirmAction(actionId) {
  const s = state.e2e08;
  const host = $("#action-result");
  if (!host) return;
  if (e2e08S3ActionById(actionId)) {
    e2e08S3ConfirmAction(actionId);
    return;
  }
  let html = "";
  if ((actionId === "communicate-success" || actionId === "communicate-failed") && state.role === "laboratorio" && !s.communication) {
    s.communication = actionId === "communicate-success" ? "success" : "failed";
    e2e08AppendEvent(s.communication === "success" ? "communication_succeeded" : "communication_failed",
      s.communication === "success" ? "Comunicación confirmada por médico con read-back; conducta aún pendiente." : "Comunicación intentada sin respuesta humana; responsabilidad permanece en Laboratorio.",
      s.reportedAt);
    if (s.communication === "success") {
      state.done.add("OBL-LAB-01");
      html = e2e08CommunicationSuccessHtml();
    } else {
      state.done.add("OBL-LAB-01");
      html = e2e08CommunicationFailureHtml();
    }
  } else if (actionId === "record-conduct" && state.role === "medico-atencion-directa"
    && s.communication === "success" && !s.directConduct && !s.referralIntent) {
    s.directConduct = { text: "Interpretación médica registrada: resultado crítico confirmado; conducta directa atribuida al médico de atención directa." };
    e2e08AppendEvent("direct_conduct_recorded", "Conducta médica directa registrada con autoría; separada de la comunicación.", "08:05");
    html = e2e08DirectConductHtml() + nextStripHtml();
  } else if (actionId === "urgent-digital-referral" && state.role === "medico-atencion-directa"
    && s.communication === "success" && !s.directConduct && !s.referralIntent) {
    s.referralIntent = { text: "Derivación urgente terminal digital registrada como intención durable." };
    e2e08AppendEvent("urgent_referral_intent_recorded", "Intención de derivación urgente terminal digital registrada; sin outcome clínico.", "08:06");
    html = e2e08ReferralHtml();
  } else if (actionId === "post-timeout-direct-attempt" && state.role === "medico-atencion-directa"
    && s.timeoutReached && !s.regulatoryConduct && !s.reconciliation) {
    s.reconciliation = { text: "Intento directo posterior al timeout registrado para reconciliación." };
    e2e08AppendEvent("direct_attempt_reconciliation", "Intento directo posterior al timeout registrado para reconciliación; no se inventa conducta.");
    html = e2e08ReconciliationHtml();
  } else if (actionId === "record-regulatory-conduct" && state.role === "medico-regulador"
    && s.timeoutReached && !s.regulatoryConduct) {
    s.regulatoryConduct = { text: "Conducta reguladora registrada por el médico regulador tras escalamiento a las 08:22." };
    e2e08AppendEvent("regulatory_conduct_recorded", "Conducta reguladora registrada con autoría propia; se conserva la versión.", "08:23");
    html = e2e08RegulatoryConductHtml();
  } else if (actionId === "post-regulatory-direct-attempt" && state.role === "medico-atencion-directa"
    && s.regulatoryConduct && !s.conflict) {
    s.conflict = { text: "Intento directo posterior a conducta reguladora: conflicto de versión." };
    e2e08AppendEvent("direct_attempt_conflict", "Intento directo posterior a conducta reguladora retenido como conflicto; no overwrite.");
    html = e2e08ConflictHtml();
  } else {
    html = e2e08GuardHtml();
  }
  state.pendingConfirm = null;
  host.innerHTML = html;
  bindActionResultEvents();
  $("[data-open-next]")?.addEventListener("click", (event) => openObligation(event.currentTarget.dataset.openNext));
  focusActionResult();
}

function e2e08ApplyTimeout() {
  const s = state.e2e08;
  const allowed = new Set(["laboratorio", "medico-atencion-directa", "medico-regulador"]);
  if (!allowed.has(state.role) || !s.communication || s.directConduct || s.referralIntent || s.regulatoryConduct) return;
  if (!s.timeoutReached) {
    s.timeoutReached = true;
    e2e08AppendEvent("timeout_0822", "Timeout 08:22 alcanzado; escalamiento regulador habilitado sin conducta clínica inventada.", s.timeoutAt, {
      actor: "sistema",
      emitter: "Reloj sintético E2E-08",
      origin: E2E08_SESSION_ID,
      outcome: "escalamiento_regulador_habilitado"
    });
  }
  const host = $("#action-result");
  if (!host) {
    render();
    const heading = $("[data-e2e08-recovery=\"timeout\"] h2, [data-e2e08-recovery=\"timeout\"] h3");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
    return;
  }
  state.pendingConfirm = null;
  host.innerHTML = e2e08TimeoutHtml();
  bindActionResultEvents();
  focusActionResult();
}

function e2e07ActionById(actionId) {
  if (!e2e07IsRehearsal()) return null;
  const projection = e2e07ProjectionForRole();
  const actions = {
    "record-synthetic-131-call": {
      id: actionId, workId: "E2E07-CU-01", role: "cuidador",
      label: "Registrar llamada 131 sintética · 23:40", kind: "primary",
      confirm: "Registra una llamada dentro del ensayo; no activa ni envía nada al 131 real."
    },
    "simulate-rescue": {
      id: actionId, workId: "E2E07-MR-01", role: "medico-regulador",
      label: "Simular rescate y proyectar solicitud a SAMU", kind: "primary",
      confirm: "Registra un rescate simulado; no activa el 131 real ni despacha SAMU real."
    },
    "record-simulated-dispatch-observed": {
      id: actionId, workId: "E2E07-SA-01", role: "samu",
      label: "Registrar despacho simulado observado", kind: "primary",
      confirm: "Registra despacho simulado observado; no prueba ni confirma traslado, llegada o atención."
    },
    "record-simulated-dispatch-blocked": {
      id: actionId, workId: "E2E07-SA-01", role: "samu",
      label: "Registrar despacho simulado bloqueado", kind: "exit",
      confirm: "Registra despacho simulado bloqueado; no crea prealerta ni acuse y el regulador permanece responsable."
    },
    "acknowledge-simulated-prealert": {
      id: actionId, workId: "E2E07-UEA-01", role: "receptor-uea",
      label: "Acusar prealerta simulada", kind: "primary",
      confirm: "Registra un acuse simulado; no confirma llegada, traslado completado ni atención."
    }
  };
  const action = actions[actionId];
  return action && projection?.id === action.workId && state.role === action.role ? action : null;
}

function e2e07ActionButton(actionId) {
  const action = e2e07ActionById(actionId);
  if (!action) return "";
  const cls = action.kind === "primary" ? "btn primary" : "btn exit";
  return `<div class="action-item"><button class="${cls}" data-e2e07-action="${esc(action.id)}">${esc(action.label)}</button>
    <span class="mode-note">sólo ensayo · no operativo</span></div>`;
}

function renderE2E07Scene() {
  const sceneId = state.sceneId;
  let title = "Ensayo nocturno V02";
  let header = "";
  let content = "";
  let actions = "";
  let actionLabel = "Acciones del ensayo";
  if (sceneId === "e2e07-care-call" && state.role === "cuidador") {
    title = "Ensayar llamada nocturna al 131 — Ana P.";
    header = `<div class="resp-header"><div class="rh-line1"><span class="rh-person">Ana P. · ensayo 23:40</span><span class="risk A1">Ensayo no operativo</span></div>
      <div class="rh-grid"><span>Usted observa y llama; el equipo real no recibe nada desde esta maqueta.</span></div></div>`;
    content = `<div class="block"><h2>Qué se ensaya</h2><ul><li>La tarjeta real sigue indicando 131 ante el umbral nocturno.</li>
      <li>Este botón sólo registra un hecho sintético para recorrer las pantallas; no realiza una llamada.</li></ul></div>`;
    actions = e2e07ActionButton("record-synthetic-131-call");
  } else if (sceneId === "e2e07-regulator" && state.role === "medico-regulador") {
    title = "Llamada sintética de una cuidadora — 23:40";
    header = `<div class="resp-header"><div class="rh-line1"><span class="rh-person">Ana P. · HOD-2026-0129</span><span class="risk A3">A3 · ensayo con respuesta en 15 min</span></div>
      <div class="rh-grid"><span>Responsable: <b>Médico regulador simulado</b></span><span>Origen: E2E07-CALL-2340</span></div></div>`;
    content = `<div class="alert A3" role="alert"><div class="al-head"><span class="al-level">A3</span><span class="al-condition">Llamada sintética con umbral naranja</span></div>
      <div class="alert-summary"><p><b>Qué hacer ahora</b><br>Ensayar rescate con un límite de 15 min sintéticos.</p><p class="alert-time"><b>Límite</b> · 15 min</p></div></div>
      <div class="block notice-attention"><p class="notice-text">Brecha V02 pendiente de activación: es un flujo de ensayo, no una práctica demostrada.</p></div>
      <div class="block"><h2>Resumen clínico suficiente</h2><dl class="kv"><dt>Situación sintética</dt><dd>SatO₂ 92 % con agitación nueva</dd>
        <dt>Autoridad</dt><dd>El regulador sólo actúa dentro del ensayo; el circuito real sigue sin activación institucional demostrada.</dd></dl></div>`;
    actions = e2e07ActionButton("simulate-rescue");
    actionLabel = "Acción prioritaria del ensayo";
  } else if (sceneId === "e2e07-samu" && state.role === "samu") {
    title = "Solicitud de despacho simulada";
    header = `<div class="resp-header"><div class="rh-line1"><span class="rh-person">SAMU · ensayo V02</span><span class="risk A2">Despacho simulado pendiente</span></div>
      <div class="rh-grid"><span>Origen: <b>E2E07-RESCUE-2341</b></span><span>Receptor previsto: UEA HSC simulada</span></div></div>`;
    content = `<div class="block"><h2>Paquete mínimo del ensayo</h2><dl class="kv"><dt>Ubicación</dt><dd>Domicilio sintético con referencia de acceso</dd>
      <dt>Situación</dt><dd>Deterioro respiratorio sintético</dd><dt>Límite</dt><dd>Registrar observado o bloqueado; ninguno prueba traslado.</dd></dl></div>`;
    actions = e2e07ActionButton("record-simulated-dispatch-observed") + e2e07ActionButton("record-simulated-dispatch-blocked");
  } else if (sceneId === "e2e07-uea" && state.role === "receptor-uea") {
    title = "Prealerta simulada del ensayo";
    header = `<div class="resp-header"><div class="rh-line1"><span class="rh-person">UEA HSC · ensayo V02</span><span class="risk A3">Acuse simulado pendiente</span></div>
      <div class="rh-grid"><span>Origen: <b>E2E07-DISPATCH-OBSERVED-2342</b></span><span>Regulador simulado permanece hasta el acuse</span></div></div>`;
    content = `<div class="alert A3" role="alert"><div class="al-head"><span class="al-level">A3</span><span class="al-condition">Prealerta creada por despacho simulado observado</span></div>
      <div class="alert-summary"><p><b>Qué hacer ahora</b><br>Acusar dentro del ensayo.</p><p class="alert-time"><b>Límite</b> · antes del siguiente hito simulado</p></div></div>
      <div class="block"><h2>Lo que el acuse no demuestra</h2><p>No confirma llegada, recepción del paciente, traslado completado ni atención.</p></div>`;
    actions = e2e07ActionButton("acknowledge-simulated-prealert");
    actionLabel = "Acción prioritaria del ensayo";
  }
  return `<button class="crumb" data-back>← ${esc(WORK_TITLES[state.role] || "Tareas del día")}</button>
    <h1 class="view-title">${esc(title)}</h1>${e2e07BannerHtml()}${header}
    ${actions ? `<section data-scene-actions class="action-bar scene-actions" aria-label="${esc(actionLabel)}">${actions}</section>` : ""}
    <div class="scene-support">${content}</div>${e2e07LogHtml()}
    <div id="action-result" role="region" aria-label="Resultado de acción del ensayo E2E-07"></div>`;
}

function e2e07ReceiptHtml(actionId) {
  const receipts = {
    "record-synthetic-131-call": ["Llamada sintética registrada", "Se agregó un hecho de ensayo a las 23:40; no se llamó al 131 real.", "El médico regulador simulado recibe una obligación causal.", "Médico regulador simulado.", "Ensayar la decisión dentro del umbral."],
    "simulate-rescue": ["Rescate simulado solicitado", "El regulador agregó una solicitud dentro del ensayo.", "SAMU simulado recibe una obligación; UEA todavía no.", "Regulador simulado hasta el acuse UEA.", "SAMU registra despacho simulado observado o bloqueado."],
    "record-simulated-dispatch-observed": ["Despacho simulado observado", "SAMU registró el hito dentro del ensayo.", "Se crea una prealerta UEA simulada; no prueba traslado, llegada ni atención.", "Regulador simulado permanece hasta el acuse.", "UEA acusa o conserva la prealerta pendiente."],
    "acknowledge-simulated-prealert": ["Acuse simulado registrado", "UEA acusó la prealerta dentro del ensayo.", "El regulador ve cierre y continuidad; no se confirma llegada ni atención.", "Regulador simulado para el cierre de permanencia.", "Revisar la continuidad y el límite institucional V02."]
  };
  if (actionId === "record-simulated-dispatch-blocked") return `<div class="recovery-panel" role="alert" data-e2e07-action-recovery>
    <h2 tabindex="-1">Despacho simulado bloqueado</h2><dl><dt>Qué ocurrió</dt><dd>Se registró una falla de despacho dentro del ensayo.</dd>
    <dt>Qué se mantiene</dt><dd>El regulador permanece responsable; no hay prealerta ni acuse.</dd><dt>Recuperación</dt><dd>Ensayar el canal alternativo sin inventar recepción.</dd></dl></div>`;
  const receipt = receipts[actionId];
  return `<div class="outcome-receipt" role="status" aria-label="Resultado simulado del ensayo E2E-07"><h2 tabindex="-1">${esc(receipt[0])}</h2><dl>
    <dt>Qué ocurrió</dt><dd>${esc(receipt[1])}</dd><dt>Qué cambió</dt><dd>${esc(receipt[2])}</dd>
    <dt>Responsable ahora</dt><dd>${esc(receipt[3])}</dd><dt>Próximo paso</dt><dd>${esc(receipt[4])}</dd></dl></div>`;
}

function e2e07ConfirmAction(actionId) {
  const action = e2e07ActionById(actionId);
  if (!action) return;
  const records = {
    "record-synthetic-131-call": { id: "E2E07-CALL-2340", actor: "cuidador", at: "23:40", origin: "v02-rehearsal", outcome: "synthetic_131_call_recorded", intendedReceiver: "medico-regulador", text: "Llamada 131 sintética registrada; no se activó el 131 real." },
    "simulate-rescue": { id: "E2E07-RESCUE-2341", actor: "medico-regulador", at: "23:41", origin: "E2E07-CALL-2340", outcome: "simulated_rescue_requested", intendedReceiver: "samu", text: "Rescate simulado solicitado; sin despacho real." },
    "record-simulated-dispatch-observed": { id: "E2E07-DISPATCH-OBSERVED-2342", actor: "samu", at: "23:42", origin: "E2E07-RESCUE-2341", outcome: "simulated_dispatch_observed", intendedReceiver: "receptor-uea", text: "Despacho simulado observado; no prueba traslado." },
    "record-simulated-dispatch-blocked": { id: "E2E07-DISPATCH-BLOCKED-2342", actor: "samu", at: "23:42", origin: "E2E07-RESCUE-2341", outcome: "simulated_dispatch_blocked", intendedReceiver: "medico-regulador", text: "Despacho simulado bloqueado; sin prealerta ni acuse." },
    "acknowledge-simulated-prealert": { id: "E2E07-UEA-ACK-2343", actor: "receptor-uea", at: "23:43", origin: "E2E07-DISPATCH-OBSERVED-2342", outcome: "simulated_prealert_acknowledged", intendedReceiver: "medico-regulador", text: "Prealerta simulada acusada; no confirma llegada ni atención." }
  };
  e2e07AppendEvent(records[actionId]);
  state.pendingConfirm = null;
  state.confirmTrigger = null;
  render();
  const host = $("#action-result");
  if (!host) return;
  host.innerHTML = e2e07ReceiptHtml(actionId);
  focusActionResult();
}

/* ================= ESCENA ================= */

function renderScene() {
  if (String(state.sceneId || "").startsWith("e2e07-")) return renderE2E07Scene();
  if (String(state.sceneId || "").startsWith("e2e08-s3-")) return renderE2E08S3Scene();
  const s = sceneDef(state.sceneId);
  if (!s) return `<div class="state-panel"><h2>Escena no encontrada en la maqueta</h2></div>`;

  const simHtml = simPanel();
  if (simHtml && state.sim !== "offline" && state.sim !== "stale") return simHtml;
  if (state.sceneId === E2E08_MEDICAL_SCENE) return renderE2E08MedicalScene();

  const h = s.header;
  const person = h && h.person ? PEOPLE[h.person] : null;

  const headerHtml = h ? `
    <div class="resp-header">
      <div class="rh-line1">
        <span class="rh-person">${person ? `${esc(person.alias)} · ${person.age} años` : esc(s.title)}</span>
        <span class="risk ${esc(h.risk)}">${esc(h.risk)} · ${esc(h.riskText)}</span>
      </div>
      <div class="rh-grid">
        <span>Caso: <b>${esc(h.caseId)}</b></span>
        ${person ? `<span>Situación: <b>${esc(person.tag)}</b></span>` : ""}
        <span>Responsable: <b>${esc(h.responsible)}</b></span>
        <span>Versión ${esc(String(h.revision).replace("rev.", "").trim())}</span>
        <span>Origen: ${esc(h.provenance)}</span>
        ${h.cutoff && h.cutoff !== CUTOFF ? `<span>Datos actualizados ${esc(h.cutoff)}</span>` : ""}
      </div>
      ${CLINICAL_FICHA.has(state.role) && h.caseId && h.caseId.startsWith("HOD-") && typeof FICHAS !== "undefined" && FICHAS[h.caseId] ? `<div style="margin-top: var(--sp-2)"><button class="btn exit" data-ficha="${esc(h.caseId)}">Abrir ficha del caso</button></div>` : ""}
    </div>` : `
    <p class="view-meta">${esc(s.subtitle || "")}</p>`;

  const alerts = s.alerts || [];
  const alertsHtml = alerts.map((a) => `
    <div class="alert ${esc(a.level)}" role="alert">
      <div class="al-head">
        <span class="al-level">${esc(a.level)}</span>
        <span class="al-condition">${esc(a.condition)}</span>
      </div>
      <div class="alert-summary">
        <p><b>Qué hacer ahora</b><br>${esc(a.action)}</p>
        <p class="alert-time"><b>Límite</b> · ${esc(String(a.expiry).replace(/^Vence\s*:?[ ]*/i, ""))}</p>
      </div>
      <details class="alert-governance">
        <summary>Por qué aparece y cómo escala</summary>
        <dl>
          <dt>Quién responde</dt><dd>${esc(a.receptor)}</dd>
          <dt>Cuándo se apaga</dt><dd>${esc(a.suppression)}</dd>
          <dt>Si no se resuelve</dt><dd>${esc(a.escalation)}</dd>
          <dt>Respaldo</dt><dd>${esc(a.authority)}</dd>
          ${a.channel ? `<dt>Canal alternativo</dt><dd>${esc(a.channel)}</dd>` : ""}
        </dl>
      </details>
    </div>`).join("");

  /* si el último bloque es un aviso, va dentro de la barra de acciones:
     el estado del que se actúa y la acción forman una unidad visual */
  let blocks = [...(s.blocks || [])];
  let trailingNotice = null;
  if (blocks.length && blocks[blocks.length - 1].type === "notice") trailingNotice = blocks.pop();

  const blocksHtml = blocks.map((b) => {
    if (b.type === "notice") {
      return `<div class="block notice-${esc(b.tone)}"><p class="notice-text">${esc(b.text)}</p></div>`;
    }
    if (b.type === "figure") {
      return `<div class="block figure-block"><p class="figure-value">${esc(b.value)}</p><p class="figure-label">${esc(b.label)}</p></div>`;
    }
    if (b.type === "link") {
      return `<div class="block"><p class="notice-text" style="margin-bottom: var(--sp-2)">${esc(b.text)}</p><button class="btn" data-goto="${esc(b.nav)}">${esc(b.label)}</button></div>`;
    }
    if (b.type === "section") {
      return `<div class="block"><h2>${esc(b.heading)}</h2><ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
    }
    if (b.type === "kvgrid") {
      return `<div class="block"><h2>${esc(b.heading)}</h2><dl class="kv">${b.items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>`;
    }
    if (b.type === "table") {
      return `<div class="block"><h2>${esc(b.heading)}</h2><div class="table-scroll" role="region" aria-label="${esc(b.heading)}" tabindex="0"><table class="data">
        <thead><tr>${b.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div></div>`;
    }
    return "";
  }).join("");

  /* acciones: a lo sumo una primaria; hidden_by_policy no se serializa */
  const offline = state.sim === "offline";
  const e2e08Lab = state.sceneId === "laboratorio-critico";
  const acts = e2e08Lab ? e2e08LaboratoryActions() : (s.actions || []).filter((a) => a.availability !== "hidden");
  const actionRows = acts.map((a) => {
    let av = a.availability;
    if (offline && av === "available" && a.mode === "only_online") av = "blocked_explainable";
    const cls = av === "blocked_explainable" ? "btn blocked" : a.kind === "primary" ? "btn primary" : "btn exit";
    const note = av === "blocked_explainable"
      ? `<span class="mode-note">${a.explanation && !offline ? "ver requisito pendiente" : "necesita conexión · ver motivo"}</span>`
      : a.mode ? `<span class="mode-note">${esc({ only_online: "requiere internet", reconcilable_write: "se guarda sin señal y envía después", queued_intent: "se envía al recuperar señal" }[a.mode] || a.mode)}</span>` : "";
    const dataAct = e2e08Lab && a.id === "communicate-success" ? "lab-informar" : a.id;
    const e2eAttr = e2e08Lab ? ` data-e2e08-action="${esc(a.id)}"` : "";
    return { kind: a.kind, html: `<div class="action-item"><button class="${cls}" data-act="${esc(dataAct)}"${e2eAttr} data-av="${esc(av)}">${esc(a.label)}</button>${note}</div>` };
  });
  const actionFirst = alerts.some((a) => a.level === "A3" || a.level === "A4");
  const criticalActionsHtml = actionFirst ? actionRows.map((r) => r.html).join("") : "";
  const lowerActionsHtml = actionFirst ? "" : actionRows.map((r) => r.html).join("");
  const noteHtml = s.note ? `<p class="action-note">${esc(s.note)}</p>` : "";
  const noticeHtml = trailingNotice ? `<div class="action-notice notice-${esc(trailingNotice.tone)}">${esc(trailingNotice.text)}</div>` : "";
  const lowerBarHtml = lowerActionsHtml || (!actionFirst && noticeHtml) || noteHtml ? `
    <section${!actionFirst ? " data-scene-actions" : ""} class="action-bar${!actionFirst ? " scene-actions" : ""}" aria-label="Acciones autorizadas">
      ${actionFirst ? "" : noticeHtml}
      ${lowerActionsHtml}
      ${noteHtml}
    </section>` : "";

  return `
    <button class="crumb" data-back>← ${esc(WORK_TITLES[state.role] || "Tareas del día")}</button>
    <h1 class="view-title">${esc(s.title)}</h1>
    ${contextBanner()}
    ${headerHtml}
    ${alertsHtml}
    ${criticalActionsHtml ? `<section data-scene-actions class="action-bar scene-actions critical-action-bar" aria-label="Acciones autorizadas, con acción prioritaria">${noticeHtml}${criticalActionsHtml}${noteHtml}</section>` : ""}
    <div class="scene-support">${blocksHtml}</div>
    ${lowerBarHtml}
    ${e2e08Lab ? e2e08SessionSummaryHtml() : ""}
    <div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
}

/* ================= RESULTADOS DE ACCIÓN ================= */

function actionById(sceneId, actId) {
  const e2e08Action = e2e08ActionById(sceneId, actId);
  if (e2e08Action) return e2e08Action;
  const s = sceneDef(sceneId);
  return (s && s.actions || []).find((a) => a.id === actId);
}

function renderConfirm(a) {
  const offlineQueued = state.sim === "offline" && (a.mode === "reconcilable_write" || a.mode === "queued_intent");
  const basis = state.e2e08?.pendingBasisToken;
  const basisAttr = basis ? ` data-e2e08-basis-token="${esc(basis)}"` : "";
  return `
    <div class="confirm-strip" role="group" aria-label="Confirmación">
      <p><b>Confirmar:</b> ${esc(a.confirm || "Confirme la acción.")}</p>
      ${offlineQueued ? `<p>Quedará <b>guardada para enviar al recuperar señal</b> (con la clave de seguridad que evita duplicar la acción). Guardada o enviándose no significa confirmada.</p>` : ""}
      <button class="btn primary" data-confirm="${esc(a.id)}"${basisAttr}>Confirmar</button>
      <button class="btn exit" data-cancel>Cancelar</button>
    </div>`;
}

function renderRecovery(expl, title = "Acción no disponible — con explicación y salida") {
  return `
    <div class="recovery-panel" role="alert" aria-label="${esc(title)}">
      <h3>${esc(title)}</h3>
      <dl>
        <dt>Motivo</dt><dd>${esc(expl.cause)}</dd>
        <dt>Qué se mantiene</dt><dd>${esc(expl.kept)}</dd>
        <dt>Qué puede hacer</dt><dd>${esc(expl.exit)}</dd>
      </dl>
    </div>`;
}

function renderReceipt(a) {
  const o = a.outcome;
  return `
    <div class="outcome-receipt" role="status" aria-label="Resultado de acción confirmado">
      <h2 tabindex="-1">${a.immediate ? "Registrado" : "Confirmado"}</h2>
      <dl>
        <dt>Qué ocurrió</dt><dd>${esc(o.happened)}</dd>
        <dt>Qué cambió</dt><dd>${esc(o.changed)}</dd>
        <dt>Responsable ahora</dt><dd>${esc(o.responsible)}</dd>
        <dt>Próximo paso</dt><dd>${esc(o.next)}</dd>
      </dl>
    </div>`;
}

function focusActionResult() {
  const heading = $("#action-result")?.querySelector("h2, h3");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}

function e2e08S3Commit(html, actionId) {
  state.pendingConfirm = null;
  state.confirmTrigger = null;
  state.e2e08.pendingActionId = null;
  state.e2e08.pendingBasisToken = null;
  state.e2e08.pendingBasisReviewId = null;
  if (actionId === "manifest-retain") {
    state.e2e08.manifestBasisToken = null;
    state.e2e08.manifestBasisReviewId = null;
  }
  render();
  const host = $("#action-result");
  if (!host) return;
  const marker = /data-e2e08-s3="([^"]+)"/.exec(html)?.[1];
  const renderedState = marker
    ? [...document.querySelectorAll("[data-e2e08-s3]")]
      .find((node) => node.dataset.e2e08S3 === marker && !host.contains(node))
    : null;
  if (renderedState) {
    const heading = renderedState.querySelector("h2, h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
    return;
  }
  host.innerHTML = html;
  bindActionResultEvents();
  focusActionResult();
}

function e2e08S3ConfirmAction(actionId) {
  const o = e2e08S3Occurrence();
  let html = "";
  if (["review-package", "review-package-missing"].includes(actionId) && state.role === "enfermero-clinico" && e2e08S3NeedsReview()) {
    const id = e2e08S3NextId("E2E08-REVIEW-0835", "package_review");
    const sufficient = actionId === "review-package";
    e2e08S3AppendEvent({
      id, type: "package_review", at: "08:35", actor: "enfermero-clinico", emitter: "Enfermería clínica",
      intendedReceiver: "enfermera-coordinadora", origin: "package-review", outcome: sufficient ? "package_review_sufficient" : "package_review_missing",
      status: sufficient ? "sufficient" : "missing", review: sufficient ? "sufficient" : "missing", basisToken: e2e08S3BasisToken(),
      instructionRevision: latestCriticalInstruction()?.revision || "E2E08-ORD-1", nursingPlan: "v5",
      text: `Review de paquete ${id} a las 08:35 · ${sufficient ? "suficiencia clasificada" : "paquete faltante"} · no autoriza partida.`
    });
    html = e2e08S3ReviewReceiptHtml();
  } else if (actionId === "manifest-retain" && state.role === "enfermera-coordinadora" && !e2e08S3UrgentCancellation() && !e2e08S3ManifestIsValid()) {
    const review = currentPackageReview();
    const pendingToken = state.e2e08.manifestBasisToken || state.e2e08.pendingBasisToken;
    if (!review || review.valid === false || !pendingToken || pendingToken !== review.basisToken) {
      html = e2e08S3BasisRecoveryHtml({ pendingToken, review });
    } else {
      const id = e2e08S3NextId("E2E08-MANIFEST-M1-0840", "manifest_decision");
      e2e08S3AppendEvent({
        id, type: "manifest_decision", at: "08:40", actor: "enfermera-coordinadora", emitter: "Coordinación",
        intendedReceiver: "conductor", origin: "manifest", outcome: "manifest_retained",
        status: "retained", basisToken: review.basisToken,
        reviewId: review.id, visitId: o.id, vehicle: o.vehicle,
        text: `Manifest decision ${id}: mantener ${o.id} en ${o.vehicleLabel}; review ${review.id} referenciada.`
      });
      html = `<div data-e2e08-s3="manifest-decision-receipt" data-s3-receipt="vis-disposition" data-vis-disposition-receipt class="outcome-receipt" role="status" aria-label="Decisión de manifiesto registrada"><h2 tabindex="-1">Manifiesto conservado · 08:40</h2><p>Se conserva ${esc(o.id)} en ${esc(o.vehicleLabel)} con referencia a la review vigente; la decisión no autoriza una salida total.</p></div>`;
    }
  } else if (actionId === "record-critical-instruction" && state.role === "medico-atencion-directa") {
    e2e08S3AppendEvent({
      id: "E2E08-ORD-2", type: "criticalInstructionRevision", at: "08:14", actor: "medico-atencion-directa",
      emitter: "Médico de atención directa", intendedReceiver: "enfermero-clinico", origin: "medical-order",
      outcome: "critical_instruction_revision_proposed", status: "proposed", revision: "E2E08-ORD-2",
      supersedes: "E2E08-ORD-1", packageImpact: "Revisión potencial de instrucción crítica; nursingPlan v5 queda separado",
      text: "Potencial E2E08-ORD-2 propuesto por autoría médica para revisión del packageImpact; no se inventa una versión global posterior."
    });
    html = `<div data-e2e08-s3="critical-instruction" class="outcome-receipt" role="status" aria-label="Instrucción crítica registrada"><h2 tabindex="-1">criticalInstructionRevision E2E08-ORD-1</h2><p>Conducta con autoría médica y packageImpact explícito; potencial E2E08-ORD-2 bajo revisión, sin inventar una versión global posterior.</p></div>`;
  } else if (actionId === "material-change" && state.role === "medico-atencion-directa") {
    const departure = vehicleDeparture();
    if (departure?.type === "vehicle_departure_observed") {
      e2e08S3AppendEvent({
        id: "E2E08-POSTDEPARTURE-MATERIAL-CHANGE-0846", type: "postdeparture_material_change", at: "08:46",
        actor: "medico-atencion-directa", emitter: "Médico de atención directa", intendedReceiver: "enfermera-coordinadora",
        origin: "postdeparture", outcome: "postdeparture_continuities_opened", departureId: departure.id,
        text: "Cambio material post-salida: partida M1 preservada; continuidades médica y coordinadora abiertas sin invalidación retrospectiva."
      });
      html = e2e08S3PostDepartureMaterialHtml();
    } else {
      const review = currentPackageReview();
      const manifest = currentManifestDecision();
      e2e08S3AppendEvent({
        id: "E2E08-MATERIAL-CHANGE-0842", type: "material_change_declared", at: "08:42",
        actor: "medico-atencion-directa", emitter: "Médico de atención directa", intendedReceiver: "enfermero-clinico",
        origin: "predeparture", outcome: "material_change_predeparture_declared",
        text: "Cambio material pre-salida declarado; los hechos dependientes existentes deben reabrirse sin overwrite."
      });
      if (review) e2e08S3AppendEvent({
        id: "E2E08-REVIEW-INVALIDATED-0842", type: "package_review_invalidated", at: "08:42",
        actor: "sistema", emitter: "Validador S3", intendedReceiver: "enfermero-clinico", origin: "predeparture",
        outcome: "package_review_invalidated_prospectively", refId: review.id,
        text: "Review de Enfermería invalidada prospectivamente antes de salir; hecho original preservado."
      });
      if (manifest) e2e08S3AppendEvent({
        id: "E2E08-MANIFEST-INVALIDATED-0842", type: "manifest_decision_invalidated", at: "08:42",
        actor: "sistema", emitter: "Validador S3", intendedReceiver: "enfermera-coordinadora", origin: "predeparture",
        outcome: "manifest_decision_invalidated_prospectively", refId: manifest.id,
        text: "Decisión de manifiesto invalidada prospectivamente; el evento previo queda inmutable y sin overwrite."
      });
      html = e2e08S3InvalidationHtml();
    }
  } else if (["vehicle_departure_observed", "vehicle_departure_blocked"].includes(actionId) && state.role === "conductor") {
    const observed = actionId === "vehicle_departure_observed";
    e2e08S3AppendEvent({
      id: `E2E08-${observed ? "DEPARTURE-OBSERVED" : "DEPARTURE-BLOCKED"}-0845`,
      type: actionId, at: o.departureAt, actor: "conductor", emitter: "Conductor M1", intendedReceiver: "enfermera-coordinadora",
      origin: "vehicle", outcome: actionId, status: observed ? "observed" : "blocked", visitId: o.id, vehicle: o.vehicle,
      text: `${actionId} ${o.vehicleLabel} ${o.departureAt}; referencia causal ${o.id} y manifest decision.`
    });
    html = e2e08S3DepartureReceiptHtml(actionId);
  } else if (actionId === "cancelled_by_medical_order" && state.role === "medico-atencion-directa") {
    e2e08S3AppendEvent({
      id: "E2E08-CANCELLED-BY-MEDICAL-ORDER-0846", type: actionId, at: "08:46",
      actor: "medico-atencion-directa", emitter: "Médico de atención directa", intendedReceiver: "enfermera-coordinadora",
      origin: "medical-order", outcome: actionId, status: "urgent_handoff_pending", visitId: o.id,
      text: "cancelled_by_medical_order: VIS cancelada por orden médica urgente; handoff A4 pendiente de acuse."
    });
    html = e2e08S3UrgentHtml();
  } else if (actionId === "referral_intent" && state.role === "medico-atencion-directa") {
    e2e08S3AppendEvent({
      id: "E2E08-REFERRAL-INTENT-0847", type: actionId, at: "08:47",
      actor: "medico-atencion-directa", emitter: "Médico de atención directa", intendedReceiver: "enfermera-coordinadora",
      origin: "medical-order", outcome: actionId, status: "intent_recorded", visitId: o.id,
      text: "referral_intent: intención de derivación urgente registrada separada de cancelación; sin traslado afirmado."
    });
    html = e2e08S3UrgentHtml();
  } else if (actionId === "coordination-ack-order" && state.role === "enfermera-coordinadora") {
    e2e08S3AppendEvent({
      id: "E2E08-COORDINATION-ACK-0848", type: actionId === "coordination-ack-order" ? "coordination_acknowledged_medical_order" : actionId,
      at: "08:48", actor: "enfermera-coordinadora", emitter: "Coordinación", intendedReceiver: "medico-atencion-directa",
      origin: "urgent-handoff", outcome: "coordination_acknowledged_medical_order", visitId: o.id,
      text: "Acuse de orden médica urgente registrado por Coordinación; retiro de VIS queda separado."
    });
    html = e2e08S3CoordinationUrgentHtml();
  } else if (actionId === "coordination-withdraw-vis" && state.role === "enfermera-coordinadora") {
    e2e08S3AppendEvent({
      id: "E2E08-COORDINATION-WITHDRAW-0849", type: "coordination_withdraw_vis",
      at: "08:49", actor: "enfermera-coordinadora", emitter: "Coordinación", intendedReceiver: "conductor",
      origin: "manifest", outcome: "coordination_withdraw_vis", visitId: o.id,
      text: "VIS retirada del manifiesto por Coordinación como hecho separado del acuse de orden médica."
    });
    html = e2e08S3CoordinationUrgentHtml();
  } else if (actionId === "initiate-route-amendment" && state.role === "enfermera-coordinadora") {
    e2e08S3AppendEvent({
      id: "E2E08-ROUTE-AMENDMENT-INITIATED-0850", type: "route_amendment_initiated", at: "08:50",
      actor: "enfermera-coordinadora", emitter: "Coordinación", intendedReceiver: "conductor",
      origin: "route-amendment", outcome: "route_amendment_initiated", departureId: vehicleDeparture()?.id,
      text: "Route amendment iniciada por Coordinación después de partida; contacto sigue como hecho separado."
    });
    html = e2e08S3RouteHtml();
  } else if (actionId === "contact-driver" && state.role === "enfermera-coordinadora") {
    e2e08S3AppendEvent({
      id: "E2E08-DRIVER-CONTACT-ATTEMPTED-0851", type: "driver_contact_attempted", at: "08:51",
      actor: "enfermera-coordinadora", emitter: "Coordinación", intendedReceiver: "conductor",
      origin: "contact", outcome: "contact_attempt_recorded", routeAmendmentId: e2e08S3RouteAmendment()?.id,
      text: "Intento de contacto con conductor registrado separado de route amendment; acuse pendiente."
    });
    html = e2e08S3RouteHtml();
  } else if (["route-amendment-ack", "route-amendment-failed"].includes(actionId) && state.role === "conductor") {
    e2e08S3AppendEvent({
      id: `E2E08-ROUTE-AMENDMENT-${actionId === "route-amendment-ack" ? "ACK" : "FAILED"}-0850`, type: actionId,
      at: "08:50", actor: "conductor", emitter: "Conductor M1", intendedReceiver: "enfermera-coordinadora",
      origin: "route-amendment", outcome: actionId, text: `${actionId} registrado como cambio logístico de ruta; sin datos clínicos.`
    });
    html = `<div class="outcome-receipt" role="status"><h2 tabindex="-1">Cambio logístico registrado</h2><p>${esc(actionId)} quedó registrado; Coordinación conserva la recuperación.</p></div>`;
  } else if (actionId === "care-unit-message-acknowledge" && ["paciente", "cuidador"].includes(state.role)) {
    e2e08S3AppendEvent({
      id: "E2E08-CARE-UNIT-MESSAGE-ACK-0851", type: "care_unit_message_acknowledged", at: "08:51",
      actor: state.role, emitter: roleDef()?.label || state.role, intendedReceiver: "enfermera-coordinadora",
      origin: "care-unit-message", outcome: "care_unit_message_acknowledged", text: "care_unit_message_acknowledged registrado; la continuidad queda a cargo del equipo médico."
    });
    html = `<div class="outcome-receipt" role="status"><h2 tabindex="-1">Mensaje acusado</h2><p>El acuse quedó registrado; la lectura se afirma desde este hecho.</p></div>`;
  } else {
    html = e2e08GuardHtml();
  }
  e2e08S3Commit(html, actionId);
}

function renderQueued(a) {
  return `
    <div class="recovery-panel queued-receipt" role="status">
      <h3>Guardado en este equipo · pendiente de envío</h3>
      <dl>
        <dt>Acción guardada</dt><dd>${esc(a.label)} — con clave de seguridad que evita duplicados.</dd>
        <dt>Ciclo de envío</dt><dd>Guardada → enviándose → confirmada | en conflicto | rechazada | con error de validación | fallida.</dd>
        <dt>Ahora</dt><dd>Desactive «Sin conexión» en la barra de maqueta para ver la sincronización.</dd>
      </dl>
    </div>`;
}

/* Continuación anticipada: tras confirmar, la siguiente tarea ya está a un clic */
function nextStripHtml() {
  const next = workItems()[0];
  if (!next) return "";
  return `<div class="next-strip"><span>Siguiente: <b>${esc(next.title)}</b></span><button class="btn" data-open-next="${esc(next.id)}">Abrir ahora</button></div>`;
}

function renderRejection(a) {
  return `
    <div class="recovery-panel">
      <h3>${esc(a.label)}</h3>
      <dl>
        <dt>Efecto</dt><dd>${esc(a.note || "Salida no primaria: conserva responsable, motivo y próximo paso; nunca deja el trabajo sin dueño.")}</dd>
        <dt>Recuperación</dt><dd>El problema original, lo intentado, el resultado y el responsable quedan vinculados y trazables.</dd>
      </dl>
    </div>`;
}

/* ================= «IR A…» — PALETA DE COMANDOS (QuickSwitch) =================
   Window«Modal»: un solo punto para alcanzar vista, tarea o caso del rol.
   El filtro es DataFlow (en el lugar, sin navegar); abrir es NavigationFlow. */

function paletteGroups() {
  const r = roleDef();
  const groups = [];
  const vistas = [{ id: "work", label: WORK_TITLES[r.id] || "Tareas del día" }, ...navTargets(r)];
  groups.push({ name: "Vistas", items: vistas.map((v) => ({ type: "vista", id: v.id, label: v.label, meta: "vista" })) });
  const tareas = workItems().map((w) => ({ type: "tarea", id: w.id, label: w.title, meta: `${w.risk} · ${w.due}`, search: w.context }));
  if (tareas.length) groups.push({ name: "Tareas pendientes", items: tareas });
  if (SEARCH_ACCESS.has(r.id)) {
    groups.push({ name: "Casos", items: searchIndex().map((c) => ({ type: "caso", id: c.caseId, label: c.name, meta: `${c.caseId} · ${c.state}` })) });
  }
  return groups;
}

function paletteFlat() {
  const q = (state.palQ || "").trim().toLowerCase();
  return paletteGroups().map((g) => ({
    name: g.name,
    items: q ? g.items.filter((i) => (i.label + " " + i.id + " " + i.meta + " " + (i.search || "")).toLowerCase().includes(q)) : g.items
  })).filter((g) => g.items.length);
}

function openPalette() {
  state.palette = true; state.palQ = ""; state.palIdx = 0;
  renderPalette();
  $("#pal-input")?.focus();
}
function closePalette() {
  state.palette = false; state.palQ = ""; state.palIdx = 0;
  const host = $("#palette-host");
  if (host) host.innerHTML = "";
}

function renderPalette() {
  const host = $("#palette-host");
  if (!host) return;
  const groups = paletteFlat();
  let idx = -1;
  const body = groups.map((g) => `
    <div class="pal-group">
      <div class="pal-group-name">${esc(g.name)}</div>
      ${g.items.map((i) => { idx += 1; return `
        <button class="pal-item ${idx === state.palIdx ? "sel" : ""}" data-pal-type="${esc(i.type)}" data-pal-id="${esc(i.id)}" data-pal-idx="${idx}">
          <span>${esc(i.label)}</span><span class="pal-meta">${esc(i.meta)}</span>
        </button>`; }).join("")}
    </div>`).join("");
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  host.innerHTML = `
    <div class="palette-overlay" data-pal-backdrop>
      <div class="palette" role="dialog" aria-modal="true" aria-label="Ir a vista, tarea o caso">
        <input id="pal-input" type="search" placeholder="Nombre de vista, tarea o caso…" aria-label="Buscar destino" autocomplete="off">
        <div class="pal-groups">${total ? body : `<div class="pal-empty">Sin coincidencias para «${esc(state.palQ)}»</div>`}</div>
        <div class="pal-foot"><span>↑↓ moverse</span><span>Enter abrir</span><span>Esc cerrar</span></div>
      </div>
    </div>`;
  const input = $("#pal-input");
  input.value = state.palQ || "";
  input.addEventListener("input", () => {
    state.palQ = input.value; state.palIdx = 0;
    renderPalette();
    const again = $("#pal-input");
    again.focus(); again.setSelectionRange(again.value.length, again.value.length);
  });
  host.querySelector("[data-pal-backdrop]").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closePalette();
  });
  host.querySelectorAll(".pal-item").forEach((b) =>
    b.addEventListener("click", () => paletteChoose(b.dataset.palType, b.dataset.palId))
  );
}

function paletteChoose(type, id) {
  closePalette();
  if (type === "vista") {
    state.view = id;
    if (id === "work") state.sceneId = null;
    state.receipt = null; state.rejection = null; state.pendingConfirm = null;
    render();
  } else if (type === "tarea") {
    openObligation(id);
  } else if (type === "caso") {
    openCase(id);
  }
}

function paletteKey(e) {
  const items = [...document.querySelectorAll(".pal-item")];
  if (!items.length) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const delta = e.key === "ArrowDown" ? 1 : -1;
    state.palIdx = (state.palIdx + delta + items.length) % items.length;
    renderPalette();
  } else if (e.key === "Enter") {
    e.preventDefault();
    const b = items[state.palIdx] || items[0];
    paletteChoose(b.dataset.palType, b.dataset.palId);
  }
}

/* Flechas ↑↓ recorren la lista de trabajo (master del CN-MD por teclado) */
function workListKey(e) {
  if (state.view !== "work") return;
  const items = [...document.querySelectorAll(".work-item")];
  if (!items.length) return;
  const cur = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown") { e.preventDefault(); items[Math.min(cur + 1, items.length - 1)].focus(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); items[Math.max(cur - 1, 0)].focus(); }
}

/* ================= SESIÓN EXPIRADA (ER-UX-012) ================= */

function renderSessionOverlay() {
  if (state.sim !== "session_expired") return "";
  return `
    <div class="session-overlay" role="dialog" aria-modal="true" aria-label="Sesión expirada">
      <div class="session-card">
        <h2>Su sesión expiró</h2>
        <p>El borrador que estaba escribiendo quedó guardado de forma segura en este equipo; los datos protegidos permanecen ocultos hasta que vuelva a identificarse. Al volver, recupera el contexto sin duplicar lo que hizo.</p>
        <button class="btn primary" data-reauth>Ingresar de nuevo</button>
      </div>
    </div>`;
}

/* ================= RENDER PRINCIPAL ================= */

/* ================= FICHA CLÍNICA ADAPTADA (Caso) ================= */

function openCase(caseId) {
  if (!CLINICAL_FICHA.has(state.role)) return;
  state.caseFrom = state.view === "case" ? state.caseFrom : state.view;
  state.view = "case"; state.caseId = caseId;
  state.lens = HISTORY.some((h) => h.caseId === caseId) ? "pasado" : "pulso";
  state.pendingConfirm = null; state.receipt = null; state.rejection = null;
  render();
  focusSceneTitle();
  keepCaseContextVisible();
}

function renderCase() {
  const id = state.caseId;
  const hist = HISTORY.find((h) => h.caseId === id);
  if (hist) {
    return `
      <button class="crumb" data-back-case>← Volver</button>
      <h1 class="view-title">${esc(hist.alias)} · ${hist.age} años</h1>
      <div class="block notice-info"><p class="notice-text"><b>Episodio cerrado — solo lectura.</b> La ficha se conserva íntegra para continuidad y auditoría; nada aquí se edita.</p></div>
      <div class="resp-header">
        <div class="rh-line1"><span class="rh-person">${esc(hist.alias)} · ${hist.age} años</span><span class="risk A1">Egresado</span></div>
        <div class="rh-grid"><span>Caso: <b>${esc(id)}</b></span><span>Territorio: <b>${esc(hist.sector)}</b></span></div>
      </div>
      <div class="block"><h2>Cierre y continuidad</h2><dl class="kv">
        <dt>Cierre</dt><dd>${esc(hist.closed)}</dd>
        <dt>Continuidad</dt><dd>${esc(hist.continuity)}</dd>
        <dt>Resumen</dt><dd>${esc(hist.summary)}</dd>
        <dt>Reingresos</dt><dd>${esc(hist.reingresos)}</dd>
      </dl></div>
      <div class="block"><h2>Línea de tiempo</h2><ul class="timeline">${hist.pasado.map(([w, t]) => `<li><span class="tl-when">${esc(w)}</span><br>${esc(t)}</li>`).join("")}</ul></div>`;
  }
  const f = e2e01ProjectCase(id, FICHAS[id]);
  if (!f) return `<div class="state-panel"><h2>Ficha no disponible en la maqueta</h2></div>`;
  const p = PEOPLE[f.personKey];
  const lensBtn = (lid, label) => `<button data-lens="${lid}" aria-pressed="${state.lens === lid}">${label}</button>`;
  const jNow = JOURNEY_STAGES.find(([c]) => c === f.journey);
  const journeyStrip = jNow ? `<div class="j-strip" role="group" aria-label="Etapa del episodio en el recorrido">
    ${JOURNEY_STAGES.map(([c]) => `<span class="j-cell ${c === f.journey ? "now" : ""}">${c}</span>`).join("")}
    <span class="j-now-label">Etapa actual: <b>${esc(jNow[0])} · ${esc(jNow[1])}</b> — cada traspaso entre etapas quedó con acuse y plan alternativo</span>
  </div>` : "";
  /* anticipación: si el rol tiene una tarea pendiente sobre este caso, la ficha lo dice */
  const myCaseItem = workItems().find((w) => !state.done.has(w.id) && (sceneDef(w.scene)?.header || {}).caseId === id);
  const caseItemStrip = myCaseItem ? `<div class="block notice-info case-task"><p class="notice-text">Usted tiene una tarea pendiente sobre este caso: <b>${esc(myCaseItem.title)}</b></p><button class="btn" data-open-obl="${esc(myCaseItem.id)}">Abrir la tarea</button></div>` : "";
  let content = "";
  if (state.lens === "pulso") {
    content = `<div class="block"><h2>Pulso — ahora</h2><dl class="kv">${f.pulso.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>`;
  } else if (state.lens === "plan") {
    content = f.plan.map((pl) => `<div class="block"><h2>${esc(pl.name)}</h2><p class="plan-author">${esc(pl.author)} · ${esc(pl.version)}</p><ul>${pl.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")
      + `<div class="block notice-info"><p class="notice-text">Los planes conviven sobre el mismo caso: cada disciplina conserva su autoría y su versión; nadie edita el plan de otra.</p></div>`;
  } else {
    content = `<div class="block"><h2>Pasado — línea de tiempo</h2><ul class="timeline">${f.pasado.map(([w, t]) => `<li><span class="tl-when">${esc(w)}</span><br>${esc(t)}</li>`).join("")}</ul></div>`;
  }
  /* el flujo completo de propuesta/derivación se demuestra sobre Rosa C. (declarado) */
  const demo = id === "HOD-2026-0131";
  const isMed = state.role === "medico-atencion-directa";
  const canPropose = ["enfermero-clinico", "kinesiologo", "trabajador-social", "fonoaudiologo"].includes(state.role);
  let actions = "";
  if (demo && isMed) {
    actions = `<div class="action-item"><button class="btn primary" data-scene-goto="plan-ajuste-rosa">Ajustar el plan médico</button></div>
      <div class="action-item"><button class="btn exit" data-scene-goto="derivacion-rosa">Derivar internamente</button></div>`;
  } else if (demo && canPropose) {
    actions = `<div class="action-item"><button class="btn primary" data-scene-goto="plan-cambio-rosa">Proponer cambio en el plan</button></div>`;
  }
  return `
    <button class="crumb" data-back-case>← Volver</button>
    <h1 class="view-title">Ficha — ${esc(p.alias)} · ${p.age} años</h1>
    <div class="resp-header">
      <div class="rh-line1"><span class="rh-person">${esc(p.alias)} · ${p.age} años</span><span class="risk ${esc(f.risk)}">${esc(f.risk)} · ${esc(f.riskText)}</span></div>
      <div class="rh-grid">
        <span>Caso: <b>${esc(id)}</b></span>
        <span>Situación: <b>${esc(p.tag)}</b></span>
        <span>Territorio: <b>${esc(f.band.territory)}</b> (${esc(f.band.precision)})</span>
        <span>Cuidador: <b>${esc(f.band.caregiver)}</b></span>
        <span>Contacto: <b>${esc(f.band.contact)}</b></span>
      </div>
    </div>
    <div class="block"><dl class="kv">
      <dt>Responde ahora</dt><dd>${esc(f.responsibility.now)}</dd>
      <dt>Próximo hito</dt><dd>${esc(f.responsibility.next)}</dd>
      <dt>Cobertura</dt><dd>${esc(f.responsibility.coverage)}</dd>
    </dl></div>
    ${journeyStrip}
    ${caseItemStrip}
    <div class="lenses" role="group" aria-label="Lentes del caso">
      ${lensBtn("pulso", "Pulso")}${lensBtn("plan", "Plan")}${lensBtn("pasado", "Pasado")}
    </div>
    ${content}
    ${actions ? `<div class="action-bar" role="group" aria-label="Acciones autorizadas">${actions}</div>` : ""}`;
}

/* ================= BÚSQUEDA / HISTORIA RÁPIDA ================= */

function searchIndex() {
  const items = [];
  e2e01ProjectCensus(CENSUS).forEach((c) => {
    const p = c.personKey ? PEOPLE[c.personKey] : null;
    items.push({ caseId: c.id, name: p ? `${p.alias} · ${p.age} años` : c.alias,
      sector: c.sector, state: c.state, line: c.today, risk: c.risk });
  });
  HISTORY.forEach((h) => items.push({ caseId: h.caseId, name: `${h.alias} · ${h.age} años`,
    sector: h.sector, state: "egresado", line: h.closed, risk: "A1" }));
  return items;
}

function renderBuscar() {
  return `
    <h1 class="view-title">Buscar paciente</h1>
    <p class="view-subtitle">Personas con episodio vigente o cerrado. La ficha de un episodio cerrado es solo lectura.</p>
    ${contextBanner()}
    <input id="q" class="search-input" type="search" placeholder="Nombre, caso (HOD-2026-…), sector o estado" aria-label="Buscar paciente">
    <div id="search-results"></div>`;
}

function renderSearchResults() {
  const host = $("#search-results");
  if (!host) return;
  const q = (state.q || "").trim().toLowerCase();
  const all = searchIndex();
  const hits = q ? all.filter((i) => (i.name + " " + i.caseId + " " + i.sector + " " + i.line + " " + i.state).toLowerCase().includes(q)) : all;
  const groups = [["activo", "Episodio vigente"], ["postulado", "Postulados"], ["egresado", "Episodio cerrado"]];
  host.innerHTML = groups.map(([st, label]) => {
    const rows = hits.filter((i) => i.state === st).map((i) => `<button class="census-row" data-case-open="${esc(i.caseId)}">
      <span class="cr-top"><b>${esc(i.name)}</b><span class="risk ${esc(i.risk)}">${esc(i.risk)}</span></span>
      <span class="cr-meta">${esc(i.caseId)} · ${esc(i.sector)}</span>
      <span class="cr-today">${esc(i.line)}</span></button>`).join("");
    return rows ? `<div class="block"><h2>${label}</h2><div class="census-list">${rows}</div></div>` : "";
  }).join("") || `<div class="state-panel"><div class="state-kind">Sin resultados</div><h2>Ninguna ficha coincide con «${esc(state.q)}»</h2><p>Pruebe con el nombre, el caso (HOD-2026-…) o el sector. Las personas sin episodio no aparecen aquí.</p></div>`;
  host.querySelectorAll("[data-case-open]").forEach((b) =>
    b.addEventListener("click", () => openCase(b.dataset.caseOpen)));
}

/* ================= BRECHAS Y ESCENARIOS (V01–V13 · E2E-01–13) ================= */

/* ================= RECORRIDOS (journeys J0–J10 + escenarios E2E + brechas) =================
   Tres lentes sobre la misma fuente: los escenarios se recorren como cadenas
   de handoffs, las etapas muestran quién produce/recibe, las brechas se
   declaran sin cerrar. */

function e2eChainHtml(id) {
  const steps = E2E_STEPS[id] || [];
  return `<div class="e2e-chain">${steps.map((group, gi) => `
    ${gi > 0 ? '<span class="e2e-arrow" aria-hidden="true">→</span>' : ""}
    <span class="e2e-step">${group.map((r) => `<span class="e2e-chip ${r.startsWith("__") ? "ghost" : ""}">${esc(ROLE_SHORT[r] || r)}</span>`).join("")}</span>`).join("")}
  </div>`;
}

function renderBrechas() {
  const lens = state.brechasLens || "escenarios";
  const stageSel = state.brechaStage || "J0";
  const lensBtn = (id, label) => `<button data-brecha-lens="${id}" aria-selected="${lens === id}">${label}</button>`;

  /* — lente 1: escenarios end-to-end como cadenas de handoffs — */
  const eCards = E2E.map((e) => `
    <div class="block e2e-card">
      <h2><b>${esc(e[0])}</b> · ${esc(e[1])}</h2>
      ${e2eChainHtml(e[0])}
      <div class="e2e-rojo"><b>Rojo si…</b> ${esc(e[3])}</div>
    </div>`).join("");

  /* — lente 2: etapas J0–J10 con quién produce y quién recibe — */
  const stageStrip = JOURNEY_STAGES.map(([code, name]) =>
    `<button class="j-cell ${stageSel === code ? "now" : ""}" data-brecha-stage="${code}" aria-pressed="${stageSel === code}">${code}</button>`
  ).join("");
  const stageName = (JOURNEY_STAGES.find(([c]) => c === stageSel) || [])[1] || "";
  const producers = [], handoffs = [], partakers = [];
  JOURNEY_MATRIX.forEach(([rid, marks]) => {
    const m = marks[Number(stageSel.slice(1))];
    if (m === "●") producers.push(ROLE_SHORT[rid]);
    else if (m === "↔") handoffs.push(ROLE_SHORT[rid]);
    else if (m === "○") partakers.push(ROLE_SHORT[rid]);
  });
  const stagePanel = `
    <div class="block stage-panel">
      <h2>${esc(stageSel)} · ${esc(stageName)}</h2>
      <p class="notice-text" style="margin-bottom: var(--sp-2)">${esc(JOURNEY_STAGE_DETAIL[stageSel])}</p>
      <dl class="kv">
        <dt>Produce decisión</dt><dd>${producers.length ? esc(producers.join(" · ")) : "— (nadie decide en esta etapa)"}</dd>
        <dt>Entrega o recibe (handoff con acuse)</dt><dd>${handoffs.length ? esc(handoffs.join(" · ")) : "—"}</dd>
        <dt>Participa</dt><dd>${partakers.length ? esc(partakers.join(" · ")) : "—"}</dd>
      </dl>
    </div>`;
  const matrixRows = JOURNEY_MATRIX.map(([rid, marks]) => {
    const cells = marks.map((m, i) => {
      const cls = m === "●" ? "m-produce" : m === "↔" ? "m-hand" : m === "○" ? "m-part" : "m-none";
      const cur = JOURNEY_STAGES[i][0] === stageSel ? " m-cur" : "";
      return `<td class="${cls}${cur}">${m}</td>`;
    }).join("");
    return `<tr><td>${esc(ROLE_SHORT[rid] || rid)}</td>${cells}</tr>`;
  }).join("");
  const matrix = `
    <div class="block"><h2>Quién está dónde en cada etapa</h2>
      <p class="map-note">● produce decisión propia · ○ participa · ↔ entrega o recibe handoff · — sin contacto. Seleccione una etapa arriba para ver su detalle.</p>
      <div class="table-scroll"><table class="data j-matrix">
        <thead><tr><th>Rol</th>${JOURNEY_STAGES.map(([c]) => `<th class="${c === stageSel ? "m-cur" : ""}">${c}</th>`).join("")}</tr></thead>
        <tbody>${matrixRows}</tbody></table></div>
    </div>`;

  /* — lente 3: brechas abiertas (sin cerrar por pantalla) — */
  const bRows = BRECHAS.map((b) => `<tr><td><b>${esc(b[0])}</b></td><td>${esc(b[1])}</td><td>${esc(b[2])}</td><td>${esc(b[3])}</td></tr>`).join("");
  const brechasTable = `
    <div class="block"><h2>Las 13 brechas que siguen abiertas</h2><div class="table-scroll"><table class="data">
      <thead><tr><th>ID</th><th>Pregunta abierta</th><th>Roles afectados</th><th>Riesgo si sigue abierta</th></tr></thead>
      <tbody>${bRows}</tbody></table></div></div>
    <div class="block notice-info"><p class="notice-text">Las 18 interfaces externas tienen su propia pantalla en esta maqueta (selector de rol, Parte III): cada una muestra su traspaso con acuse y su brecha declarada — nunca la cierra. Sin observación de oficio no se inventa más interfaz que la del handoff.</p></div>`;

  return `
    <h1 class="view-title">Recorridos del episodio: escenarios, etapas y brechas</h1>
    <p class="view-subtitle">Referencia de gobierno, corte 18-08-2026. Los escenarios se recorren como cadenas de entrega con acuse; las etapas declaran quién produce y quién recibe; las brechas siguen abiertas y ninguna pantalla las cierra.</p>
    <p class="map-note">En las cadenas, los chips atenuados con borde discontinuo son pasos del sistema o del origen (no un rol con pantalla propia).</p>
    ${contextBanner()}
    <div class="lenses" role="tablist" aria-label="Lentes de recorridos">
      ${lensBtn("escenarios", "Escenarios E2E")}
      ${lensBtn("etapas", "Etapas J0–J10")}
      ${lensBtn("brechas", "Brechas V01–V13")}
    </div>
    ${lens === "escenarios" ? eCards : ""}
    ${lens === "etapas" ? `<div class="j-strip" role="group" aria-label="Etapas del journey">${stageStrip}</div>${stagePanel}${matrix}` : ""}
    ${lens === "brechas" ? brechasTable : ""}`;
}

/* ================= PREPARAR MAÑANA (J5) ================= */

function renderManana() {
  const t = TOMORROW;
  const needsRows = t.needs.map((n) => { const p = PEOPLE[n.person];
    return `<tr><td><b>${esc(p.alias)}</b></td><td>${esc(n.need)}</td><td>${esc(n.window)}</td><td>${esc(n.territory)}</td><td>${esc(n.requirements)}</td><td>${esc(n.who)}</td></tr>`; }).join("");
  const capRows = t.capacity.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  const conflicts = t.conflicts.map((c) => `<div class="block notice-attention"><p class="notice-text">${esc(c)}</p></div>`).join("");
  const proposals = t.proposal.map((p) => `<div class="block"><h2>${esc(p.vehicle)}</h2><ul>${p.stops.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>`).join("");
  return `
    <h1 class="view-title">Preparar mañana — ${esc(t.date)}</h1>
    <p class="view-subtitle">Las necesidades de cada paciente contra la capacidad declarada. Publicar propone asignaciones; cada función acepta o declina la suya.</p>
    ${contextBanner()}
    <div class="block"><h2>Necesidades de mañana por paciente</h2><div class="table-scroll"><table class="data">
      <thead><tr><th>Persona</th><th>Necesidad</th><th>Ventana</th><th>Territorio</th><th>Requisitos</th><th>Función</th></tr></thead><tbody>${needsRows}</tbody></table></div></div>
    <div class="block"><h2>Capacidad declarada de mañana</h2><dl class="kv">${capRows}</dl></div>
    <div class="block"><h2>Propuesta de circuitos (borrador)</h2>
      ${mapSvg({ circuits: ["m1m", "m2m"], vehicles: [], showCensus: false, height: 340 })}
      ${mapLegend()}
      <p class="map-note">Borrador sin publicar: las paradas y su orden se confirman al publicar. Nada aquí compromete a ninguna función todavía.</p>
    </div>
    ${proposals}
    ${conflicts}
    <div class="action-bar" aria-label="Acciones autorizadas">
      <div class="action-item"><button class="btn primary" data-manana-publish>Publicar programa de mañana y proponer asignaciones</button><span class="mode-note">requiere internet</span></div>
      <div class="action-item"><button class="btn exit" data-goto="sala">Volver a Sala de Mando</button></div>
    </div>
    <div id="action-result"></div>`;
}


function renderMain() {
  const main = $("#main");
  const simHtml = simPanel();
  const geoViews = { "censo-mapa": renderCensoMapa, "rutas-mapa": renderRutasMapa, "mi-dia": renderMiDia, "buscar": renderBuscar, "manana": renderManana, "brechas": renderBrechas };

  if (state.view === "work") main.innerHTML = renderWork();
  else if (state.view === "case") {
    main.innerHTML = (simHtml && state.sim !== "offline" && state.sim !== "stale") ? simHtml : renderCase();
  } else if (geoViews[state.view]) {
    const roleSafeS3Route = ["ruta", "rutas-mapa"].includes(state.view)
      && state.role === "conductor" && Boolean(e2e08S3WorkItem("conductor"));
    main.innerHTML = (simHtml && state.sim !== "offline" && state.sim !== "stale")
      ? simHtml : roleSafeS3Route ? e2e08S3DriverHtml() : geoViews[state.view]();
  } else if (state.view === "navroot") {
    const r = roleDef();
    state.sceneId = r.extraNav ? r.extraNav.id : null;
    main.innerHTML = renderScene();
  } else if (SCENES[state.view] || (sceneDef(state.view) && sceneDef(state.view).navRoot)) {
    state.sceneId = state.view;
    main.innerHTML = state.view === "ruta" && state.role === "conductor"
      ? e2e08S3DriverHtml() : renderScene();
  } else main.innerHTML = renderScene();

  bindMainEvents();
  bindMapEvents();

  const overlay = document.createElement("div");
  overlay.id = "overlay-host";
  overlay.innerHTML = renderSessionOverlay();
  document.body.appendChild(overlay);
  overlay.querySelector("[data-reauth]")?.addEventListener("click", () => {
    state.sim = "normal";
    render();
  });
}

function bindMainEvents() {
  document.querySelectorAll("[data-open]:not([data-e2e08-s3-open])").forEach((b) =>
    b.addEventListener("click", () => openObligation(b.dataset.open))
  );
  document.querySelectorAll("[data-e2e08-s3-open]").forEach((b) =>
    b.addEventListener("click", () => openObligation(b.dataset.e2e08S3Open))
  );
  document.querySelectorAll("[data-open-next]").forEach((b) =>
    b.addEventListener("click", () => openObligation(b.dataset.openNext))
  );
  document.querySelectorAll("[data-open-obl]").forEach((b) =>
    b.addEventListener("click", () => openObligation(b.dataset.openObl))
  );
  document.querySelectorAll("[data-ficha]").forEach((b) =>
    b.addEventListener("click", () => openCase(b.dataset.ficha))
  );
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => { state.view = b.dataset.goto; render(); })
  );
  document.querySelectorAll("[data-back-case]").forEach((b) =>
    b.addEventListener("click", () => { state.view = state.caseFrom || "work"; state.caseId = null; render(); })
  );
  document.querySelectorAll("[data-scene-goto]").forEach((b) =>
    b.addEventListener("click", () => { state.view = "scene"; state.sceneId = b.dataset.sceneGoto; state.pendingConfirm = null; render(); })
  );
  document.querySelectorAll(".lenses button").forEach((b) =>
    b.addEventListener("click", () => { state.lens = b.dataset.lens; render(); })
  );
  document.querySelectorAll("[data-brecha-lens]").forEach((b) =>
    b.addEventListener("click", () => { state.brechasLens = b.dataset.brechaLens; render(); })
  );
  document.querySelectorAll("[data-brecha-stage]").forEach((b) =>
    b.addEventListener("click", () => { state.brechaStage = b.dataset.brechaStage; render(); })
  );
  const qInput = $("#q");
  if (qInput) {
    qInput.value = state.q || "";
    qInput.addEventListener("input", () => { state.q = qInput.value; renderSearchResults(); });
    renderSearchResults();
  }
  const mp = $("[data-manana-publish]");
  if (mp) mp.addEventListener("click", () => {
    const host = $("#action-result");
    host.innerHTML = `<div class="confirm-strip" role="group" aria-label="Confirmación">
      <p><b>Confirmar:</b> Publicar fija la versión del programa de mañana; las asignaciones requieren aceptación de cada función.</p>
      <button class="btn primary" data-confirm-manana>Confirmar</button>
      <button class="btn exit" data-cancel>Cancelar</button>
    </div>`;
    bindActionResultEvents();
  });
  document.querySelectorAll("[data-back]").forEach((b) =>
    b.addEventListener("click", backToWork)
  );
  document.querySelectorAll("[data-sim-exit]").forEach((b) =>
    b.addEventListener("click", () => { state.sim = "normal"; render(); })
  );
  document.querySelectorAll("[data-refresh]").forEach((b) =>
    b.addEventListener("click", () => render())
  );
  document.querySelectorAll("[data-act]").forEach((b) =>
    b.addEventListener("click", () => {
      const a = actionById(state.sceneId, b.dataset.act);
      if (!a) return;
      if (a.goto) { state.sceneId = a.goto; state.pendingConfirm = null; render(); return; }
      const host = $("#action-result");
      if (b.dataset.av === "blocked_explainable") {
        const expl = a.explanation || {
          cause: "Esta acción es solo en línea y no hay conexión.",
          kept: "Acción no enviada; el responsable vigente no cambia.",
          exit: "Recupere conexión o use el canal de contingencia."
        };
        host.innerHTML = renderRecovery(expl);
      } else if (a.immediate) {
        if (state.sim === "offline" && (a.mode === "reconcilable_write" || a.mode === "queued_intent")) {
          state.queued = { actId: a.id, sceneId: state.sceneId };
          host.innerHTML = renderQueued(a);
        } else {
          state.done.add(obligationIdForScene(state.sceneId));
          host.innerHTML = renderReceipt(a) + nextStripHtml();
          bindMainEvents();
        }
      } else {
        state.pendingConfirm = a.id;
        state.confirmTrigger = b;
        host.innerHTML = renderConfirm(a);
      }
      host.scrollIntoView?.({ block: "nearest" });
      bindActionResultEvents();
    })
  );
  bindE2E07Actions();
  bindE2E08StandaloneActions();
}

function bindE2E07Actions() {
  document.querySelectorAll("[data-e2e07-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = e2e07ActionById(button.dataset.e2e07Action);
      const host = $("#action-result");
      if (!action || !host) return;
      state.pendingConfirm = action.id;
      state.confirmTrigger = button;
      host.innerHTML = renderConfirm(action);
      bindActionResultEvents();
    });
  });
}

function bindE2E08StandaloneActions() {
  document.querySelectorAll("[data-e2e08-action]:not([data-act])").forEach((b) => {
    if (b.dataset.e2e08Bound === "true") return;
    b.dataset.e2e08Bound = "true";
    b.addEventListener("click", () => {
      if (b.dataset.e2e08Action === "timeout-0822") {
        e2e08ApplyTimeout();
        return;
      }
      const a = e2e08CurrentActionById(b.dataset.e2e08Action);
      const host = $("#action-result");
      if (!a || !host) return;
      if (a.blocked) {
        host.innerHTML = renderRecovery(a.explanation);
        bindActionResultEvents();
        return;
      }
      state.pendingConfirm = a.id;
      state.confirmTrigger = b;
      state.e2e08.pendingActionId = a.id;
      state.e2e08.pendingBasisToken = b.dataset.e2e08BasisToken || null;
      state.e2e08.pendingBasisReviewId = currentPackageReview()?.id || null;
      if (a.id === "manifest-retain") {
        state.e2e08.manifestBasisToken = state.e2e08.pendingBasisToken;
        state.e2e08.manifestBasisReviewId = state.e2e08.pendingBasisReviewId;
      }
      host.innerHTML = renderConfirm(a);
      bindActionResultEvents();
    });
  });
}

function bindActionResultEvents() {
  $("[data-cancel]")?.addEventListener("click", () => {
    const trigger = state.confirmTrigger;
    state.pendingConfirm = null;
    state.confirmTrigger = null;
    $("#action-result").innerHTML = "";
    trigger?.focus();
  });
  $("[data-confirm-manana]")?.addEventListener("click", () => {
    $("#action-result").innerHTML = `<div class="outcome-receipt" role="status"><h2>Confirmado</h2><dl>
      <dt>Qué ocurrió</dt><dd>Programa de mañana publicado (18-08-2026, borrador rev. 2).</dd>
      <dt>Qué cambió</dt><dd>8 paradas en 2 móviles quedan con asignación propuesta; cada función recibe la suya para aceptar o declinar.</dd>
      <dt>Responsable ahora</dt><dd>Cada función acepta la suya; coordinación conserva lo no aceptado y las brechas declaradas.</dd>
      <dt>Próximo paso</dt><dd>Aceptaciones visibles en la Sala; la brecha de trabajo social queda escalada a Dirección Técnica con plazo hoy.</dd>
    </dl></div>`;
    focusActionResult();
  });
  $("[data-confirm]")?.addEventListener("click", (e) => {
    const actionId = e.target.dataset.confirm;
    if (e2e01ConfirmAction(actionId)) return;
    if (e2e07ActionById(actionId)) {
      e2e07ConfirmAction(actionId);
      return;
    }
    if (e2e08CurrentActionById(actionId)) {
      e2e08ConfirmAction(actionId);
      return;
    }
    const a = actionById(state.sceneId, actionId);
    const host = $("#action-result");
    if (!a) return;
    /* offline: reconciliables quedan en cola */
    if (state.sim === "offline" && (a.mode === "reconcilable_write" || a.mode === "queued_intent")) {
      state.queued = { actId: a.id, sceneId: state.sceneId };
      host.innerHTML = renderQueued(a);
      focusActionResult();
      return;
    }
    if (a.outcome) {
      state.done.add(obligationIdForScene(state.sceneId));
      host.innerHTML = renderReceipt(a) + nextStripHtml();
      bindMainEvents();
      focusActionResult();
    } else {
      host.innerHTML = renderRejection(a);
      focusActionResult();
    }
  });
  bindE2E08StandaloneActions();
}

function obligationIdForScene(sceneId) {
  const items = workItems();
  const hit = items.find((w) => w.scene === sceneId || sceneDef(w.scene) === sceneDef(sceneId));
  return hit ? hit.id : sceneId;
}

function focusSceneTitle() {
  const title = $("#main h1");
  if (!title) {
    $("#main")?.focus();
    return;
  }
  title.setAttribute("tabindex", "-1");
  title.focus({ preventScroll: true });
  const scroller = document.scrollingElement || document.documentElement;
  if (scroller) scroller.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

function keepCaseContextVisible() {
  const identity = $(".identity");
  const response = $("#main .resp-header");
  const scroller = document.scrollingElement || document.documentElement;
  if (!identity || !response || !scroller) return;

  const overflow = Math.ceil(response.getBoundingClientRect().bottom - window.innerHeight);
  const identityTop = Math.floor(identity.getBoundingClientRect().top);
  const offset = Math.min(Math.max(overflow, 0), Math.max(identityTop, 0));
  if (!offset) return;

  scroller.scrollTop += offset;
  if (document.body !== scroller) document.body.scrollTop = scroller.scrollTop;
}

function openObligation(workId) {
  const s3Work = e2e08S3WorkItem();
  const directS3Eligible = state.role !== "medico-atencion-directa"
    || (!state.e2e08.communication && state.sim !== "offline");
  if (s3Work && s3Work.id === workId && directS3Eligible) {
    state.view = "scene";
    state.sceneId = s3Work.scene;
    state.pendingConfirm = null; state.receipt = null; state.rejection = null;
    render();
    focusSceneTitle();
    return;
  }
  const w = workItems().find((x) => x.id === workId);
  if (!w) return;
  state.view = "scene";
  state.sceneId = w.scene;
  state.pendingConfirm = null; state.receipt = null; state.rejection = null;
  render();
  focusSceneTitle();
}

function backToWork() {
  state.view = "work";
  state.sceneId = null; state.pendingConfirm = null; state.receipt = null; state.rejection = null;
  render();
  $("#main")?.focus();
}

/* ================= MAQUETA CHROME ================= */

function bindMaqueta() {
  const sel = $("#role-select");
  ROLES.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.id; opt.textContent = r.label;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => {
    state.role = sel.value;
    state.view = "work"; state.sceneId = null;
    state.done = new Set(); state.queued = null;
    render();
  });

  /* teclado global: ⌘K/Ctrl+K y «/» abren la paleta; Esc cierra;
     ↑↓ recorre la paleta o la lista de trabajo */
  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (state.palette) closePalette(); else openPalette();
      return;
    }
    if (e.key === "Escape" && state.palette) { closePalette(); return; }
    if (state.palette) { paletteKey(e); return; }
    if (!typing && e.key === "/") { e.preventDefault(); openPalette(); return; }
    if (!typing && (e.key === "ArrowDown" || e.key === "ArrowUp")) workListKey(e);
  });

  $("#sim-select").addEventListener("change", (e) => {
    const prev = state.sim;
    state.sim = e.target.value;
    if ((prev === E2E07_REHEARSAL_MODE) !== (state.sim === E2E07_REHEARSAL_MODE)) {
      state.e2e07 = newE2E07Session();
      state.view = "work";
      state.sceneId = null;
      state.pendingConfirm = null;
      state.confirmTrigger = null;
    }
    /* reconciliación al volver de offline con intención en cola */
    if (prev === "offline" && state.sim === "normal" && state.queued) {
      const a = actionById(state.queued.sceneId, state.queued.actId);
      state.done.add(obligationIdForScene(state.queued.sceneId));
      state.queued = null;
      render();
      const host = $("#action-result");
      if (host && a && a.outcome) {
        host.innerHTML = `<div class="context-banner" role="status"><span><b>Sincronizada:</b> la acción se envió y el sistema la confirmó, sin duplicarla.</span></div>` + renderReceipt(a) + nextStripHtml();
        bindMainEvents();
      }
      return;
    }
    render();
  });

  document.querySelectorAll(".mk-device").forEach((b) =>
    b.addEventListener("click", () => { state.device = b.dataset.device; render(); })
  );
}

function render() {
  document.querySelectorAll("#overlay-host").forEach((n) => n.remove());
  renderShell();
}

bindMaqueta();
render();
