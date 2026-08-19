/* Prueba conductual E2E-07/S4 sobre la maqueta real con jsdom.
   Uso: node /home/felix/projects/hd-design-html/tests/test-maqueta-e2e07.js

   Recorre una sola sesión de ENSAYO y cambia de actor sobre el mismo estado.
   Sólo observa DOM real; no lee variables internas ni el texto fuente.
*/
const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("/home/felix/projects/hd-hsc-os/node_modules/jsdom"));

const dir = "/home/felix/projects/hd-design-html";
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const combined = ["data.js", "cases.js", "scenes.js", "map-data.js", "map.js", "app.js"]
  .map((file) => fs.readFileSync(path.join(dir, file), "utf8")).join("\n;\n");

let pass = 0, fail = 0;
function check(name, condition) {
  if (condition) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name); }
}

function boot() {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/", pretendToBeVisual: true });
  const { window } = dom;
  window.eval(combined);
  return { dom, window, $: (s) => window.document.querySelector(s), $$: (s) => [...window.document.querySelectorAll(s)] };
}
function safeClick(ui, node, name) {
  check(`${name}: control presente`, Boolean(node));
  if (!node) return false;
  try { node.click(); return true; }
  catch (_error) { check(`${name}: interacción sin error de arnés`, false); return false; }
}
function setRole(ui, role) {
  const select = ui.$("#role-select");
  if (!select) return false;
  select.value = role; select.dispatchEvent(new ui.window.Event("change"));
  return select.value === role;
}
function setMode(ui, mode) {
  const select = ui.$("#sim-select");
  if (!select) return false;
  select.value = mode; select.dispatchEvent(new ui.window.Event("change"));
  return select.value === mode;
}
const task = (ui, id) => ui.$(`[data-open="${id}"]`);
const openTask = (ui, id) => safeClick(ui, task(ui, id), `abrir ${id}`);
const e2eAction = (ui, id) => ui.$(`[data-e2e07-action="${id}"]`);
const clickE2EAction = (ui, id) => safeClick(ui, e2eAction(ui, id), `acción ${id}`);
const confirm = (ui) => safeClick(ui, ui.$("[data-confirm]"), "confirmar acción E2E-07");
const mainText = (ui) => (ui.$("#main")?.textContent || "").replace(/\s+/g, " ").trim();
function events(ui) {
  return ui.$$("[data-e2e07-log] [data-e2e07-event]").map((node) => ({
    id: node.dataset.e2e07EventId,
    version: node.dataset.e2e07Version,
    priorVersion: node.dataset.e2e07PriorVersion,
    actor: node.dataset.e2e07Actor,
    at: node.dataset.e2e07At,
    origin: node.dataset.e2e07Origin,
    outcome: node.dataset.e2e07Outcome,
    text: node.textContent.replace(/\s+/g, " ").trim(),
  }));
}
function assertRehearsalLanguage(ui, label) {
  const text = mainText(ui).toLowerCase();
  check(`${label}: banner persistente de ensayo no operativo`,
    Boolean(ui.$("[data-e2e07-rehearsal-banner]")) && text.includes("ensayo") && text.includes("no operativo"));
  check(`${label}: no afirma activación real`,
    !/131 real (activad|enviad)|samu real (despachad|activad)|traslado real confirmado/.test(text));
}

/* Modo normal: V02 no ofrece trabajo futuro o simulado. */
const normal = boot();
const option = normal.$('#sim-select option[value="v02_rehearsal"]');
check("selector: ofrece Ensayo nocturno V02 · no operativo",
  Boolean(option) && option.textContent.trim() === "Ensayo nocturno V02 · no operativo");
setRole(normal, "medico-regulador");
check("normal: no proyecta turno ni llamada nocturna futura",
  !task(normal, "OBL-MR-02") && !task(normal, "OBL-MR-03") && !task(normal, "E2E07-MR-01"));
setRole(normal, "samu");
check("normal: SAMU no recibe despacho E2E-07 sin evento", !normal.$("[data-open]"));
setRole(normal, "receptor-uea");
check("normal: UEA no recibe prealerta E2E-07 sin evento", !normal.$("[data-open]"));
setRole(normal, "cuidador");
check("normal: cuidador no ve la falsa tarea de reporte con acuse", !task(normal, "OBL-CU-02"));
openTask(normal, "OBL-CU-01");
check("normal: tarjeta mantiene la vía real 131", /131/.test(mainText(normal)));
check("normal: tarjeta no ofrece fabricar reporte, acuse u orientación",
  !normal.$('[data-act="cu-reporte"]') && !/reporte recibido.*acuse 08:31/i.test(mainText(normal)));

/* Camino exitoso: cada obligación nace sólo de su evento causal. */
const success = boot();
check("rehearsal: el modo puede activarse desde el selector", setMode(success, "v02_rehearsal"));
setRole(success, "medico-regulador");
check("rehearsal inicial: regulador todavía no tiene llamada", !task(success, "E2E07-MR-01"));
setRole(success, "samu");
check("rehearsal inicial: SAMU todavía no tiene solicitud", !task(success, "E2E07-SA-01"));
setRole(success, "receptor-uea");
check("rehearsal inicial: UEA todavía no tiene prealerta", !task(success, "E2E07-UEA-01"));
setRole(success, "cuidador");
assertRehearsalLanguage(success, "cuidador inicial");
check("rehearsal inicial: cuidador recibe una única tarea causal", Boolean(task(success, "E2E07-CU-01")));
openTask(success, "E2E07-CU-01");
check("cuidador: escena conserva una sola primaria", success.$$("#main .btn.primary").length === 1);
clickE2EAction(success, "record-synthetic-131-call");
check("cuidador: confirmación dice ensayo y que no activa 131 real",
  /ensayo/i.test(success.$(".confirm-strip")?.textContent || "")
    && /no activa.*131 real/i.test(success.$(".confirm-strip")?.textContent || ""));
confirm(success);
let log = events(success);
check("cuidador: registra evento append-only v1 con identidad causal",
  log.length === 1 && log[0].version === "1" && log[0].priorVersion === "0"
    && log[0].actor === "cuidador" && log[0].at === "23:40"
    && log[0].origin === "v02-rehearsal" && log[0].outcome === "synthetic_131_call_recorded");
check("cuidador: receipt es simulado y recibe foco",
  /ensayo|simulad/i.test(success.$(".outcome-receipt")?.textContent || "")
    && success.window.document.activeElement === success.$(".outcome-receipt h2"));
setRole(success, "cuidador");
check("cuidador: la tarea ejecutada no resucita", !task(success, "E2E07-CU-01"));
setRole(success, "medico-regulador");
assertRehearsalLanguage(success, "regulador con llamada");
check("regulador: llamada aparece sólo después del evento cuidador", Boolean(task(success, "E2E07-MR-01")));
openTask(success, "E2E07-MR-01");
check("regulador: una primaria de rescate simulado",
  success.$$("#main .btn.primary").length === 1 && Boolean(e2eAction(success, "simulate-rescue")));
clickE2EAction(success, "simulate-rescue");
check("regulador: confirmación no promete activar 131 ni SAMU reales",
  /rescate simulado/i.test(success.$(".confirm-strip")?.textContent || "")
    && /no (activa|despacha).*real/i.test(success.$(".confirm-strip")?.textContent || ""));
confirm(success);
log = events(success);
check("regulador: rescate agrega v2 sin sobrescribir v1",
  log.length === 2 && log[0].outcome === "synthetic_131_call_recorded"
    && log[1].version === "2" && log[1].priorVersion === "1"
    && log[1].actor === "medico-regulador" && log[1].outcome === "simulated_rescue_requested");
setRole(success, "receptor-uea");
check("causalidad: UEA aún no aparece antes del despacho observado", !task(success, "E2E07-UEA-01"));
setRole(success, "samu");
assertRehearsalLanguage(success, "SAMU con solicitud");
check("SAMU: solicitud nace tras rescate regulador", Boolean(task(success, "E2E07-SA-01")));
openTask(success, "E2E07-SA-01");
check("SAMU: una primaria y salida bloqueada separada",
  success.$$("#main .btn.primary").length === 1
    && Boolean(e2eAction(success, "record-simulated-dispatch-observed"))
    && Boolean(e2eAction(success, "record-simulated-dispatch-blocked")));
clickE2EAction(success, "record-simulated-dispatch-observed");
check("SAMU: confirmación específica mantiene el límite del ensayo",
  /despacho simulado observado/i.test(success.$(".confirm-strip")?.textContent || "")
    && /no prueba.*traslado|no confirma.*traslado/i.test(success.$(".confirm-strip")?.textContent || ""));
confirm(success);
log = events(success);
check("SAMU: despacho observado agrega v3 con outcome propio",
  log.length === 3 && log[2].actor === "samu" && log[2].outcome === "simulated_dispatch_observed");
setRole(success, "samu");
check("SAMU: despacho registrado no resucita", !task(success, "E2E07-SA-01"));
setRole(success, "receptor-uea");
assertRehearsalLanguage(success, "UEA con prealerta");
check("UEA: prealerta nace sólo después del despacho observado", Boolean(task(success, "E2E07-UEA-01")));
openTask(success, "E2E07-UEA-01");
check("UEA: una sola primaria de acuse simulado", success.$$("#main .btn.primary").length === 1);
clickE2EAction(success, "acknowledge-simulated-prealert");
check("UEA: confirmar acuse no afirma llegada ni atención",
  /acuse simulado/i.test(success.$(".confirm-strip")?.textContent || "")
    && /no confirma.*(llegada|atención)/i.test(success.$(".confirm-strip")?.textContent || ""));
confirm(success);
log = events(success);
check("UEA: acuse agrega v4 con autoría y no altera eventos previos",
  log.length === 4 && log.map((entry) => entry.version).join(",") === "1,2,3,4"
    && log[3].actor === "receptor-uea" && log[3].outcome === "simulated_prealert_acknowledged");
setRole(success, "receptor-uea");
check("UEA: prealerta acusada no resucita", !task(success, "E2E07-UEA-01"));
setRole(success, "medico-regulador");
check("regulador: ve cierre y continuidad sólo tras acuse UEA",
  Boolean(success.$("[data-e2e07-continuity]"))
    && /acuse.*UEA|UEA.*acuse/i.test(mainText(success))
    && /continuidad|permanencia/i.test(mainText(success)));
check("regulador: cierre no afirma llegada, traslado completado ni atención",
  /no prueba.*llegada.*traslado completado.*atención/i.test(mainText(success))
    && !/paciente llegó|paciente recibido|traslado completado con éxito|atención realizada/i.test(mainText(success)));
setRole(success, "administrativo");
check("privacidad: rol ajeno no ve bitácora, situación ni cadena E2E-07",
  !success.$("[data-e2e07-log]") && !/SatO|prealerta simulada|rescate simulado/i.test(mainText(success)));

/* Failure: bloqueo detiene la cadena y abre recovery al regulador. */
const blocked = boot();
setMode(blocked, "v02_rehearsal");
setRole(blocked, "cuidador");
openTask(blocked, "E2E07-CU-01"); clickE2EAction(blocked, "record-synthetic-131-call"); confirm(blocked);
setRole(blocked, "medico-regulador");
openTask(blocked, "E2E07-MR-01"); clickE2EAction(blocked, "simulate-rescue"); confirm(blocked);
setRole(blocked, "samu");
openTask(blocked, "E2E07-SA-01"); clickE2EAction(blocked, "record-simulated-dispatch-blocked");
check("bloqueo: confirmación describe falla simulada sin fabricar acuse",
  /bloqueado/i.test(blocked.$(".confirm-strip")?.textContent || "")
    && /no.*acuse/i.test(blocked.$(".confirm-strip")?.textContent || ""));
confirm(blocked);
log = events(blocked);
check("bloqueo: agrega v3 dispatch_blocked con autoría SAMU",
  log.length === 3 && log[2].actor === "samu" && log[2].outcome === "simulated_dispatch_blocked");
setRole(blocked, "receptor-uea");
check("bloqueo: UEA no recibe prealerta", !task(blocked, "E2E07-UEA-01"));
setRole(blocked, "medico-regulador");
check("bloqueo: regulador ve recovery honesto y conserva responsabilidad",
  Boolean(blocked.$("[data-e2e07-recovery]"))
    && /bloqueado|falló/i.test(mainText(blocked))
    && /responsable|permanece/i.test(mainText(blocked))
    && /sin acuse|no existe acuse/i.test(mainText(blocked)));
check("bloqueo: silencio no se presenta como acuse o recepción",
  !/prealerta acusada|recepción confirmada|acuse UEA registrado/i.test(mainText(blocked)));

/* Frontera de sesión: modo preserva; salida y reload reinician. */
setMode(success, "normal");
setRole(success, "medico-regulador");
check("salir de rehearsal: borra banner, log y continuidad",
  !success.$("[data-e2e07-rehearsal-banner]") && !success.$("[data-e2e07-log]") && !success.$("[data-e2e07-continuity]"));
setMode(success, "v02_rehearsal");
setRole(success, "cuidador");
check("volver a rehearsal: inicia sesión nueva desde cuidador",
  Boolean(task(success, "E2E07-CU-01")) && events(success).length === 0);
setRole(success, "medico-regulador");
check("volver a rehearsal: no hereda rescate o acuse anteriores", !task(success, "E2E07-MR-01") && !success.$("[data-e2e07-continuity]"));
const reloaded = boot();
setRole(reloaded, "medico-regulador");
check("reload normal: no hereda sesión E2E-07", !reloaded.$("[data-e2e07-log]") && !task(reloaded, "E2E07-MR-01"));

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
