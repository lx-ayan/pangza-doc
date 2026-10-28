import type { DocPage } from "../../types/doc";
import {
  AUTH_OPTIONS_FIELDS,
  LOGIN_OPTIONS_FIELDS,
  objectParamWithFields,
  typeConfigs,
  typeParams,
} from "../typeFields";

export const authApi: DocPage = {
  key: "Auth-api",
  title: "Auth · API",
  description:
    "包 @pangza/auth：会话鉴权（token 解析、Redis/内存会话、登录与角色权限）。Auth() 中间件只负责解析并写入 AsyncLocalStorage，不强制登录；接口通过装饰器、RouteOption 或 AuthUtil.check* 校验。通常配合 @pangza/redis。",
  sections: [
    {
      id: "overview",
      title: "模块说明",
      content:
        "import Auth, { AuthUtil } from \"@pangza/auth\"；路由装饰器 @AuthCheckLogin 等从 @pangza/core 导入。\nToken 读取顺序：tokenName 请求头 → header（如 Authorization，可带 Bearer 前缀）→ Cookie[tokenName]（readCookie=true）。\n默认额外放行：/.well-known、/favicon.ico、/robots.txt、/sitemap.xml（与 ignore 合并）。",
    },
    {
      id: "middleware",
      title: "Auth 中间件",
      apis: [
        {
          name: "Auth",
          signature: "Auth(options?: AuthOptions): RequestHandler",
          description:
            "配置鉴权并返回中间件，供 Application.registry 使用。下表展开 AuthOptions 全部字段。",
          params: objectParamWithFields("zh", {
            name: "options",
            typeName: "AuthOptions",
            required: false,
            summaryZh:
              "可选。不传则用内置默认（tokenName=satoken、timeout=2h、内存会话等）。",
            summaryEn: "",
            fields: AUTH_OPTIONS_FIELDS,
          }),
        },
        {
          name: "getAuthOptions",
          description:
            "读取已解析 AuthOptions。配置请通过 Auth(options) 传入（内部会写入选项并切换 Store）；configureAuth 为 AuthUtil 内部实现，未从 @pangza/core 再导出。",
        },
        {
          name: "matchesIgnore / isGloballyIgnored",
          description:
            "路径是否命中 ignore。支持：精确、前缀目录、/api/pub/**、/api/pub/*、/api/aes* 及一般 glob。另有内置 /.well-known、favicon、robots、sitemap。",
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
      title: "登录与注销",
      apis: [
        {
          name: "AuthUtil.login",
          signature:
            "login(loginId, rolesOrOpts?, permissions?, profile?): Promise<string>",
          description:
            "创建会话并返回 token。第二参可为角色数组，或 LoginOptions（roles/permissions/username/avatar/device/timeout）。isShare 时同账号同设备可复用 token；allowConcurrentLogin=false 时挤掉旧会话。",
          returns: "token 字符串",
          params: [
            {
              name: "loginId",
              type: "string | number",
              required: true,
              description: "写入会话的登录账号 id。",
            },
            {
              name: "rolesOrOpts",
              type: "string[] | LoginOptions",
              required: false,
              description:
                "两种重载：① 角色 string[]；② LoginOptions 对象（推荐）。若为对象，后面 permissions/profile 忽略。",
            },
            {
              name: "permissions",
              type: "string[]",
              required: false,
              description: "仅当第二参为角色数组时生效的权限码列表。",
            },
            {
              name: "profile",
              type: "{ username?, avatar?, device?, timeout? }",
              required: false,
              description: "仅 (loginId, roles[], permissions[], profile?) 重载时的资料字段。",
            },
            ...typeParams(LOGIN_OPTIONS_FIELDS, "zh", "rolesOrOpts"),
          ],
        },
        {
          name: "AuthUtil.logout",
          signature: "logout(token?: string): Promise<void>",
          description: "注销指定或当前上下文 token。",
          params: [
            {
              name: "token",
              type: "string",
              required: false,
              description: "要注销的 token；省略则用当前 ALS 上下文 token。",
            },
          ],
        },
        {
          name: "AuthUtil.logoutByLoginId / logoutByDevice",
          description: "按账号清理全部会话；或按账号+设备清理。",
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
      title: "会话读取 API",
      apis: [
        {
          name: "AuthUtil.readTokenFromRequest",
          description: "按配置从 req 解析 token（不查会话）。",
        },
        {
          name: "AuthUtil.getTokenValue",
          description: "当前 ALS 上下文 token，或从 ctx.req 再读。",
        },
        {
          name: "AuthUtil.loadSession",
          signature: "loadSession(token, { touch? }): Promise<AuthSession | null>",
          description:
            "校验 token（含 jwt）→ 读 Store → 过期则删；touch!==false 时更新 lastActiveTime。",
          params: [
            {
              name: "token",
              type: "string",
              required: true,
              description: "要加载的会话 token。",
            },
            {
              name: "touch",
              type: "boolean",
              required: false,
              default: "true",
              description: "不为 false 时更新 lastActiveTime（闲置超时）。传在第二参对象里：{ touch }。",
            },
          ],
        },
        {
          name: "AuthUtil.getSession / isLogin / checkLogin / getLoginId",
          description:
            "getSession 取当前会话；isLogin 布尔；checkLogin/getLoginId 未登录抛 NotLoginError。",
        },
        {
          name: "AuthUtil.getLoginIdDefaultNull",
          description: "未登录返回 null，不抛错。",
        },
        {
          name: "AuthUtil.getLoginDevice / getRoleList / getPermissionList",
          description: "读会话设备、角色、权限列表；无会话时角色/权限为空数组。",
        },
        {
          name: "isSessionExpired",
          description:
            "绝对过期 expireTime，或 activityTimeout≥0 时按 lastActiveTime 闲置超时。",
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
      title: "角色与权限",
      apis: [
        {
          name: "AuthUtil.hasRole / hasPermission",
          signature: "hasRole(role: string) / hasPermission(permission: string)",
          description: "判断当前会话是否包含单个角色或权限码。",
          params: [
            {
              name: "role | permission",
              type: "string",
              required: true,
              description: "要判断的单个角色码或权限码。",
            },
          ],
        },
        {
          name: "AuthUtil.checkRole / checkPermission",
          signature: "checkRole(role: string) / checkPermission(permission: string)",
          description:
            "先 checkLogin，再校验单个角色/权限；失败抛 NotRoleError / NotPermissionError。多值 OR/AND 请用装饰器或 RouteOption，不要给 check* 传 mode。",
          params: [
            {
              name: "role | permission",
              type: "string",
              required: true,
              description: "单个角色/权限；先 checkLogin，失败抛 NotRoleError / NotPermissionError。",
            },
          ],
        },
        {
          name: "@AuthCheckLogin / @AuthCheckRole / @AuthCheckPermission / @AuthIgnore",
          description:
            "方法级鉴权（Application 导出）。Role/Permission 接收 string[]，可传 { mode: 'OR'|'AND' } 覆盖全局 checkMode。",
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
      title: "Token 签发与校验",
      apis: [
        {
          name: "generateStyleToken",
          signature: "generateStyleToken(style: TokenStyle): string",
          description:
            "按风格生成：uuid / simple-uuid / random-32|64|128 / tik；jwt 走 createAuthToken。",
          params: [
            {
              name: "style",
              type: "TokenStyle",
              required: true,
              description: "uuid / simple-uuid / random-32|64|128 / tik；jwt 请用 createAuthToken。",
            },
          ],
        },
        {
          name: "createAuthToken",
          signature: "createAuthToken(options, payload): Promise<string>",
          description:
            "若配置 createToken 回调则优先；否则按 tokenStyle；jwt 使用 jwtSecret/jwtAlgorithm。",
          params: [
            {
              name: "options",
              type: "ResolvedAuthOptions",
              required: true,
              description: "鉴权选项，通常传 getAuthOptions()。",
            },
            {
              name: "payload",
              type: "object",
              required: true,
              description: "签发用的会话载荷（loginId / device / timeout 等）。",
            },
          ],
        },
        {
          name: "verifyAuthToken",
          signature: "verifyAuthToken(options, token): boolean",
          description: "jwt 验签；其它风格通常只做非空/格式检查，会话有效性以 Store 为准。",
          params: [
            {
              name: "options",
              type: "ResolvedAuthOptions",
              required: true,
              description: "鉴权选项，通常传 getAuthOptions()。",
            },
            {
              name: "token",
              type: "string",
              required: true,
              description: "待校验的 token 字符串。",
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
      title: "错误类",
      apis: [
        {
          name: "AuthError",
          description: "基类；带业务 code，供 Exception 映射 HTTP 状态。",
        },
        {
          name: "NotLoginError",
          description: "未登录；默认提示未登录相关文案。",
        },
        {
          name: "NotRoleError / NotPermissionError",
          description: "无角色 / 无权限。",
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
  title: "Auth · 配置项",
  description: "通过 Auth(options) 传入（Application.registry），无独立 YAML 段。会话可落 Redis 或内存。",
  sections: [
    {
      id: "options",
      title: "AuthOptions",
      content:
        "Auth(options) 的完整字段说明（与 API 节参数表一致，便于在配置项页查阅）。",
      configs: typeConfigs(AUTH_OPTIONS_FIELDS, "zh"),
      functionalExampleTitle: "配置示例",
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
      title: "LoginOptions（AuthUtil.login）",
      content:
        "AuthUtil.login 第二参为对象时的字段；也可拆成 (loginId, roles[], permissions[], profile) 重载。",
      configs: typeConfigs(LOGIN_OPTIONS_FIELDS, "zh"),
    },
  ],
};
