import type { ApiParam, ConfigItem } from "../types/doc";
import type { Locale } from "../i18n/types";

type FieldDef = {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  zh: string;
  en: string;
};

function toParams(
  fields: FieldDef[],
  locale: Locale,
  prefix?: string
): ApiParam[] {
  return fields.map((f) => ({
    name: prefix ? `${prefix}.${f.name}` : f.name,
    type: f.type,
    ...(f.required !== undefined ? { required: f.required } : {}),
    ...(f.default !== undefined ? { default: f.default } : {}),
    description: locale === "en" ? f.en : f.zh,
  }));
}

function toConfigs(fields: FieldDef[], locale: Locale): ConfigItem[] {
  return fields.map((f) => ({
    name: f.name,
    type: f.type,
    ...(f.default !== undefined ? { default: f.default } : {}),
    description: locale === "en" ? f.en : f.zh,
  }));
}

/** Redis.configure / connect 的 config */
export const REDIS_CONFIG_FIELDS: FieldDef[] = [
  {
    name: "host",
    type: "string",
    required: false,
    default: '"127.0.0.1"',
    zh: "standalone 主机地址。mode=cluster/sentinel 时主连接仍可能用此作兜底，集群节点见 cluster.nodes。",
    en: "Standalone host. For cluster/sentinel prefer cluster.nodes / sentinel.nodes.",
  },
  {
    name: "port",
    type: "number",
    required: false,
    default: "6379",
    zh: "standalone 端口。",
    en: "Standalone port.",
  },
  {
    name: "password",
    type: "string",
    required: false,
    default: '""',
    zh: "密码；无密码可省略或空串。生产务必设置。",
    en: "Password; omit or empty if none. Set in production.",
  },
  {
    name: "username",
    type: "string",
    required: false,
    zh: "ACL 用户名（Redis 6+）；空则不传给客户端。",
    en: "ACL username (Redis 6+); empty means not sent.",
  },
  {
    name: "db",
    type: "number",
    required: false,
    default: "0",
    zh: "库序号。cluster 模式忽略。",
    en: "Database index. Ignored in cluster mode.",
  },
  {
    name: "keyPrefix",
    type: "string",
    required: false,
    default: '"pangza:"',
    zh: "业务 key 统一前缀，用于环境隔离；Redis.key() 自动拼接。",
    en: "Logical key prefix for isolation; Redis.key() applies it.",
  },
  {
    name: "connectTimeout",
    type: "number",
    required: false,
    default: "3000",
    zh: "连接超时（毫秒），最小约 500。",
    en: "Connect timeout in ms (min ~500).",
  },
  {
    name: "reconnect",
    type: "boolean",
    required: false,
    default: "true",
    zh: "断线是否指数退避重连；false 则不重连。",
    en: "Reconnect with exponential backoff; false disables reconnect.",
  },
  {
    name: "maxReconnectDelay",
    type: "number",
    required: false,
    default: "10000",
    zh: "重连最大间隔（毫秒）。",
    en: "Max reconnect delay in ms.",
  },
  {
    name: "mode",
    type: '"standalone" | "cluster" | "sentinel"',
    required: false,
    default: '"standalone"',
    zh: "连接模式。cluster / sentinel 时分别读 cluster / sentinel 段。",
    en: "Connection mode. Use cluster / sentinel sections when not standalone.",
  },
  {
    name: "tls",
    type: "RedisTlsConfig",
    required: false,
    zh: "TLS：enabled / rejectUnauthorized / ca / cert / key。跨网生产建议 enabled=true。",
    en: "TLS: enabled / rejectUnauthorized / ca / cert / key. Prefer enabled in production.",
  },
  {
    name: "tls.enabled",
    type: "boolean",
    required: false,
    default: "false",
    zh: "是否启用 TLS。",
    en: "Enable TLS.",
  },
  {
    name: "tls.rejectUnauthorized",
    type: "boolean",
    required: false,
    default: "true",
    zh: "校验证书；仅内网自签调试可 false，生产勿关。",
    en: "Verify peer cert; only set false for local self-signed debug.",
  },
  {
    name: "tls.ca / cert / key",
    type: "string",
    required: false,
    zh: "证书文件路径（可选）。",
    en: "Optional certificate file paths.",
  },
  {
    name: "cluster.nodes",
    type: "Array<{ host: string; port?: number }>",
    required: false,
    zh: "mode=cluster 时的种子节点；生产建议 ≥3。",
    en: "Seed nodes when mode=cluster; ≥3 recommended in production.",
  },
  {
    name: "cluster.useReplicas",
    type: "boolean",
    required: false,
    default: "false",
    zh: "只读命令是否打到副本。",
    en: "Route read commands to replicas.",
  },
  {
    name: "sentinel.name",
    type: "string",
    required: false,
    zh: "mode=sentinel 时 Sentinel 监控的主节点名（必填才生效）。",
    en: "Master name monitored by Sentinel (required for sentinel mode).",
  },
  {
    name: "sentinel.nodes",
    type: "Array<{ host: string; port?: number }>",
    required: false,
    zh: "Sentinel 节点列表（端口默认 26379）。",
    en: "Sentinel node list (default port 26379).",
  },
];

export const RATE_LIMIT_OPTION_FIELDS: FieldDef[] = [
  {
    name: "time",
    type: "number",
    required: false,
    default: "2",
    zh: "时间窗口（秒）。",
    en: "Window length in seconds.",
  },
  {
    name: "count",
    type: "number",
    required: false,
    default: "1",
    zh: "窗口内最大请求次数。",
    en: "Max hits allowed in the window.",
  },
  {
    name: "key",
    type: "string",
    required: false,
    default: '"rateLimiter:"',
    zh: "Redis key 前缀（再加维度后缀）。",
    en: "Redis key prefix (plus dimension suffix).",
  },
  {
    name: "type",
    type: '"DEFAULT" | "IP" | "USER"',
    required: false,
    default: '"DEFAULT"',
    zh: "DEFAULT=全局；IP=按客户端 IP；USER=按登录用户。",
    en: "DEFAULT=global; IP=by client IP; USER=by login id.",
  },
  {
    name: "mode",
    type: '"fixed" | "sliding"',
    required: false,
    default: '"fixed"',
    zh: "fixed=固定窗口；sliding=滑动窗口（ZSET）。",
    en: "fixed window or sliding window (ZSET).",
  },
];

export const REPEAT_SUBMIT_OPTION_FIELDS: FieldDef[] = [
  {
    name: "interval",
    type: "number",
    required: false,
    default: "3000",
    zh: "同一请求指纹的最小间隔（毫秒）。",
    en: "Min interval ms for the same request fingerprint.",
  },
  {
    name: "message",
    type: "string",
    required: false,
    zh: "触发防重时的提示文案。",
    en: "Message when duplicate submit is blocked.",
  },
];

export const CACHEABLE_OPTION_FIELDS: FieldDef[] = [
  {
    name: "key",
    type: "string",
    required: false,
    zh: "缓存 key 前缀；默认 cache:{Class}.{method}。",
    en: "Cache key prefix; default cache:{Class}.{method}.",
  },
  {
    name: "ttl",
    type: "number",
    required: false,
    default: "60",
    zh: "过期秒数；≤0 表示不过期。",
    en: "TTL seconds; ≤0 means no expiry.",
  },
  {
    name: "keyGenerator",
    type: "(...args) => string",
    required: false,
    zh: "根据方法参数生成 key 后缀；默认 JSON.stringify(args)。",
    en: "Build key suffix from method args; default JSON.stringify(args).",
  },
];

export const CACHE_EVICT_OPTION_FIELDS: FieldDef[] = [
  {
    name: "key",
    type: "string",
    required: false,
    zh: "与 @Cacheable 相同的前缀。",
    en: "Same key prefix as @Cacheable.",
  },
  {
    name: "keyGenerator",
    type: "(...args) => string",
    required: false,
    zh: "后缀生成器；默认 JSON.stringify(args)。",
    en: "Suffix generator; default JSON.stringify(args).",
  },
  {
    name: "allEntries",
    type: "boolean",
    required: false,
    default: "false",
    zh: "true：按前缀 SCAN+DEL 清一组（谨慎）。",
    en: "true: SCAN+DEL all keys under the prefix (use carefully).",
  },
];

export const TRY_LOCK_OPTION_FIELDS: FieldDef[] = [
  {
    name: "ttlMs",
    type: "number",
    required: false,
    default: "30000",
    zh: "锁过期毫秒（进程崩溃靠 TTL）。",
    en: "Lock TTL ms (crash safety).",
  },
  {
    name: "token",
    type: "string",
    required: false,
    zh: "锁 token；默认随机。释放时需匹配。",
    en: "Lock token; random by default. Must match on release.",
  },
];

export const WITH_LOCK_OPTION_FIELDS: FieldDef[] = [
  ...TRY_LOCK_OPTION_FIELDS,
  {
    name: "renewIntervalMs",
    type: "number",
    required: false,
    default: "ttlMs/3",
    zh: "持锁续租间隔毫秒；≤0 不续租。",
    en: "Renew interval ms while holding; ≤0 disables renew.",
  },
];

export const REDISSON_CONFIG_FIELDS: FieldDef[] = [
  {
    name: "lockWatchdogTimeout",
    type: "number",
    required: false,
    default: "30000",
    zh: "看门狗默认租约毫秒；lock() 未指定 lease 时的续期基准。",
    en: "Watchdog lease ms when lock() omits leaseTime.",
  },
  {
    name: "lockWatchInterval",
    type: "number",
    required: false,
    default: "50",
    zh: "自旋等待最小间隔毫秒。",
    en: "Min spin-wait interval ms.",
  },
];

export const AUTH_OPTIONS_FIELDS: FieldDef[] = [
  {
    name: "tokenName",
    type: "string",
    required: false,
    default: '"satoken"',
    zh: "请求头 / Cookie 中的 token 字段名（优先读此 header）。",
    en: "Header/Cookie name for the token (checked first).",
  },
  {
    name: "header",
    type: "string",
    required: false,
    default: '"Authorization"',
    zh: "兼容读取的备用请求头（常配合 Bearer）。",
    en: "Fallback header (often Authorization + Bearer).",
  },
  {
    name: "tokenPrefix",
    type: "string",
    required: false,
    default: '"Bearer"',
    zh: "Authorization 前缀；设 \"\" 表示整段即 token、无前缀。",
    en: 'Authorization prefix; "" means raw token with no prefix.',
  },
  {
    name: "timeout",
    type: "number (ms)",
    required: false,
    default: "2h；-1 永不过期",
    zh: "会话绝对有效期（毫秒）。",
    en: "Absolute session TTL in ms (-1 = never expire).",
  },
  {
    name: "activityTimeout",
    type: "number (ms)",
    required: false,
    default: "-1",
    zh: "闲置超时；-1 关闭。有操作会 touch lastActiveTime。",
    en: "Idle timeout; -1 off. Activity touches lastActiveTime.",
  },
  {
    name: "allowConcurrentLogin",
    type: "boolean",
    required: false,
    default: "true",
    zh: "false 时新登录挤掉旧会话（可按 device）。",
    en: "false: new login kicks previous sessions (per device).",
  },
  {
    name: "isShare",
    type: "boolean",
    required: false,
    default: "false",
    zh: "true：同账号同设备复用已有 token 并刷新资料。",
    en: "true: reuse token for same account+device and refresh profile.",
  },
  {
    name: "tokenStyle",
    type: "TokenStyle",
    required: false,
    default: '"uuid"',
    zh: "uuid / simple-uuid / random-32|64|128 / tik / jwt。",
    en: "uuid / simple-uuid / random-32|64|128 / tik / jwt.",
  },
  {
    name: "jwtSecret",
    type: "string",
    required: false,
    zh: "tokenStyle=jwt 时的密钥；生产务必覆盖默认。",
    en: "JWT secret when tokenStyle=jwt; override in production.",
  },
  {
    name: "jwtAlgorithm",
    type: "string",
    required: false,
    default: '"HS256"',
    zh: "JWT 算法。",
    en: "JWT algorithm.",
  },
  {
    name: "createToken",
    type: "(payload) => string | Promise<string>",
    required: false,
    zh: "自定义签发，优先于 tokenStyle。",
    en: "Custom issuer; wins over tokenStyle.",
  },
  {
    name: "ignore",
    type: "string[]",
    required: false,
    default: "[]",
    zh: "全局放行路径（精确 / 前缀 / glob / **）。另有内置探测路径。",
    en: "Globally ignored paths (exact / prefix / glob / **). Built-in probe paths also apply.",
  },
  {
    name: "redis",
    type: "AuthRedisClient | typeof Redis",
    required: false,
    zh: "传入则会话落 Redis；不传用内存（多实例请传 Redis）。",
    en: "Pass Redis client for session store; omit = memory (use Redis for multi-instance).",
  },
  {
    name: "readCookie",
    type: "boolean",
    required: false,
    default: "true",
    zh: "是否从 Cookie[tokenName] 读 token。",
    en: "Also read token from Cookie[tokenName].",
  },
  {
    name: "checkMode",
    type: '"OR" | "AND"',
    required: false,
    default: '"OR"',
    zh: "装饰器/RouteOption 多角色多权限的默认匹配模式。",
    en: "Default OR/AND for multi role/permission checks.",
  },
];

export const LOGIN_OPTIONS_FIELDS: FieldDef[] = [
  {
    name: "roles",
    type: "string[]",
    required: false,
    zh: "写入会话的角色列表。",
    en: "Roles stored on the session.",
  },
  {
    name: "permissions",
    type: "string[]",
    required: false,
    zh: "写入会话的权限码列表。",
    en: "Permission codes stored on the session.",
  },
  {
    name: "username",
    type: "string",
    required: false,
    zh: "展示用用户名。",
    en: "Display username.",
  },
  {
    name: "avatar",
    type: "string",
    required: false,
    zh: "头像 URL/标识。",
    en: "Avatar URL/id.",
  },
  {
    name: "device",
    type: "string",
    required: false,
    zh: "设备维度（web/app 等），用于并发登录与 logoutByDevice。",
    en: "Device id (web/app); used for concurrent login and logoutByDevice.",
  },
  {
    name: "timeout",
    type: "number (ms)",
    required: false,
    zh: "覆盖本次会话的绝对有效期。",
    en: "Override absolute TTL for this session.",
  },
];

export const ROUTE_OPTION_FIELDS: FieldDef[] = [
  {
    name: "auth.ignore",
    type: "boolean",
    required: false,
    zh: "true：跳过登录与角色/权限校验。",
    en: "true: skip login and role/permission checks.",
  },
  {
    name: "auth.roles",
    type: "string[]",
    required: false,
    zh: "需要具备的角色码。",
    en: "Required role codes.",
  },
  {
    name: "auth.permissions",
    type: "string[]",
    required: false,
    zh: "需要具备的权限码。",
    en: "Required permission codes.",
  },
  {
    name: "auth.roleMode",
    type: '"OR" | "AND"',
    required: false,
    default: "Auth.checkMode",
    zh: "roles 数组匹配模式。",
    en: "Match mode for roles[].",
  },
  {
    name: "auth.permissionMode",
    type: '"OR" | "AND"',
    required: false,
    default: "Auth.checkMode",
    zh: "permissions 数组匹配模式。",
    en: "Match mode for permissions[].",
  },
  {
    name: "log",
    type: "LogRecordOption | {}",
    required: false,
    zh: "操作日志；传 {} 启用默认。字段见 LogRecordOption。",
    en: "Operation log; {} enables defaults. See LogRecordOption.",
  },
  {
    name: "rateLimit",
    type: "RateLimitOption | {}",
    required: false,
    zh: "限流；传 {} 默认 time=2/count=1。字段见 RateLimitOption。",
    en: "Rate limit; {} → time=2/count=1. See RateLimitOption.",
  },
  {
    name: "repeatSubmit",
    type: "RepeatSubmitOption | {}",
    required: false,
    zh: "防重复提交；传 {} 默认 interval=3000。字段见 RepeatSubmitOption。",
    en: "Idempotency; {} → interval=3000. See RepeatSubmitOption.",
  },
  {
    name: "raw",
    type: "boolean",
    required: false,
    default: "false",
    zh: "true：不包装 ResponseData，回调偏 (req,res)。",
    en: "true: no ResponseData wrap; callback closer to (req,res).",
  },
  {
    name: "flux",
    type: "boolean",
    required: false,
    default: "false",
    zh: "true：SSE，自动写 event-stream 头。",
    en: "true: SSE with event-stream headers.",
  },
  {
    name: "validate",
    type: "boolean",
    required: false,
    zh: "true：按 design:paramtypes 校验入参（同 @Validate）。",
    en: "true: validate args via design:paramtypes (same as @Validate).",
  },
  {
    name: "paramType",
    type: "ParamType",
    required: false,
    zh: "旧版单参注入来源：BODY/QUERY/PARAMS/HEADER/COOKIE/PATH。",
    en: "Legacy single-arg inject source: BODY/QUERY/PARAMS/HEADER/COOKIE/PATH.",
  },
];

export const LOG_RECORD_OPTION_FIELDS: FieldDef[] = [
  {
    name: "title",
    type: "string",
    required: false,
    zh: "操作标题（展示/落库）。",
    en: "Operation title.",
  },
  {
    name: "business",
    type: "BusinessType | number",
    required: false,
    default: "OTHER",
    zh: "业务类型序数。",
    en: "Business type ordinal.",
  },
  {
    name: "oper",
    type: "OperType | number",
    required: false,
    default: "PC",
    zh: "操作端类型。",
    en: "Client/oper type.",
  },
  {
    name: "excludeParamNames",
    type: "string[]",
    required: false,
    zh: "额外排除的参数名（密码等默认已排除）。",
    en: "Extra param names to strip (password already excluded).",
  },
  {
    name: "ignore",
    type: "boolean",
    required: false,
    zh: "true：本接口不记日志。",
    en: "true: skip logging for this route.",
  },
];

export const SCHEDULE_JOB_ENTITY_FIELDS: FieldDef[] = [
  {
    name: "id",
    type: "string",
    required: true,
    zh: "任务唯一 id（unschedule / 替换时用）。",
    en: "Unique job id (for unschedule / replace).",
  },
  {
    name: "title",
    type: "string",
    required: false,
    zh: "展示标题（可选）。",
    en: "Optional display title.",
  },
  {
    name: "cron",
    type: "string",
    required: true,
    zh: "Cron 表达式（5 或 6 段；支持 Quartz 风格 ? → *）。",
    en: "Cron (5 or 6 fields; Quartz ? → * supported).",
  },
  {
    name: "beanName",
    type: "string",
    required: true,
    zh: "Container 字符串别名；Bean 须有 execute() 或 run()。",
    en: "Container alias; Bean must expose execute() or run().",
  },
  {
    name: "status",
    type: "number | null",
    required: false,
    zh: "空或 0：停用并 unschedule；其它：启用调度。",
    en: "Empty/0: disable & unschedule; otherwise enable.",
  },
];

export const SCHEDULE_MODULE_OPTIONS_FIELDS: FieldDef[] = [
  {
    name: "loadJobs",
    type: "() => ScheduleJobEntity[] | Promise<...>",
    required: false,
    zh: "启动时加载启用任务的回调；由业务注入。",
    en: "Loader callback for enabled jobs at startup.",
  },
];

export const MAPPER_TABLE_OPTIONS_FIELDS: FieldDef[] = [
  {
    name: "idField",
    type: "string",
    required: false,
    default: '"id"',
    zh: "主键列名（或实体 @TableId）。",
    en: "Primary key column (or entity @TableId).",
  },
  {
    name: "datasource",
    type: "string",
    required: false,
    default: '"default"',
    zh: "数据源名（Db.register 的名字）。",
    en: "Datasource name from Db.register.",
  },
  {
    name: "logicDelete",
    type: "boolean",
    required: false,
    zh: "是否逻辑删除（覆盖全局）。",
    en: "Enable logic delete (overrides global).",
  },
  {
    name: "logicDeleteField",
    type: "string",
    required: false,
    zh: "逻辑删除列名。",
    en: "Logic-delete column name.",
  },
  {
    name: "logicDeleteValue / logicNotDeleteValue",
    type: "unknown",
    required: false,
    zh: "已删除 / 未删除写入与查询值。",
    en: "Deleted / not-deleted values.",
  },
  {
    name: "optimisticLock",
    type: "boolean",
    required: false,
    zh: "是否乐观锁。",
    en: "Enable optimistic lock.",
  },
  {
    name: "versionField",
    type: "string",
    required: false,
    zh: "版本列名。",
    en: "Version column name.",
  },
  {
    name: "fill",
    type: "boolean",
    required: false,
    default: "true",
    zh: "是否自动填充 create/update 字段。",
    en: "Auto-fill create/update columns.",
  },
  {
    name: "updateNullStrategy",
    type: '"INCLUDE" | "IGNORE"',
    required: false,
    default: '"INCLUDE"',
    zh: "更新时 null：INCLUDE 写 NULL；IGNORE 跳过该列。undefined 始终跳过。",
    en: "On update, null: INCLUDE writes NULL; IGNORE skips. undefined always skipped.",
  },
  {
    name: "entity",
    type: "Function (EntityCtor)",
    required: false,
    zh: "实体类，用于读 @TableField insertFill/updateFill。",
    en: "Entity class for @TableField insertFill/updateFill.",
  },
];

export const SELECT_QUERY_OPTIONS_FIELDS: FieldDef[] = [
  {
    name: "limit",
    type: "number",
    required: false,
    zh: "限制返回行数。",
    en: "Max rows to return.",
  },
  {
    name: "relations",
    type: "boolean | string[]",
    required: false,
    zh: "省略=仅 eager；false=不填关联；string[]=只填列出的属性（含 lazy）。",
    en: "Omit=eager only; false=no relations; string[]=those props (incl. lazy).",
  },
];

export const PAGE_QUERY_FIELDS: FieldDef[] = [
  {
    name: "current",
    type: "number",
    required: false,
    default: "1",
    zh: "当前页（从 1 起）。",
    en: "Page number (1-based).",
  },
  {
    name: "size",
    type: "number",
    required: false,
    default: "10",
    zh: "每页条数。",
    en: "Page size.",
  },
];

export const DATA_SOURCE_CONFIG_FIELDS: FieldDef[] = [
  {
    name: "name",
    type: "string",
    required: false,
    default: '"default"',
    zh: "数据源注册名。",
    en: "Registered datasource name.",
  },
  {
    name: "type",
    type: '"mysql" | "postgresql" | "sqlserver" | string',
    required: false,
    default: '"mysql"',
    zh: "数据库类型（决定方言）。",
    en: "DB type (selects dialect).",
  },
  {
    name: "host",
    type: "string",
    required: false,
    zh: "主机。",
    en: "Host.",
  },
  {
    name: "port",
    type: "number",
    required: false,
    zh: "端口（不写则按类型默认）。",
    en: "Port (type default if omitted).",
  },
  {
    name: "user",
    type: "string",
    required: false,
    zh: "用户名。",
    en: "Username.",
  },
  {
    name: "password",
    type: "string",
    required: false,
    zh: "密码。",
    en: "Password.",
  },
  {
    name: "database",
    type: "string",
    required: false,
    zh: "库名。",
    en: "Database name.",
  },
  {
    name: "connectionLimit",
    type: "number",
    required: false,
    default: "10",
    zh: "连接池大小。",
    en: "Pool size.",
  },
  {
    name: "options",
    type: "Record<string, unknown>",
    required: false,
    zh: "扩展项（如 SQL Server encrypt）。",
    en: "Driver extras (e.g. SQL Server encrypt).",
  },
];

export const HYDRATE_FIELD_SELECT_OPTIONS_FIELDS: FieldDef[] = [
  {
    name: "maxDepth",
    type: "number",
    required: false,
    zh: "额外递归层数上限。",
    en: "Max extra recursion depth.",
  },
  {
    name: "includeLazy",
    type: "boolean",
    required: false,
    zh: "true：也填充 eager:false 的字段 @Select。",
    en: "true: also fill eager:false property @Select.",
  },
  {
    name: "properties",
    type: "string[]",
    required: false,
    zh: "只填充列出的属性名。",
    en: "Only hydrate these property names.",
  },
  {
    name: "datasource",
    type: "string",
    required: false,
    zh: "字段未指定 datasource 时的默认库。",
    en: "Default datasource when field omits it.",
  },
  {
    name: "relations",
    type: "boolean | string[]",
    required: false,
    zh: "关联填充：省略仅 eager；false 不填；string[] 指定属性。",
    en: "Relation fill: omit=eager; false=off; string[]=named props.",
  },
];

export const RESOLVED_ORM_CONFIG_FIELDS: FieldDef[] = [
  {
    name: "logicDelete",
    type: "boolean",
    required: false,
    default: "true",
    zh: "全局逻辑删除开关。",
    en: "Global logic-delete switch.",
  },
  {
    name: "logicDeleteField",
    type: "string",
    required: false,
    default: '"delete_flag"',
    zh: "逻辑删除列名。",
    en: "Logic-delete column.",
  },
  {
    name: "logicDeleteValue / logicNotDeleteValue",
    type: "unknown",
    required: false,
    default: "1 / 0",
    zh: "已删除 / 未删除值。",
    en: "Deleted / not-deleted values.",
  },
  {
    name: "optimisticLock",
    type: "boolean",
    required: false,
    default: "false",
    zh: "全局乐观锁。",
    en: "Global optimistic lock.",
  },
  {
    name: "versionField",
    type: "string",
    required: false,
    default: '"version"',
    zh: "版本列名。",
    en: "Version column.",
  },
  {
    name: "idType",
    type: "string",
    required: false,
    default: '"ASSIGN_ID"',
    zh: "全局主键：ASSIGN_ID / AUTO / INPUT / ASSIGN_UUID / NONE。",
    en: "Global id strategy: ASSIGN_ID / AUTO / INPUT / ASSIGN_UUID / NONE.",
  },
  {
    name: "mapUnderscoreToCamelCase",
    type: "boolean",
    required: false,
    default: "true",
    zh: "查询结果列名下划线转驼峰。",
    en: "Map underscore columns to camelCase on read.",
  },
  {
    name: "fillCreateTime / fillUpdateTime / fillCreateBy / fillUpdateBy",
    type: "string",
    required: false,
    zh: "自动填充列名（值为 undefined 时写入）。",
    en: "Auto-fill column names (write when value is undefined).",
  },
  {
    name: "sqlLog",
    type: "boolean",
    required: false,
    default: "false",
    zh: "是否打印 SQL 日志。",
    en: "Enable SQL logging.",
  },
  {
    name: "sqlLogFormat",
    type: "string | (info)=>string",
    required: false,
    zh: "日志格式模板或函数；占位符 {time}{type}{sql}{params}{cost}。",
    en: "Format template or fn; placeholders {time}{type}{sql}{params}{cost}.",
  },
  {
    name: "sqlLogParts",
    type: "SqlLogParts",
    required: false,
    zh: "{ time?, type?, sql?, params?, cost? } 片段开关。",
    en: "{ time?, type?, sql?, params?, cost? } part toggles.",
  },
  {
    name: "sqlLogLevel",
    type: '"trace"|"debug"|"info"|"warn"',
    required: false,
    default: '"info"',
    zh: "SQL 日志级别。",
    en: "SQL log level.",
  },
  {
    name: "batchInsertSize / batchUpdateSize / batchInSize",
    type: "number",
    required: false,
    default: "200 / 200 / 500",
    zh: "saveBatch / updateBatch / 大 IN 分批大小。",
    en: "Batch sizes for saveBatch / updateBatch / large IN.",
  },
  {
    name: "mapperLocations",
    type: "string[]",
    required: false,
    zh: "XML Mapper 扫描路径。",
    en: "XML Mapper scan globs.",
  },
  {
    name: "mapperReload",
    type: "boolean",
    required: false,
    default: "false",
    zh: "开发态 XML 热加载。",
    en: "Hot-reload XML in development.",
  },
];

export const META_OBJECT_HANDLER_FIELDS: FieldDef[] = [
  {
    name: "insert",
    type: "(entity) => void | Promise<void>",
    required: false,
    zh: "插入前自定义填充（在默认 YAML fill 之后）。",
    en: "Custom fill before insert (after default YAML fill).",
  },
  {
    name: "update",
    type: "(entity) => void | Promise<void>",
    required: false,
    zh: "更新前自定义填充。",
    en: "Custom fill before update.",
  },
];

/** API 参数表：带可选前缀（如 config.host） */
export function typeParams(
  fields: FieldDef[],
  locale: Locale,
  prefix?: string
): ApiParam[] {
  return toParams(fields, locale, prefix);
}

/** 配置项表 */
export function typeConfigs(fields: FieldDef[], locale: Locale): ConfigItem[] {
  return toConfigs(fields, locale);
}

/** 顶层对象参数 + 展开字段 */
export function objectParamWithFields(
  locale: Locale,
  opts: {
    name: string;
    typeName: string;
    required?: boolean;
    summaryZh: string;
    summaryEn: string;
    fields: FieldDef[];
    /** 展开字段前缀，默认与 name 相同 */
    fieldPrefix?: string;
  }
): ApiParam[] {
  const summary = locale === "en" ? opts.summaryEn : opts.summaryZh;
  return [
    {
      name: opts.name,
      type: opts.typeName,
      required: opts.required ?? false,
      description: summary,
    },
    ...toParams(opts.fields, locale, opts.fieldPrefix ?? opts.name),
  ];
}
