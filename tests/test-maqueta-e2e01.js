/* Prueba conductual E2E-01 sobre la maqueta real con jsdom.
   Uso: node /home/felix/projects/hd-design-html/tests/test-maqueta-e2e01.js

   El flujo recorre Origen -> Coordinación -> Médico sobre una misma sesión de
   maqueta. La fase de origen sólo entrega información: no libera antes del
   acuse/aceptación HODOM.
   Sólo observa la interfaz renderizada y activa controles DOM; no inspecciona
   variables internas ni el texto fuente de producción.
*/
const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("/home/felix/projects/hd-hsc-os/node_modules/jsdom"));

const dir = "/home/felix/projects/hd-design-html";
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const sourceFiles = ["data.js", "cases.js", "scenes.js", "map-data.js", "map.js", "app.js"];
const combined = sourceFiles.map((file) => fs.readFileSync(path.join(dir, file), "utf8")).join("\n;\n");

let pass = 0;
let fail = 0;
let harnessErrors = 0;

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
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.eval(combined);
  return {
    dom,
    window,
    $: (selector) => window.document.querySelector(selector),
    $$: (selector) => [...window.document.querySelectorAll(selector)],
  };
}

function mainText(ui) {
  return (ui.$("#main")?.textContent || "").replace(/\s+/g, " ").trim();
}

function task(ui, id) {
  return ui.$(`[data-open="${id}"]`);
}

function action(ui, id) {
  return ui.$(`[data-act="${id}"]`);
}

function clickExpected(ui, node, name) {
  check(`${name}: control presente`, Boolean(node));
  if (!node) return false;
  try {
    node.click();
    return true;
  } catch (error) {
    harnessErrors++;
    console.log("HARNESS_ERROR", `${name}: ${error.message}`);
    return false;
  }
}

function setRole(ui, role, name) {
  const select = ui.$("#role-select");
  check(`${name}: selector de identidad presente`, Boolean(select));
  if (!select) return false;
  try {
    select.value = role;
    select.dispatchEvent(new ui.window.Event("change"));
  } catch (error) {
    harnessErrors++;
    console.log("HARNESS_ERROR", `${name}: ${error.message}`);
    return false;
  }
  check(`${name}: identidad activa es ${role}`, select.value === role);
  return select.value === role;
}

function assertRecovery(ui, name) {
  const recovery = ui.$("#action-result .recovery-panel");
  check(`${name}: recovery visible`, Boolean(recovery));
  check(`${name}: recovery conserva causa y salida`,
    Boolean(recovery)
      && /transferencia.*(aún no es aceptada|no es aceptada)/i.test(recovery.textContent)
      && /Coordinación gestiona la aceptación/i.test(recovery.textContent));
  return recovery;
}

function assertOriginRecovery(ui, name) {
  const recovery = ui.$("#action-result .recovery-panel");
  check(`${name}: recovery conserva responsabilidad en origen`,
    Boolean(recovery)
      && /origen.*(conserva|mantiene).*responsabilidad|responsabilidad.*(sigue|permanece).*origen/i.test(recovery.textContent));
  check(`${name}: recovery deriva a Coordinación para aceptación`,
    Boolean(recovery)
      && /Coordinación.*(gestiona|acusa|acepta|confirma)|aceptación.*Coordinación/i.test(recovery.textContent));
  return recovery;
}

/* ===== Fase 1: el origen entrega información sin liberar ===== */
const originBeforeAcceptance = boot();
setRole(originBeforeAcceptance, "enfermeria-origen", "origen antes de aceptación");
const originTask = task(originBeforeAcceptance, "OBL-EO-01");
check("origen: obligación de handoff informacional visible",
  Boolean(originTask)
    && /Entregar handoff completo de Jorge/i.test(mainText(originBeforeAcceptance))
    && /HOD-2026-0138/.test(mainText(originBeforeAcceptance)));
clickExpected(originBeforeAcceptance, originTask, "origen: abrir handoff informacional");
check("origen: entrega conserva responsabilidad y referencia a Coordinación",
  /Origen conserva la responsabilidad/i.test(mainText(originBeforeAcceptance))
    && /Contenido completo del handoff/i.test(mainText(originBeforeAcceptance))
    && /Coordinación HODOM/i.test(mainText(originBeforeAcceptance)));
const originRelease = action(originBeforeAcceptance, "eo-entregar");
check("origen: liberar/acuse HODOM permanece bloqueado antes de aceptación",
  Boolean(originRelease)
    && originRelease.classList.contains("blocked")
    && originRelease.dataset.av === "blocked_explainable");
clickExpected(originBeforeAcceptance, originRelease, "origen: consultar bloqueo de liberación");
check("origen: bloqueo no abre confirmación de liberación ni acuse",
  !originBeforeAcceptance.$(".confirm-strip [data-confirm]"));
assertOriginRecovery(originBeforeAcceptance, "origen");

/* ===== Precondición: antes del handoff el bloqueo médico es correcto ===== */
const beforeAcceptance = boot();
setRole(beforeAcceptance, "medico-atencion-directa", "precondición médica");
check("precondición: obligación de Jorge visible para Médico",
  Boolean(task(beforeAcceptance, "OBL-MD-04"))
    && /Primera evaluación médica de Jorge/i.test(task(beforeAcceptance, "OBL-MD-04")?.textContent || ""));
clickExpected(beforeAcceptance, task(beforeAcceptance, "OBL-MD-04"), "precondición: abrir obligación médica");
const blockedBefore = action(beforeAcceptance, "md-primera");
check("precondición: autoridad médica permanece bloqueada antes de aceptación",
  Boolean(blockedBefore)
    && blockedBefore.classList.contains("blocked")
    && blockedBefore.dataset.av === "blocked_explainable");
clickExpected(beforeAcceptance, blockedBefore, "precondición: solicitar apertura médica");
assertRecovery(beforeAcceptance, "precondición médica");

/* ===== Journey E2E-01: Coordinación acepta y entrega el efecto a Médico ===== */
const flow = boot();
check("coordinación: identidad inicial es la función autorizada",
  flow.$("#role-select")?.value === "enfermera-coordinadora");
const coordinationTask = task(flow, "OBL-CO-02");
check("coordinación: obligación de handoff visible con caso y receptor",
  Boolean(coordinationTask)
    && /Jorge M\./i.test(coordinationTask.textContent)
    && /HOD-2026-0138/.test(coordinationTask.textContent));
clickExpected(flow, coordinationTask, "coordinación: abrir handoff Jorge");
check("handoff: identidad, responsabilidad vigente y autoridad visibles",
  /Transferencia de Jorge M\./i.test(mainText(flow))
    && /Medicina Interna \(hasta la aceptación\)/i.test(mainText(flow))
    && /HOD-2026-0138/.test(mainText(flow)));
const acceptTransfer = action(flow, "co-aceptar");
check("coordinación: aceptar es la acción primaria autorizada",
  Boolean(acceptTransfer)
    && acceptTransfer.classList.contains("primary")
    && acceptTransfer.dataset.av === "available"
    && flow.$$(".scene-actions .btn.primary").length === 1);
clickExpected(flow, acceptTransfer, "coordinación: iniciar aceptación");
check("coordinación: confirmación explica transferencia atómica",
  /Aceptar es atómico|HODOM responde/i.test(flow.$(".confirm-strip")?.textContent || ""));
const acceptanceConfirm = flow.$(".confirm-strip [data-confirm]");
clickExpected(flow, acceptanceConfirm, "coordinación: confirmar aceptación");
const coordinationReceipt = flow.$(".outcome-receipt");
check("coordinación: receipt confirma el efecto y la continuidad",
  Boolean(coordinationReceipt)
    && coordinationReceipt.getAttribute("role") === "status"
    && /Transferencia aceptada/i.test(coordinationReceipt.textContent)
    && /responsabilidad pasa del origen a HODOM/i.test(coordinationReceipt.textContent)
    && /médico de atención directa/i.test(coordinationReceipt.textContent)
    && /traslado 11:00–13:00|logística confirmada/i.test(coordinationReceipt.textContent));
check("coordinación: aceptación queda atribuida a receptor, origen y versión",
  coordinationReceipt?.dataset.e2e01Event === "coordination-accepted"
    && coordinationReceipt.dataset.e2e01Actor === "enfermera-coordinadora"
    && coordinationReceipt.dataset.e2e01AcceptingReceiver === "enfermera-coordinadora"
    && coordinationReceipt.dataset.e2e01IntendedReceiver === "medico-atencion-directa"
    && coordinationReceipt.dataset.e2e01Origin === "medicina-interna"
    && coordinationReceipt.dataset.e2e01Outcome === "responsibility-accepted-hodom"
    && coordinationReceipt.dataset.e2e01PriorVersion === "0"
    && coordinationReceipt.dataset.e2e01Version === "1");
check("coordinación: trazabilidad v1 es legible sin depender de data-*",
  /Evento\s*v1.*versión previa\s*v0/i.test(coordinationReceipt?.textContent || "")
    && /Actor\s*Enfermera coordinadora HODOM/i.test(coordinationReceipt?.textContent || "")
    && /Origen\s*Medicina Interna/i.test(coordinationReceipt?.textContent || "")
    && /Receptor que acepta\s*Enfermera coordinadora HODOM/i.test(coordinationReceipt?.textContent || "")
    && /Siguiente receptor\s*Médico de atención directa/i.test(coordinationReceipt?.textContent || ""));
check("coordinación: aceptación no fabrica llegada ni primera evaluación",
  Boolean(coordinationReceipt)
    && /condicionada a llegada|llegada.*(pendiente|no (?:está )?registrada)|no (?:afirma|demuestra|registra) llegada/i.test(coordinationReceipt.textContent)
    && !/llegada (observada|registrada|confirmada)/i.test(coordinationReceipt.textContent)
    && !/primera evaluación (registrada|realizada|completada)/i.test(coordinationReceipt.textContent));
check("coordinación: escena aceptada no conserva un estado de aceptación pendiente",
  !/aceptación de responsabilidad[^.]{0,80}(?:está )?pendiente/i.test(mainText(flow))
    && !/aceptación competente[^.]{0,80}(?:está )?pendiente/i.test(mainText(flow)));
check("coordinación: receipt recibe foco para lectura",
  Boolean(coordinationReceipt?.querySelector("h2"))
    && flow.window.document.activeElement === coordinationReceipt?.querySelector("h2"));
clickExpected(flow, acceptanceConfirm, "coordinación: reintentar confirmación retenida");
check("coordinación: guard one-shot conserva sólo el receipt v1",
  flow.$$(".outcome-receipt[data-e2e01-event='coordination-accepted']").length === 1
    && flow.$(".outcome-receipt[data-e2e01-event='coordination-accepted']")?.dataset.e2e01Version === "1"
    && !flow.$(".confirm-strip [data-confirm]"));
clickExpected(flow, flow.$("[data-back]"), "coordinación: volver a cola");
check("coordinación: obligación aceptada sale de su cola en la misma sesión",
  !task(flow, "OBL-CO-02"));
const coordinationStatus = flow.$("[data-e2e01-handoff-status]");
const coordinationLog = flow.$$("[data-e2e01-event-entry]");
check("coordinación: estado compartido visible conserva responsabilidad y límite",
  Boolean(coordinationStatus)
    && /Transferencia aceptada.*llegada pendiente/i.test(coordinationStatus.textContent)
    && /HODOM desde la aceptación/i.test(coordinationStatus.textContent));
check("coordinación: log visible contiene una sola v1 con trazabilidad humana",
  coordinationLog.length === 1
    && /v1\s*←\s*v0/i.test(coordinationLog[0].textContent)
    && /Actor:\s*Enfermera coordinadora HODOM/i.test(coordinationLog[0].textContent)
    && /Origen:\s*Medicina Interna/i.test(coordinationLog[0].textContent)
    && /Receptor que acepta:\s*Enfermera coordinadora HODOM/i.test(coordinationLog[0].textContent)
    && /Siguiente receptor:\s*Médico de atención directa/i.test(coordinationLog[0].textContent));

/* La aceptación habilita una liberación atribuida; todavía no es llegada. */
setRole(flow, "enfermeria-origen", "origen después de aceptación");
const releasableOriginTask = task(flow, "OBL-EO-01");
check("origen: cola proyecta aceptación v1 y liberación pendiente",
  Boolean(releasableOriginTask)
    && /aceptación HODOM v1/i.test(mainText(flow))
    && /llegada.*no (?:está )?registrada|llegada pendiente/i.test(mainText(flow)));
clickExpected(flow, releasableOriginTask, "origen: abrir liberación referenciada");
check("origen: escena conserva aceptación, liberación y llegada como hechos separados",
  /aceptación.*v1/i.test(mainText(flow))
    && /liberación.*(pendiente|aún no registrada)/i.test(mainText(flow))
    && /llegada.*(no (?:está )?registrada|pendiente)/i.test(mainText(flow))
    && !/llegada (observada|registrada|confirmada)/i.test(mainText(flow)));
const referencedRelease = action(flow, "eo-entregar");
check("origen: liberación se habilita con referencia explícita a aceptación v1",
  Boolean(referencedRelease)
    && referencedRelease.classList.contains("primary")
    && referencedRelease.dataset.av === "available"
    && /aceptación HODOM v1/i.test(referencedRelease.textContent));
clickExpected(flow, referencedRelease, "origen: iniciar liberación referenciada");
check("origen: confirmación no convierte liberación en llegada",
  /aceptación HODOM v1/i.test(flow.$(".confirm-strip")?.textContent || "")
    && /no (?:registra|confirma|demuestra) llegada/i.test(flow.$(".confirm-strip")?.textContent || ""));
const releaseConfirm = flow.$(".confirm-strip [data-confirm]");
clickExpected(flow, releaseConfirm, "origen: confirmar liberación referenciada");
const originReleaseReceipt = flow.$("#action-result .outcome-receipt");
check("origen: liberación queda append-only como v2 derivada de aceptación v1",
  originReleaseReceipt?.dataset.e2e01Event === "origin-release-recorded"
    && originReleaseReceipt.dataset.e2e01Actor === "enfermeria-origen"
    && originReleaseReceipt.dataset.e2e01IntendedReceiver === "enfermera-coordinadora"
    && originReleaseReceipt.dataset.e2e01Origin === "coordination-accepted-v1"
    && originReleaseReceipt.dataset.e2e01Outcome === "origin-release-recorded-arrival-pending"
    && originReleaseReceipt.dataset.e2e01PriorVersion === "1"
    && originReleaseReceipt.dataset.e2e01Version === "2");
check("origen: trazabilidad v2 es legible sin depender de data-*",
  /Evento\s*v2.*versión previa\s*v1/i.test(originReleaseReceipt?.textContent || "")
    && /Actor\s*Enfermería\/TENS de Medicina Interna/i.test(originReleaseReceipt?.textContent || "")
    && /Origen del evento\s*Aceptación HODOM v1/i.test(originReleaseReceipt?.textContent || "")
    && /Receptor informado\s*Coordinación HODOM/i.test(originReleaseReceipt?.textContent || ""));
check("origen: receipt mantiene llegada y evaluación pendientes",
  Boolean(originReleaseReceipt)
    && /liberación/i.test(originReleaseReceipt.textContent)
    && /llegada.*(pendiente|no (?:está )?observada)/i.test(originReleaseReceipt.textContent)
    && !/primera evaluación (registrada|realizada|completada)/i.test(originReleaseReceipt.textContent));
check("origen: receipt de liberación recibe foco",
  Boolean(originReleaseReceipt?.querySelector("h2"))
    && flow.window.document.activeElement === originReleaseReceipt?.querySelector("h2"));
clickExpected(flow, releaseConfirm, "origen: reintentar confirmación retenida");
check("origen: guard one-shot conserva sólo el receipt v2",
  flow.$$(".outcome-receipt[data-e2e01-event='origin-release-recorded']").length === 1
    && flow.$(".outcome-receipt[data-e2e01-event='origin-release-recorded']")?.dataset.e2e01Version === "2"
    && !flow.$(".confirm-strip [data-confirm]"));
clickExpected(flow, flow.$("[data-back]"), "origen: volver tras liberación");
check("origen: obligación liberada sale de la cola", !task(flow, "OBL-EO-01"));
const releaseLog = flow.$$("[data-e2e01-event-entry]");
check("origen: log visible conserva exactamente v1 y v2 con trazabilidad humana",
  releaseLog.length === 2
    && /v1\s*←\s*v0/i.test(releaseLog[0].textContent)
    && /v2\s*←\s*v1/i.test(releaseLog[1].textContent)
    && /Actor:\s*Enfermería\/TENS de Medicina Interna/i.test(releaseLog[1].textContent)
    && /Origen:\s*Aceptación HODOM v1/i.test(releaseLog[1].textContent)
    && /Receptor informado:\s*Coordinación HODOM/i.test(releaseLog[1].textContent));
setRole(flow, "enfermera-coordinadora", "ciclo después de liberación");
setRole(flow, "enfermeria-origen", "retorno a origen después de liberación");
check("origen: liberación v2 no resucita al cambiar de rol", !task(flow, "OBL-EO-01"));

/* La aceptación transfiere responsabilidad, pero no fabrica llegada. */
setRole(flow, "medico-atencion-directa", "post-aceptación médica");
const medicalTask = task(flow, "OBL-MD-04");
check("médico: identidad cambia sin perder la sesión",
  flow.$("#role-select")?.value === "medico-atencion-directa");
check("médico: obligación de Jorge refleja aceptación y llegada pendiente",
  Boolean(medicalTask)
    && /Primera evaluación médica de Jorge/i.test(medicalTask.textContent)
    && /HOD-2026-0138/.test(medicalTask.textContent)
    && /transferencia aceptada/i.test(medicalTask.textContent)
    && /llegada pendiente/i.test(medicalTask.textContent));
check("médico: proyección conserva el riesgo canónico A1",
  Boolean(medicalTask)
    && /A1\s*·\s*Llegada pendiente/i.test(medicalTask.textContent)
    && !/A2\s*·\s*Llegada pendiente/i.test(medicalTask.textContent));
clickExpected(flow, medicalTask, "médico: abrir obligación proyectada");
check("médico: continuidad distingue aceptación de llegada",
  /transferencia.*aceptada/i.test(mainText(flow))
    && /responsabilidad.*HODOM/i.test(mainText(flow))
    && /llegada.*(pendiente|no (?:está )?registrada)/i.test(mainText(flow))
    && !/transferencia.*aún no es aceptada/i.test(mainText(flow)));
const medicalAction = action(flow, "md-primera");
check("médico: evaluación sigue bloqueada hasta registrar llegada",
  Boolean(medicalAction)
    && medicalAction.classList.contains("blocked")
    && medicalAction.dataset.av === "blocked_explainable");
clickExpected(flow, medicalAction, "médico: consultar evaluación aún bloqueada");
const arrivalRecovery = flow.$("#action-result .recovery-panel");
check("médico: recovery actual conserva responsabilidad y pide hito de llegada",
  Boolean(arrivalRecovery)
    && /transferencia.*aceptada/i.test(arrivalRecovery.textContent)
    && /llegada.*no (?:está )?registrada|llegada pendiente/i.test(arrivalRecovery.textContent)
    && /HODOM conserva la responsabilidad/i.test(arrivalRecovery.textContent)
    && /Coordinación.*(confirma|registre).*llegada/i.test(arrivalRecovery.textContent));
check("médico: sin llegada no hay confirmación ni receipt clínico",
  !flow.$(".confirm-strip [data-confirm]")
    && !flow.$("#action-result .outcome-receipt")
    && !/llegada registrada|primera evaluación registrada/i.test(mainText(flow)));

/* El mismo v1/v2 debe proyectarse en los consumidores visibles del caso. */
clickExpected(flow, flow.$("[data-ficha]"), "ficha: abrir Jorge desde la escena médica");
check("ficha: responsabilidad vigente y llegada pendiente derivan del log compartido",
  /Responde ahora\s*HODOM desde (?:la )?aceptación/i.test(mainText(flow))
    && /llegada.*(?:pendiente|no (?:está )?registrada|no observada)/i.test(mainText(flow))
    && !/transferencia sin aceptar|aceptación HODOM pendiente|Medicina Interna \(hasta la aceptación\)/i.test(mainText(flow)));
const caseLenses = flow.$$(".lenses [data-lens]");
check("ficha: lentes usan estado válido para botones",
  caseLenses.length === 3
    && caseLenses.every((button) => button.hasAttribute("aria-pressed") && !button.hasAttribute("aria-selected")));
check("ficha: no serializa una barra de acciones vacía con nombre ARIA",
  !flow.$('.action-bar[aria-label="Acciones autorizadas"]'));
const pastLens = caseLenses.find((button) => button.dataset.lens === "pasado");
clickExpected(flow, pastLens, "ficha: abrir lente Pasado");
const timelineEntries = flow.$$(".timeline li").map((entry) => entry.textContent.replace(/\s+/g, " ").trim());
const awaitingIndex = timelineEntries.findIndex((entry) => /handoff.*esperando aceptación/i.test(entry));
const acceptedIndex = timelineEntries.findIndex((entry) => /sesión de maqueta.*v1.*Coordinación HODOM.*aceptó/i.test(entry));
const releasedIndex = timelineEntries.findIndex((entry) => /sesión de maqueta.*v2.*liberación.*llegada (?:pendiente|no observada)/i.test(entry));
check("ficha Pasado: preserva espera histórica y anexa v1/v2 ordenados sin inventar llegada",
  awaitingIndex >= 0
    && acceptedIndex > awaitingIndex
    && releasedIndex > acceptedIndex
    && !/llegada (?:registrada|confirmada|observada)|primera evaluación (?:registrada|realizada)/i.test(timelineEntries.slice(acceptedIndex).join(" ")));
clickExpected(flow, flow.$("[data-back-case]"), "ficha: volver a la escena médica");
clickExpected(flow, flow.$('[data-nav="buscar"]'), "búsqueda: abrir vista desde el rol médico");
const searchInput = flow.$("#q");
check("búsqueda: entrada presente", Boolean(searchInput));
if (searchInput) {
  searchInput.value = "Jorge";
  searchInput.dispatchEvent(new flow.window.Event("input"));
}
check("búsqueda: Jorge refleja aceptación/liberación sin afirmar llegada",
  Boolean(flow.$('[data-case-open="HOD-2026-0138"]'))
    && /Jorge M\./i.test(flow.$('[data-case-open="HOD-2026-0138"]')?.textContent || "")
    && /aceptación HODOM v1/i.test(flow.$('[data-case-open="HOD-2026-0138"]')?.textContent || "")
    && /liberación.*v2/i.test(flow.$('[data-case-open="HOD-2026-0138"]')?.textContent || "")
    && /llegada.*(?:pendiente|no observada|no (?:está )?registrada)/i.test(flow.$('[data-case-open="HOD-2026-0138"]')?.textContent || "")
    && !/transferencia sin aceptar|aceptación.*pendiente/i.test(flow.$('[data-case-open="HOD-2026-0138"]')?.textContent || ""));

setRole(flow, "enfermera-coordinadora", "coordinación para censo post-aceptación");
clickExpected(flow, flow.$('[data-nav="censo-mapa"]'), "censo: abrir mapa desde Coordinación");
const jorgeCensusRow = flow.$('[data-census-row="HOD-2026-0138"]');
check("censo/mapa: Jorge proyecta v2 y llegada pendiente, no transferencia sin aceptar",
  Boolean(jorgeCensusRow)
    && /Jorge M\./i.test(jorgeCensusRow.textContent)
    && /liberación.*v2/i.test(jorgeCensusRow.textContent)
    && /llegada.*(?:pendiente|no observada|no (?:está )?registrada)/i.test(jorgeCensusRow.textContent)
    && !/transferencia sin aceptar|aceptación.*pendiente/i.test(jorgeCensusRow.textContent));

setRole(flow, "enfermero-clinico", "enfermería post-aceptación");
const nursingTask = task(flow, "OBL-EN-02");
check("enfermería: cola reconoce aceptación y conserva llegada como requisito",
  Boolean(nursingTask)
    && /transferencia aceptada/i.test(nursingTask.textContent)
    && /llegada pendiente/i.test(nursingTask.textContent)
    && /A1\s*·\s*Llegada pendiente/i.test(nursingTask.textContent));
clickExpected(flow, nursingTask, "enfermería: abrir valoración aún condicionada");
check("enfermería: escena distingue responsabilidad aceptada de llegada",
  /responsabilidad.*HODOM/i.test(mainText(flow))
    && /llegada.*(?:pendiente|no (?:está )?registrada)/i.test(mainText(flow))
    && !/responsabilidad sigue en el origen|transferencia.*aún no es aceptada/i.test(mainText(flow)));
const nursingAction = action(flow, "en-jorge");
check("enfermería: valoración sigue bloqueada por llegada", Boolean(nursingAction)
  && nursingAction.dataset.av === "blocked_explainable");
clickExpected(flow, nursingAction, "enfermería: consultar requisito de llegada");
check("enfermería: recovery conserva HODOM y deriva registro autorizado de llegada",
  /HODOM conserva la responsabilidad/i.test(flow.$("#action-result")?.textContent || "")
    && /Coordinación.*(?:confirma|registre).*llegada/i.test(flow.$("#action-result")?.textContent || ""));

setRole(flow, "kinesiologo", "kinesiología post-aceptación");
const kinesiologyTask = task(flow, "OBL-KN-02");
check("kinesiología: cola reconoce aceptación y conserva llegada como requisito",
  Boolean(kinesiologyTask)
    && /transferencia aceptada/i.test(kinesiologyTask.textContent)
    && /llegada pendiente/i.test(kinesiologyTask.textContent)
    && /A1\s*·\s*Llegada pendiente/i.test(kinesiologyTask.textContent));
clickExpected(flow, kinesiologyTask, "kinesiología: abrir valoración aún condicionada");
check("kinesiología: escena distingue responsabilidad aceptada de llegada",
  /responsabilidad.*HODOM/i.test(mainText(flow))
    && /llegada.*(?:pendiente|no (?:está )?registrada)/i.test(mainText(flow))
    && !/responsabilidad sigue en el origen|transferencia.*aún no es aceptada/i.test(mainText(flow)));
const kinesiologyAction = action(flow, "kn-jorge");
check("kinesiología: valoración sigue bloqueada por llegada", Boolean(kinesiologyAction)
  && kinesiologyAction.dataset.av === "blocked_explainable");
clickExpected(flow, kinesiologyAction, "kinesiología: consultar requisito de llegada");
check("kinesiología: recovery conserva HODOM y deriva registro autorizado de llegada",
  /HODOM conserva la responsabilidad/i.test(flow.$("#action-result")?.textContent || "")
    && /Coordinación.*(?:confirma|registre).*llegada/i.test(flow.$("#action-result")?.textContent || ""));

/* El cambio de rol no debe reconstruir la obligación ya satisfecha. */
setRole(flow, "enfermera-coordinadora", "retorno a coordinación");
check("retorno: handoff aceptado no resucita obligación de Coordinación",
  !task(flow, "OBL-CO-02")
    && !flow.$('[data-act="co-aceptar"]'));

/* Privacidad: un rol sin habilitación clínica no recibe el handoff ni su acción. */
setRole(flow, "otro-profesional", "rol fuera de la autoridad clínica");
check("privacidad: rol no habilitado no ve handoff, contenido ni acción clínica",
  !task(flow, "OBL-CO-02")
    && !flow.$('[data-act="co-aceptar"]')
    && !/Jorge M\.|HOD-2026-0138|Resumen clínico|medicación conciliada/i.test(mainText(flow)));

console.log(`\n${pass} PASS · ${fail} FAIL`);
console.log(`HARNESS_ERRORS ${harnessErrors}`);
process.exit(fail || harnessErrors ? 1 : 0);
