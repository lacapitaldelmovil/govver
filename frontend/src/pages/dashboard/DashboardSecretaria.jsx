import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  TruckIcon, DocumentTextIcon, ArrowsRightLeftIcon,
  ExclamationTriangleIcon, ShieldCheckIcon,
  ChartBarIcon, PlusIcon, ClockIcon,
  CheckCircleIcon, XCircleIcon, MapPinIcon,
  BuildingOfficeIcon, CurrencyDollarIcon, EyeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function DashboardSecretaria() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [seguros, setSeguros] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [vehiculosOciosos, setVehiculosOciosos] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [statsRes, segurosRes, solRes, asgRes, ociosRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/alertas-seguros'),
        api.get('/solicitudes?limit=5'),
        api.get('/asignaciones/activas'),
        api.get('/dashboard/vehiculos-ociosos'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (segurosRes.status === 'fulfilled') setSeguros(segurosRes.value.data);
      if (solRes.status === 'fulfilled') {
        const data = solRes.value.data;
        setSolicitudes(Array.isArray(data) ? data : data.solicitudes || []);
      }
      if (asgRes.status === 'fulfilled') setAsignaciones(asgRes.value.data || []);
      if (ociosRes.status === 'fulfilled') setVehiculosOciosos(ociosRes.value.data || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    const map = {
      'Operando': 'text-green-700 bg-green-100',
      'Disponible': 'text-blue-700 bg-blue-100',
      'En taller': 'text-yellow-700 bg-yellow-100',
      'Mal estado': 'text-orange-700 bg-orange-100',
      'Baja': 'text-red-700 bg-red-100',
    };
    return map[estado] || 'text-gray-700 bg-gray-100';
  };

  const getSolEstadoStyle = (estado) => {
    const map = {
      'pendiente': { bg: 'bg-amber-100 text-amber-800', icon: ClockIcon, label: 'Pendiente' },
      'aprobada': { bg: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Aprobada' },
      'rechazada': { bg: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Rechazada' },
      'completada': { bg: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'Completada' },
      'cancelada': { bg: 'bg-gray-100 text-gray-600', icon: XCircleIcon, label: 'Cancelada' },
    };
    return map[estado] || map['pendiente'];
  };

  const formatFechaCorta = (fecha) => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-veracruz-500 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  const estadosData = stats?.vehiculosPorEstado || [];
  const regimenData = stats?.vehiculosPorRegimen || [];
  const totalVehiculos = stats?.totalVehiculos || 0;
  const segurosStats = seguros?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BuildingOfficeIcon className="h-7 w-7 text-veracruz-600" />
            {user?.secretaria_nombre || 'Mi Secretaría'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Panel de control vehicular</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/solicitudes/nueva"
            className="flex items-center gap-2 px-4 py-2.5 bg-veracruz-600 text-white rounded-xl hover:bg-veracruz-700 transition-colors text-sm font-semibold shadow-sm">
            <PlusIcon className="h-4 w-4" />
            Nueva Solicitud
          </Link>
          <Link to="/vehiculos/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
            <TruckIcon className="h-4 w-4" />
            Agregar Vehículo
          </Link>
        </div>
      </div>

      {/* ═══════════════ INDICADORES PRINCIPALES ═══════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Vehículos */}
        <Link to="/vehiculos"
          className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-veracruz-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehículos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalVehiculos}</p>
            </div>
            <div className="p-2.5 bg-veracruz-50 rounded-xl group-hover:bg-veracruz-100 transition-colors">
              <TruckIcon className="h-6 w-6 text-veracruz-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            {estadosData.find(e => e.estado === 'Operando') && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                {estadosData.find(e => e.estado === 'Operando')?.cantidad || 0} operando
              </span>
            )}
          </div>
        </Link>

        {/* Asignaciones Activas */}
        <Link to="/vehiculos/asignaciones"
          className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">En Uso</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{asignaciones.length}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
              <ArrowsRightLeftIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Vehículos con salida activa
          </div>
        </Link>

        {/* Solicitudes Pendientes */}
        <Link to="/solicitudes"
          className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solicitudes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.solicitudesPendientes || 0}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {stats?.solicitudesPendientes > 0 ? (
              <span className="text-amber-600 font-medium">Pendientes de revisión</span>
            ) : (
              'Sin solicitudes pendientes'
            )}
          </div>
        </Link>

        {/* Alertas Seguros */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Seguros</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{segurosStats.vencidos || 0}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${segurosStats.vencidos > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <ShieldCheckIcon className={`h-6 w-6 ${segurosStats.vencidos > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            {segurosStats.vencidos > 0 ? (
              <span className="text-red-600 font-medium">Vencidos — Atención</span>
            ) : (
              <span className="text-green-600 font-medium">Todo en orden</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ DISTRIBUCIÓN Y SEGUROS ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Distribución por Estado */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Estado de la Flota</h2>
            <Link to="/vehiculos" className="text-xs text-veracruz-600 hover:text-veracruz-800 font-medium flex items-center gap-1">
              Ver todo <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {/* Barra visual horizontal */}
            {totalVehiculos > 0 && (
              <div className="flex rounded-full overflow-hidden h-4 mb-4">
                {estadosData.map((e, idx) => {
                  const pct = (e.cantidad / totalVehiculos) * 100;
                  if (pct < 1) return null;
                  const colors = {
                    'Operando': 'bg-green-500', 'Disponible': 'bg-blue-500',
                    'En taller': 'bg-yellow-500', 'Mal estado': 'bg-orange-500',
                    'Baja': 'bg-red-500',
                  };
                  return (
                    <div key={idx} className={`${colors[e.estado] || 'bg-gray-400'} transition-all`}
                      style={{ width: `${pct}%` }} title={`${e.estado}: ${e.cantidad}`} />
                  );
                })}
              </div>
            )}

            {/* Lista detallada */}
            <div className="space-y-2.5">
              {estadosData.map((e, idx) => {
                const pct = totalVehiculos > 0 ? ((e.cantidad / totalVehiculos) * 100).toFixed(1) : 0;
                return (
                  <button key={idx} onClick={() => navigate(`/vehiculos?estado_operativo=${encodeURIComponent(e.estado)}`)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group text-left">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getEstadoColor(e.estado)}`}>
                        {e.estado}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800">{e.cantidad}</span>
                      <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                      <ChevronRightIcon className="h-3.5 w-3.5 text-gray-300 group-hover:text-veracruz-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
              {stats?.propuestosBaja > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-purple-50/50">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-100">Dict. Baja</span>
                  <span className="text-sm font-bold text-purple-800">{stats.propuestosBaja}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seguros */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Seguros Vehiculares</h2>
            <ShieldCheckIcon className="h-5 w-5 text-gray-300" />
          </div>
          <div className="p-5 space-y-3">
            {/* Barra de seguros */}
            {segurosStats.total > 0 && (
              <div className="flex rounded-full overflow-hidden h-4 mb-4">
                {[
                  { key: 'vigentes', color: 'bg-green-500' },
                  { key: 'por_vencer', color: 'bg-amber-400' },
                  { key: 'vencidos', color: 'bg-red-500' },
                  { key: 'sin_seguro', color: 'bg-gray-300' },
                  { key: 'en_tramite', color: 'bg-blue-400' },
                  { key: 'no_aplica', color: 'bg-gray-200' },
                ].map(({ key, color }) => {
                  const val = segurosStats[key] || 0;
                  const pct = (val / segurosStats.total) * 100;
                  if (pct < 1) return null;
                  return <div key={key} className={`${color}`} style={{ width: `${pct}%` }} />;
                })}
              </div>
            )}

            {/* Grid de categorías */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                <div>
                  <p className="text-lg font-bold text-green-800">{segurosStats.vigentes || 0}</p>
                  <p className="text-[10px] text-green-600 font-medium uppercase">Vigentes</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                segurosStats.vencidos > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                <div>
                  <p className="text-lg font-bold text-red-800">{segurosStats.vencidos || 0}</p>
                  <p className="text-[10px] text-red-600 font-medium uppercase">Vencidos</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                segurosStats.por_vencer > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0"></div>
                <div>
                  <p className="text-lg font-bold text-amber-800">{segurosStats.por_vencer || 0}</p>
                  <p className="text-[10px] text-amber-600 font-medium uppercase">Por Vencer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></div>
                <div>
                  <p className="text-lg font-bold text-gray-700">{(segurosStats.sin_seguro || 0) + (segurosStats.no_aplica || 0)}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase">Sin seguro / N/A</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ RÉGIMEN Y ACCESOS RÁPIDOS ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Distribución por Régimen */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Por Régimen</h2>
          </div>
          <div className="p-5 space-y-3">
            {regimenData.map((r, idx) => {
              const pct = totalVehiculos > 0 ? ((r.cantidad / totalVehiculos) * 100).toFixed(0) : 0;
              const colors = {
                'Propio': { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
                'Arrendado': { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
                'Comodato': { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
              };
              const c = colors[r.regimen] || { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' };
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>{r.regimen}</span>
                    <span className="text-sm font-bold text-gray-800">{r.cantidad} <span className="text-xs text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {stats?.vehiculosArrendados > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                <CurrencyDollarIcon className="h-4 w-4 text-purple-400" />
                <span>{stats.vehiculosArrendados} vehículos arrendados en tu flota</span>
              </div>
            )}
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Accesos Rápidos</h2>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Catálogo Vehículos', href: '/vehiculos', icon: TruckIcon, color: 'veracruz', desc: 'Ver todos los vehículos' },
              { label: 'Nueva Solicitud', href: '/solicitudes/nueva', icon: PlusIcon, color: 'blue', desc: 'Solicitar vehículo' },
              { label: 'Mis Solicitudes', href: '/solicitudes', icon: DocumentTextIcon, color: 'amber', desc: 'Historial de solicitudes' },
              { label: 'Préstamos', href: '/prestamos', icon: ArrowsRightLeftIcon, color: 'indigo', desc: 'Vehículos prestados' },
              { label: 'Reportes', href: '/reportes', icon: ChartBarIcon, color: 'emerald', desc: 'Informes y estadísticas' },
              { label: 'Municipios', href: '/municipios', icon: MapPinIcon, color: 'teal', desc: 'Distribución geográfica' },
            ].map((item) => {
              const colorMap = {
                veracruz: 'bg-veracruz-50 text-veracruz-700 group-hover:bg-veracruz-100',
                blue: 'bg-blue-50 text-blue-700 group-hover:bg-blue-100',
                amber: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100',
                indigo: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100',
                emerald: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
                teal: 'bg-teal-50 text-teal-700 group-hover:bg-teal-100',
              };
              return (
                <Link key={item.label} to={item.href}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className={`p-2 rounded-lg transition-colors ${colorMap[item.color]}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{item.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ ASIGNACIONES ACTIVAS Y SOLICITUDES ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Asignaciones Activas (vehículos en uso) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Vehículos en Uso
            </h2>
            <Link to="/vehiculos/asignaciones" className="text-xs text-veracruz-600 hover:text-veracruz-800 font-medium flex items-center gap-1">
              Ver todo <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {asignaciones.length === 0 ? (
              <div className="p-8 text-center">
                <ArrowsRightLeftIcon className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No hay vehículos en uso</p>
                <p className="text-[10px] text-gray-300 mt-1">Todos los vehículos están disponibles</p>
              </div>
            ) : (
              asignaciones.slice(0, 6).map((a) => (
                <div key={a.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        🚗 {a.vehiculo_marca || a.marca} {a.vehiculo_linea || a.linea || a.vehiculo_modelo || a.modelo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{a.conductor_nombre}</span>
                        {a.destino && (
                          <span className="text-[10px] text-gray-400">→ {a.destino}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className="text-[10px] font-mono text-gray-400">{a.folio}</span>
                      <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                        {formatFechaCorta(a.fecha_salida)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Solicitudes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Últimas Solicitudes</h2>
            <Link to="/solicitudes" className="text-xs text-veracruz-600 hover:text-veracruz-800 font-medium flex items-center gap-1">
              Ver todo <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {solicitudes.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentTextIcon className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No hay solicitudes recientes</p>
                <Link to="/solicitudes/nueva" className="inline-flex items-center gap-1 text-xs text-veracruz-600 hover:text-veracruz-800 mt-2 font-medium">
                  <PlusIcon className="h-3.5 w-3.5" /> Crear primera solicitud
                </Link>
              </div>
            ) : (
              solicitudes.slice(0, 6).map((sol) => {
                const estilo = getSolEstadoStyle(sol.estado);
                const EstIcon = estilo.icon;
                return (
                  <div key={sol.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {sol.tipo_solicitud === 'prestamo' ? '🔄' : sol.tipo_solicitud === 'baja' ? '📛' : '📋'} {sol.folio || `SOL-${sol.id}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{sol.motivo || sol.tipo_solicitud}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${estilo.bg}`}>
                          <EstIcon className="h-3 w-3" />
                          {estilo.label}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatFechaCorta(sol.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ VEHÍCULOS EN MAL ESTADO ═══════════════ */}
      {vehiculosOciosos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
              Vehículos en Mal Estado
            </h2>
            <Link to="/vehiculos?estado_operativo=Mal+estado" className="text-xs text-veracruz-600 hover:text-veracruz-800 font-medium flex items-center gap-1">
              Ver todos <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Vehículo</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Placas</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Dependencia</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Municipio</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehiculosOciosos.slice(0, 5).map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{v.marca} {v.linea || v.modelo}</p>
                      <p className="text-xs text-gray-400">{v.anio}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-600">{v.placas || '-'}</td>
                    <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">{v.secretaria_siglas || '-'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">{v.municipio || '-'}</td>
                    <td className="px-5 py-3">
                      <Link to={`/vehiculos/${v.id}`} className="text-veracruz-600 hover:text-veracruz-800">
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
