# 🚗 Sistema de Gestión de Flota Vehicular
## Gobierno del Estado de Veracruz

Sistema integral para el control, seguimiento y gestión de la flota vehicular del Gobierno del Estado de Veracruz.

---

## 📋 Características Principales

### Dashboard Ejecutivo
- **Tablero maestro visual** para la Gobernadora y funcionarios autorizados
- **Semáforo de eficiencia** por dependencia (verde/amarillo/rojo)
- **Indicadores en tiempo real** de toda la flota vehicular
- Alertas de rentas próximas a vencer
- Detección de vehículos ociosos

### Gestión Vehicular
- Inventario completo de vehículos propios y rentados
- Seguimiento de estado operativo (disponible, asignado, taller, baja)
- Control de kilometraje y mantenimientos
- Carga masiva desde Excel/CSV

### Flujo de Solicitudes
- **Préstamos entre secretarías**
- **Transferencias permanentes**
- Workflow de aprobación con roles
- Historial completo de movimientos

### Roles de Usuario
| Rol | Descripción |
|-----|-------------|
| **Gobernadora** | Visión completa, autorización de movimientos críticos |
| **Equipo de Gobierno** | Consulta y autorización de solicitudes |
| **Responsable de Flota** | Gestión de vehículos de su secretaría |
| **Conductor** | Consulta de vehículo asignado |
| **Administrador** | Acceso total al sistema |

---

## 🛠️ Tecnologías

### Backend
- **Node.js** + Express.js
- **SQLite** (base de datos local - sql.js)
- JWT para autenticación
- bcryptjs para contraseñas

### Frontend
- **React 18** + Vite 5
- **Tailwind CSS** para estilos
- **Zustand** para estado global
- React Router para navegación

---

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js 18 o superior
- npm o yarn

### 1. Clonar el repositorio
```bash
cd "Govierno De Veracruz"
```

### 2. Instalar dependencias del Backend
```bash
cd backend
npm install
```

### 3. Crear la base de datos
```bash
npm run migrate   # Crea las tablas
npm run seed      # Inserta datos de prueba
```

### 4. Iniciar el Backend
```bash
npm start         # Puerto 3001
# o para desarrollo:
npm run dev
```

### 5. Instalar dependencias del Frontend
```bash
cd ../frontend
npm install
```

### 6. Iniciar el Frontend
```bash
npm run dev       # Puerto 5173
```

### 7. Acceder al sistema
Abrir http://localhost:5173 en el navegador

---

## 🔐 Credenciales de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@veracruz.gob.mx | Veracruz2024! | Administrador |
| gobernadora@veracruz.gob.mx | Veracruz2024! | Gobernadora |
| equipo.gobierno@veracruz.gob.mx | Veracruz2024! | Equipo de Gobierno |
| flota.segob@veracruz.gob.mx | Veracruz2024! | Responsable Flota |
| conductor1@veracruz.gob.mx | Veracruz2024! | Conductor |

---

## 📁 Estructura del Proyecto

```
Govierno De Veracruz/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.js    # Conexión SQLite
│   │   │   ├── migrate.js       # Crear tablas
│   │   │   └── seed.js          # Datos iniciales
│   │   ├── middleware/
│   │   │   ├── auth.js          # Autenticación JWT
│   │   │   └── errorHandler.js  # Manejo de errores
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # Login/logout
│   │   │   ├── vehiculos.routes.js  # CRUD vehículos
│   │   │   ├── usuarios.routes.js   # Gestión usuarios
│   │   │   ├── secretarias.routes.js
│   │   │   ├── solicitudes.routes.js
│   │   │   ├── movimientos.routes.js
│   │   │   ├── dashboard.routes.js  # Estadísticas
│   │   │   └── reportes.routes.js   # Exportar CSV
│   │   └── index.js             # Servidor Express
│   ├── flota_veracruz.sqlite    # Base de datos local
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── pages/              # Páginas de la app
│   │   ├── store/              # Estado Zustand
│   │   ├── services/           # Llamadas API
│   │   └── App.jsx             # Rutas principales
│   └── package.json
└── README.md
```

---

## 📊 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Datos del usuario actual
- `PUT /api/auth/password` - Cambiar contraseña

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/semaforo` - Eficiencia por secretaría
- `GET /api/dashboard/vehiculos-ociosos` - Vehículos sin uso
- `GET /api/dashboard/alertas-rentas` - Rentas próximas a vencer

### Vehículos
- `GET /api/vehiculos` - Listar vehículos
- `POST /api/vehiculos` - Crear vehículo
- `PUT /api/vehiculos/:id` - Actualizar vehículo
- `DELETE /api/vehiculos/:id` - Eliminar vehículo
- `POST /api/vehiculos/upload` - Carga masiva Excel/CSV

### Solicitudes
- `GET /api/solicitudes` - Listar solicitudes
- `POST /api/solicitudes` - Crear solicitud
- `PUT /api/solicitudes/:id/aprobar` - Aprobar solicitud
- `PUT /api/solicitudes/:id/rechazar` - Rechazar solicitud

### Reportes
- `GET /api/reportes/vehiculos` - Exportar vehículos CSV
- `GET /api/reportes/solicitudes` - Exportar solicitudes CSV
- `GET /api/reportes/movimientos` - Exportar movimientos CSV

---

## 🎨 Colores del Semáforo de Eficiencia

| Color | Eficiencia | Significado |
|-------|------------|-------------|
| 🟢 Verde | ≥ 80% | Óptimo uso de la flota |
| 🟡 Amarillo | 50-79% | Revisar vehículos en taller |
| 🔴 Rojo | < 50% | Atención urgente requerida |

---

## 📞 Soporte

Sistema desarrollado para el Gobierno del Estado de Veracruz.

---

**Versión:** 1.0.0  
**Base de datos:** SQLite local (flota_veracruz.sqlite)
