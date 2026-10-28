import { Anchor, Divider, Typography } from "antd";
import { useMemo } from "react";
import { isConfigExampleTitle, useLocale } from "../i18n";
import type { DocPage } from "../types/doc";
import { ApiTable } from "./ApiTable";
import { CodeBlock } from "./CodeBlock";
import { ConfigTable } from "./ConfigTable";

const { Title, Paragraph } = Typography;

export function DocArticle({ page }: { page: DocPage }) {
  const { t } = useLocale();

  const anchors = useMemo(
    () =>
      page.sections.map((s) => ({
        key: s.id,
        href: `#${s.id}`,
        title: s.title,
      })),
    [page.sections]
  );

  return (
    <div className="doc-article">
      <div className="doc-article__main">
        <Title level={2} style={{ marginTop: 0 }}>
          {page.title}
        </Title>
        {page.description ? (
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            {page.description}
          </Paragraph>
        ) : null}

        {page.sections.map((section) => {
          const isMajor =
            section.title === "API" ||
            section.title === "配置项" ||
            section.title === "Configuration";

          const decoratorTitle =
            section.decoratorExampleTitle ?? t("doc.decorator");
          const functionalTitle = section.functionalExampleTitle
            ? isConfigExampleTitle(section.functionalExampleTitle)
              ? t("doc.configExample")
              : section.functionalExampleTitle
            : t("doc.functional");

          return (
            <section
              key={section.id}
              id={section.id}
              style={{ scrollMarginTop: 88 }}
            >
              <Divider />
              <Title level={isMajor ? 3 : 4}>{section.title}</Title>
              {section.content
                ? section.content.split("\n").map((line, i) =>
                    line.trim() ? (
                      <Paragraph key={i}>{line}</Paragraph>
                    ) : (
                      <br key={i} />
                    )
                  )
                : null}

              {section.apis && section.apis.length > 0 ? (
                <ApiTable items={section.apis} />
              ) : null}

              {section.configs && section.configs.length > 0 ? (
                <ConfigTable items={section.configs} />
              ) : null}

              {section.decoratorExample ? (
                <>
                  <Title level={5}>{decoratorTitle}</Title>
                  <CodeBlock
                    code={section.decoratorExample}
                    title={section.decoratorExampleTitle ?? t("doc.decoratorShort")}
                  />
                </>
              ) : null}

              {section.functionalExample ? (
                <>
                  <Title level={5}>{functionalTitle}</Title>
                  <CodeBlock
                    code={section.functionalExample}
                    title={
                      isConfigExampleTitle(section.functionalExampleTitle)
                        ? t("doc.configExample")
                        : (section.functionalExampleTitle ??
                          t("doc.functionalShort"))
                    }
                  />
                </>
              ) : null}
            </section>
          );
        })}
      </div>

      <aside className="doc-article__toc">
        <Anchor affix={false} offsetTop={88} items={anchors} />
      </aside>
    </div>
  );
}
