/* Prueba de interacciones de la maqueta hd-design-html con jsdom
   Uso: cd /home/felix/projects/hd-hsc-os && node /home/felix/projects/hd-design-html/tests/test-maqueta.js */
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

/* 1. render inicial: coordinadora con 3 obligaciones reales y nav extra */
check("coordinadora: 3 work items", $$(".work-item").length === 3);
check("coordinadora: nav Sala de Mando", $$(".app-nav button").some(b => b.textContent.includes("Sala de Mando")));

/* 2. abrir obligación → escena handoff con header y acciones */
$$("[data-open]")[1].click();
check("escena handoff: título", $("#main h1").textContent.includes("Jorge M."));
check("escena: resp-header presente", !!$(".resp-header"));
check("escena: exactamente 1 acción primaria", $$(".action-bar .btn.primary").length === 1);
check("escena: acción oculta por política NO se serializa", !$$(".action-bar .btn").some(b => b.textContent.includes("Ajustar pauta")));

/* 3. confirmar primaria → recibo con receptor y próximo paso */
$(".action-bar .btn.primary").click();
check("confirm strip aparece", !!$(".confirm-strip"));
$("[data-confirm]").click();
check("recibo confirmado", !!$(".outcome-receipt"));
check("recibo declara responsable", $(".outcome-receipt").textContent.includes("Responsable ahora"));

/* 4. volver: la obligación completada salió de Mi trabajo */
$("[data-back]").click();
check("obligación completada salió de la cola", $$(".work-item").length === 2);

/* 5. acción bloqueada explica causa y salida (Sala de Mando → cerrar período) */
$$(".app-nav button")[1].click();
const blocked = $$(".action-bar .btn").find(b => b.classList.contains("blocked"));
check("sala: cerrar período bloqueado explicable", !!blocked);
blocked.click();
check("recovery con causa y salida", $(".recovery-panel").textContent.includes("Qué puede hacer"));

/* 6. cambio de rol → TENS con delegación */
const sel = $("#role-select");
sel.value = "tecnico-enfermeria";
sel.dispatchEvent(new window.Event("change"));
check("TENS: 3 obligaciones", $$(".work-item").length === 3);
$$("[data-open]")[1].click(); // atencion-ana-tens
check("TENS escena: alerta gobernada A2", !!$(".alert.A2"));
check("TENS: alerta declara supresión y escalamiento", $(".alert").textContent.includes("Cuándo se apaga") && $(".alert").textContent.includes("Si no se resuelve"));
const blockedTens = $$(".action-bar .btn").find(b => b.textContent.includes("Administrar medicamento"));
blockedTens.click();
check("TENS: administrar sin delegación explica causa", $(".recovery-panel").textContent.includes("delegación vigente no cubre"));

/* 7. fonoaudiólogo: work_one anuncia y auto-navega */
sel.value = "fonoaudiologo";
sel.dispatchEvent(new window.Event("change"));
check("fono: anuncio de obligación única", $("#main").textContent.includes("Una tarea pendiente"));

/* 8. offline: acción solo-en-línea se bloquea; reconciliable entra en cola */
sel.value = "medico-atencion-directa";
sel.dispatchEvent(new window.Event("change"));
const sim = $("#sim-select");
sim.value = "offline";
sim.dispatchEvent(new window.Event("change"));
check("offline: banner de corte local", !!$(".context-banner.offline"));
$$("[data-open]")[0].click(); // atencion-rosa; el crítico aún no fue comunicado
const offlineBtns = $$(".action-bar .btn");
const visitaBtn = offlineBtns.find(b => b.textContent.includes("Registrar resultado de visita"));
check("offline: visita sigue disponible (reconciliable)", visitaBtn.classList.contains("primary"));
visitaBtn.click();
$("[data-confirm]").click();
check("offline: intención en cola, no éxito", $(".recovery-panel").textContent.includes("Guardado en este equipo") && $(".recovery-panel").textContent.includes("pendiente de envío"));
sim.value = "normal";
sim.dispatchEvent(new window.Event("change"));
check("reconciliación: recibo confirmado tras volver", !!$(".outcome-receipt") && $("#main").textContent.includes("Sincronizada"));

/* 9. sesión expirada → overlay y reautenticación */
sim.value = "session_expired";
sim.dispatchEvent(new window.Event("change"));
check("overlay sesión expirada", !!$(".session-overlay"));
$("[data-reauth]").click();
check("reautenticar restaura", !$(".session-overlay"));

/* 10. denegación explica causa no sensible */
sim.value = "denied";
sim.dispatchEvent(new window.Event("change"));
check("denegación con causa y salida", $("#main").textContent.includes("Sin permiso") && $("#main").textContent.includes("Qué puede hacer"));

/* 11. conductor: sin datos clínicos, ruta con custodia */
sim.value = "normal";
sim.dispatchEvent(new window.Event("change"));
sel.value = "conductor";
sel.dispatchEvent(new window.Event("change"));
check("conductor: scope sin datos clínicos", $(".identity").textContent.includes("sin datos clínicos"));
$$("[data-open]")[0].click();
check("ruta: tabla de itinerario", !!$("table.data"));
check("ruta: acción reconciliable offline", $(".action-bar").textContent.includes("se guarda sin señal"));

/* 12. DT: mesa con decisión institucional */
sel.value = "direccion-tecnica";
sel.dispatchEvent(new window.Event("change"));
$$(".app-nav button")[1].click();
check("mesa: panorama con corte", $("#main").textContent.includes("Mesa de Dirección"));
$$(".action-bar .btn.primary")[0].click();
$("[data-confirm]").click();
check("DT: decisión emitida con recibo", !!$(".outcome-receipt"));

/* 13. remediación UX 2026-08-17: leyenda eliminada, A4 reforzada, CSS sano */
sel.value = "enfermera-coordinadora";
sel.dispatchEvent(new window.Event("change"));
check("work: sin línea-leyenda A0–A4", !$("#main").textContent.includes("A4 crítico ahora"));

/* La alerta médica nace de una comunicación válida de Laboratorio. */
sel.value = "laboratorio";
sel.dispatchEvent(new window.Event("change"));
$("[data-open]").click();
$("[data-e2e08-action=\"communicate-success\"]").click();
$("[data-confirm]").click();
sel.value = "medico-atencion-directa";
sel.dispatchEvent(new window.Event("change"));
$$("[data-open]")[0].click(); // alerta-potasio (A4)
check("A4: cifra crítica aislada", !!$(".figure-value") && $(".figure-value").textContent.includes("6,1"));
check("A4: frescura relativa declarada", $(".figure-label").textContent.includes("hace 22 min"));
check("A4: escalamiento con hora límite", $(".alert").textContent.includes("08:22"));
check("A4: canal alternativo declarado", $(".alert").textContent.includes("Canal alternativo"));
check("A4: sin corte duplicado en cabecera", !$(".resp-header").textContent.includes("Datos actualizados"));

const css = fs.readFileSync(path.join(dir, "styles.css"), "utf8");
check("css: sin cuerpos de 11-12px", !/font-size:\s*1[12]px/.test(css));
check("css: chip A2 con tinta sobre tinte", css.includes(".risk.A2 { color: var(--ink)"));
check("css: orden móvil de Mi día declarado", css.includes(".day-layout > .day-side"));

/* 14. ampliación UX 2026-08-17: ficha, búsqueda, plan/derivación, externo, mañana */
sel.value = "medico-atencion-directa";
sel.dispatchEvent(new window.Event("change"));
$$("[data-open]")[1].click(); // atencion-rosa
check("escena: botón ficha para rol clínico", !!$("[data-ficha]"));
$("[data-ficha]").click();
check("ficha: título del caso", $("#main h1").textContent.includes("Rosa C."));
check("ficha: tres lentes", $$(".lenses button").length === 3);
$$(".lenses button").find(b => b.dataset.lens === "plan").click();
check("ficha: tres planes y evaluación social ausente con autoría", ["Plan médico", "Plan de cuidados", "Plan de rehabilitación", "Evaluación social", "Trabajo social · SIN TITULAR"].every(t => $("#main").textContent.includes(t)));
check("ficha: médico puede ajustar su plan", $$("#main .btn").some(b => b.textContent.includes("Ajustar el plan médico")));
$$("#main .btn").find(b => b.textContent.includes("Derivar internamente")).click();
check("derivación: escena con receptor y motivo", $("#main h1").textContent.includes("Derivación interna"));
$$(".action-bar .btn.primary")[0].click();
$("[data-confirm]").click();
check("derivación: recibo conserva plan hasta aceptación", $(".outcome-receipt").textContent.includes("kinesiología"));

/* propuesta de cambio de plan por enfermería */
sel.value = "enfermero-clinico";
sel.dispatchEvent(new window.Event("change"));
$$("[data-open]")[0].click(); // atencion-rosa
$("[data-ficha]").click();
$$("#main .btn").find(b => b.textContent.includes("Proponer cambio en el plan")).click();
check("propuesta: no cambia el plan por sí sola", $("#main").textContent.includes("no cambia el plan"));
$$(".action-bar .btn.primary")[0].click();
$("[data-confirm]").click();
check("propuesta: recibo con autoría y decisión del dueño", $(".outcome-receipt").textContent.includes("autoría"));

/* lado receptor de la derivación */
sel.value = "kinesiologo";
sel.dispatchEvent(new window.Event("change"));
check("kine: derivación recibida en su cola", $$(".work-item").length === 3);
$$("[data-open]")[2].click(); // derivacion-rosa-kine
check("kine: escena de derivación con su criterio", $("#main").textContent.includes("SatO2"));
$$(".action-bar .btn.primary")[0].click();
$("[data-confirm]").click();
check("kine: aceptar deja nueva versión con su autoría", $(".outcome-receipt").textContent.includes("versión 4"));

/* búsqueda e historia */
sel.value = "medico-atencion-directa";
sel.dispatchEvent(new window.Event("change"));
$$(".app-nav button").find(b => b.textContent === "Buscar").click();
check("buscar: vista con input", !!$("#q"));
check("buscar: lista inicial agrupada", $("#search-results").textContent.includes("Episodio vigente") && $("#search-results").textContent.includes("Episodio cerrado"));
const q = $("#q");
q.value = "maría"; q.dispatchEvent(new window.Event("input"));
check("buscar: encuentra egresada", $("#search-results").textContent.includes("María T."));
$$("#search-results [data-case-open]")[0].click();
check("buscar: egresado es solo lectura", $("#main").textContent.includes("Episodio cerrado"));

/* conductor: sin búsqueda ni ficha */
sel.value = "conductor";
sel.dispatchEvent(new window.Event("change"));
check("conductor: sin nav Buscar", !$$(".app-nav button").some(b => b.textContent === "Buscar"));
$$(".app-nav button").find(b => b.textContent.includes("Ruta del día")).click();
check("conductor: ninguna superficie le ofrece ficha", !$("[data-ficha]"));

/* médico derivador externo */
sel.value = "medico-derivador";
sel.dispatchEvent(new window.Event("change"));
check("externo: su cola son sus postulaciones", $("#main h1").textContent.includes("Mis postulaciones"));
check("externo: 2 pendientes propios", $$(".work-item").length === 2);
$$(".app-nav button").find(b => b.textContent.includes("Nueva postulación")).click();
check("externo: datos mínimos declarados", $("#main").textContent.includes("Datos mínimos"));
check("externo: postular no transfiere responsabilidad", $("#main").textContent.includes("usted la conserva"));
$$(".action-bar .btn.primary")[0].click();
$("[data-confirm]").click();
check("externo: recibo con ID nuevo y orden justo", $(".outcome-receipt").textContent.includes("HOD-2026-0143"));
$("[data-back]").click();
$$("[data-open]")[0].click(); // interim-marta
check("externo: cuidado interino con reevaluación", $("#main").textContent.includes("Cuidado interino") && $("#main").textContent.includes("18-08-2026"));

/* preparar mañana desde la Sala */
sel.value = "enfermera-coordinadora";
sel.dispatchEvent(new window.Event("change"));
$$(".app-nav button").find(b => b.textContent.includes("Sala de Mando")).click();
check("sala: enlace a preparar mañana", !!$('[data-goto="manana"]'));
$('[data-goto="manana"]').click();
check("mañana: necesidades por paciente", $("#main").textContent.includes("Necesidades de mañana") && $("#main").textContent.includes("Jorge M."));
check("mañana: capacidad con brecha declarada", $("#main").textContent.includes("SIN TITULAR"));
check("mañana: conflicto visible antes de publicar", $("#main").textContent.includes("Trabajo social sin titular"));
check("mañana: mapa de circuitos borrador", !!$("svg.hd-map"));
$("[data-manana-publish]").click();
$("[data-confirm-manana]").click();
check("mañana: publicar deja asignaciones por aceptar", $(".outcome-receipt").textContent.includes("acepta"));

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
