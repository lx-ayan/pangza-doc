import fs from "fs";
import path from "path";

const root = path.resolve("src");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      walk(p, acc);
    } else if (/\.(ts|tsx|md)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const replacements = [
  [/@\/framework\/ORM/g, "@pangza/orm"],
  [/@\/framework\/utils/g, "@pangza/core/utils"],
  [/@\/framework/g, "@pangza/core"],
  [/@pangza\/application/g, "@pangza/core"],
  [/@pangza\/express/g, "@pangza/core"],
  [/npx create-pangza@latest/g, "npx pangza@latest"],
  [/npx create-pangza/g, "npx pangza"],
  [/npm create pangza@latest -- /g, "npx pangza@latest "],
  [/npm create pangza/g, "npx pangza"],
  [/create-pangza/g, "pangza"],
];

let n = 0;
for (const f of walk(root)) {
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  for (const [re, to] of replacements) s = s.replace(re, to);
  if (s !== orig) {
    fs.writeFileSync(f, s);
    n++;
    console.log("updated", path.relative(root, f));
  }
}
console.log("done, files:", n);
