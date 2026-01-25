import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  HomeIcon,
  TruckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Manejar búsqueda global
  const handleBusquedaGlobal = (e) => {
    if (e.key === 'Enter' && busquedaGlobal.trim()) {
      navigate(`/vehiculos?busqueda=${encodeURIComponent(busquedaGlobal.trim())}`);
      setBusquedaGlobal('');
    }
  };

  // Navegación basada en rol
  const getNavigation = () => {
    const baseNav = [];

    // Dashboard según rol
    if (['admin', 'gobernacion'].includes(user?.rol)) {
      baseNav.push({
        name: 'Dashboard Gobernación',
        href: '/dashboard',
        icon: HomeIcon
      });
    }

    // Panel Secretaría
    if (['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol)) {
      baseNav.push({
        name: user?.rol === 'admin_secretaria' ? 'Mi Secretaría' : 'Secretarías',
        href: '/secretaria',
        icon: BuildingOfficeIcon
      });
    }

    if (user?.rol === 'conductor') {
      baseNav.push({
        name: 'Mi Panel',
        href: '/conductor',
        icon: HomeIcon
      });
    }

    // Vehículos - todos pueden ver
    baseNav.push({
      name: 'Vehículos',
      href: '/vehiculos',
      icon: TruckIcon
    });

    // Préstamos - vehículos prestados a otras dependencias
    if (['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol)) {
      baseNav.push({
        name: 'Préstamos',
        href: '/prestamos',
        icon: ArrowRightIcon
      });
    }

    // Determinación Administrativa - admin_secretaria, admin y gobernación
    if (['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol)) {
      baseNav.push({
        name: 'Det. Administrativa',
        href: '/determinacion',
        icon: ExclamationTriangleIcon
      });
    }

    // Solicitudes - todos excepto conductores
    if (user?.rol !== 'conductor') {
      baseNav.push({
        name: 'Solicitudes',
        href: '/solicitudes',
        icon: DocumentTextIcon
      });
    }

    // Reportes
    if (['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol)) {
      baseNav.push({
        name: 'Reportes',
        href: '/reportes',
        icon: ChartBarIcon
      });
    }

    // Municipios
    if (['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol)) {
      baseNav.push({
        name: 'Municipios',
        href: '/municipios',
        icon: MapPinIcon
      });
    }

    // Proveedores - admin ve todos, admin_secretaria ve los de su secretaría
    if (['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol)) {
      baseNav.push({
        name: 'Proveedores',
        href: '/proveedores',
        icon: BuildingStorefrontIcon
      });
    }

    return baseNav;
  };

  const getAdminNavigation = () => {
    if (!['admin', 'gobernacion'].includes(user?.rol)) return [];

    return [
      { name: 'Usuarios', href: '/admin/usuarios', icon: UsersIcon },
      { name: 'Secretarías', href: '/admin/secretarias', icon: BuildingOfficeIcon },
      { name: 'Importar Vehículos', href: '/vehiculos/carga-masiva', icon: ArrowUpTrayIcon },
    ];
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navigation = getNavigation();
  const adminNavigation = getAdminNavigation();

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
          <div className="flex items-center justify-between h-20 px-6 bg-white border-b-2 border-veracruz-500">
            <div className="flex items-center gap-2">
              <img 
                src="/logo-veracruz.png" 
                alt="Gobierno de Veracruz" 
                className="h-12 w-auto bg-white rounded"
              />
              <span className="text-gray-900 font-bold text-sm">Flota Veracruz</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-900">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-veracruz-500 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}

            {adminNavigation.length > 0 && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administración
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-veracruz-500 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-20 px-6 bg-white border-b-2 border-veracruz-500">
            <img 
              src="/logo-veracruz.png" 
              alt="Gobierno de Veracruz" 
              className="h-14 w-auto bg-white rounded"
            />
            <div className="ml-3">
              <p className="text-gray-900 font-bold text-sm">Flota Vehicular</p>
              <p className="text-gray-600 text-xs">Gobierno de Veracruz</p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-veracruz-500 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}

            {adminNavigation.length > 0 && (
              <>
                <div className="pt-6 pb-2 px-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administración
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-veracruz-500 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Usuario */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <UserCircleIcon className="h-10 w-10 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombreCompleto || user?.nombre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.secretaria_siglas || user?.rol}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-72">
        {/* Header mínimo solo móvil */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 bg-white border-b border-gray-200 px-4 lg:hidden">
          {/* Botón menú móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Título móvil */}
          <span className="font-semibold text-gray-800">Flota Vehicular</span>
        </header>

        {/* Contenido */}
        <main className="p-4 lg:p-8 bg-white relative min-h-screen">
          <Outlet />
          
          {/* Marca de agua - Elefante */}
          <div className="fixed bottom-4 right-4 opacity-10 pointer-events-none z-0">
            <img 
              src="/elefante.png" 
              alt="" 
              className="w-32 h-32 lg:w-40 lg:h-40 object-contain"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
