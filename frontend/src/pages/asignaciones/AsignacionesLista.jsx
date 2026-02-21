import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function AsignacionesLista() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [asignaciones, setAsignaciones] = useState([]);
  const [stats, setStats] = useState({ en_uso: 0, devueltos: 0 });
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal de devolución
  const [modalDevolver, setModalDevolver] = useState(null);
  const [devForm, setDevForm] = useState({
    fecha_entrada: new Date().toISOString().split('T')[0],
    hora_entrada: new Date().toTimeString().slice(0, 5),
    km_entrada: '',
    combustible_entrada: '',
    estado_devolucion: 'Bueno',
    observaciones_entrada: ''
  });
  const [devolviendo, setDevolviendo] = useState(false);

  useEffect(() => { cargarAsignaciones(); }, [filtroEstado]);

  const cargarAsignaciones = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (busqueda) params.append('busqueda', busqueda);
      const res = await api.get(`/asignaciones?${params.toString()}`);
      setAsignaciones(res.data.asignaciones || []);
      setStats(res.data.stats || { en_uso: 0, devueltos: 0 });
    } catch (error) {
      toast.error('Error al cargar asignaciones');
    }
    setLoading(false);
  };

  const buscar = () => cargarAsignaciones();

  const abrirModalDevolver = (asg) => {
    setModalDevolver(asg);
    setDevForm({
      fecha_entrada: new Date().toISOString().split('T')[0],
      hora_entrada: new Date().toTimeString().slice(0, 5),
      km_entrada: '',
      combustible_entrada: '',
      estado_devolucion: 'Bueno',
      observaciones_entrada: ''
    });
  };

  const registrarDevolucion = async () => {
    if (!devForm.fecha_entrada) {
      toast.error('La fecha de entrada es obligatoria');
      return;
    }
    setDevolviendo(true);
    try {
      const res = await api.put(`/asignaciones/${modalDevolver.id}/devolver`, devForm);
      toast.success(res.data.message || 'Entrada registrada');
      if (res.data.km_recorridos) {
        toast(`📏 Kilómetros recorridos: ${res.data.km_recorridos.toLocaleString()} km`, { icon: '🚗' });
      }
      setModalDevolver(null);
      cargarAsignaciones();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar entrada');
    }
    setDevolviendo(false);
  };

  const cancelarAsignacion = async (asg) => {
    if (!confirm(`¿Cancelar la asignación ${asg.folio}?`)) return;
    try {
      await api.put(`/asignaciones/${asg.id}/cancelar`, { motivo: 'Cancelada por usuario' });
      toast.success('Asignación cancelada');
      cargarAsignaciones();
    } catch (error) {
      toast.error('Error al cancelar');
    }
  };

  const estadoConfig = {
    en_uso: { label: 'En Uso', icon: '🚗', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    devuelto: { label: 'Devuelto', icon: '✅', bg: 'bg-veracruz-100', text: 'text-veracruz-800', border: 'border-veracruz-300' },
    cancelado: { label: 'Cancelado', icon: '❌', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' }
  };

  const puedeEditar = ['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Tab bar: Catálogo | Asignaciones */}
      <div className="bg-white border-b px-4 sm:px-6">
        <div className="flex gap-1">
          <button
            onClick={() => navigate('/vehiculos')}
            className="px-5 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 rounded-t-lg flex items-center gap-2 transition-colors"
          >
            <TruckIcon className="h-4 w-4" />
            Catálogo de Vehículos
          </button>
          <button
            className="px-5 py-3 text-sm font-semibold border-b-2 border-veracruz-600 text-veracruz-700 bg-veracruz-50/50 rounded-t-lg flex items-center gap-2"
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4" />
            Control de Asignaciones
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-7 w-7 text-veracruz-600" />
            Control de Asignaciones
          </h1>
          <p className="text-gray-500 text-sm">Registro de salida y entrada de vehículos asignados a personas</p>
        </div>
        {puedeEditar && (
          <Link
            to="/vehiculos/asignaciones/nueva"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-veracruz-600 text-white rounded-xl hover:bg-veracruz-700 font-medium shadow-sm transition"
          >
            <PlusIcon className="h-5 w-5" />
            Registrar Salida
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setFiltroEstado('')} className={`p-4 rounded-xl border-2 transition-all text-left ${!filtroEstado ? 'border-veracruz-500 bg-veracruz-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="text-2xl font-bold text-gray-900">{stats.en_uso + stats.devueltos}</p>
          <p className="text-sm text-gray-500">Total</p>
        </button>
        <button onClick={() => setFiltroEstado('en_uso')} className={`p-4 rounded-xl border-2 transition-all text-left ${filtroEstado === 'en_uso' ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="text-2xl font-bold text-amber-600">{stats.en_uso}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">🚗 En uso</p>
        </button>
        <button onClick={() => setFiltroEstado('devuelto')} className={`p-4 rounded-xl border-2 transition-all text-left ${filtroEstado === 'devuelto' ? 'border-veracruz-500 bg-veracruz-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="text-2xl font-bold text-veracruz-600">{stats.devueltos}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">✅ Devueltos</p>
        </button>
        <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
          <p className="text-2xl font-bold text-blue-600">{stats.en_uso}</p>
          <p className="text-sm text-gray-500">Pendientes de regreso</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="🔍  Buscar por conductor, folio, placas, marca, destino…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 bg-gray-50"
          />
          {busqueda && (
            <button onClick={() => { setBusqueda(''); setTimeout(cargarAsignaciones, 100); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-veracruz-600"></div>
        </div>
      ) : asignaciones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <ClipboardDocumentCheckIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sin asignaciones</h2>
          <p className="text-gray-500 mb-4">No se encontraron registros de asignaciones con los filtros seleccionados.</p>
          {puedeEditar && (
            <Link to="/vehiculos/asignaciones/nueva" className="inline-flex items-center gap-2 px-5 py-2.5 bg-veracruz-600 text-white rounded-xl hover:bg-veracruz-700 font-medium">
              <PlusIcon className="h-5 w-5" /> Registrar primera salida
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {asignaciones.map((a) => {
            const cfg = estadoConfig[a.estado] || estadoConfig.en_uso;
            return (
              <div key={a.id} className={`bg-white rounded-xl border-2 ${a.estado === 'en_uso' ? 'border-amber-200' : 'border-gray-100'} shadow-sm overflow-hidden`}>
                <div className="p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icono estado */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center text-2xl`}>
                      {cfg.icon}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{a.folio}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                        {a.secretaria_siglas && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a.secretaria_siglas}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <TruckIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-bold text-gray-900">{a.marca} {a.linea || a.modelo}</span>
                        {a.anio && <span className="text-gray-500">({a.anio})</span>}
                        <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{a.placas || 'S/P'}</span>
                        {a.color && <span className="text-xs text-gray-500">{a.color}</span>}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3.5 w-3.5" />
                          <strong>{a.conductor_nombre}</strong>
                          {a.conductor_cargo && <span className="text-gray-400">— {a.conductor_cargo}</span>}
                        </span>
                        {a.destino && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" /> {a.destino}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <ArrowRightIcon className="h-3 w-3 text-amber-500" />
                          Salida: {a.fecha_salida}{a.hora_salida ? ` ${a.hora_salida}` : ''}
                          {a.km_salida ? ` · ${Number(a.km_salida).toLocaleString()} km` : ''}
                        </span>
                        {a.fecha_entrada && (
                          <span className="flex items-center gap-1">
                            <ArrowLeftIcon className="h-3 w-3 text-veracruz-500" />
                            Entrada: {a.fecha_entrada}{a.hora_entrada ? ` ${a.hora_entrada}` : ''}
                            {a.km_entrada ? ` · ${Number(a.km_entrada).toLocaleString()} km` : ''}
                          </span>
                        )}
                        {a.km_salida && a.km_entrada && (
                          <span className="font-medium text-blue-600">
                            📏 {(a.km_entrada - a.km_salida).toLocaleString()} km recorridos
                          </span>
                        )}
                      </div>

                      {a.motivo && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{a.motivo}"</p>
                      )}
                    </div>

                    {/* Acciones */}
                    {puedeEditar && a.estado === 'en_uso' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => abrirModalDevolver(a)}
                          className="px-4 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-sm font-medium flex items-center gap-1.5 shadow-sm"
                        >
                          <ArrowLeftIcon className="h-4 w-4" />
                          Registrar Entrada
                        </button>
                        <button
                          onClick={() => cancelarAsignacion(a)}
                          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                          title="Cancelar"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====== Modal Devolver ====== */}
      {modalDevolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setModalDevolver(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ArrowLeftIcon className="h-5 w-5 text-veracruz-600" /> Registrar Entrada
                </h2>
                <p className="text-sm text-gray-500">{modalDevolver.folio}</p>
              </div>
              <button onClick={() => setModalDevolver(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info del vehículo y conductor */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TruckIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-bold">{modalDevolver.marca} {modalDevolver.linea || modalDevolver.modelo}</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded text-xs border">{modalDevolver.placas}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span>{modalDevolver.conductor_nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ArrowRightIcon className="h-3 w-3 text-amber-500" />
                  Salió: {modalDevolver.fecha_salida} {modalDevolver.hora_salida || ''}
                  {modalDevolver.km_salida ? ` · ${Number(modalDevolver.km_salida).toLocaleString()} km` : ''}
                </div>
              </div>

              {/* Formulario de entrada */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Entrada *</label>
                  <input type="date" value={devForm.fecha_entrada} onChange={(e) => setDevForm({ ...devForm, fecha_entrada: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora de Entrada</label>
                  <input type="time" value={devForm.hora_entrada} onChange={(e) => setDevForm({ ...devForm, hora_entrada: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Km de Entrada</label>
                  <input type="number" value={devForm.km_entrada} onChange={(e) => setDevForm({ ...devForm, km_entrada: e.target.value })}
                    placeholder={modalDevolver.km_salida ? `Salió con ${modalDevolver.km_salida} km` : 'Km actual'}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Combustible</label>
                  <select value={devForm.combustible_entrada} onChange={(e) => setDevForm({ ...devForm, combustible_entrada: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 bg-white">
                    <option value="">— Nivel —</option>
                    <option value="Lleno">⛽ Lleno</option>
                    <option value="3/4">⛽ 3/4</option>
                    <option value="1/2">⛽ 1/2</option>
                    <option value="1/4">⛽ 1/4</option>
                    <option value="Vacío">⛽ Vacío</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado de Devolución</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Bueno', 'Regular', 'Con daños'].map(e => (
                    <button key={e} type="button"
                      onClick={() => setDevForm({ ...devForm, estado_devolucion: e })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        devForm.estado_devolucion === e
                          ? e === 'Bueno' ? 'border-veracruz-500 bg-veracruz-50 text-veracruz-700'
                            : e === 'Regular' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {e === 'Bueno' ? '✅' : e === 'Regular' ? '⚠️' : '🔴'} {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                <textarea value={devForm.observaciones_entrada} onChange={(e) => setDevForm({ ...devForm, observaciones_entrada: e.target.value })}
                  rows={2} placeholder="Novedades, daños, etc."
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>

              {/* Km recorridos preview */}
              {devForm.km_entrada && modalDevolver.km_salida && (
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-blue-600">
                    📏 Kilómetros recorridos: <strong className="text-lg">{(devForm.km_entrada - modalDevolver.km_salida).toLocaleString()} km</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setModalDevolver(null)} className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
                Cancelar
              </button>
              <button onClick={registrarDevolucion} disabled={devolviendo}
                className="px-6 py-2.5 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 font-medium flex items-center gap-2 disabled:opacity-50">
                {devolviendo ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Registrando...</>
                ) : (
                  <><CheckCircleIcon className="h-5 w-5" /> Confirmar Entrada</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

        </div>{/* close max-w-7xl */}
      </div>{/* close overflow-y-auto */}
    </div>
  );
}
