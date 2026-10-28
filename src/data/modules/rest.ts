import type { DocPage } from "../../types/doc";
import {
  SCHEDULE_JOB_ENTITY_FIELDS,
  SCHEDULE_MODULE_OPTIONS_FIELDS,
  objectParamWithFields,
  typeConfigs,
  typeParams,
} from "../typeFields";

export const validateApi: DocPage = {
  key: "Validate-api",
  title: "Validate · API",
  description:
    "独立包 @pangza/validate：DTO 属性规则 + 方法 @Validate，按 design:paramtypes 校验注入参数。需 experimentalDecorators + emitDecoratorMetadata，并 import reflect-metadata。脚手架勾选 validate 会写入依赖。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        {
          name: "安装",
          description: 'npm i @pangza/validate；import { Validate, NotNull, … } from "@pangza/validate"。',
        },
        {
          name: "@Validate",
          description:
            "方法装饰器：写入 validate 元数据与 paramTypes，路由执行前校验带规则的入参（需已安装本包）。",
        },
        {
          name: "@NotNull",
          signature: "@NotNull() | @NotNull('消息') | @NotNull({ message })",
          description: "值不能为 null / undefined / ''。",
          params: [
            {
              name: "message | options",
              type: "string | { message?: string }",
              required: false,
              description: "失败提示；可直接传字符串，或 { message }。省略用默认文案。",
            },
          ],
        },
        {
          name: "@Min / @Max",
          signature: "@Min(n, message?) / @Max(n, message?)",
          description: "数值比较，或字符串长度边界。",
          params: [
            {
              name: "n",
              type: "number",
              required: true,
              description: "边界值；对 string 按 length 比较。",
            },
            {
              name: "message",
              type: "string",
              required: false,
              description: "失败提示文案。",
            },
          ],
        },
        {
          name: "@Email / @Phone",
          signature: "@Email(message?) / @Phone({ locale?, message? })",
          description: "邮箱格式；手机号默认 locale=zh-CN。",
          params: [
            {
              name: "message | options",
              type: "string | { locale?, message? }",
              required: false,
              description: "@Email 可传消息字符串；@Phone 可传 { locale?, message? }（locale 默认 zh-CN）。",
            },
          ],
        },
        {
          name: "@Custom",
          signature: "@Custom(fn, message?)",
          description:
            "自定义 (value, object)=> boolean | Promise<boolean>；返回 false 则失败。",
          params: [
            {
              name: "fn",
              type: "(value, object) => boolean | Promise<boolean>",
              required: true,
              description: "返回 false 表示校验失败。",
            },
            {
              name: "message",
              type: "string",
              required: false,
              description: "失败提示文案。",
            },
          ],
        },
        {
          name: "validateHandler / validateHandlerSync / validateMethodArgs",
          description:
            "手动校验对象或方法实参；失败抛 ValidationError（含 errors: FieldError[]）。",
        },
        {
          name: "notNull / min / max / email / phone / custom",
          description: "规则工厂，供 validateHandler(obj, { field: [notNull(), min(3)] }) 使用。",
        },
        {
          name: "getClassRules / isMethodValidate / getMethodParamTypes",
          description: "读取类规则 map、方法是否开启校验、方法参数类型列表。",
        },
      ],
      decoratorExample: `import { Validate, NotNull, Min, Email, Phone, Custom } from "@pangza/validate";
import { PostMapping, RequestBody } from "@pangza/core";

class CreateUserDto {
  @NotNull("用户名不能为空")
  @Min(3, "至少 3 个字符")
  username!: string;

  @Email("邮箱不合法")
  email!: string;

  @Phone({ locale: "zh-CN" })
  mobile!: string;

  @Custom((v) => typeof v === "string" && v.length >= 6, "密码至少 6 位")
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
  title: "Validate · 配置项",
  description: "无 YAML；依赖编译期装饰器元数据。",
  sections: [
    {
      id: "rules",
      title: "规则参数与错误结构",
      configs: [
        { name: "RuleOptions.message", type: "string", description: "失败提示；也可直接传字符串" },
        { name: "NotNull", type: "装饰器", description: "拒绝 null / undefined / 空串" },
        { name: "Min / Max.value", type: "number", description: "边界；对 string 按 length" },
        { name: "Phone.locale", type: "string", default: "zh-CN", description: "手机号地区" },
        { name: "Custom.fn", type: "(value, object)=>boolean|Promise", description: "自定义校验" },
        {
          name: "ValidationError.errors",
          type: "FieldError[]",
          description: "字段级 { property, message, value? } 列表",
        },
      ],
      functionalExampleTitle: "错误形态",
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
    "属 @pangza/core：全局异常匹配与响应（@ControllerAdvice / registerHandler）。路由 catch 调用 handleException：先自定义再内置 Auth/Orm/Guard/Validation/Biz。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        {
          name: "@ControllerAdvice",
          description: "实例化并注册类上所有 @ExceptionHandler。",
        },
        {
          name: "@ExceptionHandler",
          signature: "@ExceptionHandler(errorType?: Function)",
          description: "默认 Error 兜底；按类型精确匹配，再走继承链。",
          params: [
            {
              name: "errorType",
              type: "Function",
              required: false,
              default: "Error",
              description: "要匹配的错误类；省略则兜底 Error。",
            },
          ],
        },
        {
          name: "registerHandler",
          signature: "registerHandler(errorType, handler)",
          description: "函数式注册；handler(error, ctx)=> ExceptionHandlerResult。",
          params: [
            {
              name: "errorType",
              type: "Function",
              required: true,
              description: "要处理的错误类。",
            },
            {
              name: "handler",
              type: "(error, ctx) => ExceptionHandlerResult",
              required: true,
              description: "返回响应形态；null/undefined 则继续走内置处理。",
            },
          ],
        },
        {
          name: "registerExceptionHandler / clearExceptionHandlers / getExceptionHandlers / resolveExceptionHandler",
          description: "注册表底层 API：写入、清空、列表、按 error 解析处理器。",
        },
        {
          name: "handleException",
          description: "统一入口；已写响应则跳过。",
        },
        {
          name: "BizException",
          signature: "new BizException(message?, code?, data?, httpStatus?)",
          description:
            "业务异常。默认 code=ERROR，httpStatus=200（业务码在 body）。",
          params: [
            {
              name: "message",
              type: "string",
              required: false,
              default: '"操作失败"',
              description: "错误提示文案。",
            },
            {
              name: "code",
              type: "ResponseCode",
              required: false,
              default: "ERROR",
              description: "业务错误码，写入响应 body。",
            },
            {
              name: "data",
              type: "unknown",
              required: false,
              default: "null",
              description: "附带业务数据。",
            },
            {
              name: "httpStatus",
              type: "number",
              required: false,
              default: "200",
              description: "HTTP 状态码（业务失败也常用 200，靠 body.code 区分）。",
            },
          ],
        },
        {
          name: "Exception()",
          description: "占位工厂，可供 registry；实际仍靠 handleException。",
        },
        {
          name: "ExceptionHandlerResult",
          description:
            "{ message?, code?, data?, httpStatus?, rawBody? }；null/undefined 走内置；rawBody 直接 send。",
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
  title: "Exception · 配置项",
  description: "无 YAML。匹配顺序：精确类型 → 继承链 → Error 兜底。",
  sections: [
    {
      id: "builtin",
      title: "内置映射",
      configs: [
        { name: "BizException", type: "Exception", description: "按 e.httpStatus / e.code / e.message / e.data 返回" },
        { name: "ValidationError", type: "Exception", description: "校验失败，body 附 errors" },
        { name: "NotLoginError / NotRoleError / NotPermissionError", type: "AuthError", description: "未登录/无角色/无权限 → 对应 HTTP/业务码" },
        { name: "OrmError / OptimisticLockError", type: "Exception", description: "ORM 错误" },
        { name: "GuardError / LockError", type: "Exception", description: "限流防重 / 锁失败" },
      ],
      functionalExampleTitle: "响应形态示例",
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
    "属 @pangza/core：响应序列化（日期格式、空值策略、DTO convert / pick）。从 @pangza/core 导入，不再经 Application 再导出。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        {
          name: "@JsonFormat",
          signature: "@JsonFormat({ pattern?, timezone? })",
          description: "日期输出格式；timezone 为小时偏移（如 8 表示 UTC+8）。",
          params: [
            {
              name: "pattern",
              type: "string",
              required: false,
              description: "日期格式 pattern。",
            },
            {
              name: "timezone",
              type: "string",
              required: false,
              description: "时区。",
            },
          ],
        },
        {
          name: "@JsonInclude",
          signature: "@JsonInclude(JsonIncludeType)",
          description:
            "ALWAYS=全输出；NON_NULL=跳过 null；NON_EMPTY=跳过空串/空数组/空对象；NON_DEFAULT=跳过默认值。",
          params: [
            {
              name: "value",
              type: "JsonIncludeType",
              required: true,
              description: "包含策略枚举（ALWAYS / NON_NULL / NON_EMPTY 等）。",
            },
          ],
        },
        {
          name: "@JsonProperty",
          description: "标记字段参与 convert 投影（与 beanKeys 配合）。",
        },
        {
          name: "ObjectMapper.writeValue / configure",
          description: "序列化对象为 JSON 字符串/结构；全局 dateFormat/deep/include。",
        },
        {
          name: "convert / copyProperties / pick",
          description: "源对象 → 目标类实例；拷贝属性；按 key 列表挑选。",
        },
        {
          name: "formatDate / shouldOmitByInclude",
          description: "按 pattern 格式化日期；按 Include 策略判断是否省略字段。",
        },
        {
          name: "getJsonFieldFormats* / addBeanKey / getBeanKeys",
          description: "读取字段格式元数据；登记/读取 Bean 属性键（供 convert）。",
        },
        {
          name: "Json(opts?)",
          description: "Application.registry(Json(opts))，等同 configure。",
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
  title: "Json · 配置项",
  description: "ObjectMapper.configure 或 Application.registry(Json(opts))。",
  sections: [
    {
      id: "opts",
      title: "选项",
      configs: [
        { name: "dateFormat", type: "string", description: "全局日期格式，如 yyyy-MM-dd HH:mm:ss" },
        { name: "deep", type: "boolean", default: "true", description: "是否深度处理嵌套对象" },
        {
          name: "include",
          type: "JsonIncludeType",
          description: "ALWAYS | NON_NULL | NON_EMPTY | NON_DEFAULT",
        },
        {
          name: "@JsonFormat.pattern",
          type: "string",
          description: "字段级日期 pattern，覆盖全局",
        },
        {
          name: "@JsonFormat.timezone",
          type: "number",
          description: "小时偏移，如 8=UTC+8",
        },
      ],
    },
  ],
};

export const logApi: DocPage = {
  key: "Log-api",
  title: "Log · API",
  description:
    "包 @pangza/log：操作审计。registry(Log({ writer })) 后由 @Log / option.log 在 finally 异步落库；失败默认不影响业务。方法装饰器 @Log 从 @pangza/core 导入。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        {
          name: "Log / LogModule",
          description:
            "操作日志工厂：Application.registry(Log({ writer }))。framework 主入口再导出名为 LogModule，避免与方法装饰器 @Log 混淆；二者指向同一工厂。",
        },
        {
          name: "configureLog",
          description: "仅配置不挂中间件；通常用 Log(options) 即可。",
        },
        {
          name: "@Log",
          description:
            "方法级装饰器（Application 导出），写入 LogRecordOption；也可写在 RouteOption.log。",
        },
        {
          name: "recordOperationLog",
          description: "组装 OperationLogRecord 并调用 writer；异常可 silent。",
        },
        {
          name: "getClientIp / resolveIpAddress / normalizeIp / isInternalIp",
          description:
            "IP 工具。getClientIp 受 server.trustProxy 影响；内网 IP 判断用于地址解析短路。",
        },
        {
          name: "BusinessType",
          description:
            "CREATE=0 UPDATE=1 DELETE=2 READ=3 LIST=4 UPLOAD=5 EXPORT=6 IMPORT=7 LOGIN=8 OTHER=9（入库为字符串序数）。",
        },
        {
          name: "OperType",
          description: "MOBILE=0 PC=1 OTHER=2。",
        },
        {
          name: "isLogRegistered / getLogOptions",
          description: "是否已 registry Log；读取模块配置。",
        },
        {
          name: "OperationLogRecord",
          description:
            "落库行字段：title/username/avatar/business/oper/params/response/methodName/controllerName/status/timeLong/ip/address/userAgent/url/errorMessage/deleteFlag/createTime。",
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
  title: "Log · 配置项",
  sections: [
    {
      id: "module",
      title: "LogModuleOptions",
      configs: [
        { name: "enabled", type: "boolean", default: "true", description: "总开关" },
        { name: "excludeParamNames", type: "string[]", default: "[]", description: "额外排除字段（另有 password 等内置脱敏）" },
        { name: "silent", type: "boolean", default: "false", description: "写失败是否静默" },
        { name: "writer", type: "(row: OperationLogRecord)=>void|Promise", description: "落库回调；未配则不写库" },
      ],
    },
    {
      id: "record",
      title: "LogRecordOption",
      configs: [
        { name: "title", type: "string", description: "操作标题" },
        { name: "business", type: "BusinessType", default: "OTHER", description: "业务类型序数" },
        { name: "oper", type: "OperType", default: "PC", description: "操作端" },
        { name: "excludeParamNames", type: "string[]", description: "本接口额外排除" },
        { name: "ignore", type: "boolean", description: "跳过记日志" },
      ],
    },
  ],
};

export const loggerApi: DocPage = {
  key: "Logger-api",
  title: "Logger · API",
  description:
    "属 @pangza/core：基于 pino 的应用日志（控制台 pretty + 文件双写）。import { Logger, getLogger } from \"@pangza/core\"。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        { name: "Logger(options?)", description: "registry 工厂 → configureLogger。" },
        { name: "configureLogger / getLogger / getRootLogger / logger", description: "配置与取 child logger（按 name）。" },
        { name: "ensureUtf8Console", description: "Windows 控制台 UTF-8。" },
        {
          name: "LogLevel",
          description: "fatal / error / warn / info / debug / trace / silent。",
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
  title: "Logger · 配置项",
  sections: [
    {
      id: "opts",
      title: "LoggerOptions",
      configs: [
        { name: "level", type: "string", default: '"info"', description: "fatal…silent" },
        { name: "console", type: "boolean", default: "true", description: "控制台输出" },
        { name: "pretty", type: "boolean", default: "非 production", description: "pino-pretty" },
        { name: "file", type: "boolean", default: "true", description: "写文件" },
        { name: "logDir", type: "string", default: '"logs"', description: "目录" },
        { name: "filename", type: "string", default: '"app.log"', description: "应用日志文件" },
        { name: "errorFilename", type: "string|false", default: '"error.log"', description: "错误文件；false 关闭" },
        { name: "pino", type: "object", description: "透传 pino 选项（无内置按日滚动时可用 pino 生态）" },
      ],
    },
  ],
};

export const configApi: DocPage = {
  key: "config-api",
  title: "config · API",
  description:
    "加载并导出 application.yaml 合并结果。Profile：PANGZA_PROFILE → APP_ENV → NODE_ENV → development。可按点路径动态取值、用 @ConditionOnProperty 按前缀灌类，或用 Application 的 @Value 注入属性。",
  sections: [
    {
      id: "apis",
      title: "公开导出",
      apis: [
        { name: "PORT / trustProxy", description: "server.port / server.trustProxy。" },
        { name: "redisConfig", description: "redis 段；详见 Redis 配置项。" },
        { name: "mysqlConfig / postgresqlConfig / mssqlConfig", description: "datasource.default / postgresql / sqlserver。" },
        { name: "UPLOAD_PATH / UPLOAD_URL_PREFIX", description: "upload.path / upload.urlPrefix。" },
        { name: "ormEnvConfig", description: "orm 段解析结果；详见 ORM 配置项。" },
        { name: "configProfile / configFiles", description: "当前 profile 名；已加载 YAML 路径列表。" },
        {
          name: "getConfig",
          signature: "getConfig(): Readonly<Record<string, unknown>>",
          description:
            "返回合并后的 YAML 根对象（只读视图，勿原地修改）。无参数。",
          returns: "Readonly 根对象，键与 application.yaml 顶层一致（如 server / redis / orm）。",
        },
        {
          name: "getConfigValue",
          signature: "getConfigValue<T>(pathOrExpression, defaultValue?): T",
          description:
            "按点路径读取 YAML。路径不存在时返回 defaultValue；若表达式写成 ${path:default} 且未传第二参数，则用占位符内默认值（经 coerceConfigScalar）。第二参数优先于占位符默认。",
          returns: "路径对应的原始 YAML 值，或默认值；未命中且无默认时为 undefined。",
          params: [
            {
              name: "pathOrExpression",
              type: "string",
              required: true,
              description:
                "配置路径。三种写法：① 点路径 server.port；② ${server.port}；③ ${server.port:3990}（冒号后为占位符默认）。按 . 分段深入对象。",
            },
            {
              name: "defaultValue",
              type: "T",
              required: false,
              description:
                "路径缺失（值为 undefined）时的回退。传入则覆盖 ${path:default} 里的默认。可不传。",
            },
          ],
        },
        {
          name: "parseValueExpression",
          signature: "parseValueExpression(expression: string): { path; defaultText? }",
          description: "把表达式拆成路径与可选默认值字符串。一般业务直接用 getConfigValue 即可。",
          returns: "{ path: string; defaultText?: string }",
          params: [
            {
              name: "expression",
              type: "string",
              required: true,
              description:
                "同 getConfigValue 的 pathOrExpression。非 ${...} 形式时整段当作 path，无 defaultText。",
            },
          ],
        },
        {
          name: "coerceConfigScalar",
          signature: "coerceConfigScalar(raw: string): unknown",
          description:
            "占位符默认值的轻量类型转换，供 ${path:default} 使用。true/false → boolean；null → null；整数/小数 → number；其余保持字符串。",
          returns: "转换后的标量。",
          params: [
            {
              name: "raw",
              type: "string",
              required: true,
              description: "${path:default} 中冒号后的默认值原文。",
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
      decoratorExample: `// 单属性注入见 Application · @Value
// 按 YAML 前缀灌整类见下方 @ConditionOnProperty`,
    },
    {
      id: "condition-on-property",
      title: "@ConditionOnProperty 按前缀灌配置",
      content:
        "类装饰器：按 YAML 前缀把 `prefix.属性名` 注入到类字段，并把该类注册进 IoC（首次解析时灌配置）。不必再写 @Component。\n优先级：**字段初始值 > YAML > options.defaults**。构造后字段不是 undefined 视为「有默认值」。\n会从 YAML 前缀节点发现字段（解决 `field!: type` 不在 Object.keys 的问题）。与 @Component 同用时，装饰器上下顺序无关。\n从 `@pangza/core` 导入。",
      apis: [
        {
          name: "@ConditionOnProperty",
          signature:
            "@ConditionOnProperty(prefix: string | { prefix: string; defaults?: Record<string, unknown> })",
          description:
            "类装饰器。容器创建实例时按属性名从 YAML 填充；bindClassWithActivation（若已 @Component 绑定则 rebind 挂 activation）。",
          returns: "ClassDecorator",
          params: [
            {
              name: "prefix",
              type: "string",
              required: true,
              description:
                'YAML 前缀，如 "ai.model.agnes" → 读 ai.model.agnes.apiKey 等。也可写成对象形式的 prefix 字段。',
            },
            {
              name: "defaults",
              type: "Record<string, unknown>",
              required: false,
              description:
                "装饰器级默认值：仅当字段无初始值、且 YAML 也缺失时使用。仅对象形式支持。",
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
  modelName!: string; // 无初始值 → 读 YAML
  baseURL!: string;
}

@ConditionOnProperty({ prefix: "server", defaults: { port: 5270 } })
class ServerSettings {
  port!: number;
}`,
      functionalExample: `import { getConfigValue } from "@pangza/core";

// 函数式等价：按路径取同一段配置
getConfigValue("redis.port");
getConfigValue<string[]>("redis.roles");
getConfigValue("redis.nodes");`,
    },
  ],
};

export const configConfig: DocPage = {
  key: "config-config",
  title: "config · 配置项",
  description:
    "加载顺序：application.yaml → application-{profile}.yaml → CONFIG_PATH 或 --config 指定文件（后者覆盖前者）。",
  sections: [
    {
      id: "profile",
      title: "Profile 与加载",
      configs: [
        { name: "PANGZA_PROFILE", type: "env", description: "最高优先 profile" },
        { name: "APP_ENV / NODE_ENV", type: "env", description: "次级；默认 development" },
        { name: "CONFIG_PATH", type: "env", description: "额外 YAML 路径" },
        { name: "--config / --config=", type: "CLI", description: "额外 YAML，同 CONFIG_PATH" },
      ],
      functionalExampleTitle: "配置示例",
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
        { name: "port", type: "number", default: "3990", description: "监听端口 → PORT" },
        { name: "trustProxy", type: "boolean", default: "false", description: "信任转发 IP 头 → trustProxy" },
      ],
    },
    {
      id: "upload",
      title: "upload",
      configs: [
        { name: "path", type: "string", default: "upload", description: "保存目录 → UPLOAD_PATH" },
        { name: "urlPrefix", type: "string", default: "/files", description: "静态访问前缀 → UPLOAD_URL_PREFIX" },
      ],
      functionalExampleTitle: "配置示例",
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
    "包 @pangza/schedule：node-cron 调度。loadJobs 加载任务，按 beanName 从 Container 取 Bean，调用 execute() 或 run()。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        {
          name: "ScheduleManager.scheduleJob",
          signature: "scheduleJob(entity: ScheduleJobEntity): void",
          description:
            "注册或替换任务。status 空或 0 → 停用并 unschedule；否则校验 cron 与 Bean 后 schedule。下表为 ScheduleJobEntity 全部字段。",
          params: objectParamWithFields("zh", {
            name: "entity",
            typeName: "ScheduleJobEntity",
            required: true,
            summaryZh: "必填。任务实体对象。",
            summaryEn: "",
            fields: SCHEDULE_JOB_ENTITY_FIELDS,
          }),
        },
        {
          name: "ScheduleManager.unschedule",
          signature: "unschedule(id: string): void",
          description: "按任务 id 停止并移除。",
          params: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "要从调度器移除的任务 id。",
            },
          ],
        },
        {
          name: "ScheduleManager.runOnce",
          signature: "runOnce(entity | beanName): Promise<void>",
          description:
            "立即触发一次（不依赖 cron）。传实体时用 entity.beanName；传字符串则当作 beanName。实体字段同 ScheduleJobEntity。",
          params: [
            {
              name: "entity | beanName",
              type: "ScheduleJobEntity | string",
              required: true,
              description:
                "完整实体或 Container 别名；调用 Bean.execute() 或 run()。若传实体，字段见下方 entity.*。",
            },
            ...typeParams(SCHEDULE_JOB_ENTITY_FIELDS, "zh", "entity"),
          ],
        },
        {
          name: "ScheduleManager.loadEnabled",
          description: "调用 loadJobs，对返回列表逐条 scheduleJob。",
        },
        {
          name: "configureSchedule / initScheduleJobs",
          signature: "configureSchedule(options?: ScheduleModuleOptions) / initScheduleJobs()",
          description:
            "configureSchedule 注入任务加载器；initScheduleJobs 在启动期 await loadEnabled。",
          params: objectParamWithFields("zh", {
            name: "options",
            typeName: "ScheduleModuleOptions",
            required: false,
            summaryZh: "configureSchedule 的可选参数。",
            summaryEn: "",
            fields: SCHEDULE_MODULE_OPTIONS_FIELDS,
          }),
        },
        {
          name: "convertQuartzCron / validateCron",
          description: "Quartz ? → *；校验 5 或 6 段；非法抛 OrmError。",
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
  title: "schedule · 配置项",
  sections: [
    {
      id: "opts",
      title: "选项与实体",
      content:
        "configureSchedule 的 ScheduleModuleOptions，以及 scheduleJob / runOnce 的 ScheduleJobEntity 字段。",
      configs: [
        ...typeConfigs(SCHEDULE_MODULE_OPTIONS_FIELDS, "zh"),
        ...typeConfigs(SCHEDULE_JOB_ENTITY_FIELDS, "zh").map((c) => ({
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
    "包 @pangza/encrypt：AES ECB+PKCS7 加解密与内存动态会话密钥（固定 5 分钟过期）。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        {
          name: "AESUtil.encrypt / decrypt",
          description: "key 须 16 字节 UTF-8；密文 Base64。",
        },
        {
          name: "DynamicAesKeyManager.generateDynamicKey",
          description: "返回 { sessionId, aesKey(Base64) }，并缓存 300000ms。",
        },
        {
          name: "getAesKeyBySessionId / removeKey",
          description: "按会话取密钥（过期 null）/ 主动删除。",
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
  title: "encrypt · 配置项",
  sections: [
    {
      id: "notes",
      title: "说明",
      content: "无 YAML。动态密钥过期固定 300000ms（5 分钟）。生产请评估密钥存储与轮换策略。",
      configs: [
        { name: "key length", type: "16 bytes", description: "AESUtil 密钥长度" },
        { name: "session TTL", type: "number", default: "300000", description: "动态密钥存活毫秒" },
      ],
    },
  ],
};

export const langchainApi: DocPage = {
  key: "langchain-api",
  title: "langchain · API",
  description: "预留模块：AiModel(model) 装饰器目前为空实现。",
  sections: [
    {
      id: "status",
      title: "现状",
      content: "框架已放置 langchain/decorators.ts 占位，尚无完整公开能力。文档站保留导航以便后续扩展。",
      apis: [
        {
          name: "AiModel",
          signature: "AiModel(model: string)",
          description: "占位装饰器，当前无运行时行为。",
          params: [
            {
              name: "model",
              type: "string",
              required: true,
              description: "模型名占位（装饰器目前为空实现）。",
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
  title: "langchain · 配置项",
  sections: [
    {
      id: "none",
      title: "配置",
      content: "暂无配置项。",
      configs: [],
    },
  ],
};

export const typesApi: DocPage = {
  key: "types-api",
  title: "types · API",
  description: "属 @pangza/core：框架级枚举，如 ResponseCode。",
  sections: [
    {
      id: "apis",
      title: "公开类型",
      apis: [
        {
          name: "ResponseCode",
          description:
            "SUCCESS=200, ERROR/INTERNAL=500, UNAUTHORIZED=401, FORBIDDEN=403, NOT_FOUND=404, BAD_REQUEST=400, CONFLICT=409。",
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
  title: "types · 配置项",
  sections: [
    {
      id: "none",
      title: "配置",
      content: "类型模块无运行时配置。",
      configs: [],
    },
  ],
};

export const utilsApi: DocPage = {
  key: "utils-api",
  title: "utils · API",
  description:
    "属 @pangza/core：HTTP 响应包装、分页转换、命名风格与 ID 工具。",
  sections: [
    {
      id: "apis",
      title: "公开 API",
      apis: [
        {
          name: "ResponseData.success",
          signature: "success<T>(data: T, message?: string)",
          description: '统一成功体 { code: SUCCESS, message, data }；message 默认「操作成功」。',
          params: [
            {
              name: "data",
              type: "T",
              required: true,
              description: "成功响应体中的业务数据。",
            },
            {
              name: "message",
              type: "string",
              required: false,
              description: "可选成功提示文案。",
            },
          ],
        },
        {
          name: "ResponseData.error",
          signature: "error<T>(message?, data?, code?)",
          description:
            "失败体；message 默认「操作失败」，data 默认 null，code 默认 ERROR(500)。",
          params: [
            {
              name: "message",
              type: "string",
              required: false,
              description: "错误提示文案。",
            },
            {
              name: "data",
              type: "unknown",
              required: false,
              description: "可选错误附带数据。",
            },
            {
              name: "code",
              type: "number | ResponseCode",
              required: false,
              description: "业务错误码。",
            },
          ],
        },
        {
          name: "toPageResult",
          description:
            "IPage → { total, list, pageNum, pageSize, pages }（pages 由 total/size 计算）。",
        },
        {
          name: "PageRequest / PageResult",
          description: "分页请求/响应类型。",
        },
        {
          name: "snakeToCamel / rowToCamel / rowsToCamel / omitPassword",
          description:
            "从 @pangza/core 可直接 import。camelToSnake 同在 utils/case，但未挂到 framework 主入口，需 import { camelToSnake } from \"@pangza/core/utils/case\"。",
        },
        {
          name: "nextId (deprecated)",
          description: "请改用雪花 / @TableId(IdType.ASSIGN_ID)。",
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
  title: "utils · 配置项",
  sections: [
    {
      id: "none",
      title: "配置",
      content: "工具模块无独立配置；响应 code 使用 types.ResponseCode。",
      configs: [],
    },
  ],
};
