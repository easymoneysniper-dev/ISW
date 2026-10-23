// Permisos de navegación basados en Requisitos por módulo – Grupo 3.
// Cada endpoint futuro debe comprobar también el rol en el backend.
export const nombresRoles = {
  DUENO: "Dueño",
  CONTADOR: "Contador",
  JEFE_TECNICO: "Jefe de Área Técnica",
  ADMIN_DESARROLLO: "Administrador de desarrollo",
};

export const modulos = [
  {
    "id": "transmisiones",
    "titulo": "Transmisiones y cotización",
    "descripcion": "Organiza eventos, cotizaciones y clientes.",
    "responsable": "Gabriel",
    "acciones": [
      {
        "id": "registro",
        "titulo": "Registrar y cotizar transmisión",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "estados",
        "titulo": "Estados y confirmación",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "cambios",
        "titulo": "Cambios y cancelaciones",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "calendario",
        "titulo": "Calendario y clientes",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      }
    ]
  },
  {
    "id": "personal",
    "titulo": "Personal y asignaciones",
    "descripcion": "Coordina al equipo y sus comisiones.",
    "responsable": "Teo",
    "acciones": [
      {
        "id": "trabajadores",
        "titulo": "Trabajadores y disponibilidad",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "asignaciones",
        "titulo": "Asignaciones y porcentajes",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "asistencia",
        "titulo": "Reemplazos y asistencia",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "comisiones",
        "titulo": "Liquidación de comisiones",
        "roles": [
          "CONTADOR"
        ],
        "consulta": []
      }
    ]
  },
  {
    "id": "inventario",
    "titulo": "Inventario y kits",
    "descripcion": "Controla equipos, kits y movimientos.",
    "responsable": "Alexis",
    "acciones": [
      {
        "id": "equipos",
        "titulo": "Equipos",
        "disponible": true,
        "descripcion": "Inventario, fichas de equipos y compras mensuales.",
        "roles": [
          "DUENO",
          "JEFE_TECNICO"
        ],
        "consulta": [
          "DUENO"
        ]
      },
      {
        "id": "kits",
        "titulo": "Kits",
        "roles": [
          "DUENO",
          "JEFE_TECNICO"
        ],
        "consulta": [
          "DUENO"
        ]
      },
      {
        "id": "asignar",
        "titulo": "Asignar kits a transmisiones",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "movimientos",
        "titulo": "Salida y retorno de equipos",
        "roles": [
          "JEFE_TECNICO"
        ],
        "consulta": []
      },
      {
        "id": "incidentes",
        "titulo": "Incidentes y reporte mensual",
        "roles": [
          "JEFE_TECNICO"
        ],
        "consulta": []
      }
    ]
  },
  {
    "id": "finanzas",
    "titulo": "Finanzas y auspiciadores",
    "descripcion": "Revisa pagos, gastos y resultados.",
    "responsable": "Alonso",
    "acciones": [
      {
        "id": "pagos",
        "titulo": "Pagos del cliente",
        "roles": [
          "DUENO",
          "CONTADOR"
        ],
        "consulta": [
          "DUENO"
        ]
      },
      {
        "id": "gastos",
        "titulo": "Gastos y costos fijos",
        "roles": [
          "CONTADOR"
        ],
        "consulta": []
      },
      {
        "id": "acuerdos",
        "titulo": "Acuerdos y aportes no cumplidos",
        "roles": [
          "DUENO"
        ],
        "consulta": []
      },
      {
        "id": "aportes",
        "titulo": "Aportes recibidos y valorización de canjes",
        "roles": [
          "CONTADOR"
        ],
        "consulta": []
      },
      {
        "id": "resumen",
        "titulo": "Rentabilidad y resumen mensual",
        "roles": [
          "DUENO",
          "CONTADOR"
        ],
        "consulta": [
          "DUENO"
        ]
      }
    ]
  }
];
export function accionesPermitidas(modulo, rol) {
  if (rol === "ADMIN_DESARROLLO") {
    return modulo.acciones;
  }

  return modulo.acciones.filter((accion) =>
    accion.roles.includes(rol)
  );
}
export function modulosPermitidos(rol) {
  return modulos.filter((modulo) => accionesPermitidas(modulo, rol).length > 0);
}
export function resolverRuta(hash, rol) {
  const partes = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (partes.length === 0) return { tipo: "inicio" };
  if (partes.length > 2) return { tipo: "no-encontrada" };
  const modulo = modulos.find((item) => item.id === partes[0]);
  if (!modulo) return { tipo: "no-encontrada" };
  if (!accionesPermitidas(modulo, rol).length) return { tipo: "prohibida" };
  if (!partes[1]) return { tipo: "modulo", modulo };
  const accion = modulo.acciones.find((item) => item.id === partes[1]);
  if (!accion) return { tipo: "no-encontrada" };
  if (
  rol !== "ADMIN_DESARROLLO" &&
  !accion.roles.includes(rol)
) {
  return { tipo: "prohibida" };
}
  return { tipo: "accion", modulo, accion };
}
