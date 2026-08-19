/* Prueba de los contratos de producto de la vista humana (hd-dt, corte
   2026-08-18) sobre la maqueta hd-design-html con jsdom.
   Uso: cd /home/felix/projects/hd-hsc-os && node /home/felix/projects/hd-design-html/tests/test-maqueta-contratos.js */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("/home/felix/projects/hd-hsc-os/node_modules/jsdom"));

const dir = "/home/felix/projects/hd-design-html";
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
const { window } = dom;

const combined = ["data.js", "cases.js", "scenes.js", "map-data.js", "map.js", "app.js"]
  .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
  .join("\n;\n");
window.eval(combined);

const $ = (s) => window.document.querySelector(s);
const $$ = (s) => [...window.document.querySelectorAll(s)];
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name); }
}
function setRole(id) {
  const sel = $("#role-select");
  sel.value = id; sel.dispatchEvent(new window.Event("change"));
}
function confirmPrimary() {
  $$(".action-bar .btn.primary")[0].click();
  $("[data-confirm]").click();
}

/* ===== E2E-08/S3: helpers de la RED satélite =====
   La fase RED sólo fija la superficie observable. Si el corte S3 todavía no
   existe, cada ausencia se convierte en un FAIL controlado; ningún selector
   opcional se desreferencia para no convertir la ausencia en un fallo del
   arnés. */
const S3_VIS_ID = "VIS-ROSA-M1-0900";
const S3_VIS_SELECTORS = [
  `[data-s3-visit="${S3_VIS_ID}"]`,
  `[data-visit-id="${S3_VIS_ID}"]`,
  `[data-obligation-id="${S3_VIS_ID}"]`,
  `[data-work-id="${S3_VIS_ID}"]`,
  `[data-open="${S3_VIS_ID}"]`
];
const S3_REVIEW_SELECTORS = [
  "[data-s3-review]",
  "[data-package-review]",
  "[data-review-time=\"08:35\"]",
  "[data-review-id*=\"ROSA\"]"
];
const S3_MANIFEST_SELECTORS = [
  "[data-s3-manifest=\"M1\"]",
  "[data-manifest=\"M1\"]",
  "[data-manifest-id*=\"M1\"]"
];
const S3_REVIEW_ACTION_SELECTORS = [
  '[data-s3-action="review-package"]',
  '[data-s3-action="nursing-review"]',
  '[data-action="review-package"]'
];
const S3_DISPOSITION_ACTION_SELECTORS = [
  '[data-s3-action="decide-vis-disposition"]',
  '[data-s3-action="vis-disposition"]',
  '[data-action="decide-vis-disposition"]'
];
const S3_DEPARTURE_ACTION_SELECTORS = [
  '[data-s3-action="vehicle_departure_observed"]',
  '[data-s3-transition="vehicle_departure_observed"]',
  '[data-s3-action="departure-observed"]',
  '[data-s3-action="record-departure"]',
  '[data-action="departure-observed"]'
];
const S3_CANCEL_ACTION_SELECTORS = [
  '[data-s3-action="cancelled_by_medical_order"]',
  '[data-s3-transition="cancelled_by_medical_order"]',
  '[data-s3-action="medical-urgency"]',
  '[data-s3-action="urgent-referral-intent"]',
  '[data-action="urgent-referral-intent"]'
];

function s3Boot() {
  const freshDom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
  const freshWindow = freshDom.window;
  freshWindow.eval(combined);
  return {
    window: freshWindow,
    $: (s) => freshWindow.document.querySelector(s),
    $$: (s) => [...freshWindow.document.querySelectorAll(s)]
  };
}
function s3Find(ui, selectors, root = ui.window.document) {
  return selectors.map((selector) => root.querySelector(selector)).find(Boolean) || null;
}
function s3Text(node) { return node ? node.textContent || "" : ""; }
function s3Click(node) {
  if (!node || typeof node.click !== "function") return false;
  try { node.click(); return true; } catch (_) { return false; }
}
function s3SetRole(ui, id) {
  const select = ui.$("#role-select");
  if (!select) return false;
  select.value = id;
  select.dispatchEvent(new ui.window.Event("change"));
  return true;
}
function s3Activate(ui, selectors, root = ui.window.document) {
  const node = s3Find(ui, selectors, root);
  if (!node) return false;
  return s3Click(node.matches("button, [role=button]") ? node : node.querySelector("button, [role=button]"));
}
function s3Confirm(ui) { return s3Click(s3Find(ui, ["[data-confirm]", ".confirm-strip [data-confirm]"])); }

/* ===== R04: verificación clínica de admisión (acto DT 2026-08-18) ===== */
setRole("medico-regulador");
check("regulador normal: sólo conserva la verificación vigente; V02 futuro queda oculto", $$('[data-open]').length === 1);
$$("[data-open]")[0].click(); // regulacion-elena
check("R04: escena es verificación clínica, no decisión", $("#main h1").textContent.includes("Verificación clínica de admisión"));
check("R04: DS 1/2022 arts. 15–17 como ancla", $("#main").textContent.includes("DS 1/2022"));
check("R04: V01 declarada en pantalla", $("#main").textContent.includes("brecha V01"));
const decidirBtn = $$(".action-bar .btn").find(b => b.textContent.includes("aceptar / diferir / rechazar"));
check("R04: decisión operacional existe pero bloqueada", !!decidirBtn && decidirBtn.classList.contains("blocked"));
decidirBtn.click();
check("R04: V01 no se cierra por pantalla", $(".recovery-panel").textContent.includes("autoría de esta decisión está en validación"));
confirmPrimary();
check("R04: verificación registrada con autoría y V01 abierta", $(".outcome-receipt").textContent.includes("vigilancia renal") && $(".outcome-receipt").textContent.includes("V01"));

/* ===== R04: V02 sólo es ejecutable dentro del ensayo no operativo ===== */
$("[data-back]").click();
check("R04 normal: no ofrece turno ni llamada nocturna futura", !$$('[data-open]').some((button) => /turno|cuidadora|nocturn/i.test(button.textContent)));
const v02Mode = $("#sim-select");
v02Mode.value = "v02_rehearsal"; v02Mode.dispatchEvent(new window.Event("change"));
check("R04 ensayo: banner inequívoco no operativo", !!$("[data-e2e07-rehearsal-banner]") && $("[data-e2e07-rehearsal-banner]").textContent.includes("no operativo"));
setRole("cuidador");
$('[data-open="E2E07-CU-01"]')?.click();
$('[data-e2e07-action="record-synthetic-131-call"]')?.click();
$('[data-confirm]')?.click();
setRole("medico-regulador");
$('[data-open="E2E07-MR-01"]')?.click();
check("R04 noche: alerta gobernada A3 con escalamiento 15 min", !!$(".alert.A3") && $(".alert").textContent.includes("15 min"));
check("R04 noche: V02 declarada, no se afirma práctica", $("#main").textContent.includes("pendiente de activación") && $("#main").textContent.includes("no una práctica demostrada"));
check("R04 noche: resumen clínico llega con la llamada", $("#main").textContent.includes("Resumen clínico suficiente"));
check("R04 noche: sólo permite rescate simulado", !!$('[data-e2e07-action="simulate-rescue"]') && $("#main").textContent.includes("ensayo"));
v02Mode.value = "normal"; v02Mode.dispatchEvent(new window.Event("change"));

/* ===== R10: default-deny sin inventar permiso ===== */
setRole("otro-profesional");
check("R10: título de cola propio", $("#main h1").textContent.includes("habilitación"));
check("R10: una sola solicitud (work_one anuncia)", $("#main").textContent.includes("Una tarea pendiente"));
$("[data-open]").click();
check("R10: actuar está bloqueado con explicación", $$(".action-bar .btn").some(b => b.classList.contains("blocked")));
$$(".action-bar .btn.blocked")[0].click();
check("R10: explicación nombra cartera no ratificada", $(".recovery-panel").textContent.includes("cartera vigente"));
check("R10: sin ficha clínica", !$("[data-ficha]"));
check("R10: sin búsqueda de pacientes", !$$(".app-nav button").some(b => b.textContent === "Buscar"));

/* ===== R15: paciente ===== */
setRole("paciente");
check("paciente: cola es «Su atención de hoy»", $("#main h1").textContent.includes("Su atención de hoy"));
check("paciente: 3 tarjetas", $$(".work-item").length === 3);
$$("[data-open]")[1].click(); // consentimiento-procedimiento
check("paciente: consentimiento separado del de modalidad", $("#main").textContent.includes("una firma no es una autorización universal"));
check("paciente: V04 declarada", $("#main").textContent.includes("brecha V04"));
check("paciente: tres salidas (consentir, tiempo, rechazar)", $$(".action-bar .btn").length === 3);
confirmPrimary();
check("paciente: consentimiento solo de este procedimiento", $(".outcome-receipt").textContent.includes("solo este procedimiento"));
$("[data-back]").click();
$$("[data-open]")[1].click(); // alerta-paciente (el consentimiento ya salió de la cola)
confirmPrimary();
check("paciente: aviso con acuse y escalamiento", $(".outcome-receipt").textContent.includes("acuse") && $(".outcome-receipt").textContent.includes("escala"));
check("paciente: nunca ve ficha clínica", !$("[data-ficha]"));

/* ===== R16: cuidador ===== */
setRole("cuidador");
const caregiverSurface = () => `${$(".identity")?.textContent || ""} ${$("#main")?.textContent || ""}`;
const caregiverIdentity = $(".identity");
const caregiverObligation = $('[data-open="OBL-CU-01"]');
check(
  "cuidador: identidad global deriva de ROLES (María José T., Ana P., HOD-2026-0129)",
  Boolean(caregiverIdentity)
    && $(".identity .who")?.textContent.trim() === "María José T."
    && $(".identity .fn-chip")?.textContent.trim() === "Cuidadora de Ana P. · HOD-2026-0129",
);
check(
  "cuidador: identidad global visible y sin vínculo Rosa/HOD-2026-0131",
  Boolean(caregiverIdentity?.textContent.trim())
    && !/Rosa C\.|HOD-2026-0131/.test(caregiverSurface()),
);
check(
  "cuidador: obligación OBL-CU-01 de Ana P. está en la cola",
  Boolean(caregiverObligation)
    && caregiverObligation.textContent.includes("Ana P.")
    && !/Rosa C\.|HOD-2026-0131/.test(caregiverObligation.textContent),
);
caregiverObligation?.click();
check(
  "cuidador: OBL-CU-01 abre Tarjeta — Ana P.",
  $("#main h1")?.textContent.includes("Su tarjeta de alarma — Ana P."),
);
check(
  "cuidador: escena Tarjeta — Ana P. no resucita Rosa/HOD-2026-0131",
  !/Rosa C\.|HOD-2026-0131/.test(caregiverSurface()),
);
$('[data-back]')?.click();
setRole("paciente");
check(
  "cambio a paciente: identidad propia conserva Rosa/HOD-2026-0131",
  $(".identity .who")?.textContent.trim() === "Rosa C. · 69 años"
    && $(".identity .fn-chip")?.textContent.trim() === "Hospitalización en casa · Día 4"
    && !$(".identity")?.textContent.includes("María José T."),
);
setRole("enfermero-clinico");
check(
  "cambio a otro rol: identidad de enfermería no hereda cuidador ni Ana",
  $(".identity .who")?.textContent.trim() === "Javier Núñez A."
    && $(".identity .fn-chip")?.textContent.trim() === "Enfermería clínica"
    && !$(".identity")?.textContent.includes("María José T.")
    && !$(".identity")?.textContent.includes("HOD-2026-0129"),
);
setRole("cuidador");
check(
  "cuidador: al volver, identidad y OBL-CU-01 no quedan contaminados",
  $(".identity .who")?.textContent.trim() === "María José T."
    && $(".identity .fn-chip")?.textContent.trim() === "Cuidadora de Ana P. · HOD-2026-0129"
    && Boolean($('[data-open="OBL-CU-01"]'))
    && !/Rosa C\.|HOD-2026-0131/.test(caregiverSurface()),
);
check("cuidador: cola es «Su apoyo de hoy»", $("#main h1").textContent.includes("Su apoyo de hoy"));
check("cuidador normal: no existe reporte que fabrique acuse", !$('[data-open="OBL-CU-02"]'));
$$("[data-open]")[0].click(); // tarjeta-alarma
check("cuidador: tarjeta binaria con 131", $(".figure-value").textContent.includes("131"));
check("cuidador: honestidad V02 en la tarjeta", $("#main").textContent.includes("brecha V02"));
check("cuidador: no manipula dispositivos", $("#main").textContent.includes("No manipula dispositivos"));
$("[data-back]").click();
$$("[data-open]")[1].click(); // sobrecarga-cuidador
check("cuidador: retiro sin culpa (E2E-05)", $("#main").textContent.includes("La culpa no es un dato del sistema"));
confirmPrimary();
check("cuidador: retiro activa reevaluación, no abandono", $(".outcome-receipt").textContent.includes("reevaluación inmediata") && $(".outcome-receipt").textContent.includes("no queda sin respuesta"));

/* ===== R03: primera evaluación médica con autoría ===== */
setRole("medico-atencion-directa");
/* La proyección S3 médica aparece como una obligación adicional; el contrato
   legacy conserva sus tres obligaciones y selecciona por identidad, no por
   posición del índice. */
const medicoLegacyItems = $$(".work-item").filter((item) => item.dataset.open !== "VIS-ROSA-M1-0900");
check("médico: 3 obligaciones antes de comunicación crítica", medicoLegacyItems.length === 3);
medicoLegacyItems.find((item) => item.dataset.open === "OBL-MD-04")?.click(); // primera-evaluacion-jorge
check("R03: plan nace con su autoría y reemplaza derivación", $("#main").textContent.includes("reemplaza el de derivación"));
check("R03: verificación de ingreso declarada del regulador", $("#main").textContent.includes("la hizo el médico regulador"));
$$(".action-bar .btn")[0].click();
check("R03: bloqueada hasta aceptación de transferencia", $(".recovery-panel").textContent.includes("no está bajo responsabilidad HODOM"));

/* ===== R02: turnos del día ===== */
setRole("enfermera-coordinadora");
$$('[data-open="OBL-CO-04"]')[0]?.click(); // turnos-del-dia; VIS S3 adicional excluida por identidad
check("R02: ausencia con efecto visible", $("#main").textContent.includes("sin ejecutor"));
check("R02: misma nómina que el DT", $("#main").textContent.includes("misma que administra Dirección Técnica"));
confirmPrimary();
check("R02: reemplazo republica asignaciones", $(".outcome-receipt").textContent.includes("se republica"));

/* ===== R05: paquete de visita ===== */
setRole("enfermero-clinico");
const r05ActiveVisit = $(`[data-open="${S3_VIS_ID}"]`);
check("R05: obligación activa es VIS-ROSA-M1-0900", Boolean(r05ActiveVisit));
r05ActiveVisit?.click();
const r05PackageText = $("#main")?.textContent || "";
check(
  "R05: renderer real del paquete conserva plan, alarmas, insumos y contactos",
  /Plan vigente|plan de cuidados/i.test(r05PackageText)
    && /Alarmas del episodio|Amarillo/i.test(r05PackageText)
    && /Insumos/i.test(r05PackageText)
    && /Contactos/i.test(r05PackageText),
);
check("R05: semáforo diurno declarado", /Amarillo/.test(r05PackageText) && /131/.test(r05PackageText));
check("R05: riesgo nocturno N2 en el paquete", /N2/.test(r05PackageText));
const r05ReviewAction = $("[data-s3-action=\"review-package\"], [data-action=\"review-package\"]");
if (r05ReviewAction) {
  r05ReviewAction.click();
  $("[data-confirm]")?.click();
}
const r05ReviewReceipt = $("[data-s3-receipt=\"package-review\"], [data-review-receipt]");
check(
  "R05: review de suficiencia 08:35 no registra salida ni partida",
  Boolean(r05ReviewReceipt)
    && /08:35|revis|suficiencia/i.test(r05ReviewReceipt.textContent)
    && !/salida registrada|departure authorized|partida autorizada/i.test(r05ReviewReceipt.textContent),
);

/* ===== R07: cierre administrativo (V08) ===== */
setRole("tecnico-enfermeria");
$$("[data-open]")[2].click(); // cierre-admin-tens
check("R07: V08 declarada", $("#main").textContent.includes("brecha V08"));
confirmPrimary();
check("R07: tiempo administrativo medido y separado", $(".outcome-receipt").textContent.includes("6,5 h") && $(".outcome-receipt").textContent.includes("dimensionar"));

/* ===== R11: geolocalización K13 e incidente ===== */
setRole("conductor");
const conductorLegacyItems = $$(".work-item").filter((item) => item.dataset.open !== "VIS-ROSA-M1-0900");
check("conductor: 4 obligaciones", conductorLegacyItems.length === 4);
$$('[data-open="OBL-DR-03"]')[0]?.click(); // geo-jorge
check("R11: custodia de coordenada y foto (K13)", $("#main").textContent.includes("custodia declarada") && $("#main").textContent.includes("K13"));
check("R11: ubicación no prueba atención", $("#main").textContent.includes("nunca prueba que una visita o atención se hizo"));
confirmPrimary();
check("R11: ubicación registrada con precisión declarada", $(".outcome-receipt").textContent.includes("precisión"));
$("[data-back]").click();
$$('[data-open="OBL-DR-04"]')[0]?.click(); // ruta-incidente (geo-jorge ya salió de la cola)
check("R11: propone y coordinación decide", $("#main").textContent.includes("coordinación decide con criterio clínico"));
confirmPrimary();
check("R11: demanda no desaparece", $(".outcome-receipt").textContent.includes("demanda queda visible"));
$$(".app-nav button").find(b => b.textContent.includes("Ruta del día")).click();
check("R11: bitácora del móvil en la ruta", $("#main").textContent.includes("Odómetro de salida") && $("#main").textContent.includes("nunca es bodega"));

/* ===== R12: impresión y nómina no clínica ===== */
setRole("administrativo");
check("administrativo: 4 obligaciones", $$(".work-item").length === 4);
$$("[data-open]")[2].click(); // cola-impresion
check("R12: impresión con constancia y custodia", $("#main").textContent.includes("constancia") && $("#main").textContent.includes("no sale de custodia"));
confirmPrimary();
check("R12: archivo en ficha clínica única", $(".outcome-receipt").textContent.includes("ficha clínica única"));
$("[data-back]").click();
$$("[data-open]")[2].click(); // registro-funcionarios (cola-impresion ya salió de la cola)
check("R12: inducción 32 de 44 registrada", $("#main").textContent.includes("32 de 44"));
confirmPrimary();
check("R12: avance sin habilitar terreno", $(".outcome-receipt").textContent.includes("sigue bloqueada"));

/* ===== R13: anomalía de acceso ===== */
setRole("administrador-seguridad");
check("seguridad: 4 obligaciones", $$(".work-item").length === 4);
$$("[data-open]")[3].click(); // sistema-anomalia
check("R13: alerta gobernada de cuenta compartida", !!$(".alert.A2") && $("#main").textContent.includes("dos sesiones simultáneas"));
confirmPrimary();
check("R13: autoría atribuible de nuevo", $(".outcome-receipt").textContent.includes("atribuible a una persona por sesión"));

/* ===== R01: base de conocimiento y nómina ===== */
setRole("direccion-tecnica");
check("DT: 5 obligaciones", $$(".work-item").length === 5);
$$("[data-open]")[3].click(); // kb-gobierno
check("DT KB: PRO-110 histórico con V11", $("#main").textContent.includes("PRO-110") && $("#main").textContent.includes("V11"));
check("DT KB: REAS no opera sin visación IAAS", $("#main").textContent.includes("no opera hasta visación IAAS"));
confirmPrimary();
check("DT KB: publicar versiona, no declara práctica", $(".outcome-receipt").textContent.includes("versión 4"));
$("[data-back]").click();
$$("[data-open]")[3].click(); // nomina-dt (kb-gobierno ya salió de la cola)
const habilitarBtn = $$(".action-bar .btn").find(b => b.textContent.includes("Habilitar terreno"));
check("DT nómina: habilitación bloqueada por inducción incompleta", !!habilitarBtn && habilitarBtn.classList.contains("blocked"));
habilitarBtn.click();
check("DT nómina: explicación 44 horas", $(".recovery-panel").textContent.includes("44 horas"));
confirmPrimary();
check("DT nómina: licencia aprobada con reemplazo", $(".outcome-receipt").textContent.includes("reemplazo interno"));

/* ===== DT: vista de recorridos (escenarios, etapas, brechas) ===== */
$$(".app-nav button").find(b => b.textContent.includes("Recorridos y brechas")).click();
check("recorridos: lente escenarios por defecto con las 13 cadenas", $("#main").textContent.includes("E2E-01") && $("#main").textContent.includes("E2E-13"));
check("recorridos: cada escenario declara su señal roja", $$(".e2e-rojo").length === 13);
check("recorridos: E2E-08 parte en Laboratorio (cadena de chips)", $$(".e2e-card")[7].querySelector(".e2e-chip").textContent.includes("Laboratorio"));
check("recorridos: chips de pasos son navegables y legibles", $$(".e2e-chain").length === 13 && $$(".e2e-chip").length > 40);
$('[data-brecha-lens="etapas"]').click();
check("recorridos: strip J0–J10 presente", $$("[data-brecha-stage]").length === 11);
check("recorridos: matriz 34 roles × 11 etapas", $$("table.j-matrix tbody tr").length === 34);
check("recorridos: J0 por defecto produce DT/IAAS/Calidad/Dirección/GP/Logística/TI", $(".stage-panel").textContent.includes("DT") && $(".stage-panel").textContent.includes("IAAS"));
$('[data-brecha-stage="J8"]').click();
check("recorridos: J8 rescate — UEA y SAMU producen, paciente y cuidador participan", $(".stage-panel").textContent.includes("UEA receptora") && $(".stage-panel").textContent.includes("handoff"));
$('[data-brecha-lens="brechas"]').click();
check("brechas: las 13 V presentes", $("#main").textContent.includes("V01") && $("#main").textContent.includes("V13"));
check("brechas: declaradas sin cerrar por pantalla", $("#main").textContent.includes("ninguna pantalla las cierra"));
check("brechas: interfaces externas con pantalla propia de handoff", $("#main").textContent.includes("tienen su propia pantalla"));

/* ===== interfaces externas (Parte III): pantalla con handoff y acuse ===== */
setRole("receptor-uea");
check("R21 UEA normal: sin prealerta sembrada antes de evento causal", !$$("[data-open]").length && $("#main").textContent.includes("Sin pendientes"));
setRole("aps-cesfam");
$$("[data-open]")[0].click();
check("R23 APS: epicrisis enviada no es recepción (alerta gobernada)", $(".alert").textContent.includes("sin acuse"));
check("R23 APS: devolver con motivo existe como salida", $$(".action-bar .btn").some(b => b.textContent.includes("Devolver con motivo")));
setRole("laboratorio");
$$("[data-open]")[0].click();
check("R25 LAB: crítico A4 con read-back", $(".alert.A4").textContent.includes("read-back"));
confirmPrimary();
check("R25 LAB: la comunicación produce la obligación del médico", $(".outcome-receipt").textContent.includes("obligación visible"));
setRole("gestion-camas");
$$("[data-open]")[0].click();
check("R20 Camas: cola compartida con V01 declarada", $("#main").textContent.includes("V01") && $("#main").textContent.includes("nunca se registra como rechazo clínico"));
setRole("seremi");
check("R14 SEREMI: 2 obligaciones de fiscalización", $$(".work-item").length === 2);
$$("[data-open]")[1].click();
check("R14 SEREMI: observación con plazo y verificación de cierre", $("#main").textContent.includes("verificación de cierre") && $("#main").textContent.includes("21-08-2026"));
setRole("red-social");
$$("[data-open]")[0].click();
check("R34 Red social: apoyo nominal no existe", $("#main").textContent.includes("Red nominal sin confirmar no existe"));

/* ===== ficha: cinta de journey J0–J10 ===== */
setRole("medico-atencion-directa");
$$('[data-open="OBL-MD-02"]')[0]?.click(); // atencion-rosa; VIS S3 médica se selecciona aparte
$("[data-ficha]").click();
check("ficha: cinta de journey presente", !!$(".j-strip"));
check("ficha: 11 etapas J0–J10", $$(".j-cell").length === 11);
check("ficha: etapa actual J6 marcada", $(".j-cell.now").textContent === "J6");
check("ficha: riesgo nocturno N2 en pulso", $("#main").textContent.includes("N2"));

/* ===== work_one de R10 no rompe cambio de rol posterior ===== */
setRole("otro-profesional");
setRole("paciente");
check("trabajo único no persiste entre roles", $$(".work-item").length === 3);

/* ===== E2E-08/S3 · RED de contratos, proyecciones y fronteras de rol ===== */
/* Una sola sesión: revisión → disposición → partida observada → orden médica. */
const s3Flow = s3Boot();
s3SetRole(s3Flow, "enfermero-clinico");
const s3NurseVisit = s3Find(s3Flow, S3_VIS_SELECTORS);
const s3NurseVisitText = s3Text(s3NurseVisit);
const s3LegacyPackage = s3Find(s3Flow, [
  '[data-open="OBL-EN-04"]',
  '[data-obligation-id="OBL-EN-04"]',
  '[data-work-id="OBL-EN-04"]'
]);
check(
  "S3 contratos: VIS-ROSA-M1-0900 reemplaza OBL-EN-04 en la cola de enfermería",
  Boolean(s3NurseVisit) && !s3LegacyPackage,
);
check(
  "S3 contratos: VIS declara M1, Enfermería + TENS y ventana 09:00–10:00",
  Boolean(s3NurseVisit)
    && /M1/i.test(s3NurseVisitText)
    && /enfermer[ií]a/i.test(s3NurseVisitText)
    && /TENS/i.test(s3NurseVisitText)
    && /09:00\s*[–-]\s*10:00/.test(s3NurseVisitText),
);
s3SetRole(s3Flow, "enfermero-clinico");
const s3ContractsDayNav = s3Flow.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
s3Click(s3ContractsDayNav);
const s3PreDayText = s3Text(s3Flow.$("#main"));
check(
  "S3 contratos: Mi día pre-salida deriva del log y no presenta VIS completada ni llegada/salida clínica",
  Boolean(s3Flow.$("#main"))
    && !/completad|09:02|09:52|curaci[oó]n|administrar tratamiento|educar al cuidador|salida observada/i.test(s3PreDayText),
);
const s3WorkNav = s3Flow.$$(".app-nav button").find((button) => /Tareas del d[ií]a|Trabajo/i.test(button.textContent));
s3Click(s3WorkNav);
const s3VisitOpened = s3Activate(s3Flow, S3_VIS_SELECTORS);
const s3Review = s3Find(s3Flow, S3_REVIEW_SELECTORS);
const s3ReviewText = s3Text(s3Review);
const s3ReviewMarkup = s3Review?.outerHTML || "";
check(
  "S3 contratos: revisión de paquete enfermera a las 08:35 con criticalInstructionRevision y nursingPlan v5",
  s3VisitOpened
    && Boolean(s3Review)
    && /08:35/.test(s3ReviewText)
    && /criticalInstructionRevision|instrucci[oó]n cr[ií]tica/i.test(`${s3ReviewText} ${s3ReviewMarkup}`)
    && /nursingPlan|plan de cuidados/i.test(`${s3ReviewText} ${s3ReviewMarkup}`)
    && /v5|versi[oó]n\s*5/i.test(`${s3ReviewText} ${s3ReviewMarkup}`),
);
const s3NursePrimary = s3Flow.$$("#main .btn.primary");
const s3NursePrimaryText = s3NursePrimary[0]?.textContent || "";
check(
  "S3 contratos: revisión no autoriza salida vehicular",
  s3VisitOpened
    && Boolean(s3Review)
    && s3NursePrimary.length === 1
    && /revis|paquete/i.test(s3NursePrimaryText)
    && !/salida|partir|despach/i.test(s3NursePrimaryText),
);
const s3ReviewAction = s3Find(s3Flow, S3_REVIEW_ACTION_SELECTORS);
const s3ReviewClicked = s3Activate(s3Flow, S3_REVIEW_ACTION_SELECTORS);
if (s3ReviewClicked) s3Confirm(s3Flow);
const s3ReviewReceipt = s3Find(s3Flow, [
  '[data-s3-receipt="package-review"]',
  '[data-review-receipt]'
]);
check(
  "S3 contratos: receipt de revisión conserva el paquete sin registrar partida",
  s3VisitOpened
    && Boolean(s3ReviewAction)
    && s3ReviewClicked
    && Boolean(s3ReviewReceipt)
    && /revis|review/i.test(s3Text(s3ReviewReceipt))
    && !/salida registrada|departure authorized|partida autorizada/i.test(s3Text(s3ReviewReceipt)),
);

s3SetRole(s3Flow, "enfermera-coordinadora");
const s3ManifestNav = s3Flow.$$(".app-nav button").find((button) => /manifiesto|VIS|M1/i.test(button.textContent));
s3Click(s3ManifestNav);
const s3Manifest = s3Find(s3Flow, S3_MANIFEST_SELECTORS);
const s3ManifestText = s3Text(s3Manifest);
check(
  "S3 contratos: coordinación proyecta manifiesto M1 con VIS y referencia a la revisión",
  Boolean(s3Manifest)
    && s3ManifestText.includes(S3_VIS_ID)
    && /08:35/.test(s3ManifestText)
    && /criticalInstructionRevision|nursingPlan|revisi[oó]n/i.test(s3ManifestText),
);
const s3CoordPrimary = s3Manifest?.querySelectorAll(".btn.primary, [data-primary=\"true\"]") || [];
const s3CoordPrimaryText = s3CoordPrimary[0]?.textContent || "";
check(
  "S3 contratos: coordinación tiene una primaria para disposición VIS, no para salida vehicular total",
  Boolean(s3Manifest)
    && s3CoordPrimary.length === 1
    && /VIS|disposici[oó]n|programa/i.test(s3CoordPrimaryText)
    && !/salida\s+vehicular|partida\s+total/i.test(s3CoordPrimaryText),
);
const s3DispositionAction = s3Find(s3Flow, S3_DISPOSITION_ACTION_SELECTORS, s3Manifest || s3Flow.window.document);
const s3DispositionClicked = s3Activate(s3Flow, S3_DISPOSITION_ACTION_SELECTORS, s3Manifest || s3Flow.window.document);
if (s3DispositionClicked) s3Confirm(s3Flow);
const s3DispositionReceipt = s3Find(s3Flow, [
  '[data-s3-receipt="vis-disposition"]',
  '[data-vis-disposition-receipt]'
]);
check(
  "S3 contratos: disposición VIS queda en manifiesto con receipt, sin autorizar salida total",
  Boolean(s3Manifest)
    && Boolean(s3DispositionAction)
    && s3DispositionClicked
    && Boolean(s3DispositionReceipt)
    && !/salida\s+vehicular\s+total|partida\s+total/i.test(s3Text(s3DispositionReceipt)),
);

for (const [role, label] of [["medico-atencion-directa", "medicina"], ["kinesiologo", "kinesiología"]]) {
  const ui = s3Boot();
  s3SetRole(ui, role);
  const miDia = ui.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
  s3Click(miDia);
  const bodyText = s3Text(ui.$("#main"));
  check(
    `S3 contratos: M2 ${label} permanece fuera de VIS-ROSA-M1-0900`,
    Boolean(miDia)
      && /M[oó]vil 2|09:05/.test(bodyText)
      && !bodyText.includes(S3_VIS_ID)
    && !s3Find(ui, S3_VIS_SELECTORS),
  );
}

const s3Timeline = s3Find(s3Flow, ["[data-s3-timeline]", "[data-s3-event-log]", "[data-s3-log]"]);
const s3Times = ["08:14", "08:35", "08:40", "08:45"];
const s3TimeText = s3Text(s3Timeline);
const s3TimePositions = s3Times.map((time) => s3TimeText.indexOf(time));
check(
  "S3 contratos: reloj sintético 08:14 → 08:35 → 08:40 → 08:45 es monótono",
  Boolean(s3Timeline) && s3TimePositions.every((position, index) => position >= 0 && (index === 0 || position > s3TimePositions[index - 1])),
);
const s3Inference = s3Find(s3Flow, ["[data-s3-inference]", "[data-inference=\"manifest-departure\"]"]);
check(
  "S3 contratos: inferencia manifiesto + partida conserva referencia causal y limita lo probado",
  Boolean(s3Inference)
    && /manifiesto|manifest/i.test(s3Text(s3Inference))
    && /partida|departure|salida/i.test(s3Text(s3Inference))
    && /no demuestra|limita|no prueba/i.test(s3Text(s3Inference)),
);

/* Partida observada: el vehículo avanza, la VIS no se vuelve atención. */
s3SetRole(s3Flow, "conductor");
const s3RouteNav = s3Flow.$$(".app-nav button").find((button) => /Ruta del d[ií]a/i.test(button.textContent));
s3Click(s3RouteNav);
const s3DepartureAction = s3Find(s3Flow, S3_DEPARTURE_ACTION_SELECTORS);
const s3DepartureClicked = s3Activate(s3Flow, S3_DEPARTURE_ACTION_SELECTORS);
if (s3DepartureClicked) s3Confirm(s3Flow);
const s3Departure = s3Find(s3Flow, [
  '[data-s3-departure]',
  '[data-departure-state]',
  '[data-departure="M1"]'
]);
const s3DepartureText = s3Text(s3Departure);
check(
  "S3 contratos: vehicle_departure_observed deja M1 en ruta sin probar atención",
  Boolean(s3RouteNav)
    && Boolean(s3DepartureAction)
    && s3DepartureClicked
    && Boolean(s3Departure)
    && /M1|08:45/.test(s3DepartureText)
    && /observad|bloquead/i.test(s3DepartureText),
);
check(
  "S3 contratos: proyección del conductor excluye Rosa, K y plan/log clínico",
  Boolean(s3Departure)
    && !/Rosa|R\.\s*C\.|kinesi|plan cl[ií]nico|log cl[ií]nico/i.test(s3DepartureText),
);

s3SetRole(s3Flow, "medico-atencion-directa");
const s3MedicalTask = s3Flow.$$("[data-e2e08-s3-open]").find((button) => button.dataset.e2e08S3Open === S3_VIS_ID);
const s3MedicalOpen = s3Click(s3MedicalTask);
const s3CancelAction = s3Find(s3Flow, S3_CANCEL_ACTION_SELECTORS);
const s3CancelClicked = s3Activate(s3Flow, S3_CANCEL_ACTION_SELECTORS);
if (s3CancelClicked) s3Confirm(s3Flow);
const s3CancelReceipt = s3Find(s3Flow, [
  '[data-s3-receipt="medical-urgency"]',
  '[data-urgent-referral-intent]',
  '[data-s3-receipt="cancelled_by_medical_order"]'
]);
check(
  "S3 contratos: cancelled_by_medical_order conserva partida y cancela VIS sin atención",
  s3MedicalOpen
    && Boolean(s3CancelAction)
    && s3CancelClicked
    && Boolean(s3CancelReceipt)
    && /cancel|derivaci[oó]n|referral/i.test(s3Text(s3CancelReceipt)),
);
s3SetRole(s3Flow, "enfermero-clinico");
const s3CancelledMiDiaNav = s3Flow.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
s3Click(s3CancelledMiDiaNav);
const s3CancelledVisit = s3Find(s3Flow, S3_VIS_SELECTORS);
const s3CancelledText = s3Text(s3CancelledVisit);
check(
  "S3 contratos: VIS cancelada nunca aparece como completada después de la orden médica",
  Boolean(s3CancelledVisit)
    && /cancelad|cancelled/i.test(s3CancelledText)
    && !/completad|09:02|09:52|salida observada/i.test(s3CancelledText),
);

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
