import type { DocPage } from "../types/doc";
import type { Locale } from "../i18n/types";
import { guidePagesEn } from "./guide.en";

const guidePagesZh: Record<string, DocPage> = {
  intro: {
    key: "intro",
    title: "项目介绍",
    description:
      "Pangza 是一套以装饰器 + IoC 为核心的 Node.js / Express 框架。核心包为 @pangza/core，ORM / Redis / Auth / Validate 等按需安装；用 pangza CLI 脚手架初始化。",
    sections: [
      {
        id: "what",
        title: "它解决什么问题",
        content:
          "用统一的装饰器声明 Controller、Service、Mapper、鉴权、校验、日志与限流，减少样板代码。\n业务项目依赖 @pangza/core，按需加 @pangza/orm、@pangza/redis、@pangza/auth、@pangza/validate 等；用 Application.scan 扫描业务目录并注册路由。\n支持 MySQL / PostgreSQL / SQL Server 多数据源、Redis（含 Redisson 风格锁）、定时任务与操作审计。\nRedis / ORM 按需启用：仅在 registry(EnableRedis/EnableOrm)（或 Auth 绑定 redis）后才会启动预热连接。",
      },
      {
        id: "packages",
        title: "分包一览",
        content:
          "@pangza/core：Application、HTTP 装饰器、@Value、Logger、Json、Exception、config、IoC（Container / @Component / @Resource / @Service / @Bean / BaseService）。\n@pangza/orm：Db、EnableOrm、@Mapper、MapperType、实体装饰器、QueryWrapper、XML Mapper。\n@pangza/validate：@Validate、@NotNull、@Min/@Max、@Email/@Phone、validateHandler。\n@pangza/redis / @pangza/auth / @pangza/log / @pangza/schedule / @pangza/encrypt：按能力可选安装。\n脚手架：npm 包名 pangza（pangza init / pangza g）。",
      },
      {
        id: "scope",
        title: "本站文档范围",
        content:
          "本站覆盖各 @pangza/* 公开能力：每个核心模块页合并展示 API 与配置项。\n示例代码按真实分包导入（勿再从 core 一把导入 ORM / Validate / Redis）。\n说明后给出装饰器写法与函数式写法两种示例。",
      },
      {
        id: "stack",
        title: "技术栈",
        content:
          "运行时：Node.js + Express 5 + TypeScript（experimentalDecorators + emitDecoratorMetadata）。\nIoC：Inversify。数据访问：mysql2 / pg / mssql。缓存与锁：redis（node-redis v6）。日志：pino。\n安装：@pangza/core + 可选分包；脚手架：npx pangza。",
      },
    ],
  },
  quickstart: {
    key: "quickstart",
    title: "快速开始",
    description:
      "用 pangza 脚手架创建空项目，按需勾选模块，并用 g 生成业务四件套。",
    sections: [
      {
        id: "scaffold",
        title: "脚手架创建项目（推荐）",
        content:
          "使用 pangza init 生成空模板，交互勾选 orm / auth / redis / log / schedule / encrypt / validate。\n勾选后会写入对应 @pangza/* 依赖（含 @pangza/validate）；勾选 orm / redis 时写入 EnableOrm() / EnableRedis()。\n非交互可用 --modules 与 --db。",
        functionalExample: `# 交互式
npx pangza@latest init my-app

# 非交互示例（含校验）
npx pangza@latest init my-app --modules=orm,auth,redis,validate --db=mysql

cd my-app
cp .env.example .env   # 按需；端口与库配置以 application.yaml 为准
npm install
npm run dev`,
      },
      {
        id: "generate",
        title: "生成业务代码",
        content:
          "在项目根目录执行 pangza g：可单独生成 controller / service / mapper / entity，或 g all 一次生成四件套。\nMapper 从 @pangza/orm 导入；Service 从 @pangza/core 导入。\n别名：c|cotroller、s、m、e、a；覆盖已有文件加 --force。",
        functionalExample: `npx pangza g all user
# 产出
# src/entity/user.ts      → @pangza/orm 实体装饰器
# src/mapper/user.ts      → import { Mapper, MapperType } from "@pangza/orm"
# src/service/user.ts     → import { BaseService, Service } from "@pangza/core"
# src/controller/user/index.ts`,
      },
      {
        id: "install-manual",
        title: "手动安装（不用脚手架）",
        content:
          "按分包安装。tsconfig 需开启 experimentalDecorators、emitDecoratorMetadata；入口最上方 import \"reflect-metadata\"。module / moduleResolution 建议 Node16（配合 package exports）。",
        functionalExample: `npm i @pangza/core express reflect-metadata inversify
# 按需
npm i @pangza/orm mysql2
npm i @pangza/redis redis
npm i @pangza/auth
npm i @pangza/validate

# tsconfig.json
# "module": "Node16", "moduleResolution": "Node16",
# "experimentalDecorators": true,
# "emitDecoratorMetadata": true`,
      },
      {
        id: "bootstrap",
        title: "启动骨架",
        content:
          "入口 registry Logger / 中间件后 start。需要 Redis / 数据库时显式 Enable*；Auth 传 redis: Redis 也会启用 Redis 预热。",
        functionalExample: `import "reflect-metadata";
import cors from "cors";
import { json } from "express";
import { Application, Logger } from "@pangza/core";
import { EnableOrm } from "@pangza/orm";
import Redis, { EnableRedis } from "@pangza/redis";
import Auth from "@pangza/auth";
import Log from "@pangza/log";

Application
  .registry(Logger({ level: "info" }))
  .registry(cors())
  .registry(json())
  .registry(EnableOrm())
  .registry(EnableRedis())
  .registry(Auth({ redis: Redis, ignore: ["/api/pub/**"] }))
  .registry(Log())
  .scan("src")
  .start();`,
        decoratorExample: `import { Controller, GetMapping, AuthIgnore } from "@pangza/core";

@Controller("/api/hello")
export default class HelloController {
  @GetMapping("/")
  @AuthIgnore()
  ping() {
    return { ok: true };
  }
}`,
      },
      {
        id: "lifecycle",
        title: "启动与销毁钩子",
        content:
          "实现 ApplicationInit / ApplicationDestroy 的 Bean 会在 listen 成功后 / 进程退出前自动调用。\n连接预热仅在已 EnableRedis / EnableOrm（或 Auth 绑定 redis）时执行。",
        decoratorExample: `import {
  Component,
  type ApplicationInit,
  type ApplicationDestroy,
} from "@pangza/core";

@Component()
class AppWarmup implements ApplicationInit, ApplicationDestroy {
  async init() { /* 预热 */ }
  async destroy() { /* 释放 */ }
}`,
      },
    ],
  },
  architecture: {
    key: "architecture",
    title: "架构总览",
    description: "模块边界、请求管线与目录约定。",
    sections: [
      {
        id: "dirs",
        title: "目录约定",
        content:
          "用户项目建议：src/entity、mapper、service、controller；入口 src/main.ts。\n配置：项目根 application.yaml，可叠加 application-{profile}.yaml；业务可用 @Value / getConfigValue / @ConditionOnProperty 取值。",
      },
      {
        id: "imports",
        title: "导入边界（重要）",
        content:
          "Application / Service / Container / Logger / Json / Exception / config → @pangza/core\n@Mapper / MapperType / 实体装饰器 / EnableOrm / QueryWrapper → @pangza/orm\n@Validate / NotNull / … → @pangza/validate\nEnableRedis / Redis / RateLimiter → @pangza/redis\nAuth → @pangza/auth",
      },
      {
        id: "pipeline",
        title: "HTTP 请求管线",
        content:
          "非 flux/raw：applyRouteAuth → applyRouteGuards（限流/防重）→ 请求拦截器 → 参数注入 →（若安装 @pangza/validate 且方法标了 @Validate）校验 → 业务方法 → ObjectMapper.writeValue → 响应拦截器 →（默认）ResponseData.success → finally 异步写操作日志。\nflux/raw：不包装 ResponseData。",
      },
      {
        id: "ioc",
        title: "IoC 与生命周期",
        content:
          "IoC 实现位于 @pangza/core 的 Application 目录（原独立 Service 包已合并）。\nContainer 默认单例；@Controller / @Component / @Service / @Mapper / @ConditionOnProperty 会注册到容器。\nlisten 后按需预热连接并执行 ApplicationInit；SIGINT/SIGTERM 逆序 ApplicationDestroy。",
      },
    ],
  },
  examples: {
    key: "examples",
    title: "使用示例",
    description: "端到端示例：CRUD + 校验 + 限流。",
    sections: [
      {
        id: "crud",
        title: "典型 CRUD",
        content:
          "也可用脚手架：npx pangza g all user，再按业务改字段与权限。",
        decoratorExample: `import {
  Service, Resource, Controller, GetMapping,
  AuthCheckPermission, RequestQuery,
} from "@pangza/core";
import {
  TableName, TableId, TableField, Mapper, MapperType, QueryWrapper,
} from "@pangza/orm";
import { RateLimiter, RateLimiterType } from "@pangza/redis";

@TableName("sys_user")
class User {
  @TableId() id!: string;
  @TableField("user_name") username!: string;
}

@Mapper(User, { logicDelete: true })
class UserMapper extends MapperType<User> {}

@Service(UserMapper)
class UserService {
  async page(q: { keyword?: string; current?: number; size?: number }) {
    return this.selectPage(q, new QueryWrapper().like("user_name", q.keyword));
  }
}

@Controller("/api/user")
class UserController {
  @Resource(UserService) private userService!: UserService;

  @GetMapping("/list")
  @AuthCheckPermission(["sys:user:list"])
  @RateLimiter({ time: 2, count: 20, type: RateLimiterType.IP })
  list(@RequestQuery() q: { keyword?: string }) {
    return this.userService.page(q);
  }
}`,
        functionalExample: `import { table, QueryWrapper } from "@pangza/orm";
import { ResponseData, toPageResult } from "@pangza/core";

const mapper = table("sys_user", { entity: User, logicDelete: true });
const page = await mapper.selectPage(
  { current: 1, size: 10 },
  new QueryWrapper().eq("status", 1)
);
return ResponseData.success(toPageResult(page));`,
      },
      {
        id: "validate",
        title: "参数校验",
        decoratorExample: `import { Controller, PostMapping, RequestBody } from "@pangza/core";
import { Validate, NotNull, Email, Min } from "@pangza/validate";

class CreateUserDto {
  @NotNull("用户名不能为空")
  @Min(3)
  username!: string;

  @Email()
  email!: string;
}

@Controller("/api/user")
class UserController {
  @PostMapping("/")
  @Validate()
  create(@RequestBody() body: CreateUserDto) {
    return body;
  }
}`,
      },
      {
        id: "lock",
        title: "分布式锁",
        decoratorExample: `import { Redisson } from "@pangza/redis";

await Redisson.withLock("job:sync-order", async () => {
  await this.sync();
});`,
        functionalExample: `import { Redisson } from "@pangza/redis";

const lock = Redisson.getLock("order:pay");
await lock.lock();
try {
  await pay();
} finally {
  await lock.unlock();
}`,
      },
      {
        id: "condition",
        title: "@ConditionOnProperty 灌配置",
        content:
          "按 YAML 前缀把字段灌进类并注册到容器（不必再写 @Component）。字段无初始值时读 YAML；有初始值则保留。",
        decoratorExample: `import { ConditionOnProperty, Resource, Controller, GetMapping } from "@pangza/core";

@ConditionOnProperty("ai.model.agnes")
class AgnesModel {
  apiKey?: string;
  modelName!: string;
  baseURL!: string;
}

@Controller("/api/chat")
class ChatController {
  @Resource(AgnesModel) private agnes!: AgnesModel;

  @GetMapping("/models")
  models() {
    return [this.agnes];
  }
}`,
        functionalExample: `# application.yaml
ai:
  model:
    agnes:
      apiKey: sk-xxx
      modelName: agnes-3.0-flash
      baseURL: https://example.com/v1`,
      },
    ],
  },
};

/** @deprecated use getGuidePage(slug, locale) */
export const guidePages = guidePagesZh;

export function getGuidePage(
  slug: string,
  locale: Locale = "zh"
): DocPage | undefined {
  const map = locale === "en" ? guidePagesEn : guidePagesZh;
  return map[slug];
}
