/**
 * Refined audit: option-object fields in params count as documenting options?: T
 */
import fs from "fs";
import path from "path";
import ts from "typescript";

const ROOT = path.resolve("src/data/modules");
const ZH_FILES = [
  "application.ts",
  "auth.ts",
  "redis.ts",
  "orm.ts",
  "service.ts",
  "rest.ts",
];

function evalExports(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filePath,
  });
  const names = [...src.matchAll(/export\s+const\s+(\w+)/g)].map((m) => m[1]);
  const wrapped = outputText.replace(/^export\s+/gm, "").replace(/export\s*\{[^}]*\};?/g, "");
  const fn = new Function(`${wrapped}\nreturn { ${names.join(", ")} };`);
  return fn();
}

function parseSignatureArgs(signature) {
  if (!signature || typeof signature !== "string") return null;
  let start = -1,
    depth = 0,
    inStr = null;
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
        return splitTopLevel(signature.slice(start + 1, i).trim());
      }
    }
  }
  return null;
}

function splitTopLevel(s) {
  if (!s) return [];
  const parts = [];
  let cur = "",
    depth = 0,
    angle = 0,
    inStr = null;
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
  // Anonymous object type in signature: { foreignKey, ... } or { a?, b? }
  if (argStr.trim().startsWith("{")) {
    const keys = [...argStr.matchAll(/([A-Za-z_$][\w$]*)\s*\??\s*(?::|,|}|$)/g)].map((m) => m[1]);
    return {
      raw: argStr,
      name: null,
      isAnonObject: true,
      keys: [...new Set(keys)].filter((k) => !["string", "number", "boolean", "true", "false"].includes(k)),
      optional: true,
    };
  }
  // Target factory: () => Target
  if (/^\(\s*\)\s*=>/.test(argStr.trim())) {
    return { raw: argStr, name: "(targetFactory)", optional: false, isFactory: true };
  }
  const m = argStr.match(/^(\.\.\.)?([A-Za-z_$][\w$]*)(\?)?(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?$/);
  if (!m) {
    // weird like "table | Entity"
    const name = argStr.split(/[?:|]/)[0].trim();
    return { raw: argStr, name, optional: /\?/.test(argStr) || /=/.test(argStr) };
  }
  const type = m[4]?.trim() || "";
  const isOptionsBag =
    /^(options?|config|opts|option)$/i.test(m[2]) ||
    /Option|Config|Partial</.test(type);
  return {
    raw: argStr,
    rest: !!m[1],
    name: m[2],
    optional: !!m[3] || m[5] != null,
    type,
    default: m[5]?.trim(),
    isOptionsBag,
  };
}

function extractCalls(example) {
  if (!example) return [];
  const findings = [];
  const callRe = /\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/g;
  let m;
  while ((m = callRe.exec(example))) {
    const callee = m[1];
    let i = m.index + m[0].length;
    let depth = 1,
      inStr = null;
    const start = i;
    for (; i < example.length; i++) {
      const c = example[i];
      if (inStr) {
        if (c === inStr && example[i - 1] !== "\\") inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        inStr = c;
        continue;
      }
      if (c === "(") depth++;
      if (c === ")") {
        depth--;
        if (depth === 0) break;
      }
    }
    const argsSrc = example.slice(start, i);
    const objs = extractTopLevelObjects(argsSrc);
    for (const obj of objs) {
      const keys = objectKeys(obj);
      if (keys.length) findings.push({ callee, keys });
    }
  }
  return findings;
}

function extractTopLevelObjects(s) {
  const objs = [];
  let depth = 0,
    objStart = -1,
    inStr = null,
    bracket = 0;
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
    if (c === "[") bracket++;
    if (c === "]") bracket--;
    if (c === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && objStart >= 0) {
        // only count as arg object if not inside array? still count for Auth({...}) inside registry([...])
        objs.push(s.slice(objStart, i + 1));
        objStart = -1;
      }
    }
  }
  return objs;
}

function objectKeys(objSrc) {
  const inner = objSrc.slice(1, -1);
  const keys = [];
  let cur = "",
    depth = 0,
    inStr = null;
  const flush = () => {
    const t = cur.trim();
    cur = "";
    if (!t) return;
    const km = t.match(/^([A-Za-z_$][\w$]*)\s*:/) || t.match(/^([A-Za-z_$][\w$]*)\s*$/);
    if (km) keys.push(km[1]);
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

const FACTORY_CALLEES = new Set([
  "Auth",
  "Log",
  "Logger",
  "Json",
  "Redis",
  "configure",
  "configureOrm",
  "configureSchedule",
  "configureSqlLog",
  "setMetaObjectHandler",
  "ObjectMapper.configure",
  "Redis.configure",
  "Redis.connect",
  "Db.register",
  "registerHandler",
  "Application.registry",
  "table",
  "useTable",
]);

const ROUTE_METHODS = /^(Application\.)?(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/;

function analyze(fileRel, pageName, page) {
  const findings = [];
  let ok = 0,
    total = 0;

  for (const section of page.sections || []) {
    const configNames = new Set((section.configs || []).map((c) => c.name));
    const allParamNames = new Set();
    const allParamTypes = [];
    for (const api of section.apis || []) {
      for (const p of api.params || []) {
        allParamNames.add(p.name);
        allParamTypes.push(p);
      }
    }

    for (const api of section.apis || []) {
      total++;
      const sig = api.signature;
      const argsRaw = parseSignatureArgs(sig);
      if (!sig || !argsRaw) {
        ok++;
        continue;
      }
      if (argsRaw.length === 0) {
        ok++;
        continue;
      }

      const args = argsRaw.map(argMeta);
      const params = api.params || [];
      const paramNames = new Set(params.map((p) => p.name));
      const issues = [];

      for (const a of args) {
        if (a.isAnonObject) {
          const missingKeys = (a.keys || []).filter((k) => !paramNames.has(k));
          // if params document the keys, OK even without named options arg
          if (missingKeys.length && params.length === 0) {
            issues.push({
              kind: "anon-object-undocumented",
              detail: `anonymous options { ${a.keys.join(", ")} } with no params`,
            });
          } else if (missingKeys.length && params.length > 0) {
            // partial — only flag if majority missing
            if (missingKeys.length >= Math.ceil((a.keys.length || 1) / 2)) {
              issues.push({
                kind: "anon-object-partial",
                detail: `anon object keys missing from params: ${missingKeys.join(", ")}`,
              });
            }
          }
          continue;
        }
        if (a.isFactory) {
          // () => Target — usually not listed as params; if other params exist for options, OK as low
          if (params.length === 0) {
            issues.push({ kind: "factory-arg", detail: `target factory ${a.raw} and no params` });
          }
          continue;
        }
        if (!a.name) continue;

        if (paramNames.has(a.name)) continue;

        // options?: Foo documented via field-level params of Foo
        if (a.isOptionsBag && params.length > 0) {
          // Consider documented if params look like option fields (not just unrelated)
          // Still note missing top-level options param as low/medium
          issues.push({
            kind: "options-fields-only",
            detail: `signature has ${a.raw} but params list option fields instead of '${a.name}' wrapper (fields: [${[...paramNames].join(", ")}]) — OK-ish if fields complete`,
            soft: true,
          });
          continue;
        }

        if (a.isOptionsBag && params.length === 0) {
          issues.push({
            kind: "options-undocumented",
            detail: `options arg ${a.raw} with no params documenting fields`,
          });
          continue;
        }

        // required positional arg missing
        issues.push({
          kind: "arg-missing",
          detail: a.raw,
          optional: a.optional,
        });
      }

      const hard = issues.filter((i) => !i.soft);
      const soft = issues.filter((i) => i.soft);

      if (hard.length === 0) {
        ok++;
        if (soft.length) {
          findings.push({
            severity: "low",
            file: fileRel,
            page: pageName,
            sectionId: section.id,
            api: api.name,
            signature: sig,
            missing: soft.map((i) => i.detail).join("; "),
            kind: "options-fields-only",
          });
        }
        continue;
      }

      const hasRequired = hard.some((i) => i.kind === "arg-missing" && !i.optional);
      const onlyOptions = hard.every(
        (i) => i.kind === "options-undocumented" || i.kind === "options-fields-only" || (i.kind === "arg-missing" && i.optional)
      );
      let severity = hasRequired ? "high" : onlyOptions ? "medium" : "high";
      if (hard.every((i) => i.kind === "factory-arg")) severity = "medium";

      findings.push({
        severity,
        file: fileRel,
        page: pageName,
        sectionId: section.id,
        api: api.name,
        signature: sig,
        missing:
          params.length === 0
            ? `has signature with ${args.length} arg(s) [${args.map((a) => a.raw).join(", ")}] but no params`
            : hard.map((i) => i.detail || i.kind).join("; "),
        kind: "signature-params-gap",
        paramCount: params.length,
      });
    }

    // functionalExample: only factory / configure / route option calls
    const fe = section.functionalExample || "";
    const title = section.functionalExampleTitle || "";
    if (fe && !/配置|Config|YAML|Error|Response|形态|示例/.test(title) || /函数|Functional|Usage/i.test(title) || !title) {
      if (/^[#\s]*\w+:/m.test(fe.trim()) && !fe.includes("(")) {
        // yaml-ish skip
      } else {
        const calls = extractCalls(fe);
        for (const call of calls) {
          const isFactory =
            FACTORY_CALLEES.has(call.callee) ||
            call.callee.endsWith(".configure") ||
            call.callee.includes("configure") ||
            ROUTE_METHODS.test(call.callee) ||
            /\.(scheduleJob|runOnce|login|loadSession)$/.test(call.callee);

          if (!isFactory) continue;

          // For route methods, keys are RouteOption fields — check against configs in this section OR known elsewhere
          const missing = call.keys.filter((k) => !allParamNames.has(k) && !configNames.has(k));
          if (!missing.length) continue;

          // Entity-like noise for login profile etc. — still report for Auth/Schedule
          findings.push({
            severity: "medium",
            file: fileRel,
            page: pageName,
            sectionId: section.id,
            api: call.callee,
            missing: `functionalExample passes { ${call.keys.join(", ")} } to ${call.callee}; undocumented in section params/configs: [${missing.join(", ")}]`,
            kind: "functionalExample-options-gap",
            keys: missing,
          });
        }
      }
    }

    // Config sections: if configs empty but functionalExample shows option objects for factories — covered above
  }

  return { findings, ok, total };
}

const all = [];
const okByPage = {};

for (const rel of ZH_FILES) {
  const exports = evalExports(path.join(ROOT, rel));
  for (const [name, page] of Object.entries(exports)) {
    if (!page?.sections) continue;
    const r = analyze(rel, name, page);
    all.push(...r.findings);
    okByPage[`${rel}::${name}`] = { ok: r.ok, total: r.total, key: page.key };
  }
}

// Also check: config pages that document option objects — count configs
const configCoverage = [];
for (const rel of ZH_FILES) {
  const exports = evalExports(path.join(ROOT, rel));
  for (const [name, page] of Object.entries(exports)) {
    if (!page?.sections) continue;
    for (const s of page.sections) {
      configCoverage.push({
        file: rel,
        page: name,
        sectionId: s.id,
        title: s.title,
        configCount: (s.configs || []).length,
        apiCount: (s.apis || []).length,
        hasFE: !!s.functionalExample,
        fePreview: (s.functionalExample || "").slice(0, 80).replace(/\n/g, " "),
      });
    }
  }
}

const high = all.filter((f) => f.severity === "high");
const medium = all.filter((f) => f.severity === "medium");
const low = all.filter((f) => f.severity === "low");

const report = {
  summary: {
    high: high.length,
    medium: medium.length,
    low: low.length,
    okApis: Object.values(okByPage).reduce((s, x) => s + x.ok, 0),
    totalApis: Object.values(okByPage).reduce((s, x) => s + x.total, 0),
  },
  okByPage,
  high,
  medium,
  low,
  configCoverage: configCoverage.filter((c) => c.hasFE || c.configCount > 0),
};

fs.writeFileSync("_audit_params_report2.json", JSON.stringify(report, null, 2));

console.log("SUMMARY", report.summary);
console.log("\n--- HIGH ---");
for (const f of high) {
  console.log(`\n${f.file} #${f.sectionId} | ${f.api}`);
  console.log(`  ${f.missing}`);
  if (f.signature) console.log(`  sig: ${f.signature}`);
}
console.log("\n--- MEDIUM ---");
for (const f of medium) {
  console.log(`\n${f.file} #${f.sectionId} | ${f.api}`);
  console.log(`  ${f.missing}`);
}
console.log("\n--- LOW (options fields only) sample ---");
for (const f of low.slice(0, 30)) {
  console.log(`${f.file} #${f.sectionId} | ${f.api}: ${f.missing.slice(0, 100)}`);
}
console.log("\n--- OK ---");
for (const [k, v] of Object.entries(okByPage)) console.log(`${k}: ${v.ok}/${v.total}`);
