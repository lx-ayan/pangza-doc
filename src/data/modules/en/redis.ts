import type { DocPage } from "../../../types/doc";
import {
  CACHEABLE_OPTION_FIELDS,
  CACHE_EVICT_OPTION_FIELDS,
  RATE_LIMIT_OPTION_FIELDS,
  REDISSON_CONFIG_FIELDS,
  REDIS_CONFIG_FIELDS,
  REPEAT_SUBMIT_OPTION_FIELDS,
  TRY_LOCK_OPTION_FIELDS,
  WITH_LOCK_OPTION_FIELDS,
  objectParamWithFields,
  typeParams,
} from "../../typeFields";

export const redisApi: DocPage = {
  key: "Redis-api",
  title: "Redis · API",
  description:
    "Package @pangza/redis: Redis client (standalone / cluster / sentinel) + rate limiting / duplicate-submit guards / method-cache decorators + Redisson-style reentrant locks, synchronizers, and distributed objects. Connections are lazy: nothing connects on import; connect on first use or during Application warmup.",
  sections: [
    {
      id: "overview",
      title: "Module overview",
      content:
        'import Redis, { EnableRedis, Redisson, RateLimiter } from "@pangza/redis".\nBusiness keys go through Redis.key() with keyPrefix. Rate limit / duplicate submit / cache / simple lock use RATE_LIMIT_KEY / REPEAT_SUBMIT_KEY / CACHE_KEY / LOCK_KEY.\nPrefer Redisson.getLock for complex locks; Redis.tryLock / withLock are simple SET NX locks.',
    },
    {
      id: "client-lifecycle",
      title: "Connection lifecycle",
      apis: [
        {
          name: "Redis.configure",
          signature: "configure(config?: RedisConfig): void",
          description:
            "Merge runtime config (does not connect). Can also load from application.yaml redis — fields match 1:1. The table below expands every RedisConfig field.",
          params: objectParamWithFields("en", {
            name: "config",
            typeName: "RedisConfig",
            required: false,
            summaryZh: "",
            summaryEn:
              "Optional. Deep-merged into current config; omit to keep YAML / last configure. Does not connect.",
            fields: REDIS_CONFIG_FIELDS,
          }),
        },
        {
          name: "Redis.connect",
          signature: "connect(config?: RedisConfig): Promise<void>",
          description:
            "Connect (reuse if already connected). Passing config merges first. Same RedisConfig fields as configure.",
          params: objectParamWithFields("en", {
            name: "config",
            typeName: "RedisConfig",
            required: false,
            summaryZh: "",
            summaryEn:
              "Optional. Override/merge before connect; same fields as Redis.configure.",
            fields: REDIS_CONFIG_FIELDS,
          }),
        },
        {
          name: "Redis.disconnect",
          description: "Close the client and subscription connections.",
        },
        {
          name: "Redis.ping / isReady / getClient",
          description: "Health check; readiness; get the underlying client (must already be connected).",
        },
        {
          name: "Redis.key",
          signature: "key(raw: string): string",
          description: "Join keyPrefix; if raw already starts with the prefix, return it unchanged.",
          params: [
            {
              name: "raw",
              type: "string",
              required: true,
              description: "Logical key; returned with keyPrefix applied.",
            },
          ],
        },
      ],
      decoratorExample: `// 无装饰器；启动期配置
Application.registry(/* ... */).start();
// listen 后 warmup 会尝试 Redis.connect`,
      functionalExample: `Redis.configure({ host: "127.0.0.1", keyPrefix: "pangza:" });
await Redis.connect();
await Redis.ping(); // true
const client = await Redis.getClient();`,
    },
    {
      id: "client-kv",
      title: "KV / JSON / counters",
      apis: [
        {
          name: "set / get / del / exists",
          signature: "set(key, value, ttlSeconds?) / get(key) / del(...keys) / exists(key)",
          description: "String read/write; the third argument to set is TTL in seconds.",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "Logical key (prefix applied internally).",
            },
            {
              name: "value",
              type: "string",
              required: false,
              description: "set only: string value.",
            },
            {
              name: "ttlSeconds",
              type: "number",
              required: false,
              description: "set only: TTL in seconds.",
            },
            {
              name: "...keys",
              type: "string[]",
              required: false,
              description: "del only: one or more keys.",
            },
          ],
        },
        {
          name: "setJSON / getJSON",
          signature: "setJSON(key, value, ttlSeconds?) / getJSON<T>(key)",
          description: "JSON serialize/deserialize; get returns null on failure or empty.",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "Logical key.",
            },
            {
              name: "value",
              type: "unknown",
              required: false,
              description: "setJSON only: value JSON-serialized.",
            },
            {
              name: "ttlSeconds",
              type: "number",
              required: false,
              description: "setJSON only: TTL seconds.",
            },
          ],
        },
        {
          name: "setPx / setJSONPx",
          signature: "setPx(key, value, ttlMs) / setJSONPx(key, value, ttlMs)",
          description: "Write with millisecond TTL.",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "Logical key.",
            },
            {
              name: "value",
              type: "string | unknown",
              required: true,
              description: "Value (string or JSON-serializable for setJSONPx).",
            },
            {
              name: "ttlMs",
              type: "number",
              required: true,
              description: "TTL in milliseconds.",
            },
          ],
        },
        {
          name: "setNX / setNxPx",
          description: "Write only if the key does not exist; setNxPx includes a millisecond expiry. Returns whether the write succeeded.",
        },
        {
          name: "expire / ttl",
          description: "Set/query remaining seconds; ttl=-1 means no expiry, -2 means key does not exist.",
        },
        {
          name: "incr / decr",
          description: "Integer increment/decrement; returns the new value.",
        },
        {
          name: "deleteByPrefix",
          signature: "deleteByPrefix(prefix: string): Promise<number>",
          description: "SCAN+DEL bulk delete by prefix; used by @CacheEvict({ allEntries: true }). Use carefully on large key spaces in production.",
          params: [
            {
              name: "prefix",
              type: "string",
              required: true,
              description: "Logical key prefix to SCAN+DEL.",
            },
          ],
        },
      ],
      decoratorExample: `// KV 无装饰器；缓存见 @Cacheable`,
      functionalExample: `await Redis.setJSON("user:1", { name: "a" }, 60);
const u = await Redis.getJSON<{ name: string }>("user:1");
await Redis.setNxPx("once:token", "1", 5000);
await Redis.incr("counter:pv");
await Redis.deleteByPrefix(Redis.key("cache:UserService"));`,
    },
    {
      id: "client-structures",
      title: "Hash / Set / List / ZSet / PubSub / Pipeline",
      apis: [
        {
          name: "hSet / hGet / hGetAll / hDel",
          description: "Hash field read/write and delete.",
        },
        {
          name: "sAdd / sMembers / sRem",
          description: "Set add, members, and remove.",
        },
        {
          name: "lPush / rPush / lPop / rPop / lRange / lLen",
          description: "List push/pop at both ends, range read, and length.",
        },
        {
          name: "zAdd / zRange / zRangeByScore / zRem / zCard / zScore",
          description: "Sorted set; zRange defaults to ascending by score.",
        },
        {
          name: "pipeline",
          signature: "pipeline(fn: (multi) => void): Promise<unknown[]>",
          description: "Batch commands to reduce round trips.",
          params: [
            {
              name: "fn",
              type: "(multi) => void",
              required: true,
              description: "Callback that queues commands on the multi/pipeline object.",
            },
          ],
        },
        {
          name: "publish / subscribe",
          description:
            "Pub/sub; subscribe uses a dedicated connection and returns an unsubscribe function. listener(message, channel).",
        },
      ],
      decoratorExample: `// 结构命令无装饰器`,
      functionalExample: `await Redis.hSet("profile:1", "name", "zhang");
await Redis.lPush("queue:jobs", "job-1");
await Redis.zAdd("rank", 100, "u1");
await Redis.pipeline((m) => {
  m.set(Redis.key("a"), "1");
  m.incr(Redis.key("b"));
});
const unsub = await Redis.subscribe("ch:order", (msg) => console.log(msg));
await Redis.publish("ch:order", "paid");
await unsub();`,
    },
    {
      id: "simple-lock",
      title: "Simple distributed lock",
      content:
        "Based on SET NX + token-matched release; not Redlock. Process crashes rely on TTL. For reentrancy / watchdog / fair locks, use Redisson.",
      apis: [
        {
          name: "tryLock",
          signature: "tryLock(key, option?: TryLockOption): Promise<LockHandle | null>",
          description: "Acquire lock; returns handle or null. option is TryLockOption — fields below.",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "Logical lock name (LOCK_KEY / keyPrefix applied).",
            },
            {
              name: "option",
              type: "TryLockOption",
              required: false,
              description: "Optional; see option.* fields below.",
            },
            ...typeParams(TRY_LOCK_OPTION_FIELDS, "en", "option"),
          ],
        },
        {
          name: "withLock",
          signature: "withLock(key, fn, option?: WithLockOption): Promise<T>",
          description:
            "Run fn while holding the lock; optional renew. Throws LockError if not acquired. WithLockOption extends TryLockOption.",
          params: [
            { name: "key", type: "string", required: true, description: "Logical lock name." },
            {
              name: "fn",
              type: "() => T | Promise<T>",
              required: true,
              description: "Work while holding the lock.",
            },
            {
              name: "option",
              type: "WithLockOption",
              required: false,
              description: "Optional; see option.* below.",
            },
            ...typeParams(WITH_LOCK_OPTION_FIELDS, "en", "option"),
          ],
        },
        {
          name: "unlockIfMatch / renewIfMatch",
          description: "DEL / renew only when the value matches; returns whether it succeeded. LockHandle.release / renew wrap both.",
        },
        {
          name: "LockHandle",
          description: "{ key, token, release(), renew(ttlMs) }",
        },
        {
          name: "rateLimit / rateLimitSliding",
          signature: "rateLimit(key, windowSec, count) / rateLimitSliding(key, windowMs, count)",
          description: "Fixed-window / sliding-window (ZSET) Lua rate limiting; returns the current window count. Used underneath by the decorators.",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "Rate-limit bucket key.",
            },
            {
              name: "windowSec | windowMs",
              type: "number",
              required: true,
              description: "Fixed window seconds, or sliding window milliseconds.",
            },
            {
              name: "count",
              type: "number",
              required: true,
              description: "Max allowed hits in the window.",
            },
          ],
        },
      ],
      decoratorExample: `// 路由级限流用 @RateLimiter；业务代码可 withLock`,
      functionalExample: `const handle = await Redis.tryLock("job:sync", { ttlMs: 10_000 });
if (handle) {
  try { /* ... */ } finally { await handle.release(); }
}

await Redis.withLock("job:sync", async () => {
  /* critical */
}, { ttlMs: 30_000, renewIntervalMs: 10_000 });

const n = await Redis.rateLimit("rl:ip:1.1.1.1", 2, 5);`,
    },
    {
      id: "rate-repeat",
      title: "Rate limiting & duplicate submit",
      apis: [
        {
          name: "@RateLimiter",
          signature: "@RateLimiter(option?: RateLimitOption)",
          description:
            "API rate limiting; throws GuardError when exceeded. Also RouteOption.rateLimit. Table expands RateLimitOption.",
          params: objectParamWithFields("en", {
            name: "option",
            typeName: "RateLimitOption",
            required: false,
            summaryZh: "",
            summaryEn: "Optional. {} → time=2 / count=1 / type=DEFAULT / mode=fixed.",
            fields: RATE_LIMIT_OPTION_FIELDS,
          }),
        },
        {
          name: "@RepeatSubmit",
          signature: "@RepeatSubmit(option?: RepeatSubmitOption)",
          description:
            "Duplicate-submit guard (URL + user + body fingerprint). Table expands RepeatSubmitOption.",
          params: objectParamWithFields("en", {
            name: "option",
            typeName: "RepeatSubmitOption",
            required: false,
            summaryZh: "",
            summaryEn: "Optional. {} → interval=3000ms.",
            fields: REPEAT_SUBMIT_OPTION_FIELDS,
          }),
        },
        {
          name: "applyRateLimit / applyRepeatSubmit",
          description:
            "Functional: applyRateLimit(req, option?) / applyRepeatSubmit(req, option?). Options match the decorators above.",
          params: [
            {
              name: "req",
              type: "Request",
              required: true,
              description: "Express request (IP / user / URL / body fingerprint).",
            },
            {
              name: "option",
              type: "RateLimitOption | RepeatSubmitOption",
              required: false,
              description: "Same fields as @RateLimiter / @RepeatSubmit.",
            },
          ],
        },
        {
          name: "GuardError / LockError",
          description: "Rate limit / duplicate submit failure → GuardError; simple lock failure → LockError. The Exception module provides built-in mappings.",
        },
        {
          name: "RATE_LIMIT_KEY / REPEAT_SUBMIT_KEY / CACHE_KEY / LOCK_KEY",
          description: 'Constant prefixes: \"rateLimiter:\" / \"repeat:submit:\" / \"cache:\" / \"lock:\"',
        },
      ],
      decoratorExample: `@PostMapping("/submit")
@RateLimiter({
  time: 10,
  count: 5,
  type: RateLimiterType.IP,
  mode: "sliding",
})
@RepeatSubmit({ interval: 5000, message: "请勿重复提交" })
async submit(@RequestBody() body: any) {}`,
      functionalExample: `Application.POST("/api/submit", handler, {
  rateLimit: { time: 10, count: 5, type: "IP", mode: "sliding" },
  repeatSubmit: { interval: 5000 },
});

// 或在中间件/工具中
await applyRateLimit(req, { time: 2, count: 1, type: "DEFAULT" });
await applyRepeatSubmit(req, { interval: 3000 });`,
    },
    {
      id: "cache",
      title: "Method cache @Cacheable / @CacheEvict",
      apis: [
        {
          name: "@Cacheable",
          signature: "@Cacheable(option?: CacheableOption)",
          description:
            "JSON-cache the method return value in Redis; on hit, skip the method body. Table expands CacheableOption.",
          params: objectParamWithFields("en", {
            name: "option",
            typeName: "CacheableOption",
            required: false,
            summaryZh: "",
            summaryEn: "Optional. Defaults: prefix cache:{Class}.{method}, ttl=60.",
            fields: CACHEABLE_OPTION_FIELDS,
          }),
        },
        {
          name: "@CacheEvict",
          signature: "@CacheEvict(option?: CacheEvictOption)",
          description:
            "Evict cache after the method runs. Table expands CacheEvictOption.",
          params: objectParamWithFields("en", {
            name: "option",
            typeName: "CacheEvictOption",
            required: false,
            summaryZh: "",
            summaryEn: "Optional. allEntries=true deletes by prefix — use carefully.",
            fields: CACHE_EVICT_OPTION_FIELDS,
          }),
        },
      ],
      decoratorExample: `class UserService {
  @Cacheable({ ttl: 60, key: "cache:user" })
  async getUser(id: string) {
    return this.selectById(id);
  }

  @Cacheable({
    ttl: 120,
    keyGenerator: (id: string) => id,
  })
  async detail(id: string) { /* ... */ }

  @CacheEvict({ key: "cache:user", keyGenerator: (id) => id })
  async updateUser(id: string, dto: UpdateDto) { /* ... */ }

  @CacheEvict({ key: "cache:user", allEntries: true })
  async clearUserCache() {}
}`,
      functionalExample: `const key = Redis.key("cache:user:" + id);
const hit = await Redis.getJSON(key);
if (hit) return hit;
const data = await loadUser(id);
await Redis.setJSON(key, data, 60);

// 等价于 allEntries
await Redis.deleteByPrefix(Redis.key("cache:user"));`,
    },
    {
      id: "redisson-lock",
      title: "Redisson locks & synchronizers",
      content:
        "Built on the existing Redis connection. When lock() is called without a lease, the watchdog auto-renews; tryLock(wait, lease) with a lease uses a fixed lease and no watchdog.",
      apis: [
        {
          name: "Redisson / createRedisson",
          description:
            "Default singleton facade Redisson; createRedisson(config) creates an independent instance. configure / getClientId.",
        },
        {
          name: "getLock",
          signature: "getLock(name: string): RLock",
          description: "Reentrant lock (pubsub wake-up + watchdog).",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Lock name.",
            },
          ],
        },
        {
          name: "getFairLock",
          description: "Fair lock: acquire in wait-queue order.",
        },
        {
          name: "getReadWriteLock",
          description: "Read-write lock; readLock() / writeLock() each return an RLock.",
        },
        {
          name: "getMultiLock",
          signature: "getMultiLock(...locks: RLock[]): RLock",
          description: "Multi-lock: hold multiple locks; success only when all are acquired.",
          params: [
            {
              name: "...locks",
              type: "RLock[]",
              required: true,
              description: "Locks to combine into a multi-lock.",
            },
          ],
        },
        {
          name: "RLock.lock",
          signature: "lock(leaseTimeMs?: number): Promise<void>",
          description: "Blocking lock; omit lease → watchdog (lockWatchdogTimeout).",
          params: [
            {
              name: "leaseTimeMs",
              type: "number",
              required: false,
              description: "Lease duration ms; omit to use watchdog.",
            },
          ],
        },
        {
          name: "RLock.tryLock",
          signature: "tryLock(waitTimeMs?, leaseTimeMs?): Promise<boolean>",
          description:
            "tryLock() returns immediately; tryLock(wait) waits with watchdog; tryLock(wait, lease) uses a fixed lease.",
          params: [
            {
              name: "waitTimeMs",
              type: "number",
              required: false,
              description: "Max wait to acquire.",
            },
            {
              name: "leaseTimeMs",
              type: "number",
              required: false,
              description: "Lease duration ms after acquire.",
            },
          ],
        },
        {
          name: "RLock.unlock / forceUnlock",
          description: "Release the lock held by the current thread; forceUnlock forcibly deletes the lock (use with care).",
        },
        {
          name: "RLock.isLocked / isHeldByCurrentThread / getHoldCount / remainTimeToLive",
          description: "Status queries; TTL in milliseconds; -1/-2 semantics match Redis.",
        },
        {
          name: "getSemaphore",
          description: "Distributed semaphore.",
          params: [
            { name: "trySetPermits", type: "number", description: "Set permit count only on first call" },
            { name: "acquire / tryAcquire", type: "permits?, waitMs?", description: "Acquire permits" },
            { name: "release", type: "permits?", description: "Release" },
            { name: "availablePermits", type: "()", description: "Currently available" },
          ],
        },
        {
          name: "getCountDownLatch",
          description: "Count-down latch.",
          params: [
            { name: "trySetCount", type: "number", description: "Set count only on first call" },
            { name: "countDown", type: "()", description: "Decrement by one" },
            { name: "await", type: "waitMs?", description: "Wait until zero" },
            { name: "getCount", type: "()", description: "Current count" },
          ],
        },
        {
          name: "Redisson.withLock",
          signature: "withLock(name, fn, leaseMs?): Promise<T>",
          description: "Shortcut: getLock → lock → fn → unlock.",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Lock name.",
            },
            {
              name: "fn",
              type: "() => T | Promise<T>",
              required: true,
              description: "Work to run while holding the lock.",
            },
            {
              name: "leaseMs",
              type: "number",
              required: false,
              description: "Optional lease override.",
            },
          ],
        },
      ],
      decoratorExample: `import { Redisson } from "@pangza/redis";
import { Service } from "@pangza/core";

// No route decorator; use inside a Service
@Service(OrderMapper)
class OrderService {
  async pay(orderId: string) {
    const lock = Redisson.getLock("order:pay:" + orderId);
    await lock.lock();
    try {
      return this.doPay(orderId);
    } finally {
      await lock.unlock();
    }
  }
}`,
      functionalExample: `import { Redisson } from "@pangza/redis";

const lock = Redisson.getLock("order:pay");
if (await lock.tryLock(3000, 10_000)) {
  try { /* ... */ } finally { await lock.unlock(); }
}

const rw = Redisson.getReadWriteLock("cfg");
const r = rw.readLock();
await r.lock();
try { /* read */ } finally { await r.unlock(); }

const a = Redisson.getLock("a");
const b = Redisson.getLock("b");
const multi = Redisson.getMultiLock(a, b);
await multi.lock();
try { /* ... */ } finally { await multi.unlock(); }

const sem = Redisson.getSemaphore("pool");
await sem.trySetPermits(3);
await sem.acquire();
try { /* ... */ } finally { await sem.release(); }

const latch = Redisson.getCountDownLatch("init");
await latch.trySetCount(3);
// workers: await latch.countDown();
await latch.await(30_000);

await Redisson.withLock("job:x", async () => doWork());`,
    },
    {
      id: "redisson-objects",
      title: "Redisson distributed objects",
      apis: [
        {
          name: "getAtomicLong",
          description:
            "get / set / getAndSet / incrementAndGet / decrementAndGet / addAndGet / compareAndSet / delete",
        },
        {
          name: "getBucket",
          description:
            "JSON bucket: get / set(ttl?) / getAndDelete / compareAndSet / trySet / delete / isExists / expire",
        },
        {
          name: "getMap",
          description: "get / put / putAll / remove / containsKey / readAllMap / size / clear",
        },
        {
          name: "getSet",
          description: "add / remove / contains / readAll / size / clear",
        },
        {
          name: "getList",
          description: "add / get(index) / range / remove / size / clear",
        },
        {
          name: "getScoredSortedSet",
          description:
            "add / addAll / remove / rank / score / valueRange / valueRangeByScore / size / clear",
        },
        {
          name: "getQueue",
          description: "offer / poll / peek / size / clear",
        },
        {
          name: "getTopic",
          description: "publish / addListener → returns an unsubscribe function",
        },
        {
          name: "getRateLimiter",
          description: "trySetRate(rate, intervalMs) / tryAcquire(permits?) / availablePermits",
        },
        {
          name: "getBitSet",
          description: "get / set / clear / cardinality / size",
        },
      ],
      decoratorExample: `// 对象 API 无装饰器`,
      functionalExample: `const counter = Redisson.getAtomicLong("uv");
await counter.incrementAndGet();

const bucket = Redisson.getBucket<User>("u:1");
await bucket.set({ id: "1" }, 60);

const map = Redisson.getMap("session");
await map.put("uid", "1");

const topic = Redisson.getTopic("events");
const off = await topic.addListener((m) => console.log(m));
await topic.publish("hello");
await off();

const rl = Redisson.getRateLimiter("api");
await rl.trySetRate(10, 1000);
if (await rl.tryAcquire()) { /* ok */ }`,
    },
  ],
};

export const redisConfig: DocPage = {
  key: "Redis-config",
  title: "Redis · Configuration",
  description: "application.yaml → redis; Redisson watchdog is configured via Redisson.configure / createRedisson.",
  sections: [
    {
      id: "yaml",
      title: "YAML redis (standalone)",
      configs: [
        { name: "host", type: "string", default: "127.0.0.1", description: "Standalone host" },
        { name: "port", type: "number", default: "6379", description: "Port" },
        { name: "password", type: "string", default: '""', description: "Password; empty if none" },
        { name: "username", type: "string", description: "ACL username (Redis 6+); omit when empty" },
        { name: "db", type: "number", default: "0", description: "Database index; ignored in cluster mode" },
        { name: "keyPrefix", type: "string", default: '"pangza:"', description: "Business key prefix for environment isolation" },
        { name: "connectTimeout", type: "number", default: "3000", description: "Connect timeout in milliseconds" },
        { name: "reconnect", type: "boolean", default: "true", description: "Exponential-backoff reconnect on disconnect; false disables reconnect" },
        { name: "maxReconnectDelay", type: "number", default: "10000", description: "Max reconnect interval in milliseconds" },
        { name: "mode", type: "standalone|cluster|sentinel", default: "standalone", description: "Connection mode" },
      ],
      functionalExampleTitle: "Config example",
      functionalExample: `redis:
  host: 127.0.0.1
  port: 6379
  password: ""
  username: ""
  db: 0
  keyPrefix: "pangza:"
  connectTimeout: 3000
  reconnect: true
  maxReconnectDelay: 10000
  mode: standalone
  tls:
    enabled: false`,
    },
    {
      id: "cluster-sentinel-tls",
      title: "cluster / sentinel / tls",
      configs: [
        { name: "cluster.nodes", type: "Array<{host, port?}>", description: "Cluster seed nodes; ≥3 recommended in production" },
        { name: "cluster.useReplicas", type: "boolean", description: "Whether read-only commands go to replicas" },
        { name: "sentinel.name", type: "string", description: "Master name monitored by Sentinel" },
        { name: "sentinel.nodes", type: "Array<{host, port?}>", description: "Sentinel node list" },
        { name: "tls.enabled", type: "boolean", default: "false", description: "Whether to enable TLS" },
        { name: "tls.rejectUnauthorized", type: "boolean", description: "Verify certificates; may be false for self-signed debugging — do not disable in production" },
        { name: "tls.ca / cert / key", type: "string", description: "Certificate file paths" },
      ],
      functionalExampleTitle: "Config example",
      functionalExample: `redis:
  mode: cluster
  keyPrefix: "pangza:"
  cluster:
    useReplicas: true
    nodes:
      - { host: 10.0.0.1, port: 6379 }
      - { host: 10.0.0.2, port: 6379 }
      - { host: 10.0.0.3, port: 6379 }

# 或 Sentinel
redis:
  mode: sentinel
  sentinel:
    name: mymaster
    nodes:
      - { host: 10.0.0.10, port: 26379 }
  password: "secret"
  tls:
    enabled: true
    rejectUnauthorized: true
    ca: /etc/ssl/ca.pem`,
    },
    {
      id: "redisson-cfg",
      title: "RedissonConfig",
      content:
        "Argument type for Redisson.configure(config?) / createRedisson(config?). Unrelated to RedisConfig — watchdog & spin only.",
      configs: [
        ...REDISSON_CONFIG_FIELDS.map((f) => ({
          name: f.name,
          type: f.type,
          ...(f.default !== undefined ? { default: f.default } : {}),
          description: f.en,
        })),
      ],
      functionalExampleTitle: "Functional usage",
      functionalExample: `Redisson.configure({ lockWatchdogTimeout: 30_000 });
const client = createRedisson({
  lockWatchdogTimeout: 20_000,
  lockWatchInterval: 50,
});`,
    },
  ],
};
