import { Button, Drawer, Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getDocsSidebar } from "../data/nav";
import { useLocale, type MessageKey } from "../i18n";
import { SiteHeader } from "./SiteHeader";

const { Sider, Content } = Layout;

export function DocsLayout() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebar = useMemo(() => getDocsSidebar(locale), [locale]);

  const selectedKeys = useMemo(() => {
    for (const group of sidebar) {
      for (const child of group.children) {
        if (location.pathname === child.path) return [child.key];
      }
    }
    return [];
  }, [location.pathname, sidebar]);

  const menuItems: MenuProps["items"] = sidebar.map((group) => ({
    type: "group",
    key: group.key,
    label: group.label.startsWith("nav.")
      ? t(group.label as MessageKey)
      : group.label,
    children: group.children.map((c) => ({
      key: c.key,
      label: c.label.startsWith("nav.") ? t(c.label as MessageKey) : c.label,
      onClick: () => {
        navigate(c.path);
        setDrawerOpen(false);
      },
    })),
  }));

  const SideMenu = (
    <Menu
      mode="inline"
      selectable
      selectedKeys={selectedKeys}
      items={menuItems}
      style={{
        borderInlineEnd: "none",
        height: "100%",
        overflow: "auto",
        paddingTop: 8,
      }}
    />
  );

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <SiteHeader />
      <Layout>
        <Sider
          width={260}
          className="docs-sider"
          style={{
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            height: "calc(100vh - 64px)",
            position: "sticky",
            top: 64,
            overflow: "auto",
          }}
        >
          {SideMenu}
        </Sider>

        <Content style={{ padding: "24px 20px 48px", minWidth: 0 }}>
          <div className="docs-mobile-menu-btn">
            <Button onClick={() => setDrawerOpen(true)}>
              {t("nav.docsMenu")}
            </Button>
          </div>
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              background: token.colorBgContainer,
              borderRadius: 12,
              padding: "24px 28px",
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Drawer
        title={t("nav.docsMenu")}
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={300}
        styles={{ body: { padding: 0 } }}
      >
        {SideMenu}
      </Drawer>
    </Layout>
  );
}
