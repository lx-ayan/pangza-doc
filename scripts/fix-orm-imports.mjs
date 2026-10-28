import fs from "fs";

const files = [
  "src/data/modules/orm.ts",
  "src/data/modules/en/orm.ts",
  "src/data/modules/application.ts",
  "src/data/modules/en/application.ts",
  "src/data/modules/service.ts",
  "src/data/modules/en/service.ts",
  "src/data/modules/rest.ts",
  "src/data/modules/en/rest.ts",
  "src/data/modules/redis.ts",
  "src/data/modules/en/redis.ts",
  "src/data/modules/auth.ts",
  "src/data/modules/en/auth.ts",
];

const ormOnly = new Set([
  "getTableName",
  "getEntityIdField",
  "getEntityTableMeta",
  "applyEntityFieldFills",
  "getEntityFields",
  "parseMybatisSql",
  "buildParamContext",
  "TableSearch",
  "OperTypeEnum",
  "assertIdent",
  "escapeLike",
  "assertSafeLastSql",
  "getDialect",
  "table",
  "QueryWrapper",
  "Mapper",
  "MapperType",
  "TableName",
  "TableId",
  "TableField",
  "EnableOrm",
  "BaseMapper",
  "Transactional",
  "MapperXml",
  "IdType",
  "configureOrm",
  "Db",
]);

const redisOnly = new Set([
  "Redis",
  "EnableRedis",
  "Redisson",
  "RateLimiter",
  "RateLimiterType",
  "RepeatSubmit",
  "Cacheable",
  "CacheEvict",
]);

const validateOnly = new Set([
  "Validate",
  "NotNull",
  "Min",
  "Max",
  "Email",
  "Phone",
  "Custom",
  "validateHandler",
  "validateHandlerSync",
  "validateMethodArgs",
  "ValidationError",
  "notNull",
  "min",
  "max",
  "email",
  "phone",
  "custom",
  "getClassRules",
  "isMethodValidate",
]);

function pickPkg(names) {
  const hasOrm = names.some((n) => ormOnly.has(n));
  const hasRedis = names.some((n) => redisOnly.has(n));
  const hasValidate = names.some((n) => validateOnly.has(n));
  // mixed imports should stay as-is for manual fix; prefer split later
  if (hasOrm && !hasRedis && !hasValidate) return "@pangza/orm";
  if (hasRedis && !hasOrm && !hasValidate) return "@pangza/redis";
  if (hasValidate && !hasOrm && !hasRedis) return "@pangza/validate";
  return null;
}

for (const rel of files) {
  const f = new URL(`../${rel}`, import.meta.url);
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  s = s.replace(
    /import\s*\{([^}]+)\}\s*from\s*"@pangza\/core"/g,
    (full, body) => {
      const names = body
        .split(",")
        .map((x) => x.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, "").trim())
        .filter(Boolean);
      const pkg = pickPkg(names);
      if (!pkg) return full;
      return `import {${body}} from "${pkg}"`;
    },
  );
  if (s !== orig) {
    fs.writeFileSync(f, s);
    console.log("updated", rel);
  } else {
    console.log("skip", rel);
  }
}
