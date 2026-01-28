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
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function SolicitudesLista() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  
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

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'aprobada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'en_curso': 'bg-blue-100 text-blue-800',
      'completada': 'bg-gray-100 text-gray-800',
      'cancelada': 'bg-gray-100 text-gray-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadBadge = (prioridad) => {
    const badges = {
      'urgente': 'bg-red-500 text-white',
      'alta': 'bg-orange-500 text-white',
      'normal': 'bg-gray-200 text-gray-700',
      'baja': 'bg-gray-100 text-gray-500'
    };
    return badges[prioridad] || 'badge-gray';
  };

  const solicitudesFiltradas = filtro === 'todas' 
    ? (solicitudes || [])
    : (solicitudes || []).filter(s => s.estado === filtro);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-veracruz-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-500 mt-1">
            Gestión de préstamos entre Secretarías
          </p>
        </div>
        {user?.rol !== 'conductor' && (
          <Link 
            to="/solicitudes/nueva" 
            className="inline-flex items-center gap-2 bg-veracruz-500 text-white px-4 py-2 rounded-lg hover:bg-veracruz-600 transition-colors font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Solicitud
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['todas', 'pendiente', 'aprobada', 'rechazada', 'completada'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f 
                ? 'bg-veracruz-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'todas' && (
              <span className="ml-1">
                ({solicitudes.filter(s => s.estado === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de solicitudes */}
      {solicitudesFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8">
          {esAdmin ? (
            <div className="space-y-6">
              <div className="text-center">
                <ArrowsRightLeftIcon className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Centro de Gestion de Prestamos</h2>
                <p className="text-gray-500 max-w-lg mx-auto">
                  Aqui se gestionan las solicitudes de prestamo de vehiculos entre secretarias. 
                  Las secretarias envian solicitudes y desde aqui se aprueban, rechazan o asignan vehiculos.
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">No hay solicitudes pendientes</h3>
                <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <ClockIcon className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <div className="text-2xl font-bold text-yellow-700">0</div>
                    <div className="text-sm text-yellow-600">Pendientes</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-700">0</div>
                    <div className="text-sm text-green-600">Aprobadas</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <TruckIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-700">0</div>
                    <div className="text-sm text-blue-600">En Prestamo</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">Acciones Rapidas</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link 
                    to="/solicitudes/nueva"
                    className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Crear Solicitud de Prestamo
                  </Link>
                  <Link 
                    to="/prestamos"
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <ArrowsRightLeftIcon className="h-5 w-5" />
                    Ver Prestamos Activos
                  </Link>
                  <Link 
                    to="/vehiculos"
                    className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <TruckIcon className="h-5 w-5" />
                    Ver Vehiculos Disponibles
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No hay solicitudes que mostrar</p>
              <Link 
                to="/solicitudes/nueva"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <PlusIcon className="h-5 w-5" />
                Crear Nueva Solicitud
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudesFiltradas.map((sol) => (
            <div key={sol.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Barra superior con estado y prioridad */}
              <div className={`px-6 py-3 flex items-center justify-between ${
                sol.estado === 'pendiente' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100' :
                sol.estado === 'aprobada' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100' :
                sol.estado === 'rechazada' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100' :
                'bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getEstadoBadge(sol.estado)}`}>
                    {sol.estado === 'pendiente' ? '⏳ Pendiente' :
                     sol.estado === 'aprobada' ? '✓ Aprobada' :
                     sol.estado === 'rechazada' ? '✗ Rechazada' :
                     sol.estado === 'completada' ? '✓ Completada' :
                     sol.estado}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPrioridadBadge(sol.prioridad)}`}>
                    {sol.prioridad === 'urgente' ? '🔴 URGENTE' :
                     sol.prioridad === 'alta' ? '🟠 ALTA' :
                     sol.prioridad === 'normal' ? 'Normal' :
                     '🔵 Baja'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">#{sol.folio || sol.id}</span>
                  <span>•</span>
                  <span>{new Date(sol.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Info principal */}
                  <div className="flex-1 space-y-4">
                    {/* Solicitante */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-veracruz-100 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-veracruz-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Solicitado por</p>
                        <p className="font-semibold text-gray-900 text-lg">
                          {sol.secretaria_origen_siglas || sol.secretaria_solicitante_siglas || 'Sin especificar'}
                        </p>
                        <p className="text-sm text-gray-600">{sol.usuario_nombre}</p>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Motivo de la solicitud</p>
                      <p className="text-gray-900">{sol.motivo}</p>
                      {sol.justificacion && (
                        <p className="text-sm text-veracruz-700 mt-2 font-medium">
                          {sol.justificacion}
                        </p>
                      )}
                    </div>

                    {/* Período */}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Período solicitado</p>
                          <p className="font-medium text-gray-900">
                            {sol.fecha_inicio ? new Date(sol.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}
                            {' → '}
                            {sol.fecha_fin ? new Date(sol.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </p>
                        </div>
                      </div>
                      
                      {sol.vehiculo_id && (
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Vehículo asignado</p>
                            <p className="font-medium text-gray-900">
                              {sol.marca} {sol.modelo} 
                              <span className="text-gray-500 ml-1">({sol.placas})</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {sol.observaciones_autorizador && (
                      <div className={`p-3 rounded-lg text-sm border-l-4 ${
                        sol.estado === 'aprobada' ? 'bg-green-50 text-green-700 border-green-500' :
                        sol.estado === 'rechazada' ? 'bg-red-50 text-red-700 border-red-500' :
                        'bg-gray-50 text-gray-600 border-gray-300'
                      }`}>
                        <strong>Respuesta:</strong> {sol.observaciones_autorizador}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 lg:min-w-[160px]">
                    {sol.estado === 'pendiente' && esAutorizador && (
                      <>
                        <button
                          onClick={() => abrirModalAsignar(sol)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          Aprobar y Asignar
                        </button>
                        <button
                          onClick={() => rechazarSolicitud(sol.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                        >
                          <XCircleIcon className="h-5 w-5" />
                          Rechazar
                        </button>
                      </>
                    )}

                    {sol.estado === 'pendiente' && sol.usuario_solicitante_id === user?.id && (
                      <button
                        onClick={() => cancelarSolicitud(sol.id)}
                        className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    )}

                    {sol.estado === 'aprobada' && (
                      <button
                        onClick={() => completarSolicitud(sol.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        Marcar Devuelto
                      </button>
                    )}

                    {sol.vehiculo_id && (
                      <Link
                        to={`/vehiculos/${sol.vehiculo_id}`}
                        className="text-center px-4 py-2.5 text-veracruz-600 bg-veracruz-50 rounded-lg hover:bg-veracruz-100 font-medium transition-colors"
                      >
                        Ver Vehículo
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Asignación de Vehículo */}
      {showAsignarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Aprobar y Asignar Vehículo</h2>
                  <p className="text-green-100 text-sm mt-1">
                    Solicitud #{solicitudSeleccionada?.folio} - {solicitudSeleccionada?.secretaria_origen_siglas || solicitudSeleccionada?.secretaria_solicitante_siglas}
                  </p>
                </div>
                <button 
                  onClick={cerrarModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Info de la solicitud */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Tipo requerido:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {solicitudSeleccionada?.tipo_vehiculo_requerido || 'Cualquiera'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Período:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {solicitudSeleccionada?.fecha_inicio ? new Date(solicitudSeleccionada.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}
                    {' → '}
                    {solicitudSeleccionada?.fecha_fin ? new Date(solicitudSeleccionada.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Motivo:</span>
                  <span className="ml-2 text-gray-700">{solicitudSeleccionada?.motivo}</span>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="px-6 py-4 border-b flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por marca, modelo, placas..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="todos">Todos los tipos</option>
                <option value="sedan">Sedán</option>
                <option value="van">Van</option>
                <option value="pickup">Pickup</option>
                <option value="suv">SUV</option>
                <option value="camioneta">Camioneta</option>
              </select>
            </div>

            {/* Lista de vehículos */}
            <div className="overflow-y-auto max-h-[400px] p-4">
              {loadingVehiculos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-500"></div>
                </div>
              ) : (
                <div className="grid gap-3">
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
                        <div
                          key={v.id}
                          onClick={() => setVehiculoSeleccionado(v)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <TruckIcon className="h-8 w-8 text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{v.marca} {v.modelo}</span>
                                <span className="text-gray-500">({v.anio || '-'})</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  v.estatus === 'Bueno' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {v.estatus}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{v.placas}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <BuildingOfficeIcon className="h-4 w-4" />
                                  <strong>{v.secretaria_siglas || v.secretaria_nombre || 'Sin asignar'}</strong>
                                </span>
                                {v.numero_economico && (
                                  <>
                                    <span>•</span>
                                    <span>Eco: {v.numero_economico}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {vehiculosDisponibles.filter(v => {
                    const texto = `${v.marca} ${v.modelo} ${v.placas}`.toLowerCase();
                    return (busqueda === '' || texto.includes(busqueda.toLowerCase())) && (filtroTipo === 'todos' || v.tipo === filtroTipo);
                  }).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <TruckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay vehículos disponibles con los filtros seleccionados</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {vehiculoSeleccionado ? (
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <strong>{vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}</strong> 
                    <span className="text-gray-500">de {vehiculoSeleccionado.secretaria_siglas}</span>
                  </span>
                ) : (
                  <span className="text-gray-400">Seleccione un vehículo para asignar</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cerrarModal}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAsignacion}
                  disabled={!vehiculoSeleccionado || asignando}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    vehiculoSeleccionado && !asignando
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {asignando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Asignando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Aprobar y Asignar Vehículo
                    </>
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
