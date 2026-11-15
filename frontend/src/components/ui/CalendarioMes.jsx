// UI · Calendario mensual. eventosDelDia(fechaISO) devuelve lo que se muestra en cada día.
import { Calendar } from "antd";
import dayjs from "dayjs";

export default function CalendarioMes({ mes, onCambiarMes, eventosDelDia }) {
  return (
    <Calendar
      value={dayjs(`${mes}-01`)}
      onPanelChange={(fecha) => onCambiarMes(fecha.format("YYYY-MM"))}
      onSelect={(fecha, { source }) => { if (source !== "date") onCambiarMes(fecha.format("YYYY-MM")); }}
      mode="month"
      cellRender={(fecha, info) => (info.type === "date" && fecha.format("YYYY-MM") === mes ? eventosDelDia(fecha.format("YYYY-MM-DD")) : null)}
    />
  );
}
