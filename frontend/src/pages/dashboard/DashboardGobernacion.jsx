import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  TruckIcon, 
  CheckCircleIcon, 
  WrenchScrewdriverIcon, 
  ExclamationTriangleIcon, 
  CurrencyDollarIcon, 
  BuildingLibraryIcon 
} from '@heroicons/react/24/outline';

// Iconos con componentes HeroIcons
const icons = {
  car: <TruckIcon className="h-8 w-8" />,
  check: <CheckCircleIcon className="h-8 w-8" />,
  wrench: <WrenchScrewdriverIcon className="h-8 w-8" />,
  alert: <ExclamationTriangleIcon className="h-8 w-8" />,
  money: <CurrencyDollarIcon className="h-8 w-8" />,
  building: <BuildingLibraryIcon className="h-8 w-8" />
};

export default function DashboardGobernacion() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [semaforo, setSemaforo] = useState([]);
  const [vehiculosOciosos, setVehiculosOciosos] = useState([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [statsRes, semaforoRes, ociososRes, solicitudesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/semaforo'),
        api.get('/dashboard/vehiculos-ociosos'),
        api.get('/solicitudes?estado=pendiente&limit=5')
      ]);
      
      setStats(statsRes.data);
      setSemaforo(semaforoRes.data);
      setVehiculosOciosos(ociososRes.data);
      setSolicitudesPendientes(Array.isArray(solicitudesRes.data) ? solicitudesRes.data : []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const navegarConFiltro = (filtro, valor) => {
    navigate(`/vehiculos?${filtro}=${encodeURIComponent(valor)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-dorado-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tablero ejecutivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tablero Ejecutivo de Flota Vehicular
        </h1>
        <p className="text-gray-600 mt-1">
          Gobierno del Estado de Veracruz • Bienvenido/a, {user?.nombre}
        </p>
      </div>

      {/* Indicadores Principales - Cards clickeables */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <CardIndicador
          titulo="Total Vehículos"
          valor={stats?.totalVehiculos || 0}
          icono={icons.car}
          color="bg-blue-500"
          onClick={() => navigate('/vehiculos')}
        />
        <CardIndicador
          titulo="Operando"
          valor={stats?.vehiculosPorEstado?.find(e => e.estado === 'Operando')?.cantidad || 0}
          icono={icons.check}
          color="bg-green-500"
          onClick={() => navegarConFiltro('estado_operativo', 'Operando')}
        />
        <CardIndicador
          titulo="En Taller"
          valor={stats?.vehiculosEnTaller || 0}
          icono={icons.wrench}
          color="bg-yellow-500"
          onClick={() => navegarConFiltro('estado_operativo', 'En taller')}
        />
        <CardIndicador
          titulo="Mal Estado"
          valor={stats?.vehiculosPorEstado?.find(e => e.estado === 'Mal estado')?.cantidad || 0}
          icono={icons.alert}
          color="bg-red-500"
          onClick={() => navegarConFiltro('estado_operativo', 'Mal estado')}
        />
        <CardIndicador
          titulo="Arrendados"
          valor={stats?.vehiculosArrendados || 0}
          icono={icons.money}
          color="bg-purple-500"
          onClick={() => navegarConFiltro('regimen', 'Arrendado')}
        />
        <CardIndicador
          titulo="Dependencias"
          valor={stats?.totalSecretarias || 0}
          icono={icons.building}
          color="bg-indigo-500"
          onClick={() => {}}
        />
      </div>

      {/* Distribución por Régimen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Por Régimen de Propiedad</h3>
          <div className="space-y-3">
            {stats?.vehiculosPorRegimen?.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navegarConFiltro('regimen', item.regimen)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium">{item.regimen || 'Sin especificar'}</span>
                <span className="bg-veracruz-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {item.cantidad}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Por Estado Operativo</h3>
          <div className="space-y-3">
            {stats?.vehiculosPorEstado?.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navegarConFiltro('estado_operativo', item.estado)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    item.estado === 'Operando' ? 'bg-green-500' :
                    item.estado === 'En taller' ? 'bg-yellow-500' :
                    item.estado === 'Mal estado' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="font-medium">{item.estado}</span>
                </div>
                <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {item.cantidad}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link to="/vehiculos" className="block w-full p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium">
              Ver todos los vehículos
            </Link>
            <Link to="/solicitudes" className="block w-full p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-center font-medium">
              Revisar solicitudes ({stats?.solicitudesPendientes || 0} pendientes)
            </Link>
            <Link to="/reportes" className="block w-full p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-center font-medium">
              Generar reportes
            </Link>
          </div>
        </div>
      </div>

      {/* Semáforo por Dependencia */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Semáforo de Eficiencia por Dependencia</h3>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Eficiente (≥80%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medio (50-79%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Atención (&lt;50%)</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {semaforo.map((dep) => (
            <button
              key={dep.id}
              onClick={() => navegarConFiltro('secretaria_id', dep.id)}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                dep.color === 'verde' ? 'border-green-500 bg-green-50' :
                dep.color === 'amarillo' ? 'border-yellow-500 bg-yellow-50' :
                'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{dep.siglas}</span>
                <span className={`w-4 h-4 rounded-full ${
                  dep.color === 'verde' ? 'bg-green-500' :
                  dep.color === 'amarillo' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></span>
              </div>
              <p className="text-sm text-gray-600 truncate mb-2">{dep.nombre}</p>
              <div className="flex justify-between text-sm">
                <span>Total: <b>{dep.total_vehiculos}</b></span>
                <span>Operando: <b>{dep.operando}</b></span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    dep.color === 'verde' ? 'bg-green-500' :
                    dep.color === 'amarillo' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${dep.eficiencia}%` }}
                ></div>
              </div>
              <p className="text-center text-sm mt-1 font-bold">{dep.eficiencia}% eficiencia</p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel inferior: Vehículos Ociosos y Solicitudes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehículos Ociosos / Fuera de Servicio */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Vehículos Fuera de Servicio</h3>
            <Link to="/vehiculos?estado_operativo=Fuera+de+servicio" className="text-blue-600 hover:underline text-sm">
              Ver todos →
            </Link>
          </div>
          
          {vehiculosOciosos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay vehículos mal estado</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {vehiculosOciosos.slice(0, 5).map((v) => (
                <Link
                  key={v.id}
                  to={`/vehiculos/${v.id}`}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div>
                    <p className="font-medium">{v.marca} {v.modelo}</p>
                    <p className="text-sm text-gray-600">{v.placas} • {v.secretaria_siglas}</p>
                  </div>
                  <span className="text-xl">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Solicitudes Pendientes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Solicitudes Pendientes</h3>
            <Link to="/solicitudes" className="text-blue-600 hover:underline text-sm">
              Ver todas →
            </Link>
          </div>
          
          {solicitudesPendientes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay solicitudes pendientes</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {solicitudesPendientes.map((sol) => (
                <Link
                  key={sol.id}
                  to={`/solicitudes/${sol.id}`}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div>
                    <p className="font-medium">{sol.tipo} - {sol.folio}</p>
                    <p className="text-sm text-gray-600">De: {sol.secretaria_origen_siglas}</p>
                  </div>
                  <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Pendiente</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente Card Indicador
function CardIndicador({ titulo, valor, icono, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-left`}
    >
      <div className="text-3xl mb-2">{icono}</div>
      <div className="text-3xl font-bold">{valor}</div>
      <div className="text-sm opacity-90">{titulo}</div>
    </button>
  );
}
