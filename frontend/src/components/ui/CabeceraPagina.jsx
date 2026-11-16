// UI · Encabezado de pantalla: volver, antetítulo, título y descripción.
import { Flex, Typography } from "antd";

export default function CabeceraPagina({ volver, eyebrow, titulo, descripcion, extra }) {
  return (
    <div>
      {volver && <a href={volver.href}>← {volver.texto}</a>}
      <Flex justify="space-between" align="flex-start" gap={16} wrap style={{ marginTop: volver ? 12 : 0 }}>
        <div>
          {eyebrow && <Typography.Text type="secondary">{eyebrow}</Typography.Text>}
          <Typography.Title level={2} style={{ margin: 0 }}>{titulo}</Typography.Title>
          {descripcion && <Typography.Paragraph type="secondary" style={{ margin: "4px 0 0" }}>{descripcion}</Typography.Paragraph>}
        </div>
        {extra}
      </Flex>
    </div>
  );
}
