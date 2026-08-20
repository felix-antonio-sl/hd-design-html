/* Contrato focal y dependency-free del átomo Shell + WorkView.
   Uso: node tests/test-shell-workview.js */
const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles.css", "utf8");

let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) {
    pass += 1;
    console.log("PASS", name);
  } else {
    fail += 1;
    console.error("FAIL", name);
  }
}

check(
  "shell: product header omits environment chrome",
  !/class="env-chip"/.test(app)
);
check(
  "work: one-item path uses shared work-card grammar",
  /function renderWorkCard\s*\(/.test(app)
    && /items\.length === 1[\s\S]*renderWorkCard\(w\)/.test(app)
    && !/items\.length === 1[\s\S]{0,1200}<div class="state-panel">/.test(app)
);
check(
  "work: queue orientation has one semantic class",
  /class="queue-orientation"/.test(app)
    && !/class="ahora-line"/.test(app)
);
check(
  "work: multi-item WorkView omits generic subtitle",
  !/WORK_SUBTITLES\[r\.id\][\s\S]{0,160}view-subtitle/.test(app)
);
check(
  "css: hero styling is consolidated",
  (css.match(/\.work-item\.hero\s*\{/g) || []).length === 1
);
check(
  "css: obsolete ahora-line styling is removed",
  (css.match(/\.ahora-line\s*\{/g) || []).length === 0
);
check(
  "css: queue orientation is defined once",
  (css.match(/\.queue-orientation\s*\{/g) || []).length === 1
);

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
