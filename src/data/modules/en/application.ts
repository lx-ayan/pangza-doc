import type { DocPage } from "../../../types/doc";
import {
  LOG_RECORD_OPTION_FIELDS,
  RATE_LIMIT_OPTION_FIELDS,
  REPEAT_SUBMIT_OPTION_FIELDS,
  ROUTE_OPTION_FIELDS,
  typeConfigs,
  typeParams,
} from "../../typeFields";

export const applicationApi: DocPage = {
  key: "Application-api",
  title: "Application Â· API",
  description:
    "Express application facade (@pangza/core): scans business modules, registers routes, and runs auth / rate-limit / validation / logging pipelines with a unified response wrapper. IoC (Container / @Service, â€? also lives under Application in this package. Typical: Application.registry(...).scan(...).start().",
  sections: [
    {
      id: "overview",
      title: "Overview",
      content:
        "Controller decorators call registerController automatically when the class loads. The start() pipeline: installProcessErrorGuards â†?loadControllers â†?mountFilters â†?routes â†?listen â†?warmupConnections + runApplicationInits. On shutdown, SIGINT/SIGTERM run ApplicationDestroys in reverse order.",
    },
    {
      id: "lifecycle",
      title: "Startup, warmup, and process guards",
      apis: [
        {
          name: "Application.start",
          signature: "static start(): typeof Application",
          description:
            "Full startup. Business code usually only needs registry(...).start().",
        },
        {
          name: "applicationStart",
          description:
            "Internal: actually listens and runs subsequent inits; rarely called directly.",
        },
        {
          name: "installProcessErrorGuards",
          description:
            "Installs uncaughtException / unhandledRejection handlers so the process does not exit silently; invoked automatically by start.",
        },
        {
          name: "warmupConnections",
          description:
            "After listen, opt-in warmup: connects only if EnableRedis / EnableOrm were registered (or Auth bound redis); skips otherwise; failures are logged only.",
        },
        {
          name: "EnableRedis / EnableOrm",
          signature: "EnableRedis(config?) / EnableOrm(config?)",
          description:
            "Opt-in modules via Application.registry(EnableRedis()) / EnableOrm(). Without them, startup does not connect Redis/DB.",
        },
        {
          name: "Application.addRequestInterceptor",
          signature: "static addRequestInterceptor(fn): typeof Application",
          description:
            "Pre-handler interceptor (after auth/guards). Set skipHandler to skip the controller method.",
        },
        {
          name: "Application.addResponseInterceptor",
          signature: "static addResponseInterceptor(fn): typeof Application",
          description:
            "Pre-send interceptor. Default still wraps ResponseData; ctx.wrap=false sends raw body; ctx.handled=true means you already wrote the response.",
        },
        {
          name: "Application.addFilter / @WebFilter",
          signature:
            "static addFilter(filter, options?): typeof Application",
          description:
            "Servlet-style Filter: mounted by order before routes on start. await chain.doFilter for before/after. options: order / urlPatterns / excludePatterns.",
        },
        {
          name: "Application.addInterceptor / @Interceptor",
          signature:
            "static addInterceptor(interceptor, options?): typeof Application",
          description:
            "Spring MVC HandlerInterceptor: preHandle (false aborts) / postHandle (may replace data) / afterCompletion (finally, reverse order). options: order / include / exclude.",
        },
        {
          name: "Filter / FilterChain / HandlerInterceptor",
          description:
            "Interfaces. Path matching matches Auth ignore (/**, /*, prefix *). Scan prefers filter(s) and interceptor(s) dirs.",
        },
        {
          name: "ApplicationInit",
          signature: "interface { init(): void | Promise<void> }",
          description:
            "Implementations must already be bindClass'd into the Container; init() runs in registration order after listen succeeds.",
        },
        {
          name: "ApplicationDestroy",
          signature: "interface { destroy(): void | Promise<void> }",
          description:
            "On process exit, destroy() runs in reverse orderâ€”close connections, stop schedulers, etc.",
        },
        {
          name: "hasAuth / hasLog / hasRedis / hasOrm",
          description:
            "Whether Auth/Log/EnableRedis/EnableOrm have been registered; affects auth, logging, and connection warmup.",
        },
        {
          name: "registerController / getScanRoots / loadControllers",
          description:
            "Decorator registers controller metadata; get scan roots; load business modules by convention (entity â†?mapper â†?service â†?controller, etc.).",
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
  .scan(__dirname)
  .start();

Application.addResponseInterceptor(async (ctx) => {
  ctx.wrap = false;
  return { code: 0, result: ctx.data };
});

// start: installProcessErrorGuards â†?loadControllers â†?mountFilters â†?routes
// listen â†?warmupConnections + runApplicationInits`,
    },
    {
      id: "filter-interceptor",
      title: "Filter and Interceptor",
      content:
        "Spring Bootâ€“aligned: Filters wrap outside the router (Dispatcher); HandlerInterceptors run after a handler is mapped.\nPipeline: registry middleware â†?Filter chain â†?route auth/guards â†?preHandle â†?RequestInterceptor â†?Controller â†?postHandle â†?ResponseInterceptor â†?write â†?afterCompletion.\nDecorators register on class load; or use Application.addFilter / addInterceptor.",
      apis: [
        {
          name: "@WebFilter",
          signature: "@WebFilter({ order?, urlPatterns?, excludePatterns? })",
          description: "Class decorator; implement Filter.doFilter.",
        },
        {
          name: "@Interceptor",
          signature: "@Interceptor({ order?, include?, exclude? })",
          description:
            "Class decorator; implement any of preHandle / postHandle / afterCompletion.",
        },
        {
          name: "Filter.doFilter",
          signature: "doFilter(req, res, chain): void | Promise<void>",
          description:
            "Skip chain to short-circuit (write the response yourself). After await chain.doFilter you can run cleanup (waits for response finish).",
        },
        {
          name: "HandlerInterceptor.preHandle",
          signature:
            "preHandle(req, res, handler): boolean | void | Promise<...>",
          description:
            "Return false to skip the Controller (you may res.send yourself).",
        },
      ],
      decoratorExample: `import {
  WebFilter, Interceptor,
  type Filter, type FilterChain, type HandlerInterceptor, type HandlerInfo,
} from "@pangza/core";
import type { Request, Response } from "express";

@WebFilter({ urlPatterns: ["/api/**"], order: 1 })
class TimingFilter implements Filter {
  async doFilter(req: Request, res: Response, chain: FilterChain) {
    const t = Date.now();
    await chain.doFilter(req, res);
    console.log(req.method, req.path, Date.now() - t);
  }
}

@Interceptor({ include: ["/api/**"], exclude: ["/api/pub/**"], order: 0 })
class LogInterceptor implements HandlerInterceptor {
  preHandle(req: Request, _res: Response, handler: HandlerInfo) {
    console.log("â†?, handler.controllerName, handler.handlerName);
    return true;
  }
  afterCompletion(_req: Request, _res: Response, _h: HandlerInfo, err?: unknown) {
    if (err) console.error(err);
  }
}`,
      functionalExample: `Application.addFilter(
  {
    async doFilter(req, res, chain) {
      res.setHeader("X-Trace", "1");
      await chain.doFilter(req, res);
    },
  },
  { urlPatterns: ["/**"], order: 0 },
);

Application.addInterceptor(
  {
    preHandle(req) {
      console.log(req.path);
      return true;
    },
  },
  { include: ["/api/**"] },
);`,
    },
    {
      id: "aop",
      title: "AOP custom decorators",
      content:
        "Spring-style method AOP (Around / Before / After*). Custom decorators weave the method call chain after auth, rate-limit, and @Validate, around the business method. Inside Controllers, getMethodInvocationContext() exposes req/res.\nLower order = outer. Composes with @Cacheable / @Transactional (descriptor wrap) and runs after route-metadata features like @Log / @RateLimiter.",
      apis: [
        {
          name: "createAroundDecorator / Around",
          signature:
            "createAroundDecorator(advice, options?): MethodDecorator",
          description:
            "Preferred factory for custom annotations. Call inv.proceed(); you may mutate inv.args.",
        },
        {
          name: "Before / After / AfterReturning / AfterThrowing",
          description: "Sugar; folded into the Around chain.",
        },
        {
          name: "markAdvice + registerAroundAdvice",
          signature:
            "markAdvice(key) / registerAroundAdvice(key, advice, options?)",
          description:
            "Like @Around(\"@annotation\"): mark methods, register advice centrally; order-independent.",
        },
        {
          name: "getMethodInvocationContext",
          signature: "getMethodInvocationContext(): MethodInvocationContext | undefined",
          description:
            "Inside the HTTP pipeline: req/res/option/path; undefined for plain Service calls.",
        },
        {
          name: "MethodInvocation",
          description: "target / methodName / args / context / proceed().",
        },
      ],
      decoratorExample: `import {
  createAroundDecorator, markAdvice, registerAroundAdvice,
  getMethodInvocationContext, PostMapping, RequestBody,
} from "@pangza/core";

export const Audit = (title: string) =>
  createAroundDecorator(async (inv) => {
    const ctx = getMethodInvocationContext();
    console.log(title, inv.methodName, ctx?.req?.path);
    return inv.proceed();
  }, { order: 100 });

@PostMapping("/save")
@Audit("save user")
save(@RequestBody() body: User) {
  return body;
}

const SLOW = Symbol("slow");
export const SlowLog = () => markAdvice(SLOW);

registerAroundAdvice(SLOW, async (inv) => {
  const t = Date.now();
  try {
    return await inv.proceed();
  } finally {
    console.log(inv.methodName, Date.now() - t);
  }
}, { order: 50 });`,
      functionalExample: `import { Around, Before } from "@pangza/core";

@Around(async (inv) => {
  inv.args[0] = { ...(inv.args[0] as object), traced: true };
  return inv.proceed();
}, { order: 10 })
@Before(async (inv) => {
  console.log("before", inv.methodName);
})
async create(dto: CreateDto) { return dto; }`,
    },
    {
      id: "scan-registry",
      title: "Scan and middleware",
      apis: [
        {
          name: "Application.scan",
          signature: "static scan(...dirs: Array<string | string[]>): typeof Application",
          description:
            "Append module scan root directories. If never called, defaults to scanning src/business.",
          params: [
            {
              name: "dirs",
              type: "string | string[]",
              required: true,
              description: "Relative to cwd or absolute; multiple calls accumulate",
            },
          ],
        },
        {
          name: "Application.registry",
          signature: "static registry(param: any): typeof Application",
          description:
            "app.use middleware; Auth/Log/Logger/Json/EnableRedis/EnableOrm factory products also flag or configure modules.",
          params: [
            {
              name: "param",
              type: "Middleware | Middleware[]",
              required: true,
              description: "Express middleware or array",
            },
          ],
        },
        {
          name: "Application.static",
          signature:
            "static static(url | urls | map, rootDir?): typeof Application",
          description:
            "Mount static assets. URL may match the folder name, or map URL â†?disk dir; or use yaml upload.path / upload.urlPrefix with express.static.",
          params: [
            {
              name: "urlOrMap",
              type: "string | string[] | Record<string, string>",
              required: true,
              description:
                '"public"; ["public","assets"]; "/files" + "upload"; { "/files": "upload" }',
            },
            {
              name: "rootDir",
              type: "string",
              required: false,
              description: "Disk directory when used with a single url (relative to cwd or absolute).",
            },
          ],
        },
        {
          name: "Application.getApp",
          signature: "static getApp(): Express",
          description: "Get the underlying Express instance for custom middleware.",
        },
      ],
      decoratorExample: `// scan roots by convention; no extra decorator`,
      functionalExample: `import { Application, UPLOAD_PATH, UPLOAD_URL_PREFIX } from "@pangza/core";
import express from "express";

Application
  .scan(__dirname)
  .registry(express.json())
  .static("public")
  .static("/files", "upload")
  .static({ "/static": "public" })
  .start();

const app = Application.getApp();
app.use(UPLOAD_URL_PREFIX, express.static(UPLOAD_PATH));`,
    },
    {
      id: "routes",
      title: "Route registration",
      apis: [
        {
          name: "Application.GET / POST / PUT / DELETE",
          signature:
            "static GET(path, callback, option?: RouteOption): typeof Application",
          description:
            "Functional route registration. Third arg option is RouteOption â€?table expands all fields (auth / log / rateLimit / â€?.",
          params: [
            { name: "path", type: "string", required: true, description: "Route path" },
            {
              name: "callback",
              type: "(...args) => any | Promise<any>",
              required: true,
              description: "Handler",
            },
            {
              name: "option",
              type: "RouteOption",
              required: false,
              description: "Optional per-route config; see option.* below.",
            },
            ...typeParams(ROUTE_OPTION_FIELDS, "en", "option"),
          ],
        },
        {
          name: "@Controller",
          signature: "@Controller(prefix?: string)",
          description:
            "Marks a controller and sets a path prefix; routes register automatically when the class loads.",
          params: [
            {
              name: "prefix",
              type: "string",
              default: '""',
              description: "Common prefix, e.g. /api/user",
            },
          ],
        },
        {
          name: "@GetMapping / @PostMapping / @PutMapping / @DeleteMapping",
          signature: "@GetMapping(path?: string, option?: RouteOption)",
          description:
            "Registers an HTTP method and sub-path. option is the same RouteOption as Application.GET â€?fields below.",
          params: [
            {
              name: "path",
              type: "string",
              required: false,
              default: '""',
              description: "Sub-path under @Controller prefix.",
            },
            {
              name: "option",
              type: "RouteOption",
              required: false,
              description: "Optional; see option.* below.",
            },
            ...typeParams(ROUTE_OPTION_FIELDS, "en", "option"),
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
      title: "Auth decorators",
      apis: [
        {
          name: "@AuthCheckLogin / @AuthCheckRole / @AuthCheckPermission / @AuthIgnore",
          description:
            "Method-level auth. Role/Permission accept string[] and optional { mode: 'OR' | 'AND' } to override global checkMode.",
          params: [
            {
              name: "roles / permissions",
              type: "string[]",
              required: true,
              description: "Role or permission codes (per decorator)",
            },
            {
              name: "option.mode",
              type: '"OR" | "AND"',
              default: "global Auth.checkMode",
              description: "Match mode within the array",
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
      title: "@RequestBody / Query / Header / Cookie / Path / Form",
      content:
        "Parameter decorators write MethodParamMeta by parameter index. All take no args except optional args on @RequestPath / @RequestForm. With no parameter decorators, the callback receives the whole req by default.\nForms need `registry(urlencoded({ extended: true }))`; multipart files need multer (or similar).",
      apis: [
        {
          name: "@RequestBody",
          signature: "@RequestBody()",
          description: "Injects req.body. Often used with @Validate and a DTO class.",
        },
        {
          name: "@RequestQuery",
          signature: "@RequestQuery()",
          description: "Injects the entire req.query object (not a single query name).",
        },
        {
          name: "@RequestHeader",
          signature: "@RequestHeader()",
          description:
            "Injects the entire req.headers (lowercase keys). Cannot take a header-name string; read a single header inside the method as headers['x-request-id'].",
        },
        {
          name: "@RequestCookie",
          signature: "@RequestCookie()",
          description:
            "Injects the entire req.cookies. You must mount cookie-parser (or similar) yourself, or it may be undefined.",
        },
        {
          name: "@RequestPath",
          signature: "@RequestPath(index?: number)",
          description:
            "No args: passes the value when there is one path param, or an array when there are several. @RequestPath(0) takes the nth by order.",
          params: [
            {
              name: "index",
              type: "number",
              description: "Path-param index (0-based); omit for behavior above",
            },
          ],
        },
        {
          name: "@RequestForm",
          signature: "@RequestForm(name?: string)",
          description:
            "Injects form data (urlencoded / multipart fields on req.body). No args: whole object, plus req.file/files when present. @RequestForm(\"name\") takes one field.",
          params: [
            {
              name: "name",
              type: "string",
              description: "Form field name; omit to inject the whole form object",
            },
          ],
        },
        {
          name: "ParamType",
          description:
            "Enum: BODY / QUERY / PARAMS / HEADER / COOKIE / PATH / FORM. Legacy single-param option.paramType or decorator writes MethodParamMeta.",
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

@PostMapping("/login")
login(@RequestForm() form: { username: string; password: string }) {
  return form.username;
}

@PostMapping("/upload")
upload(@RequestForm("title") title: string) {}

@GetMapping("/search")
search(@RequestQuery() query: Record<string, unknown>) {
  return query.keyword;
}

@GetMapping("/:id")
detail(@RequestPath(0) id: string) {}

@GetMapping("/:a/:b")
pair(@RequestPath() parts: string[]) {
  // no index + multiple segments â†?array
}`,
      functionalExample: `// Functional routes usually take (req, res); use Controller + param decorators for wrapped injection
Application.POST("/api/demo", async (req, res) => {
  res.json(req.body);
}, { raw: true });`,
    },
    {
      id: "value",
      title: "@Value YAML injection",
      content:
        "Lazy property injection: on first read, resolves from the merged application*.yaml.\nOnly expression (config path) is required; defaultValue is optional.\nexpression forms: server.port | ${server.port} | ${server.port:3990} (text after colon is the placeholder default, via coerceConfigScalar). If defaultValue is also passed, it wins.\nFunctional equivalents: getConfigValue / getConfig in the config module.\nTo bind a whole class by YAML prefix, see config Â· @ConditionOnProperty.",
      apis: [
        {
          name: "@Value",
          signature: "@Value(expression: string, defaultValue?: unknown)",
          description:
            "Attaches a getter on the property; first get calls getConfigValue(expression, defaultValue). Assignable to override.",
          returns: "The decorator returns nothing; the property type is the config value type.",
          params: [
            {
              name: "expression",
              type: "string",
              required: true,
              description:
                "YAML dot path. â‘?server.port â‘?${server.port} â‘?${server.port:3990}. Empty string throws.",
            },
            {
              name: "defaultValue",
              type: "unknown",
              required: false,
              description:
                "Fallback when the path is missing. Optional; overrides any ${path:default} default.",
            },
          ],
        },
      ],
      decoratorExample: `import { Component, Value } from "@pangza/core";

@Component()
class AppSettings {
  // Required path only
  @Value("server.port")
  port!: number;

  // Placeholder path (no default)
  @Value("\${redis.host}")
  redisHost!: string;

  // Placeholder + embedded default
  @Value("\${upload.path:upload}")
  uploadPath!: string;

  // Second-arg default (wins over placeholder default)
  @Value("orm.logicDelete", true)
  logicDelete!: boolean;
}`,
      functionalExample: `import { getConfigValue, getConfig } from "@pangza/core";

// getConfigValue(pathOrExpression, defaultValue?)
// pathOrExpression required; defaultValue optional
const port = getConfigValue<number>("server.port");
const host = getConfigValue("redis.host", "127.0.0.1");
const withPlaceholder = getConfigValue("\${server.port:3990}");

// getConfig() â€?no args â†?whole YAML
const root = getConfig();`,
    },
    {
      id: "cross-cutting",
      title: "Cross-cutting: validation / log / rate limit / SSE",
      apis: [
        {
          name: "@Validate",
          description:
            "Enables input validation on the method; runs DTO rules via design:paramtypes. See the Validate module.",
        },
        {
          name: "@Log",
          description:
            "Method-level operation log (LogRecordOption). See the Log module.",
        },
        {
          name: "@RateLimiter / @RepeatSubmit",
          description: "Rate limiting and anti-resubmit. See the Redis module.",
        },
        {
          name: "@Flux",
          description:
            "SSE: automatically sets Content-Type: text/event-stream; the handler writes/ends the response itself.",
        },
      ],
      decoratorExample: `@PostMapping("/create")
@AuthCheckLogin()
@Validate()
@Log({ title: "æ–°å¢žç”¨æˆ·" })
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
  log: { title: "æ¼”ç¤º" },
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
  title: "Application Â· Configuration",
  description:
    "Application has no standalone YAML; route behavior is driven by RouteOption and server config.",
  sections: [
    {
      id: "server",
      title: "Related server config (application.yaml)",
      configs: [
        {
          name: "server.port",
          type: "number",
          default: "3990",
          description: "HTTP listen port, exported as PORT",
        },
        {
          name: "server.trustProxy",
          type: "boolean",
          default: "false",
          description:
            "Whether to trust X-Forwarded-For. When false, only the direct connection IP is usedâ€”prevents forged headers from bypassing IP rate limits and operation-log IP",
        },
      ],
      functionalExampleTitle: "Config example",
      functionalExample: `server:
  port: 3990
  trustProxy: false`,
    },
    {
      id: "route-option",
      title: "RouteOption fields",
      content:
        "option on Application.GET/POST and @GetMapping etc. Nested types are expanded in the next section.",
      configs: typeConfigs(ROUTE_OPTION_FIELDS, "en"),
      functionalExample: `Application.POST("/api/demo", handler, {
  auth: { permissions: ["sys:demo"], permissionMode: "AND" },
  rateLimit: { time: 10, count: 5, type: "IP" },
  repeatSubmit: { interval: 3000 },
  log: { title: "demo" },
  validate: true,
});`,
    },
    {
      id: "route-option-nested",
      title: "RouteOption nested types",
      content:
        "option.log â†?LogRecordOption; option.rateLimit â†?RateLimitOption; option.repeatSubmit â†?RepeatSubmitOption.",
      configs: [
        ...typeConfigs(LOG_RECORD_OPTION_FIELDS, "en").map((c) => ({
          ...c,
          name: `log.${c.name}`,
        })),
        ...typeConfigs(RATE_LIMIT_OPTION_FIELDS, "en").map((c) => ({
          ...c,
          name: `rateLimit.${c.name}`,
        })),
        ...typeConfigs(REPEAT_SUBMIT_OPTION_FIELDS, "en").map((c) => ({
          ...c,
          name: `repeatSubmit.${c.name}`,
        })),
      ],
    },
  ],
};
