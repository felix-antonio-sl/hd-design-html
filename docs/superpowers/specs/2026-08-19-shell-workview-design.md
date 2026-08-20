# Shell + WorkView Refactor Design

## Goal

Refactor the HODOM-HSC interactive mockup's shared shell and WorkView so every human role reaches the right next decision with less visual and cognitive friction, while preserving the existing business semantics, role boundaries, server-authored ordering, accessibility, remote-state behavior, and plain HTML/CSS/JavaScript architecture.

This is the first atom of a broader iterative refactor of the mockup. It establishes the visual and interaction grammar that later role-by-role and component-by-component work will reuse.

## Success condition

The cut is successful when the shell and pending-work surface are simpler, more legible, more proactive, and more role-appropriate without becoming more automated or more abstract.

Concretely:

- the user can identify what requires attention now at first glance;
- there is one dominant visual signal for the next server-authored work item, not several competing signals;
- the product shell exposes only identity, role/function, data freshness, and role-relevant navigation;
- patient/caregiver surfaces remain care-oriented rather than operational-management-oriented;
- the queue preserves the backend-authored order and never invents priority;
- the first layer of each work item contains only decision-relevant information;
- remote states, keyboard navigation, accessibility, default-deny behavior, and role visibility remain intact;
- all 34 modeled human roles still render without structural regressions.

## Constraints

1. Keep the current stack: static `index.html`, `styles.css`, and plain JavaScript modules. Do not add a framework, state library, component library, build system, or design-system package.
2. Do not change clinical or operational meaning in `data.js`, `cases.js`, `scenes.js`, map data, E2E journeys, authority rules, or action semantics unless a direct Shell/WorkView dependency makes a minimal adjustment unavoidable.
3. Work ordering remains server-authored. The client may emphasize the first item but must not calculate, reorder, score, or infer urgency.
4. The UI may guide the user to the next action, but must not auto-open, auto-confirm, auto-navigate, or auto-execute human decisions.
5. Preserve default-deny and role visibility. Showing more because it is convenient is not an acceptable UX simplification.
6. Prefer subtraction, consolidation, and clearer hierarchy over new widgets or abstractions.
7. Reuse the existing semantic color, spacing, typography, radius, motion, and surface tokens. Do not introduce a parallel token system.
8. Preserve the mockup controls as non-product UI; this refactor concerns only the product shell and WorkView below them.

## Design principles

### One dominant cue per decision

The current WorkView can communicate the same idea through the `ahora-line`, the first-card hero styling, and task-specific cue text. The refactor keeps the information but removes redundant emphasis.

For multi-item queues, the first server-authored item is the single visually dominant item. A short queue summary provides count and orientation but does not compete with the first item.

For a one-item queue, the UI states that it is the only pending item without applying hero treatment or artificial urgency.

### Progressive disclosure

The queue answers four questions only:

1. What needs to be done?
2. In what context?
3. How urgent/important is it in language appropriate to this role?
4. When is it due and who receives/responds next?

Provenance, revision identifiers, governance detail, and evidentiary context remain available inside the task/scene rather than on the queue card.

### Role-native language

Internal operational roles may use concepts such as deadline, next responsible party, risk level, and work queue.

Patient and caregiver views use care language such as "Cuándo" and "Quién responde", avoid case identifiers and A0-A4 codes, and remain free of operational sidebars or command palettes.

External roles use language native to their relationship with HODOM, for example postulaciones rather than generic tareas when appropriate.

### Proactive, not presumptive

The interface should reduce the user's search cost by surfacing the next relevant work item and by making continuation obvious after a completed action. It must not convert recommendations into decisions or events.

## Shell

### Product header

The product header contains only:

- HODOM/Hospital identity;
- active human identity;
- active function/role label;
- data freshness/cutoff.

Duplicated scope labels, environment repetition inside the product shell, and decorative chips without decision value are excluded.

The header remains compact and calm. Information hierarchy should come primarily from typography, spacing, and alignment rather than from adding pills and borders.

### Desktop navigation

Desktop keeps the role-scoped sidebar because it provides stable spatial navigation and already matches the IFML service-area model.

Its hierarchy is:

- quick switch trigger;
- `Trabajo` with the current WorkView and pending count;
- `Vistas` containing only the views allowed and useful for the active role.

Governance-only destinations remain hidden from operational roles. Search remains role-gated. The sidebar must not become a general-purpose sitemap.

### Mobile navigation

Mobile keeps the compact top navigation rather than replicating the desktop sidebar. The same access model applies, but labels may be shortened only when meaning remains unambiguous.

### Care-unit shell

Patient and caregiver keep a separate care-oriented shell:

- no operational sidebar;
- no command palette;
- identity expressed as hospitalization-at-home context rather than internal episode code;
- navigation limited to what is meaningful to the care unit.

This is a deliberate role adaptation, not an exception to be normalized away.

## WorkView

### Page hierarchy

For queues with more than one item:

1. page title;
2. concise queue orientation line containing pending count and a role-native instruction;
3. dominant first work item;
4. remaining items with normal visual weight.

For a single item:

1. page title;
2. concise "only pending item" message;
3. the item with normal card styling;
4. no hero emphasis and no automatic navigation.

For empty and remote states, existing explicit state behavior remains authoritative.

### Queue orientation

The orientation line should be typographically integrated with the page instead of rendered as another alert-like box unless the remote state itself requires a panel.

It may say, for example, that four tasks are pending and to start with the most urgent, but it must not repeat the task title or a task-specific rationale already visible on the first card.

### Work card anatomy

Each card uses this order:

1. title/action;
2. compact risk/status label;
3. context;
4. optional one-line task-specific cue only when it adds new actionable meaning;
5. due/when;
6. next responsible party/who responds.

The first card may use subtle elevation or a restrained accent to indicate "next in the server-authored queue". It must not use a heavy black frame, ribbon, second banner, or additional urgency label.

Risk treatment should remain semantically accurate but visually quiet for A1/A2. A3/A4 retain stronger attention/critical semantics where applicable.

### Density and surfaces

Reduce nested boxes and border noise. Cards remain distinct interactive targets, but hierarchy should rely on whitespace, typography, and semantic color before shadows or heavy borders.

Use existing tokens. Consolidate duplicate/overriding `.work-item.hero` and related declarations rather than appending another override layer.

## Interaction and accessibility

Preserve:

- keyboard traversal of the work list;
- quick-switch keyboard behavior for roles that have it;
- focus-visible treatment;
- semantic buttons for actionable cards;
- `aria-current` on current navigation;
- accessible dialog behavior for the quick switch;
- minimum practical touch target sizes on mobile;
- role-safe visibility and default-deny behavior.

Visual simplification must not remove explanatory recovery when an action is blocked.

## Implementation boundaries

Primary implementation files for this atom are expected to be:

- `app.js`: Shell and WorkView markup/composition only;
- `styles.css`: consolidate and simplify shell/work hierarchy and card styling;
- `tests/test-maqueta-ux.js`: adapt/add behavior-level UX contracts;
- optionally `tests/test-maqueta-contratos.js` only if a structural contract belongs there.

Do not split `app.js` or create a component framework as part of this atom. Its size is a known maintainability issue, but solving it now would mix architecture cleanup with the user-facing refactor and violate anti-drift.

## Testing strategy

Use the existing jsdom-based suites as the regression harness. Do not create a new test framework.

The refactor must prove at minimum:

- internal desktop shell retains role identity, WorkView, pending count, and allowed views;
- mobile retains role-scoped top navigation;
- patient and caregiver remain in the care-unit shell without sidebar/palette;
- governance destinations remain absent for operational roles and present for authorized governance roles;
- multi-item queues show exactly one dominant next item;
- queue orientation does not duplicate the first item's title or cue;
- single-item queues have no hero treatment and no automatic navigation;
- first-layer work cards contain title, context, role-appropriate risk/status, due/when, and next responsible/who responds;
- provenance/revision are absent from queue cards;
- patient/caregiver cards expose no A0-A4 codes or internal episode identifiers;
- keyboard work-list navigation still selects/opens the intended item;
- loading, empty, denied, conflict, stale, offline, unavailable, and session-expired states remain renderable;
- all 34 role definitions can render WorkView without exception.

## Acceptance criteria

The atom is complete only when:

1. the existing relevant suites pass after updating expectations that intentionally changed;
2. new assertions demonstrate the reduced cue duplication and 34-role rendering coverage;
3. no new dependency, framework, build step, or parallel abstraction was introduced;
4. `git diff --check` is clean;
5. the diff is limited to the files directly required by Shell + WorkView;
6. the resulting UI has fewer competing first-layer signals than the baseline;
7. no clinical, E2E, role-authority, map, or data semantics changed.

## Follow-on sequence

After this atom is accepted, subsequent refactors should reuse its grammar in small independent cuts:

1. Scene + primary action hierarchy;
2. confirmation/recovery + outcome receipt + continuation;
3. case sheet + search/context recovery;
4. shared clinical/operational components;
5. vertical role-by-role review across all modeled human roles.

Each follow-on cut requires its own bounded design and testable acceptance criteria. This document does not pre-authorize those changes.