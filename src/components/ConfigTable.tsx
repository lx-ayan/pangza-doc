import { Table, Typography } from "antd";
import { useLocale } from "../i18n";
import type { ConfigItem } from "../types/doc";

const { Text } = Typography;

export function ConfigTable({ items }: { items: ConfigItem[] }) {
  const { t } = useLocale();
  return (
    <Table
      size="middle"
      pagination={false}
      rowKey={(r) => r.name}
      dataSource={items}
      scroll={{ x: true }}
      columns={[
        {
          title: t("doc.configName"),
          dataIndex: "name",
          width: 200,
          render: (v: string) => <Text code>{v}</Text>,
        },
        {
          title: t("doc.type"),
          dataIndex: "type",
          width: 160,
          render: (v: string) => <Text type="secondary">{v}</Text>,
        },
        {
          title: t("doc.default"),
          dataIndex: "default",
          width: 140,
          render: (v?: string) =>
            v != null && v !== "" ? <Text code>{v}</Text> : "—",
        },
        {
          title: t("doc.configDesc"),
          dataIndex: "description",
        },
      ]}
    />
  );
}
