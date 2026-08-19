/* Prueba de la pasada UX 2026-08-18 (anticipación y golpe de vista) sobre
   la maqueta hd-design-html con jsdom.
   Uso: cd /home/felix/projects/hd-hsc-os && node /home/felix/projects/hd-design-html/tests/test-maqueta-ux.js */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
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

/* ===== sustracción del shell y la cola: una señal por decisión ===== */
setRole("enfermera-coordinadora");
check("shell: no repite el alcance del rol", !$(".scope-chip"));
check("shell: no repite el aviso de maqueta en un footer", !$(".footer-note"));
check("cola: no usa un subtítulo genérico", !$(".view-subtitle"));
check("ahora: conserva conteo y prioridad sin repetir el cue", $(".ahora-line").textContent.includes("4 tareas pendientes") && $(".ahora-line").textContent.includes("Empiece por la más urgente") && !$(".ahora-line").textContent.includes("El equipo espera el programa"));
check("héroe: primer ítem marcado por composición", $$(".work-item")[0].classList.contains("hero"));
check("héroe: sin instrucción redundante «Empiece aquí»", $$(".hero-ribbon").length === 0);
check("héroe: cue visible con el porqué-ahora", $$(".work-item")[0].textContent.includes("El equipo espera el programa para salir a las 08:45"));
check("ítem: primera capa conserva necesidad y responsable", !!$$(".work-item")[0].querySelector(".wi-need"));
check("ítem: procedencia sale de la cola", !$$(".work-item")[0].querySelector(".wi-prov") && !$$(".work-item")[0].textContent.includes("Versión") && !$$(".work-item")[0].textContent.includes("Origen:"));

/* Recorridos es gobierno, no navegación operacional ordinaria */
setRole("tecnico-enfermeria");
check("navegación operativa: TENS no ve Recorridos", !$$("[data-nav]").some(b => b.textContent.includes("Recorridos")));
setRole("direccion-tecnica");
check("navegación de gobierno: DT conserva Recorridos", $$("[data-nav]").some(b => b.textContent.includes("Recorridos")));
setRole("enfermera-coordinadora");

/* ahora por rol: lenguaje propio */
setRole("medico-derivador");
check("ahora externo: «postulaciones» y orientación breve", $(".ahora-line").textContent.includes("2 postulaciones en su cola") && $(".ahora-line").textContent.includes("Empiece por la primera"));
setRole("paciente");
check("ahora paciente: lenguaje propio sin repetir la tarea", $(".ahora-line").textContent.includes("3 cosas de su atención de hoy") && $(".ahora-line").textContent.includes("Empiece por lo principal"));

/* trabajo único: se anuncia y espera decisión humana; no conduce solo */
setRole("fonoaudiologo");
check("work_one: sin héroe cuando hay una sola", !$$(".work-item.hero").length && !$(".ahora-line"));
check("work_one: anuncia la única tarea", $("#main").textContent.includes("Esta es su única tarea pendiente"));
check("work_one: no promete navegación automática", !$("#main").textContent.includes("Le llevamos directo") && !$("#main").textContent.includes("1,5 s"));

/* acciones informativas inocuas: un clic y recibo, sin liturgia */
setRole("paciente");
$$("[data-open]")[0].click();
$("[data-act=\"pa-entendido\"]").click();
check("paciente: Entendido registra directo", !!$(".outcome-receipt") && !$(".confirm-strip"));
check("paciente: recibo usa lenguaje natural", !!$(".outcome-receipt") && $(".outcome-receipt").textContent.toLowerCase().includes("el equipo sabe que tiene el panorama de hoy"));
setRole("cuidador");
$$("[data-open]")[0].click();
$("[data-act=\"cu-tarjeta\"]").click();
check("cuidador: tarjeta a la vista registra directo", !!$(".outcome-receipt") && !$(".confirm-strip"));

/* ===== escena: el contexto no se repite como subtítulo ===== */
setRole("enfermera-coordinadora");
$$("[data-open]")[1].click(); // handoff-jorge
check("escena: sin subtítulo duplicado de la tarjeta", !$("#main .view-subtitle"));

/* ===== A3/A4: riesgo y acción primero, gobierno bajo demanda ===== */
setRole("laboratorio");
$$("[data-open]")[0].click();
$("[data-e2e08-action=\"communicate-success\"]").click();
$("[data-confirm]").click();
setRole("medico-atencion-directa");
$$("[data-open]")[0].click(); // resultado crítico de potasio
const criticalAlert = $(".alert.A4");
const criticalPrimary = $(".critical-action-bar .btn.primary");
const firstDetailBlock = $(".scene-support");
check("A4: resumen crítico visible antes del detalle", !!criticalAlert && !!$(".alert-summary") && !!firstDetailBlock && Boolean(criticalAlert.compareDocumentPosition(firstDetailBlock) & window.Node.DOCUMENT_POSITION_FOLLOWING));
check("A4: acción primaria aparece antes del soporte", !!criticalPrimary && !!firstDetailBlock && Boolean(criticalPrimary.compareDocumentPosition(firstDetailBlock) & window.Node.DOCUMENT_POSITION_FOLLOWING));
check("A4: gobierno disponible por progressive disclosure", !!$("details.alert-governance") && !$("details.alert-governance").open && $("details.alert-governance").textContent.includes("Respaldo"));
check("A4: resumen evita Gravedad y Vence duplicados", !!$(".alert-summary") && !$(".alert-summary").textContent.includes("Gravedad") && !$(".alert-summary").textContent.includes("Vence"));
check("A4: una sola primaria en la escena", $$(".btn.primary").filter(b => b.closest("#main")).length === 1);

/* ===== recibo con continuación anticipada ===== */
setRole("medico-atencion-directa");
$$("[data-open]")[0].click(); // alerta-potasio (A4)
$$(".action-bar .btn.primary")[0].click();
$("[data-confirm]").click();
check("recibo: siguiente tarea ofrecida", !!$(".next-strip") && $(".next-strip").textContent.includes("Siguiente:"));
check("recibo: la siguiente es la visita de Rosa C.", $(".next-strip").textContent.includes("Visita programada a Rosa C."));
$("[data-open-next]").click();
check("continuación: abre la siguiente tarea directo", $("#main h1").textContent.includes("Atención — Rosa C."));

/* última tarea completada: sin strip */
setRole("fonoaudiologo");
$("[data-open]").click();
$$(".action-bar .btn.primary")[0].click();
$("[data-confirm]").click();
check("sin siguiente: no hay strip al agotar la cola", !$(".next-strip"));

/* ===== Mi día: próxima parada ===== */
setRole("kinesiologo");
$$(".app-nav button").find(b => b.textContent.includes("Mi día")).click();
check("midía: badge «Su próxima parada»", !!$(".next-badge") && $(".next-badge").textContent.includes("Su próxima parada"));
check("midía: la parada marcada es la pendiente", $(".day-card.pendiente .next-badge") !== null);
check("midía: cinta marca la próxima", !!$(".day-stop.next"));
setRole("tecnico-enfermeria");
$$(".app-nav button").find(b => b.textContent.includes("Mi día")).click();
check(
  "midía: TENS conserva VIS-ROSA-M1-0900 como próxima parada pendiente",
  !!$('[data-s3-visit="VIS-ROSA-M1-0900"] .next-badge')
    && $('[data-s3-visit="VIS-ROSA-M1-0900"]').textContent.includes("Rosa C.")
);

/* ===== ficha: tarea del rol sobre el caso ===== */
setRole("medico-atencion-directa");
$$("[data-open]")[0].click(); // atencion-rosa; la alerta crítica ya fue satisfecha
$("[data-ficha]").click();
check("ficha: strip de tarea pendiente sobre el caso", !!$(".case-task") && $(".case-task").textContent.includes("Usted tiene una tarea pendiente sobre este caso"));
$(".case-task [data-open-obl]").click();
check("ficha: el strip abre la obligación vigente del caso", $("#main h1").textContent.includes("Atención — Rosa C."));

/* ficha sin tarea del rol: sin strip (kinesiólogo en ficha de Luis A. vía búsqueda) */
setRole("kinesiologo");
$$(".app-nav button").find(b => b.textContent === "Buscar").click();
const q = $("#q"); q.value = "luis"; q.dispatchEvent(new window.Event("input"));
$$("#search-results [data-case-open]")[0].click();
check("ficha ajena: sin strip cuando no hay tarea del rol", !$(".case-task"));

/* ===== cues en roles de unidad de cuidado ===== */
setRole("cuidador");
check("cuidador: cue de la tarjeta visible en la cola", $$(".work-item")[0].textContent.includes("Téngala a la vista siempre"));

/* ===== unidad de cuidado: rótulos de cuidado, no de gestión ===== */
setRole("paciente");
check("paciente: «Cuándo» y «Quién responde» en vez de «Plazo» y «Responsable siguiente»",
  $$(".work-item")[0].textContent.includes("Cuándo:") && $$(".work-item")[0].textContent.includes("Quién responde:"));
check("paciente: sin Versión ni Origen en la tarjeta", !$$(".work-item")[0].textContent.includes("Versión") && !$$(".work-item")[0].textContent.includes("Origen:"));
check("paciente: contexto sin código de caso", $$(".work-item")[0].textContent.includes("Día 4 de su hospitalización en casa"));
check("paciente: línea ahora no duplica el título del héroe", !$(".ahora-line").textContent.includes("quién viene, quién responde y qué hacer si algo cambia"));
check("paciente: composición propia sin sidebar ni paleta", window.document.body.classList.contains("care-unit") && !$(".app-side") && !$(".app-nav"));
check("paciente: identidad habla de su cuidado, no del episodio", $(".identity").textContent.includes("Hospitalización en casa · Día 4") && !$(".identity").textContent.includes("HOD-"));
check("paciente: chips sin códigos A1/A2", $$(".work-item .risk").every(r => !/\bA[0-4]\b/.test(r.textContent)) && $$(".work-item .risk")[1].textContent.includes("Necesita su decisión"));
setRole("cuidador");
check("cuidador: composición de cuidado sin sidebar", window.document.body.classList.contains("care-unit") && !$(".app-side"));
setRole("enfermero-clinico");
check("equipo: cola conserva Plazo y Responsable siguiente, sin procedencia",
  $$(".work-item")[0].textContent.includes("Plazo:") && $$(".work-item")[0].textContent.includes("Responsable siguiente:") && !$$(".work-item")[0].textContent.includes("Versión") && !$$(".work-item")[0].textContent.includes("Origen:"));

/* ===== pasada estructural (IFML + Linear): sidebar, paleta, crumb, teclado ===== */
const doc = window.document;
setRole("enfermera-coordinadora");
check("side: secciones Trabajo y Vistas", $$(".side-sec-name").map(e => e.textContent).join("|").includes("Trabajo") && $$(".side-sec-name").map(e => e.textContent).join("|").includes("Vistas"));
check("side: badge con pendientes", $(".side-count") && $(".side-count").textContent === "4");
check("side: Tareas del día marcada como actual", !!$('.side-item[aria-current="page"]'));
check("side: trigger «Ir a…» presente", !!$("[data-pal-open]"));

/* paleta: apertura, grupos por rol, filtro DataFlow, Enter, Esc */
$("[data-pal-open]").click();
check("palette: dialog modal abierto", !!$('.palette[role="dialog"]'));
check("palette: grupos Vistas + Tareas pendientes (sin Casos para coordinadora con acceso)", $$(".pal-group-name").map(e => e.textContent).includes("Casos"));
setRole("medico-atencion-directa");
$("[data-pal-open]").click();
check("palette médico: tiene grupo Casos", $$(".pal-group-name").map(e => e.textContent).includes("Casos"));
const palInput = $("#pal-input");
palInput.value = "visita programada";
palInput.dispatchEvent(new window.Event("input"));
check("palette: filtro omite la crítica satisfecha y deja la visita vigente", $$(".pal-item").length === 1 && $(".pal-item").textContent.includes("Visita programada"));
$(".pal-item").click();
check("palette: Enter/click abre la escena vigente del caso", $("#main h1").textContent.includes("Atención — Rosa C."));
check("palette: cerrada tras elegir", !$(".palette"));

$("[data-pal-open]").click();
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
check("palette: Esc la cierra", !$(".palette"));

/* atajo Ctrl+K */
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
check("palette: Ctrl+K abre", !!$(".palette"));
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
check("palette: Ctrl+K de nuevo cierra", !$(".palette"));

/* conductor: sin grupo Casos (IA-RBP) */
setRole("conductor");
$("[data-pal-open]").click();
check("palette conductor: sin grupo Casos", !$$(".pal-group-name").map(e => e.textContent).includes("Casos"));
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

/* crumb superior (CN-UP) en escena y ficha */
setRole("enfermera-coordinadora");
$$("[data-open]")[1].click(); // handoff-jorge
check("crumb: visible al abrir escena", !!$(".crumb") && $(".crumb").textContent.includes("Tareas del día"));
$(".crumb").click();
check("crumb: vuelve a la cola", $$(".work-item").length === 4);
setRole("medico-atencion-directa");
$$("[data-open]")[1].click();
$("[data-ficha]").click();
check("crumb ficha: «Volver» presente", !!$(".crumb"));

/* flechas ↑↓ en la lista de trabajo */
setRole("enfermera-coordinadora");
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
check("teclado: ArrowDown enfoca la primera tarea", doc.activeElement === $$(".work-item")[0]);
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
check("teclado: segunda ArrowDown avanza", doc.activeElement === $$(".work-item")[1]);
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
check("teclado: ArrowUp retrocede", doc.activeElement === $$(".work-item")[0]);
doc.activeElement.click();
check("teclado: Enter nativo abre la escena", !!$("#main h1"));

/* ===== offline: cada tarea declara qué puede hacer; guardado ≠ enviado ===== */
setRole("enfermero-clinico");
const simOffline = $("#sim-select");
simOffline.value = "offline"; simOffline.dispatchEvent(new window.Event("change"));
check("offline: capacidad visible en cada tarea", $$(".offline-capability").length === 4);
const offlineLabels = $$(".offline-capability").map(e => e.textContent).join("|");
check("offline: distingue disponible, conexión y solo lectura", offlineLabels.includes("Disponible sin conexión") && offlineLabels.includes("Necesita conexión") && offlineLabels.includes("Solo lectura"));
$$("[data-open]")[0].click();
$(".btn.primary[data-act]").click();
$("[data-confirm]").click();
check("offline: recibo dice guardado local y pendiente", $(".recovery-panel h3").textContent.includes("Guardado en este equipo") && $(".recovery-panel h3").textContent.includes("pendiente de envío"));

/* ===== accesibilidad visual: targets de etapas y textos de cuidado ===== */
const css = fs.readFileSync(path.join(dir, "styles.css"), "utf8");
check("etapas J0–J10: target mínimo de 44px", /\.j-cell\s*\{[^}]*min-height:\s*44px/s.test(css));
check("unidad de cuidado: texto secundario conserva 16px", /\.care-unit[^{]*\{[^}]*--fs-support:\s*16px/s.test(css));
check("main: el foco programático no dibuja un marco azul alrededor de toda la vista", /\.app-main:focus\s*\{[^}]*outline:\s*none/s.test(css));

/* TDD focal: abrir la obligación S3 en un viewport móvil conserva a la
   identidad persistente y el título de la escena dentro del viewport. La
   mutación que este flujo atrapa es mantener la apertura con foco/scroll en
   el contenedor #main sin preservar la cabecera completa en pantalla.
   La mutación productiva del overflow es conservar el ancho intrínseco de
   #sim-select en la barra de maqueta, empujando el documento más allá del
   viewport móvil. En la cola S3, la mutación productiva equivalente es
   conservar `white-space: nowrap` en `.risk`, dejando fuera del viewport la
   etiqueta completa de severidad y tarea. */
function probeMobileS3(width, interaction = "click") {
  const playwright = "/home/felix/projects/hd-hsc-os/node_modules/playwright";
  const script = `
    const { chromium } = require(${JSON.stringify(playwright)});
    (async () => {
      const browser = await chromium.launch({ headless: true });
      const pageErrors = [];
      try {
        const page = await browser.newPage({ viewport: { width: ${width}, height: 844 } });
        await page.addInitScript(() => {
          const nativeFocus = HTMLElement.prototype.focus;
          window.__focusEvents = [];
          HTMLElement.prototype.focus = function (...args) {
            if (this.matches?.("#main h1")) {
              window.__focusEvents.push({ tag: this.tagName, tabindex: this.getAttribute("tabindex") });
            }
            return nativeFocus.apply(this, args);
          };
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto("file:///home/felix/projects/hd-design-html/index.html");
        await page.selectOption("#role-select", "enfermero-clinico");
        await page.locator('.mk-device[data-device="mobile"]').click();
        await page.evaluate(() => {
          window.__focusEvents = [];
          window.__transitionCount = 0;
          const app = document.querySelector("#app");
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              for (const node of record.addedNodes) {
                if (node.nodeType === 1 && node.querySelector?.("#main")) window.__transitionCount += 1;
              }
            }
          });
          observer.observe(app, { childList: true });
          window.__transitionObserver = observer;
        });
        const s3 = page.locator('[data-e2e08-s3-open]').first();
        if (await s3.count() !== 1) throw new Error("No se encontró la obligación S3 en la cola");
        const queueControl = {
          visible: await s3.isVisible(),
          enabled: await s3.isEnabled(),
        };
        if (!queueControl.visible || !queueControl.enabled) {
          throw new Error("La obligación S3 no tiene un control de apertura utilizable");
        }
        const queueLayout = await page.evaluate(() => {
          const rect = (node) => node?.getBoundingClientRect().toJSON() || null;
          const risks = [...document.querySelectorAll(".work-item .risk")].map((node) => {
            const text = node.textContent.trim().replace(/\\s+/g, " ");
            const [severity = "", ...taskParts] = text.split("·");
            const task = taskParts.join("·").trim();
            const box = rect(node);
            return {
              text,
              severity: /^A[0-4]$/.test(severity.trim()),
              task: task.length > 0,
              complete: Boolean(box && box.left >= 0 && box.right <= window.innerWidth
                && node.scrollWidth <= node.clientWidth),
              rect: box,
            };
          });
          return {
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
            riskCount: risks.length,
            risks,
            labelsPreserved: risks.length > 0 && risks.every((risk) => risk.severity && risk.task),
            risksFit: risks.length > 0 && risks.every((risk) => risk.complete),
          };
        });
        if (${JSON.stringify(interaction)} === "enter") {
          await s3.focus();
          await s3.press("Enter");
        } else {
          await s3.click();
        }
        await page.locator("#main h1").waitFor();
        await page.waitForTimeout(10);
        const focusState = await page.evaluate(() => {
          const title = document.querySelector("#main h1");
          const active = document.activeElement;
          return {
            activeIsTitle: active === title,
            activeTag: active?.tagName || null,
            activeTabIndex: active?.getAttribute("tabindex") || null,
            titleTabIndex: title?.getAttribute("tabindex") || null,
            focusDeliveries: window.__focusEvents.length,
            transitionCount: window.__transitionCount,
          };
        });
        await page.keyboard.press("Shift+Tab");
        await page.waitForTimeout(10);
        const shiftTabToBreadcrumb = await page.evaluate(() => Boolean(document.activeElement?.matches("#main [data-back]")));
        const result = await page.evaluate(() => {
          const rect = (node) => node?.getBoundingClientRect().toJSON() || null;
          const control = (selector) => {
            const node = document.querySelector(selector);
            const box = rect(node);
            const style = node ? getComputedStyle(node) : null;
            return {
              present: Boolean(node),
              enabled: Boolean(node && !node.disabled),
              visible: Boolean(box && box.width > 0 && box.height > 0
                && box.top < innerHeight && box.bottom > 0
                && style.display !== "none" && style.visibility !== "hidden"),
              rect: box,
            };
          };
          return {
            scrollY: window.scrollY,
            innerHeight: window.innerHeight,
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
            active: document.activeElement?.id || document.activeElement?.tagName || null,
            title: rect(document.querySelector("#main h1")),
            identity: rect(document.querySelector(".identity")),
            controls: {
              simulator: control("#sim-select"),
              back: control("#main [data-back]"),
            },
          };
        });
        process.stdout.write(JSON.stringify({ ...result, focusState, shiftTabToBreadcrumb, pageErrors, queueControl, queueLayout }));
      } finally {
        await browser.close();
      }
    })().catch((error) => {
      console.error(error.stack || error);
      process.exitCode = 1;
    });
  `;
  const run = spawnSync(process.execPath, ["-e", script], { cwd: dir, encoding: "utf8" });
  if (run.status !== 0) {
    return { harnessError: run.stderr.trim() || `node terminó con estado ${run.status}` };
  }
  try {
    return JSON.parse(run.stdout);
  } catch (error) {
    return { harnessError: `salida de Playwright no JSON: ${error.message}` };
  }
}

/* Probe UX de la unidad de cuidado: la cola del cuidador debe conservar sus
   chips de severidad y el control OBL-CU-01 dentro del viewport antes de abrir
   la tarjeta. La mutación productiva que atrapa es dejar nowrap en el chip de
   sobrecarga, cuyo ancho intrínseco empuja el documento a 490px en 390px. */
function probeCaregiverQueue(width) {
  const playwright = "/home/felix/projects/hd-hsc-os/node_modules/playwright";
  const script = `
    const { chromium } = require(${JSON.stringify(playwright)});
    (async () => {
      const browser = await chromium.launch({ headless: true });
      const pageErrors = [];
      try {
        const page = await browser.newPage({ viewport: { width: ${width}, height: 844 } });
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto("file:///home/felix/projects/hd-design-html/index.html");
        await page.selectOption("#role-select", "cuidador");
        await page.locator('.mk-device[data-device="mobile"]').click();
        const openControl = page.locator('[data-open="OBL-CU-01"]');
        if (await openControl.count() !== 1) throw new Error("No se encontró OBL-CU-01 en la cola del cuidador");
        const control = {
          visible: await openControl.isVisible(),
          enabled: await openControl.isEnabled(),
        };
        const queue = await page.evaluate(() => {
          const rect = (node) => node?.getBoundingClientRect().toJSON() || null;
          const expectedLabels = new Set([
            "Téngala a la vista",
            "Usted ya declaró sobrecarga el 16-08 · en seguimiento",
          ]);
          const risks = [...document.querySelectorAll("#main .work-item .risk")].map((node) => {
            const text = node.textContent.trim().replace(/\\s+/g, " ");
            const severity = [...node.classList].find((token) => /^A[0-4]$/.test(token)) || null;
            const box = rect(node);
            return {
              text,
              severity,
              fullText: expectedLabels.has(text),
              complete: Boolean(box && box.left >= 0 && box.right <= window.innerWidth
                && node.scrollWidth <= node.clientWidth),
              rect: box,
            };
          });
          return {
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
            riskCount: risks.length,
            risks,
            labelsAndSeverityPreserved: risks.length === expectedLabels.size
              && risks.every((risk) => Boolean(risk.severity) && risk.fullText),
            risksFit: risks.length > 0 && risks.every((risk) => risk.complete),
          };
        });
        if (!control.visible || !control.enabled) {
          throw new Error("OBL-CU-01 no es un control visible y habilitado");
        }
        await openControl.click();
        await page.locator("#main h1").waitFor();
        const openedTitle = await page.locator("#main h1").textContent();
        process.stdout.write(JSON.stringify({ pageErrors, control, queue, openedTitle }));
      } finally {
        await browser.close();
      }
    })().catch((error) => {
      console.error(error.stack || error);
      process.exitCode = 1;
    });
  `;
  const run = spawnSync(process.execPath, ["-e", script], { cwd: dir, encoding: "utf8" });
  if (run.status !== 0) {
    return { harnessError: run.stderr.trim() || `node terminó con estado ${run.status}` };
  }
  try {
    return JSON.parse(run.stdout);
  } catch (error) {
    return { harnessError: `salida de Playwright no JSON: ${error.message}` };
  }
}

/* Transición genérica accesible: la vista nueva debe anunciar su h1, conservar
   identidad y contexto dentro del viewport, y devolver Shift+Tab al breadcrumb.
   Se ejercitan click y Enter con obligaciones reales fuera de la ruta S3. */
function probeGenericTransition(role, obligation, width, interaction) {
  const playwright = "/home/felix/projects/hd-hsc-os/node_modules/playwright";
  const script = `
    const { chromium } = require(${JSON.stringify(playwright)});
    (async () => {
      const browser = await chromium.launch({ headless: true });
      const pageErrors = [];
      try {
        const page = await browser.newPage({ viewport: { width: ${width}, height: 844 } });
        await page.addInitScript(() => {
          const nativeFocus = HTMLElement.prototype.focus;
          window.__focusEvents = [];
          HTMLElement.prototype.focus = function (...args) {
            if (this.matches?.("#main h1")) {
              window.__focusEvents.push({ tag: this.tagName, tabindex: this.getAttribute("tabindex") });
            }
            return nativeFocus.apply(this, args);
          };
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto("file:///home/felix/projects/hd-design-html/index.html");
        await page.selectOption("#role-select", ${JSON.stringify(role)});
        await page.locator('.mk-device[data-device="${width < 1024 ? "mobile" : "desktop"}"]').click();
        await page.evaluate(() => {
          window.__transitionCount = 0;
          const app = document.querySelector("#app");
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              for (const node of record.addedNodes) {
                if (node.nodeType === 1 && node.querySelector?.("#main")) window.__transitionCount += 1;
              }
            }
          });
          observer.observe(app, { childList: true });
          window.__transitionObserver = observer;
        });
        const opening = page.locator('[data-open="${obligation}"]');
        if (await opening.count() !== 1) throw new Error("No se encontró la obligación genérica solicitada");
        const openingControl = {
          visible: await opening.isVisible(),
          enabled: await opening.isEnabled(),
        };
        if (!openingControl.visible || !openingControl.enabled) throw new Error("La obligación genérica no es utilizable");
        if (${JSON.stringify(interaction)} === "enter") {
          await opening.focus();
          await opening.press("Enter");
        } else {
          await opening.click();
        }
        await page.locator("#main h1").waitFor();
        await page.waitForTimeout(10);
        const focusState = await page.evaluate(() => {
          const title = document.querySelector("#main h1");
          const active = document.activeElement;
          return {
            activeIsTitle: active === title,
            activeTag: active?.tagName || null,
            activeTabIndex: active?.getAttribute("tabindex") || null,
            titleTabIndex: title?.getAttribute("tabindex") || null,
            focusDeliveries: window.__focusEvents.length,
            transitionCount: window.__transitionCount,
          };
        });
        const layout = await page.evaluate(() => {
          const rect = (node) => node?.getBoundingClientRect().toJSON() || null;
          const title = rect(document.querySelector("#main h1"));
          const identity = rect(document.querySelector(".identity"));
          const breadcrumb = rect(document.querySelector("#main [data-back]"));
          const inViewport = (box) => Boolean(box && box.top >= 0 && box.bottom <= innerHeight
            && box.left >= 0 && box.right <= innerWidth);
          return {
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
            title,
            identity,
            breadcrumb,
            titleVisible: inViewport(title),
            identityVisible: inViewport(identity),
            breadcrumbPresent: Boolean(breadcrumb),
          };
        });
        await page.keyboard.press("Shift+Tab");
        await page.waitForTimeout(10);
        const shiftTabToBreadcrumb = await page.evaluate(() => Boolean(document.activeElement?.matches("#main [data-back]")));
        process.stdout.write(JSON.stringify({ pageErrors, openingControl, focusState, layout, shiftTabToBreadcrumb }));
      } finally {
        await browser.close();
      }
    })().catch((error) => {
      console.error(error.stack || error);
      process.exitCode = 1;
    });
  `;
  const run = spawnSync(process.execPath, ["-e", script], { cwd: dir, encoding: "utf8" });
  if (run.status !== 0) {
    return { harnessError: run.stderr.trim() || `node terminó con estado ${run.status}` };
  }
  try {
    return JSON.parse(run.stdout);
  } catch (error) {
    return { harnessError: `salida de Playwright no JSON: ${error.message}` };
  }
}

/* Tabla desplazable: cada región con overflow debe ser una superficie
   nombrada, alcanzable por Tab y desplazable con teclado. La mutación
   productiva que atrapa es dejar `.table-scroll` como un div anónimo: el
   navegador puede darle un foco incidental, pero axe sigue reportando
   `scrollable-region-focusable` y no existe un nombre contextual estable. */
function probeTableScroll(role, obligation, width) {
  const playwright = "/home/felix/projects/hd-hsc-os/node_modules/playwright";
  const axe = "/home/felix/projects/hd-hsc-os/node_modules/@axe-core/playwright";
  const script = `
    const { chromium } = require(${JSON.stringify(playwright)});
    const { AxeBuilder } = require(${JSON.stringify(axe)});
    (async () => {
      const browser = await chromium.launch({ headless: true });
      const pageErrors = [];
      try {
        const context = await browser.newContext({ viewport: { width: ${width}, height: 844 } });
        const page = await context.newPage();
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto("file:///home/felix/projects/hd-design-html/index.html");
        await page.selectOption("#role-select", ${JSON.stringify(role)});
        await page.locator('.mk-device[data-device="${width < 1024 ? "mobile" : "desktop"}"]').click();
        const opening = page.locator('[data-open="${obligation}"]');
        if (await opening.count() !== 1) throw new Error("No se encontró la obligación para la tabla desplazable");
        const openingControl = { visible: await opening.isVisible(), enabled: await opening.isEnabled() };
        if (!openingControl.visible || !openingControl.enabled) throw new Error("La obligación de tabla no es utilizable");
        await opening.click();
        await page.locator("#main h1").waitFor();
        await page.evaluate(() => {
          for (const region of document.querySelectorAll(".table-scroll")) region.scrollLeft = 0;
          document.querySelector("#main h1")?.focus();
        });
        const tableCount = await page.locator(".table-scroll").count();
        const regions = Array.from({ length: tableCount }, () => ({
          hasOverflow: false,
          scrollWidth: 0,
          clientWidth: 0,
          tabReachable: false,
          focusVisible: false,
          named: false,
          name: "",
          keyboardChanged: false,
          keyboardTested: false,
          rect: null,
        }));
        const initialRegions = await page.evaluate(() => [...document.querySelectorAll(".table-scroll")].map((region) => {
          const ids = (region.getAttribute("aria-labelledby") || "").split(/\\s+/).filter(Boolean);
          const labelled = ids.map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
          const name = (region.getAttribute("aria-label") || labelled).trim();
          return {
            hasOverflow: region.scrollWidth > region.clientWidth,
            scrollWidth: region.scrollWidth,
            clientWidth: region.clientWidth,
            named: Boolean(name),
            name,
            rect: region.getBoundingClientRect().toJSON(),
          };
        }));
        initialRegions.forEach((state, index) => Object.assign(regions[index], state));
        const capture = async (index) => {
          const state = await page.evaluate((regionIndex) => {
            const region = document.querySelectorAll(".table-scroll")[regionIndex];
            if (!region) return null;
            const ids = (region.getAttribute("aria-labelledby") || "").split(/\\s+/).filter(Boolean);
            const labelled = ids.map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
            const name = (region.getAttribute("aria-label") || labelled).trim();
            const box = region.getBoundingClientRect();
            return {
              hasOverflow: region.scrollWidth > region.clientWidth,
              scrollWidth: region.scrollWidth,
              clientWidth: region.clientWidth,
              tabReachable: document.activeElement === region,
              focusVisible: document.activeElement === region && region.matches(":focus-visible")
                && getComputedStyle(region).outlineStyle !== "none"
                && getComputedStyle(region).outlineWidth !== "0px",
              named: Boolean(name),
              name,
              rect: box.toJSON(),
              beforeScrollLeft: region.scrollLeft,
            };
          }, index);
          if (!state) return;
          Object.assign(regions[index], state);
          if (state.hasOverflow && state.tabReachable) {
            regions[index].keyboardTested = true;
            await page.keyboard.press("ArrowRight");
            await page.waitForTimeout(180);
            regions[index].keyboardChanged = await page.evaluate((regionIndex) => {
              const region = document.querySelectorAll(".table-scroll")[regionIndex];
              return Boolean(region && region.scrollLeft > 0);
            }, index);
          }
        };
        const seen = new Set();
        for (let step = 0; step < Math.max(30, tableCount + 20); step++) {
          const activeIndex = await page.evaluate(() => {
            const active = document.activeElement;
            return active?.matches(".table-scroll")
              ? [...document.querySelectorAll(".table-scroll")].indexOf(active)
              : -1;
          });
          if (activeIndex >= 0 && !seen.has(activeIndex)) {
            seen.add(activeIndex);
            await capture(activeIndex);
          }
          await page.keyboard.press("Tab");
        }
        const axeResults = await new AxeBuilder({ page })
          .withRules(["scrollable-region-focusable"])
          .analyze();
        const axeViolations = axeResults.violations
          .filter((violation) => violation.id === "scrollable-region-focusable")
          .map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.map((node) => node.target),
          }));
        await context.close();
        process.stdout.write(JSON.stringify({
          pageErrors,
          openingControl,
          tableCount,
          regions,
          axeViolations,
        }));
      } finally {
        await browser.close();
      }
    })().catch((error) => {
      console.error(error.stack || error);
      process.exitCode = 1;
    });
  `;
  const run = spawnSync(process.execPath, ["-e", script], { cwd: dir, encoding: "utf8" });
  if (run.status !== 0) {
    return { harnessError: run.stderr.trim() || `node terminó con estado ${run.status}` };
  }
  try {
    return JSON.parse(run.stdout);
  } catch (error) {
    return { harnessError: `salida de Playwright no JSON: ${error.message}` };
  }
}

/* Ficha clínica: abrir el caso es una transición de vista, no un salto al
   contenedor #main. El repro observa la mutación productiva actual: openCase()
   enfoca el main, deja el scroll en la posición del control y no entrega el
   foco al h1; por eso identidad y retorno Shift+Tab quedan fuera del contexto
   visible aunque la ficha se haya renderizado. */
function probeCaseAccess({ role, width, source, interaction, query, rowIndex = 0, caseId }) {
  const playwright = "/home/felix/projects/hd-hsc-os/node_modules/playwright";
  const axe = "/home/felix/projects/hd-hsc-os/node_modules/@axe-core/playwright";
  const script = `
    const { chromium } = require(${JSON.stringify(playwright)});
    const { AxeBuilder } = require(${JSON.stringify(axe)});
    (async () => {
      const browser = await chromium.launch({ headless: true });
      const pageErrors = [];
      try {
        const context = await browser.newContext({ viewport: { width: ${width}, height: 844 } });
        const page = await context.newPage();
        await page.addInitScript(() => {
          const nativeFocus = HTMLElement.prototype.focus;
          window.__caseFocusEvents = [];
          HTMLElement.prototype.focus = function (...args) {
            if (this.matches?.("#main h1")) {
              window.__caseFocusEvents.push({ tag: this.tagName, tabindex: this.getAttribute("tabindex") });
            }
            return nativeFocus.apply(this, args);
          };
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto("file:///home/felix/projects/hd-design-html/index.html");
        await page.selectOption("#role-select", ${JSON.stringify(role)});
        await page.locator('.mk-device[data-device="${width < 1024 ? "mobile" : "desktop"}"]').click();

        if (${JSON.stringify(source)} === "scene") {
          const opening = page.locator('[data-open="${caseId}"]');
          if (await opening.count() !== 1) throw new Error("No se encontró la obligación de escena para abrir la ficha");
          const openingControl = { visible: await opening.isVisible(), enabled: await opening.isEnabled() };
          if (!openingControl.visible || !openingControl.enabled) throw new Error("La obligación de escena no es utilizable");
          if (${JSON.stringify(interaction)} === "enter") {
            await opening.focus();
            await opening.press("Enter");
          } else {
            await opening.click();
          }
          await page.locator("#main h1").waitFor();
        } else if (${JSON.stringify(source)} === "search") {
          const searchNav = page.locator('[data-nav="buscar"]:visible').first();
          if (await searchNav.count() !== 1) throw new Error("El rol no tiene un acceso visible a Buscar");
          await searchNav.click();
          const input = page.locator("#q");
          if (await input.count() !== 1) throw new Error("No se encontró el buscador de fichas");
          await input.fill(${JSON.stringify(query)});
          const rows = page.locator("#search-results [data-case-open]");
          if (await rows.count() <= ${rowIndex}) throw new Error("La fila de ficha solicitada no apareció en la búsqueda");
        } else if (${JSON.stringify(source)} === "denied") {
          await page.evaluate((id) => window.openCase(id), ${JSON.stringify(caseId)});
          await page.waitForTimeout(20);
          const denied = await page.evaluate(() => ({
            hasCaseView: Boolean(document.querySelector("#main [data-back-case]")),
            title: document.querySelector("#main h1")?.textContent || "",
            hasFichaControls: Boolean(document.querySelector("#main [data-ficha]")),
            searchVisible: Boolean(document.querySelector('[data-nav="buscar"]:not([style*="display: none"])')),
          }));
          process.stdout.write(JSON.stringify({ pageErrors, denied }));
          await context.close();
          return;
        }

        await page.evaluate(() => {
          window.__caseFocusEvents = [];
          window.__caseTransitionCount = 0;
          const app = document.querySelector("#app");
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              for (const node of record.addedNodes) {
                if (node.nodeType === 1 && (node.id === "main" || node.querySelector?.("#main"))) {
                  window.__caseTransitionCount += 1;
                }
              }
            }
          });
          observer.observe(app, { childList: true, subtree: true });
          window.__caseTransitionObserver = observer;
        });

        const fichaControl = page.locator("[data-ficha], [data-case-open]").first();
        if (${JSON.stringify(source)} === "scene") {
          const sceneFicha = page.locator("[data-ficha]");
          if (await sceneFicha.count() !== 1) throw new Error("La escena no expone Abrir ficha del caso");
          if (${JSON.stringify(interaction)} === "enter") {
            await sceneFicha.focus();
            await sceneFicha.press("Enter");
          } else {
            await sceneFicha.click();
          }
        } else if (${JSON.stringify(source)} === "search") {
          const row = page.locator("#search-results [data-case-open]").nth(${rowIndex});
          const openingControl = { visible: await row.isVisible(), enabled: await row.isEnabled() };
          if (!openingControl.visible || !openingControl.enabled) throw new Error("La fila de ficha no es utilizable");
          if (${JSON.stringify(interaction)} === "enter") {
            await row.focus();
            await row.press("Enter");
          } else {
            await row.click();
          }
        }
        await page.locator("#main h1").waitFor();
        await page.waitForTimeout(20);
        const beforeShift = await page.evaluate(() => {
          const rect = (node) => node?.getBoundingClientRect().toJSON() || null;
          const inViewport = (box) => Boolean(box
            && box.top >= 0 && box.bottom <= innerHeight
            && box.left >= 0 && box.right <= innerWidth);
          const h1 = document.querySelector("#main h1");
          const identity = document.querySelector(".identity");
          const response = document.querySelector("#main .resp-header");
          const lenses = [...document.querySelectorAll("#main [data-lens]")].map((button) => ({
            id: button.dataset.lens,
            label: button.textContent.trim(),
            pressed: button.getAttribute("aria-pressed"),
          }));
          const lensState = JSON.stringify(lenses);
          return {
            scrollY,
            innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
            title: rect(h1),
            identity: rect(identity),
            response: rect(response),
            titleVisible: inViewport(rect(h1)),
            identityVisible: inViewport(rect(identity)),
            responseVisible: inViewport(rect(response)),
            breadcrumbPresent: Boolean(document.querySelector("#main [data-back-case]")),
            activeIsTitle: document.activeElement === h1,
            activeTabIndex: document.activeElement?.getAttribute("tabindex") || null,
            titleTabIndex: h1?.getAttribute("tabindex") || null,
            focusDeliveries: window.__caseFocusEvents.length,
            focusEvents: window.__caseFocusEvents,
            transitionCount: window.__caseTransitionCount,
            lensState,
            lenses,
            lensLabels: lenses.map((lens) => lens.label).sort(),
            readOnly: document.querySelector("#main")?.textContent.includes("Episodio cerrado — solo lectura.") || false,
            editableActionCount: document.querySelectorAll("#main .action-bar button").length,
          };
        });
        await page.keyboard.press("Shift+Tab");
        await page.waitForTimeout(10);
        const afterShift = await page.evaluate(() => ({
          shiftTabToBreadcrumb: Boolean(document.activeElement?.matches("#main [data-back-case]")),
          lensState: JSON.stringify([...document.querySelectorAll("#main [data-lens]")].map((button) => ({
            id: button.dataset.lens,
            label: button.textContent.trim(),
            pressed: button.getAttribute("aria-pressed"),
          }))),
        }));
        const axeResults = await new AxeBuilder({ page }).analyze();
        const axeViolations = axeResults.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.target),
        }));
        process.stdout.write(JSON.stringify({
          pageErrors,
          beforeShift,
          afterShift,
          axeViolations,
          fichaControlPresent: await fichaControl.count() > 0,
        }));
        await context.close();
      } finally {
        await browser.close();
      }
    })().catch((error) => {
      console.error(error.stack || error);
      process.exitCode = 1;
    });
  `;
  const run = spawnSync(process.execPath, ["-e", script], { cwd: dir, encoding: "utf8" });
  if (run.status !== 0) {
    return { harnessError: run.stderr.trim() || `node terminó con estado ${run.status}` };
  }
  try {
    return JSON.parse(run.stdout);
  } catch (error) {
    return { harnessError: `salida de Playwright no JSON: ${error.message}` };
  }
}

for (const width of [390, 320]) {
  const probe = probeMobileS3(width, "click");
  check(`S3 móvil ${width}px: apertura sin error de harness`, !probe?.harnessError && !(probe?.pageErrors || []).length);
  check(
    `S3 móvil ${width}px: título e identidad permanecen visibles al abrir`,
    Boolean(probe?.title && probe?.identity)
      && probe.title.top >= 0 && probe.title.bottom <= probe.innerHeight
      && probe.identity.top >= 0 && probe.identity.bottom <= probe.innerHeight,
  );
  check(
    `S3 móvil ${width}px: el documento no desborda horizontalmente`,
    probe?.noHorizontalOverflow === true,
  );
  check(
    `S3 móvil ${width}px: entrada S3 y vuelta permanecen utilizables y visibles`,
    probe?.queueControl?.present !== false
      && probe?.queueControl?.visible
      && probe?.queueControl?.enabled
      && probe?.controls?.simulator?.present
      && probe.controls.simulator.visible
      && probe.controls.simulator.enabled
      && probe.controls.back?.present
      && probe.controls.back.visible
      && probe.controls.back.enabled,
  );
  check(
    `S3 cola ${width}px: documento y chips .risk caben completos sin perder severidad/tarea`,
    probe?.queueLayout?.noHorizontalOverflow === true
      && probe.queueLayout.risksFit
      && probe.queueLayout.labelsPreserved,
  );
  check(
    `S3 móvil ${width}px: foco inicial en h1 -1 y Shift+Tab vuelve al breadcrumb`,
    probe?.focusState?.activeIsTitle
      && probe.focusState.activeTabIndex === "-1"
      && probe.focusState.titleTabIndex === "-1"
      && probe.shiftTabToBreadcrumb,
  );
  if (width === 390) {
    /* Important UX: un gesto en la tarjeta S3 debe atravesar una sola
       transición; este probe atrapa dos listeners sobre el mismo botón. */
    check(
      "S3 clic: una transición observable y una sola entrega de foco al h1",
      probe?.focusState?.transitionCount === 1 && probe.focusState.focusDeliveries === 1,
    );
    if (probe?.focusState?.transitionCount !== 1 || probe?.focusState?.focusDeliveries !== 1) {
      console.log("OBSERVADO S3 clic", JSON.stringify(probe?.focusState || { harnessError: probe?.harnessError }));
    }
    const enterProbe = probeMobileS3(width, "enter");
    check("S3 Enter: apertura sin error de harness", !enterProbe?.harnessError && !(enterProbe?.pageErrors || []).length);
    check(
      "S3 Enter: una transición observable y una sola entrega de foco al h1",
      enterProbe?.focusState?.transitionCount === 1 && enterProbe.focusState.focusDeliveries === 1,
    );
    if (enterProbe?.focusState?.transitionCount !== 1 || enterProbe?.focusState?.focusDeliveries !== 1) {
      console.log("OBSERVADO S3 Enter", JSON.stringify(enterProbe?.focusState || { harnessError: enterProbe?.harnessError }));
    }
  }
  if (probe?.harnessError) console.log(`HARNESS ERROR S3 móvil ${width}px`, probe.harnessError);
  else if (probe && !probe.noHorizontalOverflow) {
    console.log(`OBSERVADO overflow S3 móvil ${width}px`, JSON.stringify({
      scrollWidth: probe.scrollWidth,
      innerWidth: probe.innerWidth,
      simulator: probe.controls?.simulator?.rect,
    }));
  }
  else if (probe && !(probe.queueLayout?.noHorizontalOverflow
    && probe.queueLayout.risksFit && probe.queueLayout.labelsPreserved)) {
    console.log(`OBSERVADO cola S3 móvil ${width}px`, JSON.stringify({
      scrollWidth: probe.queueLayout?.scrollWidth,
      innerWidth: probe.queueLayout?.innerWidth,
      risks: probe.queueLayout?.risks,
    }));
  }
  else if (probe && (probe.title?.top < 0 || probe.identity?.top < 0)) {
    console.log(`OBSERVADO S3 móvil ${width}px`, JSON.stringify({ scrollY: probe.scrollY, title: probe.title, identity: probe.identity, active: probe.active }));
  }
}

/* Frontera responsive de la cola S3: se comprueba geometría renderizada en
   anchos adyacentes, sin convertir un breakpoint CSS en contrato del test. */
for (const width of [359, 360, 361, 374, 375]) {
  const probe = probeMobileS3(width, "click");
  const queuePass = probe?.queueLayout?.noHorizontalOverflow === true
    && probe.queueLayout.risksFit
    && probe.queueLayout.labelsPreserved;
  check(
    `S3 cola frontera ${width}px: sin harness/pageerror, overflow ni chips truncados`,
    !probe?.harnessError && !(probe?.pageErrors || []).length && queuePass,
  );
  if (probe?.harnessError || (probe?.pageErrors || []).length) {
    console.log(`HARNESS ERROR frontera S3 ${width}px`, JSON.stringify({
      harnessError: probe?.harnessError || null,
      pageErrors: probe?.pageErrors || [],
    }));
  } else if (!queuePass) {
    console.log(`OBSERVADO frontera cola S3 ${width}px`, JSON.stringify({
      scrollWidth: probe.queueLayout?.scrollWidth,
      innerWidth: probe.queueLayout?.innerWidth,
      risks: probe.queueLayout?.risks,
    }));
  }
}

/* Unidad de cuidado: 390px es el caso focal; 320px y 1440px son guardias
   contra una corrección que rompa la composición estrecha o la amplia. */
for (const width of [390, 320, 1440]) {
  const probe = probeCaregiverQueue(width);
  const queuePass = probe?.queue?.noHorizontalOverflow === true
    && probe.queue.risksFit
    && probe.queue.labelsAndSeverityPreserved;
  check(
    `cuidador cola ${width}px: sin harness/pageerror, chips completos y OBL-CU-01 usable`,
    !probe?.harnessError
      && !(probe?.pageErrors || []).length
      && probe?.control?.visible
      && probe.control.enabled
      && probe.openedTitle?.includes("Su tarjeta de alarma")
      && queuePass,
  );
  if (probe?.harnessError || (probe?.pageErrors || []).length) {
    console.log(`HARNESS ERROR cuidador ${width}px`, JSON.stringify({
      harnessError: probe?.harnessError || null,
      pageErrors: probe?.pageErrors || [],
    }));
  } else if (!queuePass) {
    console.log(`OBSERVADO cuidador cola ${width}px`, JSON.stringify({
      scrollWidth: probe.queue?.scrollWidth,
      innerWidth: probe.queue?.innerWidth,
      control: probe.control,
      openedTitle: probe.openedTitle,
      risks: probe.queue?.risks,
    }));
  }
}

/* Cambio de contrato: toda apertura genérica anuncia la nueva vista con el
   h1 enfocable, identidad y contexto visibles. La mutación que atrapa es
   conservar openObligation() enfocado en #main sin entregar el título ni el
   contexto al lector de pantalla/teclado. */
const genericTransitionScenarios = [
  { role: "cuidador", obligation: "OBL-CU-01", interaction: "click" },
  { role: "enfermero-clinico", obligation: "OBL-EN-01", interaction: "enter" },
  { role: "enfermera-coordinadora", obligation: "OBL-CO-01", interaction: "click" },
  { role: "medico-atencion-directa", obligation: "OBL-MD-02", interaction: "enter" },
  { role: "conductor", obligation: "OBL-DR-01", interaction: "click" },
];
for (const width of [320, 390, 1440]) {
  for (const scenario of genericTransitionScenarios) {
    const probe = probeGenericTransition(scenario.role, scenario.obligation, width, scenario.interaction);
    const transitionPass = !probe?.harnessError
      && !(probe?.pageErrors || []).length
      && probe?.openingControl?.visible
      && probe.openingControl.enabled
      && probe.focusState?.activeIsTitle
      && probe.focusState.activeTabIndex === "-1"
      && probe.focusState.titleTabIndex === "-1"
      && probe.focusState.transitionCount === 1
      && probe.focusState.focusDeliveries === 1
      && probe.layout?.noHorizontalOverflow
      && probe.layout.titleVisible
      && probe.layout.identityVisible
      && probe.layout.breadcrumbPresent
      && probe.shiftTabToBreadcrumb;
    check(
      `transición genérica ${scenario.role}/${scenario.obligation} ${width}px (${scenario.interaction}): h1, contexto, foco y breadcrumb`,
      transitionPass,
    );
    if (probe?.harnessError || (probe?.pageErrors || []).length) {
      console.log("HARNESS ERROR transición genérica", JSON.stringify({
        role: scenario.role,
        obligation: scenario.obligation,
        width,
        harnessError: probe?.harnessError || null,
        pageErrors: probe?.pageErrors || [],
      }));
    } else if (!transitionPass) {
      console.log("OBSERVADO transición genérica", JSON.stringify({
        role: scenario.role,
        obligation: scenario.obligation,
        width,
        interaction: scenario.interaction,
        focusState: probe.focusState,
        layout: probe.layout,
        shiftTabToBreadcrumb: probe.shiftTabToBreadcrumb,
      }));
    }
  }
}

/* Tablas reales: coordinadora focal a 320px, conductor en 320/390px y una
   guardia de escritorio que mantiene la ruta genérica cubierta. Sólo se
   exige teclado a regiones que efectivamente tienen overflow; el guard no
   convierte la ausencia de overflow en una obligación artificial. */
const tableScrollScenarios = [
  { role: "enfermera-coordinadora", obligation: "OBL-CO-01", width: 320 },
  { role: "conductor", obligation: "OBL-DR-01", width: 320 },
  { role: "conductor", obligation: "OBL-DR-01", width: 390 },
  { role: "enfermera-coordinadora", obligation: "OBL-CO-01", width: 1440, desktopGuard: true },
];
for (const scenario of tableScrollScenarios) {
  const probe = probeTableScroll(scenario.role, scenario.obligation, scenario.width);
  const scrollable = (probe?.regions || []).filter((region) => region.hasOverflow);
  const scrollablePass = scrollable.length > 0 && scrollable.every((region) =>
    region.tabReachable
      && region.focusVisible
      && region.named
      && (!region.keyboardTested || region.keyboardChanged),
  );
  const tablePass = !probe?.harnessError
    && !(probe?.pageErrors || []).length
    && probe?.tableCount > 0
    && !(probe?.axeViolations || []).length
    && (scenario.desktopGuard ? scrollablePass || scrollable.length === 0 : scrollablePass);
  check(
    `table-scroll ${scenario.role}/${scenario.obligation} ${scenario.width}px: axe, nombre, Tab, foco visible y teclado`,
    tablePass,
  );
  if (probe?.harnessError || (probe?.pageErrors || []).length) {
    console.log("HARNESS ERROR table-scroll", JSON.stringify({
      role: scenario.role,
      obligation: scenario.obligation,
      width: scenario.width,
      harnessError: probe?.harnessError || null,
      pageErrors: probe?.pageErrors || [],
    }));
  } else if (!tablePass) {
    console.log("OBSERVADO table-scroll", JSON.stringify({
      role: scenario.role,
      obligation: scenario.obligation,
      width: scenario.width,
      tableCount: probe.tableCount,
      axeViolations: probe.axeViolations,
      regions: probe.regions,
    }));
  }
}

/* Ficha: dos entradas autorizadas y una lectura cerrada recorren los tres
   anchos. A usa la obligación clínica que lleva a la escena y luego a
   «Abrir ficha del caso»; B usa Buscar como acceso de otro rol clínico; C
   conserva la misma entrada de búsqueda sobre un episodio cerrado, que debe
   permanecer explícitamente en solo lectura. Click y Enter alternan el gesto
   sin convertirlo en una aserción de implementación. */
const caseAccessScenarios = [
  {
    id: "A escena → ficha",
    role: "enfermero-clinico",
    source: "scene",
    caseId: "OBL-EN-01",
    closed: false,
  },
  {
    id: "B Buscar → ficha activa",
    role: "enfermera-coordinadora",
    source: "search",
    query: "rosa",
    rowIndex: 0,
    closed: false,
  },
  {
    id: "C Buscar → ficha cerrada",
    role: "enfermera-coordinadora",
    source: "search",
    query: "maría",
    rowIndex: 1,
    closed: true,
  },
];
for (const width of [320, 390, 1440]) {
  for (const scenario of caseAccessScenarios) {
    const interaction = width === 390 ? "enter" : "click";
    const probe = probeCaseAccess({ ...scenario, width, interaction });
    const view = probe?.beforeShift;
    const lenses = view?.lenses || [];
    const expectedLabels = ["Pasado", "Plan", "Pulso"];
    const lensContract = scenario.closed
      ? Boolean(view?.readOnly && view.lenses.length === 0 && view.lensState === probe?.afterShift?.lensState)
      : Boolean(
        lenses.length === 3
          && JSON.stringify(view.lensLabels) === JSON.stringify(expectedLabels)
          && lenses.filter((lens) => lens.pressed === "true").length === 1
          && lenses.find((lens) => lens.id === "pulso")?.pressed === "true"
          && view.lensState === probe?.afterShift?.lensState,
      );
    const casePass = !probe?.harnessError
      && !(probe?.pageErrors || []).length
      && view?.noHorizontalOverflow
      && view.titleVisible
      && view.identityVisible
      && view.responseVisible
      && view.activeIsTitle
      && view.activeTabIndex === "-1"
      && view.titleTabIndex === "-1"
      && view.transitionCount === 1
      && view.focusDeliveries === 1
      && view.breadcrumbPresent
      && probe.afterShift?.shiftTabToBreadcrumb
      && !(probe.axeViolations || []).length
      && lensContract
      && (!scenario.closed || view.editableActionCount === 0);
    check(
      `${scenario.id} ${width}px (${interaction}): foco, contexto, breadcrumb, lentes y axe`,
      casePass,
    );
    if (probe?.harnessError || (probe?.pageErrors || []).length) {
      console.log("HARNESS ERROR ficha", JSON.stringify({
        scenario: scenario.id,
        width,
        harnessError: probe?.harnessError || null,
        pageErrors: probe?.pageErrors || [],
      }));
    } else if (!casePass) {
      console.log("OBSERVADO ficha", JSON.stringify({
        scenario: scenario.id,
        width,
        interaction,
        beforeShift: view,
        afterShift: probe?.afterShift,
        axeViolations: probe?.axeViolations,
      }));
    }
  }
}

/* Permiso ajeno: un conductor no tiene acceso clínico. Se intenta un trigger
   obsoleto/forjado contra la misma operación de runtime para que el contrato
   no dependa sólo de que la navegación haya ocultado el enlace. */
for (const width of [320, 390, 1440]) {
  const probe = probeCaseAccess({
    role: "conductor",
    source: "denied",
    caseId: "HOD-2026-0131",
    width,
  });
  const deniedPass = !probe?.harnessError
    && !(probe?.pageErrors || []).length
    && probe?.denied
    && !probe.denied.hasCaseView
    && !probe.denied.hasFichaControls;
  check(`permiso ajeno conductor ${width}px: openCase no entrega ficha`, deniedPass);
  if (!deniedPass) {
    console.log("OBSERVADO permiso ficha", JSON.stringify({ width, denied: probe?.denied }));
  }
}

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
