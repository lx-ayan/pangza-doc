import {
  ArrowRightOutlined,
  BookOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Layout, Row, Space, Typography, theme } from "antd";
import { Link } from "react-router-dom";
import { CORE_MODULES } from "../data/nav";
import { useLocale } from "../i18n";
import { SiteHeader } from "../layouts/SiteHeader";

const { Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export function Home() {
  const { token } = theme.useToken();
  const { t } = useLocale();

  const guides = [
    {
      to: "/docs/guide/intro",
      title: t("home.guide.intro"),
      desc: t("home.guide.introDesc"),
    },
    {
      to: "/docs/guide/quickstart",
      title: t("home.guide.quickstart"),
      desc: t("home.guide.quickstartDesc"),
    },
    {
      to: "/docs/guide/architecture",
      title: t("home.guide.architecture"),
      desc: t("home.guide.architectureDesc"),
    },
    {
      to: "/docs/guide/examples",
      title: t("home.guide.examples"),
      desc: t("home.guide.examplesDesc"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <SiteHeader />
      <Content>
        <section
          className="home-hero"
          style={{
            padding: "64px 24px 48px",
            background: `linear-gradient(160deg, ${token.colorPrimaryBg} 0%, #fff 55%, ${token.colorInfoBg} 100%)`,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Text
              style={{
                color: token.colorPrimary,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {t("home.eyebrow")}
            </Text>
            <Title
              style={{
                marginTop: 12,
                marginBottom: 16,
                fontSize: "clamp(28px, 5vw, 44px)",
              }}
            >
              {t("home.title")}
            </Title>
            <Paragraph
              style={{
                fontSize: 17,
                maxWidth: 640,
                color: token.colorTextSecondary,
              }}
            >
              {t("home.subtitle")}
            </Paragraph>
            <Space wrap size="middle" style={{ marginTop: 8 }}>
              <Link to="/docs/guide/intro">
                <Button type="primary" size="large" icon={<BookOutlined />}>
                  {t("home.start")}
                </Button>
              </Link>
              <Link to="/docs/modules/Application">
                <Button size="large" icon={<ArrowRightOutlined />}>
                  {t("home.modules")}
                </Button>
              </Link>
              <Button
                size="large"
                icon={<GithubOutlined />}
                href="https://github.com/lx-ayan/pangza-admin-express"
                target="_blank"
              >
                {t("header.github")}
              </Button>
            </Space>
          </div>
        </section>

        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "32px 24px 64px",
          }}
        >
          <Title level={3}>{t("home.guide")}</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 36 }}>
            {guides.map((item) => (
              <Col xs={24} sm={12} md={6} key={item.to}>
                <Link to={item.to} style={{ textDecoration: "none" }}>
                  <Card hoverable size="small" title={item.title}>
                    <Text type="secondary">{item.desc}</Text>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>

          <Title level={3}>{t("home.modules")}</Title>
          <Row gutter={[12, 12]}>
            {CORE_MODULES.map((mod) => (
              <Col xs={12} sm={8} md={6} lg={4} key={mod}>
                <Link
                  to={`/docs/modules/${mod}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    hoverable
                    size="small"
                    styles={{ body: { textAlign: "center", padding: 16 } }}
                  >
                    <Text strong>{mod}</Text>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </section>
      </Content>
      <Footer style={{ textAlign: "center" }}>{t("home.footer")}</Footer>
    </Layout>
  );
}
