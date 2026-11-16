// UI · Configura antd para toda la app: idioma español y color principal.
import { ConfigProvider, App as AppAntd } from "antd";
import esES from "antd/locale/es_ES";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function ProveedorUI({ children }) {
  return (
    <ConfigProvider locale={esES} theme={{ token: { colorPrimary: "#174b85", borderRadius: 8 }, components: { Calendar: { itemActiveBg: "#e6eef8" } } }}>
      <AppAntd>{children}</AppAntd>
    </ConfigProvider>
  );
}
