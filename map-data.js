/* ============================================================
   TERRITORIO Y DÍA OPERACIONAL — maqueta HODOM-HSC OS.
   Mapa esquemático (sin tiles ni red): coordenadas ficticias en
   un viewBox propio. Ninguna coordenada corresponde a un
   domicilio real. Vocabulario según el estándar de logística
   territorial HSC (2026-07-22): circuito = planificación;
   ruta = ejecución; GPS no prueba visita ni atención.
   ============================================================ */

/* ---------- Geometría esquemática del territorio ---------- */
const TERRITORY = {
  viewBox: "0 0 840 560",
  /* macrozonas según clasificación del estándar (estructurada objetivo) */
  zones: [
    { id: "urbano",    label: "San Carlos urbano",           path: "M300,190 L460,180 L500,280 L450,380 L320,370 L280,280 Z", labelPos: { x: 312, y: 344 } },
    { id: "periurbano",label: "Periurbano / rural",          path: "M180,120 L300,190 L280,280 L320,370 L450,380 L500,280 L460,180 L560,150 L620,260 L580,420 L430,480 L260,450 L150,320 Z", labelPos: { x: 196, y: 260 } },
    { id: "niquen",    label: "Extensión Ñiquén/San Gregorio", path: "M220,30 L420,25 L460,110 L300,150 L180,120 Z", labelPos: { x: 232, y: 48 } },
    { id: "sanfabian", label: "Extensión San Fabián",        path: "M480,30 L700,40 L720,130 L560,150 L470,110 Z", labelPos: { x: 492, y: 48 } },
    { id: "sannicolas",label: "Extensión San Nicolás",       path: "M560,300 L720,280 L760,420 L640,520 L580,420 L620,340 Z", labelPos: { x: 572, y: 318 } }
  ],
  roads: [
    { id: "r-norte",  label: "Ruta N-5 (norte)",  path: "M390,280 L395,220 L400,140 L380,70" },
    { id: "r-oeste",  label: "Camino Población B", path: "M390,280 L330,290 L240,300 L180,310" },
    { id: "r-sur",    label: "Ruta San Nicolás",  path: "M390,280 L470,320 L600,350 L690,400" },
    { id: "r-fabian", label: "Camino San Fabián", path: "M400,140 L480,110 L580,90" }
  ],
  places: [
    { id: "hsc",   label: "Hospital San Carlos (base)",             x: 390, y: 280, kind: "base",     anchor: "middle", labelDy: 24 },
    { id: "lab",   label: "Laboratorio",                            x: 432, y: 254, kind: "facility", anchor: "start" },
    { id: "cesfam",label: "CESFAM Centro",                          x: 330, y: 312, kind: "facility", anchor: "end" },
    { id: "muni",  label: "Municipalidad",                          x: 356, y: 296, kind: "facility", anchor: "end", labelUp: true }
  ]
};

/* ---------- Censo sobre el territorio (proyección con corte) ----------
   precision: exacta | aproximada | centroide — la precisión se
   declara; un centroide nunca se presenta como domicilio exacto. */
const CENSUS = [
  { id: "HOD-2026-0131", personKey: "rosa",  x: 360, y: 230, sector: "Villa A · urbano",        zone: "urbano",     precision: "exacta",    state: "activo",    today: "Visita 10:30 · resultado crítico pendiente de conducta", risk: "A4" },
  { id: "HOD-2026-0129", personKey: "ana",   x: 240, y: 300, sector: "Población B · periurbano", zone: "periurbano", precision: "exacta",    state: "activo",    today: "TENS 10:15 · alerta social",             risk: "A3" },
  { id: "HOD-2026-0117", personKey: "luis",  x: 398, y: 300, sector: "Centro · urbano",          zone: "urbano",     precision: "exacta",    state: "activo",    today: "Cierre en preparación · APS sin acuse",  risk: "A2" },
  { id: "HOD-2026-0142", personKey: "elena", x: 400, y: 150, sector: "Sector Norte · periurbano", zone: "periurbano", precision: "aproximada", state: "postulado", today: "Verificación clínica completa · decisión pendiente (V01)", risk: "A3" },
  { id: "HOD-2026-0138", personKey: "jorge", x: 390, y: 280, sector: "En origen (Medicina Interna)", zone: "urbano",  precision: "exacta",    state: "postulado", today: "Transferencia sin aceptar · ventana 11:00–13:00", risk: "A3" },
  { id: "HOD-2026-0099", personKey: null, alias: "Pedro S. · 64 años", x: 300, y: 60, sector: "Ñiquén · extensión", zone: "niquen", precision: "centroide", state: "postulado", today: "Postulación rural · evaluación de territorio pendiente", risk: "A2" },
  { id: "HOD-2026-0108", personKey: null, alias: "María T.", x: 365, y: 315, sector: "Centro · urbano", zone: "urbano", precision: "exacta",   state: "egresado",  today: "Egresada hace 3 días · continuidad APS con acuse", risk: "A1" }
];

/* personas sin coordenada verificable: NUNCA se inventa su punto */
const CENSUS_NO_LOCATION = [
  { alias: "Sin asignar: 0 personas", note: "Toda persona del censo tiene coordenada con precisión declarada o permanece fuera del mapa con causa." }
];

/* ---------- Circuitos del período (planificación) y rutas (ejecución) ---------- */
const CIRCUITS = {
  m1: {
    id: "m1", label: "Móvil 1 · Camioneta", vehicle: "Camioneta base 4×4 · JXKL-21",
    driver: "R. Soto", departure: "08:45", state: "en_curso",
    color: "#1F4FD8",
    stops: [
      { seq: 1, x: 360, y: 230, personKey: "rosa", window: "09:00–10:00", sector: "Villa A",
        status: "pendiente", arrived: null, left: null,
        cargo: "insumos de curación", visitId: "VIS-ROSA-M1-0900", s3: true,
        tasks: [
          { role: "enfermero-clinico", label: "Preparación de VIS y paquete · review 08:35 (sin atención)", scene: "atencion-rosa", status: "pendiente", visitId: "VIS-ROSA-M1-0900" },
          { role: "tecnico-enfermeria", label: "Preparación delegada de VIS con supervisión (sin atención)", scene: "atencion-rosa-tens", status: "pendiente", visitId: "VIS-ROSA-M1-0900" }
        ] },
      { seq: 2, x: 240, y: 300, personKey: "ana", window: "10:15–10:45", sector: "Población B",
        status: "completada", arrived: "10:18", left: "10:44",
        cargo: "retiro de muestra con custodia refrigerada",
        tasks: [
          { role: "tecnico-enfermeria", label: "Control de signos y toma de muestra", scene: "atencion-ana-tens", status: "completada" },
          { role: "trabajador-social", label: "Evaluación de sobrecarga del cuidador", scene: "social-ana", status: "en_curso" }
        ] },
      { seq: 3, x: 415, y: 262, personKey: null, alias: "Laboratorio HSC", window: "antes de 12:00", sector: "Base",
        status: "en_curso", arrived: "11:12", left: null,
        cargo: "entrega de custodia de muestra",
        tasks: [
          { role: "conductor", label: "Entregar muestra con cadena de custodia y acuse", scene: "ruta-custodia", status: "en_curso" }
        ] },
      { seq: 4, x: 390, y: 280, personKey: null, alias: "Retorno a base", window: "12:30", sector: "Base",
        status: "pendiente", arrived: null, left: null, cargo: "cierre de hoja y odómetro", tasks: [] }
    ]
  },
  m2: {
    id: "m2", label: "Móvil 2 · SUV", vehicle: "SUV base 4×2 · LWPB-08",
    driver: "H. Vargas", departure: "09:05 (retraso 20 min declarado)", state: "en_curso",
    color: "#B45D0A",
    stops: [
      { seq: 1, x: 400, y: 150, personKey: "elena", window: "07:30–08:15", sector: "Sector Norte",
        status: "completada", arrived: "07:31", left: "08:10",
        cargo: "equipo de evaluación",
        tasks: [
          { role: "fonoaudiologo", label: "Evaluación de deglución con teach-back al cuidador", scene: "atencion-elena-fono", status: "completada" }
        ] },
      { seq: 2, x: 360, y: 230, personKey: "rosa", window: "10:30–11:30", sector: "Villa A",
        status: "pendiente", arrived: null, left: null,
        cargo: "botiquín médico · equipo kinésico",
        tasks: [
          { role: "medico-atencion-directa", label: "Visita, reevaluación y ajuste de plan", scene: "atencion-rosa", status: "pendiente" },
          { role: "kinesiologo", label: "Sesión de marcha supervisada 10 m", scene: "atencion-rosa-kine", status: "pendiente" }
        ] },
      { seq: 3, x: 390, y: 280, personKey: null, alias: "Retorno a base", window: "13:00", sector: "Base",
        status: "pendiente", arrived: null, left: null, cargo: "cierre de hoja y odómetro", tasks: [] }
    ]
  },

  /* Circuitos borrador de mañana (18-08): la propuesta de la coordinación,
   aún sin publicar; las paradas no tienen tareas asignadas todavía. */
  m1m: {
    id: "m1m", label: "Móvil 1 · borrador mañana", vehicle: "Camioneta base 4×4 · JXKL-21",
    driver: "R. Soto", departure: "08:30", state: "borrador",
    color: "#1F4FD8",
    stops: [
      { seq: 1, x: 400, y: 150, personKey: "elena", window: "09:00", sector: "Sector Norte",
        status: "pendiente", arrived: null, left: null, cargo: "equipo de ingreso", tasks: [] },
      { seq: 2, x: 360, y: 230, personKey: "rosa", window: "10:30", sector: "Villa A",
        status: "pendiente", arrived: null, left: null, cargo: "insumos + muestra refrigerada", tasks: [] },
      { seq: 3, x: 415, y: 262, personKey: null, alias: "Laboratorio HSC", window: "tope 13:00", sector: "Base",
        status: "pendiente", arrived: null, left: null, cargo: "custodia de muestra", tasks: [] },
      { seq: 4, x: 390, y: 280, personKey: null, alias: "Retorno a base", window: "13:30", sector: "Base",
        status: "pendiente", arrived: null, left: null, cargo: "cierre de hoja y odómetro", tasks: [] }
    ]
  },
  m2m: {
    id: "m2m", label: "Móvil 2 · borrador mañana", vehicle: "SUV base 4×2 · LWPB-08",
    driver: "H. Vargas", departure: "08:30", state: "borrador",
    color: "#B45D0A",
    stops: [
      { seq: 1, x: 382, y: 288, personKey: "jorge", window: "09:00", sector: "Base → domicilio por verificar",
        status: "pendiente", arrived: null, left: null, cargo: "traslado desde Medicina Interna", tasks: [] },
      { seq: 2, x: 240, y: 300, personKey: "ana", window: "10:45", sector: "Población B",
        status: "pendiente", arrived: null, left: null, cargo: "control de signos", tasks: [] },
      { seq: 3, x: 360, y: 230, personKey: "rosa", window: "11:45", sector: "Villa A",
        status: "pendiente", arrived: null, left: null, cargo: "equipo kinésico", tasks: [] },
      { seq: 4, x: 398, y: 272, personKey: null, alias: "Retorno a base", window: "13:00", sector: "Base",
        status: "pendiente", arrived: null, left: null, cargo: "cierre de hoja y odómetro", tasks: [] }
    ]
  }
};

/* ---------- Telemetría de móviles (observación con frescura) ----------
   La posición reportada no demuestra visita, atención ni cobertura:
   es una observación técnica con fuente y tiempo (K10/K13). */
const VEHICLES = [
  { id: "m1", label: "Móvil 1 · JXKL-21", x: 415, y: 262, status: "stopped", reported: "11:12", reportedAgo: "hace 6 min", driver: "R. Soto", departure: "08:45", note: "Detenido en Laboratorio HSC · circuito M1 · ventana de salida 08:45; observación pendiente" },
  { id: "m2", label: "Móvil 2 · LWPB-08", x: 384, y: 196, status: "moving",  reported: "11:15", reportedAgo: "hace 3 min", driver: "H. Vargas", note: "En movimiento hacia Villa A · circuito M2" }
];

const VEHICLE_STATUS = {
  moving:   { label: "En movimiento", color: "#0E8755" },
  stopped:  { label: "Detenido",      color: "#1F4FD8" },
  offline:  { label: "Sin señal (>35 min sin reporte)", color: "#52606D" }
};

/* roles de terreno que tienen vista "Mi día" y su circuito asignado hoy */
const FIELD_DAY = {
  "medico-atencion-directa": { circuit: "m2", rideWith: "Móvil 2 · H. Vargas · salida 09:05", note: "Suba en la segunda salida; el resultado crítico requiere comunicación válida antes de registrar conducta." },
  "enfermero-clinico":       { circuit: "m1", rideWith: "Móvil 1 · R. Soto · salida programada 08:45", note: "VIS-ROSA-M1-0900 se prepara a las 08:35; la revisión de paquete no autoriza la salida ni demuestra atención." },
  "kinesiologo":             { circuit: "m2", rideWith: "Móvil 2 · H. Vargas · salida 09:05", note: "Su sesión de hoy es la parada 2 del Móvil 2 (Villa A), después de la visita médica." },
  "tecnico-enfermeria":      { circuit: "m1", rideWith: "Móvil 1 · R. Soto · salida 08:45", note: "Una tarea delegada quedó registrada; la VIS de Rosa sigue en preparación y sin atención hasta que exista el hito correspondiente." },
  "trabajador-social":       { circuit: "m1", rideWith: "Móvil 1 · R. Soto · salida 08:45", note: "Su evaluación en Población B quedó en curso; el registro y la activación de red se completan en la tarea." },
  "fonoaudiologo":           { circuit: "m2", rideWith: "Móvil 2 · H. Vargas · salida 07:30", note: "Su evaluación de esta mañana quedó completada y entregada a quien decide la admisión." }
};
