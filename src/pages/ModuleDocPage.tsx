import { Result } from "antd";
import { useParams } from "react-router-dom";
import { DocArticle } from "../components/DocArticle";
import { getModulePage } from "../data/modules";
import { useLocale } from "../i18n";

export function ModuleDocPage() {
  const { module } = useParams();
  const { locale, t } = useLocale();

  if (!module) {
    return <Result status="404" title={t("doc.pageNotFound")} />;
  }
  const page = getModulePage(module, locale);
  if (!page) {
    return (
      <Result status="404" title={t("doc.moduleNotFound")} subTitle={module} />
    );
  }
  return <DocArticle page={page} />;
}
