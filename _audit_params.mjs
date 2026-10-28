/**
 * Audit module docs: signature / functionalExample vs params / configs.
 * Run: node _audit_params.mjs
 */
import fs from "fs";
import path from "path";
import ts from "typescript";

const ROOT = path.resolve("src/data/modules");
const FILES = [
  "application.ts",
  "auth.ts",
  "redis.ts",
  "orm.ts",
  "service.ts",
  "rest.ts",
  "en/application.ts",
  "en/auth.ts",
  "en/redis.ts",
  "en/orm.ts",
  "en/service.ts",
  "en/rest.ts",
];

function evalExports(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      removeComments: false,
    },
    fileName: filePath,
  });
  // Wrap as ESM with exports captured
  const wrapped = outputText
    .replace(/^export\s+/gm, "")
    .replace(/export\s*\{[^}]*\};?/g, "");
  // Collect export const names from original
  const names = [...src.matchAll(/export\s+const\s+(\w+)/g)].map((m) => m[1]);
  const code = `${wrapped}\nreturn { ${names.join(", ")} };`;
  // eslint-disable-next-line no-new-func
  const fn = new Function(code);
  return fn();
}

/** Extract arg list from a signature string like "foo(a, b?: T): R" or "@Dec(a, b)" */
function parseSignatureArgs(signature) {
  if (!signature || typeof signature !== "string") return null;
  // find first paren group that looks like call signature (skip generics somewhat)
  let start = -1;
  let depth = 0;
  let inStr = null;
  for (let i = 0; i < signature.length; i++) {
    const c = signature[i];
    if (inStr) {
      if (c === inStr && signature[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "(") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === ")") {
      depth--;
      if (depth === 0 && start >= 0) {
        const inside = signature.slice(start + 1, i).trim();
        return { inside, args: splitTopLevel(inside) };
      }
    }
  }
  return null;
}

function splitTopLevel(s) {
  if (!s) return [];
  const parts = [];
  let cur = "";
  let depth = 0;
  let angle = 0;
  let inStr = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      cur += c;
      if (c === inStr && s[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      cur += c;
      continue;
    }
    if (c === "(" || c === "{" || c === "[") depth++;
    if (c === ")" || c === "}" || c === "]") depth--;
    if (c === "<") angle++;
    if (c === ">") angle = Math.max(0, angle - 1);
    if (c === "," && depth === 0 && angle === 0) {
      parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function argMeta(argStr) {
  // name?: type = default  or  ...rest: T
  const m = argStr.match(/^(\.\.\.)?([A-Za-z_$][\w$]*)(\?)?(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?$/);
  if (!m) {
    return { raw: argStr, name: argStr.split(/[?:]/)[0].trim(), optional: /\?/.test(argStr) || /=/.test(argStr) };
  }
  return {
    raw: argStr,
    rest: !!m[1],
    name: m[2],
    optional: !!m[3] || m[5] != null,
    type: m[4]?.trim(),
    default: m[5]?.trim(),
  };
}

/** Extract object literal keys from functionalExample for known call patterns */
function extractOptionKeysFromExample(example) {
  if (!example) return [];
  const findings = [];
  // Match CallName({ ... }) or CallName(something, { ... }) patterns — greedy enough for shallow objects
  const callRe =
    /\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(([^;]*?)\)/gs;
  let m;
  while ((m = callRe.exec(example))) {
    const callee = m[1];
    const argsSrc = m[2];
    // find object literals at top level in args
    const objs = extractTopLevelObjects(argsSrc);
    for (const obj of objs) {
      const keys = objectKeys(obj);
      if (keys.length) {
        findings.push({ callee, keys, snippet: obj.slice(0, 120) });
      }
    }
  }
  return findings;
}

function extractTopLevelObjects(s) {
  const objs = [];
  let depth = 0;
  let objStart = -1;
  let inStr = null;
  let paren = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === inStr && s[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "(") paren++;
    if (c === ")") paren--;
    if (c === "{") {
      if (depth === 0 && paren === 0) objStart = i;
      // only track outermost objects when not nested in other paren? Actually we want objects that are args
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && objStart >= 0) {
        objs.push(s.slice(objStart, i + 1));
        objStart = -1;
      }
    }
  }
  return objs;
}

function objectKeys(objSrc) {
  // strip braces
  const inner = objSrc.slice(1, -1);
  const keys = [];
  let cur = "";
  let depth = 0;
  let inStr = null;
  const flush = () => {
    const t = cur.trim();
    if (!t) return;
    // key: value or shorthand
    const km = t.match(/^([A-Za-z_$][\w$]*)\s*:/) || t.match(/^([A-Za-z_$][\w$]*)\s*$/);
    if (km) keys.push(km[1]);
    cur = "";
  };
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (inStr) {
      cur += c;
      if (c === inStr && inner[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      cur += c;
      continue;
    }
    if (c === "{" || c === "(" || c === "[") depth++;
    if (c === "}" || c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) {
      flush();
      continue;
    }
    cur += c;
  }
  flush();
  return keys;
}

function analyzePage(fileRel, pageName, page) {
  const findings = [];
  let okApis = 0;
  let totalApis = 0;

  for (const section of page.sections || []) {
    const sectionId = section.id;
    const configNames = new Set((section.configs || []).map((c) => c.name));
    const allParamNames = new Set();
    for (const api of section.apis || []) {
      for (const p of api.params || []) allParamNames.add(p.name);
    }

    // --- API signature vs params ---
    for (const api of section.apis || []) {
      totalApis++;
      const sig = api.signature;
      const parsed = parseSignatureArgs(sig);
      const params = api.params || [];
      const paramNames = new Set(params.map((p) => p.name));

      if (!parsed) {
        // no-arg or no signature
        if (!sig) {
          // no signature — skip unless functionalExample below
          okApis++;
          continue;
        }
        // signature without parens (constant / type / property)
        if (!/\(/.test(sig)) {
          okApis++;
          findings.push({
            severity: "low",
            kind: "no-args-or-constant",
            file: fileRel,
            page: pageName,
            sectionId,
            api: api.name,
            missing: `signature without call args: "${sig}" (OK if constant/property)`,
            note: "informational",
          });
          continue;
        }
        okApis++;
        continue;
      }

      const args = parsed.args.map(argMeta).filter((a) => a.name && a.name !== "void");
      // empty () is fine
      if (args.length === 0) {
        okApis++;
        continue;
      }

      const missingArgs = args.filter((a) => !paramNames.has(a.name));
      const hasEmptyParams = !api.params || api.params.length === 0;

      if (hasEmptyParams || missingArgs.length > 0) {
        const requiredMissing = missingArgs.filter((a) => !a.optional);
        const optionalMissing = missingArgs.filter((a) => a.optional);
        let severity = "medium";
        if (requiredMissing.length > 0) severity = "high";
        else if (optionalMissing.length > 0 && missingArgs.every((a) => a.optional)) severity = "medium";
        if (args.every((a) => a.optional) && hasEmptyParams && args.length <= 1 && /option|config|opts/i.test(args[0]?.name || "")) {
          severity = "medium";
        }

        findings.push({
          severity,
          kind: "signature-params-gap",
          file: fileRel,
          page: pageName,
          sectionId,
          api: api.name,
          signature: sig,
          missing: hasEmptyParams
            ? `has signature with ${args.length} arg(s) [${args.map((a) => a.raw).join(", ")}] but ${api.params ? "empty" : "no"} params`
            : `signature args undocumented in params: ${missingArgs.map((a) => a.raw).join(", ")} (have: [${[...paramNames].join(", ")}])`,
          requiredMissing: requiredMissing.map((a) => a.name),
          optionalMissing: optionalMissing.map((a) => a.name),
        });
      } else {
        okApis++;
      }
    }

    // --- functionalExample object keys vs params/configs ---
    const fe = section.functionalExample;
    if (fe && !section.functionalExampleTitle?.match(/配置|Config|YAML|Error|Response|形态/i)) {
      const optionCalls = extractOptionKeysFromExample(fe);
      // Also scan for YAML-like is skip; for JS object keys
      for (const call of optionCalls) {
        // skip decorator-ish or Response shapes
        const undocumented = call.keys.filter(
          (k) =>
            !allParamNames.has(k) &&
            !configNames.has(k) &&
            !["ok", "code", "msg", "data", "message", "success"].includes(k)
        );
        if (undocumented.length === 0) continue;

        // Heuristic: if section has configs documenting these OR another section — only flag if
        // section's own params/configs don't cover AND apis suggest options objects
        const apisMentionOptions = (section.apis || []).some(
          (a) =>
            /option|config|Option|Config/i.test(a.signature || "") ||
            /option|config|Option|Config/i.test(a.name) ||
            (a.params || []).some((p) => /option|config|Option|Config/i.test(p.name) || /option|config|Option|Config/i.test(p.type))
        );
        const looksLikeFactory =
          /^(Auth|Log|Logger|Json|Redis|Service|Application\.(registry|GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)|configure|configureOrm|configureSchedule|ObjectMapper\.configure|registerHandler)/.test(
            call.callee
          ) ||
          call.callee.includes("configure") ||
          call.callee.includes("registry") ||
          /\.(GET|POST|PUT|DELETE|PATCH)\b/.test(call.callee);

        if (!looksLikeFactory && !apisMentionOptions) continue;

        // If configs exist and cover keys, OK
        const stillMissing = undocumented.filter((k) => !configNames.has(k));
        if (stillMissing.length === 0) continue;

        // Check if any api.params documents nested fields of option (unlikely) — already checked allParamNames

        findings.push({
          severity: "medium",
          kind: "functionalExample-options-gap",
          file: fileRel,
          page: pageName,
          sectionId,
          api: call.callee,
          missing: `functionalExample passes { ${call.keys.join(", ")} } to ${call.callee} but fields not in section params/configs: [${stillMissing.join(", ")}]`,
          keys: stillMissing,
          allKeys: call.keys,
        });
      }
    }

    // Config pages: functionalExample YAML keys vs configs — lighter check skipped for YAML
  }

  return { findings, okApis, totalApis };
}

const allFindings = [];
const okCounts = {};
const pageSummaries = [];

for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  const exports = evalExports(abs);
  for (const [name, page] of Object.entries(exports)) {
    if (!page || !page.sections) continue;
    const { findings, okApis, totalApis } = analyzePage(rel, name, page);
    allFindings.push(...findings);
    okCounts[`${rel}::${name}`] = { okApis, totalApis };
    pageSummaries.push({
      file: rel,
      page: name,
      key: page.key,
      sections: page.sections.length,
      apis: totalApis,
      okApis,
      findings: findings.length,
    });
  }
}

// Deduplicate low informational noise for final report
const high = allFindings.filter((f) => f.severity === "high");
const medium = allFindings.filter((f) => f.severity === "medium");
const low = allFindings.filter((f) => f.severity === "low");

// Prefer zh findings as primary; note en counterpart
function enCounterpart(file) {
  if (file.startsWith("en/")) return file.slice(3);
  return `en/${file}`;
}

const report = {
  summary: {
    totalFindings: allFindings.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    okApiTotal: Object.values(okCounts).reduce((s, x) => s + x.okApis, 0),
    totalApiTotal: Object.values(okCounts).reduce((s, x) => s + x.totalApis, 0),
  },
  pageSummaries,
  high,
  medium,
  lowInformational: low.filter((f) => f.note !== "informational" || true).slice(0, 50),
};

fs.writeFileSync("_audit_params_report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
console.log("\n=== HIGH ===");
for (const f of high) {
  if (f.file.startsWith("en/")) continue; // report zh primary
  console.log(`\n[${f.severity}] ${f.file} #${f.sectionId} / ${f.api}`);
  console.log(`  ${f.missing}`);
  console.log(`  en counterpart: ${enCounterpart(f.file)} (likely same)`);
}
console.log("\n=== MEDIUM (zh only) ===");
for (const f of medium) {
  if (f.file.startsWith("en/")) continue;
  console.log(`\n[${f.severity}] ${f.file} #${f.sectionId} / ${f.api}`);
  console.log(`  ${f.missing}`);
}
console.log("\n=== OK counts by page ===");
for (const [k, v] of Object.entries(okCounts)) {
  if (k.startsWith("en/")) continue;
  console.log(`${k}: ${v.okApis}/${v.totalApis} OK`);
}
