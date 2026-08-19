/* Prueba conductual de E2E-08 sobre la maqueta real con jsdom.
   Uso: node /home/felix/projects/hd-design-html/tests/test-maqueta-e2e08.js

   El caso sigue un solo hilo de sesión: resultado crítico de Rosa, evento
   E2E08-K-ROSA, comunicación, recuperación/timeout y conducta autorizada.
   Los selectores data-e2e08-* son la frontera observable de esta maqueta;
   ninguna aserción inspecciona el texto fuente de producción.
*/
const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("/home/felix/projects/hd-hsc-os/node_modules/jsdom"));

const dir = "/home/felix/projects/hd-design-html";
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(dir, "styles.css"), "utf8");
const sourceFiles = ["data.js", "cases.js", "scenes.js", "map-data.js", "map.js", "app.js"];
const combined = sourceFiles.map((file) => fs.readFileSync(path.join(dir, file), "utf8")).join("\n;\n");

let pass = 0;
let fail = 0;

function check(name, condition) {
  if (condition) {
    pass++;
    console.log("PASS", name);
  } else {
    fail++;
    console.log("FAIL", name);
  }
}

function boot() {
  /* Inlinear el CSS sólo en memoria permite comprobar la región móvil con
     getComputedStyle sin convertir la prueba en una búsqueda de fuente. */
  const withInlineCss = html.replace(
    /<link rel="stylesheet" href="styles\.css">/,
    `<style>${css}</style>`,
  );
  const dom = new JSDOM(withInlineCss, {
    runScripts: "outside-only",
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.eval(combined);
  const $ = (selector) => window.document.querySelector(selector);
  const $$ = (selector) => [...window.document.querySelectorAll(selector)];
  return { dom, window, $, $$ };
}

function safeClick(ui, element, name) {
  if (!element) return false;
  try {
    element.click();
    return true;
  } catch (error) {
    check(`${name}: la interacción no lanza`, false);
    return false;
  }
}

function setRole(ui, role) {
  const select = ui.$("#role-select");
  if (!select) return false;
  select.value = role;
  select.dispatchEvent(new ui.window.Event("change"));
  return true;
}

function setDevice(ui, device) {
  return safeClick(ui, ui.$(`.mk-device[data-device="${device}"]`), `dispositivo ${device}`);
}

function openFirstWork(ui) {
  return safeClick(ui, ui.$("[data-open]"), "abrir obligación");
}

function action(ui, name) {
  return ui.$(
    `[data-e2e08-action="${name}"], [data-e2e08-transition="${name}"], [data-transition="${name}"]`,
  );
}

function clickAction(ui, name, labelPattern) {
  const candidate = action(ui, name) || (labelPattern
    ? ui.$$(`#main button`).find((button) => labelPattern.test(button.textContent))
    : null);
  return safeClick(ui, candidate, `acción E2E-08 ${name}`);
}

function confirmAction(ui) {
  return safeClick(ui, ui.$(".confirm-strip [data-confirm]"), "confirmación E2E-08");
}

function cancelAction(ui) {
  return safeClick(ui, ui.$(".confirm-strip [data-cancel]"), "cancelación E2E-08");
}

function hasTask(ui, role) {
  return Boolean(ui.$(
    `[data-e2e08-task-role="${role}"], [data-e2e08-task="${role}"], [data-task-role="${role}"]`,
  ));
}

function session(ui) {
  return ui.$('[data-e2e08-session="criticalResultRosa"], [data-session="criticalResultRosa"]');
}

function eventEntries(ui) {
  const log = ui.$("[data-e2e08-log], [data-event-log]");
  if (!log) return [];
  const entries = ui.$$('[data-e2e08-log] [data-e2e08-entry], [data-event-log] [data-event-entry], [data-e2e08-log] [data-event-id], [data-event-log] [data-event-id]');
  return entries.map((entry) => entry.getAttribute("data-e2e08-event-id") || entry.getAttribute("data-event-id") || entry.textContent.trim());
}

function eventIds(ui) {
  return ui.$$('[data-e2e08-event-id], [data-event-id]').map(
    (entry) => entry.getAttribute("data-e2e08-event-id") || entry.getAttribute("data-event-id"),
  ).filter(Boolean);
}

function eventRecords(ui) {
  return ui.$$('[data-e2e08-log] [data-e2e08-entry]').map((entry) => ({
    version: entry.getAttribute("data-e2e08-version"),
    priorVersion: entry.getAttribute("data-e2e08-prior-version"),
    actor: entry.getAttribute("data-e2e08-actor"),
    emitter: entry.getAttribute("data-e2e08-emitter"),
    intendedReceiver: entry.getAttribute("data-e2e08-intended-receiver"),
    origin: entry.getAttribute("data-e2e08-origin"),
    outcome: entry.getAttribute("data-e2e08-outcome"),
  }));
}

function mainText(ui) {
  return ui.$("#main")?.textContent || "";
}

function actionResult(ui) {
  return ui.$("#action-result");
}

function resultHeading(ui) {
  return actionResult(ui)?.querySelector("h2, h3");
}

function resultLiveNodes(ui) {
  const host = actionResult(ui);
  return host ? host.querySelectorAll('[aria-live], [role="status"], [role="alert"]') : [];
}

function completedWithoutOverwrite(before, after) {
  return before.length > 0 && after.length >= before.length
    && before.every((entry, index) => after[index] === entry);
}

/* ===== frontera observable del segundo incremento S3 =====
   Estos helpers sólo consultan la maqueta renderizada. La implementación
   puede usar data-e2e08-s3-* o conservar data-e2e08-* para la misma frontera;
   nunca se lee state ni se invocan reducers internos desde esta suite. */
function s3Action(ui, name) {
  return ui.$(`[data-e2e08-s3-action="${name}"], [data-e2e08-action="${name}"], [data-e2e08-transition="${name}"]`);
}

function s3Node(ui, name) {
  return ui.$(`[data-e2e08-s3="${name}"], [data-e2e08-s3-${name}]`);
}

function s3Actions(ui) {
  return ui.$$('[data-e2e08-s3-action], [data-e2e08-action], [data-e2e08-transition]');
}

function openWorkId(ui, id) {
  return safeClick(ui, ui.$(`[data-open="${id}"], [data-e2e08-s3-open="${id}"]`), `abrir obligación ${id}`);
}

function clickS3Action(ui, names, label) {
  const ids = Array.isArray(names) ? names : [names];
  const candidate = ids.map((id) => s3Action(ui, id)).find(Boolean);
  return safeClick(ui, candidate, label || `acción S3 ${ids.join("/")}`);
}

function s3PendingConfirm(ui, name) {
  return ui.$(`[data-e2e08-s3-pending-confirm="${name}"], .confirm-strip [data-confirm="${name}"]`);
}

function textOf(node) {
  return node?.textContent || "";
}

function s3EventRecords(ui) {
  return ui.$$('[data-e2e08-s3-event], [data-e2e08-s3-entry]').map((entry) => ({
    id: entry.getAttribute("data-e2e08-event-id") || entry.getAttribute("data-event-id"),
    at: entry.getAttribute("data-e2e08-at") || entry.getAttribute("data-at"),
    text: entry.textContent.trim(),
  }));
}

/* ===== precondición: la tarea médica no nace por el solo dato publicado ===== */
const beforeCommunication = boot();
setRole(beforeCommunication, "medico-atencion-directa");
check(
  "antes de comunicación o escalamiento válido: médico directo no recibe tarea E2E-08",
  !hasTask(beforeCommunication, "direct") && !mainText(beforeCommunication).includes("E2E08-K-ROSA"),
);

/* ===== flujo de comunicación exitosa desde Laboratorio ===== */
const success = boot();
setRole(success, "laboratorio");
setDevice(success, "mobile");
check("Laboratorio: obligación de resultado crítico visible", mainText(success).includes("resultado crítico"));
openFirstWork(success);

const initialSession = session(success);
const initialEntries = eventEntries(success);
check(
  "sesión crítica de Rosa identificada sin depender del receptor",
  Boolean(initialSession)
    && initialSession.textContent.includes("criticalResultRosa")
    && initialSession.textContent.includes("E2E08-K-ROSA"),
);
check(
  "eventId E2E08-K-ROSA aparece en la superficie observable",
  eventIds(success).includes("E2E08-K-ROSA") || mainText(success).includes("E2E08-K-ROSA"),
);
check(
  "intendedReceiver no equivale a recepción humana",
  mainText(success).includes("intendedReceiver")
    && !success.$('[data-e2e08-receipt="human"], [data-human-receipt]'),
);

const mobileActionRegions = success.$$('[data-scene-actions], .critical-action-bar');
check("escena: una sola región de acciones", mobileActionRegions.length === 1);
const mobileActions = mobileActionRegions[0];
const mobilePrimary = mobileActions?.querySelector(".btn.primary, [data-primary=\"true\"]");
check("móvil: la región de acciones conserva una primaria", Boolean(mobilePrimary));
check(
  "móvil: acciones en flujo normal, no fixed/sticky",
  Boolean(mobileActions) && ["fixed", "sticky"].indexOf(success.window.getComputedStyle(mobileActions).position) === -1,
);

/* TDD focal: confirmar/cancelar debe ser real y devolver el foco a la acción. */
const focusBeforeConfirm = mobilePrimary;
focusBeforeConfirm?.focus();
safeClick(success, focusBeforeConfirm, "abrir confirmación de comunicación");
check("comunicación: confirmación inline visible", Boolean(success.$(".confirm-strip")));
check(
  "confirmación: exactamente una primaria y una cancelación",
  success.$$(".confirm-strip .btn.primary").length === 1
    && success.$$(".confirm-strip [data-cancel]").length === 1,
);
cancelAction(success);
check(
  "cancelar: elimina confirmación y restaura foco a la primaria",
  !success.$(".confirm-strip") && success.window.document.activeElement === focusBeforeConfirm,
);

const successBeforeEntries = eventEntries(success);
const successAction = action(success, "communicate-success")
  || action(success, "protocol_message_published")
  || success.$('[data-act="lab-informar"]');
safeClick(success, successAction, "comunicación exitosa");
confirmAction(success);
const successReceipt = success.$('[data-e2e08-receipt="communication"], .outcome-receipt');
const successHeading = resultHeading(success);
const successAfterEntries = eventEntries(success);
check(
  "comunicación exitosa: receipt conserva receptor y read-back",
  Boolean(successReceipt)
    && /receptor|médico/i.test(successReceipt.textContent)
    && /read-back|lectura de vuelta/i.test(successReceipt.textContent),
);
check(
  "comunicación exitosa: no inventa outcome clínico",
  !success.$('[data-clinical-outcome], [data-outcome-kind="clinical"]'),
);
check(
  "log E2E-08: comunicación agrega entrada sin sobrescribir el prefijo",
  completedWithoutOverwrite(successBeforeEntries, successAfterEntries),
);
check(
  "log E2E-08: cada evento expone versión previa, actor, emisor, receptor previsto, origen y outcome",
  eventRecords(success).length >= 2 && eventRecords(success).every((entry, index) =>
    entry.version === String(index + 1)
      && entry.priorVersion === String(index)
      && Boolean(entry.actor)
      && Boolean(entry.emitter)
      && Boolean(entry.intendedReceiver)
      && Boolean(entry.origin)
      && Boolean(entry.outcome)),
);
check(
  "éxito: aria-label y foco de heading actualizados",
  Boolean(successReceipt?.getAttribute("aria-label"))
    && successHeading?.getAttribute("tabindex") === "-1"
    && success.window.document.activeElement === successHeading,
);
check("éxito: no duplica regiones live del resultado", resultLiveNodes(success).length <= 1);

/* La comunicación sí proyecta la obligación al médico; cambiar de rol no la
   fabrica antes ni hace resucitar una obligación ya satisfecha. */
setRole(success, "medico-atencion-directa");
check("receipt de Laboratorio queda visible al médico directo", /Laboratorio|read-back/i.test(mainText(success)));
check(
  "conducta autorizada: proyección médica directa, no reguladora",
  hasTask(success, "direct") && !hasTask(success, "regulator"),
);
const directTask = success.$('[data-e2e08-task-role="direct"], [data-e2e08-task="direct"], [data-task-role="direct"]');
safeClick(success, directTask, "abrir tarea médica E2E-08");
const conductAction = action(success, "record-conduct")
  || action(success, "conduct_recorded");
safeClick(success, conductAction, "registrar conducta médica autorizada");
confirmAction(success);
check(
  "conducta autorizada: outcome clínico separado de la comunicación",
  Boolean(success.$('[data-clinical-outcome], [data-outcome-kind="clinical"]'))
    && /conducta|interpretación/i.test(mainText(success)),
);
setRole(success, "medico-regulador");
check("conducta directa: regulador no recibe proyección duplicada", !hasTask(success, "regulator"));
check(
  "conducta directa: receipt clínico persiste entre roles",
  Boolean(success.$('[data-clinical-outcome], [data-outcome-kind="clinical"]')),
);
setRole(success, "laboratorio");
setRole(success, "medico-atencion-directa");
check("cambio de rol: tarea directa satisfecha no resucita", !hasTask(success, "direct"));

/* ===== derivación digital urgente: intención terminal sin resultado clínico ===== */
const referral = boot();
setRole(referral, "laboratorio");
openFirstWork(referral);
safeClick(referral, action(referral, "communicate-success") || action(referral, "protocol_message_published") || referral.$('[data-act="lab-informar"]'), "publicar resultado para derivación");
confirmAction(referral);
setRole(referral, "medico-atencion-directa");
const referralTask = referral.$('[data-e2e08-task-role="direct"], [data-e2e08-task="direct"], [data-task-role="direct"]');
safeClick(referral, referralTask, "abrir tarea para derivación urgente");
safeClick(referral, action(referral, "urgent-digital-referral") || action(referral, "critical_escalation_intent_recorded"), "derivación urgente digital");
confirmAction(referral);
check(
  "derivación urgente terminal digital: receipt de intención sin outcome clínico",
  /derivación urgente|terminal digital|intención durable/i.test(mainText(referral))
    && !referral.$('[data-clinical-outcome], [data-outcome-kind="clinical"]'),
);
setRole(referral, "laboratorio");
check(
  "derivación urgente: receipt terminal persiste entre roles",
  Boolean(referral.$('[data-e2e08-receipt="referral-intent"]'))
    && !referral.$('[data-clinical-outcome], [data-outcome-kind="clinical"]'),
);

/* ===== comunicación exitosa sin conducta: timeout recuperable y persistente ===== */
const successTimeout = boot();
setRole(successTimeout, "laboratorio");
openFirstWork(successTimeout);
safeClick(successTimeout, action(successTimeout, "communicate-success") || successTimeout.$('[data-act="lab-informar"]'), "comunicación para timeout post-éxito");
confirmAction(successTimeout);
setRole(successTimeout, "medico-atencion-directa");
check(
  "comunicación exitosa sin conducta: timeout 08:22 sigue alcanzable",
  Boolean(action(successTimeout, "timeout-0822")),
);
setRole(successTimeout, "paciente");
check(
  "timeout sintético: paciente no puede verlo ni originarlo",
  !action(successTimeout, "timeout-0822"),
);
setRole(successTimeout, "laboratorio");
setRole(successTimeout, "medico-atencion-directa");
check(
  "timeout post-éxito: control sobrevive cambio de rol y navegación",
  Boolean(action(successTimeout, "timeout-0822")),
);
safeClick(successTimeout, action(successTimeout, "timeout-0822"), "timeout post-éxito");
check(
  "timeout desde Mi trabajo: actualiza recovery, retira control y enfoca el resultado",
  Boolean(successTimeout.$('[data-e2e08-recovery="timeout"]'))
    && !action(successTimeout, "timeout-0822")
    && successTimeout.window.document.activeElement === successTimeout.$('[data-e2e08-recovery="timeout"] h2, [data-e2e08-recovery="timeout"] h3'),
);
check(
  "timeout: la tarea directa vencida no resucita",
  !hasTask(successTimeout, "direct"),
);
setRole(successTimeout, "medico-regulador");
check(
  "timeout post-éxito: transición unidireccional activa al regulador",
  hasTask(successTimeout, "regulator") && !action(successTimeout, "timeout-0822"),
);

/* ===== comunicación fallida, timeout unidireccional y recuperación reguladora ===== */
const recovery = boot();
setRole(recovery, "laboratorio");
openFirstWork(recovery);
const failedBeforeEntries = eventEntries(recovery);
safeClick(
  recovery,
  action(recovery, "communicate-failed") || action(recovery, "support_no_response_detected"),
  "comunicación fallida",
);
confirmAction(recovery);
const failedReceipt = recovery.$('[data-e2e08-recovery="communication"], .recovery-panel');
check(
  "comunicación fallida: recovery conserva responsable y siguiente acción",
  Boolean(failedReceipt)
    && /responsable|reintentar|recuper/i.test(failedReceipt.textContent),
);
check(
  "recovery: aria-label y foco de heading actualizados",
  Boolean(failedReceipt?.getAttribute("aria-label"))
    && resultHeading(recovery)?.getAttribute("tabindex") === "-1"
    && recovery.window.document.activeElement === resultHeading(recovery),
);
check("recovery: no duplica regiones live", resultLiveNodes(recovery).length <= 1);
check(
  "comunicación fallida: no crea conducta clínica",
  !recovery.$('[data-clinical-outcome], [data-outcome-kind="clinical"]'),
);
check(
  "timeout 08:22: límite visible antes de escalar",
  /08:22/.test(mainText(recovery)),
);

setRole(recovery, "medico-atencion-directa");
setRole(recovery, "laboratorio");
check(
  "comunicación fallida: control de timeout persiste aunque la obligación de Laboratorio termine",
  Boolean(action(recovery, "timeout-0822")),
);
const timeoutBefore = eventEntries(recovery);
safeClick(
  recovery,
  action(recovery, "timeout-0822") || action(recovery, "support_no_response_detected"),
  "alcanzar timeout 08:22",
);
check(
  "timeout post-falla desde Mi trabajo: recovery inmediato y control retirado",
  Boolean(recovery.$('[data-e2e08-recovery="timeout"]')) && !action(recovery, "timeout-0822"),
);
check(
  "timeout 08:22: transición unidireccional a recuperación, sin conducta inventada",
  /08:22|no respuesta|recuper/i.test(mainText(recovery))
    && !recovery.$('[data-clinical-outcome], [data-outcome-kind="clinical"]'),
);
check(
  "timeout: log conserva publicación/fallo y sólo agrega eventos",
  completedWithoutOverwrite(timeoutBefore, eventEntries(recovery)),
);
setRole(recovery, "medico-atencion-directa");
check(
  "antes de escalada válida: médico directo sigue sin tarea nueva",
  !hasTask(recovery, "direct"),
);
setRole(recovery, "medico-regulador");
check(
  "escalada válida: regulador recibe la proyección autorizada",
  hasTask(recovery, "regulator") && /08:22|escalamiento|regulador/i.test(mainText(recovery)),
);

/* Un intento directo posterior al timeout no puede crear por sí solo una
   conducta; queda como reconciliación hasta la decisión reguladora. */
setRole(recovery, "medico-atencion-directa");
const postTimeoutAttempt = action(recovery, "post-timeout-direct-attempt")
  || action(recovery, "direct_attempt_after_timeout");
safeClick(recovery, postTimeoutAttempt, "intento directo posterior al timeout");
confirmAction(recovery);
check(
  "intento directo post-timeout: queda en reconciliación",
  Boolean(recovery.$('[data-e2e08-reconciliation], [data-reconciliation]'))
    && !recovery.$('[data-clinical-outcome], [data-outcome-kind="clinical"]')
    && !/conducta registrada/i.test(mainText(recovery)),
);

/* La conducta reguladora autorizada llega después; un conflicto posterior no
   sobrescribe ese hecho ni revive la obligación original. */
setRole(recovery, "medico-regulador");
const regulatoryTask = recovery.$('[data-e2e08-task-role="regulator"], [data-e2e08-task="regulator"], [data-task-role="regulator"]');
safeClick(recovery, regulatoryTask, "abrir tarea reguladora E2E-08");
safeClick(recovery, action(recovery, "record-regulatory-conduct") || action(recovery, "conduct_recorded"), "registrar conducta reguladora");
confirmAction(recovery);
const regulatoryOutcome = recovery.$('[data-clinical-outcome], [data-outcome-kind="clinical"]');
const regulatoryText = regulatoryOutcome?.textContent || "";
check("regulador: conducta autorizada queda registrada con su autoría", Boolean(regulatoryOutcome) && /conducta|regulador/i.test(regulatoryText));

setRole(recovery, "medico-atencion-directa");
safeClick(recovery, action(recovery, "post-regulatory-direct-attempt") || action(recovery, "direct_attempt_after_regulation"), "intento directo después de conducta reguladora");
confirmAction(recovery);
const conflict = recovery.$('[data-e2e08-conflict], [data-conflict]');
check(
  "conflicto posterior: no overwrite de la conducta reguladora",
  Boolean(conflict)
    && /conflicto|versión|reconcili/i.test(conflict.textContent)
    && regulatoryText.length > 0
    && mainText(recovery).includes(regulatoryText),
);
setRole(recovery, "laboratorio");
setRole(recovery, "medico-regulador");
check("cambio de rol: conducta reguladora no resucita tareas previas", !hasTask(recovery, "regulator"));
check("receipts de recuperación viajan entre roles", /Laboratorio|receptor|regulador|reconcili/i.test(mainText(recovery)));

/* ===== patrón móvil compartido: una sola barra también en A3/A4 genérica ===== */
const genericCritical = boot();
const genericV02Mode = genericCritical.$("#sim-select");
genericV02Mode.value = "v02_rehearsal";
genericV02Mode.dispatchEvent(new genericCritical.window.Event("change"));
setDevice(genericCritical, "mobile");
setRole(genericCritical, "cuidador");
safeClick(genericCritical, genericCritical.$('[data-open="E2E07-CU-01"]'), "abrir llamada sintética V02");
safeClick(genericCritical, genericCritical.$('[data-e2e07-action="record-synthetic-131-call"]'), "registrar llamada sintética V02");
safeClick(genericCritical, genericCritical.$('[data-confirm]'), "confirmar llamada sintética V02");
setRole(genericCritical, "medico-regulador");
const nocturnal = genericCritical.$('[data-open="E2E07-MR-01"]');
safeClick(genericCritical, nocturnal, "abrir escena crítica genérica");
check(
  "móvil: escena crítica genérica consolida todas sus acciones en scene-actions",
  genericCritical.$$(".action-bar").length === 1
    && genericCritical.$$('[data-scene-actions], .scene-actions').length === 1
    && !["fixed", "sticky"].includes(genericCritical.window.getComputedStyle(genericCritical.$(".action-bar")).position),
);

/* ===== la continuidad es de sesión; una nueva carga no hereda el hilo ===== */
const reloaded = boot();
setRole(reloaded, "medico-atencion-directa");
check(
  "reload: no persiste criticalResultRosa/E2E08-K-ROSA ni su tarea",
  !session(reloaded)
    && !eventIds(reloaded).includes("E2E08-K-ROSA")
    && !hasTask(reloaded, "direct")
    && !hasTask(reloaded, "regulator"),
);

/* ========================================================================
   Segundo incremento E2E-08 / S3 — RED conductual.

   Una carga nueva sólo contiene ORD-1 a las 08:14. El happy path siguiente
   produce review, manifiesto y partida en una misma sesión, atravesando la
   interfaz por los tres roles; ningún estado S3 se siembra en el harness.
   ======================================================================== */

function s3ActionIds(ui) {
  return s3Actions(ui).map((node) =>
    node.getAttribute("data-e2e08-s3-action")
      || node.getAttribute("data-e2e08-action")
      || node.getAttribute("data-e2e08-transition"));
}

function s3EventMinutes(at) {
  const match = /^(\d{2}):(\d{2})$/.exec(at || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/* ---- estado inicial honesto y frontera de navegación ---- */
const s3Initial = boot();
setRole(s3Initial, "enfermero-clinico");
const legacyObligationLinks = s3Initial.$$('[data-open="OBL-EN-04"], [data-e2e08-s3-open="OBL-EN-04"]');
const operationalVisitLink = s3Initial.$('[data-open="VIS-ROSA-M1-0900"], [data-e2e08-s3-open="VIS-ROSA-M1-0900"]');
openWorkId(s3Initial, "VIS-ROSA-M1-0900");
const initialEvents = s3EventRecords(s3Initial);
const initialPackage = s3Node(s3Initial, "package");
const initialText = textOf(initialPackage);
check(
  "S3 inicial: nueva carga sólo expone criticalInstructionRevision E2E08-ORD-1 a las 08:14",
  Boolean(initialPackage)
    && initialEvents.length === 1
    && initialEvents[0].id === "E2E08-ORD-1"
    && initialEvents[0].at === "08:14"
    && /E2E08-ORD-1|criticalInstructionRevision/i.test(initialText)
    && !initialEvents.some((entry) => /package_review|manifest_decision|vehicle_departure_observed|08:35|08:40|08:45/.test(`${entry.id} ${entry.text} ${entry.at}`)),
);
check(
  "S3 navegación: OBL-EN-04 no es data-open navegable y el único ID operativo es VIS-ROSA-M1-0900",
  legacyObligationLinks.length === 0
    && Boolean(operationalVisitLink)
    && /VIS-ROSA-M1-0900/.test(operationalVisitLink?.getAttribute("data-open") || operationalVisitLink?.getAttribute("data-e2e08-s3-open") || ""),
);
check(
  "S3 preparación inicial: ORD-1 conserva autoría médica y packageImpact explícito sobre nursingPlan v5",
  Boolean(initialPackage)
    && /autoría.*médic|médic.*autor/i.test(initialText)
    && /packageImpact/i.test(initialText)
    && /nursingPlan|plan de cuidados/i.test(initialText)
    && /v(?:ersión\s*)?5/i.test(initialText),
);

/* ---- happy path único: Enfermería review → Coordinación manifest → Conductor departure ---- */
const s3Happy = boot();
setRole(s3Happy, "enfermero-clinico");
openWorkId(s3Happy, "VIS-ROSA-M1-0900");
const happyInitialEvents = s3EventRecords(s3Happy);
const happyInitialOnly = happyInitialEvents.length === 1
  && happyInitialEvents[0].id === "E2E08-ORD-1"
  && happyInitialEvents[0].at === "08:14"
  && happyInitialEvents.every((entry) => !/package_review|manifest_decision|vehicle_departure_observed|08:35|08:40|08:45/.test(`${entry.id} ${entry.text} ${entry.at}`));
check(
  "S3 happy path: la sesión empieza sólo con ORD-1 08:14, sin review, manifest ni partida sembrados",
  happyInitialOnly,
);
const happyPackage = s3Node(s3Happy, "package");
const happyPackageText = textOf(happyPackage);
check(
  "S3 happy path: VIS-ROSA-M1-0900 usa Móvil 1, ventana 09:00–10:00 y salida 08:45, no Móvil 2/09:05",
  Boolean(happyPackage)
    && happyInitialOnly
    && /VIS-ROSA-M1-0900/.test(happyPackageText)
    && /Móvil 1|M1/.test(happyPackageText)
    && /09:00\s*[–-]\s*10:00/.test(happyPackageText)
    && /08:45/.test(happyPackageText)
    && !/Móvil 2|09:05/i.test(happyPackageText),
);
const happyReviewAction = s3Action(s3Happy, "review-package");
check(
  "S3 happy path: Enfermero clínico revisa a las 08:35 usando instrucción crítica y nursingPlan v5",
  Boolean(happyReviewAction)
    && /08:35/.test(textOf(happyReviewAction))
    && /criticalInstructionRevision|E2E08-ORD-1/i.test(textOf(happyReviewAction))
    && /nursingPlan|plan de cuidados/i.test(textOf(happyReviewAction)),
);
safeClick(s3Happy, happyReviewAction, "review S3 08:35");
confirmAction(s3Happy);
const happyReviewReceipt = s3Node(s3Happy, "package-review-receipt") || actionResult(s3Happy);
const happyReviewText = textOf(happyReviewReceipt);
check(
  "S3 happy path: receipt de review no autoriza ni registra salida",
  Boolean(happyReviewReceipt)
    && happyInitialOnly
    && /08:35|review|revisión/i.test(happyReviewText)
    && !/autoriza(?:ción)?\s+(?:la\s+)?salida|registr(?:a|ó)\s+(?:la\s+)?salida|vehicle_departure/i.test(happyReviewText),
);

setRole(s3Happy, "enfermera-coordinadora");
openWorkId(s3Happy, "VIS-ROSA-M1-0900");
const happyManifestAction = s3Action(s3Happy, "manifest-retain");
const happyManifestNode = s3Node(s3Happy, "manifest");
check(
  "S3 happy path: Coordinación retiene VIS en manifiesto M1 a las 08:40 y referencia review vigente",
  Boolean(happyManifestAction)
    && Boolean(happyManifestNode)
    && /08:40|Móvil 1|M1/i.test(textOf(happyManifestAction) + textOf(happyManifestNode))
    && /review|revisión.*vigente|08:35/i.test(textOf(happyManifestNode)),
);
safeClick(s3Happy, happyManifestAction, "manifest-retain S3 08:40");
confirmAction(s3Happy);
const happyManifestReceipt = s3Node(s3Happy, "manifest-decision-receipt") || actionResult(s3Happy);
const happyManifestText = textOf(happyManifestReceipt);
check(
  "S3 happy path: receipt de manifiesto no equivale a autorización total de salida",
  Boolean(happyManifestReceipt)
    && /VIS-ROSA-M1-0900|Móvil 1|M1/i.test(happyManifestText)
    && /review|revisión/i.test(happyManifestText)
    && !/autoriza(?:ción)?\s+(?:la\s+)?salida\s+total/i.test(happyManifestText),
);

setRole(s3Happy, "conductor");
openWorkId(s3Happy, "VIS-ROSA-M1-0900");
const happyDeparture = s3Action(s3Happy, "vehicle_departure_observed");
const happyBlocked = s3Action(s3Happy, "vehicle_departure_blocked");
const happyDriverActions = s3ActionIds(s3Happy);
check(
  "S3 happy path: Conductor sólo registra vehicle_departure_observed M1 08:45 o vehicle_departure_blocked",
  (Boolean(happyDeparture) || Boolean(happyBlocked))
    && happyDriverActions.every((id) => ["vehicle_departure_observed", "vehicle_departure_blocked"].includes(id))
    && /08:45|Móvil 1|M1/i.test(textOf(happyDeparture || happyBlocked)),
);
safeClick(s3Happy, happyDeparture || happyBlocked, "departure S3 08:45");
confirmAction(s3Happy);
const happyDepartureReceipt = s3Node(s3Happy, "departure-receipt") || actionResult(s3Happy);
const happyDepartureText = textOf(happyDepartureReceipt);
check(
  "S3 happy path: partida conserva referencia causal sin probar personas, paquete, visita ni atención",
  Boolean(happyDepartureReceipt)
    && /vehicle_departure_observed|vehicle_departure_blocked|partida|salida/i.test(happyDepartureText)
    && /08:45|Móvil 1|M1/.test(happyDepartureText)
    && /VIS-ROSA-M1-0900|manifest|manifiesto|review|revisión/i.test(happyDepartureText)
    && !/persona|paquete|visita\s+(?:realizada|hecha)|atención\s+(?:realizada|hecha)/i.test(happyDepartureText),
);
const happyEvents = s3EventRecords(s3Happy);
const happyTimes = happyEvents.map((entry) => entry.at).filter(Boolean);
check(
  "S3 happy path: eventos visibles quedan monotónicos 08:14 → 08:35 → 08:40 → 08:45",
  ["08:14", "08:35", "08:40", "08:45"].every((at) => happyTimes.includes(at))
    && happyTimes.every((at, index) => index === 0 || s3EventMinutes(at) >= s3EventMinutes(happyTimes[index - 1])),
);

setRole(s3Happy, "enfermera-coordinadora");
openWorkId(s3Happy, "VIS-ROSA-M1-0900");
const happyProjection = s3Node(s3Happy, "manifest-projection");
const happyProjectionText = textOf(happyProjection);
check(
  "S3 proyección post-partida: infiere partida+VIS con referencia causal sin afirmar atención",
  Boolean(happyProjection)
    && /partida|departure/i.test(happyProjectionText)
    && /VIS-ROSA-M1-0900/.test(happyProjectionText)
    && /causal|review|revisión|vehicle_departure/i.test(happyProjectionText)
    && !/persona|paquete\s+(?:completo|verificado)|visita\s+(?:realizada|hecha)|atención\s+(?:realizada|hecha)/i.test(happyProjectionText),
);
check(
  "S3 proyección post-partida: visita permanece programada 09:00–10:00",
  Boolean(s3Node(s3Happy, "visit-scheduled"))
    && /programad|09:00\s*[–-]\s*10:00/i.test(textOf(s3Node(s3Happy, "visit-scheduled"))),
);

/* ---- cambio material/ORD-2: invalida prospectivamente y reabre en orden ---- */
const s3Invalidation = boot();
setRole(s3Invalidation, "enfermero-clinico");
openWorkId(s3Invalidation, "VIS-ROSA-M1-0900");
clickS3Action(s3Invalidation, "review-package", "review previa a cambio material");
confirmAction(s3Invalidation);
setRole(s3Invalidation, "enfermera-coordinadora");
openWorkId(s3Invalidation, "VIS-ROSA-M1-0900");
clickS3Action(s3Invalidation, "manifest-retain", "manifest previo a cambio material");
confirmAction(s3Invalidation);
setRole(s3Invalidation, "medico-atencion-directa");
openWorkId(s3Invalidation, "VIS-ROSA-M1-0900");
clickS3Action(s3Invalidation, "material-change", "cambio material ORD-2 antes de salida");
confirmAction(s3Invalidation);
const invalidationEvents = s3EventRecords(s3Invalidation);
const invalidationTimes = invalidationEvents.map((entry) => entry.at).filter(Boolean);
const invalidationNode = s3Node(s3Invalidation, "predeparture-invalidation");
const invalidationText = textOf(invalidationNode);
check(
  "S3 invalidación pre-salida: ORD-2/material change invalida review y decisión de manifiesto prospectivamente",
  Boolean(invalidationNode)
    && /review|revisión/i.test(invalidationText)
    && /manifest|manifiesto|decisión/i.test(invalidationText)
    && /invalid|invalida|reabre/i.test(invalidationText)
    && /preserv|inmutable|append.?only|no overwrite/i.test(invalidationText),
);
check(
  "S3 invalidación pre-salida: reabre primero Enfermería y luego Coordinación",
  Boolean(s3Node(s3Invalidation, "reopen-sequence"))
    && /Enfermer[ií]a.*Coordinaci[oó]n/i.test(textOf(s3Node(s3Invalidation, "reopen-sequence"))),
);
check(
  "S3 tiempo tras ORD-2: no aparece 08:42 después de 08:45 y los eventos siguen monotónicos",
  !invalidationTimes.some((at, index) => at === "08:42" && invalidationTimes.slice(0, index).some((prior) => prior === "08:45"))
    && invalidationTimes.every((at, index) => index === 0 || s3EventMinutes(at) >= s3EventMinutes(invalidationTimes[index - 1]))
    && invalidationEvents.some((entry) => /ORD-2|material.change|material change/i.test(`${entry.id} ${entry.text}`)),
);

/* ---- basisToken A → review material B → confirmación obsoleta ---- */
const s3Basis = boot();
setRole(s3Basis, "enfermero-clinico");
openWorkId(s3Basis, "VIS-ROSA-M1-0900");
clickS3Action(s3Basis, "review-package", "producir review material A");
confirmAction(s3Basis);
setRole(s3Basis, "enfermera-coordinadora");
openWorkId(s3Basis, "VIS-ROSA-M1-0900");
const basisActionA = s3Action(s3Basis, "manifest-retain");
safeClick(s3Basis, basisActionA, "abrir confirmación de manifiesto con token A");
const tokenA = s3PendingConfirm(s3Basis, "manifest-retain")?.getAttribute("data-e2e08-basis-token")
  || basisActionA?.getAttribute("data-e2e08-basis-token")
  || basisActionA?.getAttribute("data-basis-token");
setRole(s3Basis, "medico-atencion-directa");
openWorkId(s3Basis, "VIS-ROSA-M1-0900");
clickS3Action(s3Basis, "material-change", "producir cambio material B antes de confirmar");
confirmAction(s3Basis);
setRole(s3Basis, "enfermero-clinico");
openWorkId(s3Basis, "VIS-ROSA-M1-0900");
clickS3Action(s3Basis, "review-package", "producir review material B antes de confirmar");
confirmAction(s3Basis);
setRole(s3Basis, "enfermera-coordinadora");
openWorkId(s3Basis, "VIS-ROSA-M1-0900");
const pendingManifest = s3PendingConfirm(s3Basis, "manifest-retain") || s3Action(s3Basis, "manifest-retain");
safeClick(s3Basis, pendingManifest, "confirmar manifiesto con token A obsoleto");
confirmAction(s3Basis);
const basisRecovery = s3Node(s3Basis, "basis-conflict-recovery") || s3Node(s3Basis, "conflict-recovery");
const basisEvents = s3EventRecords(s3Basis);
check(
  "S3 basisToken: confirmación revalida token A contra review material B y no escribe manifest_decision",
  Boolean(tokenA)
    && Boolean(basisRecovery)
    && !basisEvents.some((entry) => /manifest_decision|manifest-decision/i.test(`${entry.id} ${entry.text}`))
    && /basisToken|token|conflict|conflicto/i.test(textOf(basisRecovery)),
);
check(
  "S3 basisToken: conflicto produce recovery causal con IDs inmutables",
  Boolean(basisRecovery)
    && /recovery|recuperación|conflict|conflicto/i.test(textOf(basisRecovery))
    && /eventId|E2E08-ORD-1|VIS-ROSA-M1-0900/i.test(textOf(basisRecovery))
    && basisEvents.every((entry) => Boolean(entry.id)),
);

/* ---- acciones one-shot y fallo cerrado sin review ---- */
const s3OneShot = boot();
setRole(s3OneShot, "enfermero-clinico");
openWorkId(s3OneShot, "VIS-ROSA-M1-0900");
clickS3Action(s3OneShot, "review-package", "review one-shot");
confirmAction(s3OneShot);
const reviewAfterReceipt = s3Action(s3OneShot, "review-package");
setRole(s3OneShot, "enfermera-coordinadora");
openWorkId(s3OneShot, "VIS-ROSA-M1-0900");
clickS3Action(s3OneShot, "manifest-retain", "manifest one-shot");
confirmAction(s3OneShot);
const manifestAfterReceipt = s3Action(s3OneShot, "manifest-retain");
setRole(s3OneShot, "medico-atencion-directa");
openWorkId(s3OneShot, "VIS-ROSA-M1-0900");
clickS3Action(s3OneShot, "cancelled_by_medical_order", "cancel one-shot");
confirmAction(s3OneShot);
const cancelAfterReceipt = s3Action(s3OneShot, "cancelled_by_medical_order");
clickS3Action(s3OneShot, "referral_intent", "referral one-shot");
confirmAction(s3OneShot);
const referralAfterReceipt = s3Action(s3OneShot, "referral_intent");
setRole(s3OneShot, "enfermera-coordinadora");
openWorkId(s3OneShot, "VIS-ROSA-M1-0900");
clickS3Action(s3OneShot, "coordination-withdraw-vis", "route amendment one-shot");
confirmAction(s3OneShot);
const routeAfterReceipt = s3Action(s3OneShot, "coordination-withdraw-vis");
check(
  "S3 one-shot: review, manifest, cancel, referral y route amendment desaparecen tras receipt salvo nueva causa",
  !reviewAfterReceipt
    && !manifestAfterReceipt
    && !cancelAfterReceipt
    && !referralAfterReceipt
    && !routeAfterReceipt,
);

const s3Closed = boot();
setRole(s3Closed, "enfermera-coordinadora");
openWorkId(s3Closed, "VIS-ROSA-M1-0900");
const closedManifestAction = s3Action(s3Closed, "manifest-retain");
const closedManifestPrimary = closedManifestAction?.classList.contains("primary")
  || closedManifestAction?.getAttribute("data-av") === "available";
check(
  "S3 manifiesto: sin review vigente falla cerrado y no ofrece manifest-retain primario disponible",
  Boolean(closedManifestAction)
    && !closedManifestPrimary
    && /blocked|review|revisión|suficiencia/i.test(textOf(closedManifestAction)),
);

/* ---- cancelación urgente, retiro reconocido y handoff/continuidades ---- */
const s3Urgent = boot();
setRole(s3Urgent, "enfermero-clinico"); openWorkId(s3Urgent, "VIS-ROSA-M1-0900"); clickS3Action(s3Urgent, "review-package"); confirmAction(s3Urgent);
setRole(s3Urgent, "enfermera-coordinadora"); openWorkId(s3Urgent, "VIS-ROSA-M1-0900"); clickS3Action(s3Urgent, "manifest-retain"); confirmAction(s3Urgent);
setRole(s3Urgent, "conductor"); openWorkId(s3Urgent, "VIS-ROSA-M1-0900"); clickS3Action(s3Urgent, "vehicle_departure_observed"); confirmAction(s3Urgent);
setRole(s3Urgent, "medico-atencion-directa");
openWorkId(s3Urgent, "VIS-ROSA-M1-0900");
clickS3Action(s3Urgent, "cancelled_by_medical_order", "cancelación médica urgente");
confirmAction(s3Urgent);
check(
  "S3 cancelación urgente: recovery A4 se representa una sola vez tras confirmar",
  s3Urgent.$$('[data-e2e08-s3="urgent-cancellation"]').length === 1,
);
clickS3Action(s3Urgent, "referral_intent", "referral intent urgente");
confirmAction(s3Urgent);
const urgentNode = s3Node(s3Urgent, "urgent-cancellation");
const urgentText = textOf(urgentNode);
const urgentEvents = s3EventRecords(s3Urgent);
check(
  "S3 cancelación urgente: médico registra cancelled_by_medical_order y referral intent como eventos separados",
  Boolean(urgentNode)
    && /cancelled_by_medical_order/.test(urgentText)
    && /referral[_ ]intent|derivación urgente/i.test(urgentText)
    && urgentEvents.some((entry) => /cancelled_by_medical_order/.test(`${entry.id} ${entry.text}`))
    && urgentEvents.some((entry) => /referral[_ ]intent/.test(`${entry.id} ${entry.text}`)),
);
check(
  "S3 cancelación urgente: recovery médica A4/handoff persiste sin afirmar cuidado, recepción o traslado",
  Boolean(urgentNode)
    && /A4/.test(urgentText)
    && /recovery|recuperación|handoff/i.test(urgentText)
    && !/cuidado\s+(?:realizado|recibido)|recepción\s+confirmada|traslado\s+completado/i.test(urgentText),
);
setRole(s3Urgent, "enfermera-coordinadora");
openWorkId(s3Urgent, "VIS-ROSA-M1-0900");
const manifestBeforeCancel = s3Action(s3Urgent, "manifest-retain");
const coordinationPrimaryBeforeAck = s3Urgent.$$(".btn.primary, [data-primary=\"true\"]").length;
clickS3Action(s3Urgent, "coordination-ack-order", "acuse de orden médica");
confirmAction(s3Urgent);
clickS3Action(s3Urgent, "coordination-withdraw-vis", "retiro VIS del manifiesto");
confirmAction(s3Urgent);
const withdrawnNode = s3Node(s3Urgent, "manifest-withdrawal");
const withdrawnText = textOf(withdrawnNode);
const coordinationEvents = s3EventRecords(s3Urgent);
check(
  "S3 cancelación médica: Coordinación elimina o inhabilita manifest-retain y mantiene máximo una primaria",
  Boolean(urgentNode)
    && Boolean(s3Node(s3Urgent, "coordination-urgent-cancellation"))
    && !s3Action(s3Urgent, "manifest-retain")
    && s3Urgent.$$(".btn.primary, [data-primary=\"true\"]").length <= 1
    && coordinationPrimaryBeforeAck >= 0,
);
check(
  "S3 retiro: evento reconocido desaparece la acción y la proyección dice retirada, no pendiente/programada",
  Boolean(withdrawnNode)
    && /withdraw|retirad|retir/i.test(withdrawnText)
    && !/pendiente|programad/i.test(withdrawnText)
    && coordinationEvents.some((entry) => /withdraw|retir|VIS/i.test(`${entry.id} ${entry.text}`))
    && !s3Action(s3Urgent, "coordination-withdraw-vis"),
);
const urgentHandoff = s3Node(s3Urgent, "urgent-handoff");
const urgentHandoffText = textOf(urgentHandoff);
check(
  "S3 handoff urgente: después del acuse deja de decir pendiente y muestra continuidad siguiente",
  Boolean(urgentHandoff)
    && !/pendiente|pending/i.test(urgentHandoffText)
    && /continuidad|next|siguiente/i.test(urgentHandoffText),
);

const medicalContinuity = s3Node(s3Urgent, "continuity-medical");
const coordinationContinuity = s3Node(s3Urgent, "continuity-coordination");
check(
  "S3 continuidades: médica y coordinadora son proyecciones separadas y event-backed",
  Boolean(medicalContinuity)
    && Boolean(coordinationContinuity)
    && medicalContinuity !== coordinationContinuity
    && [medicalContinuity, coordinationContinuity].every((node) =>
      Boolean(node.getAttribute("data-e2e08-event-id") || node.getAttribute("data-e2e08-causal-event-id"))
      && /intento|attempt/i.test(textOf(node))
      && /acuse|ack/i.test(textOf(node))
      && /falla|failed|timeout/i.test(textOf(node))),
);

clickS3Action(s3Urgent, "initiate-route-amendment", "iniciar route amendment");
confirmAction(s3Urgent);
clickS3Action(s3Urgent, "contact-driver", "registrar contacto separado");
confirmAction(s3Urgent);

const routeAmendment = s3Node(s3Urgent, "route-amendment");
const contactContinuation = s3Node(s3Urgent, "contact");
check(
  "S3 post-salida: route amendment/contacto son continuidades distintas y reconocibles",
  Boolean(routeAmendment)
    && Boolean(contactContinuation)
    && routeAmendment !== contactContinuation
    && /route|ruta|amendment|cambio/i.test(textOf(routeAmendment))
    && /contact|contacto/i.test(textOf(contactContinuation)),
);
setRole(s3Urgent, "conductor");
openWorkId(s3Urgent, "VIS-ROSA-M1-0900");
const routeAck = s3Action(s3Urgent, "route-amendment-ack");
const routeFail = s3Action(s3Urgent, "route-amendment-failed");
const driverText = mainText(s3Urgent);
check(
  "S3 conductor: route amendment ofrece sólo acuse/falla logística y nunca Rosa/K/plan/log clínico",
  (Boolean(routeAck) || Boolean(routeFail))
    && !/Rosa|K\+|potasio|nursingPlan|plan de cuidados|data-e2e08-log|criticalResultRosa/i.test(driverText),
);

/* ---- privacidad y acuse de unidad de cuidado ---- */
setRole(s3Urgent, "paciente");
const patientCopy = s3Node(s3Urgent, "patient-cancellation-copy");
const patientCopyText = textOf(patientCopy);
check(
  "S3 privacidad: paciente ve copia inequívoca de cancelación sin K, plan ni log",
  Boolean(patientCopy)
    && /cancelad/i.test(patientCopyText)
    && !/K\+|potasio|nursingPlan|plan de cuidados|criticalResultRosa|log/i.test(patientCopyText),
);
setRole(s3Urgent, "cuidador");
const caregiverCopy = s3Node(s3Urgent, "caregiver-cancellation-copy");
const caregiverCopyText = textOf(caregiverCopy);
const careAckAction = s3Action(s3Urgent, "care-unit-message-acknowledge");
safeClick(s3Urgent, careAckAction, "acuse de cancelación en unidad de cuidado");
confirmAction(s3Urgent);
const careAckEvents = s3EventRecords(s3Urgent);
check(
  "S3 privacidad: cuidador recibe copia sin superficie clínica interna y no se afirma lectura antes del acuse",
  Boolean(caregiverCopy)
    && /cancelad/i.test(caregiverCopyText)
    && !/K\+|potasio|nursingPlan|plan de cuidados|criticalResultRosa|log/i.test(caregiverCopyText)
    && Boolean(careAckAction)
    && careAckEvents.some((entry) => /care_unit_message_acknowledged/.test(`${entry.id} ${entry.text}`)),
);

/* ---- RED2: precedencia, bifurcación temporal y bases reales ---- */
const s3InitialCopy = boot();
setRole(s3InitialCopy, "enfermero-clinico");
openWorkId(s3InitialCopy, "VIS-ROSA-M1-0900");
const initialPackageText = mainText(s3InitialCopy);
setRole(s3InitialCopy, "enfermera-coordinadora");
openWorkId(s3InitialCopy, "VIS-ROSA-M1-0900");
const initialManifestText = mainText(s3InitialCopy);
check(
  "S3 RED2 inicial: paquete y manifiesto no afirman review/decisión futuras",
  /pendiente|aún no|sin review/i.test(initialPackageText)
    && !/suficiencia clasificada/i.test(initialPackageText)
    && /pendiente|aún no|sin decisión/i.test(initialManifestText)
    && !/decisión vigente:\s*mantener/i.test(initialManifestText),
);

const s3Aliases = boot();
setRole(s3Aliases, "enfermero-clinico");
const nurseBeforeAlias = s3Aliases.$("#main h1")?.textContent;
s3Aliases.window.openObligation("OBL-EN-04");
const nurseAfterAlias = s3Aliases.$("#main h1")?.textContent;
setRole(s3Aliases, "medico-atencion-directa");
s3Aliases.window.openObligation("OBL-MD-02");
const medicalAliasText = mainText(s3Aliases);
check(
  "S3 RED2 aliases: OBL-EN-04 no abre S3 y OBL-MD-02 conserva su escena M2",
  nurseAfterAlias === nurseBeforeAlias
    && /Atención.*Rosa|Móvil 2|10:30/i.test(medicalAliasText)
    && !/Decisión médica sobre VIS-ROSA-M1-0900/i.test(medicalAliasText),
);

const s3BasisReal = boot();
setRole(s3BasisReal, "enfermero-clinico");
openWorkId(s3BasisReal, "VIS-ROSA-M1-0900");
clickS3Action(s3BasisReal, "review-package", "review A RED2");
confirmAction(s3BasisReal);
setRole(s3BasisReal, "enfermera-coordinadora");
openWorkId(s3BasisReal, "VIS-ROSA-M1-0900");
const tokenReviewA = s3Action(s3BasisReal, "manifest-retain")?.getAttribute("data-e2e08-basis-token");
setRole(s3BasisReal, "medico-atencion-directa");
openWorkId(s3BasisReal, "VIS-ROSA-M1-0900");
clickS3Action(s3BasisReal, "material-change", "cambio material RED2");
confirmAction(s3BasisReal);
setRole(s3BasisReal, "enfermero-clinico");
openWorkId(s3BasisReal, "VIS-ROSA-M1-0900");
clickS3Action(s3BasisReal, "review-package", "review B RED2");
confirmAction(s3BasisReal);
setRole(s3BasisReal, "enfermera-coordinadora");
openWorkId(s3BasisReal, "VIS-ROSA-M1-0900");
const tokenReviewB = s3Action(s3BasisReal, "manifest-retain")?.getAttribute("data-e2e08-basis-token");
check(
  "S3 RED2 basisToken: review material B usa una base distinta de review A",
  Boolean(tokenReviewA) && Boolean(tokenReviewB) && tokenReviewA !== tokenReviewB,
);

const s3EarlyMaterial = boot();
setRole(s3EarlyMaterial, "medico-atencion-directa");
openWorkId(s3EarlyMaterial, "VIS-ROSA-M1-0900");
clickS3Action(s3EarlyMaterial, "material-change", "cambio antes de primera review");
confirmAction(s3EarlyMaterial);
const earlyInvalidations = s3EventRecords(s3EarlyMaterial).filter((entry) => /invalidated/i.test(`${entry.id} ${entry.text}`));
setRole(s3EarlyMaterial, "enfermero-clinico");
openWorkId(s3EarlyMaterial, "VIS-ROSA-M1-0900");
clickS3Action(s3EarlyMaterial, "review-package", "primera review posterior");
confirmAction(s3EarlyMaterial);
setRole(s3EarlyMaterial, "enfermera-coordinadora");
openWorkId(s3EarlyMaterial, "VIS-ROSA-M1-0900");
const earlyManifest = s3Action(s3EarlyMaterial, "manifest-retain");
check(
  "S3 RED2 invalidación: sin hechos previos no inventa refIds y la nueva review habilita Coordinación",
  earlyInvalidations.length === 0
    && Boolean(earlyManifest)
    && earlyManifest.classList.contains("primary"),
);

const s3Missing = boot();
setRole(s3Missing, "enfermero-clinico");
openWorkId(s3Missing, "VIS-ROSA-M1-0900");
clickS3Action(s3Missing, "review-package-missing", "paquete faltante RED2");
confirmAction(s3Missing);
const missingEvents = s3EventRecords(s3Missing);
setRole(s3Missing, "enfermera-coordinadora");
openWorkId(s3Missing, "VIS-ROSA-M1-0900");
const missingManifest = s3Action(s3Missing, "manifest-retain");
check(
  "S3 RED2 suficiencia: Enfermería puede declarar faltante y Coordinación retiene fail-closed",
  missingEvents.some((entry) => /missing|faltante|insufficient/i.test(`${entry.id} ${entry.text}`))
    && Boolean(missingManifest)
    && !missingManifest.classList.contains("primary"),
);

const s3CancelPre = boot();
setRole(s3CancelPre, "medico-atencion-directa");
openWorkId(s3CancelPre, "VIS-ROSA-M1-0900");
clickS3Action(s3CancelPre, "cancelled_by_medical_order", "cancelación pre-salida RED2");
confirmAction(s3CancelPre);
setRole(s3CancelPre, "enfermera-coordinadora");
openWorkId(s3CancelPre, "VIS-ROSA-M1-0900");
const cancelledManifestText = mainText(s3CancelPre);
const preRoute = s3Node(s3CancelPre, "route-amendment");
setRole(s3CancelPre, "conductor");
openWorkId(s3CancelPre, "VIS-ROSA-M1-0900");
check(
  "S3 RED2 cancelación pre-salida: domina retención/programación y no inventa route amendment",
  /cancelad|retirad/i.test(cancelledManifestText)
    && !/decisión vigente:\s*mantener|permanece programada/i.test(cancelledManifestText)
    && !preRoute
    && !s3Action(s3CancelPre, "route-amendment-ack")
    && !s3Action(s3CancelPre, "route-amendment-failed"),
);

const s3PostMaterial = boot();
setRole(s3PostMaterial, "enfermero-clinico"); openWorkId(s3PostMaterial, "VIS-ROSA-M1-0900"); clickS3Action(s3PostMaterial, "review-package"); confirmAction(s3PostMaterial);
setRole(s3PostMaterial, "enfermera-coordinadora"); openWorkId(s3PostMaterial, "VIS-ROSA-M1-0900"); clickS3Action(s3PostMaterial, "manifest-retain"); confirmAction(s3PostMaterial);
setRole(s3PostMaterial, "conductor"); openWorkId(s3PostMaterial, "VIS-ROSA-M1-0900"); clickS3Action(s3PostMaterial, "vehicle_departure_observed"); confirmAction(s3PostMaterial);
setRole(s3PostMaterial, "medico-atencion-directa"); openWorkId(s3PostMaterial, "VIS-ROSA-M1-0900"); clickS3Action(s3PostMaterial, "material-change", "cambio post-salida RED2"); confirmAction(s3PostMaterial);
const postMaterialEvents = s3EventRecords(s3PostMaterial);
const postMedicalContinuity = s3Node(s3PostMaterial, "continuity-medical");
const postCoordContinuity = s3Node(s3PostMaterial, "continuity-coordination");
check(
  "S3 RED2 cambio post-salida: conserva partida, no invalida pre-salida y abre continuidades separadas",
  postMaterialEvents.some((entry) => /vehicle_departure_observed/.test(`${entry.id} ${entry.text}`))
    && postMaterialEvents.some((entry) => /postdeparture_material_change|cambio material post-salida/i.test(`${entry.id} ${entry.text}`))
    && !postMaterialEvents.some((entry) => /package_review_invalidated|manifest_decision_invalidated|pre-salida/i.test(`${entry.id} ${entry.text}`))
    && Boolean(postMedicalContinuity)
    && Boolean(postCoordContinuity)
    && postMedicalContinuity !== postCoordContinuity,
);

const s3AckTruth = boot();
setRole(s3AckTruth, "medico-atencion-directa"); openWorkId(s3AckTruth, "VIS-ROSA-M1-0900"); clickS3Action(s3AckTruth, "cancelled_by_medical_order"); confirmAction(s3AckTruth);
setRole(s3AckTruth, "enfermera-coordinadora"); openWorkId(s3AckTruth, "VIS-ROSA-M1-0900"); clickS3Action(s3AckTruth, "coordination-ack-order"); confirmAction(s3AckTruth);
const ackMedical = s3Node(s3AckTruth, "continuity-medical");
const ackCoord = s3Node(s3AckTruth, "continuity-coordination");
check(
  "S3 RED2 continuidades: tras acuse no dicen pendiente y conservan referencia causal",
  [ackMedical, ackCoord].every((node) => Boolean(node)
    && !/acuse pendiente/i.test(textOf(node))
    && Boolean(node.getAttribute("data-e2e08-causal-event-id") || node.getAttribute("data-e2e08-event-id"))),
);

/* ---- accesibilidad de la superficie S3 en móvil ---- */
const s3A11y = boot();
setDevice(s3A11y, "mobile");
setRole(s3A11y, "enfermero-clinico");
openWorkId(s3A11y, "VIS-ROSA-M1-0900");
const s3ActionRegion = s3Node(s3A11y, "actions");
const s3PrimaryCount = s3ActionRegion?.querySelectorAll(".btn.primary, [data-primary=\"true\"]").length || 0;
const s3LiveCount = s3ActionRegion?.querySelectorAll('[aria-live], [role="status"], [role="alert"]').length || 0;
const s3ReviewButton = s3Action(s3A11y, "review-package");
check(
  "S3 accesibilidad móvil: región tiene una primaria, foco/aria-label y una sola live",
  Boolean(s3ActionRegion)
    && s3PrimaryCount === 1
    && s3LiveCount <= 1
    && Boolean(s3ReviewButton?.getAttribute("aria-label"))
    && s3ReviewButton?.tabIndex >= 0
    && !["fixed", "sticky"].includes(s3A11y.window.getComputedStyle(s3ActionRegion).position),
);

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
