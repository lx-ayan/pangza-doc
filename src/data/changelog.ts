import type { Locale } from "../i18n/types";

export interface ChangelogItem {
  /** semver，如 1.0.0 */
  version: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** 版本标题（可选） */
  title?: { zh: string; en: string };
  /** 变更条目 */
  changes: { zh: string; en: string }[];
}

/**
 * 框架更新日志（新版本写在数组最前面）。
 * 随 @pangza/* 发版同步维护。
 */
export const CHANGELOG: ChangelogItem[] = [
  {
    version: "1.1.6",
    date: "2026-10-27",
    title: {
      zh: "包边界重构、Validate 独立包、ConditionOnProperty 修复",
      en: "Package boundaries, @pangza/validate, ConditionOnProperty fix",
    },
    changes: [
      {
        zh: "真正分包：@pangza/core / orm / redis / auth / log / schedule / encrypt / validate；CLI 包名 pangza（init / g），勾选模块写入对应依赖",
        en: "Real packages: @pangza/core / orm / redis / auth / log / schedule / encrypt / validate; CLI pangza (init / g) writes selected deps",
      },
      {
        zh: "@Mapper / MapperType 仅从 @pangza/orm 导出；@Service / Container / BaseService 留在 @pangza/core（原 Service 目录并入 Application）",
        en: "@Mapper / MapperType from @pangza/orm only; @Service / Container / BaseService stay in @pangza/core (Service folder merged into Application)",
      },
      {
        zh: "@Validate 等迁至 @pangza/validate；Application 不再 re-export Validate / Json / Exception",
        en: "@Validate moved to @pangza/validate; Application no longer re-exports Validate / Json / Exception",
      },
      {
        zh: "@ConditionOnProperty：与 @Component 装饰器顺序无关；从 YAML 前缀节点发现字段并灌入（修复 field!: type 空对象问题）",
        en: "@ConditionOnProperty: order-independent with @Component; discovers fields from YAML prefix (fixes empty-object issue)",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-10-25",
    title: {
      zh: "分包导入、Service 无参、ConditionOnProperty、静态资源",
      en: "Split packages, optional @Service(), ConditionOnProperty, static mounts",
    },
    changes: [
      {
        zh: "开始按模块拆分 npm 包（后续 1.1.x 完善为真正独立包）",
        en: "Started splitting npm packages (refined as real packages in later 1.1.x)",
      },
      {
        zh: "@Service() 无参等同 @Component；@ConditionOnProperty(prefix) 按 YAML 前缀灌属性（字段默认值优先）",
        en: "@Service() with no args equals @Component; @ConditionOnProperty(prefix) binds YAML (field defaults win)",
      },
      {
        zh: "Application.static 支持 URL→目录：.static(\"/files\", \"upload\") / .static({ \"/static\": \"public\" })",
        en: "Application.static supports URL→dir: .static(\"/files\", \"upload\") / .static({ \"/static\": \"public\" })",
      },
    ],
  },
  {
    version: "1.0.2",
    date: "2026-10-22",
    title: {
      zh: "npm 单包、脚手架、按需连接与拦截器",
      en: "npm package, scaffold, opt-in connections, interceptors",
    },
    changes: [
      {
        zh: "发布 @pangza/core 单包；pangza：init 勾选模块、g 生成 entity/mapper/service/controller（含 g all）",
        en: "Publish @pangza/core; pangza: init with module picks, g for entity/mapper/service/controller (incl. g all)",
      },
      {
        zh: "EnableRedis / EnableOrm：仅 registry 后启动预热；未注册不连 Redis/MySQL，避免无配置用户启动报错",
        en: "EnableRedis / EnableOrm: warmup only after registry; skip Redis/MySQL connect when not enabled",
      },
      {
        zh: "Application：addRequestInterceptor / addResponseInterceptor；响应拦截可 wrap=false 跳过 ResponseData，或 handled 自行写响应",
        en: "Application: addRequestInterceptor / addResponseInterceptor; wrap=false skips ResponseData, or handled to write response yourself",
      },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-10-22",
    title: {
      zh: "配置取值：@Value 与 getConfigValue",
      en: "Config lookup: @Value and getConfigValue",
    },
    changes: [
      {
        zh: "Application：新增 @Value 属性装饰器，按点路径注入 application*.yaml 配置（支持 ${path:default}）",
        en: "Application: add @Value property decorator to inject application*.yaml by dot path (supports ${path:default})",
      },
      {
        zh: "config：新增 getConfig / getConfigValue / parseValueExpression / coerceConfigScalar，并从 @pangza/core 导出",
        en: "config: add getConfig / getConfigValue / parseValueExpression / coerceConfigScalar; re-exported from @pangza/core",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-10-21",
    title: {
      zh: "稳定版：生命周期、Redisson 与 ORM 能力补齐",
      en: "Stable: lifecycle, Redisson, and ORM completeness",
    },
    changes: [
      {
        zh: "Application：ApplicationInit / ApplicationDestroy、启动预热 warmupConnections、进程错误守卫 installProcessErrorGuards",
        en: "Application: ApplicationInit / ApplicationDestroy, warmupConnections, installProcessErrorGuards",
      },
      {
        zh: "Redis：Redisson 风格可重入锁 / 公平锁 / 读写锁 / 联锁、信号量、门闩与分布式对象；@Cacheable / @CacheEvict",
        en: "Redis: Redisson-style locks (reentrant / fair / RW / multi), semaphore, latch, distributed objects; @Cacheable / @CacheEvict",
      },
      {
        zh: "ORM：关联水合、属性级 @Select、乐观锁、自动填充、方言与 SQL 安全辅助、事务传播 REQUIRED / REQUIRES_NEW",
        en: "ORM: relation hydration, property @Select, optimistic lock, auto-fill, dialects & SQL safety helpers, REQUIRED / REQUIRES_NEW",
      },
      {
        zh: "ORM：XML Mapper（动态 SQL 标签、热加载）；多数据源懒连接",
        en: "ORM: XML Mapper (dynamic SQL tags, hot reload); lazy multi-datasource connections",
      },
      {
        zh: "文档站：核心模块 API/配置双语、中英文切换",
        en: "Docs site: bilingual module API/config pages and zh/en switch",
      },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-10-20",
    title: {
      zh: "YAML 配置与 ORM XML SQL",
      en: "YAML config and ORM XML SQL",
    },
    changes: [
      {
        zh: "配置改为 application.yaml / application-{profile}.yaml 叠加加载，移除 .env 示例依赖",
        en: "Config via application.yaml / application-{profile}.yaml overlays; drop .env.example dependency",
      },
      {
        zh: "ORM 支持 XML 编写 SQL（@MapperXml / mapperLocations）",
        en: "ORM supports XML SQL (@MapperXml / mapperLocations)",
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-10-08",
    title: {
      zh: "鉴权路径匹配与调度/日志整理",
      en: "Auth path matching and schedule/log cleanup",
    },
    changes: [
      {
        zh: "Auth：增强 ignore 路径匹配（glob / ** / 前缀等）",
        en: "Auth: richer ignore path matching (glob / ** / prefix, etc.)",
      },
      {
        zh: "分页 DTO 与菜单 / 角色 / 用户服务查询条件调整",
        en: "Pagination DTOs and menu / role / user query conditions adjusted",
      },
      {
        zh: "重构 Log 与 schedule 配置加载方式；完善 README 清理工程说明",
        en: "Refactor Log and schedule config loading; README cleanup guide",
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-09-30",
    title: {
      zh: "静态资源与 Redis 限流防重",
      en: "Static files and Redis rate-limit / repeat-submit",
    },
    changes: [
      {
        zh: "新增配置能力与静态文件挂载增强",
        en: "Configuration APIs and enhanced static file serving",
      },
      {
        zh: "限流 @RateLimiter、防重复提交 @RepeatSubmit 迁移至 Redis 实现",
        en: "Migrate @RateLimiter and @RepeatSubmit to Redis-backed implementations",
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-09-24",
    title: {
      zh: "项目初始化",
      en: "Project bootstrap",
    },
    changes: [
      {
        zh: "初始化 pangza-admin-express：Application / Auth / ORM / Redis / Service / Validate 等 framework 骨架",
        en: "Bootstrap pangza-admin-express: Application / Auth / ORM / Redis / Service / Validate framework skeleton",
      },
    ],
  },
];

export function getChangelog(locale: Locale): {
  version: string;
  date: string;
  title?: string;
  changes: string[];
}[] {
  return CHANGELOG.map((item) => ({
    version: item.version,
    date: item.date,
    title: item.title?.[locale],
    changes: item.changes.map((c) => c[locale]),
  }));
}

/** 当前文档展示的最新框架版本 */
export const LATEST_VERSION = CHANGELOG[0]?.version ?? "1.0.0";
