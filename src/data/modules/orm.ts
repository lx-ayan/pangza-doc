import type { DocPage } from "../../types/doc";
import {
  DATA_SOURCE_CONFIG_FIELDS,
  HYDRATE_FIELD_SELECT_OPTIONS_FIELDS,
  MAPPER_TABLE_OPTIONS_FIELDS,
  META_OBJECT_HANDLER_FIELDS,
  PAGE_QUERY_FIELDS,
  RESOLVED_ORM_CONFIG_FIELDS,
  SELECT_QUERY_OPTIONS_FIELDS,
  objectParamWithFields,
  typeParams,
} from "../typeFields";

export const ormApi: DocPage = {
  key: "ORM-api",
  title: "ORM · API",
  description:
    "包 @pangza/orm：方法级 SQL 装饰器（@Select / @Insert / @Update / @Delete / @Param）；实体（@TableName / @TableId / @TableField）；@Mapper / MapperType、BaseMapper、QueryWrapper、事务、TableSearch、XML Mapper；支持 MySQL / PostgreSQL / SQL Server 多数据源。",
  sections: [
    {
      id: "overview",
      title: "模块说明",
      content:
        "整体链路：实体 @TableName/@TableId/@TableField → getEntityTableMeta → @Mapper / table() → BaseMapper 拼 SQL（逻辑删、乐观锁、填充、结果水合）。\n分页表单用 @TableSearch + getQueryWrapperAndPage 生成 QueryWrapper；定制 SQL 用方法级 @Select/@Insert/@Update/@Delete 或 XML Mapper。\n使用约定：QueryWrapper / TableSearch 的 column 写数据库列名（下划线）；实体属性可用驼峰，查询结果默认可下划线转驼峰。",
    },
    {
      id: "table-name",
      title: "@TableName",
      content:
        "源码 entityDecorators.ts。类装饰器，把表名贴在构造函数上。@Mapper(Entity) / getEntityTableMeta 依赖它；Entity 文件须先被加载（扫描 entity 或 import）。",
      apis: [
        {
          name: "@TableName",
          signature: "@TableName(tableName: string)",
          description: "表名不能为空字符串。",
          params: [
            {
              name: "tableName",
              type: "string",
              required: true,
              description: "数据库表名，如 sys_user",
            },
          ],
        },
        {
          name: "getTableName",
          signature: "getTableName(entity: Ctor): string | undefined",
          description: "读取类上表名元数据。",
          params: [
            {
              name: "entity",
              type: "Ctor",
              required: true,
              description: "实体类。",
            },
          ],
        },
      ],
      decoratorExample: `@TableName("sys_user")
export class User {}`,
      functionalExample: `import { getTableName } from "@pangza/orm";
console.log(getTableName(User)); // "sys_user"`,
    },
    {
      id: "table-id",
      title: "@TableId",
      content: "属性装饰器，标记主键。省略参数则列名=属性名。",
      apis: [
        {
          name: "@TableId",
          signature:
            "@TableId(value?: string | { value?: string; type?: IdType })",
          description: "写入 entityFields，id=true。",
          params: [
            {
              name: "value",
              type: "string",
              description: "主键列名；string 形式或 options.value",
            },
            {
              name: "type",
              type: "IdType",
              default: "NONE",
              description:
                "NONE 跟随全局 orm.idType；见「IdType 主键策略」",
            },
          ],
        },
        {
          name: "getEntityIdField",
          description: "读取实体主键字段元数据。",
        },
      ],
      decoratorExample: `@TableId()
id!: string;

@TableId("user_id")
id!: string;

@TableId({ value: "user_id", type: IdType.ASSIGN_ID })
id!: string;`,
      functionalExample: `import { getEntityIdField, getEntityTableMeta } from "@pangza/orm";
getEntityIdField(User);
getEntityTableMeta(User)?.idColumn; // "user_id"`,
    },
    {
      id: "table-field",
      title: "@TableField",
      content:
        "列映射与字段级填充。全局 YAML fill.* / MetaObjectHandler 见「自动填充」；字段 fill 只在值为 undefined 时写入，且写列名 key。",
      apis: [
        {
          name: "@TableField",
          signature: "@TableField(value?: string | TableFieldOptions)",
          description: "属性装饰器。",
          params: [
            {
              name: "value",
              type: "string",
              description: "数据库列名，默认属性名",
            },
            {
              name: "exist",
              type: "boolean",
              default: "true",
              description: "false：非表字段，不参与默认 INSERT/UPDATE",
            },
            {
              name: "insertFill",
              type: "any | () => any | Promise",
              description: "插入时该列仍为 undefined 则填充",
            },
            {
              name: "updateFill",
              type: "any | () => any | Promise",
              description: "更新时同上",
            },
          ],
        },
        {
          name: "getEntityFields / getEntityTableMeta / applyEntityFieldFills",
          description:
            "读字段 map；读整表元数据；按 insertFill/updateFill 应用到 row。",
        },
      ],
      decoratorExample: `@TableField("user_name")
username!: string;

@TableField({
  value: "create_time",
  insertFill: () => new Date(),
})
createTime?: Date;

@TableField({
  value: "update_time",
  updateFill: () => new Date(),
})
updateTime?: Date;

@TableField({ exist: false })
token?: string; // 不进 INSERT`,
      functionalExample: `import { applyEntityFieldFills, getEntityFields } from "@pangza/orm";
await applyEntityFieldFills(User, row, "insert");
getEntityFields(User);`,
    },
    {
      id: "id-type",
      title: "IdType 主键策略",
      apis: [
        {
          name: "IdType.ASSIGN_ID",
          description:
            "默认全局策略。插入前雪花 ID；实体 id 建议 string（number 易精度丢失）。insert 返回值可能为 0，以实体上回写为准。",
        },
        {
          name: "IdType.AUTO",
          description: "数据库自增；INSERT 不写 id，插入后回填。",
        },
        {
          name: "IdType.INPUT",
          description: "插入前自行赋值，框架不生成。",
        },
        {
          name: "IdType.ASSIGN_UUID",
          description: "去横线 UUID，适合 string 主键。",
        },
        {
          name: "IdType.NONE",
          description: "跟随全局 configureOrm / YAML orm.idType。",
        },
        {
          name: "setIdentifierGenerator",
          description: "自定义雪花等 ID 生成器；默认 defaultIdentifierGenerator。",
        },
      ],
      decoratorExample: `@TableId({ type: IdType.AUTO })
id!: number;

@TableId({ type: IdType.ASSIGN_UUID })
id!: string;`,
      functionalExample: `configureOrm({ idType: "ASSIGN_ID" });
setIdentifierGenerator({
  nextId: () => mySnowflake(),
});`,
    },
    {
      id: "sql-decorators-overview",
      title: "@Select / @Insert / @Update / @Delete 总览",
      content:
        "源码 sqlDecorators.ts。这四个装饰器会直接替换方法体：调用时解析 SQL、走 Db.queryOn，原来的空方法体不会执行。\n占位符：#{name} → 预编译 ? 绑定（推荐）；${name} → 字符串拼进 SQL（仅可信标识符，禁止用户输入）。\n第二参数 options 可指定 datasource（数据源名）或 db（按库类型找唯一源）；二者同时存在时以 datasource 为准。\n@Select 还可标在实体属性上（字段水合），见下文「@Select（属性级）」。",
      apis: [
        {
          name: "SqlExecuteOptions",
          signature: "{ datasource?: string; db?: DbType | string }",
          description:
            "@Select/@Insert/@Update/@Delete 共用的第二参数。datasource 默认 \"default\"；db 为 mysql/postgresql/sqlserver（及别名），同类型多个源时必须用 datasource。",
          params: [
            {
              name: "datasource",
              type: "string",
              default: '"default"',
              description: "Db.register 的数据源名",
            },
            {
              name: "db",
              type: "mysql | postgresql | sqlserver | 别名",
              description: "按已注册源的库类型查找；同类型多个时报错，需改用 datasource",
            },
          ],
        },
      ],
      decoratorExample: `@Mapper(User)
class UserMapper {
  @Select("SELECT * FROM sys_user WHERE user_name=#{u} LIMIT 1")
  findByUsername(@Param("u") u: string) {}

  @Insert(
    "INSERT INTO sys_user(user_name, password) VALUES(#{username}, #{password})"
  )
  addUser(
    @Param("username") username: string,
    @Param("password") password: string
  ) {}

  @Update("UPDATE sys_user SET status=#{status} WHERE id=#{id}")
  updateStatus(
    @Param("id") id: string,
    @Param("status") status: number
  ) {}

  @Delete("DELETE FROM sys_user WHERE id=#{id}")
  removeHard(@Param("id") id: string) {}
}`,
      functionalExample: `// 装饰器已换成执行器，直接调用即可
const rows = await mapper.findByUsername("admin");
const insertId = await mapper.addUser("zhang", "secret");
const n = await mapper.updateStatus("1", 1);
await mapper.removeHard("1");

// 等价思路（无装饰器时手写）
const ctx = { u: "admin" };
const { sql, params } = parseMybatisSql(
  "SELECT * FROM sys_user WHERE user_name=#{u} LIMIT 1",
  ctx
);
await Db.query(sql, params);`,
    },
    {
      id: "select-method",
      title: "@Select（方法级）",
      content:
        "标在 Mapper 方法上：执行查询 SQL，返回行数组（经 mapResultRows，可下划线转驼峰）。\n注意：方法级 @Select 默认不自动填充实体上的属性级 @Select（避免 N+1）；需要时手动 hydrateFieldSelects(Entity, rows)。",
      apis: [
        {
          name: "@Select",
          signature: '@Select(sql: string, options?: SelectOptions)',
          description:
            "方法装饰器。sql 不能为空。SelectOptions = FieldSelectOptions & SqlExecuteOptions（方法级主要用 datasource/db）。",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "SELECT 语句，可用 #{param} / ${param}",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "数据源名",
            },
            {
              name: "options.db",
              type: "string",
              description: "按库类型选源（同类型仅一个时）",
            },
          ],
          returns: "Promise<RowDataPacket[]>",
        },
      ],
      decoratorExample: `@Mapper(User)
class UserMapper {
  @Select("SELECT * FROM sys_user WHERE id = #{id}")
  findById(@Param("id") id: string) {}

  @Select(
    "SELECT * FROM sys_user WHERE user_name = #{username} AND status = #{status}"
  )
  findActive(
    @Param("username") username: string,
    @Param("status") status: number
  ) {}

  // PostgreSQL 数据源
  @Select('SELECT * FROM "user" WHERE id = #{id}', { db: "postgresql" })
  findOnPg(@Param("id") id: string) {}

  @Select("SELECT * FROM report_user WHERE id = #{id}", {
    datasource: "report",
  })
  findOnReport(@Param("id") id: string) {}
}`,
      functionalExample: `const rows = await mapper.findById("1");
const list = await mapper.findActive("admin", 1);

// 若还要填实体属性级 @Select：
await hydrateFieldSelects(User, rows);`,
    },
    {
      id: "insert-decorator",
      title: "@Insert",
      content:
        "物理插入。返回 insertId；PostgreSQL / SQL Server 建议在 SQL 中写 RETURNING / OUTPUT，框架会优先取第一行第一列。",
      apis: [
        {
          name: "@Insert",
          signature: '@Insert(sql: string, options?: SqlExecuteOptions)',
          description: "方法装饰器；sql 不能为空。",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "INSERT 语句",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "数据源名",
            },
            {
              name: "options.db",
              type: "string",
              description: "按库类型选源",
            },
          ],
          returns: "Promise<number>（insertId）",
        },
      ],
      decoratorExample: `@Mapper(User)
class UserMapper {
  @Insert(
    "INSERT INTO sys_user(user_name, password) VALUES(#{username}, #{password})"
  )
  addUser(
    @Param("username") username: string,
    @Param("password") password: string
  ) {}

  @Insert(
    \`INSERT INTO "user"(name) VALUES(#{name}) RETURNING id\`,
    { datasource: "postgresql" }
  )
  addOnPg(@Param("name") name: string) {}
}`,
      functionalExample: `const id = await mapper.addUser("zhang", "secret");
// id 为自增或 RETURNING 得到的数值；雪花主键场景请用 BaseMapper.insert`,
    },
    {
      id: "update-decorator",
      title: "@Update",
      content: "执行 UPDATE，返回 affectedRows（受影响行数）。",
      apis: [
        {
          name: "@Update",
          signature: '@Update(sql: string, options?: SqlExecuteOptions)',
          description: "方法装饰器；sql 不能为空。",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "UPDATE 语句",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "数据源名",
            },
            {
              name: "options.db",
              type: "string",
              description: "按库类型选源",
            },
          ],
          returns: "Promise<number>（affectedRows）",
        },
      ],
      decoratorExample: `@Mapper(User)
class UserMapper {
  @Update("UPDATE sys_user SET status=#{status} WHERE id=#{id}")
  updateStatus(
    @Param("id") id: string,
    @Param("status") status: number
  ) {}

  @Update(
    "UPDATE sys_user SET user_name=#{username} WHERE id=#{id}",
    { datasource: "default" }
  )
  rename(
    @Param("id") id: string,
    @Param("username") username: string
  ) {}
}`,
      functionalExample: `const n = await mapper.updateStatus("1", 0);
// n === 受影响行数`,
    },
    {
      id: "delete-decorator",
      title: "@Delete",
      content:
        "物理 DELETE，返回 affectedRows。逻辑删除请用 BaseMapper 的 delete / deleteById / deleteByIds，不要用本装饰器。",
      apis: [
        {
          name: "@Delete",
          signature: '@Delete(sql: string, options?: SqlExecuteOptions)',
          description: "方法装饰器；sql 不能为空。始终执行 DELETE 语句。",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "DELETE 语句",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "数据源名",
            },
            {
              name: "options.db",
              type: "string",
              description: "按库类型选源",
            },
          ],
          returns: "Promise<number>（affectedRows）",
        },
      ],
      decoratorExample: `@Mapper(User)
class UserMapper {
  @Delete("DELETE FROM sys_user WHERE id=#{id}")
  removeHard(@Param("id") id: string) {}

  @Delete("DELETE FROM sys_user WHERE status=#{status}", { db: "mysql" })
  removeByStatus(@Param("status") status: number) {}
}`,
      functionalExample: `await mapper.removeHard("1");
// 逻辑删：
await mapper.deleteById("1"); // BaseMapper，见「BaseMapper」节`,
    },
    {
      id: "param-decorator",
      title: "@Param 与 #{} / ${}",
      content:
        "@Param 把方法形参下标映射成名字，供 SQL 模板引用。未使用 @Param 时无法用 #{name} 按名取值。",
      apis: [
        {
          name: "@Param",
          signature: '@Param(name: string)',
          description: "参数装饰器；name 不能为空。写入元数据 pangza.orm.sqlParamNames。",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "SQL 中 #{name} / ${name} 使用的名字",
            },
          ],
        },
        {
          name: "#{name}",
          description: "预编译绑定为 ?（或方言占位符），防注入，优先使用。",
        },
        {
          name: "${name}",
          description:
            "字符串替换进 SQL。仅可信标识符（表名/列名等）；含 ; -- 引号等会被拒绝或告警。用户输入禁止。",
        },
        {
          name: "parseMybatisSql / buildParamContext",
          description: "底层：按命名参数解析模板；把 args + @Param 映射建成上下文对象。",
        },
      ],
      decoratorExample: `@Select("SELECT * FROM sys_user WHERE user_name=#{username} AND status=#{status}")
findActive(
  @Param("username") username: string,
  @Param("status") status: number
) {}

// 仅表名等可信场景可用 \${}
@Select("SELECT * FROM \${table} WHERE id=#{id}")
findOnTable(
  @Param("table") table: string,
  @Param("id") id: string
) {}`,
      functionalExample: `import { parseMybatisSql, buildParamContext } from "@pangza/orm";

const ctx = buildParamContext(["admin", 1], { 0: "username", 1: "status" });
// { username: "admin", status: 1 }
const { sql, params } = parseMybatisSql(
  "SELECT * FROM sys_user WHERE user_name=#{username} AND status=#{status}",
  ctx
);
await Db.query(sql, params);`,
    },
    {
      id: "field-select",
      title: "@Select（属性级）与水合",
      content:
        "同一个 Select 函数：有 descriptor.value（方法）→ 方法装饰器；否则 → 属性装饰器（registerFieldSelect）。\n属性级：把「再查一次」的结果填进实体字段（association / collection）。BaseMapper.selectList/selectPage 在绑定 entity 时自动 hydrateFieldSelects。",
      apis: [
        {
          name: "@Select（属性）",
          signature: "@Select(sql, options?: FieldSelectOptions & SqlExecuteOptions)",
          description: "标在实体属性上；与 @ManyToOne 等不能用于同一属性。",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "子查询 SQL，可用父行字段 #{id} 等",
            },
            {
              name: "many",
              type: "boolean",
              default: "false",
              description: "true → 数组；false → 单行/单值",
            },
            {
              name: "column",
              type: "string",
              description: "只取该列；配合 many 得标量数组",
            },
            {
              name: "depth",
              type: "number",
              default: "0",
              description: "嵌套行是否继续 hydrate；树可设 1+",
            },
            {
              name: "eager",
              type: "boolean",
              default: "true",
              description:
                "是否在 selectList 等结果上自动填充。列=#{父字段} 可合并 IN；子查询/LIMIT 仍逐行。树形全量建议 false",
            },
            {
              name: "datasource / db",
              type: "string",
              description: "子查询使用的数据源",
            },
          ],
        },
        {
          name: "hydrateFieldSelects",
          signature: "hydrateFieldSelects(Entity, rows, options?)",
          description: "手动对行数组执行字段级 @Select 水合。",
          params: [
            {
              name: "Entity",
              type: "Ctor",
              required: true,
              description: "带属性级 @Select 的实体类。",
            },
            {
              name: "rows",
              type: "object | object[]",
              required: true,
              description: "要水合的行或行数组。",
            },
            {
              name: "options",
              type: "HydrateFieldSelectOptions",
              required: false,
              description: "水合选项；字段见下方 options.*。",
            },
            ...typeParams(HYDRATE_FIELD_SELECT_OPTIONS_FIELDS, "zh", "options"),
          ],
        },
        {
          name: "buildRowParamContext",
          description:
            "为父行构建 #{id} 上下文，同时提供 camel / snake 键，保证占位符能取到值。",
        },
        {
          name: "registerFieldSelect / getFieldSelects / getFieldSelect",
          description: "注册与读取属性级 @Select 元数据。",
        },
      ],
      decoratorExample: `@TableName("sys_menu")
class Menu {
  @TableId()
  id!: string;

  // collection：一对多
  @Select("SELECT * FROM sys_menu WHERE parent_id = #{id}", { many: true })
  children?: Menu[];

  // association / 标量列
  @Select(
    \`SELECT name FROM sys_role WHERE id = (
       SELECT role_id FROM sys_menu_role WHERE menu_id = #{id} LIMIT 1
     )\`,
    { column: "name" }
  )
  roleName?: string;
}`,
      functionalExample: `const rows = await Db.query("SELECT * FROM sys_menu WHERE parent_id = ?", [0]);
await hydrateFieldSelects(Menu, rows);
// 或 BaseMapper.selectList 在 entity 绑定时自动水合`,
    },
    {
      id: "relations",
      title: "关联 @ManyToOne / @OneToMany / @ManyToMany",
      content:
        "源码 relation.ts + hydrate.ts。与同一属性上的字段 @Select 互斥。写入默认不级联（无自动 sync/saveWith）。\nfetch 当前仅实现 SELECT（二次查询）；传 JOIN 尚不可用，请勿依赖。",
      apis: [
        {
          name: "@ManyToOne",
          signature: "@ManyToOne(() => Target, { foreignKey, ... })",
          description: "多对一；默认 eager=true。",
          params: [
            {
              name: "foreignKey",
              type: "string",
              required: true,
              description: "本表外键列名",
            },
            {
              name: "targetKey",
              type: "string",
              default: "id",
              description: "目标表主键列",
            },
            {
              name: "eager",
              type: "boolean",
              default: "true",
              description: "selectList/Page 是否自动填充",
            },
            {
              name: "fetch",
              type: '"SELECT" | "JOIN"',
              default: "SELECT",
              description: "目前仅 SELECT 生效；JOIN 为预留",
            },
            {
              name: "depth",
              type: "number",
              default: "0",
              description: "嵌套关联递归层数",
            },
            {
              name: "datasource / db",
              type: "string",
              description: "关联查询数据源",
            },
          ],
        },
        {
          name: "@OneToMany",
          signature: "@OneToMany(() => Target, { foreignKey, ... })",
          description: "一对多；默认 eager=false（lazy）。",
          params: [
            {
              name: "foreignKey",
              type: "string",
              required: true,
              description: "对方表指向本表的外键列",
            },
            {
              name: "localKey",
              type: "string",
              description: "本表被引用列，默认本表主键",
            },
            {
              name: "eager / fetch / depth / datasource",
              type: "…",
              default: "eager=false",
              description: "同 ManyToOne；默认不自动填",
            },
          ],
        },
        {
          name: "@ManyToMany",
          signature:
            "@ManyToMany(() => Target, { joinTable, joinColumn, inverseJoinColumn })",
          description: "多对多，经中间表；默认 lazy。",
          params: [
            {
              name: "joinTable",
              type: "string",
              required: true,
              description: "中间表名",
            },
            {
              name: "joinColumn",
              type: "string",
              required: true,
              description: "中间表指向本表的列",
            },
            {
              name: "inverseJoinColumn",
              type: "string",
              required: true,
              description: "中间表指向目标表的列",
            },
            {
              name: "targetKey / localKey / eager / depth",
              type: "…",
              default: "eager=false",
              description: "目标主键、本表键、是否自动填、递归深度",
            },
          ],
        },
        {
          name: "hydrateRelations / getRelations / getRelation / relationToFieldSelect",
          description: "手动水合；读取关联元数据；关联可转成字段 Select 描述。",
        },
        {
          name: "SelectQueryOptions.relations",
          description:
            "省略：仅 eager；false：不填充；string[]：只填列出的属性（含 lazy）。",
        },
      ],
      decoratorExample: `@TableName("sys_user")
class User {
  @TableId() id!: string;

  @ManyToOne(() => Role, { foreignKey: "role_id" })
  role?: Role;

  @OneToMany(() => Order, { foreignKey: "user_id" })
  orders?: Order[];
}`,
      functionalExample: `await mapper.selectList(); // 仅 eager
await mapper.selectList(w, { relations: ["orders"] });
await mapper.selectList(w, { relations: false });
await hydrateRelations(User, rows, { relations: ["orders"] });`,
    },
    {
      id: "mapper",
      title: "@Mapper / table / BaseMapper",
      content:
        "table(tableName, options) 按 options 缓存 BaseMapper。@Mapper / MapperType 从本包 @pangza/orm 导出：混入 CRUD 并 bindClass；传 Entity 时读 @TableName。\nuseTable(name) 取已缓存实例。@Service(Mapper) 在 @pangza/core，只委托部分方法，见 Service 文档。",
      apis: [
        {
          name: "@Mapper",
          signature: "@Mapper(tableOrEntity, idFieldOrOptions?)",
          description:
            "类装饰器。第一参为表名字符串或实体类；第二参可为 id 字段名字符串，或 MapperTableOptions。",
          params: [
            {
              name: "tableOrEntity",
              type: "string | Function",
              required: true,
              description: "表名或带 @TableName 的实体",
            },
            {
              name: "options",
              type: "MapperTableOptions | string",
              description: "表级覆盖；或简写 idField 字符串",
            },
          ],
        },
        {
          name: "table / useTable / clearTableCache",
          signature: "table(name, MapperTableOptions?)",
          description:
            "函数式创建 Mapper；useTable 取缓存；configureOrm 会 clearTableCache。",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "表名（table）。",
            },
            {
              name: "options",
              type: "MapperTableOptions",
              required: false,
              description: "表级覆盖选项；字段见下方 options.*。",
            },
            ...typeParams(MAPPER_TABLE_OPTIONS_FIELDS, "zh", "options"),
          ],
        },
        {
          name: "selectById",
          signature: "selectById(id, options?: SelectQueryOptions)",
          description: "按主键查一行；可带关联填充选项。SelectQueryOptions 字段见下。",
          params: [
            {
              name: "id",
              type: "unknown",
              required: true,
              description: "主键。",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "查询选项；字段见下方 options.*。",
            },
            ...typeParams(SELECT_QUERY_OPTIONS_FIELDS, "zh", "options"),
          ],
        },
        {
          name: "selectOne",
          signature: "selectOne(wrapper?, options?)",
          description: "条件查单行；多行时取第一行。",
          params: [
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "条件构造器。",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "查询选项。",
            },
          ],
        },
        {
          name: "selectList",
          signature: "selectList(wrapper?, options?)",
          description: "列表；绑定 entity 时自动字段水合 / eager 关联。",
          params: [
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "条件构造器。",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "查询选项。",
            },
          ],
        },
        {
          name: "selectCount",
          signature: "selectCount(wrapper?)",
          description: "计数；默认带逻辑删除条件。",
          returns: "Promise<number>",
          params: [
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "条件构造器。",
            },
          ],
        },
        {
          name: "selectPage",
          signature: "selectPage(page, wrapper?, options?)",
          description:
            "分页：{ current, size } → IPage { records, total, current, size }。page / options 字段见下。",
          returns: "Promise<IPage<T>>",
          params: [
            {
              name: "page",
              type: "PageQuery",
              required: true,
              description: "分页请求；字段见下方 page.*。",
            },
            ...typeParams(PAGE_QUERY_FIELDS, "zh", "page"),
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "条件构造器。",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "查询选项；字段见下方 options.*。",
            },
            ...typeParams(SELECT_QUERY_OPTIONS_FIELDS, "zh", "options"),
          ],
        },
        {
          name: "insert",
          signature: "insert(entity)",
          description:
            "插入；走 IdType、insertFill、MetaObjectHandler。返回值不一定是业务 id。",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "要插入的实体/行对象。",
            },
          ],
        },
        {
          name: "saveBatch",
          signature: "saveBatch(entities)",
          description: "批量插入，按 orm.batch.insertSize（默认 200）分批。",
          params: [
            {
              name: "entities",
              type: "object[]",
              required: true,
              description: "批量插入的行数组。",
            },
          ],
        },
        {
          name: "saveOrUpdate",
          signature: "saveOrUpdate(entity)",
          description: "有主键且库中存在 → updateById，否则 insert。",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "按是否有主键决定插入或更新。",
            },
          ],
        },
        {
          name: "updateById",
          signature: "updateById(entity)",
          description:
            "按主键更新；undefined 字段不写；null 受 updateNullStrategy；可走乐观锁。",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "含主键及要更新字段的实体。",
            },
          ],
        },
        {
          name: "update",
          signature: "update(entity, wrapper)",
          description: "按条件更新；wrapper 禁止空 WHERE（防全表更新）。",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "要 SET 的字段对象。",
            },
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: true,
              description: "WHERE 条件。",
            },
          ],
        },
        {
          name: "updateBatch",
          signature: "updateBatch(entities)",
          description: "批量按主键更新，按 batch.updateSize 分批。",
          params: [
            {
              name: "entities",
              type: "object[]",
              required: true,
              description: "按主键批量更新的行数组。",
            },
          ],
        },
        {
          name: "deleteById / deleteByIds / delete",
          description:
            "开启逻辑删除时 → UPDATE 置删；否则物理 DELETE。空条件禁止全表删。",
        },
        {
          name: "physicalDeleteById / physicalDeleteByIds / physicalDelete",
          description: "始终 DELETE，忽略逻辑删除开关。",
        },
      ],
      decoratorExample: `@Mapper(User, { logicDelete: true, optimisticLock: true })
export default class UserMapper {
  @Select("SELECT * FROM sys_user WHERE user_name=#{u} LIMIT 1")
  findByUsername(@Param("u") u: string) {}
}

@Service(UserMapper)
export default class UserService {
  async page(req: PageRequest) {
    const { queryWrapper, page } = getQueryWrapperAndPage(
      req.form ?? {},
      UserPageDTO,
      req.pageNum ?? 1,
      req.pageSize ?? 10,
      (w) => w.orderByDesc("create_time")
    );
    return this.selectPage(page, queryWrapper);
  }
}`,
      functionalExample: `configureOrm({ sqlLog: true, logicDelete: true });

const mapper = table("sys_user", {
  entity: User,
  logicDelete: true,
  updateNullStrategy: "IGNORE",
});

const page = await mapper.selectPage(
  { current: 1, size: 10 },
  new QueryWrapper().eq("status", 1).orderByDesc("id")
);

await mapper.saveBatch([{ username: "a" }, { username: "b" }]);
await mapper.updateBatch([{ id: "1", username: "x" }]);
await mapper.physicalDeleteById("1");`,
    },
    {
      id: "query-wrapper",
      title: "QueryWrapper",
      content:
        "条件构造器；列名白名单校验，值一律参数绑定。禁止链式 Join DSL。大 IN 按 batchInSize 分片。空 in([]) → 1=0；空 notIn([]) → 1=1。",
      apis: [
        {
          name: "构造",
          signature: "new QueryWrapper(options?) | QueryWrapper.forDatasource(name)",
          description:
            "可传 dialect / DbType；forDatasource 按已注册源取方言（PG 引号等）。nested() 继承外层方言。",
          params: [
            {
              name: "options | name",
              type: "object | string",
              required: false,
              description: "QueryWrapper 选项，或 forDatasource 的数据源名。",
            },
          ],
        },
        {
          name: "ignoreLogicDelete",
          description: "本条查询忽略逻辑删除条件（回收站等）。",
        },
        {
          name: "select / eq / ne / gt / ge / lt / le",
          description: "列投影与比较；eqOrIsNull 在 value 为 null 时写 IS NULL。",
        },
        {
          name: "like / likeLeft / likeRight / notLike",
          description: "模糊匹配；方言 LIKE ESCAPE 处理特殊字符。",
        },
        {
          name: "in / notIn / between / notBetween",
          description: "集合与区间；大 IN 自动分片。",
        },
        {
          name: "isNull / isNotNull",
          description: "空值判断。",
        },
        {
          name: "exists / notExists / apply / nested",
          description:
            "子查询与原始片段；nested(fn) 生成括号组；or()/and() 切换下一条件连接。",
        },
        {
          name: "groupBy / having / orderByAsc / orderByDesc / last",
          description:
            "分组、HAVING、排序；last 追加安全尾片段（禁止危险 SQL）。",
        },
        {
          name: "clone / build",
          description: "clone 避免 Mapper 追加逻辑删改到调用方；build 得 SqlFragment。",
        },
      ],
      decoratorExample: `// 通常与 Mapper / Service 一起用，无独立装饰器`,
      functionalExample: `const w = new QueryWrapper()
  .select("id", "user_name", "status")
  .eq("status", 1)
  .like("user_name", "adm")
  .nested((n) => {
    n.eq("dept_id", 1).or().eq("dept_id", 2);
  })
  .groupBy("status")
  .having("COUNT(*) > ?", [1])
  .orderByDesc("create_time")
  .last("LIMIT 100");

// PostgreSQL 方言
QueryWrapper.forDatasource("postgresql").eq("status", 1);

// 查含已删除
new QueryWrapper().ignoreLogicDelete().eq("id", "1");`,
    },
    {
      id: "table-search",
      title: "@TableSearch / getQueryWrapperAndPage",
      content:
        "分页/列表查询条件：JSON form 是 plain object，必须传 DTO 类读 @TableSearch 元数据。空值（null / undefined / '' / []）跳过条件。",
      apis: [
        {
          name: "@TableSearch",
          signature: "@TableSearch(options? | OperType)",
          description:
            "挂在 Page DTO 字段；默认 operator=EQ；column 空则属性名 camel→snake。",
          params: [
            {
              name: "column",
              type: "string",
              description: "数据库列名",
            },
            {
              name: "operator",
              type: "OperType",
              default: "EQ",
              description: "见 OperTypeEnum",
            },
          ],
        },
        {
          name: "OperTypeEnum",
          description:
            "EQ、LIKE、LIKE_LEFT、LIKE_RIGHT、NOT_LIKE、GT、GE、LT、LE、NE、IN、NOT_IN、BETWEEN、NOT_BETWEEN、IS_NULL、IS_NOT_NULL。BETWEEN 表单值一般为 [start, end]；IN 为数组。",
        },
        {
          name: "getTableSearchMeta",
          description: "读取 DTO 上 @TableSearch 元数据。",
        },
        {
          name: "getQueryWrapper",
          signature: "getQueryWrapper(form, DtoClass, consumer?)",
          description: "仅生成 QueryWrapper，可 consumer 追加 select/order。",
          params: [
            {
              name: "form",
              type: "object",
              required: true,
              description: "查询表单 plain object（需传 DTO 类读元数据）。",
            },
            {
              name: "DtoClass",
              type: "Ctor",
              required: true,
              description: "带 @TableSearch 的 DTO 类。",
            },
            {
              name: "consumer",
              type: "(qw) => void",
              required: false,
              description: "可选：继续改写 QueryWrapper。",
            },
          ],
        },
        {
          name: "getQueryWrapperAndPage",
          signature:
            "getQueryWrapperAndPage(form, Dto, pageNum?, pageSize?, consumer?)",
          description:
            "返回 { queryWrapper, page: { current, size } }，直接交给 selectPage。重载支持省略 page 只传 consumer。",
          returns: "QueryWrapperAndPage",
          params: [
            {
              name: "form",
              type: "object",
              required: true,
              description: "查询表单 plain object。",
            },
            {
              name: "DtoClass",
              type: "Ctor",
              required: true,
              description: "带 @TableSearch 的 DTO 类。",
            },
            {
              name: "pageNum",
              type: "number",
              required: false,
              description: "页码。",
            },
            {
              name: "pageSize",
              type: "number",
              required: false,
              description: "每页条数。",
            },
            {
              name: "consumer",
              type: "(qw) => void",
              required: false,
              description: "可选：继续改写 QueryWrapper。",
            },
          ],
        },
      ],
      decoratorExample: `import { TableSearch, OperTypeEnum } from "@pangza/orm";

export class UserPageDTO {
  @TableSearch({ operator: OperTypeEnum.LIKE })
  username?: string;

  @TableSearch({ operator: OperTypeEnum.LIKE })
  nickName?: string; // → nick_name

  @TableSearch({ column: "name_zh", operator: OperTypeEnum.LIKE })
  name?: string;

  @TableSearch({ operator: OperTypeEnum.IN })
  statusList?: number[];

  @TableSearch({ operator: OperTypeEnum.BETWEEN })
  createTime?: [string, string];
}`,
      functionalExample: `const { queryWrapper, page } = getQueryWrapperAndPage(
  pageRequest?.form ?? {},
  UserPageDTO,
  pageRequest?.pageNum ?? 1,
  pageRequest?.pageSize ?? 10,
  (w) => {
    w.select("id", "username", "nick_name").orderByDesc("create_time");
  }
);
const result = await this.selectPage(page, queryWrapper);`,
    },
    {
      id: "transaction",
      title: "@Transactional",
      content:
        "可标在**方法**或**类**上：标在类上时会包装原型上所有方法（除 constructor）。\n同数据源：REQUIRED（默认）加入外层或新建；REQUIRES_NEW 挂起外层开新事务。跨数据源无分布式事务。抛错回滚。",
      apis: [
        {
          name: "@Transactional",
          signature:
            "@Transactional(options?: { datasource?: string; propagation?: TransactionPropagation })",
          description:
            "事务内同数据源的 Db.queryOn / BaseMapper / 方法级 SQL 装饰器走同一连接。",
          params: [
            {
              name: "datasource",
              type: "string",
              default: '"default"',
              description: "数据源名",
            },
            {
              name: "propagation",
              type: '"REQUIRED" | "REQUIRES_NEW"',
              default: "REQUIRED",
              description: "传播行为",
            },
          ],
        },
        {
          name: "Db.transaction / Db.transactionOn",
          signature:
            "Db.transaction(fn) / Db.transactionOn(name, fn, { propagation? })",
          description: "函数式事务；与装饰器共用连接绑定。",
          params: [
            {
              name: "fn | name",
              type: "function | string",
              required: true,
              description: "transaction(fn) 或 transactionOn 的数据源名。",
            },
            {
              name: "fn",
              type: "() => Promise<T>",
              required: false,
              description: "transactionOn：事务内回调。",
            },
            {
              name: "propagation",
              type: "REQUIRED | REQUIRES_NEW",
              required: false,
              description: "transactionOn 第三参 { propagation }。",
            },
          ],
        },
      ],
      decoratorExample: `@Service(UserMapper)
class UserService {
  @Transactional()
  async create(dto: CreateUserDto) {
    await this.insert(dto);
    await this.other.insert(log);
  }

  @Transactional({ propagation: "REQUIRES_NEW", datasource: "postgresql" })
  async auditLog(row: AuditRow) {
    return this.insert(row);
  }
}

// 类级：该类每个方法都包事务
@Transactional({ datasource: "default" })
@Service(OrderMapper)
class OrderService {}`,
      functionalExample: `await Db.transaction(async () => {
  await mapper.insert(row);
  await otherMapper.updateById(patch);
});

await Db.transactionOn("postgresql", async () => {
  await pgMapper.insert(row);
}, { propagation: "REQUIRES_NEW" });`,
    },
    {
      id: "auto-fill",
      title: "自动填充（fill / MetaObjectHandler）",
      content:
        "插入/更新前两层填充：① 全局 YAML orm.fill.*（列名）在值为 undefined 时写入 create_time/update_time/create_by/update_by（操作人取 AuthUtil.getLoginIdDefaultNull）；② setMetaObjectHandler 在默认填充之后执行。\n另可用 @TableField insertFill/updateFill。表级 MapperOptions.fill=false 可关闭默认填充。",
      apis: [
        {
          name: "applyInsertFill / applyUpdateFill",
          description: "BaseMapper 内部调用；业务一般无需直接调。",
        },
        {
          name: "setMetaObjectHandler / getMetaObjectHandler",
          signature: "setMetaObjectHandler({ insert?, update? })",
          description: "自定义拦截；在默认 fill 之后。",
          params: [
            {
              name: "handler",
              type: "{ insert?, update? }",
              required: true,
              description: "默认 YAML 填充之后的自定义钩子（setMetaObjectHandler）。",
            },
          ],
        },
      ],
      decoratorExample: `@TableField({ value: "create_time", insertFill: () => new Date() })
createTime?: Date;`,
      functionalExample: `configureOrm({
  fillCreateTime: "create_time",
  fillUpdateTime: "update_time",
  fillCreateBy: "create_by",
  fillUpdateBy: "update_by",
});

setMetaObjectHandler({
  insert(entity) {
    entity.tenant_id = currentTenant();
  },
  update(entity) {
    entity.update_by = currentUserId();
  },
});`,
    },
    {
      id: "optimistic-lock",
      title: "乐观锁",
      content:
        "全局 orm.optimisticLock 或表级 @Mapper({ optimisticLock: true })。更新时 WHERE 带 version 条件，成功则 version+1；影响行数为 0 时抛 OptimisticLockError。\n版本列名默认 version（versionField 可改）。",
      apis: [
        {
          name: "optimisticLock / versionField",
          description: "开关与列名；表级可覆盖全局。",
        },
        {
          name: "OptimisticLockError",
          description: "版本冲突；Exception 模块有内置映射。",
        },
      ],
      decoratorExample: `@Mapper(User, { optimisticLock: true, versionField: "version" })
class UserMapper {}

// 实体需有 version 字段（列）
@TableField("version")
version?: number;`,
      functionalExample: `configureOrm({ optimisticLock: true, versionField: "version" });
try {
  await mapper.updateById({ id: "1", username: "x", version: 3 });
} catch (e) {
  // e instanceof OptimisticLockError
}`,
    },
    {
      id: "db",
      title: "Db / DataSource",
      content:
        "多数据源门面；不在 import 时连库，首次 query 才 connect。YAML host 非空时自动注册 postgresql / sqlserver 命名源。",
      apis: [
        {
          name: "Db.register",
          signature: "Db.register(name, config) | Db.register(config)",
          description:
            "注册或覆盖数据源。单参时 config.name 作注册名。下表展开 DataSourceConfig。",
          params: [
            {
              name: "name",
              type: "string",
              required: false,
              description: "双参形式时的数据源名；单参形式可省略，用 config.name。",
            },
            {
              name: "config",
              type: "DataSourceConfig",
              required: true,
              description: "连接配置；字段见下方 config.*。",
            },
            ...typeParams(DATA_SOURCE_CONFIG_FIELDS, "zh", "config"),
          ],
        },
        {
          name: "Db.ensureDefault",
          description: "确保 default 来自 datasource.default，并按需注册 PG/MSSQL。",
        },
        {
          name: "Db.query / Db.queryOn",
          signature: "Db.query(sql, params?) / Db.queryOn(name, sql, params?)",
          description: "执行 SQL；事务内走当前连接。",
          params: [
            {
              name: "sql | name",
              type: "string",
              required: true,
              description: "SQL，或 queryOn 的数据源名。",
            },
            {
              name: "sql | params",
              type: "string | unknown[]",
              required: false,
              description: "queryOn 的 SQL，或 query 的参数数组。",
            },
            {
              name: "params",
              type: "unknown[]",
              required: false,
              description: "queryOn 的绑定参数。",
            },
          ],
        },
        {
          name: "Db.getDialect",
          description: "取数据源方言（引号、LIMIT 等）。",
        },
        {
          name: "DataSourceConfig.type",
          description:
            "规范名 mysql / postgresql / sqlserver；别名 mariadb、postgres/pg、mssql 等可识别。",
        },
      ],
      decoratorExample: `@Mapper(User, { datasource: "postgresql" })
class UserMapper {}

@Select("SELECT 1", { datasource: "report" })
ping() {}`,
      functionalExample: `Db.register("pg", {
  type: "postgresql",
  host: "127.0.0.1",
  database: "app",
  user: "postgres",
  password: "x",
});
await Db.queryOn("pg", 'SELECT * FROM "user" WHERE id = ?', [1]);
await Db.query("SELECT 1");`,
    },
    {
      id: "xml",
      title: "XML Mapper 入口",
      content:
        "YAML orm.mapperLocations 扫描；模块加载时 bootstrapXmlMappers；mapperReload 可热加载。statement 支持 resultType、datasource 属性。",
      apis: [
        {
          name: "@MapperXml",
          signature: '@MapperXml("namespace")',
          description: "将类方法绑定到 XML 同 namespace 下 id=方法名 的 statement。",
          params: [
            {
              name: "namespace",
              type: "string",
              required: true,
              description: "XML Mapper 命名空间。",
            },
          ],
        },
        {
          name: "xmlMapper / loadXmlMappers / ensureXmlMappersLoaded",
          description: "函数式绑定与加载入口。",
        },
        {
          name: "parseMapperXml / renderStatementSql / evalTest / getXmlStatement",
          description: "解析 XML、按参数渲染动态 SQL、评估 if test、按 namespace+id 取 statement。",
        },
        {
          name: "bootstrapXmlMappers / watchXmlMappers",
          description: "按 YAML 启动加载；开发态监听变更（需 mapperReload=true）。",
        },
      ],
      decoratorExample: `@MapperXml("com.pangza.UserMapper")
class UserMapper {
  findByRole(@Param("roleId") roleId: number): Promise<User[]> {
    throw new Error("bound by XML");
  }
}`,
      functionalExample: `loadXmlMappers(["mappers/**/*.xml"]);
ensureXmlMappersLoaded();
const api = xmlMapper("com.pangza.UserMapper");`,
    },
    {
      id: "xml-dynamic",
      title: "XML 动态 SQL 标签",
      content:
        "支持常用动态 SQL 节点。静态文本 + 动态树渲染为最终 SQL 与参数列表。可定义 <sql id> 片段供 <include> 引用。",
      apis: [
        {
          name: "<if test>",
          description: "test 为表达式（evalTest）；为真时拼接子节点。常用 roleId != null。",
        },
        {
          name: "<where>",
          description: "包裹条件；自动去掉多余 AND/OR，并在有内容时加 WHERE。",
        },
        {
          name: "<set>",
          description: "UPDATE 动态列；自动去掉末尾逗号并加 SET。",
        },
        {
          name: "<trim>",
          description:
            "通用裁剪：prefix / suffix / prefixOverrides / suffixOverrides（如去掉开头 AND）。",
        },
        {
          name: "<foreach>",
          description:
            "遍历集合：collection / item / index / open / close / separator。常用于 IN (...) 。",
        },
        {
          name: "<include refid>",
          description: "引用同文件 <sql id=\"...\"> 片段。",
        },
        {
          name: "statement 属性",
          description: "id、resultType（可选）、datasource（可选，指定数据源名）。",
        },
      ],
      decoratorExampleTitle: "XML 示例",
      decoratorExample: `<!-- mappers/UserMapper.xml -->
<mapper namespace="com.pangza.UserMapper">
  <sql id="Base_Column">id, user_name, status</sql>

  <select id="findByRole" resultType="User">
    SELECT <include refid="Base_Column"/>
    FROM sys_user
    <where>
      <if test="roleId != null">
        AND role_id = #{roleId}
      </if>
      <if test="status != null">
        AND status = #{status}
      </if>
    </where>
  </select>

  <select id="findByIds">
    SELECT * FROM sys_user
    WHERE id IN
    <foreach collection="ids" item="id" open="(" close=")" separator=",">
      #{id}
    </foreach>
  </select>

  <update id="patch">
    UPDATE sys_user
    <set>
      <if test="username != null">user_name = #{username},</if>
      <if test="status != null">status = #{status},</if>
    </set>
    WHERE id = #{id}
  </update>
</mapper>`,
      functionalExample: `const stmt = getXmlStatement("com.pangza.UserMapper", "findByRole");
const { sql, params } = renderStatementSql(stmt, { roleId: 1, status: null });
await Db.query(sql, params);`,
    },
    {
      id: "security",
      title: "SQL 安全辅助函数",
      content:
        "值参数一律走 ? 占位。标识符与 last() 片段走白名单，禁止把用户输入拼进 SQL 结构。",
      apis: [
        {
          name: "assertIdent",
          signature: "assertIdent(name: string): string",
          description:
            "校验表名/列名：^[a-zA-Z_][a-zA-Z0-9_]*$；拒绝 __proto__ 等。非法抛错。",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "要校验的 SQL 标识符。",
            },
          ],
        },
        {
          name: "assertSafeUint",
          signature: "assertSafeUint(value, label?): number",
          description: "非负安全整数（LIMIT / OFFSET / 页码）。",
          params: [
            {
              name: "value",
              type: "unknown",
              required: true,
              description: "必须是安全无符号整数的值。",
            },
            {
              name: "label",
              type: "string",
              required: false,
              description: "错误信息中的字段标签。",
            },
          ],
        },
        {
          name: "escapeLike",
          signature: "escapeLike(value: string): string",
          description: "转义 \\ % _，避免用户输入扩大 LIKE 匹配面。",
          params: [
            {
              name: "value",
              type: "string",
              required: true,
              description: "要转义的 LIKE 片段。",
            },
          ],
        },
        {
          name: "assertSafeLastSql",
          signature: "assertSafeLastSql(sql: string): string",
          description:
            "QueryWrapper.last() 仅允许：LIMIT n [OFFSET m] / FOR UPDATE / LOCK IN SHARE MODE。",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "要校验的尾部 SQL 片段。",
            },
          ],
        },
      ],
      decoratorExample: `// 无装饰器；QueryWrapper / BaseMapper 内部已调用`,
      functionalExample: `import { assertIdent, escapeLike, assertSafeLastSql } from "@pangza/orm";

assertIdent("user_name");
const kw = escapeLike(userInput);
new QueryWrapper()
  .like("user_name", kw)
  .last(assertSafeLastSql("LIMIT 10 OFFSET 0"));`,
    },
    {
      id: "dialect",
      title: "多数据库方言 Dialect",
      content:
        "getDialect(type) 与 DataSourceConfig.type 共用规范名。自动注册源名：default / postgresql / sqlserver（不是 pg）。",
      apis: [
        {
          name: "getDialect",
          signature: 'getDialect("mysql"|"postgresql"|"sqlserver"|别名): Dialect',
          description:
            "别名：mariadb→mysql；postgres/pg→postgresql；mssql/sql-server→sqlserver。",
          params: [
            {
              name: "type",
              type: "\"mysql\"|\"postgresql\"|\"sqlserver\"|alias",
              required: true,
              description: "库类型或别名。",
            },
          ],
        },
        {
          name: "Dialect.quoteIdent",
          description: "标识符引号：MySQL \`col\`；PG/MSSQL \"col\"。",
        },
        {
          name: "Dialect.convertPlaceholders",
          description: "将 ? 转为驱动所需占位（如 PG $1、$2）。",
        },
        {
          name: "Dialect.appendLimitOffset",
          description: "分页语法差异（LIMIT/OFFSET 或等效）。",
        },
        {
          name: "Dialect.prepareInsert / extractInsertId",
          description: "插入语句与自增 ID 回填差异。",
        },
        {
          name: "QueryWrapper.forDatasource",
          description: "按已注册源取方言，避免默认 MySQL 引号用在 PG 上。",
        },
      ],
      decoratorExample: `@Mapper(User, { datasource: "postgresql" })
class UserMapper {}

@Select("SELECT * FROM t WHERE id=#{id}", { datasource: "postgresql" })
find(@Param("id") id: string) {}`,
      functionalExample: `import { getDialect } from "@pangza/orm";

const d = getDialect("postgresql");
d.quoteIdent("user"); // "user"

QueryWrapper.forDatasource("postgresql").eq("status", 1);
new QueryWrapper({ dialect: "sqlserver" }).eq("status", 1);`,
    },
    {
      id: "runtime-api",
      title: "运行时配置与 SQL 日志 API",
      apis: [
        {
          name: "configureOrm",
          signature: "configureOrm(patch: Partial<ResolvedOrmConfig>)",
          description:
            "运行时覆盖全局配置并 clearTableCache；生产显式开 sqlLog 会告警。下表展开 ResolvedOrmConfig 可 patch 字段。",
          params: objectParamWithFields("zh", {
            name: "patch",
            typeName: "Partial<ResolvedOrmConfig>",
            required: true,
            summaryZh: "必填。只传需要覆盖的字段即可。",
            summaryEn: "",
            fields: RESOLVED_ORM_CONFIG_FIELDS,
          }),
        },
        {
          name: "getOrmConfig",
          description: "读取 YAML + configure 合并后的 ResolvedOrmConfig（字段同 configureOrm 的 patch）。",
        },
        {
          name: "setMetaObjectHandler",
          signature: "setMetaObjectHandler({ insert?, update? })",
          description: "插入/修改拦截，在默认填充之后执行。下表为 MetaObjectHandler。",
          params: objectParamWithFields("zh", {
            name: "handler",
            typeName: "MetaObjectHandler",
            required: true,
            summaryZh: "必填。自定义填充钩子。",
            summaryEn: "",
            fields: META_OBJECT_HANDLER_FIELDS,
          }),
        },
        {
          name: "configureSqlLog",
          signature: "configureSqlLog({ enabled, format?, parts?, level? })",
          description: "细粒度开关；format 可为模板字符串或 (SqlLogInfo)=>string。",
          params: [
            {
              name: "enabled",
              type: "boolean",
              required: false,
              description: "是否开启 SQL 日志。",
            },
            {
              name: "format",
              type: "string | fn",
              required: false,
              description: "日志格式模板或函数。",
            },
            {
              name: "parts",
              type: "SqlLogParts",
              required: false,
              description: "要包含的日志部件。",
            },
            {
              name: "level",
              type: "LogLevel",
              required: false,
              description: "日志级别。",
            },
          ],
        },
        {
          name: "getSqlLogRuntime / renderSqlLog / detectSqlType",
          description: "读当前日志运行时；渲染一行日志；识别 SELECT/INSERT/UPDATE/DELETE 等。",
        },
        {
          name: "DEFAULT_SQL_LOG_FORMAT",
          description: '默认模板：{time} [{type}] {cost}ms | {sql} | params={params}',
        },
        {
          name: "OrmError / OptimisticLockError",
          description: "ORM 异常；乐观锁冲突抛 OptimisticLockError。",
        },
        {
          name: "mapResultRow / mapResultRows",
          description: "结果行映射（含下划线转驼峰）。",
        },
      ],
      decoratorExample: `// 无装饰器；启动期调用`,
      functionalExample: `configureOrm({
  logicDelete: true,
  sqlLog: true,
  batchInsertSize: 100,
});

configureSqlLog({
  enabled: true,
  level: "debug",
  parts: { time: true, type: true, sql: true, params: true, cost: true },
  format: "{time} [{type}] {cost}ms | {sql}",
});

setMetaObjectHandler({
  insert(entity) {
    entity.create_by = currentUserId();
  },
  update(entity) {
    entity.update_by = currentUserId();
  },
});`,
    },
  ],
};

export const ormConfig: DocPage = {
  key: "ORM-config",
  title: "ORM · 配置项",
  description:
    "application.yaml → orm / datasource；可用 configureOrm(patch) 运行时覆盖。表级 MapperTableOptions 再覆盖全局。",
  sections: [
    {
      id: "yaml",
      title: "YAML orm",
      configs: [
        {
          name: "logicDelete",
          type: "boolean",
          default: "true",
          description: "全局逻辑删除。无 delete_flag 的表须 @Mapper({ logicDelete: false })",
        },
        {
          name: "logicDeleteField",
          type: "string",
          default: "delete_flag",
          description: "逻辑删列名",
        },
        {
          name: "logicDeleteValue",
          type: "any",
          default: "1",
          description: "已删除写入值",
        },
        {
          name: "logicNotDeleteValue",
          type: "any",
          default: "0",
          description: "未删除条件值",
        },
        {
          name: "optimisticLock",
          type: "boolean",
          default: "false",
          description: "全局乐观锁",
        },
        {
          name: "versionField",
          type: "string",
          default: "version",
          description: "版本列名",
        },
        {
          name: "idType",
          type: "IdType",
          default: "ASSIGN_ID",
          description: "全局主键策略：AUTO | NONE | INPUT | ASSIGN_ID | ASSIGN_UUID",
        },
        {
          name: "mapUnderscoreToCamelCase",
          type: "boolean",
          default: "true",
          description: "查询结果列下划线 → 驼峰",
        },
        {
          name: "workerId",
          type: "number",
          default: "1",
          description: "雪花机器号 0–1023",
        },
        {
          name: "fill.createTime",
          type: "string",
          default: "create_time",
          description: "自动填充创建时间列名；空串关闭",
        },
        {
          name: "fill.updateTime",
          type: "string",
          default: "update_time",
          description: "自动填充更新时间列名",
        },
        {
          name: "fill.createBy",
          type: "string",
          default: "create_by",
          description: "自动填充创建人列名",
        },
        {
          name: "fill.updateBy",
          type: "string",
          default: "update_by",
          description: "自动填充更新人列名",
        },
        {
          name: "batch.insertSize",
          type: "number",
          default: "200",
          description: "saveBatch 每批行数",
        },
        {
          name: "batch.updateSize",
          type: "number",
          default: "200",
          description: "updateBatch 每批实体数",
        },
        {
          name: "batch.inSize",
          type: "number",
          default: "500",
          description: "QueryWrapper.in / deleteByIds 等 IN 分片大小",
        },
        {
          name: "mapperLocations",
          type: "string[]",
          default: "[]",
          description: "XML 路径 glob，相对项目根或绝对路径；空=不启用",
        },
        {
          name: "mapperReload",
          type: "boolean",
          default: "false",
          description: "开发态改 XML 热加载",
        },
        {
          name: "sqlLog.enabled",
          type: "boolean",
          default: "false",
          description: "SQL 日志；生产默认关，显式打开会告警并对 password/token 脱敏",
        },
        {
          name: "sqlLog.format",
          type: "string",
          default: "{time} [{type}] {cost}ms | {sql} | params={params}",
          description: "日志模板占位符：time / type / sql / params / cost",
        },
        {
          name: "sqlLog.level",
          type: "trace|debug|info|warn",
          default: "info",
          description: "SQL 日志级别",
        },
        {
          name: "sqlLog.parts.*",
          type: "boolean",
          default: "true",
          description: "time / type / sql / params / cost 各片段开关",
        },
      ],
      functionalExampleTitle: "配置示例",
      functionalExample: `orm:
  logicDelete: true
  logicDeleteField: delete_flag
  logicDeleteValue: 1
  logicNotDeleteValue: 0
  optimisticLock: false
  versionField: version
  idType: ASSIGN_ID
  mapUnderscoreToCamelCase: true
  workerId: 1
  fill:
    createTime: create_time
    updateTime: update_time
    createBy: create_by
    updateBy: update_by
  batch:
    insertSize: 200
    updateSize: 200
    inSize: 500
  mapperLocations:
    - mappers/**/*.xml
  mapperReload: false
  sqlLog:
    enabled: true
    level: info
    format: "{time} [{type}] {cost}ms | {sql} | params={params}"
    parts:
      time: true
      type: true
      sql: true
      params: true
      cost: true`,
    },
    {
      id: "mapper-opts",
      title: "MapperTableOptions（表级覆盖）",
      configs: [
        {
          name: "idField",
          type: "string",
          default: "id",
          description: "主键属性/列名",
        },
        {
          name: "datasource",
          type: "string",
          default: '"default"',
          description: "已注册数据源名（推荐）；勿与仅按类型的 db 混淆",
        },
        {
          name: "logicDelete",
          type: "boolean",
          description: "覆盖全局；无逻辑删字段的表设 false",
        },
        {
          name: "logicDeleteField / Value / NotDeleteValue",
          type: "string | any",
          description: "表级逻辑删字段与取值",
        },
        {
          name: "optimisticLock / versionField",
          type: "boolean / string",
          description: "表级乐观锁",
        },
        {
          name: "fill",
          type: "boolean",
          default: "true",
          description: "是否自动填充 create/update 字段",
        },
        {
          name: "updateNullStrategy",
          type: '"INCLUDE" | "IGNORE"',
          default: "INCLUDE",
          description: "更新时 null：INCLUDE 写 NULL；IGNORE 跳过。undefined 始终不写",
        },
        {
          name: "entity",
          type: "Function",
          description: "实体类，用于字段填充与结果水合",
        },
      ],
      functionalExampleTitle: "配置示例",
      functionalExample: `@Mapper(MenuRole, { logicDelete: false })
class MenuRoleMapper {}

table("sys_user", {
  entity: User,
  logicDelete: true,
  datasource: "default",
  updateNullStrategy: "IGNORE",
  optimisticLock: true,
  versionField: "version",
});`,
    },
    {
      id: "datasource",
      title: "数据源 datasource.*",
      content:
        "default 为默认库；postgresql / sqlserver 在 host 非空时自动注册同名数据源。连接懒加载，首次 query 才建池。",
      configs: [
        {
          name: "type",
          type: "mysql | postgresql | sqlserver",
          default: "mysql",
          description: "库类型；别名 mariadb / postgres / pg / mssql 可识别",
        },
        {
          name: "host",
          type: "string",
          description: "主机；可选源 host 为空则不注册",
        },
        {
          name: "port",
          type: "number",
          description: "端口（按类型默认）",
        },
        {
          name: "user / password / database",
          type: "string",
          description: "账号与库名",
        },
        {
          name: "connectionLimit",
          type: "number",
          default: "10",
          description: "连接池大小",
        },
        {
          name: "enabled",
          type: "boolean",
          description: "false 不注册；缺省且 host 非空则注册",
        },
        {
          name: "name",
          type: "string",
          description: "编程注册时的数据源名；YAML 键即为名",
        },
      ],
      functionalExampleTitle: "配置示例",
      functionalExample: `datasource:
  default:
    type: mysql
    host: 127.0.0.1
    port: 3306
    user: root
    password: ""
    database: pangza
    connectionLimit: 10
  postgresql:
    type: postgresql
    host: ""          # 非空才自动注册名为 postgresql 的源
    port: 5432
    user: postgres
    password: ""
    database: app
  sqlserver:
    type: sqlserver
    host: ""
    port: 1433
    user: sa
    password: ""
    database: app`,
    },
  ],
};
