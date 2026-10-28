# Pangza Docs (doc-ui)

Pangza（`@pangza/*`）框架文档站（Ant Design + React Router）。

## 开发

```bash
npm install
npm run dev
```

## 结构

- 左上角 Logo → 首页
- 右上角：指南 / 文档 / 更新日志 / 贡献者 / GitHub
- 文档侧栏：分组展示「指南」「核心模块」
  - 核心模块仅显示模块名；文内分「API」「配置项」两节
  - 含装饰器与函数式双示例
  - 导入按真实分包：`@pangza/core` / `orm` / `validate` / `redis` / `auth` …

需求见 [DOC.md](./DOC.md)。
