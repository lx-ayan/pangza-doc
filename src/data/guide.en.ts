import type { DocPage } from "../types/doc";

export const guidePagesEn: Record<string, DocPage> = {
  intro: {
    key: "intro",
    title: "Introduction",
    description:
      "Pangza is a decorator + IoC Node.js / Express framework. Core package is @pangza/core; install ORM / Redis / Auth / Validate as needed. Scaffold with the pangza CLI.",
    sections: [
      {
        id: "what",
        title: "What it solves",
        content:
          "Declare Controllers, Services, Mappers, auth, validation, logging and rate limits with unified decorators.\nDepend on @pangza/core and add @pangza/orm, @pangza/redis, @pangza/auth, @pangza/validate as needed; Application.scan loads business modules.\nMySQL / PostgreSQL / SQL Server, Redis (Redisson-style locks), schedules and audit logs.\nRedis / ORM warmup only after EnableRedis / EnableOrm (or Auth bound with redis).",
      },
      {
        id: "packages",
        title: "Packages",
        content:
          "@pangza/core: Application, HTTP decorators, @Value, Logger, Json, Exception, config, IoC (Container / @Component / @Resource / @Service / @Bean / BaseService).\n@pangza/orm: Db, EnableOrm, @Mapper, MapperType, entity decorators, QueryWrapper, XML Mapper.\n@pangza/validate: @Validate, @NotNull, @Min/@Max, @Email/@Phone, validateHandler.\n@pangza/redis / auth / log / schedule / encrypt: optional.\nCLI package name: pangza (pangza init / pangza g).",
      },
      {
        id: "scope",
        title: "Docs scope",
        content:
          "Each module page merges API and configuration.\nExamples import from the real package — do not pull ORM / Validate / Redis from @pangza/core.",
      },
      {
        id: "stack",
        title: "Tech stack",
        content:
          "Node.js + Express 5 + TypeScript (experimentalDecorators + emitDecoratorMetadata).\nIoC: Inversify. Drivers: mysql2 / pg / mssql. Cache: redis v6. Logging: pino.\nInstall @pangza/core + optional packages; scaffold with npx pangza.",
      },
    ],
  },
  quickstart: {
    key: "quickstart",
    title: "Quick Start",
    description:
      "Scaffold with pangza, pick modules, then generate CRUD with g.",
    sections: [
      {
        id: "scaffold",
        title: "Scaffold (recommended)",
        content:
          "pangza init creates an empty app; pick orm / auth / redis / log / schedule / encrypt / validate.\nSelected modules are written as @pangza/* dependencies (including @pangza/validate). orm / redis also write EnableOrm() / EnableRedis().\nNon-interactive: --modules and --db.",
        functionalExample: `npx pangza@latest init my-app
npx pangza@latest init my-app --modules=orm,auth,redis,validate --db=mysql

cd my-app
cp .env.example .env
npm install
npm run dev`,
      },
      {
        id: "generate",
        title: "Code generation",
        content:
          "pangza g emits controller / service / mapper / entity, or g all.\nMapper imports from @pangza/orm; Service from @pangza/core.",
        functionalExample: `npx pangza g all user
# mapper → import { Mapper, MapperType } from "@pangza/orm"
# service → import { BaseService, Service } from "@pangza/core"`,
      },
      {
        id: "install-manual",
        title: "Manual install",
        content:
          "Prefer package splits. Enable experimentalDecorators + emitDecoratorMetadata; import reflect-metadata first. Use module/moduleResolution Node16 for package exports.",
        functionalExample: `npm i @pangza/core express reflect-metadata inversify
npm i @pangza/orm mysql2
npm i @pangza/redis redis
npm i @pangza/auth
npm i @pangza/validate`,
      },
      {
        id: "bootstrap",
        title: "Bootstrap",
        content:
          "registry Logger / middleware then start. Explicit Enable* when Redis / DB are needed.",
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
        title: "Lifecycle hooks",
        content:
          "Beans implementing ApplicationInit / ApplicationDestroy run after listen / on process exit. Warmup only when EnableRedis / EnableOrm were registered.",
        decoratorExample: `import {
  Component,
  type ApplicationInit,
  type ApplicationDestroy,
} from "@pangza/core";

@Component()
class AppWarmup implements ApplicationInit, ApplicationDestroy {
  async init() {}
  async destroy() {}
}`,
      },
    ],
  },
  architecture: {
    key: "architecture",
    title: "Architecture",
    description: "Package boundaries, request pipeline, directories.",
    sections: [
      {
        id: "dirs",
        title: "Directories",
        content:
          "Suggested: src/entity, mapper, service, controller; entry src/main.ts.\nConfig: application.yaml (+ application-{profile}.yaml). Use @Value / getConfigValue / @ConditionOnProperty.",
      },
      {
        id: "imports",
        title: "Import boundaries",
        content:
          "Application / Service / Container / Logger / Json / Exception / config → @pangza/core\n@Mapper / MapperType / entity decorators / EnableOrm / QueryWrapper → @pangza/orm\n@Validate / NotNull / … → @pangza/validate\nEnableRedis / Redis / RateLimiter → @pangza/redis\nAuth → @pangza/auth",
      },
      {
        id: "pipeline",
        title: "HTTP pipeline",
        content:
          "Non flux/raw: auth → guards → request interceptors → param inject → @Validate (if @pangza/validate installed) → handler → ObjectMapper → response interceptors → ResponseData (default).\nflux/raw: no ResponseData wrap.",
      },
      {
        id: "ioc",
        title: "IoC & lifecycle",
        content:
          "IoC lives under @pangza/core Application (former Service folder merged in).\nContainer is singleton by default; @Controller / @Component / @Service / @Mapper / @ConditionOnProperty register beans.\nAfter listen: optional warmup + ApplicationInit; SIGINT/SIGTERM reverse ApplicationDestroy.",
      },
    ],
  },
  examples: {
    key: "examples",
    title: "Examples",
    description: "CRUD + validation + rate limit + locks.",
    sections: [
      {
        id: "crud",
        title: "Typical CRUD",
        content: "Or: npx pangza g all user",
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
  async page(q: { keyword?: string }) {
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
        title: "Validation",
        decoratorExample: `import { Controller, PostMapping, RequestBody } from "@pangza/core";
import { Validate, NotNull, Email, Min } from "@pangza/validate";

class CreateUserDto {
  @NotNull()
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
        title: "Distributed lock",
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
        title: "@ConditionOnProperty",
        content:
          "Binds YAML under a prefix onto the class and registers it in the container (no extra @Component needed).",
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
      },
    ],
  },
};
