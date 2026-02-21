import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  EyeIcon,
  BuildingOfficeIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

/* ==================== COMPONENTES AUXILIARES ==================== */

function StatCard({ icon, label, value, color, small }) {
  const colors = {
    blue:   'from-blue-500 to-blue-600 shadow-blue-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    green:  'from-veracruz-500 to-veracruz-600 shadow-veracruz-200',
    amber:  'from-amber-500 to-amber-600 shadow-amber-200',
  };
  const textColors = { blue: 'text-blue-700', purple: 'text-purple-700', green: 'text-veracruz-700', amber: 'text-amber-700' };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg flex items-center justify-center flex-shrink-0`}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider truncate">{label}</p>
        <p className={`${small ? 'text-lg' : 'text-2xl'} font-bold ${textColors[color]} leading-tight`}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
      <Icon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function GrupoVehiculos({ titulo, subtitulo, vehiculos, color, esAdmin, abrirModalDevolver, defaultOpen, gruposAbiertos, toggleGrupo, showPrestadoA }) {
  const isOpen = gruposAbiertos[titulo] !== undefined ? gruposAbiertos[titulo] : defaultOpen;
  const totalValor = vehiculos.reduce((sum, v) => sum + (v.valor_libros || 0), 0);
  const operando = vehiculos.filter(v => v.estado_operativo === 'Operando').length;

  const cc = {
    blue:   { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    green:  { bg: 'bg-veracruz-50', text: 'text-veracruz-700', badge: 'bg-veracruz-100 text-veracruz-700', border: 'border-veracruz-200', dot: 'bg-veracruz-500' },
  }[color] || { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header clickable */}
      <button
        onClick={() => toggleGrupo(titulo)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-gray-50 group ${isOpen ? `${cc.bg} border-b ${cc.border}` : ''}`}
      >
        <div className={`w-2 h-2 rounded-full ${cc.dot} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">{subtitulo}:</span>
            <span className={`font-bold text-sm ${cc.text}`}>{titulo}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cc.badge}`}>
              {vehiculos.length} {vehiculos.length === 1 ? 'vehículo' : 'vehículos'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
            <span>✅ {operando} operando</span>
            {totalValor > 0 && <span>💰 ${totalValor.toLocaleString()}</span>}
          </div>
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Tabla */}
      {isOpen && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b">
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vehículo</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Placas</th>
                {showPrestadoA && <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Prestado a</th>}
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Km</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Valor</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehiculos.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link to={`/vehiculos/${v.id}`} className="group block">
                      <p className="font-semibold text-gray-900 group-hover:text-veracruz-700 text-sm">{v.marca} {v.linea || v.modelo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-400">{v.anio}</span>
                        {v.color && <span className="text-xs text-gray-400">• {v.color}</span>}
                        {v.tipo && <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{v.tipo}</span>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-sm font-medium text-gray-800">{v.placas}</span>
                  </td>
                  {showPrestadoA && (
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {v.municipio || v.ubicacion_fisica || '-'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.estado_operativo === 'Operando' ? 'bg-veracruz-100 text-veracruz-700' :
                      v.estado_operativo === 'En taller' ? 'bg-yellow-100 text-yellow-700' :
                      v.estado_operativo === 'Mal estado' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{v.estado_operativo}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{v.kilometraje ? `${v.kilometraje.toLocaleString()} km` : '-'}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className="text-xs text-veracruz-700 font-medium">{v.valor_libros ? `$${Number(v.valor_libros).toLocaleString()}` : '-'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {esAdmin && abrirModalDevolver && (
                        <button onClick={() => abrirModalDevolver(v)}
                          className="text-[10px] font-semibold px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center gap-1">
                          <ArrowUturnLeftIcon className="h-3 w-3" /> Devolver
                        </button>
                      )}
                      <Link to={`/vehiculos/${v.id}`}
                        className="text-[10px] font-semibold px-2 py-1 bg-veracruz-50 text-veracruz-700 border border-veracruz-200 rounded-lg hover:bg-veracruz-100 transition-colors inline-flex items-center gap-1">
                        <EyeIcon className="h-3 w-3" /> Ver
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==================== COMPONENTE PRINCIPAL ==================== */

export default function PrestamosLista() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [vehiculoDevolver, setVehiculoDevolver] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [vistaActual, setVistaActual] = useState('municipios');
  const [busqueda, setBusqueda] = useState('');
  const [gruposAbiertos, setGruposAbiertos] = useState({});

  const esAdmin = ['admin', 'gobernacion'].includes(user?.rol);

  useEffect(() => { cargarPrestamos(); }, []);

  const cargarPrestamos = async () => {
    try {
      setLoading(true);
      const url = esAdmin
        ? '/vehiculos?limit=1000&regimen=Comodato&todas=true'
        : '/vehiculos?limit=1000&regimen=Comodato';
      const res = await api.get(url);
      setVehiculos(res.data.vehiculos || res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar préstamos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalDevolver = (vehiculo) => {
    setVehiculoDevolver(vehiculo);
    setObservaciones('');
    setShowDevolverModal(true);
  };

  const ordenarDevolucion = async () => {
    if (!vehiculoDevolver) return;
    try {
      await api.put('/vehiculos/' + vehiculoDevolver.id, {
        regimen: 'Propio',
        municipio: null,
        ubicacion_fisica: vehiculoDevolver.secretaria_siglas || 'Oficinas centrales'
      });
      toast.success('Orden de devolución enviada');
      setShowDevolverModal(false);
      cargarPrestamos();
    } catch { toast.error('Error al ordenar devolución'); }
  };

  const toggleGrupo = (key) => setGruposAbiertos(p => ({ ...p, [key]: !p[key] }));

  /* --- Filtro de búsqueda --- */
  const vehiculosFiltrados = busqueda
    ? vehiculos.filter(v =>
        (v.marca||'').toLowerCase().includes(busqueda.toLowerCase()) ||
        (v.linea||v.modelo||'').toLowerCase().includes(busqueda.toLowerCase()) ||
        (v.placas||'').toLowerCase().includes(busqueda.toLowerCase()) ||
        (v.municipio||'').toLowerCase().includes(busqueda.toLowerCase()) ||
        (v.secretaria_siglas||'').toLowerCase().includes(busqueda.toLowerCase())
      )
    : vehiculos;

  /* --- Agrupaciones --- */
  const agrupadoPorSecretaria = vehiculosFiltrados.reduce((acc, v) => {
    const sec = v.secretaria_siglas || v.secretaria_nombre || 'Sin asignar';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(v);
    return acc;
  }, {});

  const vehiculosADependencias = vehiculosFiltrados.filter(v => v.clasificacion === 'comodato_externo');
  const vehiculosAMunicipios = vehiculosFiltrados.filter(v => v.clasificacion !== 'comodato_externo');

  const agrupadoPorMunicipio = vehiculosAMunicipios.reduce((acc, v) => {
    const destino = v.municipio || v.ubicacion_fisica || 'Sin especificar';
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(v);
    return acc;
  }, {});

  const agrupadoPorDependencia = vehiculosADependencias.reduce((acc, v) => {
    const destino = v.municipio || v.ubicacion_fisica || 'Otra Dependencia';
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(v);
    return acc;
  }, {});

  const destinosMunicipios = Object.entries(agrupadoPorMunicipio).sort((a, b) => a[0].localeCompare(b[0]));
  const destinosSecretarias = Object.entries(agrupadoPorDependencia).sort((a, b) => a[0].localeCompare(b[0]));

  const totalOperando = vehiculos.filter(v => v.estado_operativo === 'Operando').length;
  const totalValor = vehiculos.reduce((acc, v) => acc + (v.valor_libros || 0), 0);
  const totalDestinos = esAdmin
    ? Object.keys(agrupadoPorSecretaria).length
    : Object.keys(agrupadoPorMunicipio).length + Object.keys(agrupadoPorDependencia).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-veracruz-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ===== HEADER ===== */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <ArrowsRightLeftIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {esAdmin ? 'Gestión de Préstamos' : 'Vehículos Prestados'}
            </h1>
            <p className="text-sm text-gray-500">
              {esAdmin
                ? 'Todos los vehículos en préstamo o comodato entre dependencias'
                : 'Vehículos de tu secretaría en préstamo o comodato'}
            </p>
          </div>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<TruckIcon className="h-5 w-5" />} label="Total en Préstamo" value={vehiculos.length} color="blue" />
        <StatCard icon={<MapPinIcon className="h-5 w-5" />} label={esAdmin ? 'Secretarías' : 'Destinos'} value={totalDestinos} color="purple" />
        <StatCard icon={<CheckCircleIcon className="h-5 w-5" />} label="Operando" value={totalOperando} color="green" />
        <StatCard icon={<CurrencyDollarIcon className="h-5 w-5" />} label="Valor Total" value={`$${totalValor.toLocaleString()}`} color="amber" small />
      </div>

      {/* ===== SEARCH + TOGGLE ===== */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por placa, marca, municipio, secretaría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:border-veracruz-500 focus:ring-1 focus:ring-veracruz-500"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Toggle — solo para secretarías */}
          {!esAdmin && (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setVistaActual('municipios')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  vistaActual === 'municipios' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPinIcon className="h-4 w-4" /> Municipios
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${vistaActual === 'municipios' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{vehiculosAMunicipios.length}</span>
              </button>
              <button
                onClick={() => setVistaActual('secretarias')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  vistaActual === 'secretarias' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4" /> Secretarías
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${vistaActual === 'secretarias' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'}`}>{vehiculosADependencias.length}</span>
              </button>
            </div>
          )}
        </div>
        {busqueda && (
          <p className="text-xs text-gray-400 mt-2 pl-1">{vehiculosFiltrados.length} vehículos encontrados</p>
        )}
      </div>

      {/* ===== ADMIN BANNER ===== */}
      {esAdmin && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3">
          <BuildingOfficeIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Panel de Control</span> — Vista global de préstamos. Puede ordenar devoluciones.
          </p>
        </div>
      )}

      {/* ===== LISTA AGRUPADA ===== */}
      {esAdmin ? (
        Object.entries(agrupadoPorSecretaria)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([secretaria, grupo]) => (
            <GrupoVehiculos key={secretaria} titulo={secretaria} subtitulo="Prestados por"
              vehiculos={grupo} color="green" esAdmin={esAdmin} abrirModalDevolver={abrirModalDevolver}
              defaultOpen={grupo.length <= 10} gruposAbiertos={gruposAbiertos} toggleGrupo={toggleGrupo} showPrestadoA />
          ))
      ) : (
        (vistaActual === 'municipios' ? destinosMunicipios : destinosSecretarias).map(([destino, grupo]) => (
          <GrupoVehiculos key={destino} titulo={destino} subtitulo="Prestado a"
            vehiculos={grupo} color={vistaActual === 'municipios' ? 'blue' : 'purple'}
            esAdmin={false} defaultOpen={grupo.length <= 8}
            gruposAbiertos={gruposAbiertos} toggleGrupo={toggleGrupo} />
        ))
      )}

      {/* ===== EMPTY STATES ===== */}
      {!esAdmin && vehiculosFiltrados.length > 0 && (vistaActual === 'municipios' ? destinosMunicipios : destinosSecretarias).length === 0 && (
        <EmptyState
          icon={vistaActual === 'municipios' ? MapPinIcon : BuildingOfficeIcon}
          title={`Sin préstamos a ${vistaActual === 'municipios' ? 'municipios' : 'secretarías'}`}
          subtitle={`No hay vehículos prestados a ${vistaActual}`}
        />
      )}
      {vehiculosFiltrados.length === 0 && !busqueda && (
        <EmptyState icon={ArrowsRightLeftIcon} title="Sin vehículos prestados" subtitle="No hay vehículos en préstamo o comodato" />
      )}
      {vehiculosFiltrados.length === 0 && busqueda && (
        <EmptyState icon={MagnifyingGlassIcon} title="Sin resultados" subtitle={`No se encontraron vehículos con "${busqueda}"`} />
      )}

      {/* ===== MODAL DEVOLVER ===== */}
      {showDevolverModal && vehiculoDevolver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b bg-orange-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                <ArrowUturnLeftIcon className="h-5 w-5" /> Ordenar Devolución
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-gray-900">{vehiculoDevolver.marca} {vehiculoDevolver.linea || vehiculoDevolver.modelo}</p>
                <p className="text-sm text-gray-500">Placas: <span className="font-mono font-medium">{vehiculoDevolver.placas}</span></p>
                <p className="text-sm text-gray-500">Prestado a: <span className="font-medium text-purple-700">{vehiculoDevolver.municipio || vehiculoDevolver.ubicacion_fisica}</span></p>
                <p className="text-sm text-gray-500">Propietario: <span className="font-medium text-veracruz-700">{vehiculoDevolver.secretaria_siglas}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:border-veracruz-500 focus:ring-1 focus:ring-veracruz-500" rows={3} placeholder="Motivo de la devolución..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <button onClick={() => setShowDevolverModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={ordenarDevolucion} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700">Ordenar Devolución</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
