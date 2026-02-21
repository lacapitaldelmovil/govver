import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  ArrowsRightLeftIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

/* ==================== COMPONENTES AUXILIARES ==================== */

function StatCard({ icon, label, value, color }) {
  const colors = {
    yellow: 'from-yellow-400 to-amber-500 shadow-amber-200',
    green:  'from-veracruz-500 to-veracruz-600 shadow-veracruz-200',
    red:    'from-red-500 to-rose-600 shadow-red-200',
    blue:   'from-blue-500 to-indigo-600 shadow-blue-200',
    gray:   'from-gray-400 to-gray-500 shadow-gray-200',
  };
  const textColors = { yellow: 'text-amber-700', green: 'text-veracruz-700', red: 'text-red-700', blue: 'text-blue-700', gray: 'text-gray-600' };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg flex items-center justify-center flex-shrink-0`}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider truncate">{label}</p>
        <p className={`text-2xl font-bold ${textColors[color]} leading-tight`}>{value}</p>
      </div>
    </div>
  );
}

export default function SolicitudesLista() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [expandidas, setExpandidas] = useState({});

  // Modal para asignar vehiculo
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [asignando, setAsignando] = useState(false);

  const esAdmin = ['admin', 'gobernacion'].includes(user?.rol);
  const esAutorizador = ['usuario_principal', 'admin', 'gobernacion', 'autorizador'].includes(user?.rol);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // Cargar todos los vehículos disponibles de todas las secretarías
  const cargarVehiculosDisponibles = async () => {
    setLoadingVehiculos(true);
    try {
      // Obtener vehículos de todas las secretarías que estén Disponibles u Operando
      const res = await api.get('/vehiculos?todos=true&limit=2000');
      const todos = res.data.data || res.data.vehiculos || res.data || [];
      
      // Filtrar solo los que están operando y activos (estatus puede ser null)
      const disponibles = todos.filter(v => 
        ['Disponible', 'Operando'].includes(v.estado_operativo) &&
        (!v.estatus || ['Bueno', 'Regular'].includes(v.estatus)) &&
        v.activo
      );
      
      setVehiculosDisponibles(disponibles);
    } catch (error) {
      console.error('Error cargando vehiculos:', error);
      toast.error('Error al cargar vehículos disponibles');
    }
    setLoadingVehiculos(false);
  };

  const abrirModalAsignar = async (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setVehiculoSeleccionado(null);
    setBusqueda('');
    setFiltroTipo('todos');
    setShowAsignarModal(true);
    await cargarVehiculosDisponibles();
  };

  const cerrarModal = () => {
    setShowAsignarModal(false);
    setSolicitudSeleccionada(null);
    setVehiculoSeleccionado(null);
  };

  const confirmarAsignacion = async () => {
    if (!vehiculoSeleccionado) {
      toast.error('Seleccione un vehículo');
      return;
    }
    
    setAsignando(true);
    try {
      await api.put(`/solicitudes/${solicitudSeleccionada.id}/aprobar`, {
        vehiculo_id: vehiculoSeleccionado.id
      });
      toast.success(`Solicitud aprobada. Se notificará a ${vehiculoSeleccionado.secretaria_siglas || 'la secretaría'} para enviar el vehículo.`);
      cerrarModal();
      cargarSolicitudes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al aprobar solicitud');
    }
    setAsignando(false);
  };

  // Aprobar directamente cuando ya tiene vehículo seleccionado por el solicitante
  const confirmarAprobacionDirecta = async (sol) => {
    if (!confirm(`¿Aprobar el préstamo del vehículo ${sol.marca} ${sol.modelo} (${sol.placas}) de ${sol.secretaria_destino_siglas} a ${sol.secretaria_origen_siglas}?`)) return;
    
    try {
      await api.put(`/solicitudes/${sol.id}/aprobar`, {
        vehiculo_id: sol.vehiculo_id
      });
      toast.success('Préstamo aprobado exitosamente');
      cargarSolicitudes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al aprobar solicitud');
    }
  };

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/solicitudes');
      console.log('Respuesta solicitudes:', response.data);
      setSolicitudes(response.data.data || []);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      toast.error(error.response?.data?.error || 'Error al cargar solicitudes');
      setSolicitudes([]);
    }
    setLoading(false);
  };

  const rechazarSolicitud = async (id) => {
    const observaciones = prompt('Ingrese el motivo del rechazo:');
    if (!observaciones) return;
    
    try {
      await api.put(`/solicitudes/${id}/rechazar`, { observaciones });
      toast.success('Solicitud rechazada');
      cargarSolicitudes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al rechazar');
    }
  };

  const completarSolicitud = async (id) => {
    try {
      await api.put(`/solicitudes/${id}/completar`);
      toast.success('Préstamo completado, vehículo devuelto');
      cargarSolicitudes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al completar');
    }
  };

  const cancelarSolicitud = async (id) => {
    if (!confirm('¿Está seguro de cancelar esta solicitud?')) return;
    
    try {
      await api.put(`/solicitudes/${id}/cancelar`);
      toast.success('Solicitud cancelada');
      cargarSolicitudes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cancelar');
    }
  };

  const getEstadoConfig = (estado) => ({
    pendiente:  { icon: '⏳', label: 'Pendiente',  badge: 'bg-amber-100 text-amber-700 border-amber-200', bar: 'from-amber-50 to-orange-50 border-amber-100' },
    aprobada:   { icon: '✅', label: 'Aprobada',   badge: 'bg-veracruz-100 text-veracruz-700 border-veracruz-200', bar: 'from-veracruz-50 to-veracruz-50 border-veracruz-100' },
    rechazada:  { icon: '❌', label: 'Rechazada',  badge: 'bg-red-100 text-red-700 border-red-200', bar: 'from-red-50 to-rose-50 border-red-100' },
    en_curso:   { icon: '🔄', label: 'En Curso',   badge: 'bg-blue-100 text-blue-700 border-blue-200', bar: 'from-blue-50 to-indigo-50 border-blue-100' },
    completada: { icon: '✓',  label: 'Completada', badge: 'bg-gray-100 text-gray-600 border-gray-200', bar: 'from-gray-50 to-slate-50 border-gray-100' },
    cancelada:  { icon: '⊘',  label: 'Cancelada',  badge: 'bg-gray-100 text-gray-500 border-gray-200', bar: 'from-gray-50 to-slate-50 border-gray-100' },
  }[estado] || { icon: '?', label: estado, badge: 'bg-gray-100 text-gray-600', bar: 'from-gray-50 to-gray-50 border-gray-100' });

  const getPrioridadConfig = (p) => ({
    urgente: { label: '🔴 Urgente', cls: 'bg-red-500 text-white' },
    alta:    { label: '🟠 Alta',    cls: 'bg-orange-500 text-white' },
    normal:  { label: 'Normal',     cls: 'bg-gray-100 text-gray-600' },
    baja:    { label: 'Baja',       cls: 'bg-gray-50 text-gray-400' },
  }[p] || { label: p, cls: 'bg-gray-100 text-gray-600' });

  const toggleExpand = (id) => setExpandidas(prev => ({ ...prev, [id]: !prev[id] }));

  // Filtrado
  const solicitudesFiltradas = (solicitudes || [])
    .filter(s => filtro === 'todas' || s.estado === filtro)
    .filter(s => {
      if (!busquedaTexto) return true;
      const t = busquedaTexto.toLowerCase();
      return (
        (s.folio || '').toLowerCase().includes(t) ||
        (s.marca || '').toLowerCase().includes(t) ||
        (s.placas || '').toLowerCase().includes(t) ||
        (s.motivo || '').toLowerCase().includes(t) ||
        (s.secretaria_origen_siglas || '').toLowerCase().includes(t) ||
        (s.secretaria_destino_siglas || '').toLowerCase().includes(t) ||
        (s.usuario_nombre || '').toLowerCase().includes(t)
      );
    });

  // Stats
  const stats = {
    pendiente: (solicitudes || []).filter(s => s.estado === 'pendiente').length,
    aprobada: (solicitudes || []).filter(s => s.estado === 'aprobada').length,
    rechazada: (solicitudes || []).filter(s => s.estado === 'rechazada').length,
    completada: (solicitudes || []).filter(s => s.estado === 'completada').length,
  };

  const filtrosTabs = [
    { key: 'todas', label: 'Todas', count: solicitudes.length, color: 'gray' },
    { key: 'pendiente', label: 'Pendientes', count: stats.pendiente, color: 'amber', icon: ClockIcon },
    { key: 'aprobada', label: 'Aprobadas', count: stats.aprobada, color: 'green', icon: CheckCircleIcon },
    { key: 'rechazada', label: 'Rechazadas', count: stats.rechazada, color: 'red', icon: XCircleIcon },
    { key: 'completada', label: 'Completadas', count: stats.completada, color: 'gray', icon: CheckCircleIcon },
  ];

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-veracruz-500 to-veracruz-700 flex items-center justify-center shadow-lg shadow-veracruz-200">
            <DocumentTextIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
            <p className="text-sm text-gray-500">Préstamos de vehículos entre Secretarías</p>
          </div>
        </div>
        {user?.rol !== 'conductor' && (
          <Link to="/solicitudes/nueva"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-veracruz-500 to-veracruz-600 text-white px-5 py-2.5 rounded-xl hover:from-veracruz-600 hover:to-veracruz-700 transition-all font-semibold shadow-lg shadow-veracruz-200 text-sm">
            <PlusIcon className="h-5 w-5" /> Nueva Solicitud
          </Link>
        )}
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<ClockIcon className="h-5 w-5" />} label="Pendientes" value={stats.pendiente} color="yellow" />
        <StatCard icon={<CheckCircleIcon className="h-5 w-5" />} label="Aprobadas" value={stats.aprobada} color="green" />
        <StatCard icon={<XCircleIcon className="h-5 w-5" />} label="Rechazadas" value={stats.rechazada} color="red" />
        <StatCard icon={<ArrowPathIcon className="h-5 w-5" />} label="Completadas" value={stats.completada} color="blue" />
      </div>

      {/* ===== SEARCH + FILTERS ===== */}
      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por folio, vehículo, secretaría, solicitante..."
            value={busquedaTexto} onChange={(e) => setBusquedaTexto(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:border-veracruz-500 focus:ring-1 focus:ring-veracruz-500" />
          {busquedaTexto && (
            <button onClick={() => setBusquedaTexto('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {filtrosTabs.map(f => {
            const active = filtro === f.key;
            return (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-veracruz-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}>
                {f.icon && <f.icon className="h-3.5 w-3.5" />}
                {f.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {busquedaTexto && (
          <p className="text-xs text-gray-400 pl-1">{solicitudesFiltradas.length} resultado{solicitudesFiltradas.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* ===== LISTA DE SOLICITUDES ===== */}
      {solicitudesFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            {busquedaTexto ? 'Sin resultados' : filtro !== 'todas' ? `Sin solicitudes ${filtro}s` : 'Sin solicitudes'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {busquedaTexto
              ? `No se encontraron solicitudes con "${busquedaTexto}"`
              : 'No hay solicitudes de préstamo registradas'}
          </p>
          {!busquedaTexto && user?.rol !== 'conductor' && (
            <Link to="/solicitudes/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-sm font-medium">
              <PlusIcon className="h-4 w-4" /> Crear Solicitud
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudesFiltradas.map((sol) => {
            const ec = getEstadoConfig(sol.estado);
            const pc = getPrioridadConfig(sol.prioridad);
            const isExpanded = expandidas[sol.id];

            return (
              <div key={sol.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* === HEADER ROW — always visible === */}
                <button onClick={() => toggleExpand(sol.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all group ${
                    isExpanded ? `bg-gradient-to-r ${ec.bar} border-b` : 'hover:bg-gray-50'
                  }`}>
                  {/* Estado dot */}
                  <span className={`text-sm flex-shrink-0`}>{ec.icon}</span>

                  {/* Info compacta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ec.badge}`}>{ec.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pc.cls}`}>{pc.label}</span>
                      <span className="font-mono text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">#{sol.folio || sol.id}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        {new Date(sol.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Flujo inter-secretaría */}
                      <span className="text-sm font-bold text-gray-900">
                        {sol.secretaria_origen_siglas || sol.secretaria_solicitante_siglas || '?'}
                      </span>
                      {sol.secretaria_destino_siglas && (
                        <>
                          <ArrowsRightLeftIcon className="h-3.5 w-3.5 text-veracruz-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-veracruz-700">{sol.secretaria_destino_siglas}</span>
                        </>
                      )}
                      {sol.vehiculo_id && sol.marca && (
                        <span className="text-xs text-gray-500 bg-blue-50 px-1.5 py-0.5 rounded hidden sm:inline">
                          🚗 {sol.marca} {sol.modelo} {sol.placas ? `(${sol.placas})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions on the right */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sol.estado === 'pendiente' && esAutorizador && (
                      <span className="hidden md:block text-[10px] font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">Requiere acción</span>
                    )}
                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* === EXPANDED CONTENT === */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left: Details */}
                      <div className="flex-1 space-y-3">
                        {/* Solicitante */}
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-veracruz-100 flex items-center justify-center flex-shrink-0">
                            <BuildingOfficeIcon className="h-4 w-4 text-veracruz-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Préstamo inter-secretaría</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900">{sol.secretaria_origen_siglas || sol.secretaria_solicitante_siglas || '?'}</span>
                              {sol.secretaria_destino_siglas && (
                                <>
                                  <ArrowsRightLeftIcon className="h-4 w-4 text-veracruz-500" />
                                  <span className="font-bold text-veracruz-700">{sol.secretaria_destino_siglas}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Solicitado por: {sol.usuario_nombre}</p>
                          </div>
                        </div>

                        {/* Vehículo */}
                        {sol.vehiculo_id && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-3">
                              <TruckIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">
                                  {sol.estado === 'pendiente' ? 'Vehículo solicitado' : 'Vehículo asignado'}
                                </p>
                                <p className="font-bold text-gray-900 text-sm">
                                  {sol.marca} {sol.modelo}
                                  {sol.vehiculo_anio && <span className="text-gray-400 font-normal ml-1">({sol.vehiculo_anio})</span>}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                                  {sol.placas && <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-xs">{sol.placas}</span>}
                                  {sol.vehiculo_tipo && <span className="bg-white px-1.5 py-0.5 rounded text-xs">{sol.vehiculo_tipo}</span>}
                                  {sol.vehiculo_color && <span>{sol.vehiculo_color}</span>}
                                  {sol.secretaria_destino_siglas && (
                                    <span className="text-veracruz-600 font-medium">de {sol.secretaria_destino_siglas}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Motivo */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Motivo de la solicitud</p>
                          <p className="text-sm text-gray-800">{sol.motivo || '-'}</p>
                          {sol.justificacion && (
                            <p className="text-xs text-veracruz-700 mt-1.5 font-medium">{sol.justificacion}</p>
                          )}
                        </div>

                        {/* Período */}
                        {(sol.fecha_inicio || sol.fecha_fin) && (
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Período solicitado</p>
                              <p className="text-sm font-medium text-gray-800">
                                {sol.fecha_inicio ? new Date(sol.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}
                                {' → '}
                                {sol.fecha_fin ? new Date(sol.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Respuesta del autorizador */}
                        {sol.observaciones && sol.estado !== 'pendiente' && (
                          <div className={`p-3 rounded-lg text-sm border-l-4 ${
                            sol.estado === 'aprobada' ? 'bg-veracruz-50 text-veracruz-700 border-veracruz-500' :
                            sol.estado === 'rechazada' ? 'bg-red-50 text-red-700 border-red-500' :
                            'bg-gray-50 text-gray-600 border-gray-300'
                          }`}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">Respuesta</p>
                            <p>{sol.observaciones}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[160px] flex-wrap">
                        {sol.estado === 'pendiente' && esAutorizador && (
                          <>
                            {sol.vehiculo_id ? (
                              <>
                                <button onClick={() => confirmarAprobacionDirecta(sol)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-xs font-semibold transition-colors flex-1 lg:flex-none">
                                  <CheckCircleIcon className="h-4 w-4" /> Aprobar
                                </button>
                                <button onClick={() => abrirModalAsignar(sol)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-xs font-semibold transition-colors flex-1 lg:flex-none">
                                  <ArrowsRightLeftIcon className="h-4 w-4" /> Cambiar Vehículo
                                </button>
                              </>
                            ) : (
                              <button onClick={() => abrirModalAsignar(sol)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-xs font-semibold transition-colors flex-1 lg:flex-none">
                                <CheckCircleIcon className="h-4 w-4" /> Aprobar y Asignar
                              </button>
                            )}
                            <button onClick={() => rechazarSolicitud(sol.id)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-xs font-semibold transition-colors flex-1 lg:flex-none">
                              <XCircleIcon className="h-4 w-4" /> Rechazar
                            </button>
                          </>
                        )}

                        {sol.estado === 'pendiente' && sol.usuario_solicitante_id === user?.id && (
                          <button onClick={() => cancelarSolicitud(sol.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs font-semibold transition-colors flex-1 lg:flex-none">
                            <XMarkIcon className="h-4 w-4" /> Cancelar
                          </button>
                        )}

                        {sol.estado === 'aprobada' && (
                          <button onClick={() => completarSolicitud(sol.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold transition-colors flex-1 lg:flex-none">
                            <ArrowPathIcon className="h-4 w-4" /> Marcar Devuelto
                          </button>
                        )}

                        {sol.vehiculo_id && (
                          <Link to={`/vehiculos/${sol.vehiculo_id}`}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-veracruz-50 text-veracruz-700 border border-veracruz-200 rounded-lg hover:bg-veracruz-100 text-xs font-semibold transition-colors flex-1 lg:flex-none">
                            <EyeIcon className="h-4 w-4" /> Ver Vehículo
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL DE ASIGNACIÓN ===== */}
      {showAsignarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-veracruz-600 to-veracruz-600 text-white px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Aprobar y Asignar Vehículo</h2>
                  <p className="text-veracruz-100 text-sm mt-0.5">
                    Solicitud #{solicitudSeleccionada?.folio} — {solicitudSeleccionada?.secretaria_origen_siglas || solicitudSeleccionada?.secretaria_solicitante_siglas}
                  </p>
                </div>
                <button onClick={cerrarModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="px-6 py-3 bg-gray-50 border-b flex-shrink-0">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Motivo:</span>
                  <span className="ml-1 text-gray-700 font-medium">{solicitudSeleccionada?.motivo || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Período:</span>
                  <span className="ml-1 font-medium">
                    {solicitudSeleccionada?.fecha_inicio ? new Date(solicitudSeleccionada.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}
                    {' → '}
                    {solicitudSeleccionada?.fecha_fin ? new Date(solicitudSeleccionada.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="px-6 py-3 border-b flex flex-wrap gap-3 flex-shrink-0">
              <div className="flex-1 min-w-[200px] relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar marca, modelo, placas..."
                  value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white font-medium text-gray-700">
                <option value="todos">Todos los tipos</option>
                <option value="sedan">Sedán</option>
                <option value="van">Van</option>
                <option value="pickup">Pickup</option>
                <option value="suv">SUV</option>
                <option value="camioneta">Camioneta</option>
              </select>
            </div>

            {/* Lista de vehículos */}
            <div className="overflow-y-auto flex-1 p-4">
              {loadingVehiculos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-veracruz-500" />
                </div>
              ) : (
                <div className="grid gap-2">
                  {vehiculosDisponibles
                    .filter(v => {
                      const texto = `${v.marca} ${v.modelo} ${v.placas} ${v.secretaria_siglas || ''}`.toLowerCase();
                      const matchBusqueda = busqueda === '' || texto.includes(busqueda.toLowerCase());
                      const matchTipo = filtroTipo === 'todos' || v.tipo === filtroTipo;
                      return matchBusqueda && matchTipo;
                    })
                    .map((v) => {
                      const isSelected = vehiculoSeleccionado?.id === v.id;
                      return (
                        <div key={v.id} onClick={() => setVehiculoSeleccionado(v)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected ? 'border-veracruz-500 bg-veracruz-50 shadow-md' : 'border-gray-200 hover:border-veracruz-300 hover:bg-gray-50'
                          }`}>
                          <div className="flex items-center gap-3">
                            <TruckIcon className={`h-6 w-6 flex-shrink-0 ${isSelected ? 'text-veracruz-500' : 'text-gray-300'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm">{v.marca} {v.modelo}</span>
                                <span className="text-gray-400 text-xs">({v.anio || '-'})</span>
                                {v.estatus && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    v.estatus === 'Bueno' ? 'bg-veracruz-100 text-veracruz-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>{v.estatus}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{v.placas}</span>
                                <span className="flex items-center gap-1">
                                  <BuildingOfficeIcon className="h-3 w-3" />
                                  <strong>{v.secretaria_siglas || 'N/A'}</strong>
                                </span>
                              </div>
                            </div>
                            {isSelected && <CheckCircleIcon className="h-6 w-6 text-veracruz-500 flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  {vehiculosDisponibles.filter(v => {
                    const texto = `${v.marca} ${v.modelo} ${v.placas}`.toLowerCase();
                    return (busqueda === '' || texto.includes(busqueda.toLowerCase())) && (filtroTipo === 'todos' || v.tipo === filtroTipo);
                  }).length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <TruckIcon className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm">No hay vehículos disponibles con los filtros seleccionados</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-gray-600">
                {vehiculoSeleccionado ? (
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-veracruz-500" />
                    <strong>{vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}</strong>
                    <span className="text-gray-400">de {vehiculoSeleccionado.secretaria_siglas}</span>
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">Seleccione un vehículo</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={cerrarModal}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium">Cancelar</button>
                <button onClick={confirmarAsignacion} disabled={!vehiculoSeleccionado || asignando}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                    vehiculoSeleccionado && !asignando ? 'bg-veracruz-600 text-white hover:bg-veracruz-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}>
                  {asignando ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Asignando...</>
                  ) : (
                    <><CheckCircleIcon className="h-4 w-4" /> Aprobar y Asignar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}