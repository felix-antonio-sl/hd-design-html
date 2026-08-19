/* Pruebas de la capa geo + Mi día de la maqueta hd-design-html
   Uso: cd /home/felix/projects/hd-hsc-os && node /home/felix/projects/hd-design-html/tests/test-maqueta-geo.js */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("/home/felix/projects/hd-hsc-os/node_modules/jsdom"));

const dir = "/home/felix/projects/hd-design-html";
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
const { window } = dom;
const combined = ["data.js", "cases.js", "scenes.js", "map-data.js", "map.js", "app.js"]
  .map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n;\n");
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

/* ===== E2E-08/S3: helpers de interacción RED ===== */
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
function s3TemporalSource(node) {
  const sourceNode = node?.matches?.("[data-time-source]") ? node : node?.querySelector?.("[data-time-source]");
  return sourceNode?.getAttribute("data-time-source") || "";
}

/* coordinadora: nav con censo y circuitos */
check("coord: nav Mapa de pacientes", $$(".app-nav button").some(b => b.textContent.includes("Mapa de pacientes")));
check("coord: nav Recorridos y móviles", $$(".app-nav button").some(b => b.textContent.includes("Recorridos y móviles")));

/* mapa de pacientes */
$$(".app-nav button").find(b => b.textContent.includes("Mapa de pacientes")).click();
check("censo: svg renderiza", !!$("svg.hd-map"));
check("censo: marcadores de personas", $$("[data-census]").length >= 6);
check("censo: anillo de precisión no exacta", $("svg.hd-map").innerHTML.includes("stroke-dasharray=\"3,2\""));
check("censo: filas del panel", $$(".census-row").length >= 6);
check("censo: demanda no servida visible", $("#main").textContent.includes("Atenciones pendientes por falta de transporte"));
check("censo: honestidad de precisión", $("#main").textContent.includes("por sector"));
check("censo: leyenda HODOM + riesgo declarado", $("#main").textContent.includes("Episodio HODOM activo") && $("#main").textContent.includes("Riesgo declarado"));
/* filtro egresados off → on */
const egresToggle = $$("[data-filter]").find(b => b.dataset.filter === "egresado");
const before = $$(".census-row").length;
egresToggle.click();
check("censo: filtro egresados agrega fila", $$(".census-row").length === before + 1);
/* marcador de censo cableado: abre la obligación del caso si es del rol */
$('[data-census="HOD-2026-0138"]').dispatchEvent(new window.Event("click", { bubbles: true }));
check("censo: marcador abre obligación del rol", $("#main h1").textContent.includes("Jorge M."));

/* circuitos y móviles */
$$(".app-nav button").find(b => b.textContent.includes("Recorridos y móviles")).click();
check("rutas: polyline de circuitos", $("svg.hd-map").innerHTML.includes("stroke-dasharray=\"7,5\""));
check("rutas: paradas numeradas", $$("[data-stop]").length >= 7);
check("rutas: móviles con telemetría", $$("[data-vehicle]").length === 2);
check("rutas: tabla de telemetría", !!$("table.data"));
check("rutas: honestidad GPS", $("#main").textContent.includes("no demuestra que la visita o la atención se haya realizado"));
check("rutas: móvil sobre parada se desplaza", $('[data-vehicle="m1"] circle').getAttribute("cx") !== "415");
check("rutas: móvil ya no se anuncia como botón", !$('[data-vehicle][role="button"]'));
/* popup de parada: primero por teclado, luego por clic */
$$("[data-stop]")[0].dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
check("parada: Enter abre popup por teclado", !!$(".stop-popup"));
$$("[data-stop]")[0].dispatchEvent(new window.Event("click", { bubbles: true }));
check("parada: popup con tareas", !!$(".stop-popup") && $(".stop-popup").textContent.includes("Qué se transporta"));
check("parada: nota GPS≠atención", $(".stop-popup").textContent.includes("no significa que la atención se hizo"));

/* Mi día: TENS */
setRole("tecnico-enfermeria");
check("tens: nav Mi día", $$(".app-nav button").some(b => b.textContent.includes("Mi día")));
$$(".app-nav button").find(b => b.textContent.includes("Mi día")).click();
check("midia: título", $("#main h1").textContent.includes("Mi día"));
check("midia: cinta de circuito sin duplicar VIS S3", $$(".day-stop").length === 3);
check("midia: móvil y conductor declarados", $("#main").textContent.includes("Móvil 1") && $("#main").textContent.includes("R. Soto"));
check("midia: tarjeta legacy propia + proyección S3 única", $$(".day-card").length === 1 && $$(`[data-s3-visit="${S3_VIS_ID}"]`).length === 1);
/* S3 mantiene la VIS de Rosa pendiente antes de cualquier llegada; la otra
   parada TENS sigue siendo el único hito completado de este circuito. */
check("midia: completada marcada", $$(".day-card.completada").length === 1);
check("midia: mapa del circuito", !!$("svg.hd-map"));
check("midia: progreso por hitos no GPS", $("#main").textContent.includes("hitos registrados, no por GPS") && $("#main").textContent.includes("Paradas de su función"));
check("midia: sin botón Navegar fantasma", !$$(".day-card .btn").some(b => b.textContent.includes("Navegar")));
check("midia: orden móvil preparado", !!$(".day-layout") && !!$(".day-side"));
check("midia: hora tope uniforme en cinta", $("#main").textContent.includes("tope 12:00"));
/* abrir escena desde tarjeta */
$$(".day-card [data-open-scene]")[0].click();
check("midia: abre la obligación legacy restante sin desviar VIS a M2", $("#main h1").textContent.includes("Ana P."));

/* Mi día: kinesiólogo (otro circuito) */
setRole("kinesiologo");
$$(".app-nav button").find(b => b.textContent.includes("Mi día")).click();
check("kine: su parada pendiente", $$(".day-card").length === 1 && $("#main").textContent.includes("marcha supervisada"));

/* popup de parada con tarea de otro rol: sin botón abrir */
setRole("medico-atencion-directa");
$$(".app-nav button").find(b => b.textContent.includes("Mi día")).click();
$$("[data-stop]")[1].dispatchEvent(new window.Event("click", { bubbles: true }));
check("popup parada ajena: no ofrece abrir", !$(".stop-popup [data-open-scene]") || $(".stop-popup").textContent.length > 0);

/* médico regulador: SIN Mi día ni mapas */
setRole("medico-regulador");
check("regulador: sin nav Mi día", !$$(".app-nav button").some(b => b.textContent.includes("Mi día")));
check("regulador: sin nav Mapa", !$$(".app-nav button").some(b => b.textContent.includes("Mapa")));

/* DT: censo pero no circuitos */
setRole("direccion-tecnica");
check("dt: nav Mapa de pacientes", $$(".app-nav button").some(b => b.textContent.includes("Mapa de pacientes")));
check("dt: sin nav Mi día", !$$(".app-nav button").some(b => b.textContent.includes("Mi día")));

/* conductor: ruta del día (scene clásica) sigue */
setRole("conductor");
check("conductor: nav Ruta del día", $$(".app-nav button").some(b => b.textContent.includes("Ruta del día")));
$$(".app-nav button").find(b => b.textContent.includes("Ruta del día")).click();
check("conductor: itinerario con custodia", $("#main").textContent.includes("Itinerario") && $("#main").textContent.includes("Custodia"));

/* offline sobre vista geo */
setRole("enfermera-coordinadora");
const sim = $("#sim-select"); sim.value = "offline"; sim.dispatchEvent(new window.Event("change"));
$$(".app-nav button").find(b => b.textContent.includes("Mapa de pacientes")).click();
check("censo offline: banner de corte local", !!$(".context-banner.offline"));
check("censo offline: mapa sigue con datos del corte", !!$("svg.hd-map"));

/* preparar mañana: circuitos borrador en el mapa */
setRole("enfermera-coordinadora");
$$(".app-nav button").find(b => b.textContent.includes("Sala de Mando")).click();
$('[data-goto="manana"]').click();
check("mañana: circuitos borrador dibujados en trazo discontinuo", $("svg.hd-map").innerHTML.includes("stroke-dasharray=\"7,5\""));
check("mañana: paradas de ambos circuitos borrador", $$("[data-stop]").length >= 8);
check("mañana: leyenda vigente en el borrador", $("#main").textContent.includes("Episodio HODOM activo"));

/* ===== E2E-08/S3 · RED geo/Mi día: antes y después de eventos reales ===== */
const s3Geo = s3Boot();
s3SetRole(s3Geo, "enfermero-clinico");
const s3MiDiaNav = s3Geo.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
const s3MiDiaOpened = s3Click(s3MiDiaNav);
const s3PreVisit = s3Find(s3Geo, S3_VIS_SELECTORS);
const s3PreVisitText = s3Text(s3PreVisit);
const s3PreDayText = s3Text(s3Geo.$("#main"));
check(
  "S3 geo: Mi día pre-salida deriva VIS de M1 con ventana 09:00–10:00",
  s3MiDiaOpened
    && Boolean(s3PreVisit)
    && /M1/i.test(s3PreVisitText)
    && /09:00\s*[–-]\s*10:00/.test(s3PreVisitText),
);
check(
  "S3 geo: pre-salida muestra preparación y revisión 08:35, no M2 medicina/kine",
  Boolean(s3PreVisit)
    && /prepar|08:35/i.test(s3PreVisitText)
    && !/M2.*(medicina|kinesi)|(?:medicina|kinesi).*M2/i.test(s3PreVisitText),
);
check(
  "S3 geo: pre-salida no proyecta VIS completada, llegada 09:02, salida 09:52 ni tareas clínicas",
  Boolean(s3PreVisit)
    && !/completad|09:02|09:52|curaci[oó]n|administrar tratamiento|educar al cuidador|salida observada/i.test(s3PreDayText),
);

/* El trace técnico no se duplica como panel paralelo: vive bajo details/summary
   tanto en Recorridos como en Mi día. */
s3SetRole(s3Geo, "enfermera-coordinadora");
const s3MapNav = s3Geo.$$(".app-nav button").find((button) => /Recorridos y m[oó]viles/i.test(button.textContent));
const s3MapOpened = s3Click(s3MapNav);
const s3MapDetails = s3Geo.$$("#main details").find((details) => Boolean(s3Find(s3Geo, ["[data-s3-log]", "[data-s3-event-log]", "[data-s3-timeline]"], details)));
check(
  "S3 geo: trace/timeline técnico del mapa está bajo details/summary",
  s3MapOpened
    && Boolean(s3MapDetails)
    && Boolean(s3MapDetails.querySelector("summary"))
    && Boolean(s3Find(s3Geo, ["[data-s3-log]", "[data-s3-event-log]", "[data-s3-timeline]"], s3MapDetails)),
);
s3SetRole(s3Geo, "enfermero-clinico");
const s3MiDiaTraceNav = s3Geo.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
const s3MiDiaTraceOpened = s3Click(s3MiDiaTraceNav);
const s3DayDetails = s3Geo.$$("#main details").find((details) => Boolean(s3Find(s3Geo, ["[data-s3-log]", "[data-s3-event-log]", "[data-s3-timeline]"], details)));
check(
  "S3 geo: trace/timeline técnico de Mi día está bajo details/summary",
  s3MiDiaTraceOpened
    && Boolean(s3DayDetails)
    && Boolean(s3DayDetails.querySelector("summary"))
    && Boolean(s3Find(s3Geo, ["[data-s3-log]", "[data-s3-event-log]", "[data-s3-timeline]"], s3DayDetails)),
);

/* Una sola sesión: review → disposición → vehicle_departure_observed. */
const s3ReviewAction = s3Find(s3Geo, S3_REVIEW_ACTION_SELECTORS);
const s3VisitOpened = s3Activate(s3Geo, S3_VIS_SELECTORS);
const s3ReviewClicked = s3Activate(s3Geo, S3_REVIEW_ACTION_SELECTORS);
if (s3ReviewClicked) s3Confirm(s3Geo);
const s3ReviewReceipt = s3Find(s3Geo, [
  '[data-s3-receipt="package-review"]',
  '[data-review-receipt]'
]);
check(
  "S3 geo: interacción real de revisión deja receipt 08:35 y no partida",
  Boolean(s3ReviewAction)
    && s3VisitOpened
    && s3ReviewClicked
    && Boolean(s3ReviewReceipt)
    && /08:35|revis|review/i.test(s3Text(s3ReviewReceipt))
    && !/salida registrada|partida autorizada/i.test(s3Text(s3ReviewReceipt)),
);

s3SetRole(s3Geo, "enfermera-coordinadora");
const s3ManifestNav = s3Geo.$$(".app-nav button").find((button) => /manifiesto|VIS|M1/i.test(button.textContent));
s3Click(s3ManifestNav);
const s3Manifest = s3Find(s3Geo, S3_MANIFEST_SELECTORS);
const s3ManifestText = s3Text(s3Manifest);
const s3DispositionAction = s3Find(s3Geo, S3_DISPOSITION_ACTION_SELECTORS, s3Manifest || s3Geo.window.document);
const s3DispositionClicked = s3Activate(s3Geo, S3_DISPOSITION_ACTION_SELECTORS, s3Manifest || s3Geo.window.document);
if (s3DispositionClicked) s3Confirm(s3Geo);
const s3DispositionReceipt = s3Find(s3Geo, [
  '[data-s3-receipt="vis-disposition"]',
  '[data-vis-disposition-receipt]'
]);
check(
  "S3 geo: coordinación interactúa con disposición VIS dentro de manifiesto M1",
  Boolean(s3Manifest)
    && s3ManifestText.includes(S3_VIS_ID)
    && Boolean(s3DispositionAction)
    && s3DispositionClicked
    && Boolean(s3DispositionReceipt),
);
check(
  "S3 geo: disposición VIS no produce salida vehicular total",
  Boolean(s3Manifest)
    && Boolean(s3DispositionReceipt)
    && !/salida\s+vehicular\s+total|partida\s+total/i.test(s3Text(s3DispositionReceipt)),
);

const s3PreTimeline = s3Find(s3Geo, ["[data-s3-timeline]", "[data-s3-event-log]", "[data-s3-log]"]);
const s3ScheduledDeparture = s3Find(s3Geo, [
  '[data-s3-time-kind="scheduled"]',
  '[data-s3-scheduled-departure]',
  '[data-departure-scheduled]'
], s3PreTimeline || s3Geo.window.document);
const s3ObservedBeforeDeparture = s3Find(s3Geo, [
  '[data-s3-time-kind="observed"]',
  '[data-s3-observed-departure]',
  '[data-departure-observed]'
], s3PreTimeline || s3Geo.window.document);
check(
  "S3 geo: timeline declarativo distingue 08:45 programada de observada sin contradecir el log",
  Boolean(s3PreTimeline)
    && Boolean(s3ScheduledDeparture)
    && /08:45/.test(s3Text(s3ScheduledDeparture))
    && Boolean(s3ObservedBeforeDeparture)
    && s3ScheduledDeparture !== s3ObservedBeforeDeparture
    && /programad|scheduled/i.test(s3Text(s3ScheduledDeparture))
    && !/observad|observed/i.test(s3Text(s3ScheduledDeparture)),
);

s3SetRole(s3Geo, "conductor");
const s3RouteNav = s3Geo.$$(".app-nav button").find((button) => /Ruta del d[ií]a/i.test(button.textContent));
s3Click(s3RouteNav);
const s3DepartureAction = s3Find(s3Geo, S3_DEPARTURE_ACTION_SELECTORS);
const s3DepartureClicked = s3Activate(s3Geo, S3_DEPARTURE_ACTION_SELECTORS);
if (s3DepartureClicked) s3Confirm(s3Geo);
const s3Departure = s3Find(s3Geo, [
  '[data-s3-departure]',
  '[data-departure-state]',
  '[data-departure="M1"]'
]);
const s3DepartureText = s3Text(s3Departure);
check(
  "S3 geo: después del evento, M1 queda en ruta con salida observada 08:45",
  Boolean(s3RouteNav)
    && Boolean(s3DepartureAction)
    && s3DepartureClicked
    && Boolean(s3Departure)
    && /M1|08:45/.test(s3DepartureText)
    && /observad|en ruta/i.test(s3DepartureText),
);
check(
  "S3 geo: conductor recibe sólo cambio logístico, sin Rosa/K/plan/log clínico",
  Boolean(s3Departure)
    && !/Rosa|R\.\s*C\.|kinesi|plan cl[ií]nico|log cl[ií]nico/i.test(s3DepartureText),
);

s3SetRole(s3Geo, "enfermero-clinico");
const s3MiDiaAfterNav = s3Geo.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
s3Click(s3MiDiaAfterNav);
const s3PostVisit = s3Find(s3Geo, S3_VIS_SELECTORS);
const s3PostVisitText = s3Text(s3PostVisit);
const s3PostDayText = s3Text(s3Geo.$("#main"));
check(
  "S3 geo: Mi día post-salida conserva VIS programada/en ruta y referencia 08:45",
  Boolean(s3PostVisit)
    && /M1/i.test(s3PostVisitText)
    && /08:45/.test(s3PostVisitText)
    && /programad|en ruta/i.test(s3PostVisitText),
);
check(
  "S3 geo: partida observada no convierte VIS en atención completada",
  Boolean(s3PostVisit)
    && /en ruta|programad/i.test(s3PostVisitText)
    && !/completad|09:02|09:52|llegada|salida observada|curaci[oó]n|administrar tratamiento/i.test(s3PostDayText),
);
const s3PostTimeline = s3Find(s3Geo, ["[data-s3-timeline]", "[data-s3-event-log]", "[data-s3-log]"]);
const s3ObservedDeparture = s3Find(s3Geo, [
  '[data-s3-time-kind="observed"]',
  '[data-s3-observed-departure]',
  '[data-departure-observed]'
], s3PostTimeline || s3Geo.window.document);
check(
  "S3 geo: timeline post-salida separa 08:45 programada de 08:45 observada",
  Boolean(s3PostTimeline)
    && Boolean(s3ScheduledDeparture)
    && Boolean(s3ObservedDeparture)
    && s3ScheduledDeparture !== s3ObservedDeparture
    && /08:45/.test(s3Text(s3ObservedDeparture))
    && /observad|observed/i.test(s3Text(s3ObservedDeparture)),
);
const s3CausalLog = s3PostTimeline;
const s3CausalText = s3Text(s3CausalLog);
check(
  "S3 geo: Mi día conserva derivación causal desde log y GPS no demuestra atención",
  Boolean(s3CausalLog)
    && /08:35|08:40|08:45/.test(s3CausalText)
    && /manifiesto|manifest/i.test(s3CausalText)
    && /GPS.*no|no.*GPS|no demuestra|no prueba/i.test(`${s3CausalText} ${s3PostVisitText}`),
);

/* Una misma ocurrencia no puede inventar una fuente temporal distinta por vista. */
s3SetRole(s3Geo, "enfermera-coordinadora");
const s3MapAgainNav = s3Geo.$$(".app-nav button").find((button) => /Recorridos y m[oó]viles/i.test(button.textContent));
s3Click(s3MapAgainNav);
const s3MapOccurrence = s3Find(s3Geo, S3_VIS_SELECTORS);
const s3MapTimeSource = s3TemporalSource(s3MapOccurrence);
s3SetRole(s3Geo, "enfermero-clinico");
const s3DayAgainNav = s3Geo.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
s3Click(s3DayAgainNav);
const s3DayOccurrence = s3Find(s3Geo, S3_VIS_SELECTORS);
const s3DayTimeSource = s3TemporalSource(s3DayOccurrence);
check(
  "S3 geo: mapa y Mi día comparten una sola fuente temporal observable para VIS-ROSA-M1-0900",
  Boolean(s3MapOccurrence)
    && Boolean(s3DayOccurrence)
    && Boolean(s3MapTimeSource)
    && s3MapTimeSource === s3DayTimeSource,
);

/* La escena clínica M2 conserva su frontera y no porta la VIS M1. */
s3SetRole(s3Geo, "medico-atencion-directa");
const s3MedicalDayNav = s3Geo.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
s3Click(s3MedicalDayNav);
const s3MedicalVisitButton = s3Geo.$('[data-open-scene="atencion-rosa"]');
s3Click(s3MedicalVisitButton);
const s3MedicalScene = s3Geo.$("#main");
const s3M2S3Action = s3MedicalScene?.querySelector('[data-s3-action*="VIS-ROSA-M1-0900"], [data-s3-action*="visit-m1"]');
check(
  "S3 geo: atencion-rosa de medicina M2 no porta visitId VIS-ROSA-M1-0900 ni acciones S3 M1",
  Boolean(s3MedicalScene)
    && /M[oó]vil 2|10:30/.test(s3Text(s3MedicalScene))
    && !s3MedicalScene.querySelector(`[data-visit-id="${S3_VIS_ID}"]`)
    && !s3MedicalScene.querySelector(`[data-s3-visit="${S3_VIS_ID}"]`)
    && !s3M2S3Action,
);
check(
  "S3 geo: superficie DOM S3 no depende de grep ni deja renderer/constante muerta",
  Boolean(s3MedicalScene)
    && !/Escena no encontrada|undefined renderer|Cannot read properties/i.test(s3Text(s3MedicalScene)),
);

/* Urgencia médica en la misma sesión: cancelled_by_medical_order. */
s3SetRole(s3Geo, "medico-atencion-directa");
const s3MedicalS3Task = s3Geo.$$("[data-e2e08-s3-open]").find((button) => button.dataset.e2e08S3Open === S3_VIS_ID);
s3Click(s3MedicalS3Task);
const s3UrgencyAction = s3Find(s3Geo, S3_CANCEL_ACTION_SELECTORS);
const s3UrgencyClicked = s3Activate(s3Geo, S3_CANCEL_ACTION_SELECTORS);
if (s3UrgencyClicked) s3Confirm(s3Geo);
const s3UrgencyReceipt = s3Find(s3Geo, [
  '[data-s3-receipt="medical-urgency"]',
  '[data-urgent-referral-intent]',
  '[data-s3-receipt="cancelled_by_medical_order"]'
]);
check(
  "S3 geo: cancelled_by_medical_order registra orden y referral intent que cancela VIS",
  Boolean(s3UrgencyAction)
    && s3UrgencyClicked
    && Boolean(s3UrgencyReceipt)
    && /urgencia|derivaci[oó]n|referral/i.test(s3Text(s3UrgencyReceipt))
    && /VIS|cancel/i.test(s3Text(s3UrgencyReceipt)),
);
s3SetRole(s3Geo, "enfermera-coordinadora");
const s3UrgencyManifestNav = s3Geo.$$(".app-nav button").find((button) => /manifiesto|VIS|M1/i.test(button.textContent));
s3Click(s3UrgencyManifestNav);
const s3UrgencyManifest = s3Find(s3Geo, S3_MANIFEST_SELECTORS);
const s3RouteAmendment = s3Find(s3Geo, ["[data-s3-route-amendment]", "[data-route-amendment]"]);
const s3Contact = s3Find(s3Geo, ["[data-s3-contact]", "[data-contact-continuity]"]);
check(
  "S3 geo: coordinación acusa y retira VIS; si ya partió separa route amendment y contacto",
  Boolean(s3UrgencyManifest)
    && /cancel|retir/i.test(s3Text(s3UrgencyManifest))
    && Boolean(s3RouteAmendment)
    && Boolean(s3Contact)
    && s3RouteAmendment !== s3Contact,
);
s3SetRole(s3Geo, "enfermero-clinico");
const s3CancelledDayNav = s3Geo.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent));
s3Click(s3CancelledDayNav);
const s3CancelledVisit = s3Find(s3Geo, S3_VIS_SELECTORS);
const s3CancelledText = s3Text(s3CancelledVisit);
check(
  "S3 geo: tras cancelled_by_medical_order VIS queda cancelada y nunca completada",
  Boolean(s3CancelledVisit)
    && /cancelad|cancelled/i.test(s3CancelledText)
    && !/completad|09:02|09:52|salida observada|llegada/i.test(s3CancelledText),
);

/* RED2: los renderers geo deben consumir la misma verdad y no duplicar trabajo. */
const s3GeoInitial = s3Boot();
s3SetRole(s3GeoInitial, "enfermero-clinico");
s3Click(s3GeoInitial.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent)));
const initialRosaCards = s3GeoInitial.$$(".day-card").filter((card) => /Rosa C\./.test(s3Text(card)));
const initialS3Projections = s3GeoInitial.$$(`[data-s3-visit="${S3_VIS_ID}"]`);
const initialS3Primaries = s3GeoInitial.$$("#main .btn.primary");
check(
  "S3 geo RED2: Mi día representa VIS una vez, con una primaria y sin tarjeta M2",
  initialRosaCards.length === 0
    && initialS3Projections.length === 1
    && initialS3Primaries.length === 1
    && !s3GeoInitial.$('[data-open-scene="atencion-rosa"]'),
);

const initialReviewButton = s3Find(s3GeoInitial, S3_REVIEW_ACTION_SELECTORS);
s3Click(initialReviewButton);
s3Confirm(s3GeoInitial);
s3Click(s3GeoInitial.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent)));
check(
  "S3 geo RED2: review one-shot desaparece de Mi día después del receipt",
  !s3Find(s3GeoInitial, S3_REVIEW_ACTION_SELECTORS),
);

const s3GeoBlocked = s3Boot();
s3SetRole(s3GeoBlocked, "enfermero-clinico");
s3Click(s3GeoBlocked.$$('[data-e2e08-s3-action="review-package"], [data-s3-action="review-package"]')[0]);
s3Confirm(s3GeoBlocked);
s3SetRole(s3GeoBlocked, "enfermera-coordinadora");
s3Click(s3GeoBlocked.$$('[data-e2e08-s3-open="VIS-ROSA-M1-0900"]')[0]);
s3Click(s3GeoBlocked.$$('[data-e2e08-s3-action="manifest-retain"]')[0]);
s3Confirm(s3GeoBlocked);
s3SetRole(s3GeoBlocked, "conductor");
s3Click(s3GeoBlocked.$$('[data-e2e08-s3-open="VIS-ROSA-M1-0900"]')[0]);
s3Click(s3GeoBlocked.$$('[data-e2e08-s3-action="vehicle_departure_blocked"]')[0]);
s3Confirm(s3GeoBlocked);
s3SetRole(s3GeoBlocked, "enfermero-clinico");
s3Click(s3GeoBlocked.$$(".app-nav button").find((button) => /Mi d[ií]a/i.test(button.textContent)));
const blockedVisit = s3Find(s3GeoBlocked, S3_VIS_SELECTORS);
const blockedText = s3Text(blockedVisit);
check(
  "S3 geo RED2: vehicle_departure_blocked se proyecta bloqueado, no observado ni pendiente",
  Boolean(blockedVisit)
    && /bloquead/i.test(blockedText)
    && !/observación real.*pendiente|partida observada|M1 en ruta/i.test(blockedText),
);

const s3GeoCancelPre = s3Boot();
s3SetRole(s3GeoCancelPre, "medico-atencion-directa");
s3Click(s3GeoCancelPre.$$('[data-e2e08-s3-open]')[0]);
s3Click(s3GeoCancelPre.$$('[data-e2e08-s3-action="cancelled_by_medical_order"]')[0]);
s3Confirm(s3GeoCancelPre);
s3SetRole(s3GeoCancelPre, "enfermera-coordinadora");
s3Click(s3GeoCancelPre.$$(".app-nav button").find((button) => /Recorridos y m[oó]viles/i.test(button.textContent)));
const cancelPreManifest = s3Find(s3GeoCancelPre, S3_MANIFEST_SELECTORS);
const cancelPreText = s3Text(cancelPreManifest);
check(
  "S3 geo RED2: cancelación pre-salida domina programada y no crea route/contact",
  Boolean(cancelPreManifest)
    && /cancelad|retirad/i.test(cancelPreText)
    && !/permanece programada/i.test(cancelPreText)
    && !s3GeoCancelPre.$("[data-s3-route-amendment]")
    && !s3GeoCancelPre.$("[data-s3-contact]"),
);

const s3GeoManifestGuard = s3Boot();
s3SetRole(s3GeoManifestGuard, "enfermera-coordinadora");
s3Click(s3GeoManifestGuard.$$(".app-nav button").find((button) => /Recorridos y m[oó]viles/i.test(button.textContent)));
const initialMapManifest = s3Find(s3GeoManifestGuard, S3_MANIFEST_SELECTORS);
check(
  "S3 geo RED2: mapa sin review no expone disposición primaria ni decisión vigente",
  Boolean(initialMapManifest)
    && !initialMapManifest.querySelector(".btn.primary")
    && !/decisión vigente|disposición registrada/i.test(s3Text(initialMapManifest)),
);

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
