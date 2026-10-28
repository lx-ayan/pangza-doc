import type { DocPage } from "../../../types/doc";

import {
  SCHEDULE_JOB_ENTITY_FIELDS,
  SCHEDULE_MODULE_OPTIONS_FIELDS,
  objectParamWithFields,
  typeConfigs,
  typeParams,
} from "../../typeFields";

export const validateApi: DocPage = {
  key: "Validate-api",
  title: "Validate · API",
  description:
    "Package @pangza/validate: DTO property rules + method @Validate via design:paramtypes. Requires experimentalDecorators + emitDecoratorMetadata and import reflect-metadata. Scaffold --modules=validate adds the dependency.",
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        {
          name: "Install",
          description:
            'npm i @pangza/validate; import { Validate, NotNull, … } from "@pangza/validate".',
        },
        {
          name: "@Validate",
          description:
            "Method decorator: writes validate metadata and paramTypes; validates rule-bearing args before the route runs (package must be installed).",
        },
        {
          name: "@NotNull",
          signature: "@NotNull() | @NotNull('message') | @NotNull({ message })",
          description: "Value must not be null / undefined / ''.",
          params: [
            {
              name: "message | options",
              type: "string | { message?: string }",
              required: false,
              description:
                "Failure message; pass a string or { message }. Omit for the default message.",
            },
          ],
        },
        {
          name: "@Min / @Max",
          signature: "@Min(n, message?) / @Max(n, message?)",
          description: "Numeric comparison, or string length bounds.",
          params: [
            {
              name: "n",
              type: "number",
              required: true,
              description: "Boundary value; for strings compares length.",
            },
            {
              name: "message",
              type: "string",
              required: false,
              description: "Failure message.",
            },
          ],
        },
        {
          name: "@Email / @Phone",
          signature: "@Email(message?) / @Phone({ locale?, message? })",
          description: "Email format; phone default locale=zh-CN.",
          params: [
            {
              name: "message | options",
              type: "string | { locale?, message? }",
              required: false,
              description: "@Email: message string. @Phone: { locale?: string, message? } (default locale zh-CN).",
            },
          ],
        },
        {
          name: "@Custom",
          signature: "@Custom(fn, message?)",
          description:
            "Custom (value, object)=> boolean | Promise<boolean>; returning false fails validation.",
          params: [
            {
              name: "fn",
              type: "(value, object) => boolean | Promise<boolean>",
              required: true,
              description: "Return false to fail validation.",
            },
            {
              name: "message",
              type: "string",
              required: false,
              description: "Failure message.",
            },
          ],
        },
        {
          name: "validateHandler / validateHandlerSync / validateMethodArgs",
          description:
            "Manually validate an object or method args; failures throw ValidationError (with errors: FieldError[]).",
        },
        {
          name: "notNull / min / max / email / phone / custom",
          description: "Rule factories for validateHandler(obj, { field: [notNull(), min(3)] }).",
        },
        {
          name: "getClassRules / isMethodValidate / getMethodParamTypes",
          description: "Read the class rules map, whether method validation is on, and the method param type list.",
        },
      ],
      decoratorExample: `import { Validate, NotNull, Min, Email, Phone, Custom } from "@pangza/validate";
import { PostMapping, RequestBody } from "@pangza/core";

class CreateUserDto {
  @NotNull("username required")
  @Min(3)
  username!: string;

  @Email()
  email!: string;

  @Phone({ locale: "zh-CN" })
  mobile!: string;

  @Custom((v) => typeof v === "string" && v.length >= 6, "min 6 chars")
  password!: string;
}

@PostMapping("/create")
@Validate()
create(@RequestBody() body: CreateUserDto) {}`,
      functionalExample: `import { validateHandler, notNull, min, email } from "@pangza/validate";

await validateHandler(body, CreateUserDto);
await validateHandler(body, {
  username: [notNull("必填"), min(3)],
  email: [email()],
});
await validateHandlerSync(body, CreateUserDto);
await validateMethodArgs(controller, "create", [body]);

const rules = getClassRules(CreateUserDto);
isMethodValidate(UserController, "create");`,
    },
  ],
};

export const validateConfig: DocPage = {
  key: "Validate-config",
  title: "Validate · Configuration",
  description: "No YAML; depends on compile-time decorator metadata.",
  sections: [
    {
      id: "rules",
      title: "Rule parameters & error shape",
      configs: [
        { name: "RuleOptions.message", type: "string", description: "Failure message; a plain string is also accepted" },
        { name: "NotNull", type: "decorator", description: "Rejects null / undefined / empty string" },
        { name: "Min / Max.value", type: "number", description: "Bound; for string uses length" },
        { name: "Phone.locale", type: "string", default: "zh-CN", description: "Phone number locale" },
        { name: "Custom.fn", type: "(value, object)=>boolean|Promise", description: "Custom validator" },
        {
          name: "ValidationError.errors",
          type: "FieldError[]",
          description: "Field-level list of { property, message, value? }",
        },
      ],
      functionalExampleTitle: "Error shape",
      functionalExample: `try {
  await validateHandler(body, CreateUserDto);
} catch (e) {
  // e instanceof ValidationError
  // e.errors → [{ property: "username", message: "..." }]
}`,
    },
  ],
};

export const exceptionApi: DocPage = {
  key: "Exception-api",
  title: "Exception · API",
  description:
    "Part of @pangza/core: global exception matching and response (@ControllerAdvice / registerHandler). Route catch calls handleException: custom handlers first, then built-in Auth/Orm/Guard/Validation/Biz.",
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        {
          name: "@ControllerAdvice",
          description: "Instantiates the class and registers all @ExceptionHandler methods on it.",
        },
        {
          name: "@ExceptionHandler",
          signature: "@ExceptionHandler(errorType?: Function)",
          description: "Defaults to Error as fallback; exact type match first, then the inheritance chain.",
          params: [
            {
              name: "errorType",
              type: "Function",
              required: false,
              default: "Error",
              description: "Error class to match; omit for Error catch-all.",
            },
          ],
        },
        {
          name: "registerHandler",
          signature: "registerHandler(errorType, handler)",
          description: "Functional registration; handler(error, ctx)=> ExceptionHandlerResult.",
          params: [
            {
              name: "errorType",
              type: "Function",
              required: true,
              description: "Error class to handle.",
            },
            {
              name: "handler",
              type: "(error, ctx) => ExceptionHandlerResult",
              required: true,
              description: "Handler returning response shape or null to fall through.",
            },
          ],
        },
        {
          name: "registerExceptionHandler / clearExceptionHandlers / getExceptionHandlers / resolveExceptionHandler",
          description: "Registry low-level API: write, clear, list, and resolve a handler for an error.",
        },
        {
          name: "handleException",
          description: "Unified entry; skips if the response is already written.",
        },
        {
          name: "BizException",
          signature: "new BizException(message?, code?, data?, httpStatus?)",
          description:
            "Business exception. Default code=ERROR, httpStatus=200 (business code in body).",
          params: [
            {
              name: "message",
              type: "string",
              required: false,
              default: '"Operation failed"',
              description: "Error message text.",
            },
            {
              name: "code",
              type: "ResponseCode",
              required: false,
              default: "ERROR",
              description: "Business error code written into the response body.",
            },
            {
              name: "data",
              type: "unknown",
              required: false,
              default: "null",
              description: "Optional payload attached to the error.",
            },
            {
              name: "httpStatus",
              type: "number",
              required: false,
              default: "200",
              description:
                "HTTP status (business failures often still use 200 and rely on body.code).",
            },
          ],
        },
        {
          name: "Exception()",
          description: "Placeholder factory for registry; actual handling still goes through handleException.",
        },
        {
          name: "ExceptionHandlerResult",
          description:
            "{ message?, code?, data?, httpStatus?, rawBody? }; null/undefined falls through to built-in; rawBody is sent as-is.",
        },
      ],
      decoratorExample: `@ControllerAdvice()
class GlobalAdvice {
  @ExceptionHandler(BizException)
  handleBiz(e: BizException) {
    return { code: e.code, message: e.message, data: e.data, httpStatus: e.httpStatus };
  }
  @ExceptionHandler()
  handleOther(e: Error) {
    return { code: 500, message: e.message, httpStatus: 500 };
  }
}`,
      functionalExample: `registerHandler(BizException, (e) => ({
  code: e.code,
  message: e.message,
  data: e.data,
}));
throw new BizException("用户不存在", ResponseCode.NOT_FOUND, null, 404);

clearExceptionHandlers();
const list = getExceptionHandlers();
const h = resolveExceptionHandler(err);`,
    },
  ],
};

export const exceptionConfig: DocPage = {
  key: "Exception-config",
  title: "Exception · Configuration",
  description: "No YAML. Match order: exact type → inheritance chain → Error fallback.",
  sections: [
    {
      id: "builtin",
      title: "Built-in mappings",
      configs: [
        { name: "BizException", type: "Exception", description: "Returns e.httpStatus / e.code / e.message / e.data" },
        { name: "ValidationError", type: "Exception", description: "Validation failure; body includes errors" },
        { name: "NotLoginError / NotRoleError / NotPermissionError", type: "AuthError", description: "Not logged in / no role / no permission → matching HTTP/business codes" },
        { name: "OrmError / OptimisticLockError", type: "Exception", description: "ORM errors" },
        { name: "GuardError / LockError", type: "Exception", description: "Rate-limit / idempotency / lock failures" },
      ],
      functionalExampleTitle: "Response shape examples",
      functionalExample: `// 默认业务错误体（示意）
{ "code": 500, "message": "用户不存在", "data": null }

// ValidationError（示意）
{ "code": 400, "message": "参数校验失败", "data": { "errors": [...] } }`,
    },
  ],
};

export const jsonApi: DocPage = {
  key: "Json-api",
  title: "Json · API",
  description:
    "Part of @pangza/core: response serialization (date format, null strategies, DTO convert / pick). Import from @pangza/core; no longer re-exported via Application.",
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        {
          name: "@JsonFormat",
          signature: "@JsonFormat({ pattern?, timezone? })",
          description: "Date output format; timezone is hour offset (e.g. 8 means UTC+8).",
          params: [
            {
              name: "pattern",
              type: "string",
              required: false,
              description: "Date format pattern.",
            },
            {
              name: "timezone",
              type: "string",
              required: false,
              description: "Timezone id.",
            },
          ],
        },
        {
          name: "@JsonInclude",
          signature: "@JsonInclude(JsonIncludeType)",
          description:
            "ALWAYS=emit all; NON_NULL=skip null; NON_EMPTY=skip empty string/array/object; NON_DEFAULT=skip default values.",
          params: [
            {
              name: "value",
              type: "JsonIncludeType",
              required: true,
              description: "Include policy enum (ALWAYS / NON_NULL / NON_EMPTY / …).",
            },
          ],
        },
        {
          name: "@JsonProperty",
          description: "Marks a field for convert projection (works with beanKeys).",
        },
        {
          name: "ObjectMapper.writeValue / configure",
          description: "Serialize an object to a JSON string/structure; global dateFormat/deep/include.",
        },
        {
          name: "convert / copyProperties / pick",
          description: "Source object → target class instance; copy properties; pick by key list.",
        },
        {
          name: "formatDate / shouldOmitByInclude",
          description: "Format a date by pattern; decide whether to omit a field by Include strategy.",
        },
        {
          name: "getJsonFieldFormats* / addBeanKey / getBeanKeys",
          description: "Read field format metadata; register/read Bean property keys (for convert).",
        },
        {
          name: "Json(opts?)",
          description: "Application.registry(Json(opts)), equivalent to configure.",
        },
      ],
      decoratorExample: `@JsonInclude(JsonIncludeType.NON_NULL)
class UserVo {
  @JsonProperty()
  id!: string;

  @JsonFormat({ pattern: "yyyy-MM-dd HH:mm:ss", timezone: 8 })
  createTime?: Date;
}`,
      functionalExample: `ObjectMapper.configure({
  dateFormat: "yyyy-MM-dd HH:mm:ss",
  include: JsonIncludeType.NON_NULL,
  deep: true,
});
const json = ObjectMapper.writeValue(vo);
const dto = convert(source, UserVo);
const slim = pick(source, ["id", "username"]);`,
    },
  ],
};

export const jsonConfig: DocPage = {
  key: "Json-config",
  title: "Json · Configuration",
  description: "ObjectMapper.configure or Application.registry(Json(opts)).",
  sections: [
    {
      id: "opts",
      title: "Options",
      configs: [
        { name: "dateFormat", type: "string", description: "Global date format, e.g. yyyy-MM-dd HH:mm:ss" },
        { name: "deep", type: "boolean", default: "true", description: "Whether to deeply process nested objects" },
        {
          name: "include",
          type: "JsonIncludeType",
          description: "ALWAYS | NON_NULL | NON_EMPTY | NON_DEFAULT",
        },
        {
          name: "@JsonFormat.pattern",
          type: "string",
          description: "Field-level date pattern; overrides global",
        },
        {
          name: "@JsonFormat.timezone",
          type: "number",
          description: "Hour offset, e.g. 8=UTC+8",
        },
      ],
    },
  ],
};

export const logApi: DocPage = {
  key: "Log-api",
  title: "Log · API",
  description:
    "Package @pangza/log: operation audit. After registry(Log({ writer })), @Log / option.log persist asynchronously in finally; failures do not affect business by default. Method decorator @Log is imported from @pangza/core.",
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        {
          name: "Log / LogModule",
          description:
            "Operation-log factory: Application.registry(Log({ writer })). The framework main entry also re-exports it as LogModule to avoid confusion with the method decorator @Log; both point to the same factory.",
        },
        {
          name: "configureLog",
          description: "Configure only without mounting middleware; usually Log(options) is enough.",
        },
        {
          name: "@Log",
          description:
            "Method-level decorator (exported by Application); writes LogRecordOption; can also be set via RouteOption.log.",
        },
        {
          name: "recordOperationLog",
          description: "Builds OperationLogRecord and calls writer; exceptions may be silent.",
        },
        {
          name: "getClientIp / resolveIpAddress / normalizeIp / isInternalIp",
          description:
            "IP helpers. getClientIp respects server.trustProxy; internal-IP checks short-circuit address resolution.",
        },
        {
          name: "BusinessType",
          description:
            "CREATE=0 UPDATE=1 DELETE=2 READ=3 LIST=4 UPLOAD=5 EXPORT=6 IMPORT=7 LOGIN=8 OTHER=9 (stored as string ordinals).",
        },
        {
          name: "OperType",
          description: "MOBILE=0 PC=1 OTHER=2.",
        },
        {
          name: "isLogRegistered / getLogOptions",
          description: "Whether Log has been registered; read module options.",
        },
        {
          name: "OperationLogRecord",
          description:
            "Persisted row fields: title/username/avatar/business/oper/params/response/methodName/controllerName/status/timeLong/ip/address/userAgent/url/errorMessage/deleteFlag/createTime.",
        },
      ],
      decoratorExample: `@PostMapping("/login")
@Log({ title: "系统登录", business: BusinessType.LOGIN, oper: OperType.PC })
async login(@RequestBody() body: LoginDto) {}

@PostMapping("/create")
@Log({ title: "新增用户", business: BusinessType.CREATE, excludeParamNames: ["password"] })
create(@RequestBody() body: CreateUserDto) {}`,
      functionalExample: `Application.registry(Log({
  enabled: true,
  writer: async (row) => { await sysLogService.insert(row); },
  excludeParamNames: ["token", "password"],
  silent: false,
}));

Application.POST("/api/x", handler, {
  log: { title: "演示", business: BusinessType.OTHER },
});`,
    },
  ],
};

export const logConfig: DocPage = {
  key: "Log-config",
  title: "Log · Configuration",
  sections: [
    {
      id: "module",
      title: "LogModuleOptions",
      configs: [
        { name: "enabled", type: "boolean", default: "true", description: "Master switch" },
        { name: "excludeParamNames", type: "string[]", default: "[]", description: "Extra fields to exclude (password and other built-in redactions also apply)" },
        { name: "silent", type: "boolean", default: "false", description: "Whether write failures are silent" },
        { name: "writer", type: "(row: OperationLogRecord)=>void|Promise", description: "Persist callback; if unset, nothing is written" },
      ],
    },
    {
      id: "record",
      title: "LogRecordOption",
      configs: [
        { name: "title", type: "string", description: "Operation title" },
        { name: "business", type: "BusinessType", default: "OTHER", description: "Business type ordinal" },
        { name: "oper", type: "OperType", default: "PC", description: "Client type" },
        { name: "excludeParamNames", type: "string[]", description: "Extra exclusions for this endpoint" },
        { name: "ignore", type: "boolean", description: "Skip logging" },
      ],
    },
  ],
};

export const loggerApi: DocPage = {
  key: "Logger-api",
  title: "Logger · API",
  description:
    'Part of @pangza/core: pino-based application logging (console pretty + file dual write). import { Logger, getLogger } from "@pangza/core".',
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        { name: "Logger(options?)", description: "registry factory → configureLogger." },
        { name: "configureLogger / getLogger / getRootLogger / logger", description: "Configure and obtain a child logger (by name)." },
        { name: "ensureUtf8Console", description: "UTF-8 console on Windows." },
        {
          name: "LogLevel",
          description: "fatal / error / warn / info / debug / trace / silent.",
        },
      ],
      functionalExample: `Application.registry(Logger({ level: "debug", pretty: true }));
const log = getLogger("UserService");
log.info({ userId }, "login ok");
log.error(err, "failed");`,
      decoratorExample: `// Logger 无业务装饰器；在 Service 内：
const log = getLogger(UserService.name);
log.warn("cache miss");`,
    },
  ],
};

export const loggerConfig: DocPage = {
  key: "Logger-config",
  title: "Logger · Configuration",
  sections: [
    {
      id: "opts",
      title: "LoggerOptions",
      configs: [
        { name: "level", type: "string", default: '"info"', description: "fatal…silent" },
        { name: "console", type: "boolean", default: "true", description: "Console output" },
        { name: "pretty", type: "boolean", default: "non-production", description: "pino-pretty" },
        { name: "file", type: "boolean", default: "true", description: "Write to file" },
        { name: "logDir", type: "string", default: '"logs"', description: "Directory" },
        { name: "filename", type: "string", default: '"app.log"', description: "Application log file" },
        { name: "errorFilename", type: "string|false", default: '"error.log"', description: "Error file; false disables" },
        { name: "pino", type: "object", description: "Pass-through pino options (use the pino ecosystem when built-in daily rotation is absent)" },
      ],
    },
  ],
};

export const configApi: DocPage = {
  key: "config-api",
  title: "config · API",
  description:
    "Loads and exports the merged application.yaml result. Profile: PANGZA_PROFILE → APP_ENV → NODE_ENV → development. Supports path lookup, @ConditionOnProperty (prefix bind), and Application @Value.",
  sections: [
    {
      id: "apis",
      title: "Public exports",
      apis: [
        { name: "PORT / trustProxy", description: "server.port / server.trustProxy." },
        { name: "redisConfig", description: "redis section; see Redis configuration." },
        { name: "mysqlConfig / postgresqlConfig / mssqlConfig", description: "datasource.default / postgresql / sqlserver." },
        { name: "UPLOAD_PATH / UPLOAD_URL_PREFIX", description: "upload.path / upload.urlPrefix." },
        { name: "ormEnvConfig", description: "Parsed orm section; see ORM configuration." },
        { name: "configProfile / configFiles", description: "Current profile name; list of loaded YAML paths." },
        {
          name: "getConfig",
          signature: "getConfig(): Readonly<Record<string, unknown>>",
          description:
            "Returns the merged YAML root object (read-only view; do not mutate). No parameters.",
          returns:
            "Readonly root object whose keys match top-level application.yaml (e.g. server / redis / orm).",
        },
        {
          name: "getConfigValue",
          signature: "getConfigValue<T>(pathOrExpression, defaultValue?): T",
          description:
            "Read YAML by dot path. If missing, returns defaultValue; if the expression is ${path:default} and the second arg is omitted, uses the placeholder default (via coerceConfigScalar). The second arg wins over the placeholder default.",
          returns:
            "The raw YAML value at the path, or the fallback; undefined when missing and no default.",
          params: [
            {
              name: "pathOrExpression",
              type: "string",
              required: true,
              description:
                "Config path. Three forms: ① dot path server.port; ② ${server.port}; ③ ${server.port:3990} (text after colon is the placeholder default). Segments split by . walk nested objects.",
            },
            {
              name: "defaultValue",
              type: "T",
              required: false,
              description:
                "Fallback when the path is missing (value is undefined). Overrides any ${path:default} default. Optional.",
            },
          ],
        },
        {
          name: "parseValueExpression",
          signature: "parseValueExpression(expression: string): { path; defaultText? }",
          description:
            "Splits an expression into path and optional default text. Prefer getConfigValue in app code.",
          returns: "{ path: string; defaultText?: string }",
          params: [
            {
              name: "expression",
              type: "string",
              required: true,
              description:
                "Same as getConfigValue's pathOrExpression. Non-${...} forms become path only (no defaultText).",
            },
          ],
        },
        {
          name: "coerceConfigScalar",
          signature: "coerceConfigScalar(raw: string): unknown",
          description:
            "Light coercion for placeholder defaults used by ${path:default}. true/false → boolean; null → null; int/float → number; otherwise string.",
          returns: "Coerced scalar.",
          params: [
            {
              name: "raw",
              type: "string",
              required: true,
              description: "The default text after the colon in ${path:default}.",
            },
          ],
        },
      ],
      functionalExample: `import {
  PORT,
  getConfig,
  getConfigValue,
  configProfile,
} from "@pangza/core";

console.log(configProfile, PORT);

getConfigValue("redis.host");
getConfigValue("no.such", "fallback");
getConfigValue("\${server.port:3990}");
getConfig().server;`,
      decoratorExample: `// Single-field injection: Application · @Value
// Prefix-bind a whole class: @ConditionOnProperty below`,
    },
    {
      id: "condition-on-property",
      title: "@ConditionOnProperty prefix binding",
      content:
        "Class decorator: injects `prefix.propertyName` from YAML into class fields and registers the class in IoC. No extra @Component needed.\nPriority: **field initializer > YAML > options.defaults**.\nField names are also discovered from the YAML prefix object (fixes `field!: type` missing from Object.keys). Order with @Component does not matter.\nImport from `@pangza/core`.",
      apis: [
        {
          name: "@ConditionOnProperty",
          signature:
            "@ConditionOnProperty(prefix: string | { prefix: string; defaults?: Record<string, unknown> })",
          description:
            "Class decorator. On resolve, fills fields from YAML; bindClassWithActivation (rebinds if @Component already bound).",
          returns: "ClassDecorator",
          params: [
            {
              name: "prefix",
              type: "string",
              required: true,
              description:
                'YAML prefix, e.g. "ai.model.agnes" → ai.model.agnes.apiKey. Or the prefix field in object form.',
            },
            {
              name: "defaults",
              type: "Record<string, unknown>",
              required: false,
              description:
                "Decorator-level defaults when the field has no initializer and YAML is also missing. Object form only.",
            },
          ],
        },
      ],
      decoratorExample: `import { ConditionOnProperty } from "@pangza/core";

// application.yaml:
// ai:
//   model:
//     agnes:
//       apiKey: sk-xxx
//       modelName: agnes-3.0-flash
//       baseURL: https://example.com/v1

@ConditionOnProperty("ai.model.agnes")
class AgnesModel {
  apiKey?: string;
  modelName!: string;
  baseURL!: string;
}

@ConditionOnProperty({ prefix: "server", defaults: { port: 5270 } })
class ServerSettings {
  port!: number;
}`,
      functionalExample: `import { getConfigValue } from "@pangza/core";

getConfigValue("redis.port");
getConfigValue<string[]>("redis.roles");
getConfigValue("redis.nodes");`,
    },
  ],
};

export const configConfig: DocPage = {
  key: "config-config",
  title: "config · Configuration",
  description:
    "Load order: application.yaml → application-{profile}.yaml → CONFIG_PATH or --config file (later overrides earlier).",
  sections: [
    {
      id: "profile",
      title: "Profile & loading",
      configs: [
        { name: "PANGZA_PROFILE", type: "env", description: "Highest-priority profile" },
        { name: "APP_ENV / NODE_ENV", type: "env", description: "Secondary; default development" },
        { name: "CONFIG_PATH", type: "env", description: "Extra YAML path" },
        { name: "--config / --config=", type: "CLI", description: "Extra YAML, same as CONFIG_PATH" },
      ],
      functionalExampleTitle: "Configuration example",
      functionalExample: `# 环境变量
# PANGZA_PROFILE=production
# CONFIG_PATH=./config/prod-extra.yaml

# 或
# node dist/main.js --config ./config/prod-extra.yaml`,
    },
    {
      id: "server",
      title: "server",
      configs: [
        { name: "port", type: "number", default: "3990", description: "Listen port → PORT" },
        { name: "trustProxy", type: "boolean", default: "false", description: "Trust forwarded IP headers → trustProxy" },
      ],
    },
    {
      id: "upload",
      title: "upload",
      configs: [
        { name: "path", type: "string", default: "upload", description: "Save directory → UPLOAD_PATH" },
        { name: "urlPrefix", type: "string", default: "/files", description: "Static access prefix → UPLOAD_URL_PREFIX" },
      ],
      functionalExampleTitle: "Configuration example",
      functionalExample: `server:
  port: 3990
  trustProxy: false
upload:
  path: upload
  urlPrefix: /files

# redis / datasource / orm 见各模块「配置项」页`,
    },
  ],
};

export const scheduleApi: DocPage = {
  key: "schedule-api",
  title: "schedule · API",
  description:
    "Package @pangza/schedule: node-cron scheduling. loadJobs loads tasks, resolves Beans from Container by beanName, and calls execute() or run().",
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        {
          name: "ScheduleManager.scheduleJob",
          signature: "scheduleJob(entity: ScheduleJobEntity): void",
          description:
            "Register or replace a job. status empty/0 → disable; else validate cron & Bean then schedule. Table expands ScheduleJobEntity.",
          params: objectParamWithFields("en", {
            name: "entity",
            typeName: "ScheduleJobEntity",
            required: true,
            summaryZh: "",
            summaryEn: "Required. Job entity object.",
            fields: SCHEDULE_JOB_ENTITY_FIELDS,
          }),
        },
        {
          name: "ScheduleManager.unschedule",
          signature: "unschedule(id: string): void",
          description: "Stop and remove by job id.",
          params: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Job id to remove from the scheduler.",
            },
          ],
        },
        {
          name: "ScheduleManager.runOnce",
          signature: "runOnce(entity | beanName): Promise<void>",
          description:
            "Fire once (ignore cron). Object uses entity.beanName; string is beanName. Entity fields same as ScheduleJobEntity.",
          params: [
            {
              name: "entity | beanName",
              type: "ScheduleJobEntity | string",
              required: true,
              description:
                "Full entity or Container alias; calls execute() or run(). If entity, see entity.* below.",
            },
            ...typeParams(SCHEDULE_JOB_ENTITY_FIELDS, "en", "entity"),
          ],
        },
        {
          name: "ScheduleManager.loadEnabled",
          description: "Calls loadJobs and scheduleJob for each returned item.",
        },
        {
          name: "configureSchedule / initScheduleJobs",
          signature: "configureSchedule(options?: ScheduleModuleOptions) / initScheduleJobs()",
          description:
            "configureSchedule injects the job loader; initScheduleJobs awaits loadEnabled at startup.",
          params: objectParamWithFields("en", {
            name: "options",
            typeName: "ScheduleModuleOptions",
            required: false,
            summaryZh: "",
            summaryEn: "Optional argument for configureSchedule.",
            fields: SCHEDULE_MODULE_OPTIONS_FIELDS,
          }),
        },
        {
          name: "convertQuartzCron / validateCron",
          description: "Quartz ? → *; validate 5 or 6 fields; invalid throws OrmError.",
        },
      ],
      decoratorExample: `@Component("sysLogCleanTask")
class SysLogCleanTask {
  /** 优先调用 execute；也可用 run */
  async execute() {
    /* clean logs */
  }
}`,
      functionalExample: `configureSchedule({
  loadJobs: async () => scheduleService.listEnabled(),
});
await initScheduleJobs();

ScheduleManager.scheduleJob({
  id: "1",
  title: "清理日志",
  cron: "0 0 * * * ?",
  beanName: "sysLogCleanTask",
  status: 1,
});

await ScheduleManager.runOnce({
  id: "1",
  cron: "0 0 * * * ?",
  beanName: "sysLogCleanTask",
});
ScheduleManager.unschedule("1");

validateCron("0 */5 * * * *");`,
    },
  ],
};

export const scheduleConfig: DocPage = {
  key: "schedule-config",
  title: "schedule · Configuration",
  sections: [
    {
      id: "opts",
      title: "Options & entity",
      content:
        "ScheduleModuleOptions for configureSchedule, and ScheduleJobEntity fields for scheduleJob / runOnce.",
      configs: [
        ...typeConfigs(SCHEDULE_MODULE_OPTIONS_FIELDS, "en"),
        ...typeConfigs(SCHEDULE_JOB_ENTITY_FIELDS, "en").map((c) => ({
          ...c,
          name: `entity.${c.name}`,
        })),
      ],
    },
  ],
};

export const encryptApi: DocPage = {
  key: "encrypt-api",
  title: "encrypt · API",
  description:
    "Package @pangza/encrypt: AES ECB+PKCS7 encrypt/decrypt and in-memory dynamic session keys (fixed 5-minute expiry).",
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        {
          name: "AESUtil.encrypt / decrypt",
          description: "key must be 16 UTF-8 bytes; ciphertext is Base64.",
        },
        {
          name: "DynamicAesKeyManager.generateDynamicKey",
          description: "Returns { sessionId, aesKey(Base64) } and caches for 300000ms.",
        },
        {
          name: "getAesKeyBySessionId / removeKey",
          description: "Fetch key by session (null if expired) / actively remove.",
        },
      ],
      functionalExample: `const { sessionId, aesKey } = DynamicAesKeyManager.generateDynamicKey();
const key = DynamicAesKeyManager.getAesKeyBySessionId(sessionId)!;
const cipher = AESUtil.encrypt("hello", key);
AESUtil.decrypt(cipher, key);
DynamicAesKeyManager.removeKey(sessionId);`,
      decoratorExample: `// 无装饰器；在 Controller 中：
@GetMapping("/aes/key")
@AuthIgnore()
key() {
  return DynamicAesKeyManager.generateDynamicKey();
}`,
    },
  ],
};

export const encryptConfig: DocPage = {
  key: "encrypt-config",
  title: "encrypt · Configuration",
  sections: [
    {
      id: "notes",
      title: "Notes",
      content: "No YAML. Dynamic key expiry is fixed at 300000ms (5 minutes). In production, evaluate key storage and rotation strategy.",
      configs: [
        { name: "key length", type: "16 bytes", description: "AESUtil key length" },
        { name: "session TTL", type: "number", default: "300000", description: "Dynamic key lifetime in milliseconds" },
      ],
    },
  ],
};

export const langchainApi: DocPage = {
  key: "langchain-api",
  title: "langchain · API",
  description: "Reserved module: the AiModel(model) decorator is currently a no-op.",
  sections: [
    {
      id: "status",
      title: "Status",
      content: "The framework ships a langchain/decorators.ts placeholder with no complete public API yet. This docs site keeps the nav entry for future expansion.",
      apis: [
        {
          name: "AiModel",
          signature: "AiModel(model: string)",
          description: "Placeholder decorator; no runtime behavior today.",
          params: [
            {
              name: "model",
              type: "string",
              required: true,
              description: "Model name placeholder (decorator currently no-op).",
            },
          ],
        },
      ],
      decoratorExample: `// 预留，请勿依赖
@AiModel("gpt-x")
class Demo {}`,
      functionalExample: `// 暂无函数式 API`,
    },
  ],
};

export const langchainConfig: DocPage = {
  key: "langchain-config",
  title: "langchain · Configuration",
  sections: [
    {
      id: "none",
      title: "Configuration",
      content: "No configuration options yet.",
      configs: [],
    },
  ],
};

export const typesApi: DocPage = {
  key: "types-api",
  title: "types · API",
  description: "Part of @pangza/core: framework-level enums such as ResponseCode.",
  sections: [
    {
      id: "apis",
      title: "Public types",
      apis: [
        {
          name: "ResponseCode",
          description:
            "SUCCESS=200, ERROR/INTERNAL=500, UNAUTHORIZED=401, FORBIDDEN=403, NOT_FOUND=404, BAD_REQUEST=400, CONFLICT=409.",
        },
      ],
      functionalExample: `import { ResponseCode } from "@pangza/core";
return ResponseData.error("失败", null, ResponseCode.BAD_REQUEST);`,
      decoratorExample: `// 枚举无装饰器用法，在异常或响应中引用即可。`,
    },
  ],
};

export const typesConfig: DocPage = {
  key: "types-config",
  title: "types · Configuration",
  sections: [
    {
      id: "none",
      title: "Configuration",
      content: "The types module has no runtime configuration.",
      configs: [],
    },
  ],
};

export const utilsApi: DocPage = {
  key: "utils-api",
  title: "utils · API",
  description:
    "Part of @pangza/core: HTTP response wrappers, pagination conversion, naming-style and ID helpers.",
  sections: [
    {
      id: "apis",
      title: "Public API",
      apis: [
        {
          name: "ResponseData.success",
          signature: "success<T>(data: T, message?: string)",
          description: 'Unified success body { code: SUCCESS, message, data }; message defaults to "操作成功".',
          params: [
            {
              name: "data",
              type: "T",
              required: true,
              description: "Payload placed in the success body.",
            },
            {
              name: "message",
              type: "string",
              required: false,
              description: "Optional success message.",
            },
          ],
        },
        {
          name: "ResponseData.error",
          signature: "error<T>(message?, data?, code?)",
          description:
            'Failure body; message defaults to "操作失败", data defaults to null, code defaults to ERROR(500).',
          params: [
            {
              name: "message",
              type: "string",
              required: false,
              description: "Error message.",
            },
            {
              name: "data",
              type: "unknown",
              required: false,
              description: "Optional error payload.",
            },
            {
              name: "code",
              type: "number | ResponseCode",
              required: false,
              description: "Business error code.",
            },
          ],
        },
        {
          name: "toPageResult",
          description:
            "IPage → { total, list, pageNum, pageSize, pages } (pages computed from total/size).",
        },
        {
          name: "PageRequest / PageResult",
          description: "Pagination request/response types.",
        },
        {
          name: "snakeToCamel / rowToCamel / rowsToCamel / omitPassword",
          description:
            'Importable from @pangza/core. camelToSnake lives in utils/case but is not on the framework main entry; use import { camelToSnake } from "@pangza/core/utils/case".',
        },
        {
          name: "nextId (deprecated)",
          description: "Prefer snowflake / @TableId(IdType.ASSIGN_ID).",
        },
      ],
      functionalExample: `return ResponseData.success(toPageResult(page));
return ResponseData.error("无权限", null, ResponseCode.FORBIDDEN);

import { snakeToCamel, rowToCamel } from "@pangza/core";
import { camelToSnake } from "@pangza/core/utils/case";
rowToCamel({ user_name: "a" }); // { userName: "a" }
camelToSnake("userName"); // "user_name"`,
      decoratorExample: `// utils 以函数为主；Controller 直接 return 数据，由框架包装 ResponseData。
@GetMapping("/page")
async page() {
  const page = await this.userService.selectPage(...);
  return toPageResult(page);
}`,
    },
  ],
};

export const utilsConfig: DocPage = {
  key: "utils-config",
  title: "utils · Configuration",
  sections: [
    {
      id: "none",
      title: "Configuration",
      content: "The utils module has no standalone configuration; response codes use types.ResponseCode.",
      configs: [],
    },
  ],
};
