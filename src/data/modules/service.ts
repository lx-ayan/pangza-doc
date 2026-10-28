import type { DocPage } from "../../types/doc";

export const serviceApi: DocPage = {
  key: "Service-api",
  title: "Service · API",
  description:
    "IoC（源码在 @pangza/core 的 Application 目录）：按类绑定单例，@Service 可委托 Mapper CRUD，@Resource/@Inject 注入。主 Token 是类本身；字符串别名仅用于定时任务 beanName 等。\n注意：@Mapper / MapperType 从 @pangza/orm 导入，不在本模块。",
  sections: [
    {
      id: "overview",
      title: "模块说明",
      content:
        "原独立 Service 文件夹已并入 Application；对外仍从 @pangza/core 导入 Container / @Service / BaseService 等。\n扫描加载 @Component/@Service/@Controller（以及 orm 的 @Mapper）时自动 bindClass。默认 Singleton。\n@Service(Mapper) 只委托 MAPPER_DELEGATE_METHODS；saveOrUpdate / updateBatch / physicalDelete* 等需自行封装。",
    },
    {
      id: "container",
      title: "Container",
      apis: [
        {
          name: "Container.bindClass",
          signature: "bindClass(Ctor): void",
          description: "按类绑定单例；已绑定则跳过或按实现 rebind。",
          params: [
            {
              name: "Ctor",
              type: "class",
              required: true,
              description: "要按类绑定为单例的构造器。",
            },
          ],
        },
        {
          name: "Container.bindAlias",
          signature: "bindAlias(alias: string, Ctor): void",
          description: "字符串别名 → 类，供 Schedule beanName / @Resource(\"name\")。",
          params: [
            {
              name: "alias",
              type: "string",
              required: true,
              description: "字符串别名（如定时任务 beanName）。",
            },
            {
              name: "Ctor",
              type: "class",
              required: true,
              description: "别名指向的类。",
            },
          ],
        },
        {
          name: "Container.get / has",
          signature: "get<T>(token): T / has(token): boolean",
          description: "按类或别名获取；未绑定 get 抛错。",
          params: [
            {
              name: "token",
              type: "class | string | symbol",
              required: true,
              description: "类或字符串/Symbol 别名。",
            },
          ],
        },
        {
          name: "Container.clear",
          description: "清空容器与生命周期扫描列表；测试常用。",
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
      title: "IoC 装饰器",
      apis: [
        {
          name: "@Component",
          signature: "@Component(alias?: string)",
          description: "注册到容器；可选别名；并执行类上 @Bean 工厂方法。",
          params: [
            {
              name: "alias",
              type: "string",
              description: "调度任务等按名查找时使用",
            },
          ],
        },
        {
          name: "@Bean",
          signature: "@Bean(token?: BeanToken | { token })",
          description:
            "标在 Component 方法上：返回值注册为常量 Bean。重复同 Token 会 rebind 覆盖。",
          params: [
            {
              name: "token",
              type: "BeanToken | { token }",
              required: false,
              description: "注册 Token；省略时常用方法名。",
            },
          ],
        },
        {
          name: "@Resource",
          signature: "@Resource(Type | string | symbol)",
          description: "属性懒注入：类 Token 或 @Bean 字符串/Symbol。",
          params: [
            {
              name: "type",
              type: "class | string | symbol",
              required: true,
              description: "注入 Token：类单例，或 @Bean 字符串/Symbol。",
            },
          ],
        },
        {
          name: "@Inject",
          signature: "@Inject(Token)",
          description: "构造器注入（Inversify）。",
          params: [
            {
              name: "Token",
              type: "class | string | symbol",
              required: true,
              description: "Inversify 构造器/属性注入 Token。",
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
      title: "@Service 与委托清单",
      apis: [
        {
          name: "@Service",
          signature: "@Service() | @Service(MapperClass)",
          description:
            "无参时与 @Component() 相同，仅 bindClass；传入 Mapper（来自 @pangza/orm）时委托 CRUD 到原型并 bindClass。",
          params: [
            {
              name: "MapperClass",
              type: "class",
              required: false,
              description: "可选。@Mapper 装饰的类；省略则只做 IoC 注册。",
            },
          ],
        },
        {
          name: "MAPPER_DELEGATE_METHODS",
          description:
            "selectById / selectOne / selectList / selectCount / selectPage / insert / saveBatch / updateById / update / deleteById / deleteByIds / delete。不含 saveOrUpdate、updateBatch、physicalDelete*。",
        },
        {
          name: "BaseService / IService",
          description:
            "类型辅助：IService 描述委托方法签名；BaseService 为默认基类。MapperType 在 @pangza/orm。",
        },
        {
          name: "@Mapper / MapperType",
          description:
            "见 ORM 模块。import { Mapper, MapperType } from \"@pangza/orm\"。",
        },
      ],
      decoratorExample: `import { Service, Resource, Controller, BaseService } from "@pangza/core";
import { Mapper, MapperType } from "@pangza/orm";

@Service()
class OrderAppService {
  // 无 Mapper：普通业务 Service，等同 @Component()
}

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
  title: "Service · 配置项",
  description: "无 YAML；通过装饰器与 Container API 配置。",
  sections: [
    {
      id: "notes",
      title: "约定",
      content:
        "作用域固定为单例。字符串别名仅可选，主标识始终是类。\n@Bean 重复绑定同一 Token 会 rebind 覆盖。\n测试可用 Container.clear() 清空（同时清空生命周期扫描列表）。",
      configs: [
        {
          name: "defaultScope",
          type: "Singleton",
          default: "Singleton",
          description: "Inversify 容器默认作用域",
        },
        {
          name: "alias",
          type: "string",
          description: "@Component(alias) / bindAlias，供 Schedule beanName 使用",
        },
        {
          name: "MAPPER_DELEGATE_METHODS",
          type: "readonly string[]",
          description: "@Service 自动混入的方法白名单，见 API 节",
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
