import type { DocPage } from "../../../types/doc";
import {
  AUTH_OPTIONS_FIELDS,
  LOGIN_OPTIONS_FIELDS,
  objectParamWithFields,
  typeConfigs,
  typeParams,
} from "../../typeFields";

export const authApi: DocPage = {
  key: "Auth-api",
  title: "Auth · API",
  description:
    "Package @pangza/auth: session auth (token parsing, Redis/in-memory sessions, login, roles/permissions). Auth() middleware only parses and writes AsyncLocalStorage—it does not force login; endpoints check via decorators, RouteOption, or AuthUtil.check*. Usually paired with @pangza/redis.",
  sections: [
    {
      id: "overview",
      title: "Overview",
      content:
        'import Auth, { AuthUtil } from "@pangza/auth"; route decorators like @AuthCheckLogin come from @pangza/core.\nToken read order: tokenName header → header (e.g. Authorization, optional Bearer) → Cookie[tokenName] (readCookie=true).\nDefault extra allowlist: /.well-known, /favicon.ico, /robots.txt, /sitemap.xml (merged with ignore).',
    },
    {
      id: "middleware",
      title: "Auth middleware",
      apis: [
        {
          name: "Auth",
          signature: "Auth(options?: AuthOptions): RequestHandler",
          description:
            "Configure auth and return middleware for Application.registry. Table expands every AuthOptions field.",
          params: objectParamWithFields("en", {
            name: "options",
            typeName: "AuthOptions",
            required: false,
            summaryZh: "",
            summaryEn:
              "Optional. Defaults: tokenName=satoken, timeout=2h, in-memory session, etc.",
            fields: AUTH_OPTIONS_FIELDS,
          }),
        },
        {
          name: "getAuthOptions",
          description:
            "Reads resolved AuthOptions. Pass config via Auth(options) (writes options and switches Store); configureAuth is an AuthUtil internal and is not re-exported from @pangza/core.",
        },
        {
          name: "matchesIgnore / isGloballyIgnored",
          description:
            "Whether a path hits ignore. Supports: exact, prefix directory, /api/pub/**, /api/pub/*, /api/aes*, and general globs. Built-in: /.well-known, favicon, robots, sitemap.",
        },
      ],
      decoratorExample: `// 无类装饰器；registry 中间件即完成配置
Application.registry(Auth({
  tokenName: "satoken",
  redis: Redis,
  ignore: ["/api/user/login", "/api/pub/**"],
}));`,
      functionalExample: `import Auth, { getAuthOptions, matchesIgnore } from "@pangza/auth";

Application.registry(Auth({
  timeout: 30 * 24 * 3600 * 1000,
  checkMode: "OR",
  redis: Redis,
  ignore: ["/api/pub/**"],
}));

const opts = getAuthOptions();
matchesIgnore("/api/pub/x", opts.ignore); // true`,
    },
    {
      id: "login-logout",
      title: "Login and logout",
      apis: [
        {
          name: "AuthUtil.login",
          signature:
            "login(loginId, rolesOrOpts?, permissions?, profile?): Promise<string>",
          description:
            "Creates a session and returns a token. The second arg may be a roles array or LoginOptions (roles/permissions/username/avatar/device/timeout). With isShare, the same account+device can reuse a token; with allowConcurrentLogin=false, older sessions are kicked.",
          returns: "token string",
          params: [
            {
              name: "loginId",
              type: "string | number",
              required: true,
              description: "Account id stored in the session.",
            },
            {
              name: "rolesOrOpts",
              type: "string[] | LoginOptions",
              required: false,
              description: "Either a roles array, or LoginOptions { roles, permissions, username, avatar, device, timeout }.",
            },
            {
              name: "permissions",
              type: "string[]",
              required: false,
              description: "Used only when the 2nd arg is a roles array.",
            },
            {
              name: "profile",
              type: "{ username?, avatar?, device?, timeout? }",
              required: false,
              description: "Used only with the (loginId, roles[], permissions[], profile?) overload.",
            },
            ...typeParams(LOGIN_OPTIONS_FIELDS, "en", "rolesOrOpts"),
          ],
        },
        {
          name: "AuthUtil.logout",
          signature: "logout(token?: string): Promise<void>",
          description: "Logs out the given or current-context token.",
          params: [
            {
              name: "token",
              type: "string",
              required: false,
              description: "Token to revoke; defaults to the current ALS token.",
            },
          ],
        },
        {
          name: "AuthUtil.logoutByLoginId / logoutByDevice",
          description:
            "Clear all sessions for an account, or by account+device.",
        },
      ],
      decoratorExample: `@PostMapping("/login")
@AuthIgnore()
async login(@RequestBody() body: LoginDto) {
  // 校验密码后
  return {
    token: await AuthUtil.login(user.id, {
      roles: user.roles,
      permissions: user.permissions,
      username: user.username,
      device: "web",
    }),
  };
}

@PostMapping("/logout")
@AuthCheckLogin()
async logout() {
  await AuthUtil.logout();
}`,
      functionalExample: `const token = await AuthUtil.login(userId, ["admin"], ["sys:user:list"], {
  username: "zhangsan",
  device: "web",
});
// 等价
await AuthUtil.login(userId, {
  roles: ["admin"],
  permissions: ["sys:user:list"],
  username: "zhangsan",
  device: "web",
  timeout: 3600_000,
});
await AuthUtil.logout(token);
await AuthUtil.logoutByLoginId(userId);
await AuthUtil.logoutByDevice(userId, "web");`,
    },
    {
      id: "session-read",
      title: "Session read APIs",
      apis: [
        {
          name: "AuthUtil.readTokenFromRequest",
          description: "Parses the token from req per config (does not load the session).",
        },
        {
          name: "AuthUtil.getTokenValue",
          description: "Token from the current ALS context, or re-read from ctx.req.",
        },
        {
          name: "AuthUtil.loadSession",
          signature: "loadSession(token, { touch? }): Promise<AuthSession | null>",
          description:
            "Validate token (including jwt) → read Store → delete if expired; when touch!==false, updates lastActiveTime.",
          params: [
            {
              name: "token",
              type: "string",
              required: true,
              description: "Session token to load.",
            },
            {
              name: "touch",
              type: "boolean",
              required: false,
              default: "true",
              description: "When not false, refresh lastActiveTime (activity timeout).",
            },
          ],
        },
        {
          name: "AuthUtil.getSession / isLogin / checkLogin / getLoginId",
          description:
            "getSession returns the current session; isLogin is boolean; checkLogin/getLoginId throw NotLoginError when not logged in.",
        },
        {
          name: "AuthUtil.getLoginIdDefaultNull",
          description: "Returns null when not logged in; does not throw.",
        },
        {
          name: "AuthUtil.getLoginDevice / getRoleList / getPermissionList",
          description:
            "Read session device, roles, and permissions; roles/permissions are [] with no session.",
        },
        {
          name: "isSessionExpired",
          description:
            "Absolute expiry via expireTime, or idle timeout via lastActiveTime when activityTimeout≥0.",
        },
      ],
      decoratorExample: `@GetMapping("/me")
@AuthCheckLogin()
async me() {
  return {
    id: await AuthUtil.getLoginId(),
    roles: await AuthUtil.getRoleList(),
    permissions: await AuthUtil.getPermissionList(),
    device: await AuthUtil.getLoginDevice(),
  };
}`,
      functionalExample: `const token = AuthUtil.readTokenFromRequest(req);
const session = await AuthUtil.loadSession(token, { touch: true });
const id = await AuthUtil.getLoginIdDefaultNull();
if (await AuthUtil.isLogin()) {
  await AuthUtil.checkLogin();
}`,
    },
    {
      id: "rbac",
      title: "Roles and permissions",
      apis: [
        {
          name: "AuthUtil.hasRole / hasPermission",
          signature: "hasRole(role: string) / hasPermission(permission: string)",
          description:
            "Whether the current session contains a single role or permission code.",
          params: [
            {
              name: "role | permission",
              type: "string",
              required: true,
              description: "Single role code or permission code to test.",
            },
          ],
        },
        {
          name: "AuthUtil.checkRole / checkPermission",
          signature: "checkRole(role: string) / checkPermission(permission: string)",
          description:
            "checkLogin first, then a single role/permission; failures throw NotRoleError / NotPermissionError. For multi-value OR/AND use decorators or RouteOption—do not pass mode to check*.",
          params: [
            {
              name: "role | permission",
              type: "string",
              required: true,
              description: "Single role/permission; fails with NotRoleError / NotPermissionError after checkLogin.",
            },
          ],
        },
        {
          name: "@AuthCheckLogin / @AuthCheckRole / @AuthCheckPermission / @AuthIgnore",
          description:
            "Method-level auth (exported by Application). Role/Permission take string[], optional { mode: 'OR'|'AND' } overrides global checkMode.",
        },
      ],
      decoratorExample: `@GetMapping("/admin")
@AuthCheckPermission(["sys:user:query", "sys:user:edit"], { mode: "AND" })
async adminOnly() {
  return { ok: true };
}

@GetMapping("/staff")
@AuthCheckRole(["admin", "editor"], { mode: "OR" })
async staff() {}`,
      functionalExample: `await AuthUtil.checkRole("admin");
await AuthUtil.checkPermission("sys:user:list");
if (await AuthUtil.hasRole("guest")) { /* ... */ }

// 路由函数式
Application.GET("/api/admin", handler, {
  auth: {
    permissions: ["sys:user:query", "sys:user:edit"],
    permissionMode: "AND",
  },
});`,
    },
    {
      id: "token-api",
      title: "Token issue and verify",
      apis: [
        {
          name: "generateStyleToken",
          signature: "generateStyleToken(style: TokenStyle): string",
          description:
            "Generate by style: uuid / simple-uuid / random-32|64|128 / tik; jwt goes through createAuthToken.",
          params: [
            {
              name: "style",
              type: "TokenStyle",
              required: true,
              description: "uuid | simple-uuid | random-32|64|128 | tik. For jwt use createAuthToken.",
            },
          ],
        },
        {
          name: "createAuthToken",
          signature: "createAuthToken(options, payload): Promise<string>",
          description:
            "Prefers a createToken callback when configured; otherwise uses tokenStyle; jwt uses jwtSecret/jwtAlgorithm.",
          params: [
            {
              name: "options",
              type: "ResolvedAuthOptions",
              required: true,
              description: "Usually getAuthOptions().",
            },
            {
              name: "payload",
              type: "object",
              required: true,
              description: "Session payload fields used when signing (loginId, device, timeout, …).",
            },
          ],
        },
        {
          name: "verifyAuthToken",
          signature: "verifyAuthToken(options, token): boolean",
          description:
            "jwt signature verify; other styles usually only check non-empty/format—session validity comes from the Store.",
          params: [
            {
              name: "options",
              type: "ResolvedAuthOptions",
              required: true,
              description: "Usually getAuthOptions().",
            },
            {
              name: "token",
              type: "string",
              required: true,
              description: "Token string to verify.",
            },
          ],
        },
      ],
      decoratorExample: `Auth({
  tokenStyle: "jwt",
  jwtSecret: process.env.JWT_SECRET!,
  jwtAlgorithm: "HS256",
  // 或完全自定义
  createToken: async (session) => mySign(session),
});`,
      functionalExample: `import { generateStyleToken, createAuthToken, verifyAuthToken } from "@pangza/core/Auth";

const raw = generateStyleToken("random-64");
const token = await createAuthToken(getAuthOptions(), {
  loginId: "1",
  device: "web",
  timeout: 3600_000,
});
verifyAuthToken(getAuthOptions(), token);`,
    },
    {
      id: "errors",
      title: "Error classes",
      apis: [
        {
          name: "AuthError",
          description:
            "Base class; carries a business code for Exception → HTTP status mapping.",
        },
        {
          name: "NotLoginError",
          description: "Not logged in; default message covers the unauthenticated case.",
        },
        {
          name: "NotRoleError / NotPermissionError",
          description: "Missing role / missing permission.",
        },
      ],
      decoratorExample: `// 由 check* 抛出，@ControllerAdvice 或内置 Exception 处理`,
      functionalExample: `try {
  await AuthUtil.checkLogin();
} catch (e) {
  if (e instanceof NotLoginError) { /* 401 */ }
}`,
    },
  ],
};

export const authConfig: DocPage = {
  key: "Auth-config",
  title: "Auth · Configuration",
  description:
    "Passed via Auth(options) (Application.registry); no standalone YAML section. Sessions may live in Redis or memory.",
  sections: [
    {
      id: "options",
      title: "AuthOptions",
      content:
        "Full Auth(options) fields (same as the API parameter table).",
      configs: typeConfigs(AUTH_OPTIONS_FIELDS, "en"),
      functionalExampleTitle: "Config example",
      functionalExample: `Auth({
  tokenName: "satoken",
  tokenPrefix: "",
  timeout: 30 * 24 * 60 * 60 * 1000,
  activityTimeout: -1,
  allowConcurrentLogin: false,
  isShare: false,
  tokenStyle: "uuid",
  jwtSecret: process.env.JWT_SECRET,
  redis: Redis,
  ignore: ["/api/user/login", "/api/pub/**"],
  checkMode: "OR",
  readCookie: true,
})`,
    },
    {
      id: "login-options",
      title: "LoginOptions (AuthUtil.login)",
      content:
        "Fields when AuthUtil.login's second argument is an object (preferred overload).",
      configs: typeConfigs(LOGIN_OPTIONS_FIELDS, "en"),
    },
  ],
};
