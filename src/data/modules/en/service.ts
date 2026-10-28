import type { DocPage } from "../../../types/doc";

export const serviceApi: DocPage = {
  key: "Service-api",
  title: "Service · API",
  description:
    "IoC (source under @pangza/core Application): bind singletons by class; @Service can delegate Mapper CRUD; @Resource/@Inject for injection. Primary token is the class; string aliases are for schedule beanName, etc.\nNote: @Mapper / MapperType come from @pangza/orm, not this module.",
  sections: [
    {
      id: "overview",
      title: "Overview",
      content:
        "The former Service folder was merged into Application; still import Container / @Service / BaseService from @pangza/core.\nScanning @Component/@Service/@Controller (and orm @Mapper) calls bindClass. Default Singleton.\n@Service(Mapper) only delegates MAPPER_DELEGATE_METHODS; saveOrUpdate / updateBatch / physicalDelete* need custom code.",
    },
    {
      id: "container",
      title: "Container",
      apis: [
        {
          name: "Container.bindClass",
          signature: "bindClass(Ctor): void",
          description:
            "Bind a singleton by class; skip if already bound, or rebind by implementation.",
          params: [
            {
              name: "Ctor",
              type: "class",
              required: true,
              description: "Class to bind as a singleton.",
            },
          ],
        },
        {
          name: "Container.bindAlias",
          signature: "bindAlias(alias: string, Ctor): void",
          description:
            "String alias → class, for Schedule beanName / @Resource(\"name\").",
          params: [
            {
              name: "alias",
              type: "string",
              required: true,
              description: "String token (e.g. schedule beanName).",
            },
            {
              name: "Ctor",
              type: "class",
              required: true,
              description: "Target class already or to be bound.",
            },
          ],
        },
        {
          name: "Container.get / has",
          signature: "get<T>(token): T / has(token): boolean",
          description: "Resolve by class or alias; get throws if unbound.",
          params: [
            {
              name: "token",
              type: "class | string | symbol",
              required: true,
              description: "Class or alias to resolve / check.",
            },
          ],
        },
        {
          name: "Container.clear",
          description:
            "Clear the container and lifecycle scan lists; common in tests.",
        },
      ],
      decoratorExample: `@Component("sysLogCleanTask")
class SysLogCleanTask {
  async execute() {}
}`,
      functionalExample: `Container.bindClass(UserService);
const svc = Container.get(UserService);

Container.bindAlias("sysLogCleanTask", SysLogCleanTask);
const task = Container.get("sysLogCleanTask");
Container.has(UserService); // true
Container.clear();`,
    },
    {
      id: "decorators",
      title: "IoC decorators",
      apis: [
        {
          name: "@Component",
          signature: "@Component(alias?: string)",
          description:
            "Register in the container; optional alias; also runs @Bean factory methods on the class.",
          params: [
            {
              name: "alias",
              type: "string",
              description: "Used when looking up by name (e.g. scheduled tasks)",
            },
          ],
        },
        {
          name: "@Bean",
          signature: "@Bean(token?: BeanToken | { token })",
          description:
            "On a Component method: register the return value as a constant Bean. Rebinding the same Token overwrites.",
          params: [
            {
              name: "token",
              type: "BeanToken | { token }",
              required: false,
              description: "Bind id; defaults to method name when omitted.",
            },
          ],
        },
        {
          name: "@Resource",
          signature: "@Resource(Type | string | symbol)",
          description:
            "Lazy property injection: class Token or @Bean string/Symbol.",
          params: [
            {
              name: "type",
              type: "class | string | symbol",
              required: true,
              description: "Injection token: class singleton or @Bean alias.",
            },
          ],
        },
        {
          name: "@Inject",
          signature: "@Inject(Token)",
          description: "Constructor injection (Inversify).",
          params: [
            {
              name: "Token",
              type: "class | string | symbol",
              required: true,
              description: "Inversify constructor/property inject token.",
            },
          ],
        },
      ],
      decoratorExample: `@Component()
class InfraConfig {
  @Bean("uploadPath")
  uploadPath() {
    return UPLOAD_PATH;
  }
}

@Controller("/api/user")
class UserController {
  @Resource(UserService)
  private userService!: UserService;

  @Resource("uploadPath")
  private uploadPath!: string;
}`,
      functionalExample: `Container.bindClass(UserService);
// 等价于装饰器自动 bind
const path = Container.get("uploadPath");`,
    },
    {
      id: "mapper-service",
      title: "@Service and delegate list",
      apis: [
        {
          name: "@Service",
          signature: "@Service() | @Service(MapperClass)",
          description:
            "With no args: same as @Component() (bindClass only). With a Mapper from @pangza/orm: delegate CRUD onto the prototype then bindClass.",
          params: [
            {
              name: "MapperClass",
              type: "class",
              required: false,
              description: "Optional @Mapper class; omit for IoC-only registration.",
            },
          ],
        },
        {
          name: "MAPPER_DELEGATE_METHODS",
          description:
            "selectById / selectOne / selectList / selectCount / selectPage / insert / saveBatch / updateById / update / deleteById / deleteByIds / delete. Does not include saveOrUpdate, updateBatch, physicalDelete*.",
        },
        {
          name: "BaseService / IService",
          description:
            "Type helpers: IService describes delegated method signatures; BaseService is the default base. MapperType is in @pangza/orm.",
        },
        {
          name: "@Mapper / MapperType",
          description:
            'See the ORM module. import { Mapper, MapperType } from "@pangza/orm".',
        },
      ],
      decoratorExample: `import { Service, Resource, Controller, BaseService } from "@pangza/core";
import { Mapper, MapperType } from "@pangza/orm";

@Service()
class OrderAppService {}

@Mapper(User, { logicDelete: true })
class UserMapper extends MapperType<User> {}

@Service(UserMapper)
class UserService extends BaseService<User> {
  async create(dto: CreateUserDto) {
    return this.insert(dto);
  }
}

@Controller("/api/user")
class UserController {
  @Resource(UserService)
  private userService!: UserService;
}`,
      functionalExample: `import { Container } from "@pangza/core";
import { QueryWrapper } from "@pangza/orm";

Container.bindClass(UserService);
const svc = Container.get(UserService);
await svc.selectById("1");
await svc.selectPage({ current: 1, size: 10 }, new QueryWrapper());`,
    },
  ],
};

export const serviceConfig: DocPage = {
  key: "Service-config",
  title: "Service · Configuration",
  description: "No YAML; configure via decorators and the Container API.",
  sections: [
    {
      id: "notes",
      title: "Conventions",
      content:
        "Scope is fixed to Singleton. String aliases are optional; the primary identity is always the class.\nRebinding the same @Bean Token overwrites.\nTests can Container.clear() (also clears lifecycle scan lists).",
      configs: [
        {
          name: "defaultScope",
          type: "Singleton",
          default: "Singleton",
          description: "Default Inversify container scope",
        },
        {
          name: "alias",
          type: "string",
          description: "@Component(alias) / bindAlias, for Schedule beanName",
        },
        {
          name: "MAPPER_DELEGATE_METHODS",
          type: "readonly string[]",
          description: "Whitelist of methods auto-mixed by @Service; see API section",
        },
      ],
      functionalExample: `@Component("sysLogCleanTask")
class SysLogCleanTask {
  async execute() { /* ... */ }
  // 或 run()
}`,
    },
  ],
};
