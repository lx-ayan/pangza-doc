import type { DocPage } from "../../../types/doc";

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
} from "../../typeFields";

export const ormApi: DocPage = {
  key: "ORM-api",
  title: "ORM · API",
  description:
    "Package @pangza/orm: method-level SQL decorators (@Select / @Insert / @Update / @Delete / @Param); entities (@TableName / @TableId / @TableField); @Mapper / MapperType, BaseMapper, QueryWrapper, transactions, TableSearch, XML Mapper; MySQL / PostgreSQL / SQL Server multi-datasource.",
  sections: [
    {
      id: "overview",
      title: "Module overview",
      content:
        "Pipeline: entity @TableName/@TableId/@TableField → getEntityTableMeta → @Mapper / table() → BaseMapper builds SQL (logic delete, optimistic lock, fill, result hydration).\nPaged forms use @TableSearch + getQueryWrapperAndPage to build a QueryWrapper; custom SQL uses method-level @Select/@Insert/@Update/@Delete or XML Mapper.\nConvention: QueryWrapper / TableSearch column names are DB columns (snake_case); entity properties may be camelCase; query results can map underscore to camelCase by default.",
    },
    {
      id: "table-name",
      title: "@TableName",
      content:
        "Source: entityDecorators.ts. Class decorator that attaches the table name to the constructor. @Mapper(Entity) / getEntityTableMeta depend on it; the Entity file must be loaded first (entity scan or import).",
      apis: [
        {
          name: "@TableName",
          signature: "@TableName(tableName: string)",
          description: "Table name must not be an empty string.",
          params: [
            {
              name: "tableName",
              type: "string",
              required: true,
              description: "Database table name, e.g. sys_user",
            },
          ],
        },
        {
          name: "getTableName",
          signature: "getTableName(entity: Ctor): string | undefined",
          description: "Read table-name metadata from the class.",
          params: [
            {
              name: "entity",
              type: "Ctor",
              required: true,
              description: "Entity class.",
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
      content: "Property decorator that marks the primary key. If omitted, column name = property name.",
      apis: [
        {
          name: "@TableId",
          signature:
            "@TableId(value?: string | { value?: string; type?: IdType })",
          description: "Writes into entityFields with id=true.",
          params: [
            {
              name: "value",
              type: "string",
              description: "Primary-key column name; string form or options.value",
            },
            {
              name: "type",
              type: "IdType",
              default: "NONE",
              description:
                "NONE follows global orm.idType; see \"IdType primary-key strategy\"",
            },
          ],
        },
        {
          name: "getEntityIdField",
          description: "Read entity primary-key field metadata.",
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
        "Column mapping and field-level fill. Global YAML fill.* / MetaObjectHandler: see \"Auto-fill\"; field fill writes only when the value is undefined, and uses the column-name key.",
      apis: [
        {
          name: "@TableField",
          signature: "@TableField(value?: string | TableFieldOptions)",
          description: "Property decorator.",
          params: [
            {
              name: "value",
              type: "string",
              description: "Database column name; defaults to the property name",
            },
            {
              name: "exist",
              type: "boolean",
              default: "true",
              description: "false: not a table column; excluded from default INSERT/UPDATE",
            },
            {
              name: "insertFill",
              type: "any | () => any | Promise",
              description: "On insert, fill this column if it is still undefined",
            },
            {
              name: "updateFill",
              type: "any | () => any | Promise",
              description: "On update, same as above",
            },
          ],
        },
        {
          name: "getEntityFields / getEntityTableMeta / applyEntityFieldFills",
          description:
            "Read field map; read full table metadata; apply insertFill/updateFill to a row.",
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
      title: "IdType primary-key strategy",
      apis: [
        {
          name: "IdType.ASSIGN_ID",
          description:
            "Default global strategy. Snowflake ID before insert; prefer string for entity id (number risks precision loss). insert return value may be 0; trust the value written back onto the entity.",
        },
        {
          name: "IdType.AUTO",
          description: "DB auto-increment; INSERT omits id, then backfills after insert.",
        },
        {
          name: "IdType.INPUT",
          description: "Caller assigns before insert; framework does not generate.",
        },
        {
          name: "IdType.ASSIGN_UUID",
          description: "UUID without hyphens; suitable for string primary keys.",
        },
        {
          name: "IdType.NONE",
          description: "Follows global configureOrm / YAML orm.idType.",
        },
        {
          name: "setIdentifierGenerator",
          description: "Custom snowflake (or other) ID generator; default is defaultIdentifierGenerator.",
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
      title: "@Select / @Insert / @Update / @Delete overview",
      content:
        "Source: sqlDecorators.ts. These four decorators replace the method body: on call they parse SQL and run Db.queryOn; the original empty body never runs.\nPlaceholders: #{name} → prepared ? binding (recommended); ${name} → string interpolated into SQL (trusted identifiers only; never user input).\nSecond argument options may set datasource (data-source name) or db (find the unique source by DB type); if both are set, datasource wins.\n@Select can also mark entity properties (field hydration); see \"@Select (property-level)\" below.",
      apis: [
        {
          name: "SqlExecuteOptions",
          signature: "{ datasource?: string; db?: DbType | string }",
          description:
            "Shared second argument for @Select/@Insert/@Update/@Delete. datasource defaults to \"default\"; db is mysql/postgresql/sqlserver (and aliases). When multiple sources share a type, you must use datasource.",
          params: [
            {
              name: "datasource",
              type: "string",
              default: '"default"',
              description: "Data-source name from Db.register",
            },
            {
              name: "db",
              type: "mysql | postgresql | sqlserver | alias",
              description: "Look up by registered source DB type; errors if multiple of that type—use datasource instead",
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
      title: "@Select (method-level)",
      content:
        "On a Mapper method: runs the query SQL and returns a row array (via mapResultRows; may map underscore to camelCase).\nNote: method-level @Select does not auto-fill property-level @Select on the entity (avoids N+1); call hydrateFieldSelects(Entity, rows) when needed.",
      apis: [
        {
          name: "@Select",
          signature: '@Select(sql: string, options?: SelectOptions)',
          description:
            "Method decorator. sql must not be empty. SelectOptions = FieldSelectOptions & SqlExecuteOptions (method-level mainly uses datasource/db).",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "SELECT statement; may use #{param} / ${param}",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "Data-source name",
            },
            {
              name: "options.db",
              type: "string",
              description: "Pick source by DB type (when only one of that type)",
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
        "Physical insert. Returns insertId; for PostgreSQL / SQL Server prefer RETURNING / OUTPUT in SQL—the framework prefers the first column of the first row.",
      apis: [
        {
          name: "@Insert",
          signature: '@Insert(sql: string, options?: SqlExecuteOptions)',
          description: "Method decorator; sql must not be empty.",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "INSERT statement",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "Data-source name",
            },
            {
              name: "options.db",
              type: "string",
              description: "Pick source by DB type",
            },
          ],
          returns: "Promise<number> (insertId)",
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
      content: "Runs UPDATE; returns affectedRows (number of affected rows).",
      apis: [
        {
          name: "@Update",
          signature: '@Update(sql: string, options?: SqlExecuteOptions)',
          description: "Method decorator; sql must not be empty.",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "UPDATE statement",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "Data-source name",
            },
            {
              name: "options.db",
              type: "string",
              description: "Pick source by DB type",
            },
          ],
          returns: "Promise<number> (affectedRows)",
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
        "Physical DELETE; returns affectedRows. For logic delete use BaseMapper delete / deleteById / deleteByIds—do not use this decorator.",
      apis: [
        {
          name: "@Delete",
          signature: '@Delete(sql: string, options?: SqlExecuteOptions)',
          description: "Method decorator; sql must not be empty. Always runs a DELETE statement.",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "DELETE statement",
            },
            {
              name: "options.datasource",
              type: "string",
              default: '"default"',
              description: "Data-source name",
            },
            {
              name: "options.db",
              type: "string",
              description: "Pick source by DB type",
            },
          ],
          returns: "Promise<number> (affectedRows)",
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
      title: "@Param and #{} / ${}",
      content:
        "@Param maps method parameter indexes to names for SQL template references. Without @Param you cannot resolve #{name} by name.",
      apis: [
        {
          name: "@Param",
          signature: '@Param(name: string)',
          description: "Parameter decorator; name must not be empty. Writes metadata pangza.orm.sqlParamNames.",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Name used by #{name} / ${name} in SQL",
            },
          ],
        },
        {
          name: "#{name}",
          description: "Prepared binding as ? (or dialect placeholder); injection-safe; prefer this.",
        },
        {
          name: "${name}",
          description:
            "String substitution into SQL. Trusted identifiers only (table/column names, etc.); values with ; -- quotes etc. are rejected or warned. User input forbidden.",
        },
        {
          name: "parseMybatisSql / buildParamContext",
          description: "Low-level: parse template by named params; build context from args + @Param mapping.",
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
      title: "@Select (property-level) and hydration",
      content:
        "Same Select function: if descriptor.value (method) → method decorator; otherwise → property decorator (registerFieldSelect).\nProperty-level: fills an entity field with a follow-up query result (association / collection). BaseMapper.selectList/selectPage auto-runs hydrateFieldSelects when an entity is bound.",
      apis: [
        {
          name: "@Select (property)",
          signature: "@Select(sql, options?: FieldSelectOptions & SqlExecuteOptions)",
          description: "On an entity property; cannot share the same property with @ManyToOne etc.",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "Subquery SQL; may use parent-row fields like #{id}",
            },
            {
              name: "many",
              type: "boolean",
              default: "false",
              description: "true → array; false → single row/value",
            },
            {
              name: "column",
              type: "string",
              description: "Take only this column; with many yields a scalar array",
            },
            {
              name: "depth",
              type: "number",
              default: "0",
              description: "Whether nested rows continue hydrate; trees may use 1+",
            },
            {
              name: "eager",
              type: "boolean",
              default: "true",
              description:
                "Auto-fill on selectList etc. Column=#{parentField} can merge into IN; subqueries/LIMIT still per-row. For full tree loads prefer false",
            },
            {
              name: "datasource / db",
              type: "string",
              description: "Data source used by the subquery",
            },
          ],
        },
        {
          name: "hydrateFieldSelects",
          signature: "hydrateFieldSelects(Entity, rows, options?)",
          description: "Manually run field-level @Select hydration on a row array.",
          params: [
            {
              name: "Entity",
              type: "Ctor",
              required: true,
              description: "Entity with property @Select.",
            },
            {
              name: "rows",
              type: "object | object[]",
              required: true,
              description: "Row(s) to hydrate.",
            },
            {
              name: "options",
              type: "HydrateFieldSelectOptions",
              required: false,
              description: "Hydration options; see options.* below.",
            },
            ...typeParams(HYDRATE_FIELD_SELECT_OPTIONS_FIELDS, "en", "options"),
          ],
        },
        {
          name: "buildRowParamContext",
          description:
            "Build #{id} context for a parent row, exposing both camel and snake keys so placeholders resolve.",
        },
        {
          name: "registerFieldSelect / getFieldSelects / getFieldSelect",
          description: "Register and read property-level @Select metadata.",
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
      title: "Relations @ManyToOne / @OneToMany / @ManyToMany",
      content:
        "Source: relation.ts + hydrate.ts. Mutually exclusive with field @Select on the same property. Writes do not cascade by default (no auto sync/saveWith).\nfetch currently only implements SELECT (second query); JOIN is not available yet—do not rely on it.",
      apis: [
        {
          name: "@ManyToOne",
          signature: "@ManyToOne(() => Target, { foreignKey, ... })",
          description: "Many-to-one; default eager=true.",
          params: [
            {
              name: "foreignKey",
              type: "string",
              required: true,
              description: "Foreign-key column name on this table",
            },
            {
              name: "targetKey",
              type: "string",
              default: "id",
              description: "Primary-key column on the target table",
            },
            {
              name: "eager",
              type: "boolean",
              default: "true",
              description: "Whether selectList/Page auto-fills",
            },
            {
              name: "fetch",
              type: '"SELECT" | "JOIN"',
              default: "SELECT",
              description: "Only SELECT works today; JOIN is reserved",
            },
            {
              name: "depth",
              type: "number",
              default: "0",
              description: "Nested relation recursion depth",
            },
            {
              name: "datasource / db",
              type: "string",
              description: "Data source for the relation query",
            },
          ],
        },
        {
          name: "@OneToMany",
          signature: "@OneToMany(() => Target, { foreignKey, ... })",
          description: "One-to-many; default eager=false (lazy).",
          params: [
            {
              name: "foreignKey",
              type: "string",
              required: true,
              description: "Foreign-key column on the other table pointing here",
            },
            {
              name: "localKey",
              type: "string",
              description: "Referenced column on this table; defaults to this table's PK",
            },
            {
              name: "eager / fetch / depth / datasource",
              type: "…",
              default: "eager=false",
              description: "Same as ManyToOne; default does not auto-fill",
            },
          ],
        },
        {
          name: "@ManyToMany",
          signature:
            "@ManyToMany(() => Target, { joinTable, joinColumn, inverseJoinColumn })",
          description: "Many-to-many via a join table; default lazy.",
          params: [
            {
              name: "joinTable",
              type: "string",
              required: true,
              description: "Join-table name",
            },
            {
              name: "joinColumn",
              type: "string",
              required: true,
              description: "Join-table column pointing to this table",
            },
            {
              name: "inverseJoinColumn",
              type: "string",
              required: true,
              description: "Join-table column pointing to the target table",
            },
            {
              name: "targetKey / localKey / eager / depth",
              type: "…",
              default: "eager=false",
              description: "Target PK, local key, whether to auto-fill, recursion depth",
            },
          ],
        },
        {
          name: "hydrateRelations / getRelations / getRelation / relationToFieldSelect",
          description: "Manual hydrate; read relation metadata; relations can convert to field Select descriptors.",
        },
        {
          name: "SelectQueryOptions.relations",
          description:
            "Omit: eager only; false: no fill; string[]: fill only listed properties (including lazy).",
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
        "table(tableName, options) caches BaseMapper by options. @Mapper / MapperType are exported from @pangza/orm: mix in CRUD and bindClass; when Entity is passed, reads @TableName.\nuseTable(name) returns the cached instance. @Service(Mapper) lives in @pangza/core and only delegates some methods—see Service docs.",
      apis: [
        {
          name: "@Mapper",
          signature: "@Mapper(tableOrEntity, idFieldOrOptions?)",
          description:
            "Class decorator. First arg is table-name string or entity class; second may be id field-name string or MapperTableOptions.",
          params: [
            {
              name: "tableOrEntity",
              type: "string | Function",
              required: true,
              description: "Table name or entity with @TableName",
            },
            {
              name: "options",
              type: "MapperTableOptions | string",
              description: "Table-level overrides; or shorthand idField string",
            },
          ],
        },
        {
          name: "table / useTable / clearTableCache",
          signature: "table(name, MapperTableOptions?)",
          description:
            "Functional Mapper creation; useTable reads cache; configureOrm clears table cache.",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Table name (table).",
            },
            {
              name: "options",
              type: "MapperTableOptions",
              required: false,
              description: "Per-table overrides; see options.* below.",
            },
            ...typeParams(MAPPER_TABLE_OPTIONS_FIELDS, "en", "options"),
          ],
        },
        {
          name: "selectById",
          signature: "selectById(id, options?: SelectQueryOptions)",
          description: "Select one row by primary key. SelectQueryOptions fields below.",
          params: [
            {
              name: "id",
              type: "unknown",
              required: true,
              description: "Primary key.",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "Select options; see options.* below.",
            },
            ...typeParams(SELECT_QUERY_OPTIONS_FIELDS, "en", "options"),
          ],
        },
        {
          name: "selectOne",
          signature: "selectOne(wrapper?, options?)",
          description: "Select one row by condition; if multiple, takes the first.",
          params: [
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "Where builder.",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "Select options.",
            },
          ],
        },
        {
          name: "selectList",
          signature: "selectList(wrapper?, options?)",
          description: "List; with bound entity, auto field hydrate / eager relations.",
          params: [
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "Where builder.",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "Select options.",
            },
          ],
        },
        {
          name: "selectCount",
          signature: "selectCount(wrapper?)",
          description: "Count; includes logic-delete condition by default.",
          returns: "Promise<number>",
          params: [
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "Where builder.",
            },
          ],
        },
        {
          name: "selectPage",
          signature: "selectPage(page, wrapper?, options?)",
          description: "Pagination: { current, size } → IPage { records, total, current, size }.",
          returns: "Promise<IPage<T>>",
          params: [
            {
              name: "page",
              type: "PageQuery",
              required: true,
              description: "Page request; see page.* below.",

            ...typeParams(PAGE_QUERY_FIELDS, "en", "page"),
            },
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: false,
              description: "Where builder.",
            },
            {
              name: "options",
              type: "SelectQueryOptions",
              required: false,
              description: "Select options; see options.* below.",
            },
            ...typeParams(SELECT_QUERY_OPTIONS_FIELDS, "en", "options"),
          ],
        },
        {
          name: "insert",
          signature: "insert(entity)",
          description:
            "Insert; runs IdType, insertFill, MetaObjectHandler. Return value is not necessarily the business id.",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "Row to insert.",
            },
          ],
        },
        {
          name: "saveBatch",
          signature: "saveBatch(entities)",
          description: "Batch insert, chunked by orm.batch.insertSize (default 200).",
          params: [
            {
              name: "entities",
              type: "object[]",
              required: true,
              description: "Rows to batch-insert.",
            },
          ],
        },
        {
          name: "saveOrUpdate",
          signature: "saveOrUpdate(entity)",
          description: "If primary key present and row exists → updateById; otherwise insert.",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "Insert or update by id presence.",
            },
          ],
        },
        {
          name: "updateById",
          signature: "updateById(entity)",
          description:
            "Update by primary key; undefined fields skipped; null follows updateNullStrategy; may use optimistic lock.",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "Entity with id + fields to update.",
            },
          ],
        },
        {
          name: "update",
          signature: "update(entity, wrapper)",
          description: "Update by condition; empty WHERE on wrapper is forbidden (prevents full-table update).",
          params: [
            {
              name: "entity",
              type: "object",
              required: true,
              description: "Partial fields to set.",
            },
            {
              name: "wrapper",
              type: "QueryWrapper",
              required: true,
              description: "Where clause.",
            },
          ],
        },
        {
          name: "updateBatch",
          signature: "updateBatch(entities)",
          description: "Batch update by primary key, chunked by batch.updateSize.",
          params: [
            {
              name: "entities",
              type: "object[]",
              required: true,
              description: "Rows to batch-update by id.",
            },
          ],
        },
        {
          name: "deleteById / deleteByIds / delete",
          description:
            "When logic delete is on → UPDATE flag; otherwise physical DELETE. Empty condition forbids full-table delete.",
        },
        {
          name: "physicalDeleteById / physicalDeleteByIds / physicalDelete",
          description: "Always DELETE; ignores logic-delete switch.",
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
        "Condition builder; column names whitelisted, values always parameter-bound. No chained Join DSL. Large IN lists are chunked by batchInSize. Empty in([]) → 1=0; empty notIn([]) → 1=1.",
      apis: [
        {
          name: "Constructor",
          signature: "new QueryWrapper(options?) | QueryWrapper.forDatasource(name)",
          description:
            "May pass dialect / DbType; forDatasource picks dialect from a registered source (PG quoting, etc.). nested() inherits outer dialect.",
          params: [
            {
              name: "options | name",
              type: "object | string",
              required: false,
              description: "QueryWrapper options, or datasource name for forDatasource.",
            },
          ],
        },
        {
          name: "ignoreLogicDelete",
          description: "This query ignores logic-delete conditions (e.g. recycle bin).",
        },
        {
          name: "select / eq / ne / gt / ge / lt / le",
          description: "Column projection and comparison; eqOrIsNull writes IS NULL when value is null.",
        },
        {
          name: "like / likeLeft / likeRight / notLike",
          description: "Fuzzy match; dialect LIKE ESCAPE handles special characters.",
        },
        {
          name: "in / notIn / between / notBetween",
          description: "Sets and ranges; large IN auto-chunked.",
        },
        {
          name: "isNull / isNotNull",
          description: "Null checks.",
        },
        {
          name: "exists / notExists / apply / nested",
          description:
            "Subqueries and raw fragments; nested(fn) builds a parenthesized group; or()/and() switch the next condition join.",
        },
        {
          name: "groupBy / having / orderByAsc / orderByDesc / last",
          description:
            "Grouping, HAVING, ordering; last appends a safe trailing fragment (dangerous SQL forbidden).",
        },
        {
          name: "clone / build",
          description: "clone so Mapper appending logic-delete does not mutate the caller's wrapper; build yields SqlFragment.",
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
        "Paged/list query conditions: JSON form is a plain object—you must pass the DTO class to read @TableSearch metadata. Empty values (null / undefined / '' / []) skip the condition.",
      apis: [
        {
          name: "@TableSearch",
          signature: "@TableSearch(options? | OperType)",
          description:
            "On Page DTO fields; default operator=EQ; empty column maps property name camel→snake.",
          params: [
            {
              name: "column",
              type: "string",
              description: "Database column name",
            },
            {
              name: "operator",
              type: "OperType",
              default: "EQ",
              description: "See OperTypeEnum",
            },
          ],
        },
        {
          name: "OperTypeEnum",
          description:
            "EQ, LIKE, LIKE_LEFT, LIKE_RIGHT, NOT_LIKE, GT, GE, LT, LE, NE, IN, NOT_IN, BETWEEN, NOT_BETWEEN, IS_NULL, IS_NOT_NULL. BETWEEN form values are typically [start, end]; IN is an array.",
        },
        {
          name: "getTableSearchMeta",
          description: "Read @TableSearch metadata from a DTO.",
        },
        {
          name: "getQueryWrapper",
          signature: "getQueryWrapper(form, DtoClass, consumer?)",
          description: "Build QueryWrapper only; consumer may append select/order.",
          params: [
            {
              name: "form",
              type: "object",
              required: true,
              description: "Plain JSON form (must pass DTO class for metadata).",
            },
            {
              name: "DtoClass",
              type: "Ctor",
              required: true,
              description: "DTO class with @TableSearch fields.",
            },
            {
              name: "consumer",
              type: "(qw) => void",
              required: false,
              description: "Optional further wrapper tweaks.",
            },
          ],
        },
        {
          name: "getQueryWrapperAndPage",
          signature:
            "getQueryWrapperAndPage(form, Dto, pageNum?, pageSize?, consumer?)",
          description:
            "Returns { queryWrapper, page: { current, size } } for selectPage. Overload allows omitting page and passing only consumer.",
          returns: "QueryWrapperAndPage",
          params: [
            {
              name: "form",
              type: "object",
              required: true,
              description: "Plain JSON form.",
            },
            {
              name: "DtoClass",
              type: "Ctor",
              required: true,
              description: "DTO class with @TableSearch.",
            },
            {
              name: "pageNum",
              type: "number",
              required: false,
              description: "Page number.",
            },
            {
              name: "pageSize",
              type: "number",
              required: false,
              description: "Page size.",
            },
            {
              name: "consumer",
              type: "(qw) => void",
              required: false,
              description: "Optional wrapper tweaks.",
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
        "May mark a **method** or a **class**: on a class it wraps all prototype methods (except constructor).\nSame data source: REQUIRED (default) joins outer or starts new; REQUIRES_NEW suspends outer and opens a new transaction. No distributed transactions across data sources. Errors roll back.",
      apis: [
        {
          name: "@Transactional",
          signature:
            "@Transactional(options?: { datasource?: string; propagation?: TransactionPropagation })",
          description:
            "Within a transaction, same-source Db.queryOn / BaseMapper / method-level SQL decorators share one connection.",
          params: [
            {
              name: "datasource",
              type: "string",
              default: '"default"',
              description: "Data-source name",
            },
            {
              name: "propagation",
              type: '"REQUIRED" | "REQUIRES_NEW"',
              default: "REQUIRED",
              description: "Propagation behavior",
            },
          ],
        },
        {
          name: "Db.transaction / Db.transactionOn",
          signature:
            "Db.transaction(fn) / Db.transactionOn(name, fn, { propagation? })",
          description: "Functional transactions; share connection binding with the decorator.",
          params: [
            {
              name: "fn | name",
              type: "function | string",
              required: true,
              description: "transaction(fn) or transactionOn(name, …).",
            },
            {
              name: "fn",
              type: "() => Promise<T>",
              required: false,
              description: "transactionOn: work callback.",
            },
            {
              name: "propagation",
              type: "REQUIRED | REQUIRES_NEW",
              required: false,
              description: "Pass as { propagation } on transactionOn.",
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
      title: "Auto-fill (fill / MetaObjectHandler)",
      content:
        "Two fill layers before insert/update: ① global YAML orm.fill.* (column names) write create_time/update_time/create_by/update_by when value is undefined (operator from AuthUtil.getLoginIdDefaultNull); ② setMetaObjectHandler runs after default fill.\nAlso @TableField insertFill/updateFill. Table-level MapperOptions.fill=false disables default fill.",
      apis: [
        {
          name: "applyInsertFill / applyUpdateFill",
          description: "Called internally by BaseMapper; business code rarely needs them directly.",
        },
        {
          name: "setMetaObjectHandler / getMetaObjectHandler",
          signature: "setMetaObjectHandler({ insert?, update? })",
          description: "Insert/update hooks after default fill. Table expands MetaObjectHandler.",
          params: objectParamWithFields("en", {
            name: "handler",
            typeName: "MetaObjectHandler",
            required: true,
            summaryZh: "",
            summaryEn: "Required. Custom fill hooks.",
            fields: META_OBJECT_HANDLER_FIELDS,
          }),
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
      title: "Optimistic lock",
      content:
        "Global orm.optimisticLock or table-level @Mapper({ optimisticLock: true }). Updates add version to WHERE and increment version on success; throws OptimisticLockError when affected rows is 0.\nVersion column defaults to version (override with versionField).",
      apis: [
        {
          name: "optimisticLock / versionField",
          description: "Switch and column name; table-level can override global.",
        },
        {
          name: "OptimisticLockError",
          description: "Version conflict; Exception module has a built-in mapping.",
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
        "Multi–data-source facade; does not connect on import—connects on first query. When YAML host is non-empty, auto-registers named sources postgresql / sqlserver.",
      apis: [
        {
          name: "Db.register",
          signature: "Db.register(name, config) | Db.register(config)",
          description: "Register or override a data source.",
          params: [
            {
              name: "name",
              type: "string",
              required: false,
              description: "Datasource name when using (name, config).",
            },
            {
              name: "config",
              type: "DataSourceConfig",
              required: true,
              description: "Connection config; see config.* below.",
            },
            ...typeParams(DATA_SOURCE_CONFIG_FIELDS, "en", "config"),
          ],
        },
        {
          name: "Db.ensureDefault",
          description: "Ensure default comes from datasource.default, and register PG/MSSQL as needed.",
        },
        {
          name: "Db.query / Db.queryOn",
          signature: "Db.query(sql, params?) / Db.queryOn(name, sql, params?)",
          description: "Execute SQL; inside a transaction uses the current connection.",
          params: [
            {
              name: "sql | name",
              type: "string",
              required: true,
              description: "SQL, or datasource name for queryOn.",
            },
            {
              name: "sql | params",
              type: "string | unknown[]",
              required: false,
              description: "queryOn sql, or query params.",
            },
            {
              name: "params",
              type: "unknown[]",
              required: false,
              description: "queryOn bind params.",
            },
          ],
        },
        {
          name: "Db.getDialect",
          description: "Get data-source dialect (quoting, LIMIT, etc.).",
        },
        {
          name: "DataSourceConfig.type",
          description:
            "Canonical names mysql / postgresql / sqlserver; aliases mariadb, postgres/pg, mssql, etc. are recognized.",
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
      title: "XML Mapper entry",
      content:
        "Scanned via YAML orm.mapperLocations; bootstrapXmlMappers on module load; mapperReload enables hot reload. statement supports resultType and datasource attributes.",
      apis: [
        {
          name: "@MapperXml",
          signature: '@MapperXml("namespace")',
          description: "Bind class methods to XML statements under the same namespace with id=method name.",
          params: [
            {
              name: "namespace",
              type: "string",
              required: true,
              description: "XML mapper namespace.",
            },
          ],
        },
        {
          name: "xmlMapper / loadXmlMappers / ensureXmlMappersLoaded",
          description: "Functional bind and load entry points.",
        },
        {
          name: "parseMapperXml / renderStatementSql / evalTest / getXmlStatement",
          description: "Parse XML, render dynamic SQL from params, evaluate if test, get statement by namespace+id.",
        },
        {
          name: "bootstrapXmlMappers / watchXmlMappers",
          description: "Load from YAML at startup; watch changes in dev (requires mapperReload=true).",
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
      title: "XML dynamic SQL tags",
      content:
        "Supports common dynamic SQL nodes. Static text + dynamic tree render to final SQL and parameter list. Define <sql id> fragments for <include>.",
      apis: [
        {
          name: "<if test>",
          description: "test is an expression (evalTest); when true, concatenate child nodes. Common: roleId != null.",
        },
        {
          name: "<where>",
          description: "Wraps conditions; strips stray AND/OR and adds WHERE when there is content.",
        },
        {
          name: "<set>",
          description: "Dynamic UPDATE columns; strips trailing comma and adds SET.",
        },
        {
          name: "<trim>",
          description:
            "General trim: prefix / suffix / prefixOverrides / suffixOverrides (e.g. strip leading AND).",
        },
        {
          name: "<foreach>",
          description:
            "Iterate a collection: collection / item / index / open / close / separator. Common for IN (...).",
        },
        {
          name: "<include refid>",
          description: "Include a same-file <sql id=\"...\"> fragment.",
        },
        {
          name: "statement attributes",
          description: "id, resultType (optional), datasource (optional, data-source name).",
        },
      ],
      decoratorExampleTitle: "XML example",
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
      title: "SQL security helpers",
      content:
        "Value parameters always use ? placeholders. Identifiers and last() fragments are whitelisted—never splice user input into SQL structure.",
      apis: [
        {
          name: "assertIdent",
          signature: "assertIdent(name: string): string",
          description:
            "Validate table/column name: ^[a-zA-Z_][a-zA-Z0-9_]*$; rejects __proto__ etc. Throws on illegal.",
          params: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "SQL identifier to validate.",
            },
          ],
        },
        {
          name: "assertSafeUint",
          signature: "assertSafeUint(value, label?): number",
          description: "Non-negative safe integer (LIMIT / OFFSET / page number).",
          params: [
            {
              name: "value",
              type: "unknown",
              required: true,
              description: "Value that must be a safe unsigned int.",
            },
            {
              name: "label",
              type: "string",
              required: false,
              description: "Label for error messages.",
            },
          ],
        },
        {
          name: "escapeLike",
          signature: "escapeLike(value: string): string",
          description: "Escape \\ % _ so user input cannot widen LIKE matches.",
          params: [
            {
              name: "value",
              type: "string",
              required: true,
              description: "Raw LIKE pattern fragment to escape.",
            },
          ],
        },
        {
          name: "assertSafeLastSql",
          signature: "assertSafeLastSql(sql: string): string",
          description:
            "QueryWrapper.last() only allows: LIMIT n [OFFSET m] / FOR UPDATE / LOCK IN SHARE MODE.",
          params: [
            {
              name: "sql",
              type: "string",
              required: true,
              description: "Trailing SQL fragment to validate.",
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
      title: "Multi-database Dialect",
      content:
        "getDialect(type) shares canonical names with DataSourceConfig.type. Auto-registered source names: default / postgresql / sqlserver (not pg).",
      apis: [
        {
          name: "getDialect",
          signature: 'getDialect("mysql"|"postgresql"|"sqlserver"|alias): Dialect',
          description:
            "Aliases: mariadb→mysql; postgres/pg→postgresql; mssql/sql-server→sqlserver.",
          params: [
            {
              name: "type",
              type: "\"mysql\"|\"postgresql\"|\"sqlserver\"|alias",
              required: true,
              description: "DB type or alias.",
            },
          ],
        },
        {
          name: "Dialect.quoteIdent",
          description: "Identifier quoting: MySQL \`col\`; PG/MSSQL \"col\".",
        },
        {
          name: "Dialect.convertPlaceholders",
          description: "Convert ? to driver placeholders (e.g. PG $1, $2).",
        },
        {
          name: "Dialect.appendLimitOffset",
          description: "Pagination syntax differences (LIMIT/OFFSET or equivalent).",
        },
        {
          name: "Dialect.prepareInsert / extractInsertId",
          description: "Insert statement and auto-increment ID backfill differences.",
        },
        {
          name: "QueryWrapper.forDatasource",
          description: "Pick dialect from a registered source so default MySQL quoting is not used on PG.",
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
      title: "Runtime config and SQL log API",
      apis: [
        {
          name: "configureOrm",
          signature: "configureOrm(patch: Partial<ResolvedOrmConfig>)",
          description:
            "Runtime override of global ORM config; clears table cache. Table expands ResolvedOrmConfig patch fields.",
          params: objectParamWithFields("en", {
            name: "patch",
            typeName: "Partial<ResolvedOrmConfig>",
            required: true,
            summaryZh: "",
            summaryEn: "Required. Pass only fields to override.",
            fields: RESOLVED_ORM_CONFIG_FIELDS,
          }),
        },
        {
          name: "getOrmConfig",
          description: "Read ResolvedOrmConfig after YAML + configure merge.",
        },
        {
          name: "setMetaObjectHandler",
          signature: "setMetaObjectHandler({ insert?, update? })",
          description: "Insert/update hooks after default fill. Table expands MetaObjectHandler.",
          params: objectParamWithFields("en", {
            name: "handler",
            typeName: "MetaObjectHandler",
            required: true,
            summaryZh: "",
            summaryEn: "Required. Custom fill hooks.",
            fields: META_OBJECT_HANDLER_FIELDS,
          }),
        },
        {
          name: "configureSqlLog",
          signature: "configureSqlLog({ enabled, format?, parts?, level? })",
          description: "Fine-grained switch; format may be a template string or (SqlLogInfo)=>string.",
          params: [
            {
              name: "enabled",
              type: "boolean",
              required: false,
              description: "Enable SQL logging.",
            },
            {
              name: "format",
              type: "string | fn",
              required: false,
              description: "Log format template or function.",
            },
            {
              name: "parts",
              type: "SqlLogParts",
              required: false,
              description: "Which parts to include.",
            },
            {
              name: "level",
              type: "LogLevel",
              required: false,
              description: "Log level.",
            },
          ],
        },
        {
          name: "getSqlLogRuntime / renderSqlLog / detectSqlType",
          description: "Read current log runtime; render one log line; detect SELECT/INSERT/UPDATE/DELETE etc.",
        },
        {
          name: "DEFAULT_SQL_LOG_FORMAT",
          description: 'Default template: {time} [{type}] {cost}ms | {sql} | params={params}',
        },
        {
          name: "OrmError / OptimisticLockError",
          description: "ORM exceptions; optimistic-lock conflicts throw OptimisticLockError.",
        },
        {
          name: "mapResultRow / mapResultRows",
          description: "Result-row mapping (including underscore to camelCase).",
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
  title: "ORM · Configuration",
  description:
    "application.yaml → orm / datasource; override at runtime with configureOrm(patch). Table-level MapperTableOptions further overrides globals.",
  sections: [
    {
      id: "yaml",
      title: "YAML orm",
      configs: [
        {
          name: "logicDelete",
          type: "boolean",
          default: "true",
          description: "Global logic delete. Tables without delete_flag need @Mapper({ logicDelete: false })",
        },
        {
          name: "logicDeleteField",
          type: "string",
          default: "delete_flag",
          description: "Logic-delete column name",
        },
        {
          name: "logicDeleteValue",
          type: "any",
          default: "1",
          description: "Value written when deleted",
        },
        {
          name: "logicNotDeleteValue",
          type: "any",
          default: "0",
          description: "Value used in not-deleted conditions",
        },
        {
          name: "optimisticLock",
          type: "boolean",
          default: "false",
          description: "Global optimistic lock",
        },
        {
          name: "versionField",
          type: "string",
          default: "version",
          description: "Version column name",
        },
        {
          name: "idType",
          type: "IdType",
          default: "ASSIGN_ID",
          description: "Global primary-key strategy: AUTO | NONE | INPUT | ASSIGN_ID | ASSIGN_UUID",
        },
        {
          name: "mapUnderscoreToCamelCase",
          type: "boolean",
          default: "true",
          description: "Map query result columns underscore → camelCase",
        },
        {
          name: "workerId",
          type: "number",
          default: "1",
          description: "Snowflake worker id 0–1023",
        },
        {
          name: "fill.createTime",
          type: "string",
          default: "create_time",
          description: "Auto-fill create-time column name; empty string disables",
        },
        {
          name: "fill.updateTime",
          type: "string",
          default: "update_time",
          description: "Auto-fill update-time column name",
        },
        {
          name: "fill.createBy",
          type: "string",
          default: "create_by",
          description: "Auto-fill created-by column name",
        },
        {
          name: "fill.updateBy",
          type: "string",
          default: "update_by",
          description: "Auto-fill updated-by column name",
        },
        {
          name: "batch.insertSize",
          type: "number",
          default: "200",
          description: "Rows per saveBatch chunk",
        },
        {
          name: "batch.updateSize",
          type: "number",
          default: "200",
          description: "Entities per updateBatch chunk",
        },
        {
          name: "batch.inSize",
          type: "number",
          default: "500",
          description: "IN chunk size for QueryWrapper.in / deleteByIds etc.",
        },
        {
          name: "mapperLocations",
          type: "string[]",
          default: "[]",
          description: "XML path globs, relative to project root or absolute; empty = disabled",
        },
        {
          name: "mapperReload",
          type: "boolean",
          default: "false",
          description: "Hot-reload XML on change in development",
        },
        {
          name: "sqlLog.enabled",
          type: "boolean",
          default: "false",
          description: "SQL log; off by default in production; explicit enable warns and redacts password/token",
        },
        {
          name: "sqlLog.format",
          type: "string",
          default: "{time} [{type}] {cost}ms | {sql} | params={params}",
          description: "Log template placeholders: time / type / sql / params / cost",
        },
        {
          name: "sqlLog.level",
          type: "trace|debug|info|warn",
          default: "info",
          description: "SQL log level",
        },
        {
          name: "sqlLog.parts.*",
          type: "boolean",
          default: "true",
          description: "Per-part switches for time / type / sql / params / cost",
        },
      ],
      functionalExampleTitle: "Config example",
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
      title: "MapperTableOptions (table-level overrides)",
      configs: [
        {
          name: "idField",
          type: "string",
          default: "id",
          description: "Primary-key property/column name",
        },
        {
          name: "datasource",
          type: "string",
          default: '"default"',
          description: "Registered data-source name (recommended); do not confuse with type-only db",
        },
        {
          name: "logicDelete",
          type: "boolean",
          description: "Override global; set false for tables without a logic-delete field",
        },
        {
          name: "logicDeleteField / Value / NotDeleteValue",
          type: "string | any",
          description: "Table-level logic-delete field and values",
        },
        {
          name: "optimisticLock / versionField",
          type: "boolean / string",
          description: "Table-level optimistic lock",
        },
        {
          name: "fill",
          type: "boolean",
          default: "true",
          description: "Whether to auto-fill create/update fields",
        },
        {
          name: "updateNullStrategy",
          type: '"INCLUDE" | "IGNORE"',
          default: "INCLUDE",
          description: "On update, null: INCLUDE writes NULL; IGNORE skips. undefined is never written",
        },
        {
          name: "entity",
          type: "Function",
          description: "Entity class for field fill and result hydration",
        },
      ],
      functionalExampleTitle: "Config example",
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
      title: "Data source datasource.*",
      content:
        "default is the default DB; postgresql / sqlserver auto-register as same-named sources when host is non-empty. Connections are lazy—pool is created on first query.",
      configs: [
        {
          name: "type",
          type: "mysql | postgresql | sqlserver",
          default: "mysql",
          description: "DB type; aliases mariadb / postgres / pg / mssql are recognized",
        },
        {
          name: "host",
          type: "string",
          description: "Host; optional sources with empty host are not registered",
        },
        {
          name: "port",
          type: "number",
          description: "Port (defaults by type)",
        },
        {
          name: "user / password / database",
          type: "string",
          description: "Credentials and database name",
        },
        {
          name: "connectionLimit",
          type: "number",
          default: "10",
          description: "Connection pool size",
        },
        {
          name: "enabled",
          type: "boolean",
          description: "false skips registration; if omitted and host is non-empty, registers",
        },
        {
          name: "name",
          type: "string",
          description: "Data-source name when registering in code; YAML key is the name",
        },
      ],
      functionalExampleTitle: "Config example",
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
