import { Table, Tag, Typography } from "antd";
import { useLocale } from "../i18n";
import type { ApiItem, ApiParam } from "../types/doc";

const { Paragraph, Text, Title } = Typography;

function ParamsTable({ params }: { params: ApiParam[] }) {
  const { t } = useLocale();
  return (
    <Table
      size="small"
      pagination={false}
      rowKey={(r) => r.name}
      dataSource={params}
      scroll={{ x: true }}
      columns={[
        {
          title: t("doc.param"),
          dataIndex: "name",
          width: 140,
          render: (v: string) => <Text code>{v}</Text>,
        },
        {
          title: t("doc.type"),
          dataIndex: "type",
          width: 160,
          render: (v: string) => <Text type="secondary">{v}</Text>,
        },
        {
          title: t("doc.required"),
          dataIndex: "required",
          width: 72,
          render: (v?: boolean) =>
            v ? <Tag color="red">{t("doc.yes")}</Tag> : <Tag>{t("doc.no")}</Tag>,
        },
        {
          title: t("doc.default"),
          dataIndex: "default",
          width: 120,
          render: (v?: string) => (v ? <Text code>{v}</Text> : "—"),
        },
        {
          title: t("doc.description"),
          dataIndex: "description",
        },
      ]}
    />
  );
}

export function ApiTable({ items }: { items: ApiItem[] }) {
  const { t } = useLocale();
  return (
    <div>
      {items.map((api) => (
        <div
          key={api.name}
          id={api.name.replace(/[^a-zA-Z0-9_@.]/g, "-")}
          style={{ marginBottom: 28 }}
        >
          <Title level={4} style={{ marginBottom: 8 }}>
            <Text code style={{ fontSize: 16 }}>
              {api.name}
            </Text>
          </Title>
          {api.signature ? (
            <Paragraph>
              <Text type="secondary">{t("doc.signature")}</Text>
              <Text code>{api.signature}</Text>
            </Paragraph>
          ) : null}
          <Paragraph>{api.description}</Paragraph>
          {api.returns ? (
            <Paragraph>
              <Text type="secondary">{t("doc.returns")}</Text>
              {api.returns}
            </Paragraph>
          ) : null}
          {api.params && api.params.length > 0 ? (
            <ParamsTable params={api.params} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
