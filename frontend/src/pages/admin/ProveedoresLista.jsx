import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  XCircleIcon,
  EyeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

/* ==================== COMPONENTES AUXILIARES ==================== */

/* Colores fijos para giros */
const giroColors = {
  'Venta de vehículos': 'bg-blue-100 text-blue-700',
  'Mantenimiento': 'bg-green-100 text-green-700',
  'Refacciones': 'bg-orange-100 text-orange-700',
  'Combustible': 'bg-red-100 text-red-700',
  'Seguros': 'bg-purple-100 text-purple-700',
  'Arrendamiento': 'bg-amber-100 text-amber-700',
  'Servicios': 'bg-teal-100 text-teal-700',
};

function getGiroColor(giro) {
  if (!giro) return 'bg-gray-100 text-gray-600';
  for (const [key, val] of Object.entries(giroColors)) {
    if (giro.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return 'bg-gray-100 text-gray-600';
}

/* Avatar con iniciales del proveedor */
const avatarColors = [
  'from-veracruz-500 to-veracruz-700',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-green-700',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-violet-700',
  'from-rose-500 to-red-700',
  'from-teal-500 to-cyan-700',
  'from-pink-500 to-fuchsia-700',
];

function getInitials(nombre) {
  if (!nombre) return '?';
  const words = nombre.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getAvatarColor(nombre) {
  if (!nombre) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function ProveedoresLista() {
  const { user } = useAuthStore();
  const [proveedores, setProveedores] = useState([]);
  const [secretarias, setSecretarias] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSecretaria, setFiltroSecretaria] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [filtroGiro, setFiltroGiro] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [vistaCards, setVistaCards] = useState(true);
  const [detalleExpandido, setDetalleExpandido] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    rfc: '',
    contacto_nombre: '',
    contacto_email: '',
    contacto_telefono: '',
    direccion: '',
    giro: '',
    fecha_inicio: '',
    fecha_fin: '',
    secretaria_id: '',
    servicios: '',
    monto_total_contratos: '',
    numero_contratos: '',
    calificacion: 0,
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtroSecretaria, filtroActivo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroSecretaria) params.append('secretaria_id', filtroSecretaria);
      if (filtroActivo) params.append('activo', filtroActivo);

      const [provRes, secRes, estRes] = await Promise.all([
        api.get(`/proveedores?${params.toString()}`),
        api.get('/secretarias'),
        api.get('/proveedores/estadisticas')
      ]);

      setProveedores(provRes.data);
      setSecretarias(secRes.data);
      setEstadisticas(estRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  /* Giros únicos para filtro */
  const girosUnicos = useMemo(() => {
    const giros = new Set();
    proveedores.forEach(p => { if (p.giro) giros.add(p.giro); });
    return [...giros].sort();
  }, [proveedores]);

  const proveedoresFiltrados = useMemo(() => {
    let filtrados = proveedores;
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.nombre?.toLowerCase().includes(termino) ||
        p.rfc?.toLowerCase().includes(termino) ||
        p.giro?.toLowerCase().includes(termino) ||
        p.secretaria_nombre?.toLowerCase().includes(termino) ||
        p.contacto_nombre?.toLowerCase().includes(termino)
      );
    }
    if (filtroGiro) {
      filtrados = filtrados.filter(p => p.giro === filtroGiro);
    }
    return filtrados;
  }, [proveedores, busqueda, filtroGiro]);

  const abrirModalNuevo = () => {
    setProveedorEditando(null);
    setFormData({
      nombre: '',
      rfc: '',
      contacto_nombre: '',
      contacto_email: '',
      contacto_telefono: '',
      direccion: '',
      giro: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      secretaria_id: user?.rol === 'admin_secretaria' ? user.secretaria_id : '',
      servicios: '',
      monto_total_contratos: '',
      numero_contratos: '',
      calificacion: 0,
      observaciones: ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (proveedor) => {
    setProveedorEditando(proveedor);
    setFormData({
      nombre: proveedor.nombre || '',
      rfc: proveedor.rfc || '',
      contacto_nombre: proveedor.contacto_nombre || '',
      contacto_email: proveedor.contacto_email || '',
      contacto_telefono: proveedor.contacto_telefono || '',
      direccion: proveedor.direccion || '',
      giro: proveedor.giro || '',
      fecha_inicio: proveedor.fecha_inicio || '',
      fecha_fin: proveedor.fecha_fin || '',
      secretaria_id: proveedor.secretaria_id || '',
      servicios: proveedor.servicios || '',
      monto_total_contratos: proveedor.monto_total_contratos || '',
      numero_contratos: proveedor.numero_contratos || '',
      calificacion: proveedor.calificacion || 0,
      observaciones: proveedor.observaciones || ''
    });
    setModalAbierto(true);
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.fecha_inicio) {
      toast.error('Nombre y fecha de inicio son requeridos');
      return;
    }
    if (!formData.secretaria_id && user?.rol !== 'admin_secretaria') {
      toast.error('Seleccione una secretaría');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        ...formData,
        monto_total_contratos: formData.monto_total_contratos ? parseFloat(formData.monto_total_contratos) : 0,
        numero_contratos: formData.numero_contratos ? parseInt(formData.numero_contratos) : 0,
        calificacion: parseInt(formData.calificacion) || 0
      };

      if (proveedorEditando) {
        await api.put(`/proveedores/${proveedorEditando.id}`, payload);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await api.post('/proveedores', payload);
        toast.success('Proveedor creado exitosamente');
      }

      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      toast.error(error.response?.data?.error || 'Error al guardar proveedor');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarProveedor = async (id) => {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;
    try {
      await api.delete(`/proveedores/${id}`);
      toast.success('Proveedor eliminado');
      cargarDatos();
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      toast.error('Error al eliminar proveedor');
    }
  };

  const calcularAniosTexto = (fechaInicio, fechaFin) => {
    if (!fechaInicio) return '-';
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const anios = Math.floor((fin - inicio) / (365.25 * 24 * 60 * 60 * 1000));
    const meses = Math.floor(((fin - inicio) / (30.44 * 24 * 60 * 60 * 1000)) % 12);
    if (anios === 0) return `${meses} mes${meses !== 1 ? 'es' : ''}`;
    return `${anios} año${anios !== 1 ? 's' : ''}${meses > 0 ? ` ${meses}m` : ''}`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
  };

  const formatMonto = (monto) => {
    if (!monto || monto === 0) return '-';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(monto);
  };

  /* Render estrellas */
  const renderEstrellas = (cal) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          i <= (cal || 0)
            ? <StarSolid key={i} className="h-3.5 w-3.5 text-amber-400" />
            : <StarIcon key={i} className="h-3.5 w-3.5 text-gray-200" />
        ))}
      </div>
    );
  };

  /* Render estrellas interactivas */
  const renderEstrellasInput = (cal, onChange) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i === cal ? 0 : i)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            {i <= cal
              ? <StarSolid className="h-6 w-6 text-amber-400" />
              : <StarIcon className="h-6 w-6 text-gray-300 hover:text-amber-300" />
            }
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-2">{cal || 0}/5</span>
      </div>
    );
  };

  /* ========== CARD VIEW ========== */
  const renderProveedorCard = (proveedor) => {
    const esActivo = proveedor.estado_proveeduria === 'Activo';
    const expanded = detalleExpandido === proveedor.id;

    return (
      <div
        key={proveedor.id}
        className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
          esActivo ? 'border-gray-100' : 'border-gray-200 opacity-75'
        }`}
      >
        {/* Color bar */}
        <div className={`h-1.5 ${esActivo ? 'bg-gradient-to-r from-veracruz-500 to-veracruz-600' : 'bg-gray-300'}`} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(proveedor.nombre)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-bold">{getInitials(proveedor.nombre)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <Link
                to={`/vehiculos?proveedor=${encodeURIComponent(proveedor.nombre)}`}
                className="font-bold text-gray-900 text-sm hover:text-veracruz-600 transition-colors truncate block"
              >
                {proveedor.nombre}
              </Link>
              {proveedor.rfc && (
                <p className="text-[10px] text-gray-400 font-mono">{proveedor.rfc}</p>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
              esActivo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {esActivo ? '● Activo' : '○ Inactivo'}
            </span>
          </div>

          {/* Info row */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
              {proveedor.secretaria_siglas || proveedor.secretaria_nombre || 'Sin asignar'}
            </span>
            {proveedor.giro && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getGiroColor(proveedor.giro)}`}>
                {proveedor.giro}
              </span>
            )}
          </div>

          {/* Años + Calificación */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-veracruz-500" />
              <span className="text-xs font-bold text-veracruz-700">
                {proveedor.anios_proveeduria || 0} año{(proveedor.anios_proveeduria || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            {renderEstrellas(proveedor.calificacion)}
          </div>

          {/* Período */}
          <div className="text-[10px] text-gray-400 mb-2">
            {formatearFecha(proveedor.fecha_inicio)} → {proveedor.fecha_fin ? formatearFecha(proveedor.fecha_fin) : 'Presente'}
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setDetalleExpandido(expanded ? null : proveedor.id)}
            className="w-full flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-veracruz-600 transition-colors py-1"
          >
            {expanded ? 'Menos detalles' : 'Más detalles'}
            <ChevronDownIcon className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              {proveedor.contacto_nombre && (
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span>{proveedor.contacto_nombre}</span>
                </div>
              )}
              {proveedor.contacto_email && (
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">{proveedor.contacto_email}</span>
                </div>
              )}
              {proveedor.contacto_telefono && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span>{proveedor.contacto_telefono}</span>
                </div>
              )}
              {proveedor.direccion && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">{proveedor.direccion}</span>
                </div>
              )}
              {proveedor.monto_total_contratos > 0 && (
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span>{formatMonto(proveedor.monto_total_contratos)} ({proveedor.numero_contratos || 0} contratos)</span>
                </div>
              )}
              {proveedor.servicios && (
                <div className="flex items-start gap-2">
                  <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                  <span className="line-clamp-2">{proveedor.servicios}</span>
                </div>
              )}
              {proveedor.observaciones && (
                <div className="flex items-start gap-2">
                  <DocumentTextIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                  <span className="line-clamp-2 italic">{proveedor.observaciones}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-50 px-4 py-2 bg-gray-50/50 flex items-center justify-between">
          <Link
            to={`/vehiculos?proveedor=${encodeURIComponent(proveedor.nombre)}`}
            className="text-[10px] text-gray-400 hover:text-veracruz-600 flex items-center gap-1 transition-colors"
          >
            <EyeIcon className="h-3 w-3" />
            Ver vehículos
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); abrirModalEditar(proveedor); }}
              className="p-1.5 text-gray-400 hover:text-veracruz-600 hover:bg-veracruz-50 rounded-lg transition-colors"
              title="Editar"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); eliminarProveedor(proveedor.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-veracruz-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ===================== HEADER + STATS INTEGRADO ===================== */}
      <div className="bg-gradient-to-r from-veracruz-600 via-veracruz-700 to-veracruz-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-veracruz-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BuildingOfficeIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Proveedores</h1>
              <p className="text-veracruz-200 text-[11px] sm:text-xs">Gestión de proveedores por secretaría</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargarDatos} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Actualizar">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <button onClick={abrirModalNuevo} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-xs transition-colors">
              <PlusIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Stats + Top proveedores integrados */}
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          {/* Stats inline */}
          <div className="grid grid-cols-4 gap-2 flex-shrink-0">
            <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-black leading-tight">{estadisticas?.total || 0}</p>
              <p className="text-[9px] text-veracruz-200 uppercase tracking-wider">Total</p>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-black leading-tight">{estadisticas?.activos || 0}</p>
              <p className="text-[9px] text-green-300 uppercase tracking-wider">Activos</p>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-black leading-tight">{estadisticas?.promedio_anios || 0}</p>
              <p className="text-[9px] text-blue-300 uppercase tracking-wider">Prom. Años</p>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-black leading-tight">{estadisticas?.por_secretaria?.length || 0}</p>
              <p className="text-[9px] text-purple-300 uppercase tracking-wider">Secretarías</p>
            </div>
          </div>

          {/* Top proveedores inline */}
          {estadisticas?.top_proveedores?.length > 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-veracruz-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CalendarDaysIcon className="h-3 w-3" /> Más años
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                {estadisticas.top_proveedores.slice(0, 5).map((prov, idx) => (
                  <div key={idx} className="bg-white/10 rounded-md px-2 py-1.5 min-w-[110px] flex-shrink-0">
                    <p className="font-medium text-[10px] truncate">{prov.nombre}</p>
                    <p className="text-veracruz-200 text-[9px]"><span className="font-bold text-white">{prov.anios}</span> años</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== TOOLBAR (con distribución integrada) ===================== */}
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="flex flex-col gap-2">
          {/* Fila 1: Buscador + Filtros en una línea */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar nombre, RFC, giro..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
              />
            </div>

            {['admin', 'gobernacion'].includes(user?.rol) && (
              <select
                value={filtroSecretaria}
                onChange={(e) => setFiltroSecretaria(e.target.value)}
                className="text-xs border rounded-lg px-2 py-1.5 text-gray-600 focus:ring-veracruz-500 focus:border-veracruz-500"
              >
                <option value="">Todas las Secretarías</option>
                {secretarias.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.siglas} - {sec.nombre}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value)}
                className="text-[11px] border rounded-lg px-2 py-1.5 text-gray-600 focus:ring-veracruz-500 focus:border-veracruz-500"
              >
                <option value="">Estado</option>
                <option value="1">✅ Activos</option>
                <option value="0">⭕ Inactivos</option>
              </select>

              {girosUnicos.length > 0 && (
                <select
                  value={filtroGiro}
                  onChange={(e) => setFiltroGiro(e.target.value)}
                  className="text-[11px] border rounded-lg px-2 py-1.5 text-gray-600 focus:ring-veracruz-500 focus:border-veracruz-500"
                >
                  <option value="">Giro</option>
                  {girosUnicos.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              )}

              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {proveedoresFiltrados.length} result.
              </span>

              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setVistaCards(true)}
                  className={`p-1 rounded-md transition-all ${vistaCards ? 'bg-white shadow-sm text-veracruz-600' : 'text-gray-400'}`}
                  title="Tarjetas"
                >
                  <Squares2X2Icon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setVistaCards(false)}
                  className={`p-1 rounded-md transition-all ${!vistaCards ? 'bg-white shadow-sm text-veracruz-600' : 'text-gray-400'}`}
                  title="Tabla"
                >
                  <ListBulletIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Fila 2: Distribución por secretaría (chips) */}
          {estadisticas?.por_secretaria?.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
              {estadisticas.por_secretaria
                .filter(s => s.total_proveedores > 0)
                .map((sec, idx) => {
                  const found = secretarias.find(s => s.siglas === sec.siglas || s.nombre === sec.nombre);
                  const isSelected = found && filtroSecretaria === String(found.id);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (found) setFiltroSecretaria(isSelected ? '' : String(found.id));
                      }}
                      className={`flex-shrink-0 px-2 py-1 rounded-md border text-[10px] transition-all ${
                        isSelected
                          ? 'bg-veracruz-100 border-veracruz-400 text-veracruz-700 font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-veracruz-50'
                      }`}
                    >
                      <span className="font-bold">{sec.total_proveedores}</span> {sec.siglas || sec.nombre}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ===================== CONTENT ===================== */}
      {vistaCards ? (
        /* -------- CARD VIEW -------- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {proveedoresFiltrados.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <BuildingOfficeIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No se encontraron proveedores</p>
              {busqueda && <p className="text-gray-300 text-sm mt-1">con &ldquo;{busqueda}&rdquo;</p>}
            </div>
          ) : (
            proveedoresFiltrados.map(p => renderProveedorCard(p))
          )}
        </div>
      ) : (
        /* -------- TABLE VIEW -------- */
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Secretaría</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Años</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Giro</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Calificación</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proveedoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                      No se encontraron proveedores
                    </td>
                  </tr>
                ) : (
                  proveedoresFiltrados.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-veracruz-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarColor(proveedor.nombre)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-[10px] font-bold">{getInitials(proveedor.nombre)}</span>
                          </div>
                          <div>
                            <Link
                              to={`/vehiculos?proveedor=${encodeURIComponent(proveedor.nombre)}`}
                              className="font-medium text-gray-900 hover:text-veracruz-600 hover:underline text-sm"
                            >
                              {proveedor.nombre}
                            </Link>
                            {proveedor.rfc && (
                              <p className="text-[10px] text-gray-400 font-mono">{proveedor.rfc}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                          {proveedor.secretaria_siglas || proveedor.secretaria_nombre || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <p>{formatearFecha(proveedor.fecha_inicio)}</p>
                        <p className="text-gray-300">→ {proveedor.fecha_fin ? formatearFecha(proveedor.fecha_fin) : 'Presente'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-veracruz-100 text-veracruz-700">
                          {proveedor.anios_proveeduria || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {proveedor.giro ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getGiroColor(proveedor.giro)}`}>
                            {proveedor.giro}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">{renderEstrellas(proveedor.calificacion)}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          proveedor.estado_proveeduria === 'Activo'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {proveedor.estado_proveeduria === 'Activo' ? '● Activo' : '○ Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirModalEditar(proveedor)}
                            className="p-1.5 text-gray-400 hover:text-veracruz-600 hover:bg-veracruz-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminarProveedor(proveedor.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== MODAL CREAR/EDITAR ===================== */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-veracruz-600 to-veracruz-700 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    {proveedorEditando ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  </div>
                  <h2 className="text-lg font-bold">
                    {proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h2>
                </div>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={guardarProveedor} className="p-6 space-y-5">
                {/* Información básica */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BuildingOfficeIcon className="h-4 w-4 text-veracruz-500" />
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del Proveedor *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">RFC</label>
                      <input
                        type="text"
                        value={formData.rfc}
                        onChange={(e) => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 font-mono"
                        maxLength={13}
                        placeholder="XAXX010101000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Giro / Actividad</label>
                      <input
                        type="text"
                        value={formData.giro}
                        onChange={(e) => setFormData({...formData, giro: e.target.value})}
                        placeholder="Ej: Mantenimiento, Refacciones..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Período de Proveduría */}
                <div className="bg-veracruz-50/50 rounded-xl p-4 border border-veracruz-100">
                  <h3 className="text-xs font-semibold text-veracruz-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Período de Proveduría
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Inicio *</label>
                      <input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Fecha de Fin <span className="text-gray-400 font-normal">(vacío = activo)</span>
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                  </div>
                  {formData.fecha_inicio && (
                    <p className="mt-2 text-xs text-veracruz-600 font-medium">
                      ⏱ Tiempo como proveedor: {calcularAniosTexto(formData.fecha_inicio, formData.fecha_fin)}
                    </p>
                  )}
                </div>

                {/* Secretaría */}
                {['admin', 'gobernacion'].includes(user?.rol) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Secretaría *</label>
                    <select
                      value={formData.secretaria_id}
                      onChange={(e) => setFormData({...formData, secretaria_id: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      required
                    >
                      <option value="">Seleccione una secretaría</option>
                      {secretarias.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.siglas} - {sec.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Contacto */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-blue-500" />
                    Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.contacto_nombre}
                        onChange={(e) => setFormData({...formData, contacto_nombre: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.contacto_email}
                        onChange={(e) => setFormData({...formData, contacto_email: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={formData.contacto_telefono}
                        onChange={(e) => setFormData({...formData, contacto_telefono: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                  />
                </div>

                {/* Servicios */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Servicios / Productos</label>
                  <textarea
                    value={formData.servicios}
                    onChange={(e) => setFormData({...formData, servicios: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                    placeholder="Descripción de los servicios o productos que ofrece"
                  />
                </div>

                {/* Contratos + Calificación */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Monto Total Contratos</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        value={formData.monto_total_contratos}
                        onChange={(e) => setFormData({...formData, monto_total_contratos: e.target.value})}
                        className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1"># Contratos</label>
                    <input
                      type="number"
                      value={formData.numero_contratos}
                      onChange={(e) => setFormData({...formData, numero_contratos: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Calificación</label>
                    {renderEstrellasInput(formData.calificacion, (v) => setFormData({...formData, calificacion: v}))}
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-5 py-2 text-sm bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    {guardando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Guardando...
                      </>
                    ) : (
                      proveedorEditando ? 'Actualizar Proveedor' : 'Crear Proveedor'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
