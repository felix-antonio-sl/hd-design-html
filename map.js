/* ============================================================
   RENDER DEL MAPA — censo, circuitos, telemetría y Mi día.
   Mapa esquemático SVG propio: sin tiles, sin red, sin datos
   reales. La posición declarada nunca se presenta como prueba
   de visita, atención o cobertura.
   ============================================================ */

const MAP_FILTERS = { activo: true, postulado: true, egresado: false };

/* ---------- E2E-08/S3: proyecciones sin estado local ---------- */
function e2e08S3MapSnapshot() {
  const fromScene = typeof e2e08S3SceneProjection === "function" ? e2e08S3SceneProjection() : null;
  const visit = fromScene?.visit || (typeof E2E08_VISIT_OCCURRENCE !== "undefined" ? E2E08_VISIT_OCCURRENCE : null);
  const packageData = fromScene?.package || (typeof E2E08_S3_PACKAGE !== "undefined" ? E2E08_S3_PACKAGE : null);
  const manifest = fromScene?.manifest || (typeof E2E08_S3_MANIFEST !== "undefined" ? E2E08_S3_MANIFEST : null);
  const seedLog = typeof E2E08_S3_TIMELINE !== "undefined" ? E2E08_S3_TIMELINE : [];
  return {
    visit,
    package: packageData,
    criticalInstruction: fromScene?.criticalInstruction || null,
    review: fromScene?.packageReview || null,
    manifestDecision: fromScene?.manifestDecision || null,
    departure: fromScene?.departure || null,
    urgentCancellation: fromScene?.urgentCancellation || null,
    referralIntent: fromScene?.referralIntent || null,
    coordinationAck: fromScene?.coordinationAck || null,
    coordinationWithdraw: fromScene?.coordinationWithdraw || null,
    routeAmendment: fromScene?.routeAmendment || null,
    driverContact: fromScene?.driverContact || null,
    invalidation: fromScene?.invalidation || null,
    manifest,
    log: Array.isArray(fromScene?.log) ? fromScene.log : seedLog,
    temporal: typeof hdDesignE2E08S3TemporalProjection === "function"
      ? hdDesignE2E08S3TemporalProjection()
      : { source: "app.e2e08.log", scheduledDeparture: visit?.scheduledDeparture || "08:45", departureObserved: false, cancellation: null, visitState: "programada" }
  };
}

function e2e08S3RecordAt(record, fallback = "") {
  if (!record || typeof record !== "object") return fallback;
  return record.at || record.time || record.recordedAt || record.observedAt || fallback;
}

function e2e08S3RecordText(record) {
  if (!record) return "";
  if (typeof record === "string") return record;
  try { return JSON.stringify(record); } catch (_) { return ""; }
}

function e2e08S3TimelineHtml(log) {
  const entries = Array.isArray(log) && log.length ? log : [];
  const hasDepartureOutcome = entries.some((entry) => entry && ["vehicle_departure_observed", "vehicle_departure_blocked"].includes(entry.type));
  const items = entries.map((entry, index) => {
      const at = e2e08S3RecordAt(entry, "");
      const id = entry && (entry.id || entry.eventId || entry.type) || `E2E08-S3-${index + 1}`;
      const label = entry && (entry.event || entry.text || entry.outcome || entry.type) || "evento del caso";
      const kind = entry?.kind || (entry?.type === "vehicle_departure_observed" ? "observed" : entry?.type === "departure_window_declared" ? "scheduled" : "");
      const kindAttr = kind ? ` data-s3-time-kind="${esc(kind)}"` : "";
      const departureAttr = entry?.type === "vehicle_departure_observed" ? " data-s3-observed-departure" : entry?.kind === "scheduled" && at === "08:45" ? " data-s3-scheduled-departure" : "";
      return `<li data-s3-event data-s3-entry${kindAttr}${departureAttr} data-e2e08-event-id="${esc(id)}" data-event-id="${esc(id)}" data-e2e08-at="${esc(at)}" data-at="${esc(at)}"><span class="s3-time">${esc(at)}</span> · ${esc(label)}</li>`;
    });
  if (!hasDepartureOutcome) items.push(`<li data-s3-event data-s3-entry data-s3-time-kind="observed" data-s3-observed-departure data-e2e08-at="08:45" data-at="08:45"><span class="s3-time">08:45</span> · observación real de partida pendiente; no registrada</li>`);
  return `<details class="s3-timeline" aria-label="Línea de tiempo S3 append-only">
    <summary>Traza temporal técnica S3</summary><div data-s3-log data-s3-timeline data-s3-temporal-source="app.e2e08.log" data-time-source="app.e2e08.log"><h3>Línea de tiempo del caso</h3>
    <ol>${items.join("")}</ol></div>
  </details>`;
}

function e2e08S3VisitProjectionHtml(role = state.role) {
  const snapshot = e2e08S3MapSnapshot();
  const visit = snapshot.visit;
  if (!visit || !Array.isArray(visit.roles) || !visit.roles.includes(role)) return "";
  const temporal = snapshot.temporal || {};
  const packageData = snapshot.package || visit;
  const reviewAt = e2e08S3RecordAt(snapshot.review, packageData.reviewAt || visit.packageReviewAt || "08:35");
  const departureAt = e2e08S3RecordAt(snapshot.departure, temporal.scheduledDeparture || "08:45");
  const reviewText = snapshot.review
    ? `Revisión de paquete registrada ${reviewAt}; suficiencia definida por Enfermería.`
    : `Preparación previa y revisión de paquete prevista ${reviewAt}.`;
  const departureText = temporal.cancellation
    ? "VIS cancelada por orden médica; no se registra encuentro ni atención."
    : temporal.departureBlocked
      ? `Partida bloqueada · hito logístico registrado ${departureAt}; M1 no está en ruta.`
    : temporal.departureObserved
      ? `M1 en ruta · hito logístico registrado ${departureAt}.`
      : `Salida programada ${temporal.scheduledDeparture || departureAt}; observación real pendiente.`;
  const reviewAction = role === "enfermero-clinico" && !temporal.cancellation
    && (!snapshot.review || snapshot.review.valid === false)
    ? `<button class="btn primary" data-s3-action="review-package" data-e2e08-action="review-package" data-action="review-package" aria-label="Revisar paquete ${esc(reviewAt)}">Revisar paquete · ${esc(reviewAt)}</button>`
    : "";
  const visitState = temporal.visitState || "programada";
  const nextBadge = !temporal.cancellation && !temporal.departureBlocked
    ? '<span class="next-badge">Su próxima parada</span>' : "";
  return `<section class="block s3-visit-projection" data-s3-visit="${esc(visit.id)}" data-visit-id="${esc(visit.id)}" data-s3="visit-scheduled" data-s3-state="${esc(visitState)}" data-s3-temporal-source="${esc(temporal.source || "app.e2e08.log")}" data-time-source="${esc(temporal.source || "app.e2e08.log")}" aria-label="Proyección ${esc(visit.id)}">
    <div class="s3-visit-head"><div><h2>VIS-ROSA-M1-0900</h2>${nextBadge}<p>Rosa C. · HOD-2026-0131 · Móvil 1 (M1)</p></div><span class="s3-state">${esc(visitState)}</span></div>
    <dl class="kv s3-visit-kv">
      <dt>Equipo</dt><dd>Enfermería + TENS</dd>
      <dt>Ventana</dt><dd>${esc(visit.window)}</dd>
      <dt>Preparación</dt><dd data-s3-review data-review-time="${esc(reviewAt)}">${esc(reviewText)}</dd>
      <dt>Partida</dt><dd>${esc(departureText)}</dd>
    </dl>
    ${reviewAction ? `<div class="s3-visit-action">${reviewAction}</div>` : ""}
    <p class="map-note">La salida y el GPS son hitos logísticos: no demuestran que la visita o la atención se hayan realizado.</p>
    ${e2e08S3TimelineHtml(snapshot.log)}
  </section>`;
}

/* Prefijo propio: app.js también declara un renderer S3 de manifiesto. */
function hdDesignE2E08S3ManifestProjectionHtml() {
  const snapshot = e2e08S3MapSnapshot();
  const visit = snapshot.visit;
  const manifest = snapshot.manifest;
  if (!visit || !manifest) return "";
  const decision = snapshot.manifestDecision;
  const cancellation = snapshot.urgentCancellation;
  const decisionAt = e2e08S3RecordAt(decision, manifest.decisionAt || visit.manifestDecisionAt || "08:40");
  const review = snapshot.review;
  const decisionText = cancellation
    ? "VIS cancelada por orden médica urgente; toda retención previa pierde vigencia y Coordinación debe retirarla."
    : decision
      ? `Disposición VIS registrada ${decisionAt}; se conserva la referencia a review ${manifest.reviewAt}.`
      : review?.status === "sufficient" && review.valid !== false
        ? `Disposición pendiente; review suficiente vigente ${manifest.reviewAt}.`
        : review?.status === "missing" ? "VIS retenida: paquete faltante." : "Disposición pendiente; aún no existe review vigente.";
  const cancelled = Boolean(cancellation) || /cancel|withdraw|retir|invalid/i.test(e2e08S3RecordText(decision));
  const routeEligible = cancellation && snapshot.departure?.type === "vehicle_departure_observed";
  const urgentContinuity = routeEligible ? `<div class="s3-urgent-continuity" data-s3="urgent-continuity">
    <section class="block" data-s3-route-amendment data-e2e08-causal-event-id="${esc((snapshot.routeAmendment || cancellation).id)}" aria-label="Route amendment posterior"><h3>Route amendment</h3><p>${snapshot.routeAmendment ? "Enmienda logística iniciada" : "Enmienda logística pendiente"}; queda separada del retiro de VIS.</p></section>
    <section class="block" data-s3-contact data-e2e08-causal-event-id="${esc((snapshot.driverContact || cancellation).id)}" aria-label="Contacto de continuidad"><h3>Contacto de continuidad</h3><p>${snapshot.driverContact ? "Intento de contacto registrado" : "Intento de contacto pendiente"}; no equivale a route amendment ni a atención.</p></section>
  </div>` : "";
  return `<section class="block s3-manifest-projection" data-s3-manifest="${esc(manifest.id)}" data-manifest="${esc(manifest.id)}" data-s3-visit="${esc(visit.id)}" data-visit-id="${esc(visit.id)}" data-time-source="app.e2e08.log" data-s3-temporal-source="app.e2e08.log" data-s3="manifest" aria-label="Manifiesto ${esc(manifest.id)}">
    <div class="s3-visit-head"><div><h2>Manifiesto M1</h2><p>${esc(visit.id)} · ${esc(visit.window)}</p></div><span class="s3-state">${cancelled ? "VIS retirada" : "disposición pendiente"}</span></div>
    <p>${esc(decisionText)}</p>
    <dl class="kv"><dt>Paquete</dt><dd>criticalInstructionRevision ${esc(visit.criticalInstructionRevision)} · nursingPlan ${esc(visit.nursingPlan)}</dd><dt>Alcance</dt><dd>La disposición conserva VIS; no autoriza que el móvil parta por completo.</dd></dl>
    ${!cancelled && !decision && review?.status === "sufficient" && review.valid !== false ? `<button class="btn primary" data-s3-action="decide-vis-disposition" data-e2e08-action="manifest-retain" data-action="decide-vis-disposition" data-e2e08-basis-token="${esc(review.basisToken)}" aria-label="Disponer VIS en manifiesto M1">Disponer VIS en M1</button>` : ""}
    ${decision ? `<div class="outcome-receipt s3-receipt" data-s3-receipt="vis-disposition"><h3>Receipt de disposición VIS</h3><p>${esc(decisionText)} No autoriza que el móvil parta por completo.</p></div>` : ""}
    <div data-s3-inference class="s3-inference"><b>Inferencia limitada:</b> manifiesto + partida pueden conservar referencia causal; no demuestran visita ni atención.</div>
    <div data-s3="manifest-projection" data-s3-manifest-projection class="s3-manifest-projection-copy"><p>${cancelled ? "VIS cancelada; la programación quedó cancelada." : `VIS permanece programada: ${esc(visit.window)}.`}</p></div>
    ${urgentContinuity}
    ${e2e08S3TimelineHtml(snapshot.log)}
  </section>`;
}

function markerColorFor(c) {
  if (c.state === "activo") return "#1F4FD8";
  if (c.state === "postulado") return "#B45D0A";
  return "#52606D";
}

function censusMarker(c) {
  const color = markerColorFor(c);
  const opacity = { exacta: 1, aproximada: 0.85, centroide: 0.55 }[c.precision] || 0.55;
  const ring = c.precision !== "exacta"
    ? `<circle cx="${c.x}" cy="${c.y}" r="${c.precision === "aproximada" ? 14 : 20}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>`
    : "";
  const riskDot = c.risk === "A4" || c.risk === "A3"
    ? `<circle cx="${c.x + 8}" cy="${c.y - 8}" r="4" fill="${c.risk === "A4" ? "#C42525" : "#B45D0A"}" stroke="#fff" stroke-width="1.2"/>`
    : "";
  return `<g data-census="${esc(c.id)}" style="cursor:pointer;opacity:${opacity}" role="button" tabindex="0" aria-label="${esc(c.id)} ${esc(c.sector)}">
    ${ring}
    <circle cx="${c.x}" cy="${c.y}" r="8" fill="${color}" stroke="#fff" stroke-width="1.6"/>
    ${riskDot}
  </g>`;
}

function circuitPath(circuit) {
  const pts = [{ x: 390, y: 280 }, ...circuit.stops.map((s) => ({ x: s.x, y: s.y }))];
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const done = circuit.stops.every((s) => s.status === "completada");
  return `<path d="${d}" fill="none" stroke="${circuit.color}" stroke-width="2.5" stroke-dasharray="${done ? "none" : "7,5"}" opacity="0.75"/>`;
}

function stopMarker(circuit, s) {
  const fill = s.status === "completada" ? "#0E8755" : s.status === "en_curso" ? circuit.color : "#FFFFFF";
  const stroke = s.status === "pendiente" ? circuit.color : fill;
  return `<g data-stop="${circuit.id}:${s.seq}" style="cursor:pointer" role="button" tabindex="0" aria-label="Parada ${s.seq} ${esc(s.sector)}">
    <circle cx="${s.x}" cy="${s.y}" r="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <text x="${s.x}" y="${s.y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="${s.status === "pendiente" ? circuit.color : "#fff"}">${s.seq}</text>
  </g>`;
}

function vehicleMarker(v, dx = 0, dy = 0) {
  const st = VEHICLE_STATUS[v.status];
  const num = v.id === "m1" ? 1 : 2;
  const x = v.x + dx, y = v.y + dy;
  const link = (dx || dy) ? `<line x1="${v.x}" y1="${v.y}" x2="${x}" y2="${y}" stroke="var(--border-strong)" stroke-width="1.2" stroke-dasharray="2,2"/>` : "";
  return `<g data-vehicle="${esc(v.id)}" aria-label="${esc(v.label)} ${st.label}">
    ${link}
    <circle cx="${x}" cy="${y}" r="11" fill="var(--ink)" stroke="#fff" stroke-width="2"/>
    <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" fill="#fff" font-weight="700">M${num}</text>
    <circle cx="${x + 9}" cy="${y - 8}" r="4" fill="${st.color}" stroke="#fff" stroke-width="1.2"/>
  </g>`;
}

function mapSvg({ circuits = [], vehicles = [], showCensus = true, height = 420 }) {
  const zones = TERRITORY.zones.map((z) =>
    `<path d="${z.path}" fill="var(--surface)" stroke="var(--border)" stroke-width="1.2"/><text x="${z.labelPos.x}" y="${z.labelPos.y}" font-size="11" fill="var(--muted)">${esc(z.label)}</text>`
  ).join("");
  const roads = TERRITORY.roads.map((r) =>
    `<path d="${r.path}" fill="none" stroke="var(--border-strong)" stroke-width="1.6" stroke-dasharray="1,4" stroke-linecap="round"/>`
  ).join("");
  const places = TERRITORY.places.map((p) => {
    const anchor = p.anchor || "start";
    const tx = anchor === "start" ? p.x + 10 : anchor === "end" ? p.x - 10 : p.x;
    const ty = p.labelDy ? p.y + p.labelDy : p.labelUp ? p.y - 14 : p.y + 4;
    return `<g><rect x="${p.x - 6}" y="${p.y - 6}" width="12" height="12" rx="2" fill="${p.kind === "base" ? "var(--ink)" : "var(--muted)"}"/><text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="11" fill="var(--ink)" font-weight="${p.kind === "base" ? 700 : 400}">${esc(p.label)}</text></g>`;
  }).join("");
  const currentCensus = typeof e2e01ProjectCensus === "function" ? e2e01ProjectCensus(CENSUS) : CENSUS;
  const census = showCensus
    ? currentCensus.filter((c) => MAP_FILTERS[c.state]).map(censusMarker).join("")
    : "";
  const circs = circuits.map((id) => CIRCUITS[id]).filter(Boolean);
  const paths = circs.map(circuitPath).join("");
  const stops = circs.flatMap((c) => c.stops.map((s) => stopMarker(c, s))).join("");
  const stopCoords = new Set(circs.flatMap((c) => c.stops.map((s) => `${s.x},${s.y}`)));
  const vehs = vehicles.map((id) => VEHICLES.find((v) => v.id === id)).filter(Boolean)
    .map((v) => stopCoords.has(`${v.x},${v.y}`) ? vehicleMarker(v, 26, -24) : vehicleMarker(v)).join("");

  return `<svg viewBox="${TERRITORY.viewBox}" class="hd-map" style="height:${height}px" role="group" aria-label="Mapa esquemático del territorio HODOM">
    <rect x="0" y="0" width="840" height="560" fill="var(--surface-subtle)" rx="8"/>
    ${zones}${roads}${paths}${places}${census}${stops}${vehs}
  </svg>`;
}

function labelAnchor(path) {
  const nums = path.match(/-?\d+/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
  return { x: Math.min(...xs) + 12, y: Math.min(...ys) + 18 };
}

/* ---------- leyenda y honestidad de precisión ---------- */
function mapLegend() {
  return `<div class="map-legend">
    <span><i class="lg" style="background:#1F4FD8"></i> Episodio HODOM activo</span>
    <span><i class="lg" style="background:#B45D0A"></i> Postulado · esperando decisión</span>
    <span><i class="lg" style="background:#52606D"></i> Egresado reciente</span>
    <span><i class="lg lg-risk"></i> Riesgo declarado sobre el marcador: naranja A3 · rojo A4</span>
    <span><i class="lg lg-ring"></i> Ubicación aproximada o por sector: nunca es el domicilio exacto</span>
    <span><i class="lg" style="background:var(--ink)"></i> Móvil (el punto de color indica: verde en movimiento, azul detenido)</span>
    <span><i class="lg lg-stop"></i> Parada numerada del recorrido (verde registrada, blanca pendiente)</span>
    <span><i class="lg lg-route"></i> Recorrido planificado del móvil</span>
    <span><i class="lg lg-road"></i> Calles de referencia</span>
  </div>`;
}

/* ---------- panel lateral de censo ---------- */
function censusPanel() {
  const currentCensus = typeof e2e01ProjectCensus === "function" ? e2e01ProjectCensus(CENSUS) : CENSUS;
  const rows = currentCensus.filter((c) => MAP_FILTERS[c.state]).map((c) => {
    const p = c.personKey ? PEOPLE[c.personKey] : null;
    const name = p ? `${p.alias} · ${p.age} años` : c.alias;
    return `<button class="census-row" data-census-row="${esc(c.id)}">
      <span class="cr-top"><b>${esc(name)}</b><span class="risk ${esc(c.risk)}">${esc(c.risk)}</span></span>
      <span class="cr-meta">${esc(c.id)} · ${esc(c.sector)} · ubicación ${esc({ exacta: "exacta", aproximada: "aproximada", centroide: "por sector" }[c.precision] || c.precision)}</span>
      <span class="cr-today">${esc(c.today)}</span>
    </button>`;
  }).join("");
  return `<div class="census-panel">
    <div class="census-filters" role="group" aria-label="Filtros del censo">
      ${["activo", "postulado", "egresado"].map((s) =>
        `<button class="chip-toggle ${MAP_FILTERS[s] ? "on" : ""}" data-filter="${s}" aria-pressed="${MAP_FILTERS[s]}">${{ activo: "Episodio activo", postulado: "Postulados", egresado: "Egresados" }[s]}</button>`
      ).join("")}
    </div>
    <div class="census-list">${rows}</div>
    <p class="map-note">Cuando la ubicación es «por sector», el punto marca el sector y no la casa. Si no hay ubicación verificable, la persona queda fuera del mapa con su motivo declarado: nunca se inventa su posición.</p>
  </div>`;
}

/* ---------- popup de parada ---------- */
function stopPopup(circuitId, seq) {
  const c = CIRCUITS[circuitId];
  const s = c.stops.find((x) => x.seq === Number(seq));
  if (!s) return "";
  const person = s.personKey ? PEOPLE[s.personKey] : null;
  const name = person ? `${person.alias} · ${person.age} años` : s.alias;
  const tasks = s.tasks.map((t) => {
    const roleLabel = t.roleLabel || ROLES.find((r) => r.id === t.role)?.label || t.role;
    const st = { completada: "completada", en_curso: "en curso", pendiente: "pendiente" }[t.status];
    const open = t.role === state.role && !s.s3 ? `<button class="btn" data-open-scene="${esc(t.scene)}">Abrir la tarea</button>` : "";
    return `<li><b>${esc(roleLabel)}:</b> ${esc(t.label)} <span class="stop-status ${esc(t.status)}">${st}</span> ${open}</li>`;
  }).join("");
  const times = [
    s.arrived ? `Llegada ${s.arrived}` : null,
    s.left ? `Salida ${s.left}` : null
  ].filter(Boolean).join(" · ") || "Sin hitos registrados aún";
  return `<div class="stop-popup" role="dialog" aria-label="Parada ${s.seq}">
    <div class="sp-head"><b>Parada ${s.seq} · ${esc(name)}</b><span class="stop-status ${esc(s.status)}">${{ completada: "completada", en_curso: "en curso", pendiente: "pendiente" }[s.status]}</span></div>
    <div class="sp-meta">${esc(s.sector)} · ventana ${esc(s.window)} · ${esc(times)}</div>
    <div class="sp-meta">Qué se transporta: ${esc(s.cargo)}</div>
    ${s.tasks.length ? `<ul class="sp-tasks">${tasks}</ul>` : `<p class="sp-meta">No hay atenciones profesionales en esta parada.</p>`}
    <p class="map-note">Que el móvil haya llegado no significa que la atención se hizo: cada acto clínico conserva su propio registro con autor y resultado.</p>
  </div>`;
}

/* ---------- vista: Censo territorial (coordinación, DT) ---------- */
function renderCensoMapa() {
  return `
    <h1 class="view-title">Mapa de pacientes</h1>
    <p class="view-subtitle">Las personas en atención domiciliaria y las postulaciones, sobre el territorio. Información de referencia con hora de actualización: el mapa no decide prioridades ni asigna recursos.</p>
    ${contextBanner()}
    <div class="map-layout">
      <div class="map-canvas block">
        ${mapSvg({ circuits: ["m1", "m2"], vehicles: ["m1", "m2"], showCensus: true })}
        ${mapLegend()}
        <div id="stop-pop"></div>
      </div>
      ${censusPanel()}
    </div>
    <div class="block">
      <h2>Atenciones pendientes por falta de transporte</h2>
      <p>Una atención de ayer se reprogramó por acceso inseguro, con motivo y riesgo declarado. Las atenciones que quedan pendientes por falta de transporte nunca desaparecen: se resuelven el mismo día o se avisa a Dirección Técnica.</p>
    </div>`;
}

/* ---------- vista: Ruta / tracking (coordinación) ---------- */
function renderRutasMapa() {
  const temporal = typeof hdDesignE2E08S3TemporalProjection === "function" ? hdDesignE2E08S3TemporalProjection() : null;
  const vehicleRows = VEHICLES.map((v) => {
    const projected = v.id === "m1" && temporal?.departureObserved
      ? { ...v, status: "moving", note: `En ruta · vehicle_departure_observed ${temporal.scheduledDeparture}; GPS no demuestra atención` }
      : v;
    const st = VEHICLE_STATUS[projected.status];
    return `<tr><td><b>${esc(projected.label)}</b></td><td><span class="veh-status" style="color:${st.color}">● ${st.label}</span></td><td>${esc(projected.note)}</td><td>reporte ${esc(projected.reportedAgo)}</td></tr>`;
  }).join("");
  return `
    <h1 class="view-title">Recorridos y móviles</h1>
    <p class="view-subtitle">El recorrido planificado y cómo va el día. La posición de los móviles es un reporte con hora: estar ahí no demuestra que la visita o la atención se haya realizado.</p>
    ${contextBanner()}
    <div class="map-canvas block">
      ${mapSvg({ circuits: ["m1", "m2"], vehicles: ["m1", "m2"], showCensus: false })}
      ${mapLegend()}
      <div id="stop-pop"></div>
    </div>
    <div class="block">
      <h2>Posición de los móviles</h2>
      <div class="table-scroll" role="region" aria-label="Posición de los móviles" tabindex="0"><table class="data">
        <thead><tr><th>Móvil</th><th>Estado</th><th>Situación</th><th>Último reporte</th></tr></thead>
        <tbody>${vehicleRows}</tbody>
      </table></div>
      <p class="map-note">Si un móvil no reporta hace más de 35 min se muestra «sin señal»; no se supone que sigue en ruta ni que la visita se hizo.</p>
    </div>
    ${hdDesignE2E08S3ManifestProjectionHtml()}
    <div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
}

/* ---------- vista: Mi día (roles de terreno) ---------- */
function renderMiDia() {
  const fd = FIELD_DAY[state.role];
  const c = CIRCUITS[fd.circuit];
  const s3OccurrenceId = typeof e2e08S3Occurrence === "function" ? e2e08S3Occurrence().id : "VIS-ROSA-M1-0900";
  const s3Role = ["enfermero-clinico", "tecnico-enfermeria"].includes(state.role);
  const isS3Stop = (stop) => s3Role && stop.visitId === s3OccurrenceId;
  const myStops = c.stops.filter((s) => s.tasks.some((t) => t.role === state.role) && !isS3Stop(s));
  const nextStop = myStops.find((s) => s.status !== "completada") || null;

  const stripStops = c.stops.filter((s) => !isS3Stop(s));
  const strip = stripStops.map((s, i) => {
    const mine = s.tasks.some((t) => t.role === state.role);
    const cls = `day-stop ${s.status} ${mine ? "mine" : "other"} ${s === nextStop ? "next" : ""}`;
    const stateWord = { completada: "✓ registrada", en_curso: "en curso", pendiente: "pendiente" }[s.status];
    return `<div class="${cls}" data-stop="${c.id}:${s.seq}" role="button" tabindex="0" aria-label="Parada ${s.seq} ${esc(s.sector)}">
      <span class="ds-num">${s.seq}</span>
      <span class="ds-window">${esc(s.window.startsWith("antes de") ? s.window.replace("antes de", "tope") : s.window.split("–")[0])}</span>
      <span class="ds-state">${stateWord}</span>
    </div>${i < stripStops.length - 1 ? '<div class="day-link"></div>' : ""}`;
  }).join("");

  const cards = myStops.map((s) => {
    const person = s.personKey ? PEOPLE[s.personKey] : null;
    const myTasks = s.tasks.filter((t) => t.role === state.role);
    const t = myTasks[0];
    const others = s.tasks.filter((x) => x.role !== state.role).map((x) => ROLES.find((r) => r.id === x.role)?.label || x.role).join(" · ");
    const statusLabel = { completada: "Completada", en_curso: "En curso", pendiente: "Pendiente" }[s.status];
    const statusCls = s.status;
    return `<div class="block day-card ${statusCls}">
      <div class="dc-head">
        <span class="dc-order">${s.seq}</span>
        <div>
          <b>${person ? `${esc(person.alias)} · ${person.age} años` : esc(s.alias)}</b>
          ${s === nextStop ? `<span class="next-badge">Su próxima parada</span>` : ""}
          <div class="dc-meta">${esc(s.sector)} · ventana ${esc(s.window)}${s.arrived ? ` · llegada ${esc(s.arrived)}` : ""}</div>
          ${others ? `<div class="dc-meta">Le acompaña en la parada: ${esc(others)}</div>` : ""}
        </div>
        <span class="stop-status ${statusCls}">${statusLabel}</span>
      </div>
      <div class="dc-task">${esc(t.label)}</div>
      <div class="dc-actions">
        <button class="btn ${s.status === "completada" ? "exit" : "primary"}" data-open-scene="${esc(t.scene)}">${s.status === "completada" ? "Ver registro" : "Abrir la tarea"}</button>
      </div>
    </div>`;
  }).join("");

  const done = myStops.filter((s) => s.status === "completada").length;
  const s3Visit = e2e08S3VisitProjectionHtml(state.role);
  return `
    <h1 class="view-title">Mi día</h1>
    <p class="view-subtitle">${esc(fd.rideWith)} · ${esc(c.vehicle)}.</p>
    ${contextBanner()}
    <div class="block">
      <div class="day-strip" aria-label="Secuencia del circuito">${strip}</div>
      <p class="map-note">${esc(fd.note)}</p>
    </div>
    <div class="map-layout day-layout">
      <div class="map-canvas block">
        ${mapSvg({ circuits: [c.id], vehicles: [c.id], showCensus: false, height: 340 })}
        ${mapLegend()}
        <div id="stop-pop"></div>
      </div>
      <div class="day-side">
        <p class="dc-progress">Paradas de su función: ${done} de ${myStops.length} con hitos registrados · el avance se mide por hitos registrados, no por GPS</p>
        ${cards}
      </div>
    </div>
    ${s3Visit}
    <div id="action-result" role="region" aria-label="Resultado de acción"></div>`;
}

/* ---------- enlace de eventos del mapa ---------- */
function bindMapEvents() {
  document.querySelectorAll("[data-stop]").forEach((el) => {
    const openStop = () => {
      const [cid, seq] = el.dataset.stop.split(":");
      const host = document.querySelector("#stop-pop");
      if (host) host.innerHTML = stopPopup(cid, seq);
      bindMapEvents();
    };
    el.addEventListener("click", openStop);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStop(); }
    });
  });
  document.querySelectorAll("[data-census]").forEach((el) => {
    const openCase = () => {
      const id = el.dataset.census;
      const w = (WORK[state.role] || []).find((x) => x.context.includes(id) || x.title.includes(id));
      if (w) openObligation(w.id);
    };
    el.addEventListener("click", openCase);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCase(); }
    });
  });
  document.querySelectorAll("[data-open-scene]").forEach((b) => {
    b.addEventListener("click", () => {
      state.view = "scene";
      state.sceneId = b.dataset.openScene;
      render();
    });
  });
  document.querySelectorAll("[data-filter]").forEach((b) => {
    b.addEventListener("click", () => {
      MAP_FILTERS[b.dataset.filter] = !MAP_FILTERS[b.dataset.filter];
      render();
    });
  });
  document.querySelectorAll("[data-census-row]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.dataset.censusRow;
      const w = (WORK[state.role] || []).find((x) => x.context.includes(id) || x.title.includes(id));
      if (w) openObligation(w.id);
    });
  });
}
