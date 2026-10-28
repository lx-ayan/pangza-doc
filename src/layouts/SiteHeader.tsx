import { GithubOutlined, MenuOutlined, TranslationOutlined } from "@ant-design/icons";
import { Button, Drawer, Layout, Segmented, Space, theme } from "antd";
import { useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HEADER_LINK_DEFS } from "../data/nav";
import { LOCALES, useLocale, type MessageKey } from "../i18n";

const { Header } = Layout;

export function SiteHeader() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  const linkStyle = (active: boolean): CSSProperties => ({
    color: active ? token.colorPrimary : token.colorText,
    fontWeight: active ? 600 : 500,
    textDecoration: "none",
    padding: "6px 10px",
    borderRadius: 6,
  });

  const LangSwitch = (
    <Segmented
      size="small"
      value={locale}
      options={LOCALES.map((l) => ({ label: l.label, value: l.value }))}
      onChange={(v) => setLocale(v as "zh" | "en")}
      aria-label={t("header.lang")}
    />
  );

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <Space size={4} wrap align="center">
      {HEADER_LINK_DEFS.map((item) => {
        const label = t(item.labelKey as MessageKey);
        if (item.href) {
          return (
            <a
              key={item.key}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              style={linkStyle(false)}
              onClick={onNavigate}
            >
              {item.key === "github" ? (
                <>
                  <GithubOutlined /> {label}
                </>
              ) : (
                label
              )}
            </a>
          );
        }
        const path = item.path ?? "/";
        const active = path.startsWith("/docs/guide")
          ? location.pathname.startsWith("/docs/guide")
          : path.startsWith("/docs/modules")
            ? location.pathname.startsWith("/docs/modules")
            : location.pathname === path;
        return (
          <Link
            key={item.key}
            to={path}
            style={linkStyle(active)}
            onClick={onNavigate}
          >
            {label}
          </Link>
        );
      })}
      <span className="site-header__lang-desktop" style={{ marginLeft: 8 }}>
        {LangSwitch}
      </span>
    </Space>
  );

  return (
    <Header
      className="site-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        height: 64,
        lineHeight: "64px",
      }}
    >
      <button
        type="button"
        className="site-logo"
        onClick={() => navigate("/")}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 0,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${token.colorPrimary}, #0ea5e9)`,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          P
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: token.colorText }}>
          {t("brand.name")}
        </span>
      </button>

      <div className="site-header__desktop">
        <NavLinks />
      </div>

      <Space className="site-header__mobile" size={4}>
        <span title={t("header.lang")}>
          <TranslationOutlined style={{ color: token.colorTextSecondary }} />
        </span>
        {LangSwitch}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setOpen(true)}
        />
      </Space>

      <Drawer
        title={t("header.nav")}
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        width={280}
      >
        <NavLinks onNavigate={() => setOpen(false)} />
      </Drawer>
    </Header>
  );
}
