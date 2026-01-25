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
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ProveedoresLista() {
  const { user } = useAuthStore();
  const [proveedores, setProveedores] = useState([]);
  const [secretarias, setSecretarias] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSecretaria, setFiltroSecretaria] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

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

  const proveedoresFiltrados = useMemo(() => {
    if (!busqueda) return proveedores;
    const termino = busqueda.toLowerCase();
    return proveedores.filter(p => 
      p.nombre?.toLowerCase().includes(termino) ||
      p.rfc?.toLowerCase().includes(termino) ||
      p.giro?.toLowerCase().includes(termino) ||
      p.secretaria_nombre?.toLowerCase().includes(termino)
    );
  }, [proveedores, busqueda]);

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
    return `${anios} año${anios !== 1 ? 's' : ''}`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-veracruz-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">Gestión de proveedores por secretaría</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Proveedores Activos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.activos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Promedio Años</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.promedio_anios}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Secretarías</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.por_secretaria?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Proveedores por Años */}
      {estadisticas?.top_proveedores?.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-veracruz-600" />
            Proveedores con más años de servicio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {estadisticas.top_proveedores.map((prov, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900 truncate">{prov.nombre}</p>
                <p className="text-sm text-veracruz-600 font-bold">{prov.anios} años</p>
                <p className="text-xs text-gray-500">
                  {formatearFecha(prov.fecha_inicio)} - {prov.fecha_fin ? formatearFecha(prov.fecha_fin) : 'Presente'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RFC o giro..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
            />
          </div>

          {/* Filtro Secretaría */}
          {['admin', 'gobernacion'].includes(user?.rol) && (
            <select
              value={filtroSecretaria}
              onChange={(e) => setFiltroSecretaria(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
            >
              <option value="">Todas las Secretarías</option>
              {secretarias.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.siglas} - {sec.nombre}</option>
              ))}
            </select>
          )}

          {/* Filtro Estado */}
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
          >
            <option value="">Todos los estados</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Secretaría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Años
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron proveedores
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <Link 
                          to={`/vehiculos?proveedor=${encodeURIComponent(proveedor.nombre)}`}
                          className="font-medium text-gray-900 hover:text-veracruz-600 hover:underline cursor-pointer"
                        >
                          {proveedor.nombre}
                        </Link>
                        {proveedor.rfc && (
                          <p className="text-sm text-gray-500">RFC: {proveedor.rfc}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {proveedor.secretaria_siglas || proveedor.secretaria_nombre || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>
                        <p>{formatearFecha(proveedor.fecha_inicio)}</p>
                        <p className="text-gray-400">a</p>
                        <p>{proveedor.fecha_fin ? formatearFecha(proveedor.fecha_fin) : 'Presente'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-veracruz-100 text-veracruz-700">
                        {proveedor.anios_proveeduria || 0} años
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {proveedor.giro || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        proveedor.estado_proveeduria === 'Activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {proveedor.estado_proveeduria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalEditar(proveedor)}
                          className="p-2 text-gray-600 hover:text-veracruz-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => eliminarProveedor(proveedor.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
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

      {/* Modal Crear/Editar Proveedor */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/50" onClick={() => setModalAbierto(false)} />
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={guardarProveedor} className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Proveedor *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RFC
                    </label>
                    <input
                      type="text"
                      value={formData.rfc}
                      onChange={(e) => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      maxLength={13}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giro / Actividad
                    </label>
                    <input
                      type="text"
                      value={formData.giro}
                      onChange={(e) => setFormData({...formData, giro: e.target.value})}
                      placeholder="Ej: Venta de vehículos, Mantenimiento, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                    />
                  </div>
                </div>

                {/* Período de Proveduría */}
                <div className="bg-veracruz-50 rounded-lg p-4">
                  <h3 className="font-medium text-veracruz-900 mb-3 flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5" />
                    Período de Proveduría
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Fin
                        <span className="text-gray-400 font-normal ml-1">(dejar vacío si sigue activo)</span>
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                  </div>
                  {formData.fecha_inicio && (
                    <p className="mt-2 text-sm text-veracruz-700">
                      <strong>Tiempo como proveedor:</strong> {calcularAniosTexto(formData.fecha_inicio, formData.fecha_fin)}
                    </p>
                  )}
                </div>

                {/* Secretaría */}
                {['admin', 'gobernacion'].includes(user?.rol) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secretaría *
                    </label>
                    <select
                      value={formData.secretaria_id}
                      onChange={(e) => setFormData({...formData, secretaria_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
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
                  <h3 className="font-medium text-gray-900 mb-3">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de Contacto
                      </label>
                      <input
                        type="text"
                        value={formData.contacto_nombre}
                        onChange={(e) => setFormData({...formData, contacto_nombre: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.contacto_email}
                        onChange={(e) => setFormData({...formData, contacto_email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.contacto_telefono}
                        onChange={(e) => setFormData({...formData, contacto_telefono: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                  />
                </div>

                {/* Servicios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicios / Productos que provee
                  </label>
                  <textarea
                    value={formData.servicios}
                    onChange={(e) => setFormData({...formData, servicios: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                    placeholder="Descripción de los servicios o productos que ofrece"
                  />
                </div>

                {/* Información de contratos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto Total de Contratos
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.monto_total_contratos}
                        onChange={(e) => setFormData({...formData, monto_total_contratos: e.target.value})}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Contratos
                    </label>
                    <input
                      type="number"
                      value={formData.numero_contratos}
                      onChange={(e) => setFormData({...formData, numero_contratos: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                      min="0"
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 transition-colors disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : (proveedorEditando ? 'Actualizar' : 'Crear Proveedor')}
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
