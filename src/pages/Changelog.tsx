import { Card, Layout, Tag, Timeline, Typography, theme } from "antd";
import { getChangelog, LATEST_VERSION } from "../data/changelog";
import { useLocale } from "../i18n";
import { SiteHeader } from "../layouts/SiteHeader";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export function Changelog() {
  const { token } = theme.useToken();
  const { locale, t } = useLocale();
  const entries = getChangelog(locale);

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <SiteHeader />
      <Content style={{ maxWidth: 880, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            {t("changelog.title")}
          </Title>
          <Tag color="blue">
            {t("changelog.latest")}: v{LATEST_VERSION}
          </Tag>
        </div>
        <Paragraph type="secondary" style={{ marginBottom: 28 }}>
          {t("changelog.subtitle")}
        </Paragraph>

        <Timeline
          items={entries.map((entry, index) => ({
            color: index === 0 ? "blue" : "gray",
            children: (
              <Card
                size="small"
                style={{ marginBottom: 8 }}
                styles={{ body: { padding: "16px 18px" } }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <Text strong style={{ fontSize: 18 }}>
                    v{entry.version}
                  </Text>
                  <Text type="secondary">{entry.date}</Text>
                  {index === 0 ? (
                    <Tag color="processing">{t("changelog.current")}</Tag>
                  ) : null}
                </div>
                {entry.title ? (
                  <Paragraph style={{ marginBottom: 10 }}>{entry.title}</Paragraph>
                ) : null}
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {entry.changes.map((line) => (
                    <li key={line} style={{ marginBottom: 6 }}>
                      <Text>{line}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            ),
          }))}
        />
      </Content>
    </Layout>
  );
}
