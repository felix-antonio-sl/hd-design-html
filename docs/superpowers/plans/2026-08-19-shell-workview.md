# Shell + WorkView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the shared HODOM shell and WorkView so each human role reaches the next server-authored decision with less visual and cognitive friction, without changing clinical or operational semantics.

**Architecture:** Keep the existing static HTML/CSS/plain-JavaScript stack and existing render pipeline. Change only the shared shell/WorkView composition plus their CSS and focused UX contracts; preserve all data, scene, E2E, authority, map, and action semantics.

**Tech Stack:** HTML, CSS, plain JavaScript, Node/jsdom tests already used by the repository.

**Spec:** `docs/superpowers/specs/2026-08-19-shell-workview-design.md`

## Global Constraints

- No framework, state library, component library, build system, or parallel design-system layer.
- Work ordering remains server-authored; the client must not calculate, reorder, score, or infer priority.
- No automatic opening, confirmation, navigation, or execution of human decisions.
- Preserve role visibility, default-deny, care-unit adaptation, remote states, keyboard behavior, and accessibility.
- Prefer subtraction and consolidation over new components or abstractions.
- Do not change `data.js`, `cases.js`, `scenes.js`, maps, E2E semantics, or authority rules in this atom.

---

### Task 1: Lock the intended Shell + WorkView behavior

**Files:**
- Modify: `tests/test-maqueta-ux.js`

**Interfaces:**
- Consumes: current DOM rendered by `renderShell()` and `renderWork()`.
- Produces: regression contracts for the simplified shell and queue.

- [ ] **Step 1: Add failing assertions for the shell**

Add assertions after selecting `enfermera-coordinadora`:

```js
check("shell: product header omits environment chrome", !$(".app-header .env-chip"));
check("shell: identity keeps person, function and freshness", !!$(".identity .who") && !!$(".identity .fn-chip") && !!$(".identity .cutoff-chip"));
```

Expected baseline: the first assertion fails because `.env-chip` is still rendered inside `.app-header`.

- [ ] **Step 2: Add failing assertions for one-item work**

For `fonoaudiologo`, assert:

```js
check("work_one: uses the same work-card grammar", $$(".work-item").length === 1 && !$(".state-panel [data-open]"));
check("work_one: keeps normal visual weight", !$$(".work-item.hero").length);
check("work_one: still states that it is the only pending task", $("#main").textContent.includes("Esta es su única tarea pendiente"));
```

Expected baseline: `uses the same work-card grammar` fails because the one-item path is a `state-panel` with a separate primary button.

- [ ] **Step 3: Add queue hierarchy assertions**

For `enfermera-coordinadora`, assert:

```js
check("queue: one dominant next item", $$(".work-item.hero").length === 1);
check("queue: orientation is not an alert-like panel", !!$(".queue-orientation") && !$(".ahora-line"));
check("queue: no generic work subtitle competes with orientation", !$("#main > .view-subtitle"));
```

Expected baseline: the orientation assertion fails because the DOM still uses `.ahora-line`.

- [ ] **Step 4: Run the focused UX suite and confirm RED**

Run in the repository's existing development environment:

```bash
cd /home/felix/projects/hd-hsc-os
node /home/felix/projects/hd-design-html/tests/test-maqueta-ux.js
```

Expected: only the new intentional Shell/WorkView assertions fail; pre-existing contracts stay green.

- [ ] **Step 5: Commit the test contract**

```bash
git add tests/test-maqueta-ux.js
git commit -m "test(ux): define shell and workview refactor contract"
```

---

### Task 2: Simplify Shell + WorkView composition

**Files:**
- Modify: `app.js`
- Test: `tests/test-maqueta-ux.js`

**Interfaces:**
- Consumes: `roleDef()`, `workItems()`, `WORK_TITLES`, `WORK_CUES`, `CARE_UNIT`, role-gated navigation helpers.
- Produces: the same navigation and work-item actions with simpler markup and hierarchy.

- [ ] **Step 1: Remove environment chrome from the product header**

In `renderShell()`, remove `.env-chip` from the brand block. The mockup bar remains the only place where development/simulation context is exposed.

- [ ] **Step 2: Extract one shared work-card renderer**

Add immediately before `renderWork()` a local `renderWorkCard(w, { hero = false } = {})` helper containing the existing card anatomy and role-native labels. This is a local extraction only; do not create a component framework.

- [ ] **Step 3: Make the one-item path use the shared card**

Render the message `Esta es su única tarea pendiente.` as `.queue-orientation.single`, then render the item inside `.work-list` through `renderWorkCard(w)` with no hero class and no automatic navigation.

- [ ] **Step 4: Use the shared renderer for multi-item queues**

Replace the duplicated card template with:

```js
const lis = items.map((w, i) => `<li>${renderWorkCard(w, { hero: i === 0 })}</li>`).join("");
```

- [ ] **Step 5: Simplify the multi-item page hierarchy**

Remove the WorkView `WORK_SUBTITLES` line and rename the orientation class from `.ahora-line` to `.queue-orientation`.

- [ ] **Step 6: Run the focused UX suite and confirm GREEN for markup behavior**

```bash
cd /home/felix/projects/hd-hsc-os
node /home/felix/projects/hd-design-html/tests/test-maqueta-ux.js
```

Expected: the new shell/work assertions pass; no old UX contract regresses.

- [ ] **Step 7: Commit composition changes**

```bash
git add app.js tests/test-maqueta-ux.js
git commit -m "refactor(ux): simplify shell and workview composition"
```

---

### Task 3: Consolidate the visual hierarchy instead of stacking overrides

**Files:**
- Modify: `styles.css`
- Test: `tests/test-maqueta-ux.js`

**Interfaces:**
- Consumes: `.queue-orientation`, `.work-item`, `.work-item.hero`, `.identity`, `.fn-chip`, `.cutoff-chip`, `.app-side`.
- Produces: calmer hierarchy using existing semantic tokens only.

- [ ] **Step 1: Replace alert-like queue orientation styling**

Define exactly one queue-orientation rule:

```css
.queue-orientation {
  margin: 0 0 var(--sp-4);
  color: var(--muted);
  font-size: var(--fs-support);
  font-weight: 500;
}
.queue-orientation.single { color: var(--ink); }
```

Delete the obsolete `.ahora-line` rule.

- [ ] **Step 2: Consolidate hero styling to one declaration**

Keep only one `.work-item.hero` rule:

```css
.work-item.hero {
  border-color: var(--hairline-strong);
  box-shadow: var(--elev-2);
  transform: translateY(-1px);
}
```

Delete the earlier heavy-border version and the later duplicate override.

- [ ] **Step 3: Reduce decorative chrome in the identity header**

Keep `.who` as the strongest identity signal. Make function and freshness secondary without pill borders/backgrounds; remove `.scope-chip` from the shared selector because it is not rendered.

- [ ] **Step 4: Preserve semantic risk treatment**

Do not weaken A3/A4, alter action colors, or change risk meaning.

- [ ] **Step 5: Verify CSS source has no duplicate hero/orientation definitions**

```bash
node - <<'NODE'
const fs = require('fs');
const css = fs.readFileSync('/home/felix/projects/hd-design-html/styles.css', 'utf8');
const hero = (css.match(/\.work-item\.hero\s*\{/g) || []).length;
const old = (css.match(/\.ahora-line\s*\{/g) || []).length;
const queue = (css.match(/\.queue-orientation\s*\{/g) || []).length;
if (hero !== 1 || old !== 0 || queue !== 1) process.exit(1);
console.log('PASS shell/workview CSS consolidation');
NODE
```

- [ ] **Step 6: Run relevant suites**

```bash
cd /home/felix/projects/hd-hsc-os
node /home/felix/projects/hd-design-html/tests/test-maqueta-ux.js
node /home/felix/projects/hd-design-html/tests/test-maqueta-contratos.js
node /home/felix/projects/hd-design-html/tests/test-maqueta.js
```

- [ ] **Step 7: Commit visual consolidation**

```bash
git add styles.css
git commit -m "refactor(ui): consolidate shell and work hierarchy"
```

---

### Task 4: Verify breadth and stop at the atom boundary

**Files:**
- No production changes unless verification exposes a direct Shell/WorkView regression.

- [ ] **Step 1: Run the full existing test set**

```bash
cd /home/felix/projects/hd-hsc-os
for t in /home/felix/projects/hd-design-html/tests/test-maqueta*.js; do node "$t" || exit 1; done
```

- [ ] **Step 2: Run syntax and diff checks**

```bash
node --check /home/felix/projects/hd-design-html/app.js
git -C /home/felix/projects/hd-design-html diff --check main...HEAD
git -C /home/felix/projects/hd-design-html diff --name-only main...HEAD
```

Expected implementation scope: `app.js`, `styles.css`, `tests/test-maqueta-ux.js`, plus the approved spec and this plan only.

- [ ] **Step 3: Stop**

Do not proceed into Scene, receipts, case sheet, maps, or role-specific vertical refactors in this branch. Those are separate atoms.
