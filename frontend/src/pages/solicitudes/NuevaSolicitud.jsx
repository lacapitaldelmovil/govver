import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  TruckIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
  SparklesIcon,
  CalendarDaysIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  TagIcon,
  EyeIcon,
  BoltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState(1);

  // Vehículos disponibles
  const [loading, setLoading] = useState(true);
  const [secretariasConVehiculos, setSecretariasConVehiculos] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [secretariasExpandidas, setSecretariasExpandidas] = useState({});

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroSecretaria, setFiltroSecretaria] = useState('');
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [vistaDetallada, setVistaDetallada] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    motivo: '',
    fecha_inicio: '',
    fecha_fin: '',
    destino: '',
    observaciones_solicitante: '',
    prioridad: 'normal'
  });

  useEffect(() => {
    cargarVehiculosDisponibles();
  }, [filtroTipo, filtroMarca, filtroSecretaria]);

  const cargarVehiculosDisponibles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroMarca) params.append('marca', filtroMarca);
      if (filtroSecretaria) params.append('secretaria_id', filtroSecretaria);
      if (busqueda) params.append('busqueda', busqueda);

      const res = await api.get(`/vehiculos/disponibles-por-secretaria?${params.toString()}`);
      const data = res.data;

      setSecretariasConVehiculos(data.secretarias || []);
      setTiposDisponibles(data.filtros?.tipos || []);
      setMarcasDisponibles(data.filtros?.marcas || []);

      if (data.secretarias?.length > 0 && Object.keys(secretariasExpandidas).length === 0) {
        const primera = {};
        data.secretarias.forEach(s => { primera[s.secretaria_id] = true; });
        setSecretariasExpandidas(primera);
      }
    } catch (error) {
      console.error('Error cargando vehículos disponibles:', error);
      toast.error('Error al cargar vehículos disponibles');
    }
    setLoading(false);
  };

  const buscarVehiculos = () => cargarVehiculosDisponibles();

  const toggleSecretaria = (id) => {
    setSecretariasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandirTodas = () => {
    const todas = {};
    secretariasConVehiculos.forEach(s => { todas[s.secretaria_id] = true; });
    setSecretariasExpandidas(todas);
  };
  const contraerTodas = () => setSecretariasExpandidas({});

  const seleccionarVehiculo = (vehiculo, secretaria) => {
    if (vehiculoSeleccionado?.id === vehiculo.id) {
      setVehiculoSeleccionado(null);
    } else {
      setVehiculoSeleccionado({
        ...vehiculo,
        secretaria_origen_nombre: secretaria.secretaria_nombre,
        secretaria_origen_siglas: secretaria.secretaria_siglas,
        secretaria_origen_id: secretaria.secretaria_id
      });
    }
  };

  const irAPaso2 = () => {
    if (!vehiculoSeleccionado) {
      toast.error('Seleccione un vehículo para solicitar');
      return;
    }
    setPaso(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const volverAPaso1 = () => {
    setPaso(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehiculoSeleccionado) { toast.error('Debe seleccionar un vehículo'); return; }
    if (!formData.motivo) { toast.error('Ingrese el motivo de la solicitud'); return; }
    if (!formData.fecha_inicio || !formData.fecha_fin) { toast.error('Ingrese las fechas del préstamo'); return; }
    if (formData.fecha_fin < formData.fecha_inicio) { toast.error('La fecha de fin no puede ser anterior a la de inicio'); return; }

    setEnviando(true);
    try {
      let justificacion = `Solicita: ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.placas || 'S/P'}) de ${vehiculoSeleccionado.secretaria_origen_siglas}`;
      if (formData.destino) justificacion += ` | Destino: ${formData.destino}`;

      await api.post('/solicitudes', {
        tipo: 'prestamo',
        vehiculo_id: vehiculoSeleccionado.id,
        secretaria_destino_id: vehiculoSeleccionado.secretaria_origen_id,
        motivo: formData.motivo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        destino: formData.destino,
        observaciones_solicitante: formData.observaciones_solicitante,
        prioridad: formData.prioridad,
        justificacion
      });
      toast.success('Solicitud enviada correctamente');
      navigate('/solicitudes');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar solicitud');
    }
    setEnviando(false);
  };

  const filtrarVehiculos = (vehiculos) => {
    if (!busqueda) return vehiculos;
    const term = busqueda.toLowerCase();
    return vehiculos.filter(v =>
      `${v.marca} ${v.modelo} ${v.linea} ${v.placas} ${v.tipo} ${v.color} ${v.numero_economico}`.toLowerCase().includes(term)
    );
  };

  const totalVehiculos = secretariasConVehiculos.reduce((acc, s) => acc + filtrarVehiculos(s.vehiculos).length, 0);
  const hayFiltrosActivos = filtroTipo || filtroMarca || filtroSecretaria;

  // Días del préstamo
  const diasPrestamo = useMemo(() => {
    if (!formData.fecha_inicio || !formData.fecha_fin) return 0;
    const d1 = new Date(formData.fecha_inicio);
    const d2 = new Date(formData.fecha_fin);
    return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  }, [formData.fecha_inicio, formData.fecha_fin]);

  // ═══════════════════════ Helpers de display ═══════════════════════
  const TIPO_EMOJI = {
    sedan: '\u{1F697}', suv: '\u{1F699}', camioneta: '\u{1F6FB}', pickup: '\u{1F6FB}', van: '\u{1F690}',
    autobus: '\u{1F68C}', motocicleta: '\u{1F3CD}\u{FE0F}', emergencia: '\u{1F691}', camion: '\u{1F69B}',
    remolque: '\u{1F69A}', grua: '\u{1F3D7}\u{FE0F}', tractor: '\u{1F69C}', todoterreno: '\u{1F3CE}\u{FE0F}',
    embarcacion: '\u{1F6A4}', aeronave: '\u{2708}\u{FE0F}', helicoptero: '\u{1F681}', otro: '\u{1F4CB}',
  };

  const tipoIcono = (tipo) => {
    const t = (tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return TIPO_EMOJI[t] || TIPO_EMOJI.sedan;
  };

  const tipoLabel = (tipo) => {
    const map = {
      'sedan': 'Sedán', 'pickup': 'Pick Up', 'van': 'Van', 'camioneta': 'Camioneta',
      'suv': 'SUV', 'emergencia': 'Emergencia', 'autobus': 'Autobús',
      'motocicleta': 'Motocicleta', 'camion': 'Camión', 'tractor': 'Tractor',
      'grua': 'Grúa', 'remolque': 'Remolque', 'helicoptero': 'Helicóptero',
      'embarcacion': 'Embarcación', 'aeronave': 'Aeronave', 'todoterreno': 'Todo Terreno',
      'otro': 'Otro',
    };
    return map[(tipo || '').toLowerCase()] || tipo;
  };

  const brandColors = [
    { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    { border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
    { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { border: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    { border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
    { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    { border: 'border-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  ];

  const getMarcaStyle = (marca) => {
    let hash = 0;
    for (let i = 0; i < (marca || '').length; i++) hash = marca.charCodeAt(i) + ((hash << 5) - hash);
    return brandColors[Math.abs(hash) % brandColors.length];
  };

  const estatusColor = (est) => {
    const e = (est || '').toLowerCase();
    if (e === 'bueno' || e === 'excelente') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (e === 'regular') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (e === 'malo') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const limpiarFiltros = () => { setFiltroTipo(''); setFiltroMarca(''); setFiltroSecretaria(''); };

  // ═══════════════════════ Render ═══════════════════════
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-32">

      {/* ─── Header con gradiente ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-veracruz-600 via-veracruz-700 to-blue-800 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-dorado-400/10 rounded-full blur-2xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <button
            onClick={() => paso === 2 ? volverAPaso1() : navigate(-1)}
            className="self-start p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur transition-all"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon className="h-5 w-5 text-dorado-300" />
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
                Nueva solicitud de préstamo
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {paso === 1 ? 'Explorar Vehículos' : 'Completar Solicitud'}
            </h1>
            <p className="text-white/70 mt-1 text-sm md:text-base">
              {paso === 1
                ? 'Seleccione un vehículo de otra Secretaría para solicitar en préstamo'
                : 'Complete los datos de la solicitud de préstamo inter-secretaría'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-3">
            <div className={`flex items-center gap-2 transition-all ${paso >= 1 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                paso > 1 ? 'bg-green-400 text-white' : paso === 1 ? 'bg-white text-veracruz-700 shadow-lg' : 'bg-white/20 text-white/50'
              }`}>
                {paso > 1 ? <CheckCircleSolid className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden lg:block">Vehículo</span>
            </div>

            <div className={`w-10 h-0.5 rounded-full ${paso > 1 ? 'bg-green-400' : 'bg-white/20'}`}></div>

            <div className={`flex items-center gap-2 transition-all ${paso >= 2 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                paso === 2 ? 'bg-white text-veracruz-700 shadow-lg' : 'bg-white/20 text-white/50'
              }`}>
                2
              </div>
              <span className="text-sm font-medium hidden lg:block">Solicitud</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {paso === 1 && !loading && (
          <div className="relative mt-5 grid grid-cols-3 gap-3 max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 text-center">
              <p className="text-2xl font-extrabold">{totalVehiculos}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60">Vehículos</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 text-center">
              <p className="text-2xl font-extrabold">{secretariasConVehiculos.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60">Secretarías</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 text-center">
              <p className="text-2xl font-extrabold">{tiposDisponibles.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60">Tipos</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ PASO 1: EXPLORAR VEHÍCULOS ═══════════ */}
      {paso === 1 && (
        <>
          {/* ── Barra de búsqueda + filtros ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Buscador principal */}
            <div className="p-4 md:p-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por marca, modelo, placas, color, no. económico…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarVehiculos()}
                    className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 bg-gray-50/50 placeholder:text-gray-400 transition-all"
                  />
                  {busqueda && (
                    <button onClick={() => { setBusqueda(''); cargarVehiculosDisponibles(); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={buscarVehiculos}
                  className="px-5 py-3 bg-veracruz-600 hover:bg-veracruz-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>

              {/* Resumen + toggle filtros */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FunnelIcon className="h-4 w-4 text-veracruz-500" />
                  <span>
                    <strong className="text-gray-800">{totalVehiculos}</strong> vehículos de{' '}
                    <strong className="text-gray-800">{secretariasConVehiculos.length}</strong> secretarías
                  </span>
                  {hayFiltrosActivos && (
                    <button onClick={limpiarFiltros} className="ml-2 text-xs text-veracruz-600 hover:text-veracruz-800 font-semibold flex items-center gap-1 bg-veracruz-50 px-2 py-0.5 rounded-full">
                      <XMarkIcon className="h-3 w-3" /> Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVistaDetallada(!vistaDetallada)}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${vistaDetallada ? 'bg-veracruz-100 text-veracruz-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    title={vistaDetallada ? 'Vista compacta' : 'Vista detallada'}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      mostrarFiltrosAvanzados ? 'bg-veracruz-100 text-veracruz-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FunnelIcon className="h-3.5 w-3.5" />
                    Filtros {hayFiltrosActivos && <span className="w-2 h-2 rounded-full bg-veracruz-500 animate-pulse"></span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Filtros avanzados (colapsable) */}
            {mostrarFiltrosAvanzados && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-5 space-y-4">
                {/* Tipo de vehículo */}
                {tiposDisponibles.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <TruckIcon className="h-3.5 w-3.5" /> Tipo de Vehículo
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setFiltroTipo('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          !filtroTipo ? 'border-veracruz-400 bg-veracruz-50 text-veracruz-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        Todos
                      </button>
                      {tiposDisponibles.map(t => (
                        <button
                          key={t}
                          onClick={() => setFiltroTipo(filtroTipo === t ? '' : t)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            filtroTipo === t ? 'border-veracruz-400 bg-veracruz-50 text-veracruz-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                          }`}
                        >
                          <span>{tipoIcono(t)}</span> {tipoLabel(t)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marca */}
                {marcasDisponibles.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <TagIcon className="h-3.5 w-3.5" /> Marca
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setFiltroMarca('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          !filtroMarca ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        Todas
                      </button>
                      {marcasDisponibles.map(m => {
                        const s = getMarcaStyle(m);
                        return (
                          <button
                            key={m}
                            onClick={() => setFiltroMarca(filtroMarca === m ? '' : m)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              filtroMarca === m ? `${s.border} ${s.bg} ${s.text} shadow-sm` : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold text-white ${
                              filtroMarca === m ? s.dot : 'bg-gray-400'
                            }`}>{m.charAt(0)}</span>
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Secretaría */}
                {secretariasConVehiculos.length > 1 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <BuildingOfficeIcon className="h-3.5 w-3.5" /> Secretaría
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setFiltroSecretaria('')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          !filtroSecretaria ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        <BuildingOfficeIcon className="h-3.5 w-3.5" /> Todas
                      </button>
                      {secretariasConVehiculos.map(s => (
                        <button
                          key={s.secretaria_id}
                          onClick={() => setFiltroSecretaria(filtroSecretaria === s.secretaria_id.toString() ? '' : s.secretaria_id.toString())}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            filtroSecretaria === s.secretaria_id.toString() ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                          }`}
                        >
                          {s.secretaria_siglas}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            filtroSecretaria === s.secretaria_id.toString() ? 'bg-amber-200 text-amber-800' : 'bg-gray-200 text-gray-600'
                          }`}>{s.vehiculos.length}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Controles de agrupación ── */}
          {secretariasConVehiculos.length > 1 && !loading && (
            <div className="flex items-center justify-end gap-2 -mt-2">
              <button onClick={expandirTodas} className="text-xs text-gray-500 hover:text-veracruz-600 font-medium transition-colors">
                Expandir todas
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={contraerTodas} className="text-xs text-gray-500 hover:text-veracruz-600 font-medium transition-colors">
                Contraer todas
              </button>
            </div>
          )}

          {/* ── Catálogo por Secretaría ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-veracruz-100 animate-pulse flex items-center justify-center">
                  <TruckIcon className="h-8 w-8 text-veracruz-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-veracruz-500 rounded-lg animate-spin flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 font-medium">Cargando vehículos disponibles…</p>
            </div>
          ) : secretariasConVehiculos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-100 flex items-center justify-center">
                <TruckIcon className="h-10 w-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sin vehículos disponibles</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                No se encontraron vehículos disponibles en otras Secretarías con los filtros seleccionados.
              </p>
              {hayFiltrosActivos && (
                <button onClick={limpiarFiltros} className="mt-4 px-4 py-2 text-sm bg-veracruz-50 text-veracruz-700 rounded-lg hover:bg-veracruz-100 font-medium transition-colors">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {secretariasConVehiculos.map((sec) => {
                const vehiculosFiltrados = filtrarVehiculos(sec.vehiculos);
                if (vehiculosFiltrados.length === 0) return null;
                const expandida = secretariasExpandidas[sec.secretaria_id];
                const tieneSeleccion = vehiculoSeleccionado && vehiculosFiltrados.some(v => v.id === vehiculoSeleccionado.id);

                return (
                  <div key={sec.secretaria_id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                    tieneSeleccion ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    {/* Header de Secretaría */}
                    <button
                      onClick={() => toggleSecretaria(sec.secretaria_id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          tieneSeleccion ? 'bg-green-100' : 'bg-gradient-to-br from-veracruz-100 to-blue-100'
                        }`}>
                          {tieneSeleccion
                            ? <CheckCircleSolid className="h-6 w-6 text-green-500" />
                            : <BuildingOfficeIcon className="h-5 w-5 text-veracruz-600" />
                          }
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base">{sec.secretaria_siglas}</h3>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              tieneSeleccion ? 'bg-green-100 text-green-700' : 'bg-veracruz-100 text-veracruz-700'
                            }`}>
                              {vehiculosFiltrados.length}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{sec.secretaria_nombre}</p>
                        </div>
                      </div>
                      <div className={`p-1.5 rounded-lg transition-all ${expandida ? 'bg-veracruz-100' : 'bg-gray-100'}`}>
                        {expandida ? <ChevronUpIcon className="h-4 w-4 text-veracruz-600" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>

                    {/* Lista de vehículos */}
                    {expandida && (
                      <div className={`border-t border-gray-100 p-3 md:p-4 ${vistaDetallada ? 'space-y-3' : 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {vehiculosFiltrados.map((v) => {
                          const isSelected = vehiculoSeleccionado?.id === v.id;

                          if (vistaDetallada) {
                            // ── Vista detallada (lista expandida) ──
                            return (
                              <div
                                key={v.id}
                                onClick={() => seleccionarVehiculo(v, sec)}
                                className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'border-green-500 bg-green-50/70 shadow-md ring-2 ring-green-200'
                                    : 'border-gray-200 hover:border-veracruz-300 hover:bg-veracruz-50/30 hover:shadow-sm'
                                }`}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all ${
                                    isSelected ? 'bg-green-100 scale-105' : 'bg-gray-100 group-hover:bg-veracruz-100'
                                  }`}>
                                    {tipoIcono(v.tipo)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-gray-900">{v.marca} {v.modelo || v.linea}</span>
                                      {v.anio && <span className="text-sm text-gray-500">({v.anio})</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      {v.tipo && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                          {tipoIcono(v.tipo)} {tipoLabel(v.tipo)}
                                        </span>
                                      )}
                                      {v.estatus && (
                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${estatusColor(v.estatus)}`}>
                                          {v.estatus}
                                        </span>
                                      )}
                                      <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 border border-gray-200">
                                        {v.placas || 'S/P'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 flex-wrap">
                                      {v.color && <span className="flex items-center gap-1">🎨 {v.color}</span>}
                                      {v.tipo_combustible && <span className="flex items-center gap-1">⛽ {v.tipo_combustible}</span>}
                                      {v.capacidad_pasajeros > 0 && <span>👥 {v.capacidad_pasajeros} pas.</span>}
                                      {v.kilometraje > 0 && <span>📏 {Number(v.kilometraje).toLocaleString()} km</span>}
                                      {v.numero_economico && <span className="flex items-center gap-1">#{v.numero_economico}</span>}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircleSolid className="h-7 w-7 text-green-500 flex-shrink-0 mt-1" />
                                  )}
                                </div>
                              </div>
                            );
                          }

                          // ── Vista compacta (tarjetas grid) ──
                          return (
                            <div
                              key={v.id}
                              onClick={() => seleccionarVehiculo(v, sec)}
                              className={`group relative p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? 'border-green-500 bg-green-50/70 shadow-md ring-2 ring-green-200'
                                  : 'border-gray-200 hover:border-veracruz-300 hover:bg-veracruz-50/30 hover:shadow-sm'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircleSolid className="h-6 w-6 text-green-500" />
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all ${
                                  isSelected ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-veracruz-100 group-hover:scale-105'
                                }`}>
                                  {tipoIcono(v.tipo)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-900 text-sm truncate">{v.marca} {v.modelo || v.linea}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{v.placas || 'S/P'}</span>
                                    {v.anio && <span className="text-[10px] text-gray-400">{v.anio}</span>}
                                    {v.estatus && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${estatusColor(v.estatus)}`}>
                                        {v.estatus}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Mini detalles */}
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 flex-wrap">
                                {v.tipo && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{tipoLabel(v.tipo)}</span>}
                                {v.color && <span>{v.color}</span>}
                                {v.tipo_combustible && <span>⛽{v.tipo_combustible}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Barra inferior flotante ── */}
          <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
            vehiculoSeleccionado ? 'translate-y-0' : 'translate-y-2'
          }`}>
            <div className="max-w-7xl mx-auto px-4 pb-4">
              <div className={`rounded-2xl shadow-2xl border-2 p-4 transition-all backdrop-blur-lg ${
                vehiculoSeleccionado ? 'bg-white/95 border-green-300' : 'bg-white/90 border-gray-200'
              }`}>
                {vehiculoSeleccionado ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {tipoIcono(vehiculoSeleccionado.tipo)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo || vehiculoSeleccionado.linea}
                          <span className="text-gray-400 font-normal ml-1.5">({vehiculoSeleccionado.placas || 'S/P'})</span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                          <BuildingOfficeIcon className="h-3.5 w-3.5 text-veracruz-500 flex-shrink-0" />
                          De: <strong className="text-veracruz-700">{vehiculoSeleccionado.secretaria_origen_siglas}</strong>
                          <ArrowsRightLeftIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          Para: <strong className="text-green-700">{user?.secretaria_siglas || user?.nombre}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setVehiculoSeleccionado(null)}
                        className="px-3 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 text-xs font-medium transition-colors"
                      >
                        Cambiar
                      </button>
                      <button
                        onClick={irAPaso2}
                        className="px-5 py-2.5 bg-gradient-to-r from-veracruz-600 to-veracruz-700 text-white rounded-xl hover:from-veracruz-700 hover:to-veracruz-800 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-veracruz-500/20 transition-all hover:shadow-veracruz-500/30"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Solicitar Préstamo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-1">
                    <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                      <InformationCircleIcon className="h-4 w-4" />
                      Seleccione un vehículo de la lista para solicitar un préstamo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ PASO 2: COMPLETAR SOLICITUD ═══════════ */}
      {paso === 2 && vehiculoSeleccionado && (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Vehículo seleccionado (resumen compacto) ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100 px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-green-800 flex items-center gap-2">
                <CheckCircleSolid className="h-4 w-4 text-green-500" />
                Vehículo Seleccionado
              </h2>
              <button
                type="button"
                onClick={volverAPaso1}
                className="text-xs text-green-700 hover:text-green-900 font-semibold flex items-center gap-1 bg-white/60 px-3 py-1 rounded-lg hover:bg-white/80 transition-colors"
              >
                <ArrowsRightLeftIcon className="h-3.5 w-3.5" /> Cambiar
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-4xl flex-shrink-0 shadow-sm">
                  {tipoIcono(vehiculoSeleccionado.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-extrabold text-gray-900 truncate">
                    {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo || vehiculoSeleccionado.linea}
                    {vehiculoSeleccionado.anio && <span className="text-gray-400 font-normal text-base ml-2">({vehiculoSeleccionado.anio})</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                      {vehiculoSeleccionado.placas || 'Sin placas'}
                    </span>
                    {vehiculoSeleccionado.tipo && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold border border-blue-200">
                        {tipoIcono(vehiculoSeleccionado.tipo)} {tipoLabel(vehiculoSeleccionado.tipo)}
                      </span>
                    )}
                    {vehiculoSeleccionado.color && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">🎨 {vehiculoSeleccionado.color}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <BuildingOfficeIcon className="h-3.5 w-3.5 text-veracruz-500" />
                    Pertenece a: <strong className="text-veracruz-700">{vehiculoSeleccionado.secretaria_origen_siglas}</strong>
                    <span className="text-gray-400">— {vehiculoSeleccionado.secretaria_origen_nombre}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Formulario de solicitud ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-veracruz-50 to-blue-50 border-b border-veracruz-100 px-5 py-3">
              <h2 className="text-sm font-bold text-veracruz-800 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-veracruz-600" />
                Detalles del Préstamo
              </h2>
            </div>
            <div className="p-5 space-y-5">

              {/* Motivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Motivo de la solicitud <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  rows={3}
                  maxLength={500}
                  placeholder="Describa brevemente por qué necesita este vehículo en préstamo…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 transition-all resize-none"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{formData.motivo.length}/500</p>
              </div>

              {/* Destino */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-veracruz-500" />
                  Destino / Lugar de uso
                </label>
                <input
                  type="text"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  placeholder="Ej: Xalapa, Veracruz Puerto, Coatzacoalcos…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 transition-all"
                />
              </div>

              {/* Fechas */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-veracruz-500" />
                    Fecha de inicio <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-veracruz-500" />
                    Fecha de fin <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    min={formData.fecha_inicio || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Indicador de días */}
              {diasPrestamo > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                  <ClockIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-800">
                    Duración estimada: <strong>{diasPrestamo} día{diasPrestamo !== 1 ? 's' : ''}</strong>
                    {diasPrestamo > 30 && <span className="text-amber-600 ml-2 font-medium">⚠ Período largo</span>}
                  </span>
                </div>
              )}

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <BoltIcon className="h-4 w-4 text-veracruz-500" />
                  Prioridad
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'baja', label: 'Baja', icon: '🟢', activeClasses: 'border-gray-500 bg-gray-50 text-gray-700 ring-gray-200' },
                    { value: 'normal', label: 'Normal', icon: '��', activeClasses: 'border-blue-500 bg-blue-50 text-blue-700 ring-blue-200' },
                    { value: 'alta', label: 'Alta', icon: '🟠', activeClasses: 'border-orange-500 bg-orange-50 text-orange-700 ring-orange-200' },
                    { value: 'urgente', label: 'Urgente', icon: '🔴', activeClasses: 'border-red-500 bg-red-50 text-red-700 ring-red-200' }
                  ].map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, prioridad: p.value })}
                      className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                        formData.prioridad === p.value
                          ? `${p.activeClasses} ring-2 shadow-sm`
                          : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Observaciones adicionales <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                </label>
                <textarea
                  value={formData.observaciones_solicitante}
                  onChange={(e) => setFormData({ ...formData, observaciones_solicitante: e.target.value })}
                  rows={2}
                  maxLength={300}
                  placeholder="Información adicional que considere relevante…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Resumen Final + Envío ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-veracruz-600 to-blue-700 px-5 py-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                Resumen de la Solicitud
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Solicitante</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.secretaria_siglas || user?.nombre}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Presta el vehículo</p>
                  <p className="text-sm font-bold text-veracruz-700 truncate">{vehiculoSeleccionado.secretaria_origen_siglas}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Vehículo</p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo || vehiculoSeleccionado.linea}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Período</p>
                  <p className="text-sm font-bold text-gray-900">
                    {diasPrestamo > 0 ? `${diasPrestamo} día${diasPrestamo !== 1 ? 's' : ''}` : '---'}
                  </p>
                </div>
              </div>

              {formData.destino && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                  <MapPinIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  Destino: <strong className="text-amber-800">{formData.destino}</strong>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <InformationCircleIcon className="h-4 w-4 flex-shrink-0" />
                  La solicitud será revisada por la Coordinación General de Gobernación
                </p>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={volverAPaso1}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4 inline mr-1.5" />
                    Regresar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando || !formData.motivo || !formData.fecha_inicio || !formData.fecha_fin}
                    className="px-6 py-2.5 bg-gradient-to-r from-veracruz-600 to-veracruz-700 text-white rounded-xl hover:from-veracruz-700 hover:to-veracruz-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2 shadow-lg shadow-veracruz-500/20 transition-all"
                  >
                    {enviando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando…
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Enviar Solicitud
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
