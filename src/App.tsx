import { App as AntApp, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LocaleProvider, useLocale } from "./i18n";
import { DocsLayout } from "./layouts/DocsLayout";
import { Changelog } from "./pages/Changelog";
import { Contributors } from "./pages/Contributors";
import { GuidePage } from "./pages/GuidePage";
import { Home } from "./pages/Home";
import { ModuleDocPage } from "./pages/ModuleDocPage";
import "./App.css";

function AppRoutes() {
  const { locale } = useLocale();
  const antdLocale = locale === "zh" ? zhCN : enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
          fontFamily:
            '"Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/contributors" element={<Contributors />} />
            <Route path="/docs" element={<DocsLayout />}>
              <Route index element={<Navigate to="guide/intro" replace />} />
              <Route path="guide/:slug" element={<GuidePage />} />
              <Route path="modules/:module" element={<ModuleDocPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AppRoutes />
    </LocaleProvider>
  );
}
