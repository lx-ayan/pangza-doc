import { Button, Typography, theme } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Text } = Typography;

export function CodeBlock({
  code,
  title,
}: {
  code: string;
  title?: string;
}) {
  const { token } = theme.useToken();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        margin: "12px 0 20px",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
        background: "#0f172a",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
        }}
      >
        <Text style={{ color: "#94a3b8", fontSize: 12 }}>
          {title ?? "TypeScript"}
        </Text>
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={onCopy}
          style={{ color: "#cbd5e1" }}
        >
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 16,
          overflow: "auto",
          color: "#e2e8f0",
          fontSize: 13,
          lineHeight: 1.65,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
