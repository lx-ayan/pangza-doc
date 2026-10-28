import type { Locale } from "../i18n/types";
import type { NavGroup } from "../types/doc";

/** 核心模块：与 framework 顶层文件夹一一对应 */
export const CORE_MODULES = [
  "Application",
  "Auth",
  "config",
  "encrypt",
  "Exception",
  "Json",
  "langchain",
  "Log",
  "Logger",
  "ORM",
  "Redis",
  "schedule",
  "Service",
  "types",
  "utils",
  "Validate",
] as const;

export type CoreModule = (typeof CORE_MODULES)[number];

export type HeaderLink =
  | { key: string; labelKey: string; path: string; href?: never }
  | { key: string; labelKey: string; href: string; path?: never };

export const HEADER_LINK_DEFS: HeaderLink[] = [
  { key: "guide", labelKey: "header.guide", path: "/docs/guide/intro" },
  { key: "docs", labelKey: "header.docs", path: "/docs/modules/Application" },
  { key: "changelog", labelKey: "header.changelog", path: "/changelog" },
  {
    key: "contributors",
    labelKey: "header.contributors",
    path: "/contributors",
  },
  {
    key: "github",
    labelKey: "header.github",
    href: "https://github.com/lx-ayan/pangza-admin-express",
  },
];

const GUIDE_LABEL_KEYS: Record<string, string> = {
  intro: "nav.intro",
  quickstart: "nav.quickstart",
  architecture: "nav.architecture",
  examples: "nav.examples",
};

export function getDocsSidebar(locale: Locale): NavGroup[] {
  void locale; // labels resolved in layout via t()
  return [
    {
      key: "guide",
      label: "nav.guide",
      children: [
        { key: "intro", label: "nav.intro", path: "/docs/guide/intro" },
        {
          key: "quickstart",
          label: "nav.quickstart",
          path: "/docs/guide/quickstart",
        },
        {
          key: "architecture",
          label: "nav.architecture",
          path: "/docs/guide/architecture",
        },
        {
          key: "examples",
          label: "nav.examples",
          path: "/docs/guide/examples",
        },
      ],
    },
    {
      key: "core",
      label: "nav.core",
      children: CORE_MODULES.map((mod) => ({
        key: mod,
        label: mod,
        path: `/docs/modules/${mod}`,
      })),
    },
  ];
}

/** Keep for any static imports */
export const GUIDE_NAV: NavGroup = getDocsSidebar("zh")[0]!;
export const CORE_NAV: NavGroup = getDocsSidebar("zh")[1]!;
export const DOCS_SIDEBAR: NavGroup[] = getDocsSidebar("zh");

export { GUIDE_LABEL_KEYS };
