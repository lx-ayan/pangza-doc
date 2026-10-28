import { Avatar, Card, Layout, List, Typography, theme } from "antd";
import { useLocale } from "../i18n";
import { SiteHeader } from "../layouts/SiteHeader";

const { Content } = Layout;
const { Title, Paragraph, Link: ALink } = Typography;

export function Contributors() {
  const { token } = theme.useToken();
  const { t } = useLocale();

  const contributors = [
    {
      name: "lx-ayan",
      role: t("contributors.role"),
      link: "https://github.com/lx-ayan",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <SiteHeader />
      <Content style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <Title level={2}>{t("contributors.title")}</Title>
        <Paragraph type="secondary">
          {t("contributors.desc")}{" "}
          <ALink
            href="https://github.com/lx-ayan/pangza-admin-express"
            target="_blank"
          >
            pangza-admin-express
          </ALink>
          .
        </Paragraph>
        <Card>
          <List
            itemLayout="horizontal"
            dataSource={contributors}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{ background: token.colorPrimary }}
                      size="large"
                    >
                      {item.name.slice(0, 1).toUpperCase()}
                    </Avatar>
                  }
                  title={
                    <ALink href={item.link} target="_blank">
                      {item.name}
                    </ALink>
                  }
                  description={item.role}
                />
              </List.Item>
            )}
          />
        </Card>
      </Content>
    </Layout>
  );
}
