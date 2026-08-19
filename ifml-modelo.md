# Modelo IFML de la maqueta HODOM-HSC OS

Modelo de flujo de interacción (OMG IFML v1.0) de la maqueta de diseño UI de
`/home/felix/projects/hd-design-html/`, producido en la pasada refactorizadora
estructural del 2026-08-18 con la skill `urn:fxsl:artefacto:ifml` y la
gramática de interacción de Linear (sidebar, paleta ⌘K, teclado) traducida al
sistema visual canónico claro de HODOM (`visual-system.json`: la tensión se
declara, no se improvisa dark-mode).

Fuentes de semántica de negocio (gate de elicitación satisfecho por el
operador, no fabricado): `hd-dt/04-operacional/roles-historias-journeys-
vista-humana.md` (corte 2026-08-18), `mapa-roles-historias-journeys-hodom-
hsc.md`, spec SDD (`experience.json`, `actors.json`, `visual-system.json`).

## 1. Encuadre de la aplicación

| Dimensión | Valor | Constructo |
|---|---|---|
| Plataforma | Web responsive (desktop + móvil) | Extensiones web (`SiteView`, `Page`) + `OM-MSL` en móvil |
| Roles | **34** (internos R01–R14 con R10 default-deny, R15–R16 unidad de cuidado, R17–R18 y las interfaces externas R19–R34) | `OW-MFE` + `Context`/`ViewPoint` por `UserRole` |
| Adaptación | Dinámica por rol y por ancho de dispositivo | `ContextDimension` (UserRole, Device) + `ActivationExpression` |
| Tareas dominantes | navegación, búsqueda, gestión de obligaciones con acuse | familias CN, CS, CM |

## 2. Composición (ViewContainers)

```
SiteView HodomApp (protected: ActivationExpression por UserRole — la maqueta
simula el rol con su selector; la regla de acceso es IA-RBP por rol)
├── conjuntivo { AppHeader, ShellBody }
│     AppHeader: identidad, función, alcance, corte de datos
└── ShellBody: conjuntivo {
      SideNav (service area, patrón OD-SWA; visible por ActivationExpression
               Device.width ≥ 1024; en móvil se sustituye por TopNav según OM-MSL),
      WorkArea
    }
    SideNav: conjuntivo { QuickSwitchTrigger, SecTrabajo, SecVistas }
      · SecTrabajo: item Tareas del día + contador de pendientes
      · SecVistas: items por rol (server-authored)
    WorkArea: XOR [Default = WorkView] {
      WorkView, SceneView, CaseView, SearchView, CensoMapaView,
      RutasMapaView, MiDiaView, MananaView, RecorridosView, NavRootView
    }
    QuickSwitch: Window«Modal» (Landmark desde todo hermano de WorkArea
      vía Ctrl+K / «/» / trigger): conjuntivo { SwitchInput, SwitchList, SwitchFoot }
```

- XOR de WorkArea con **exactamente un Default (WorkView)** — regla
  `xorMustHaveADefaultParent` ✓.
- `WorkView` es **Landmark**: alcanzable desde cada hermano (SideNav
  persistente + crumb superior en SceneView/CaseView).
- `QuickSwitch` como `Window«Modal»`: la semántica de bloqueo de fondo
  importa (foco total en el destino); no se usa para navegación ordinaria.
- **RecorridosView** (vista humana completa, 2026-08-18 tarde): disponible
  solo para funciones de gobierno/auditoría; conjuntivo de tres lentes XOR con
  Default = `EscenariosE2E`:
  - `EscenariosE2E`: las 13 cadenas E2E como `ViewComponent` de pasos
    ordenados; cada chip de rol referencia el `ViewPoint` del rol; los pasos
    del sistema/origen se atenúan (borde discontinuo) con leyenda; cada
    escenario declara su «Rojo si…».
  - `EtapasJ0J10`: strip de 11 etapas (evento SelectEvent → DataFlow en el
    lugar) + panel de la etapa seleccionada (Produce / Entrega-o-recibe /
    Participa) + matriz 34 roles × 11 etapas con ●/○/↔/— según el mapa.
  - `BrechasV01V13`: las 13 preguntas abiertas; referencia, nunca cierre.

## 3. ViewComponents y bindings

| Componente | Tipo | DataBinding / ParameterBinding |
|---|---|---|
| WorkList (en WorkView) | List (orden server-authored; el cliente no reordena) | DataBinding: Obligaciones del rol (filtradas por estado remoto); E2E-01 consume la aceptación coordinadora y la liberación de origen desde su log compartido, sin perderlas al cambiar de rol, y mantiene las valoraciones médica, de Enfermería y de Kinesiología bloqueadas mientras falta llegada. En modo normal V02 no proyecta turno, llamada, despacho ni prealerta futuros. `v02_rehearsal` agrega sólo la siguiente obligación E2E-07 causada por el log vigente. E2E-08 conserva su proyección por actor y trabajo desde su propio log |
| SceneHeader / Alerts / Blocks | Details | DataBinding: Escena de la obligación seleccionada |
| ActionBar | Form (confirm/cancel) | ParameterBinding: actionId → Action; un contenedor `scene-actions` por escena y `#action-result` accesible |
| E2E08Session / EventLog | Details + append-only log | DataBinding: el corte inicial S3 contiene sólo `E2E08-ORD-1` a las 08:14 y los IDs estables `criticalResultRosa`, `E2E08-K-ROSA` y `VIS-ROSA-M1-0900`; review 08:35, disposición 08:40 y partida 08:45 nacen exclusivamente de acciones confirmadas; los estados vigentes se proyectan con helpers específicos sobre eventos inmutables y tiempo monotónico; `intendedReceiver` es intención, no recepción humana |
| CriticalInstruction / PackageReview | Details + Form | DataBinding: última `criticalInstructionRevision` con `packageImpact` + `nursingPlan v5`; SubmitEvent de Enfermería clasifica `sufficient` o `missing` a las 08:35, sin autorizar ni registrar partida; cada review material obtiene un `basisToken` distinto |
| ManifestDisposition | Details + Form | DataBinding: revisión vigente + `basisToken`; SubmitEvent de Coordinación mantiene o retiene sólo VIS en el manifiesto M1 y revalida la base antes del ActionEvent |
| VehicleDeparture | Details + Form role-safe | DataBinding: último `vehicle_departure_observed` o `vehicle_departure_blocked`; el conductor sólo ve M1, hora y cambio logístico, sin persona, resultado crítico, plan ni log clínico |
| CareCancellation | Details + Form role-safe | DataBinding: orden médica de cancelación y mensaje de continuidad; paciente/cuidador pueden acusar el mensaje, pero la interfaz no infiere lectura antes de `care_unit_message_acknowledged` |
| E2E07Rehearsal / EventLog | Details + Forms role-safe + append-only log | DataBinding: sesión in-memory exclusiva del modo `v02_rehearsal`; llamada 131 sintética → rescate simulado → despacho simulado observado o bloqueado → prealerta simulada → acuse UEA simulado. El banner persistente declara que el modo no llama, envía, despacha ni confirma atención real; salir del modo reinicia la sesión |
| E2E01AdmissionHandoff / EventLog | Details + Forms role-safe + append-only log | DataBinding: sesión in-memory `admissionHandoffJorge`; la entrega informacional no libera. Coordinación produce una sola vez `coordination_accepted` v1 y HODOM asume responsabilidad; Origen sólo entonces puede producir una sola vez `origin_release_recorded` v2 referenciado a v1. Receipts y log hacen legibles evento/versión previa, actor, origen, receptor y siguiente receptor o hito; los `data-*` son sólo soporte de máquina. Ninguno de esos eventos prueba llegada ni habilita valoraciones clínicas |
| CaseSheet (Pulso/Plan/Pasado + cinta J0–J10) | Details con vistas alternativas (OD-MWA) | ParameterBinding: caseId; lens como selección en el lugar. Para Jorge, responsabilidad, pulso y plan proyectan v1/v2 desde `admissionHandoffJorge` sin inferir llegada; Pasado preserva la espera histórica y anexa v1/v2 como eventos de sesión sin timestamp inventado |
| SearchInput/Results (SearchView) | List | ParameterBinding: query (DataFlow en el lugar); la fila de Jorge consume la misma proyección E2E-01 que Censo y Ficha |
| CensusMap / RouteMap / MiDia | MapView (extensión mobile reutilizada en web) | ParameterBinding: caseId, circuitId, stopSeq; Censo proyecta v1/v2 de Jorge sin cambiar su clasificación ni inferir ubicación/llegada. La proyección de VIS/M1 deriva del EventLog (pre-salida: preparación; post-salida: M1 en ruta; VIS programada o cancelada) y declara que GPS no prueba visita ni atención |
| SwitchList (QuickSwitch) | List agrupada (Vistas · Tareas · Casos según IA-RBP) | ParameterBinding: query (DataFlow); tipo+id al elegir (NavigationFlow) |
| MananaBoard | Details + MapView | DataBinding: necesidades vs capacidad (TOMORROW) |
| BrechasBoard | Details (tablas V01–V13, E2E-01–13) | DataBinding: referencia estática declarada |

## 4. Eventos y flujos

| Evento | Tipo | Flujo | Destino |
|---|---|---|---|
| selectWorkItem | ViewElementEvent (SelectEvent) | NavigationFlow (obligationId) | SceneView |
| selectNavItem (SideNav/TopNav) | ViewElementEvent | NavigationFlow | vista destino |
| crumbUp («← Tareas del día», CN-UP) | ViewElementEvent | NavigationFlow | WorkView |
| backFromCase (CN-BACK) | ViewElementEvent | NavigationFlow | vista de origen |
| confirmAction | SubmitEvent | Action (server-authored) → ActionEvent | OutcomeReceipt / RecoveryPanel |
| blockedAction | SelectEvent | NavigationFlow en el lugar | RecoveryPanel (blocked_explainable) |
| quickSwitchOpen (Ctrl+K, «/», trigger) | ViewElementEvent | NavigationFlow | QuickSwitch (Modal) |
| quickSwitchInput | ViewElementEvent | **DataFlow** (filtro en el lugar) | SwitchList |
| quickSwitchSelect | SelectEvent | NavigationFlow (tipo+id) | WorkView/SceneView/CaseView |
| quickSwitchEsc / backdrop | ViewElementEvent | NavigationFlow | contenedor invocador |
| arrowKeys (WorkList) | ViewElementEvent | DataFlow (foco en el lugar) | WorkList |
| lensSelect (ficha) | SelectEvent | NavigationFlow en el lugar | CaseView |
| openOnlyWork | ViewElementEvent (`Abrir la tarea`) | NavigationFlow | SceneView de la única obligación |
| sessionExpired | SystemEvent | NavigationFlow | overlay de reautenticación |
| e2e08Communication / e2e08Timeout0822 | SubmitEvent | ActionEvent unidireccional | Receipt de comunicación o Recovery reguladora; no crea conducta clínica |
| e2e08Conduct / e2e08Reconcile | SubmitEvent | ActionEvent con autoría | Outcome clínico directo/regulador o conflicto sin overwrite |
| reviewE2E08Package | SubmitEvent | Action one-shot con autoría de Enfermería y escritura append-only; guard exige instrucción material vigente | PackageReviewReceipt 08:35; la suficiencia no autoriza partida y habilita la obligación coordinadora |
| decideE2E08VisitDisposition | SubmitEvent | Action one-shot, fail-closed sin review vigente y con revalidación del `basisToken` capturado al confirmar | ManifestDispositionReceipt 08:40 o RecoveryPanel por conflicto; decide VIS, no la salida total del móvil; sólo una disposición vigente habilita el hito logístico |
| recordE2E08VehicleDeparture | SubmitEvent | Action logística one-shot y role-safe | Receipt `vehicle_departure_observed` / `vehicle_departure_blocked` 08:45; permite inferencia causal limitada, no atención |
| materialCriticalInstructionChange | SubmitEvent | Action médica con `packageImpact` y guard por hito logístico | Pre-salida invalida sólo review/decisión existentes y proyecta Enfermería → Coordinación; post-salida conserva partida y crea continuidades médica/coordinadora separadas; no sobrescribe eventos previos |
| cancelE2E08Visit / urgentReferralIntent | SubmitEvent | Actions médicas separadas | VIS `cancelled_by_medical_order` + recovery A4/handoff; no afirma recepción, traslado ni cuidado |
| acknowledgeOrder / withdrawVisit / amendRoute / contactDriver | SubmitEvent | Actions coordinadora y logística separadas | Acuse de orden y retiro de VIS son secuenciales; sólo si existe `vehicle_departure_observed`, Coordinación registra `route_amendment_initiated` y `driver_contact_attempted` como hechos distintos, y el conductor acusa o falla el cambio; una partida previa permanece |
| acknowledgeCareUnitMessage | SubmitEvent | Action de paciente/cuidador | `care_unit_message_acknowledged`; hasta entonces el mensaje no se presenta como leído |
| recordSynthetic131Call | SubmitEvent de cuidador | ActionEvent append-only `synthetic_131_call_recorded` | Proyecta la obligación reguladora sólo dentro del ensayo; no activa ni envía al 131 real |
| simulateV02Rescue | SubmitEvent de médico regulador | ActionEvent append-only `simulated_rescue_requested` | Proyecta solicitud SAMU simulada; UEA todavía no recibe prealerta |
| recordSimulatedDispatch | SubmitEvent de SAMU | XOR de outcomes append-only `simulated_dispatch_observed` / `simulated_dispatch_blocked` | Observado proyecta prealerta UEA; bloqueado detiene la cadena y abre Recovery reguladora sin acuse |
| acknowledgeSimulatedPrealert | SubmitEvent de UEA | ActionEvent append-only `simulated_prealert_acknowledged` | Retira la obligación UEA y muestra al regulador cierre/continuidad simulados sin afirmar llegada, traslado completo ni atención |
| leaveV02Rehearsal | ViewElementEvent del selector de maqueta | NavigationFlow a WorkView + descarte de sesión in-memory | El modo normal no hereda log, obligaciones, receipt ni recovery; reingresar empieza en la llamada sintética del cuidador |
| acceptJorgeHandoff | SubmitEvent de Enfermera coordinadora | ActionEvent append-only `coordination_accepted` v1, con origen, receptor que acepta, siguiente receptor y outcome | Retira `OBL-CO-02`, transfiere responsabilidad a HODOM y proyecta liberación en Origen + llegada pendiente en Medicina, Enfermería, Kinesiología, Ficha, Buscar y Censo; no infiere liberación, llegada ni evaluación |
| releaseJorgeFromOrigin | SubmitEvent de Enfermería/TENS origen | ActionEvent append-only `origin_release_recorded` v2 cuya procedencia es `coordination-accepted-v1` | Retira `OBL-EO-01` sin resurrección entre roles; declara traslado posible y mantiene llegada pendiente |
| openJorgeFirstEvaluation | SelectEvent bloqueado para Medicina, Enfermería y Kinesiología | NavigationFlow en el lugar a RecoveryPanel | Antes de v1 explica aceptación pendiente; después de v1/v2 reconoce responsabilidad HODOM, pero las tres valoraciones permanecen bloqueadas hasta un futuro hito autorizado de llegada |

Ningún `Event` interactivo queda colgado (regla 3) — verificado por suites.

## 5. Patrones aplicados (catálogo `urn:fxsl:kb:ifml-patrones`)

| Patrón | Dónde | Nota |
|---|---|---|
| `OW-MFE` | 16 front-ends por rol sobre el mismo dominio | con `Context`/`ViewPoint` implícito por rol |
| `OD-SWA` | ShellBody = SideNav (service area) + WorkArea | desktop |
| `OM-MSL` | móvil: header / content (scroll 1D) / action-bar en flujo normal | sustituye a SideNav por `ActivationExpression` Device |
| `CN-MD` | WorkList → SceneView (master-detail) | master recorrible por teclado (↑↓) |
| `CN-CIM&B` | SideNav + crumb (comandos content-independent) | acorta navegación y vuelta |
| `CN-UP` | crumb superior «← Tareas del día» en SceneView/CaseView | una sola salida up por vista (deduplicada del pie) |
| `CN-BACK` | «← Volver» de CaseView a la vista de origen | cronológica |
| `CS-RSRC` | QuickSwitch restringido por rol (sin Casos sin acceso) | IA-RBP |
| `CS-SRC` | SearchView (búsqueda por keyword con DataFlow) | casos vigentes y cerrados |
| `IA-ROLE` | selector de rol de la barra de maqueta (scaffolding) | rol visible y cambiable |
| `IA-RBP` | ficha/casos/búsqueda vetados a conductor, administrativo, R10, unidad de cuidado | permisos por rol sobre elementos |
| `IA-CEX` | overlay de sesión expirada con reautenticación | expira por timeout |
| `CM-NOTIF` | alertas gobernadas; A3/A4 con acción antes del soporte y gobierno bajo disclosure | actualización por evento del sistema |

Sin desvíos de catálogo: todos los patrones citados con código oficial.

## 6. Validación del modelo

| Invariante | Resultado |
|---|---|
| `xorMustHaveADefaultParent` (WorkArea XOR → un Default) | PASS (Default = WorkView) |
| `defaultMustHaveXorParent` (Default solo bajo XOR) | PASS |
| `Landmark` solo dentro del enclosing común | PASS (WorkView y QuickSwitch dentro de ShellBody/HodomApp) |
| Todo `Event` interactivo con flujo saliente | PASS (suites jsdom ejercitan cada salida) |
| `ParameterBinding` cuando el destino depende del origen | PASS (obligationId, caseId, sceneId, actionId, query, lens, stopSeq) |
| DataFlow discontinuo (sin interacción de navegación) vs NavigationFlow continuo | PASS (filtro paleta, búsqueda, filtro censo, foco ↑↓ = DataFlow) |
| `Action` como referencia a lógica externa (server-authored) | PASS (confirmaciones declaran outcome; el cliente nunca recompone autoridad) |
| `Window«Modal»` solo cuando el bloqueo importa | PASS (QuickSwitch, sesión expirada) |
| `Context`/`ViewPoint` solo si la composición cambia en runtime | PASS (34 roles cambian contenido; paciente/cuidador usan composición de cuidado; ancho cambia SideNav↔TopNav) |

## 7. Supuestos declarados y preguntas abiertas

- **Supuesto (declarado, no fabricado)**: la autenticación y el RBAC real se
  simulan con el selector de rol de la barra de maqueta; el modelo declara
  `SiteView protected` + `IA-RBP`, no el mecanismo de login (fuera de
  alcance de la maqueta).
- **Tensión elevada (no improvisada)**: Linear es dark-mode nativo; su
  gramática estructural (sidebar, paleta, teclado, triage inbox) se adoptó
  sobre el sistema visual claro canónico de HODOM. Si el DT quisiera un
  tema oscuro, es decisión de `visual-system.json`, no de la maqueta.
- **Pregunta abierta (V01)**: la autoría de aceptar/diferir/rechazar sigue
  sin dueño; el modelo la representa como acción bloqueada con explicación,
  nunca como flujo disponible.
- **V02 preservada como brecha institucional**: el selector
  `Ensayo nocturno V02 · no operativo` permite evaluar la cadena causal sin
  presentarla como capacidad vigente. En modo normal se conserva la vía real
  131 de la tarjeta y no aparecen acciones futuras de regulación, SAMU o UEA.
- **E2E-01 parcial y explícito**: la maqueta cierra técnicamente entrega
  informacional → aceptación v1 → liberación v2 y preserva el cambio de
  responsabilidad entre roles, Ficha, Buscar y Censo. Llegada, valoraciones
  clínicas y el resto del ingreso estándar permanecen sin producir; recargar reinicia esta sesión
  sintética y no demuestra persistencia institucional.
- **NOT_RUN**: aceptación con usuarios reales, lector de pantalla completo,
  y render visual del diagrama IFD (la skill conserva la responsabilidad
  del modelo correcto; el dibujo es de una herramienta externa).
