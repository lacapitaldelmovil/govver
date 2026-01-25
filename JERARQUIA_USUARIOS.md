# 🏛️ JERARQUÍA DE USUARIOS
## Sistema de Flota Vehicular - Gobierno de Veracruz

---

## 📊 TRIÁNGULO DE JERARQUÍA

```
                            ┌─────────────────┐
                            │                 │
                            │  SUPER ADMIN    │
                            │                 │
                            │  (Nivel 1)      │
                            │                 │
                            └────────┬────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                  │
          ┌─────────▼─────────┐              ┌────────▼────────┐
          │                   │              │                 │
          │   GOBERNACIÓN     │              │  ADMIN          │
          │                   │              │  SECRETARÍA     │
          │   (Nivel 2)       │              │                 │
          │                   │              │  (Nivel 3)      │
          └─────────┬─────────┘              └────────┬────────┘
                    │                                  │
                    │                      ┌───────────┴────────────┐
                    │                      │                        │
                    │              ┌───────▼───────┐       ┌────────▼────────┐
                    │              │               │       │                 │
                    │              │  CONDUCTOR    │       │   CONDUCTOR     │
                    │              │  DIF          │       │   OTRAS         │
                    │              │               │       │   SECRETARÍAS   │
                    │              │  (Nivel 4)    │       │                 │
                    │              └───────────────┘       │   (Nivel 4)     │
                    │                                      └─────────────────┘
                    │
                    └────────────────────────────────────────────┐
                                                                 │
                                                    ┌────────────▼────────────┐
                                                    │                         │
                                                    │  TODOS LOS CONDUCTORES  │
                                                    │                         │
                                                    │      (Nivel 4)          │
                                                    └─────────────────────────┘
```

---

## 👥 DESCRIPCIÓN DE ROLES

### 🔴 NIVEL 1: SUPER ADMIN
**Rol:** `admin`  
**Cantidad:** 1 usuario  
**Acceso:** Total y sin restricciones

**Permisos:**
- ✅ Ver y gestionar TODAS las secretarías
- ✅ Crear, editar y eliminar usuarios
- ✅ Aprobar/rechazar solicitudes de todas las dependencias
- ✅ Acceso completo a reportes globales
- ✅ Gestión de vehículos de toda la flota estatal
- ✅ Configuración del sistema

**Credenciales:**
- Email: `admin@veracruz.gob.mx`
- Password: `Admin2024!`

---

### 🟡 NIVEL 2: GOBERNACIÓN
**Rol:** `gobernacion`  
**Cantidad:** 2 usuarios  
**Acceso:** Vista global de todas las secretarías

**Permisos:**
- ✅ Ver estadísticas de TODAS las secretarías
- ✅ Aprobar/rechazar solicitudes de préstamo
- ✅ Generar reportes consolidados
- ✅ Visualizar toda la flota vehicular
- ⛔ No puede crear/eliminar usuarios
- ⛔ No puede dar de baja vehículos

**Usuarios:**
1. **Coordinador de Gobernación**
   - Email: `coord.gobernacion@veracruz.gob.mx`
   - Password: `Gobernacion2024!`

2. **Supervisor de Gobernación**
   - Email: `supervisor.gobernacion@veracruz.gob.mx`
   - Password: `Gobernacion2024!`

---

### 🟢 NIVEL 3: ADMINISTRADOR DE SECRETARÍA
**Rol:** `admin_secretaria`  
**Cantidad:** 10 usuarios (uno por secretaría)  
**Acceso:** Restringido a su secretaría asignada

**Permisos:**
- ✅ Ver y gestionar vehículos de SU secretaría
- ✅ Crear solicitudes de préstamo
- ✅ Ver estadísticas de SU secretaría
- ✅ Gestionar conductores de SU secretaría
- ✅ Generar reportes de SU dependencia
- ⛔ No puede ver otras secretarías
- ⛔ No puede aprobar solicitudes
- ⛔ No puede crear usuarios

**Usuarios por Secretaría:**

1. **Oficina del Gobernador (GOB)**
   - Email: `admin.gob@veracruz.gob.mx`
   - Password: `Gob2024!`

2. **Secretaría de Finanzas (SEFIPLAN)**
   - Email: `admin.sefiplan@veracruz.gob.mx`
   - Password: `Sefiplan2024!`

3. **Secretaría de Seguridad Pública (SSP)**
   - Email: `admin.ssp@veracruz.gob.mx`
   - Password: `Ssp2024!`

4. **Secretaría de Salud (SALUD)**
   - Email: `admin.salud@veracruz.gob.mx`
   - Password: `Salud2024!`

5. **Secretaría de Educación (SEV)**
   - Email: `admin.sev@veracruz.gob.mx`
   - Password: `Sev2024!`

6. **Secretaría de Desarrollo Económico (SEDECOP)**
   - Email: `admin.sedecop@veracruz.gob.mx`
   - Password: `Sedecop2024!`

7. **Secretaría de Desarrollo Social (SEDESOL)**
   - Email: `admin.sedesol@veracruz.gob.mx`
   - Password: `Sedesol2024!`

8. **Secretaría de Infraestructura (SIOP)**
   - Email: `admin.siop@veracruz.gob.mx`
   - Password: `Siop2024!`

9. **Secretaría de Medio Ambiente (SEDEMA)**
   - Email: `admin.sedema@veracruz.gob.mx`
   - Password: `Sedema2024!`

10. **Secretaría de Desarrollo Agropecuario (SEDARPA)**
    - Email: `admin.sedarpa@veracruz.gob.mx`
    - Password: `Sedarpa2024!`

11. **Sistema DIF (DIF)**
    - Email: `admin.dif@veracruz.gob.mx`
    - Password: `Dif2024!`

---

### 🔵 NIVEL 4: CONDUCTOR
**Rol:** `conductor`  
**Cantidad:** 3 usuarios  
**Acceso:** Solo lectura de vehículos asignados

**Permisos:**
- ✅ Ver vehículos que tiene asignados
- ✅ Registrar kilometraje y reportar incidencias
- ✅ Ver su calendario de asignaciones
- ⛔ No puede crear solicitudes
- ⛔ No puede ver otros vehículos
- ⛔ No puede modificar datos del sistema

**Usuarios:**
1. **Conductor 1**
   - Email: `conductor1@veracruz.gob.mx`
   - Password: `Conductor2024!`

2. **Conductor 2**
   - Email: `conductor2@veracruz.gob.mx`
   - Password: `Conductor2024!`

3. **Conductor 3**
   - Email: `conductor3@veracruz.gob.mx`
   - Password: `Conductor2024!`

---

## 📋 RESUMEN DE PERMISOS

| Función | Super Admin | Gobernación | Admin Secretaría | Conductor |
|---------|:-----------:|:-----------:|:----------------:|:---------:|
| Ver todas las secretarías | ✅ | ✅ | ⛔ | ⛔ |
| Ver su secretaría | ✅ | ✅ | ✅ | ⛔ |
| Crear/Eliminar usuarios | ✅ | ⛔ | ⛔ | ⛔ |
| Gestionar vehículos (todos) | ✅ | ⛔ | ⛔ | ⛔ |
| Gestionar vehículos (propios) | ✅ | ⛔ | ✅ | ⛔ |
| Crear solicitudes | ✅ | ✅ | ✅ | ⛔ |
| Aprobar/Rechazar solicitudes | ✅ | ✅ | ⛔ | ⛔ |
| Reportes globales | ✅ | ✅ | ⛔ | ⛔ |
| Reportes de su secretaría | ✅ | ✅ | ✅ | ⛔ |
| Ver vehículos asignados | ✅ | ✅ | ✅ | ✅ |
| Reportar incidencias | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 FLUJO DE AUTORIZACIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SOLICITUD DE PRÉSTAMO DE VEHÍCULO                          │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │  Admin Secretaría crea       │
    │  solicitud de préstamo       │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │  Solicitud en estado         │
    │  PENDIENTE                   │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │  Gobernación o Super Admin              │
    │  revisa y decide                        │
    └──────────────┬───────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    [APROBAR]           [RECHAZAR]
         │                   │
         ▼                   ▼
    Estado:             Estado:
    APROBADA           RECHAZADA
         │                   │
         ▼                   │
    Conductor              └──► Fin
    asignado
         │
         ▼
    EN CURSO
         │
         ▼
    COMPLETADA
```

---

## 🏢 SECRETARÍAS DEL SISTEMA

1. **GOB** - Oficina del Gobernador
2. **SEFIPLAN** - Secretaría de Finanzas y Planeación
3. **SSP** - Secretaría de Seguridad Pública
4. **SALUD** - Secretaría de Salud
5. **SEV** - Secretaría de Educación de Veracruz
6. **SEDECOP** - Secretaría de Desarrollo Económico y Portuario
7. **SEDESOL** - Secretaría de Desarrollo Social
8. **SIOP** - Secretaría de Infraestructura y Obras Públicas
9. **SEDEMA** - Secretaría de Medio Ambiente
10. **SEDARPA** - Secretaría de Desarrollo Agropecuario
11. **DIF** - Sistema para el Desarrollo Integral de la Familia

---

## 📊 ESTADÍSTICAS DEL SISTEMA

- **Total de usuarios:** 16
  - Super Admin: 1
  - Gobernación: 2
  - Admin Secretaría: 11
  - Conductores: 3

- **Total de vehículos:** 105
  - DIF: 67 vehículos
  - SSP: 6 vehículos
  - GOB: 5 vehículos
  - SALUD: 5 vehículos
  - SEV: 4 vehículos
  - SIOP: 4 vehículos
  - SEFIPLAN: 3 vehículos
  - SEDECOP: 3 vehículos
  - SEDESOL: 3 vehículos
  - SEDARPA: 3 vehículos
  - SEDEMA: 2 vehículos

---

## 🔐 SEGURIDAD

- ✅ Autenticación por JWT (JSON Web Tokens)
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Sesiones con expiración de 8 horas
- ✅ Validación de permisos en cada petición
- ✅ Middleware de autorización por rol
- ✅ Logs de auditoría de acciones

---

**Documento generado:** 17 de enero de 2026  
**Sistema:** Flota Vehicular - Gobierno del Estado de Veracruz  
**Versión:** 1.0
