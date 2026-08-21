# Modelo IFML de la maqueta HODOM-HSC OS

Modelo de flujo de interacción (OMG IFML v1.0) de la maqueta de diseño UI de
`/home/felix/projects/hd-design-html/`, producido en la pasada refactorizadora
estructural del 2026-08-18 con la skill `urn:fxsl:artefacto:ifml` y la
gramática de interacción de Linear (sidebar, paleta ⌘K, teclado) traducida al
sistema visual canónico claro de HODOM (`visual-system.json`: la tensión se
declara, no se improvisa dark-mode).

Fuente exclusiva de semántica de negocio (gate de elicitación satisfecho por
el operador, no fabricado): `hd-dt/04-operacional/roles-historias-journeys-
vista-humana.md`. Los artefactos visuales del repositorio sólo gobiernan la
presentación de la maqueta, no agregan hechos ni autoridad de dominio.

## 1. Encuadre de la aplicación

| Dimensión | Valor | Constructo |
|---|---|---|
| Plataforma | Web responsive (desktop + móvil) | Extensiones web (`SiteView`, `Page`) + `OM-MSL` en móvil |
| Roles | **33 actores seleccionables**; R08 sigue en el journey como función requerida, pero `SIN TITULAR` y sin `UserRole` operativo al corte | `OW-MFE` + `Context`/`ViewPoint` sólo para actores actuales; R08 como brecha read-only |
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
  - `BrechasV01V13`: las 13 preguntas abiertas; referencia, nunca cierre. Incluye
    `AbsentSocialRoleGap`, read-only, con R08 requerido, sin titular y V07 abierta.

## 3. ViewComponents y bindings

| Componente | Tipo | DataBinding / ParameterBinding |
|---|---|---|
| WorkList (en WorkView) | List (orden server-authored; el cliente no reordena) | DataBinding: Obligaciones del rol (filtradas por estado remoto); R08 no tiene actor ni lista al corte. E2E-01 consume la aceptación coordinadora y la liberación de origen desde su log compartido, sin perderlas al cambiar de rol, y mantiene las valoraciones médica, de Enfermería y de Kinesiología bloqueadas mientras falta llegada. En modo normal V02 no proyecta turno, llamada, despacho ni prealerta futuros. `v02_rehearsal` agrega sólo la siguiente obligación E2E-07 causada por el log vigente. E2E-08 conserva su proyección por actor y trabajo desde su propio log |
| SceneHeader / Alerts / Blocks | Details | DataBinding: Escena de la obligación seleccionada |
| ActionBar | Form (confirm/cancel) | ParameterBinding: actionId → Action; un contenedor `scene-actions` por escena y `#action-result` accesible |
| E2E08Session / EventLog | Details + append-only log | DataBinding: el corte inicial S3 contiene sólo `E2E08-ORD-1` a las 08:14 y los IDs estables `criticalResultRosa`, `E2E08-K-ROSA` y `VIS-ROSA-M1-0900`; review 08:35, disposición 08:40 y partida 08:45 nacen exclusivamente de acciones confirmadas; los estados vigentes se proyectan con helpers específicos sobre eventos inmutables y tiempo monotónico; `intendedReceiver` es intención, no recepción humana |
| CriticalInstruction / PackageReview | Details + Form | DataBinding: última `criticalInstructionRevision` con `packageImpact` + `nursingPlan v5`; SubmitEvent de Enfermería clasifica `sufficient` o `missing` a las 08:35, sin autorizar ni registrar partida; cada review material obtiene un `basisToken` distinto |
| ManifestDisposition | Details + Form | DataBinding: revisión vigente + `basisToken`; SubmitEvent de Coordinación mantiene o retiene sólo VIS en el manifiesto M1 y revalida la base antes del ActionEvent |
| VehicleDeparture | Details + Form role-safe | DataBinding: último `vehicle_departure_observed` o `vehicle_departure_blocked`; el conductor sólo ve M1, hora y cambio logístico, sin persona, resultado crítico, plan ni log clínico |
| CareCancellation | Details + Form role-safe | DataBinding: orden médica de cancelación y mensaje de continuidad; paciente/cuidador pueden acusar el mensaje, pero la interfaz no infiere lectura antes de `care_unit_message_acknowledged` |
| E2E07Rehearsal / EventLog | Details + Forms role-safe + append-only log | DataBinding: sesión in-memory exclusiva del modo `v02_rehearsal`; llamada 131 sintética → rescate simulado → despacho simulado observado o bloqueado → prealerta simulada → acuse UEA simulado. El banner persistente declara que el modo no llama, envía, despacha ni confirma atención real; salir del modo reinicia la sesión |
| E2E01AdmissionHandoff / EventLog | Details + Forms role-safe + append-only log | DataBinding: sesión in-memory `admissionHandoffJorge`; la entrega informacional no libera. Coordinación produce una sola vez `coordination_accepted` v1 y HODOM asume responsabilidad; Origen sólo entonces puede producir una sola vez `origin_release_recorded` v2 referenciado a v1. Receipts y log hacen legibles evento/versión previa, actor, origen, receptor y siguiente receptor o hito; los `data-*` son sólo soporte de máquina. Ninguno de esos eventos prueba llegada ni habilita valoraciones clínicas |
| CaseSheet (Pulso/Plan/Pasado + cinta J0–J10) | Details con vistas alternativas (OD-MWA) | ParameterBinding: caseId; lens como selección en el lugar. Para Jorge, responsabilidad, pulso y plan proyectan v1/v2 desde `admissionHandoffJorge` sin inferir llegada; Pasado preserva la espera histórica y anexa v1/v2 como eventos de sesión sin timestamp inventado. No es el destino universal de R05–R09: el acceso exige asignación y los contextos R07/Ana, R06/Rosa y R09/Elena permanecen en sus escenas por finalidad |
| SearchInput/Results (SearchView) | List | ParameterBinding: query (DataFlow en el lugar); resultados filtrados por asignación para R05–R07 y R09; R08 no tiene SearchView operativo. La fila de Jorge consume la misma proyección E2E-01 que Censo y Ficha. Las coincidencias declaradas R07 + Ana + `OBL-TS-02`, R06 + Rosa + `OBL-KN-01` y R09 + Elena + `OBL-FN-01` enrutan a su SceneView; 0 o más de 1 obligaciones para la misma escena fallan cerrado. Al volver conserva query y foco |
| AssignedPurposeContext / SessionPrototypeReceipt | Details + Form + receipt de sesión | ParameterBindingGroup: roleId + caseId + obligationId + sceneId + actionId, restringido a tres relaciones declaradas: `tecnico-enfermeria/HOD-2026-0129/OBL-TS-02/atencion-ana-tens`, `kinesiologo/HOD-2026-0131/OBL-KN-01/atencion-rosa-kine` y `fonoaudiologo/HOD-2026-0142/OBL-FN-01/atencion-elena-fono`. Cada escena conserva identidad, obligación, finalidad y paquete genérico de visita, sin Ficha, lentes ni J0–J10. La confirmación retira sólo su obligación durante la sesión y la reapertura es sólo lectura; el receipt declara que no prueba backend ni persistencia clínica |
| R05NursingVisit | Details + Form | ParameterBindingGroup unívoco `enfermero-clinico/HOD-2026-0131/OBL-EN-01/atencion-rosa`; proyecta sobre la escena compartida sólo la finalidad de Enfermería: valorar respuesta observable, ejecutar cuidados indicados, educar con teach-back y registrar. Expone una primaria `en-visita`, no serializa acciones médicas y declara que la confirmación de maqueta no contiene hechos clínicos ni prueba persistencia o recepción externa |
| SecurityAnomalyContainment | Details + Form role-safe | ParameterBindingGroup unívoco `administrador-seguridad/OBL-SEC-04/sistema-anomalia`; sólo identificador interno, concurrencia, bitácora y acción de contención. Suspender la segunda sesión no vuelve atribuibles los accesos: la atribución queda pendiente de confirmación del titular y el rol no obtiene SearchView, CaseSheet ni controles de ficha |
| DriverGeolocationEvidence | Details + Form role-safe bloqueado | ParameterBindingGroup unívoco `conductor/OBL-DR-03/geo-jorge`; declara finalidad, custodia y precisión requerida sin exponer diagnóstico, plan ni ficha. Mientras no exista coordenada, precisión y referencia capturadas, `dr-geo` abre RecoveryPanel, conserva la obligación y no proyecta ubicación verificada ni habilita el programa de mañana |
| SanitaryAuthorizationEvidence | Details + Form de autoridad bloqueado | ParameterBindingGroup unívoco `seremi/OBL-SE-01/fiscalizacion-autorizacion`; las categorías de revisión orientan, pero no equivalen a antecedentes de operación. `se-resolver` permanece bloqueada hasta contar con antecedentes recuperables y atribuibles y una decisión explícita entre autorizar, prorrogar u observar; no produce una resolución ambigua |
| LegalRepresentationScope | Details + Form role-safe bloqueado | ParameterBindingGroup unívoco `representante-legal/OBL-RL-01/representante-alcance`; distingue declaración del representante de verificación competente. El representante no puede auto-verificar su calidad o alcance, ampliar información autorizada ni habilitar decisiones en nombre de la persona; el equipo HODOM verifica el respaldo antes de registrar el alcance |
| ReferralMedicationReconciliation | Details + Form externa bloqueada | ParameterBindingGroup unívoco `medico-derivador/HOD-2026-0140/OBL-EX-02/postulacion-carlos`; muestra el dato de origen pendiente sin acceso a CaseSheet, SearchView ni censo interno. `ex-conciliacion` permanece bloqueada mientras no exista una conciliación con contenido, autoría y procedencia; no fabrica un adjunto ni completa la evaluación por nombrarlo |
| HospitalResidualRiskDecision | Details + Form de autoridad bloqueado | ParameterBindingGroup unívoco `direccion-hospital/OBL-DH-01/direccion-riesgo`; presenta el riesgo residual A3 escalado, pero no serializa una decisión genérica. `dh-decidir` permanece bloqueada hasta seleccionar explícitamente aceptar, reducir, transferir o suspender y declarar plazo y consecuencia |
| WorkforceQualificationEvidence | Details + Form de habilitación bloqueado | ParameterBindingGroup unívoco `gestion-personas/OBL-GP-01/personas-habilitacion`; comparte con Registro administrativo y Dirección Técnica la base vigente de 32/44 horas. `gp-habilitar` permanece bloqueada mientras falten las 12 h teóricas, prácticas y supervisadas; una cuenta provisionada no equivale a autoridad clínica ni a ratificación de terreno |
| MedicationDispensingEvidence | Details + Form de dispensación bloqueado | ParameterBindingGroup unívoco `farmacia/HOD-2026-0131/OBL-FA-01/farmacia-dispensacion`; muestra requisitos y ventana, pero no serializa una entrega sin contenido, hora, custodia y receptor capturados. `fa-dispensar` permanece bloqueada y el cuidador no sustituye el canal institucional para faltantes |
| HomeIAASApplicabilityEvidence | Details + Form de visación bloqueado | ParameterBindingGroup unívoco `iaas/OBL-IA-01/iaas-vigilancia`; enumera condiciones de adaptación al domicilio, pero no equivale al protocolo ni a evidencia de aplicabilidad. `ia-visar` permanece bloqueada hasta aportar evidencia recuperable de que la regla es conocida y ejecutable en los hogares reales |
| DataControlVerificationEvidence | Details + Form de control bloqueado | ParameterBindingGroup unívoco `ti-datos/OBL-TI-01/ti-controles`; distingue estados verificables, ejercicio pendiente y V05 declarada/no cerrada. `ti-verificar` permanece bloqueada mientras cada control no enlace guard vivo, prueba negativa, evidencia y plan recuperables; el checklist no equivale a un control cumplido |
| SpecialistRecommendationEvidence | Details + Form clínica bloqueada | ParameterBindingGroup unívoco `especialista/HOD-2026-0138/OBL-ESP-01/especialista-interconsulta`; no emite una recomendación sin contenido, certeza, alertas y seguimiento capturados. `esp-recomendar` permanece bloqueada, la integración médica sigue pendiente y el plan no cambia |
| DiagnosticCircuitEvidence | Details + Form de circuito bloqueado | ParameterBindingGroup unívoco `imagenologia/HOD-2026-0131/OBL-IMG-01/imagenologia-circuito`; no confirma una citación sin preparación, traslado y retorno capturados. `img-citar` permanece bloqueada y conserva examen, informe e integración pendientes; un hallazgo crítico requiere su circuito de comunicación con acuse |
| BedDemandProposalEvidence | Details + Form de propuesta bloqueado | ParameterBindingGroup unívoco `gestion-camas/OBL-GC-01/camas-cola`; no incorpora un candidato sin motivo, capacidad declarada y restricciones del día recuperables. `gc-proponer` permanece bloqueada, V01 abierta y la evaluación de estabilidad, hogar, cuidador y respuesta en responsables competentes |
| QualityAnalysisEvidence | Details + Form de análisis bloqueado | ParameterBindingGroup unívoco `calidad/OBL-CA-01/calidad-evento`; no abre un análisis sin método, participantes, fecha y voz del usuario recuperables. `ca-analizar` permanece bloqueada, conserva el evento y V06 abiertos y no fabrica acción correctiva, efecto ni verificación |
| CensusMap / RouteMap / MiDia | MapView (extensión mobile reutilizada en web) | ParameterBinding: caseId, circuitId, stopSeq; Censo proyecta v1/v2 de Jorge sin cambiar su clasificación ni inferir ubicación/llegada. La proyección de VIS/M1 deriva del EventLog (pre-salida: preparación; post-salida: M1 en ruta; VIS programada o cancelada) y declara que GPS no prueba visita ni atención |
| SwitchList (QuickSwitch) | List agrupada (Vistas · Tareas · Casos según IA-RBP) | ParameterBinding: query (DataFlow); tipo+id al elegir (NavigationFlow); no serializa identidad, tarea, caso ni acción R08 |
| MananaBoard | Details + MapView | DataBinding: necesidades vs capacidad (TOMORROW) |
| BrechasBoard / AbsentSocialRoleGap | Details read-only (tablas V01–V13, E2E-01–13 + estado R08) | DataBinding: `SOCIAL_ROLE_GAP`; declara `Trabajo social requerido · SIN TITULAR · V07 abierta`, cobertura de Enfermería observada/incompleta/no equivalente y límites, riesgo y plan de cierre pendientes o no determinados; no contiene Form ni Action |
| AbsentSocialRoleProjection | Details read-only reutilizado | DataBinding: `SOCIAL_ROLE_GAP` proyectado en MananaBoard, admisión, CaseSheet y RouteMap. Sustituye asignación, aptitud, evaluación, plan, fecha y tarea social por `SIN TITULAR` y `PENDIENTE / NO DETERMINADA`; una declaración del cuidador conserva autoría local sin afirmar entrega, acuse, evaluación ni red activada |

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
| selectCurrentRole | SelectEvent de la barra de maqueta | NavigationFlow sólo si roleId pertenece al catálogo operativo; el ActionEvent excepcional restaura el rol actual sin navegar | WorkView del actor seleccionado; `trabajador-social` y cualquier roleId forjado fallan cerrado |
| declareCaregiverWithdrawal | SubmitEvent | Action externa limitada a registrar la declaración en la sesión; el ActionEvent normal no crea recepción, evaluación social, plan ni apoyo | Receipt local de la declaración + SceneView con `SIN TITULAR`; continuidad institucional pendiente |
| activateTerritorialSupport / scheduleTerritorialSupport | SubmitEvent bloqueado y explicable | Exceptional ActionEvent mientras consentimiento, urgencia y responsable sigan `PENDIENTES / NO DETERMINADOS` | La necesidad permanece visible; no se infiere solicitud operable, receptor, acuse ni apoyo activado |
| arrowKeys (WorkList) | ViewElementEvent | DataFlow (foco en el lugar) | WorkList |
| lensSelect (ficha) | SelectEvent | NavigationFlow en el lugar | CaseView |
| openOnlyWork | ViewElementEvent (`Abrir la tarea`) | NavigationFlow | SceneView de la única obligación |
| openAssignedPurposeContext | SelectEvent desde WorkView, SearchView u `openCase` | NavigationFlow con roleId + caseId + obligationId + sceneId; exige una relación declarada y una sola obligación para la escena | SceneView R07/Ana, R06/Rosa o R09/Elena; 0 o más de 1 coincidencias no abren vista de caso |
| completeAssignedPurposeContext | SubmitEvent | Action de maqueta identificada por actionId, con resultado conservado sólo en memoria de la sesión | SessionPrototypeReceipt; retira únicamente la obligación declarada, reapertura sólo lectura y recarga reinicia el estado |
| backFromAssignedPurposeContext | ViewElementEvent | NavigationFlow a `sceneFrom` | WorkView o SearchView; desde búsqueda conserva query y devuelve foco a `#q` |
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
| confirmR05NursingVisitRecord | SubmitEvent de Enfermería | ActionEvent sólo en la sesión de maqueta | Confirma la intención de registrar con autoría R05 sin completar un resultado clínico, declarar receptor o acuse, ni demostrar persistencia clínica |
| containConcurrentSecuritySession | SubmitEvent de Administrador de seguridad | ActionEvent de contención sobre la segunda sesión; conserva íntegra la bitácora | OutcomeReceipt mantiene la atribución pendiente de confirmación del titular; no crea autoridad ni acceso clínico |
| requestDriverGeolocationRecord | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falte coordenada + precisión + referencia | RecoveryPanel; no crea captura geográfica, ubicación verificada, atención ni cambio en el programa |
| requestSanitaryAuthorizationResolution | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falten antecedentes recuperables/atribuibles o una decisión inequívoca | RecoveryPanel; conserva `OBL-SE-01` y no emite autorización, prórroga ni observación. `OBL-SE-02` permanece independiente y operable |
| requestLegalRepresentationVerification | SelectEvent bloqueado y explicable | Exceptional ActionEvent cuando el representante intenta verificar su propia calidad o alcance | RecoveryPanel; conserva `OBL-RL-01`, no amplía información autorizada ni habilita decisiones. La verificación sigue en el equipo HODOM |
| requestReferralMedicationReconciliationAttachment | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falte conciliación con contenido + autoría + procedencia | RecoveryPanel; conserva `OBL-EX-02`, la evaluación pendiente y la responsabilidad clínica en origen. No produce archivo, receipt, completitud ni decisión de admisión; `OBL-EX-01` permanece independiente |
| requestHospitalResidualRiskDecision | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falte alternativa explícita + plazo + consecuencia | RecoveryPanel; conserva `OBL-DH-01` y el riesgo pendiente. No produce autorización, mitigación, transferencia, suspensión ni efecto aparente sobre cartera, dotación o cobertura |
| requestWorkforceQualification | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras la inducción vigente sea 32/44 | RecoveryPanel; conserva `OBL-GP-01`, la habilitación y asignación a terreno bloqueadas y los actos separados de Gestión de Personas, Dirección Técnica y Seguridad. No produce 44/44, competencia observada, ratificación ni autoridad clínica |
| requestMedicationDispensingConfirmation | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falten contenido + hora + custodia + receptor de entrega | RecoveryPanel; conserva `OBL-FA-01` y la ventana terapéutica pendiente. No produce preparación, dispensación, entrega, administración ni receipt; el cuidador no media el faltante |
| requestHomeIAASApproval | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falten protocolo + evidencia de aplicabilidad/conocimiento/ejecución | RecoveryPanel; conserva `OBL-IA-01`, la visación y la oxigenoterapia pendientes. No produce protocolo vigente, regla ejecutable ni habilitación de terreno |
| requestDataControlVerification | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falte guard + prueba negativa + evidencia/plan por control | RecoveryPanel; conserva `OBL-TI-01`, el ejercicio de contingencia pendiente y V05 abierta. No produce verificación, plan ni cierre de control aparente |
| requestSpecialistRecommendation | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falten recomendación + certeza + alertas + seguimiento | RecoveryPanel; conserva `OBL-ESP-01` y la integración médica pendiente. No produce contenido clínico, obligación médica, cambio de plan ni receipt |
| requestDiagnosticCircuitConfirmation | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falten citación + preparación + traslado + retorno | RecoveryPanel; conserva `OBL-IMG-01`, episodio y plan. No produce examen citado, circuito ejecutable, informe, integración ni receipt |
| requestBedDemandProposal | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falten candidato + motivo + capacidad declarada + restricciones | RecoveryPanel; conserva `OBL-GC-01`, cola y V01. No produce propuesta, aceptación, cupo, traslado ni receipt |
| requestQualityAnalysis | SelectEvent bloqueado y explicable | Exceptional ActionEvent mientras falten método + participantes + fecha + voz del usuario | RecoveryPanel; conserva `OBL-CA-01`, evento y V06 abiertos. No produce análisis realizado, acción correctiva, efecto, verificación ni receipt |

Ningún `Event` interactivo queda colgado (regla 3) — verificado por suites.

## 5. Patrones aplicados (catálogo `urn:fxsl:kb:ifml-patrones`)

| Patrón | Dónde | Nota |
|---|---|---|
| `OW-MFE` | 16 front-ends por rol sobre el mismo dominio | con `Context`/`ViewPoint` implícito por rol |
| `OD-SWA` | ShellBody = SideNav (service area) + WorkArea | desktop |
| `OM-MSL` | móvil: header / content (scroll 1D) / action-bar en flujo normal | sustituye a SideNav por `ActivationExpression` Device |
| `CN-MD` | WorkList → SceneView (master-detail); búsqueda/asignación R07 de Ana, R06 de Rosa y R09 de Elena → su misma SceneView | master recorrible por teclado (↑↓); cada finalidad conserva un único contexto desde las tres entradas |
| `CN-CIM&B` | SideNav + crumb (comandos content-independent) | acorta navegación y vuelta |
| `CN-UP` | crumb superior «← Tareas del día» en SceneView/CaseView | una sola salida up por vista (deduplicada del pie) |
| `CN-BACK` | «← Volver» de CaseView a la vista de origen | cronológica |
| `CS-RSRC` | QuickSwitch restringido por rol (sin Casos sin acceso) | IA-RBP |
| `CS-SRC` | SearchView (búsqueda por keyword con DataFlow) | casos vigentes y cerrados |
| `IA-ROLE` | selector de rol de la barra de maqueta (scaffolding) | sólo actores actuales; R08 ausente y roleId forjado producen salida excepcional sin cambio de contexto |
| `IA-RBP` | ficha/casos/búsqueda vetados a conductor, administrativo, R08 ausente, R10 y unidad de cuidado; R05–R07/R09 limitados a casos asignados | el guard se aplica también al abrir por ID; las relaciones declaradas R07/Ana, R06/Rosa y R09/Elena enrutan a su escena de finalidad y fallan cerrado si la coincidencia de escena no es única |
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
| `ParameterBinding` cuando el destino depende del origen | PASS (obligationId, caseId, sceneId, actionId, query, lens, stopSeq; los contextos por finalidad usan roleId + caseId + obligationId + sceneId + actionId) |
| DataFlow discontinuo (sin interacción de navegación) vs NavigationFlow continuo | PASS (filtro paleta, búsqueda, filtro censo, foco ↑↓ = DataFlow) |
| `Action` como referencia a lógica externa (server-authored) | PASS (confirmaciones declaran outcome; el cliente nunca recompone autoridad) |
| `Window«Modal»` solo cuando el bloqueo importa | PASS (QuickSwitch, sesión expirada) |
| `Context`/`ViewPoint` solo si la composición cambia en runtime | PASS (33 actores seleccionables cambian contenido; R08 es Details read-only, no ViewPoint; paciente/cuidador usan composición de cuidado; ancho cambia SideNav↔TopNav) |

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
- **R08 ausente, sin contrato inventado**: el selector, QuickSwitch, Ficha y
  SearchView no ofrecen identidad ni trabajo de `trabajador-social`. La
  función permanece visible al DT en Brechas y se proyecta read-only en las
  superficies que antes afirmaban cobertura o evaluación: Mañana, admisión,
  planes de caso, declaración del cuidador y parada histórica. Coordinación no
  recibe una obligación sustituta. R34 conserva su superficie, pero sus eventos
  quedan bloqueados mientras faltan los parámetros ratificados. Este corte no
  modela gate de admisión, owner operacional, receptor universal,
  consentimiento, canal, fallback, acuse ni cierre de V07.
- **V02 preservada como brecha institucional**: el selector
  `Ensayo nocturno V02 · no operativo` permite evaluar la cadena causal sin
  presentarla como capacidad vigente. En modo normal se conserva la vía real
  131 de la tarjeta y no aparecen acciones futuras de regulación, SAMU o UEA.
- **E2E-01 parcial y explícito**: la maqueta cierra técnicamente entrega
  informacional → aceptación v1 → liberación v2 y preserva el cambio de
  responsabilidad entre roles, Ficha, Buscar y Censo. Llegada, valoraciones
  clínicas y el resto del ingreso estándar permanecen sin producir; recargar reinicia esta sesión
  sintética y no demuestra persistencia institucional.
- **R07/Ana limitado a la maqueta**: se asume la existencia de insumos
  requeridos confirmados y de un canal institucional operativo con supervisora
  y laboratorio, sin inventar marcas, cantidades, teléfonos ni infraestructura.
  El resultado vive sólo durante la sesión, no representa escritura clínica ni
  demuestra backend, interoperabilidad o persistencia institucional.
- **R06/Rosa limitado a la maqueta**: el paquete declara por separado el plan
  aplicable, las alertas aplicables, los insumos requeridos y los contactos
  operables. Se asume su disponibilidad genérica y un canal institucional con
  coordinación y equipo clínico, sin inventar mediciones, cantidades, marcas,
  teléfonos ni infraestructura. La escena representa la finalidad funcional,
  las condiciones del hogar y el bloqueo de oxigenoterapia pendiente de
  visación IAAS. Su resultado tiene el mismo límite de sesión y no demuestra
  una escritura clínica persistente.
- **R09/Elena limitado a la maqueta**: la escena representa evaluar deglución,
  comunicación, voz y cognición; intervenir midiendo respuesta; educar sin
  delegar evaluaciones profesionales; y proponer recomendaciones para el plan
  común. El paquete separa indicación, alertas, insumos y contactos, asumidos
  disponibles de forma genérica. No preafirma diagnóstico, hallazgos,
  resultados, fechas ni evaluación completada; su receipt de sesión tampoco
  demuestra escritura clínica, backend o persistencia institucional.
- **NOT_RUN**: aceptación con usuarios reales, lector de pantalla completo,
  y render visual del diagrama IFD (la skill conserva la responsabilidad
  del modelo correcto; el dibujo es de una herramienta externa).
