import type { DocPage } from "../../types/doc";
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
} from "../typeFields";

export const redisApi: DocPage = {
  key: "Redis-api",
  title: "Redis · API",
  description:
    "包 @pangza/redis：Redis 客户端（standalone / cluster / sentinel）+ 限流 / 防重 / 方法缓存装饰器 + Redisson 风格可重入锁、同步器与分布式对象。连接懒加载：不在 import 时连，首次调用或 Application 预热时 connect。",
  sections: [
    {
      id: "overview",
      title: "模块说明",
      content:
        "import Redis, { EnableRedis, Redisson, RateLimiter } from \"@pangza/redis\"。\n业务 key 经 Redis.key() 自动加 keyPrefix。限流/防重/缓存/简易锁使用 RATE_LIMIT_KEY / REPEAT_SUBMIT_KEY / CACHE_KEY / LOCK_KEY。\n复杂分布式锁优先 Redisson.getLock；Redis.tryLock / withLock 为简易 SET NX 锁。",
    },
    {
      id: "client-lifecycle",
      title: "连接生命周期",
      apis: [
        {
          name: "Redis.configure",
          signature: "configure(config?: RedisConfig): void",
          description:
            "合并运行时配置（不立即连）。也可由 application.yaml 的 redis 段加载，字段一一对应。下表展开 RedisConfig 全部字段。",
          params: objectParamWithFields("zh", {
            name: "config",
            typeName: "RedisConfig",
            required: false,
            summaryZh:
              "可选。传入则与当前配置 deep-merge；不传则保持 YAML/上次 configure 结果。不触发连接。",
            summaryEn: "",
            fields: REDIS_CONFIG_FIELDS,
          }),
        },
        {
          name: "Redis.connect",
          signature: "connect(config?: RedisConfig): Promise<void>",
          description:
            "建立连接；已连则复用。若传入 config 会先合并再连。字段同 RedisConfig。",
          params: objectParamWithFields("zh", {
            name: "config",
            typeName: "RedisConfig",
            required: false,
            summaryZh: "可选。连接前覆盖/合并配置；字段含义同 Redis.configure。",
            summaryEn: "",
            fields: REDIS_CONFIG_FIELDS,
          }),
        },
        {
          name: "Redis.disconnect",
          description: "关闭连接与订阅连接。",
        },
        {
          name: "Redis.ping / isReady / getClient",
          description: "健康检查；是否就绪；取底层客户端（需已 connect）。",
        },
        {
          name: "Redis.key",
          signature: "key(raw: string): string",
          description: "拼接 keyPrefix；raw 已以 prefix 开头则原样返回。",
          params: [
            {
              name: "raw",
              type: "string",
              required: true,
              description: "逻辑 key；返回时自动加 keyPrefix。",
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
      title: "KV / JSON / 计数",
      apis: [
        {
          name: "set / get / del / exists",
          signature: "set(key, value, ttlSeconds?) / get(key) / del(...keys) / exists(key)",
          description: "字符串读写；set 第三参为秒级 TTL。",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "逻辑 key（内部加前缀）。",
            },
            {
              name: "value",
              type: "string",
              required: false,
              description: "仅 set：字符串值。",
            },
            {
              name: "ttlSeconds",
              type: "number",
              required: false,
              description: "仅 set：过期秒数。",
            },
            {
              name: "...keys",
              type: "string[]",
              required: false,
              description: "仅 del：一个或多个 key。",
            },
          ],
        },
        {
          name: "setJSON / getJSON",
          signature: "setJSON(key, value, ttlSeconds?) / getJSON<T>(key)",
          description: "JSON 序列化存取；get 失败或空返回 null。",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "逻辑 key。",
            },
            {
              name: "value",
              type: "unknown",
              required: false,
              description: "仅 setJSON：会被 JSON 序列化的值。",
            },
            {
              name: "ttlSeconds",
              type: "number",
              required: false,
              description: "仅 setJSON：过期秒数。",
            },
          ],
        },
        {
          name: "setPx / setJSONPx",
          signature: "setPx(key, value, ttlMs) / setJSONPx(key, value, ttlMs)",
          description: "毫秒级 TTL 写入。",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "逻辑 key。",
            },
            {
              name: "value",
              type: "string | unknown",
              required: true,
              description: "值（setJSONPx 为可 JSON 序列化对象）。",
            },
            {
              name: "ttlMs",
              type: "number",
              required: true,
              description: "过期毫秒数。",
            },
          ],
        },
        {
          name: "setNX / setNxPx",
          description: "仅当 key 不存在时写入；setNxPx 带毫秒过期。返回是否成功。",
        },
        {
          name: "expire / ttl",
          description: "设置/查询剩余秒数；ttl=-1 无过期，-2 key 不存在。",
        },
        {
          name: "incr / decr",
          description: "整数自增/自减，返回新值。",
        },
        {
          name: "deleteByPrefix",
          signature: "deleteByPrefix(prefix: string): Promise<number>",
          description: "SCAN+DEL 按前缀批量删；@CacheEvict({ allEntries: true }) 依赖它。谨慎用于生产大 key 空间。",
          params: [
            {
              name: "prefix",
              type: "string",
              required: true,
              description: "要批量删除的逻辑 key 前缀（SCAN+DEL）。",
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
          description: "Hash 字段读写与删除。",
        },
        {
          name: "sAdd / sMembers / sRem",
          description: "集合增删查。",
        },
        {
          name: "lPush / rPush / lPop / rPop / lRange / lLen",
          description: "列表两端推入弹出、区间读取、长度。",
        },
        {
          name: "zAdd / zRange / zRangeByScore / zRem / zCard / zScore",
          description: "有序集合；zRange 默认按 score 升序。",
        },
        {
          name: "pipeline",
          signature: "pipeline(fn: (multi) => void): Promise<unknown[]>",
          description: "批量命令，减少往返。",
          params: [
            {
              name: "fn",
              type: "(multi) => void",
              required: true,
              description: "在 multi/pipeline 上排队命令的回调。",
            },
          ],
        },
        {
          name: "publish / subscribe",
          description:
            "发布订阅；subscribe 使用独立连接，返回取消函数。listener(message, channel)。",
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
      title: "简易分布式锁",
      content:
        "基于 SET NX + token 匹配释放；非 Redlock。进程崩溃靠 TTL。需要可重入/看门狗/公平锁请用 Redisson。",
      apis: [
        {
          name: "tryLock",
          signature: "tryLock(key, option?: TryLockOption): Promise<LockHandle | null>",
          description: "抢锁成功返回句柄，失败 null。option 为 TryLockOption。",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "锁逻辑名（内部加 LOCK_KEY / keyPrefix）。",
            },
            {
              name: "option",
              type: "TryLockOption",
              required: false,
              description: "可选锁选项；字段见下方 option.*。",
            },
            ...typeParams(TRY_LOCK_OPTION_FIELDS, "zh", "option"),
          ],
        },
        {
          name: "withLock",
          signature: "withLock(key, fn, option?: WithLockOption): Promise<T>",
          description: "持锁执行；可选续租。抢不到抛 LockError。option 继承 TryLockOption 并多 renewIntervalMs。",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "锁逻辑名。",
            },
            {
              name: "fn",
              type: "() => T | Promise<T>",
              required: true,
              description: "持锁期间执行的函数。",
            },
            {
              name: "option",
              type: "WithLockOption",
              required: false,
              description: "可选；字段见下方 option.*。",
            },
            ...typeParams(WITH_LOCK_OPTION_FIELDS, "zh", "option"),
          ],
        },
        {
          name: "unlockIfMatch / renewIfMatch",
          description: "仅当 value 匹配才 DEL / 续期；返回是否成功。LockHandle.release / renew 封装二者。",
        },
        {
          name: "LockHandle",
          description: "{ key, token, release(), renew(ttlMs) }",
        },
        {
          name: "rateLimit / rateLimitSliding",
          signature: "rateLimit(key, windowSec, count) / rateLimitSliding(key, windowMs, count)",
          description: "固定窗口 / 滑动窗口（ZSET）Lua 限流，返回当前窗口计数；底层供装饰器使用。",
          params: [
            {
              name: "key",
              type: "string",
              required: true,
              description: "限流桶 key。",
            },
            {
              name: "windowSec | windowMs",
              type: "number",
              required: true,
              description: "固定窗口秒数，或滑动窗口毫秒数。",
            },
            {
              name: "count",
              type: "number",
              required: true,
              description: "窗口内允许的最大次数。",
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
      title: "限流与防重",
      apis: [
        {
          name: "@RateLimiter",
          signature: "@RateLimiter(option?: RateLimitOption)",
          description:
            "接口限流，超限抛 GuardError。也可写在 RouteOption.rateLimit。下表为 RateLimitOption 全部字段。",
          params: objectParamWithFields("zh", {
            name: "option",
            typeName: "RateLimitOption",
            required: false,
            summaryZh: "可选。传 {} 使用默认 time=2 / count=1 / type=DEFAULT / mode=fixed。",
            summaryEn: "",
            fields: RATE_LIMIT_OPTION_FIELDS,
          }),
        },
        {
          name: "@RepeatSubmit",
          signature: "@RepeatSubmit(option?: RepeatSubmitOption)",
          description:
            "防重复提交：URL + 用户 + 参数指纹，SET NX PX。超间隔内重复抛 GuardError。下表为 RepeatSubmitOption。",
          params: objectParamWithFields("zh", {
            name: "option",
            typeName: "RepeatSubmitOption",
            required: false,
            summaryZh: "可选。传 {} 默认 interval=3000ms。",
            summaryEn: "",
            fields: REPEAT_SUBMIT_OPTION_FIELDS,
          }),
        },
        {
          name: "applyRateLimit / applyRepeatSubmit",
          description:
            "函数式等价：applyRateLimit(req, option?) / applyRepeatSubmit(req, option?)。option 字段分别同 RateLimitOption / RepeatSubmitOption。",
          params: [
            {
              name: "req",
              type: "Request",
              required: true,
              description: "Express 请求（用于取 IP / 用户 / URL / body 指纹）。",
            },
            {
              name: "option",
              type: "RateLimitOption | RepeatSubmitOption",
              required: false,
              description: "与对应装饰器相同；字段见上方 @RateLimiter / @RepeatSubmit。",
            },
          ],
        },
        {
          name: "GuardError / LockError",
          description: "限流/防重失败 → GuardError；简易锁失败 → LockError。Exception 模块有内置映射。",
        },
        {
          name: "RATE_LIMIT_KEY / REPEAT_SUBMIT_KEY / CACHE_KEY / LOCK_KEY",
          description: '常量前缀：\"rateLimiter:\" / \"repeat:submit:\" / \"cache:\" / \"lock:\"',
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
      title: "方法缓存 @Cacheable / @CacheEvict",
      apis: [
        {
          name: "@Cacheable",
          signature: "@Cacheable(option?: CacheableOption)",
          description:
            "方法返回值 JSON 缓存到 Redis；命中则跳过方法体。下表为 CacheableOption 全部字段。",
          params: objectParamWithFields("zh", {
            name: "option",
            typeName: "CacheableOption",
            required: false,
            summaryZh: "可选。省略则用默认前缀与 ttl=60。",
            summaryEn: "",
            fields: CACHEABLE_OPTION_FIELDS,
          }),
        },
        {
          name: "@CacheEvict",
          signature: "@CacheEvict(option?: CacheEvictOption)",
          description:
            "方法执行后删除缓存。下表为 CacheEvictOption 全部字段。",
          params: objectParamWithFields("zh", {
            name: "option",
            typeName: "CacheEvictOption",
            required: false,
            summaryZh: "可选。allEntries=true 时按前缀批量删除，请谨慎。",
            summaryEn: "",
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
      title: "Redisson 锁与同步器",
      content:
        "基于现有 Redis 连接。lock() 未指定 lease 时启用看门狗自动续期；tryLock(wait, lease) 指定 lease 则固定租约、不看门狗。",
      apis: [
        {
          name: "Redisson / createRedisson",
          description:
            "默认单例门面 Redisson；createRedisson(config) 创建独立实例。configure / getClientId。",
        },
        {
          name: "getLock",
          signature: "getLock(name: string): RLock",
          description: "可重入锁（pubsub 唤醒 + 看门狗）。",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "锁名称。",
            },
          ],
        },
        {
          name: "getFairLock",
          description: "公平锁：按等待队列顺序获锁。",
        },
        {
          name: "getReadWriteLock",
          description: "读写锁；readLock() / writeLock() 各返回 RLock。",
        },
        {
          name: "getMultiLock",
          signature: "getMultiLock(...locks: RLock[]): RLock",
          description: "联锁：同时持有多把锁，全部成功才算持有。",
          params: [
            {
              name: "...locks",
              type: "RLock[]",
              required: true,
              description: "要组合成联锁的 RLock 列表。",
            },
          ],
        },
        {
          name: "RLock.lock",
          signature: "lock(leaseTimeMs?: number): Promise<void>",
          description: "阻塞加锁；省略 lease → 看门狗（lockWatchdogTimeout）。",
          params: [
            {
              name: "leaseTimeMs",
              type: "number",
              required: false,
              description: "持锁租约毫秒；省略则走看门狗续租。",
            },
          ],
        },
        {
          name: "RLock.tryLock",
          signature: "tryLock(waitTimeMs?, leaseTimeMs?): Promise<boolean>",
          description:
            "tryLock() 立即返回；tryLock(wait) 等待且看门狗；tryLock(wait, lease) 固定租约。",
          params: [
            {
              name: "waitTimeMs",
              type: "number",
              required: false,
              description: "最长等待抢锁毫秒。",
            },
            {
              name: "leaseTimeMs",
              type: "number",
              required: false,
              description: "抢到后的租约毫秒。",
            },
          ],
        },
        {
          name: "RLock.unlock / forceUnlock",
          description: "释放当前线程持有；forceUnlock 强制删锁（慎用）。",
        },
        {
          name: "RLock.isLocked / isHeldByCurrentThread / getHoldCount / remainTimeToLive",
          description: "状态查询；TTL 毫秒，-1/-2 语义同 Redis。",
        },
        {
          name: "getSemaphore",
          description: "分布式信号量。",
          params: [
            { name: "trySetPermits", type: "number", description: "仅首次设置许可数" },
            { name: "acquire / tryAcquire", type: "permits?, waitMs?", description: "获取许可" },
            { name: "release", type: "permits?", description: "释放" },
            { name: "availablePermits", type: "()", description: "当前可用" },
          ],
        },
        {
          name: "getCountDownLatch",
          description: "倒计时门闩。",
          params: [
            { name: "trySetCount", type: "number", description: "仅首次设 count" },
            { name: "countDown", type: "()", description: "减一" },
            { name: "await", type: "waitMs?", description: "等待归零" },
            { name: "getCount", type: "()", description: "当前计数" },
          ],
        },
        {
          name: "Redisson.withLock",
          signature: "withLock(name, fn, leaseMs?): Promise<T>",
          description: "快捷：getLock → lock → fn → unlock。",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "锁名称。",
            },
            {
              name: "fn",
              type: "() => T | Promise<T>",
              required: true,
              description: "持锁期间执行的函数。",
            },
            {
              name: "leaseMs",
              type: "number",
              required: false,
              description: "可选租约覆盖。",
            },
          ],
        },
      ],
      decoratorExample: `import { Redisson } from "@pangza/redis";
import { Service } from "@pangza/core";

// Redisson 无路由装饰器；在 Service 内使用
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
      title: "Redisson 分布式对象",
      apis: [
        {
          name: "getAtomicLong",
          description:
            "get / set / getAndSet / incrementAndGet / decrementAndGet / addAndGet / compareAndSet / delete",
        },
        {
          name: "getBucket",
          description:
            "JSON 桶：get / set(ttl?) / getAndDelete / compareAndSet / trySet / delete / isExists / expire",
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
          description: "publish / addListener → 返回取消订阅函数",
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
  title: "Redis · 配置项",
  description: "application.yaml → redis；Redisson 看门狗通过 Redisson.configure / createRedisson 配置。",
  sections: [
    {
      id: "yaml",
      title: "YAML redis（standalone）",
      configs: [
        { name: "host", type: "string", default: "127.0.0.1", description: "standalone 主机" },
        { name: "port", type: "number", default: "6379", description: "端口" },
        { name: "password", type: "string", default: '""', description: "密码；无则空" },
        { name: "username", type: "string", description: "ACL 用户名（Redis 6+）；空不传" },
        { name: "db", type: "number", default: "0", description: "库号；cluster 模式忽略" },
        { name: "keyPrefix", type: "string", default: '"pangza:"', description: "业务 key 前缀，隔离环境" },
        { name: "connectTimeout", type: "number", default: "3000", description: "连接超时毫秒" },
        { name: "reconnect", type: "boolean", default: "true", description: "断线指数退避重连；false 不重连" },
        { name: "maxReconnectDelay", type: "number", default: "10000", description: "重连最大间隔毫秒" },
        { name: "mode", type: "standalone|cluster|sentinel", default: "standalone", description: "连接模式" },
      ],
      functionalExampleTitle: "配置示例",
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
        { name: "cluster.nodes", type: "Array<{host, port?}>", description: "集群种子节点；生产建议 ≥3" },
        { name: "cluster.useReplicas", type: "boolean", description: "只读命令是否打到副本" },
        { name: "sentinel.name", type: "string", description: "Sentinel 监控的主节点名" },
        { name: "sentinel.nodes", type: "Array<{host, port?}>", description: "Sentinel 节点列表" },
        { name: "tls.enabled", type: "boolean", default: "false", description: "是否启用 TLS" },
        { name: "tls.rejectUnauthorized", type: "boolean", description: "校验证书；自签调试可 false，生产勿关" },
        { name: "tls.ca / cert / key", type: "string", description: "证书文件路径" },
      ],
      functionalExampleTitle: "配置示例",
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
        "Redisson.configure(config?) / createRedisson(config?) 的参数类型。与 RedisConfig 无关，只控制看门狗与自旋。",
      configs: [
        ...REDISSON_CONFIG_FIELDS.map((f) => ({
          name: f.name,
          type: f.type,
          ...(f.default !== undefined ? { default: f.default } : {}),
          description: f.zh,
        })),
      ],
      functionalExampleTitle: "函数式用法",
      functionalExample: `Redisson.configure({ lockWatchdogTimeout: 30_000 });
const client = createRedisson({
  lockWatchdogTimeout: 20_000,
  lockWatchInterval: 50,
});`,
    },
  ],
};
