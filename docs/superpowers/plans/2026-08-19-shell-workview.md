# Shell + WorkView Implementation Plan

> **Execution mode:** inline, atomic, no PR/merge. The branch is `refactor/shell-workview`.

**Goal:** Simplify the shared HODOM shell and WorkView so each human role reaches the next server-authored decision with less visual and cognitive friction, without changing clinical or operational semantics.

**Architecture:** Keep the existing static HTML/CSS/plain-JavaScript stack and render pipeline. Change only Shell/WorkView composition, their CSS, and focused regression contracts; preserve data, scenes, E2E journeys, authority, maps, remote-state semantics, and role visibility.

**Spec:** `docs/superpowers/specs/2026-08-19-shell-workview-design.md`

## Global constraints

- No framework, state library, component library, build system, or parallel design-system layer.
- Work ordering remains server-authored; the client does not calculate, reorder, score, or infer priority.
- No automatic opening, confirmation, navigation, or execution of human decisions.
- Preserve default-deny, care-unit adaptation, remote states, keyboard behavior, and accessibility.
- Prefer subtraction and consolidation over new components or abstractions.
- Do not change `data.js`, `cases.js`, `scenes.js`, maps, E2E semantics, or authority rules in this atom.

## Task 1 — Contract the intended change

**Files:** `tests/test-shell-workview.js`

The repository's broad jsdom suites import jsdom from the sibling checkout `/home/felix/projects/hd-hsc-os`; that runtime is not available in the GitHub-connector execution environment used for this branch. Instead of adding dependencies or a second test framework, this atom adds one dependency-free source contract that can run with plain Node and leaves the existing jsdom suites as the broad regression gate in the normal development checkout.

The focal contract asserts:

- product header has no `.env-chip`;
- one-item WorkView uses the same `renderWorkCard` grammar as multi-item queues;
- one-item queues have no hero treatment or automatic navigation;
- WorkView uses `.queue-orientation` and not `.ahora-line`;
- the generic WorkView subtitle is removed;
- CSS contains exactly one `.work-item.hero` declaration;
- obsolete `.ahora-line` styling is absent;
- CSS contains exactly one `.queue-orientation` declaration.

Status:

- [x] RED conditions were identified against the baseline source.
- [x] Dependency-free focal contract committed.
- [ ] Execute `node tests/test-shell-workview.js` from a materialized checkout of this branch.

## Task 2 — Simplify Shell + WorkView composition

**Files:** `app.js`

Implemented changes:

- [x] Remove environment chrome from the product header; the mockup bar remains the simulation/development surface.
- [x] Keep person, function, and data freshness in the compact product identity.
- [x] Extract one local `renderWorkCard(w, { hero })` helper from duplicated WorkView markup.
- [x] Render one-item queues with the same work-card grammar, normal weight, and explicit `Esta es su única tarea pendiente.` orientation.
- [x] Keep multi-item ordering untouched and give hero emphasis only to item index 0.
- [x] Remove generic `WORK_SUBTITLES` from WorkView's first layer.
- [x] Replace alert-like `ahora-line` markup with semantic `queue-orientation` markup.
- [x] Preserve existing data attributes, open behavior, offline capability projection, care-unit labels, and risk semantics.

Commit: `a36b14d` — `refactor(ux): simplify shell and workview composition`.

## Task 3 — Consolidate visual hierarchy

**Files:** `styles.css`

Implemented changes:

- [x] Remove `.env-chip` styling.
- [x] Remove pill chrome from function/freshness identity metadata.
- [x] Define `.queue-orientation` as integrated secondary typography rather than an alert-like box.
- [x] Remove obsolete `.ahora-line` styling.
- [x] Consolidate three historical hero-related declarations into one restrained `.work-item.hero` rule.
- [x] Remove the unused `.hero-ribbon` rule.
- [x] Preserve existing semantic A1–A4 colors and stronger A3/A4 treatment.

Commit: `68b5271` — `refactor(ui): consolidate shell and work hierarchy`.

## Task 4 — Verification gates

### Fresh source-level verification available in this environment

Verified directly against the current branch through GitHub source reads:

- [x] `app.js` contains no `env-chip` reference.
- [x] `renderWorkCard` occurs once and is used by one-item and multi-item WorkView paths.
- [x] `queue-orientation` occurs in the intended single-item and multi-item paths.
- [x] `app.js` contains no `ahora-line` reference.
- [x] `styles.css` contains exactly one `.work-item.hero` declaration.
- [x] `styles.css` contains zero `.ahora-line` declarations.
- [x] `styles.css` contains exactly one `.queue-orientation` declaration.
- [x] Commit diffs for `app.js` and `styles.css` are confined to Shell/WorkView composition and styling.
- [x] `data.js`, `cases.js`, `scenes.js`, map files, E2E semantics, and authority rules were not modified by the production refactor commits.

### Dynamic verification still required before calling the atom complete

The broad UX suite still contains three historical selector blocks that query `.ahora-line`. They need to be changed to `.queue-orientation` in the normal development checkout before the suite can serve as a green regression gate for this refactor. Do not reintroduce `.ahora-line` into production merely to satisfy the old selector.

Run after materializing this branch into `/home/felix/projects/hd-design-html` with the existing sibling dependencies:

```bash
cd /home/felix/projects/hd-design-html
node tests/test-shell-workview.js

cd /home/felix/projects/hd-hsc-os
node /home/felix/projects/hd-design-html/tests/test-maqueta-ux.js
node /home/felix/projects/hd-design-html/tests/test-maqueta-contratos.js
node /home/felix/projects/hd-design-html/tests/test-maqueta.js
for t in /home/felix/projects/hd-design-html/tests/test-maqueta*.js; do node "$t" || exit 1; done
```

Then run:

```bash
node --check /home/felix/projects/hd-design-html/app.js
git -C /home/felix/projects/hd-design-html diff --check main...HEAD
git -C /home/felix/projects/hd-design-html diff --name-only main...HEAD
```

Expected production diff scope: `app.js` and `styles.css`. Test/docs additions are limited to this atom.

## Stop boundary

Do not proceed into Scene/action hierarchy, confirmations, receipts, case sheet, maps, or vertical role refactors on this branch until the dynamic verification gate above is green. Those are separate atoms and should inherit this grammar only after it is verified.
