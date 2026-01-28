import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Páginas públicas
import Login from './pages/Login';

// Páginas protegidas
import DashboardPrincipal from './pages/dashboard/DashboardGobernacion';
import DashboardSecretaria from './pages/dashboard/DashboardSecretaria';
import DashboardConductor from './pages/dashboard/DashboardConductor';

// Vehículos
import VehiculosLista from './pages/vehiculos/VehiculosLista';
import VehiculoDetalle from './pages/vehiculos/VehiculoDetalle';
import VehiculoCargaMasiva from './pages/vehiculos/VehiculoCargaMasiva';
import ComodatosLista from './pages/vehiculos/ComodatosLista';
import DeterminacionLista from './pages/vehiculos/DeterminacionLista';
import PrestamosLista from './pages/vehiculos/PrestamosLista';

// Municipios
import MunicipiosLista from './pages/municipios/MunicipiosLista';

// Solicitudes
import SolicitudesLista from './pages/solicitudes/SolicitudesLista';
import NuevaSolicitud from './pages/solicitudes/NuevaSolicitud';

// Administración
import UsuariosLista from './pages/admin/UsuariosLista';
import SecretariasLista from './pages/admin/SecretariasLista';
import ProveedoresLista from './pages/admin/ProveedoresLista';

// Reportes
import Reportes from './pages/reportes/Reportes';

// Componente de ruta protegida
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Redirección según rol
function RoleBasedRedirect() {
  const { user } = useAuthStore();

  switch (user?.rol) {
    case 'admin':
    case 'gobernacion':
      return <Navigate to="/dashboard" replace />;
    case 'admin_secretaria':
      return <Navigate to="/secretaria" replace />;
    case 'conductor':
      return <Navigate to="/conductor" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Routes>
        {/* Rutas públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Rutas protegidas */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Redirección basada en rol */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Dashboard Principal / Admin */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion']}>
                <DashboardPrincipal />
              </ProtectedRoute>
            } 
          />

          {/* Panel Secretaría */}
          <Route 
            path="/secretaria" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <DashboardSecretaria />
              </ProtectedRoute>
            } 
          />

          {/* Panel Conductor */}
          <Route 
            path="/conductor" 
            element={
              <ProtectedRoute allowedRoles={['conductor']}>
                <DashboardConductor />
              </ProtectedRoute>
            } 
          />

          {/* Vehículos */}
          <Route path="/vehiculos" element={<VehiculosLista />} />
          <Route path="/vehiculos/:id" element={<VehiculoDetalle />} />
          <Route 
            path="/vehiculos/carga-masiva" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <VehiculoCargaMasiva />
              </ProtectedRoute>
            } 
          />

          {/* Comodatos */}
          <Route 
            path="/comodatos" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <ComodatosLista />
              </ProtectedRoute>
            } 
          />

          {/* Determinación Administrativa */}
          <Route 
            path="/determinacion" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <DeterminacionLista />
              </ProtectedRoute>
            } 
          />

          {/* Préstamos */}
          <Route 
            path="/prestamos" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <PrestamosLista />
              </ProtectedRoute>
            } 
          />

          {/* Solicitudes */}
          <Route path="/solicitudes" element={<SolicitudesLista />} />
          <Route 
            path="/solicitudes/nueva" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <NuevaSolicitud />
              </ProtectedRoute>
            } 
          />

          {/* Administración */}
          <Route 
            path="/admin/usuarios" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion']}>
                <UsuariosLista />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/secretarias" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion']}>
                <SecretariasLista />
              </ProtectedRoute>
            } 
          />

          {/* Proveedores - Admin ve todos, admin_secretaria ve solo los suyos */}
          <Route 
            path="/proveedores" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <ProveedoresLista />
              </ProtectedRoute>
            } 
          />

          {/* Reportes */}
          <Route 
            path="/reportes" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <Reportes />
              </ProtectedRoute>
            } 
          />

          {/* Municipios */}
          <Route 
            path="/municipios" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'gobernacion', 'admin_secretaria']}>
                <MunicipiosLista />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
