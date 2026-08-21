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
check("cuidador: retiro conserva la señal sin fabricar evaluación ni acuse", $(".outcome-receipt").textContent.includes("esta sesión de maqueta") && $(".outcome-receipt").textContent.includes("acuse") && $(".outcome-receipt").textContent.includes("PENDIENTES / NO DETERMINADOS") && !$(".outcome-receipt").textContent.includes("con acuse"));

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
const r11GeoAction = $('[data-act="dr-geo"]');
check(
  "R11: sin evidencia geográfica la ubicación no se puede completar",
  r11GeoAction?.classList.contains("blocked")
    && r11GeoAction?.dataset.av === "blocked_explainable",
);
r11GeoAction?.click();
check(
  "R11: recovery exige coordenada, precisión y referencia sin fabricar captura",
  /coordenada/i.test($(".recovery-panel")?.textContent || "")
    && /precisi[oó]n/i.test($(".recovery-panel")?.textContent || "")
    && /referencia/i.test($(".recovery-panel")?.textContent || "")
    && !$(".outcome-receipt"),
);
$("[data-back]").click();
check("R11: ubicación no verificada permanece en la cola", !!$('[data-open="OBL-DR-03"]'));
$$('[data-open="OBL-DR-04"]')[0]?.click(); // ruta-incidente
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
const r13AnomalyReceipt = $(".outcome-receipt")?.textContent || "";
check(
  "R13: contener la segunda sesión no inventa identidad atribuible",
  /segunda sesi[oó]n suspendida/i.test(r13AnomalyReceipt)
    && /atribuci[oó]n.*pendiente.*confirmaci[oó]n del titular/i.test(r13AnomalyReceipt)
    && !/autor[ií]a vuelve a ser atribuible/i.test(r13AnomalyReceipt),
);
const r13SceneTitle = $("#main h1")?.textContent;
window.openCase("HOD-2026-0131");
check(
  "R13: investigar la anomalía no habilita ficha ni búsqueda clínica",
  $("#main h1")?.textContent === r13SceneTitle
    && !$("[data-ficha]")
    && !$$('[data-nav="buscar"]').length,
);

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
const r14Authorization = s3Boot();
s3SetRole(r14Authorization, "seremi");
const r14AuthorizationOpen = r14Authorization.$$('[data-open="OBL-SE-01"]');
s3Click(r14AuthorizationOpen[0]);
const r14ResolveAction = r14Authorization.$('[data-act="se-resolver"]');
check(
  "R14 autorización: la relación rol + obligación + escena es única y falla cerrada sin base",
  r14AuthorizationOpen.length === 1
    && r14ResolveAction?.classList.contains("blocked")
    && r14ResolveAction?.dataset.av === "blocked_explainable",
);
s3Click(r14ResolveAction);
const r14RecoveryText = r14Authorization.$(".recovery-panel")?.textContent || "";
check(
  "R14 autorización: recovery exige antecedentes recuperables y una decisión explícita",
  /antecedentes.*recuperables.*atribuibles/i.test(r14RecoveryText)
    && /decisi[oó]n.*expl[ií]cita/i.test(r14RecoveryText)
    && /expediente.*pendiente/i.test(r14RecoveryText)
    && !r14Authorization.$(".outcome-receipt"),
);
s3Click(r14Authorization.$("[data-back]"));
check(
  "R14 autorización: el expediente sigue pendiente y la observación concreta permanece operable",
  Boolean(r14Authorization.$('[data-open="OBL-SE-01"]'))
    && Boolean(r14Authorization.$('[data-open="OBL-SE-02"]')),
);
const r17Scope = s3Boot();
s3SetRole(r17Scope, "representante-legal");
const r17ScopeOpen = r17Scope.$$('[data-open="OBL-RL-01"]');
s3Click(r17ScopeOpen[0]);
const r17VerifyAction = r17Scope.$('[data-act="rl-alcance"]');
check(
  "R17 representación: la relación única no permite auto-verificar calidad y alcance",
  r17ScopeOpen.length === 1
    && r17VerifyAction?.classList.contains("blocked")
    && r17VerifyAction?.dataset.av === "blocked_explainable",
);
s3Click(r17VerifyAction);
const r17RecoveryText = r17Scope.$(".recovery-panel")?.textContent || "";
check(
  "R17 representación: recovery separa declaración personal de verificación competente",
  /no puede verificar su propia calidad ni alcance/i.test(r17RecoveryText)
    && /equipo HODOM.*verifica/i.test(r17RecoveryText)
    && /obligaci[oó]n.*pendiente/i.test(r17RecoveryText)
    && !r17Scope.$(".outcome-receipt"),
);
check(
  "R17 representación: sin verificación no obtiene ficha ni búsqueda clínica",
  !r17Scope.$("[data-ficha]")
    && !r17Scope.$$('[data-nav="buscar"]').length,
);
s3Click(r17Scope.$("[data-back]"));
check("R17 representación: OBL-RL-01 permanece pendiente", Boolean(r17Scope.$('[data-open="OBL-RL-01"]')));
const r18Reconciliation = s3Boot();
s3SetRole(r18Reconciliation, "medico-derivador");
const r18ReconciliationOpen = r18Reconciliation.$$('[data-open="OBL-EX-02"]');
s3Click(r18ReconciliationOpen[0]);
const r18AttachAction = r18Reconciliation.$('[data-act="ex-conciliacion"]');
check(
  "R18 conciliación: la relación rol + obligación + escena es única y no fabrica un adjunto",
  r18ReconciliationOpen.length === 1
    && r18AttachAction?.classList.contains("blocked")
    && r18AttachAction?.dataset.av === "blocked_explainable",
);
s3Click(r18AttachAction);
const r18RecoveryText = r18Reconciliation.$(".recovery-panel")?.textContent || "";
check(
  "R18 conciliación: recovery exige contenido, autoría y procedencia antes de continuar evaluación",
  /conciliaci[oó]n.*contenido/i.test(r18RecoveryText)
    && /autor[ií]a.*procedencia/i.test(r18RecoveryText)
    && /evaluaci[oó]n.*pendiente/i.test(r18RecoveryText)
    && /conserva.*responsabilidad/i.test(r18RecoveryText)
    && !r18Reconciliation.$(".outcome-receipt"),
);
check(
  "R18 conciliación: el derivador externo no obtiene ficha, búsqueda ni censo interno",
  !r18Reconciliation.$("[data-ficha]")
    && !r18Reconciliation.$$('[data-nav="buscar"]').length
    && !r18Reconciliation.$$('[data-nav="censo"]').length,
);
s3Click(r18Reconciliation.$("[data-back]"));
check(
  "R18 conciliación: OBL-EX-02 permanece pendiente y OBL-EX-01 sigue independiente",
  Boolean(r18Reconciliation.$('[data-open="OBL-EX-02"]'))
    && Boolean(r18Reconciliation.$('[data-open="OBL-EX-01"]')),
);
const r30RiskDecision = s3Boot();
s3SetRole(r30RiskDecision, "direccion-hospital");
const r30RiskOpen = r30RiskDecision.$$('[data-open="OBL-DH-01"]');
s3Click(r30RiskOpen[0]);
const r30DecideAction = r30RiskDecision.$('[data-act="dh-decidir"]');
check(
  "R30 riesgo: la relación rol + obligación + escena es única y no fabrica una decisión genérica",
  r30RiskOpen.length === 1
    && r30DecideAction?.classList.contains("blocked")
    && r30DecideAction?.dataset.av === "blocked_explainable",
);
s3Click(r30DecideAction);
const r30RecoveryText = r30RiskDecision.$(".recovery-panel")?.textContent || "";
check(
  "R30 riesgo: recovery exige alternativa, plazo y consecuencia explícitos",
  /aceptar.*reducir.*transferir.*suspender/i.test(r30RecoveryText)
    && /plazo.*consecuencia/i.test(r30RecoveryText)
    && /riesgo.*pendiente/i.test(r30RecoveryText)
    && !r30RiskDecision.$(".confirm-strip")
    && !r30RiskDecision.$(".outcome-receipt"),
);
s3Click(r30RiskDecision.$("[data-back]"));
check(
  "R30 riesgo: OBL-DH-01 permanece pendiente sin decisión institucional aparente",
  Boolean(r30RiskDecision.$('[data-open="OBL-DH-01"]')),
);
const r31Qualification = s3Boot();
s3SetRole(r31Qualification, "gestion-personas");
const r31QualificationOpen = r31Qualification.$$('[data-open="OBL-GP-01"]');
s3Click(r31QualificationOpen[0]);
const r31QualificationAction = r31Qualification.$('[data-act="gp-habilitar"]');
check(
  "R31 habilitación: la relación única muestra 32/44 y no fabrica inducción completa",
  r31QualificationOpen.length === 1
    && /32 de 44/i.test(r31Qualification.$("#main")?.textContent || "")
    && r31QualificationAction?.classList.contains("blocked")
    && r31QualificationAction?.dataset.av === "blocked_explainable",
);
s3Click(r31QualificationAction);
const r31RecoveryText = r31Qualification.$(".recovery-panel")?.textContent || "";
check(
  "R31 habilitación: recovery conserva terreno bloqueado y exige las 12 h restantes",
  /32 de 44/i.test(r31RecoveryText)
    && /faltan 12 h/i.test(r31RecoveryText)
    && /te[oó]rica.*pr[aá]ctica.*supervisada/i.test(r31RecoveryText)
    && /terreno.*bloquead/i.test(r31RecoveryText)
    && !r31Qualification.$(".confirm-strip")
    && !r31Qualification.$(".outcome-receipt"),
);
s3Click(r31Qualification.$("[data-back]"));
check(
  "R31 habilitación: OBL-GP-01 permanece pendiente",
  Boolean(r31Qualification.$('[data-open="OBL-GP-01"]')),
);
s3SetRole(r31Qualification, "direccion-tecnica");
s3Click(r31Qualification.$('[data-open="OBL-DT-05"]'));
check(
  "R31 habilitación: Dirección Técnica conserva la misma base 32/44 y el bloqueo",
  /32 de 44/i.test(r31Qualification.$("#main")?.textContent || "")
    && r31Qualification.$('[data-act="dt-habilitar"]')?.classList.contains("blocked"),
);
const r24Dispensing = s3Boot();
s3SetRole(r24Dispensing, "farmacia");
const r24DispensingOpen = r24Dispensing.$$('[data-open="OBL-FA-01"]');
s3Click(r24DispensingOpen[0]);
const r24DispenseAction = r24Dispensing.$('[data-act="fa-dispensar"]');
check(
  "R24 dispensación: la relación única no confirma una entrega sin evidencia capturada",
  r24DispensingOpen.length === 1
    && !r24Dispensing.$("#main input, #main textarea, #main select")
    && r24DispenseAction?.classList.contains("blocked")
    && r24DispenseAction?.dataset.av === "blocked_explainable",
);
s3Click(r24DispenseAction);
const r24RecoveryText = r24Dispensing.$(".recovery-panel")?.textContent || "";
check(
  "R24 dispensación: recovery exige contenido, hora, custodia y receptor de entrega",
  /contenido.*hora.*custodia.*receptor/i.test(r24RecoveryText)
    && /dispensaci[oó]n.*pendiente/i.test(r24RecoveryText)
    && /cuidador.*no/i.test(r24RecoveryText)
    && !r24Dispensing.$(".confirm-strip")
    && !r24Dispensing.$(".outcome-receipt"),
);
s3Click(r24Dispensing.$("[data-back]"));
check(
  "R24 dispensación: OBL-FA-01 permanece pendiente",
  Boolean(r24Dispensing.$('[data-open="OBL-FA-01"]')),
);
const r28Applicability = s3Boot();
s3SetRole(r28Applicability, "iaas");
const r28ApplicabilityOpen = r28Applicability.$$('[data-open="OBL-IA-01"]');
s3Click(r28ApplicabilityOpen[0]);
const r28ApproveAction = r28Applicability.$('[data-act="ia-visar"]');
check(
  "R28 IAAS: la relación única no visa un protocolo sin evidencia capturada",
  r28ApplicabilityOpen.length === 1
    && /pendiente de visaci[oó]n IAAS/i.test(r28Applicability.$("#main")?.textContent || "")
    && !r28Applicability.$("#main input, #main textarea, #main select")
    && r28ApproveAction?.classList.contains("blocked")
    && r28ApproveAction?.dataset.av === "blocked_explainable",
);
s3Click(r28ApproveAction);
const r28RecoveryText = r28Applicability.$(".recovery-panel")?.textContent || "";
check(
  "R28 IAAS: recovery exige protocolo y evidencia de aplicabilidad, conocimiento y ejecución",
  /protocolo.*evidencia.*aplicabilidad/i.test(r28RecoveryText)
    && /conocid.*ejecutable/i.test(r28RecoveryText)
    && /visaci[oó]n.*pendiente/i.test(r28RecoveryText)
    && !r28Applicability.$(".confirm-strip")
    && !r28Applicability.$(".outcome-receipt"),
);
s3Click(r28Applicability.$("[data-back]"));
check(
  "R28 IAAS: OBL-IA-01 permanece pendiente",
  Boolean(r28Applicability.$('[data-open="OBL-IA-01"]')),
);
const r33ControlEvidence = s3Boot();
s3SetRole(r33ControlEvidence, "ti-datos");
const r33ControlOpen = r33ControlEvidence.$$('[data-open="OBL-TI-01"]');
s3Click(r33ControlOpen[0]);
const r33VerifyAction = r33ControlEvidence.$('[data-act="ti-verificar"]');
const r33ControlText = r33ControlEvidence.$("#main")?.textContent || "";
check(
  "R33 controles: la relación única no verifica evidencia ausente",
  r33ControlOpen.length === 1
    && /ejercicio pendiente/i.test(r33ControlText)
    && /declarado, no cerrado/i.test(r33ControlText)
    && !r33ControlEvidence.$("#main input, #main textarea, #main select")
    && r33VerifyAction?.classList.contains("blocked")
    && r33VerifyAction?.dataset.av === "blocked_explainable",
);
s3Click(r33VerifyAction);
const r33RecoveryText = r33ControlEvidence.$(".recovery-panel")?.textContent || "";
check(
  "R33 controles: recovery exige guard, prueba negativa, evidencia y plan recuperables",
  /guard vivo.*prueba negativa/i.test(r33RecoveryText)
    && /evidencia.*plan.*recuperable/i.test(r33RecoveryText)
    && /V05.*abierta/i.test(r33RecoveryText)
    && /verificaci[oó]n.*pendiente/i.test(r33RecoveryText)
    && !r33ControlEvidence.$(".confirm-strip")
    && !r33ControlEvidence.$(".outcome-receipt"),
);
s3Click(r33ControlEvidence.$("[data-back]"));
check(
  "R33 controles: OBL-TI-01 permanece pendiente",
  Boolean(r33ControlEvidence.$('[data-open="OBL-TI-01"]')),
);
const r27Recommendation = s3Boot();
s3SetRole(r27Recommendation, "especialista");
const r27RecommendationOpen = r27Recommendation.$$('[data-open="OBL-ESP-01"]');
s3Click(r27RecommendationOpen[0]);
const r27RecommendAction = r27Recommendation.$('[data-act="esp-recomendar"]');
check(
  "R27 especialista: la relación única no emite contenido clínico ausente",
  r27RecommendationOpen.length === 1
    && !r27Recommendation.$("#main input, #main textarea, #main select")
    && r27RecommendAction?.classList.contains("blocked")
    && r27RecommendAction?.dataset.av === "blocked_explainable",
);
s3Click(r27RecommendAction);
const r27RecoveryText = r27Recommendation.$(".recovery-panel")?.textContent || "";
check(
  "R27 especialista: recovery exige recomendación, certeza, alertas y seguimiento",
  /recomendaci[oó]n.*certeza.*alertas.*seguimiento/i.test(r27RecoveryText)
    && /integraci[oó]n.*pendiente/i.test(r27RecoveryText)
    && /plan.*no cambia/i.test(r27RecoveryText)
    && !r27Recommendation.$(".confirm-strip")
    && !r27Recommendation.$(".outcome-receipt"),
);
s3Click(r27Recommendation.$("[data-back]"));
check(
  "R27 especialista: OBL-ESP-01 permanece pendiente",
  Boolean(r27Recommendation.$('[data-open="OBL-ESP-01"]')),
);
const r26DiagnosticCircuit = s3Boot();
s3SetRole(r26DiagnosticCircuit, "imagenologia");
const r26DiagnosticOpen = r26DiagnosticCircuit.$$('[data-open="OBL-IMG-01"]');
s3Click(r26DiagnosticOpen[0]);
const r26ScheduleAction = r26DiagnosticCircuit.$('[data-act="img-citar"]');
check(
  "R26 imagenología: la relación única no confirma un circuito diagnóstico ausente",
  r26DiagnosticOpen.length === 1
    && !r26DiagnosticCircuit.$("#main input, #main textarea, #main select")
    && r26ScheduleAction?.classList.contains("blocked")
    && r26ScheduleAction?.dataset.av === "blocked_explainable",
);
s3Click(r26ScheduleAction);
const r26RecoveryText = r26DiagnosticCircuit.$(".recovery-panel")?.textContent || "";
check(
  "R26 imagenología: recovery exige citación, preparación, traslado y retorno recuperables",
  /citaci[oó]n.*preparaci[oó]n.*traslado.*retorno/i.test(r26RecoveryText)
    && /episodio.*no cambia/i.test(r26RecoveryText)
    && /informe.*integraci[oó]n.*pendiente/i.test(r26RecoveryText)
    && !r26DiagnosticCircuit.$(".confirm-strip")
    && !r26DiagnosticCircuit.$(".outcome-receipt"),
);
s3Click(r26DiagnosticCircuit.$("[data-back]"));
check(
  "R26 imagenología: OBL-IMG-01 permanece pendiente",
  Boolean(r26DiagnosticCircuit.$('[data-open="OBL-IMG-01"]')),
);
const r20BedDemand = s3Boot();
s3SetRole(r20BedDemand, "gestion-camas");
const r20BedDemandOpen = r20BedDemand.$$('[data-open="OBL-GC-01"]');
s3Click(r20BedDemandOpen[0]);
const r20ProposeAction = r20BedDemand.$('[data-act="gc-proponer"]');
check(
  "R20 camas: la relación única no incorpora un candidato ni motivo ausentes",
  r20BedDemandOpen.length === 1
    && !r20BedDemand.$("#main input, #main textarea, #main select")
    && r20ProposeAction?.classList.contains("blocked")
    && r20ProposeAction?.dataset.av === "blocked_explainable",
);
s3Click(r20ProposeAction);
const r20RecoveryText = r20BedDemand.$(".recovery-panel")?.textContent || "";
check(
  "R20 camas: recovery exige candidato, motivo, capacidad y restricciones recuperables",
  /candidato.*motivo.*capacidad.*restricciones/i.test(r20RecoveryText)
    && /V01.*abierta/i.test(r20RecoveryText)
    && /aceptaci[oó]n.*cupo.*traslado/i.test(r20RecoveryText)
    && !r20BedDemand.$(".confirm-strip")
    && !r20BedDemand.$(".outcome-receipt"),
);
s3Click(r20BedDemand.$("[data-back]"));
check(
  "R20 camas: OBL-GC-01 permanece pendiente",
  Boolean(r20BedDemand.$('[data-open="OBL-GC-01"]')),
);
const r29QualityAnalysis = s3Boot();
s3SetRole(r29QualityAnalysis, "calidad");
const r29QualityOpen = r29QualityAnalysis.$$('[data-open="OBL-CA-01"]');
s3Click(r29QualityOpen[0]);
const r29AnalyzeAction = r29QualityAnalysis.$('[data-act="ca-analizar"]');
check(
  "R29 calidad: la relación única no abre un análisis con evidencia ausente",
  r29QualityOpen.length === 1
    && !r29QualityAnalysis.$("#main input, #main textarea, #main select")
    && r29AnalyzeAction?.classList.contains("blocked")
    && r29AnalyzeAction?.dataset.av === "blocked_explainable",
);
s3Click(r29AnalyzeAction);
const r29RecoveryText = r29QualityAnalysis.$(".recovery-panel")?.textContent || "";
check(
  "R29 calidad: recovery exige método, participantes, fecha y voz del usuario recuperables",
  /m[eé]todo.*participantes.*fecha.*voz del usuario/i.test(r29RecoveryText)
    && /evento.*abierto/i.test(r29RecoveryText)
    && /V06.*abierta/i.test(r29RecoveryText)
    && /acci[oó]n correctiva.*efecto.*pendientes/i.test(r29RecoveryText)
    && !r29QualityAnalysis.$(".confirm-strip")
    && !r29QualityAnalysis.$(".outcome-receipt"),
);
s3Click(r29QualityAnalysis.$("[data-back]"));
check(
  "R29 calidad: OBL-CA-01 permanece pendiente",
  Boolean(r29QualityAnalysis.$('[data-open="OBL-CA-01"]')),
);
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

/* ===== R05/J6: obligación de Enfermería conserva su propia finalidad ===== */
const r05Visit = s3Boot();
s3SetRole(r05Visit, "enfermero-clinico");
const r05RosaMatches = r05Visit.$$('[data-open="OBL-EN-01"]');
const r05Open = r05Visit.$('[data-open="OBL-EN-01"]');
s3Click(r05Open);
const r05Main = r05Visit.$("#main");
const r05PrimaryActions = r05Main
  ? [...r05Main.querySelectorAll("[data-scene-actions] .btn.primary")]
  : [];
check(
  "R05/J6 contrato: role + case + obligation + scene resuelve una sola visita",
  r05RosaMatches.length === 1
    && r05RosaMatches[0].textContent.includes("HOD-2026-0131")
    && r05Main?.querySelector(".resp-header")?.textContent.includes("HOD-2026-0131"),
);
check(
  "R05/J6 escena: Enfermería recibe propósito de cuidar, educar y registrar",
  /Enfermer[ií]a/i.test(r05Main?.querySelector("h1")?.textContent || "")
    && /cuidad|tratamiento/i.test(r05Main?.textContent || "")
    && /educa|teach-back/i.test(r05Main?.textContent || "")
    && /registr/i.test(r05Main?.textContent || ""),
);
check(
  "R05/J6 autoridad: no expone acciones médicas y ofrece una sola primaria enfermera",
  !r05Main?.querySelector('[data-act="md-visita"], [data-act="md-encuentro"]')
    && r05PrimaryActions.length === 1
    && r05PrimaryActions[0].dataset.act === "en-visita",
);
s3Click(r05PrimaryActions[0]);
check(
  "R05/J6 confirmación: no fabrica hechos clínicos ni persistencia",
  /autor[ií]a.*Enfermer[ií]a/i.test(r05Visit.$(".confirm-strip")?.textContent || "")
    && /no (?:registra|inventa).*resultado cl[ií]nico/i.test(r05Visit.$(".confirm-strip")?.textContent || "")
    && /no prueba persistencia/i.test(r05Visit.$(".confirm-strip")?.textContent || ""),
);

/* Guardia compartida: Medicina conserva su escena y S3 sigue separado. */
const r05Guard = s3Boot();
s3SetRole(r05Guard, "medico-atencion-directa");
s3Click(r05Guard.$('[data-open="OBL-MD-02"]'));
check(
  "R05/J6 guardia: la visita médica conserva sus acciones propias",
  Boolean(r05Guard.$('[data-act="md-visita"]'))
    && !r05Guard.$('[data-act="en-visita"]'),
);
s3SetRole(r05Guard, "enfermero-clinico");
s3Click(r05Guard.$('[data-open="VIS-ROSA-M1-0900"]'));
check(
  "R05/J6 guardia: el paquete S3 conserva su renderer independiente",
  Boolean(r05Guard.$('[data-s3-action="review-package"]'))
    && !r05Guard.$('[data-act="en-visita"]'),
);

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
