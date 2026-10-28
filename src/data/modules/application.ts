import type { DocPage } from "../../types/doc";
import {
  LOG_RECORD_OPTION_FIELDS,
  RATE_LIMIT_OPTION_FIELDS,
  REPEAT_SUBMIT_OPTION_FIELDS,
  ROUTE_OPTION_FIELDS,
  typeConfigs,
  typeParams,
} from "../typeFields";

export const applicationApi: DocPage = {
  key: "Application-api",
  title: "Application · API",
  description:
    "Express 应用门面（@pangza/core）：扫描业务、注册路由、鉴权/限流/校验/日志流水线，统一包装响应。IoC（Container / @Service 等）也在本包 Application 目录。典型用法：Application.registry(...).scan(...).start()。",
  sections: [
    {
      id: "overview",
      title: "模块说明",
      content:
        "Controller 装饰器在类加载时自动 registerController。start() 管线：installProcessErrorGuards → loadControllers → routes → listen → warmupConnections + runApplicationInits。关闭时 SIGINT/SIGTERM 逆序 runApplicationDestroys。",
    },
    {
      id: "lifecycle",
      title: "启动、预热与进程守卫",
      apis: [
        {
          name: "Application.start",
          signature: "static start(): typeof Application",
          description:
            "完整启动。业务侧通常 registry(...).start() 即可。",
        },
        {
          name: "applicationStart",
          description: "内部：真正 listen 与后续 init；一般无需直接调用。",
        },
        {
          name: "installProcessErrorGuards",
          description:
            "安装 uncaughtException / unhandledRejection 兜底，避免进程静默退出；start 时自动调用。",
        },
        {
          name: "warmupConnections",
          description:
            "listen 成功后按需预热：仅当已 registry EnableRedis / EnableOrm（或 Auth 绑定 redis）时连接；未启用则跳过，失败只打日志不阻断服务。",
        },
        {
          name: "EnableRedis / EnableOrm",
          signature: "EnableRedis(config?) / EnableOrm(config?)",
          description:
            "按需启用模块：Application.registry(EnableRedis()) / EnableOrm()。未注册时启动不连 Redis/数据库。",
        },
        {
          name: "Application.addRequestInterceptor",
          signature: "static addRequestInterceptor(fn): typeof Application",
          description:
            "请求前拦截（鉴权/限流之后、Controller 之前）。可设 skipHandler 跳过业务方法。",
        },
        {
          name: "Application.addResponseInterceptor",
          signature: "static addResponseInterceptor(fn): typeof Application",
          description:
            "响应前拦截。默认仍包装 ResponseData；ctx.wrap=false 则直接 send；ctx.handled=true 或自行 res.json 后框架不再写响应。",
        },
        {
          name: "ApplicationInit",
          signature: "interface { init(): void | Promise<void> }",
          description:
            "实现类须已 bindClass 进 Container；listen 成功后按注册顺序调用 init()。",
        },
        {
          name: "ApplicationDestroy",
          signature: "interface { destroy(): void | Promise<void> }",
          description: "进程退出时逆序调用 destroy()，用于关连接、停调度等。",
        },
        {
          name: "hasAuth / hasLog / hasRedis / hasOrm",
          description:
            "是否已 registry 过 Auth/Log/EnableRedis/EnableOrm；影响鉴权、日志与连接预热。",
        },
        {
          name: "registerController / getScanRoots / loadControllers",
          description:
            "装饰器注册控制器元数据；获取扫描根；按约定加载业务模块（entity→mapper→service→controller 等）。",
        },
      ],
      decoratorExample: `@Component()
class RedisWarmup implements ApplicationInit, ApplicationDestroy {
  async init() {
    await Redis.connect();
  }
  async destroy() {
    await Redis.disconnect();
  }
}`,
      functionalExample: `import { Application, Logger } from "@pangza/core";
import { EnableOrm } from "@pangza/orm";
import Redis, { EnableRedis } from "@pangza/redis";
import Auth from "@pangza/auth";
import Log from "@pangza/log";

Application
  .registry(Logger({ level: "info" }))
  .registry(EnableOrm())
  .registry(EnableRedis())
  .registry(Auth({ redis: Redis }))
  .registry(Log({ writer }))
  .scan("src")
  .start();

Application.addResponseInterceptor(async (ctx) => {
  ctx.wrap = false; // 跳过默认 ResponseData
  return { code: 0, result: ctx.data };
});

// start 内部：installProcessErrorGuards → loadControllers → routes
// listen →（按需）warmupConnections + runApplicationInits`,
    },
    {
      id: "scan-registry",
      title: "扫描与中间件",
      apis: [
        {
          name: "Application.scan",
          signature: "static scan(...dirs: Array<string | string[]>): typeof Application",
          description: "追加模块扫描根目录。未调用时默认扫描 src/business。",
          params: [
            {
              name: "dirs",
              type: "string | string[]",
              required: true,
              description: "相对 cwd 或绝对路径，可多次调用叠加",
            },
          ],
        },
        {
          name: "Application.registry",
          signature: "static registry(param: any): typeof Application",
          description:
            "app.use 中间件；Auth/Log/Logger/Json/EnableRedis/EnableOrm 等工厂产物会打标或配置模块。",
          params: [
            {
              name: "param",
              type: "Middleware | Middleware[]",
              required: true,
              description: "Express 中间件或数组",
            },
          ],
        },
        {
          name: "Application.static",
          signature:
            "static static(url | urls | map, rootDir?): typeof Application",
          description:
            "挂载静态资源。可 URL 与目录同名，或指定 URL→磁盘目录；也可用 yaml 的 upload.path / upload.urlPrefix 自行 app.use。",
          params: [
            {
              name: "urlOrMap",
              type: "string | string[] | Record<string, string>",
              required: true,
              description:
                '如 "public"；["public","assets"]；"/files"+"upload"；{ "/files": "upload" }',
            },
            {
              name: "rootDir",
              type: "string",
              required: false,
              description: "与单个 url 联用：磁盘目录（相对 cwd 或绝对路径）",
            },
          ],
        },
        {
          name: "Application.getApp",
          signature: "static getApp(): Express",
          description: "获取底层 Express 实例，用于自定义中间件。",
        },
      ],
      decoratorExample: `// 扫描依赖目录约定，无额外装饰器`,
      functionalExample: `import { Application, UPLOAD_PATH, UPLOAD_URL_PREFIX } from "@pangza/core";
import express from "express";

Application
  .scan("src")
  .registry(express.json())
  // URL 与目录同名
  .static("public")
  // 指定访问前缀 → 磁盘目录
  .static("/files", "upload")
  .static({ "/static": "public", "/assets": "assets" })
  .start();

// 或与 yaml upload.path / upload.urlPrefix 对齐：
const app = Application.getApp();
app.use(UPLOAD_URL_PREFIX, express.static(UPLOAD_PATH));`,
    },
    {
      id: "routes",
      title: "路由注册",
      apis: [
        {
          name: "Application.GET / POST / PUT / DELETE",
          signature:
            "static GET(path, callback, option?: RouteOption): typeof Application",
          description:
            "函数式注册路由。第三参 option 为 RouteOption，下表展开全部字段（含 auth / log / rateLimit 等）。",
          params: [
            { name: "path", type: "string", required: true, description: "路由路径" },
            {
              name: "callback",
              type: "(...args) => any | Promise<any>",
              required: true,
              description: "处理器",
            },
            {
              name: "option",
              type: "RouteOption",
              required: false,
              description: "可选路由级配置；字段见下方 option.*。",
            },
            ...typeParams(ROUTE_OPTION_FIELDS, "zh", "option"),
          ],
        },
        {
          name: "@Controller",
          signature: "@Controller(prefix?: string)",
          description: "标记控制器并设置路径前缀；类加载时自动注册路由。",
          params: [
            {
              name: "prefix",
              type: "string",
              default: '""',
              description: "统一前缀，如 /api/user",
            },
          ],
        },
        {
          name: "@GetMapping / @PostMapping / @PutMapping / @DeleteMapping",
          signature: "@GetMapping(path?: string, option?: RouteOption)",
          description:
            "注册 HTTP 方法与子路径。option 与 Application.GET 的 RouteOption 相同，字段见下。",
          params: [
            {
              name: "path",
              type: "string",
              required: false,
              default: '""',
              description: "相对 @Controller 前缀的子路径。",
            },
            {
              name: "option",
              type: "RouteOption",
              required: false,
              description: "可选；字段见下方 option.*。",
            },
            ...typeParams(ROUTE_OPTION_FIELDS, "zh", "option"),
          ],
        },
      ],
      decoratorExample: `@Controller("/api/user")
class UserController {
  @GetMapping("/list")
  list() { return []; }

  @PostMapping("/create", { auth: { permissions: ["sys:user:add"] } })
  create(@RequestBody() body: CreateUserDto) {}
}`,
      functionalExample: `Application.POST("/api/ping", async () => ({ ok: true }), {
  auth: { ignore: true },
  log: { title: "ping" },
});`,
    },
    {
      id: "auth-decorators",
      title: "鉴权装饰器",
      apis: [
        {
          name: "@AuthCheckLogin / @AuthCheckRole / @AuthCheckPermission / @AuthIgnore",
          description:
            "方法级鉴权。Role/Permission 可传 string[] 与 { mode: 'OR' | 'AND' } 覆盖全局 checkMode。",
          params: [
            {
              name: "roles / permissions",
              type: "string[]",
              required: true,
              description: "角色或权限码列表（对应装饰器）",
            },
            {
              name: "option.mode",
              type: '"OR" | "AND"',
              default: "全局 Auth.checkMode",
              description: "数组内匹配模式",
            },
          ],
        },
      ],
      decoratorExample: `@GetMapping("/me")
@AuthCheckLogin()
async me() {
  return { id: await AuthUtil.getLoginId() };
}

@GetMapping("/admin")
@AuthCheckPermission(["sys:a", "sys:b"], { mode: "AND" })
admin() {}`,
      functionalExample: `Application.GET("/api/admin", handler, {
  auth: { roles: ["admin"], roleMode: "OR" },
});`,
    },
    {
      id: "params",
      title: "@RequestBody / Query / Header / Cookie / Path",
      content:
        "参数装饰器按形参下标写入 MethodParamMeta。全部无参（除 @RequestPath 可选 index）。无任何参数装饰器时，回调默认收到整个 req。",
      apis: [
        {
          name: "@RequestBody",
          signature: "@RequestBody()",
          description: "注入 req.body。常配合 @Validate 与 DTO 类。",
        },
        {
          name: "@RequestQuery",
          signature: "@RequestQuery()",
          description: "注入整个 req.query 对象（不是单个 query 名）。",
        },
        {
          name: "@RequestHeader",
          signature: "@RequestHeader()",
          description:
            "注入整个 req.headers（小写键）。不能传头名字符串；取单头请在方法内 headers['x-request-id']。",
        },
        {
          name: "@RequestCookie",
          signature: "@RequestCookie()",
          description:
            "注入整个 req.cookies。需自行挂 cookie-parser 等中间件，否则可能为 undefined。",
        },
        {
          name: "@RequestPath",
          signature: "@RequestPath(index?: number)",
          description:
            "无参：仅一个路径参数时传该值，多个时传值数组。@RequestPath(0) 按顺序取第 n 个。",
          params: [
            {
              name: "index",
              type: "number",
              description: "路径参数下标（从 0 开始）；省略见上",
            },
          ],
        },
        {
          name: "ParamType",
          description:
            "枚举：BODY / QUERY / PARAMS / HEADER / COOKIE / PATH。旧版单参 option.paramType 或装饰器写入 MethodParamMeta。",
        },
      ],
      decoratorExample: `@PostMapping("/create")
create(
  @RequestBody() body: CreateUserDto,
  @RequestHeader() headers: Record<string, string | string[] | undefined>
) {
  const rid = headers["x-request-id"];
  return this.userService.insert(body);
}

@GetMapping("/search")
search(@RequestQuery() query: Record<string, unknown>) {
  return query.keyword;
}

@GetMapping("/:id")
detail(@RequestPath(0) id: string) {}

@GetMapping("/:a/:b")
pair(@RequestPath() parts: string[]) {
  // 无 index 且多段 → 数组
}`,
      functionalExample: `// 函数式路由通常直接用 (req, res)；需要统一包装时用 Controller + 参数装饰器
Application.POST("/api/demo", async (req, res) => {
  res.json(req.body);
}, { raw: true });`,
    },
    {
      id: "value",
      title: "@Value 注入 YAML",
      content:
        "属性懒注入：首次读取属性时从合并后的 application*.yaml 取值。\n必填只有 expression（配置路径）；defaultValue 可选。\nexpression 三种写法：server.port｜${server.port}｜${server.port:3990}（冒号后为占位符默认，经 coerceConfigScalar）。若同时传 defaultValue，以第二参数为准。\n函数式等价 API 见 config 模块的 getConfigValue / getConfig。\n若要按 YAML 前缀给整类灌配置，见 config · @ConditionOnProperty。",
      apis: [
        {
          name: "@Value",
          signature: "@Value(expression: string, defaultValue?: unknown)",
          description:
            "在类属性上挂 getter；首次 get 调用 getConfigValue(expression, defaultValue)。可赋值覆盖该属性。",
          returns: "装饰器本身无返回值；属性类型即配置值类型。",
          params: [
            {
              name: "expression",
              type: "string",
              required: true,
              description:
                "YAML 点路径。① server.port ② ${server.port} ③ ${server.port:3990}。空字符串会抛错。",
            },
            {
              name: "defaultValue",
              type: "unknown",
              required: false,
              description:
                "路径缺失时的回退值。可选；传入时覆盖 ${path:default} 中的默认。",
            },
          ],
        },
      ],
      decoratorExample: `import { Component, Value } from "@pangza/core";

@Component()
class AppSettings {
  // 只传必填路径
  @Value("server.port")
  port!: number;

  // 占位符路径（无默认）
  @Value("\${redis.host}")
  redisHost!: string;

  // 占位符 + 内嵌默认
  @Value("\${upload.path:upload}")
  uploadPath!: string;

  // 第二参数默认（优先于占位符默认）
  @Value("orm.logicDelete", true)
  logicDelete!: boolean;
}`,
      functionalExample: `import { getConfigValue, getConfig } from "@pangza/core";

// getConfigValue(pathOrExpression, defaultValue?)
// pathOrExpression 必填；defaultValue 可选
const port = getConfigValue<number>("server.port");
const host = getConfigValue("redis.host", "127.0.0.1");
const withPlaceholder = getConfigValue("\${server.port:3990}");

// getConfig() 无参数 → 整份 YAML
const root = getConfig();`,
    },
    {
      id: "cross-cutting",
      title: "横切：校验 / 日志 / 限流 / SSE",
      apis: [
        {
          name: "@Validate",
          description:
            "方法开启入参校验（需安装 @pangza/validate）。按 design:paramtypes 对 DTO 跑规则。详见 Validate 模块。",
        },
        {
          name: "@Log",
          description: "方法级操作日志 LogRecordOption。详见 Log 模块。",
        },
        {
          name: "@RateLimiter / @RepeatSubmit",
          description: "限流与防重。详见 Redis 模块。",
        },
        {
          name: "@Flux",
          description: "SSE：自动写 Content-Type: text/event-stream；回调自行 write/end。",
        },
      ],
      decoratorExample: `@PostMapping("/create")
@AuthCheckLogin()
@Validate()
@Log({ title: "新增用户" })
@RateLimiter({ time: 10, count: 5, type: "IP" })
create(@RequestBody() body: CreateUserDto) {
  return this.userService.insert(body);
}

@GetMapping("/stream")
@Flux()
stream(_req: Request, res: Response) {
  res.write("data: hello\\n\\n");
  res.end();
}`,
      functionalExample: `Application.POST("/api/demo", handler, {
  validate: true,
  log: { title: "演示" },
  rateLimit: { time: 10, count: 5, type: "IP" },
  repeatSubmit: { interval: 3000 },
  flux: false,
  raw: false,
});`,
    },
  ],
};

export const applicationConfig: DocPage = {
  key: "Application-config",
  title: "Application · 配置项",
  description: "Application 本身无独立 YAML；路由行为由 RouteOption 与 server 配置驱动。",
  sections: [
    {
      id: "server",
      title: "关联 server 配置（application.yaml）",
      configs: [
        {
          name: "server.port",
          type: "number",
          default: "3990",
          description: "HTTP 监听端口，导出为 PORT",
        },
        {
          name: "server.trustProxy",
          type: "boolean",
          default: "false",
          description:
            "是否信任 X-Forwarded-For。false 时只用直连 IP，防伪造绕过 IP 限流与操作日志 IP",
        },
      ],
      functionalExampleTitle: "配置示例",
      functionalExample: `server:
  port: 3990
  trustProxy: false`,
    },
    {
      id: "route-option",
      title: "RouteOption 字段",
      content:
        "Application.GET/POST 与 @GetMapping 等的 option 参数。嵌套类型在下方分表展开。",
      configs: typeConfigs(ROUTE_OPTION_FIELDS, "zh"),
      functionalExample: `Application.POST("/api/demo", handler, {
  auth: { permissions: ["sys:demo"], permissionMode: "AND" },
  rateLimit: { time: 10, count: 5, type: "IP" },
  repeatSubmit: { interval: 3000 },
  log: { title: "演示" },
  validate: true,
});`,
    },
    {
      id: "route-option-nested",
      title: "RouteOption 嵌套类型",
      content:
        "option.log → LogRecordOption；option.rateLimit → RateLimitOption；option.repeatSubmit → RepeatSubmitOption。",
      configs: [
        ...typeConfigs(LOG_RECORD_OPTION_FIELDS, "zh").map((c) => ({
          ...c,
          name: `log.${c.name}`,
        })),
        ...typeConfigs(RATE_LIMIT_OPTION_FIELDS, "zh").map((c) => ({
          ...c,
          name: `rateLimit.${c.name}`,
        })),
        ...typeConfigs(REPEAT_SUBMIT_OPTION_FIELDS, "zh").map((c) => ({
          ...c,
          name: `repeatSubmit.${c.name}`,
        })),
      ],
    },
  ],
};
