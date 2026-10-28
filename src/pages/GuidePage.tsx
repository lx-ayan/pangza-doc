import { Result } from "antd";
import { useParams } from "react-router-dom";
import { DocArticle } from "../components/DocArticle";
import { getGuidePage } from "../data/guide";
import { useLocale } from "../i18n";

export function GuidePage() {
  const { slug } = useParams();
  const { locale, t } = useLocale();
  const page = slug ? getGuidePage(slug, locale) : undefined;
  if (!page) {
    return <Result status="404" title={t("doc.guideNotFound")} />;
  }
  return <DocArticle page={page} />;
}
