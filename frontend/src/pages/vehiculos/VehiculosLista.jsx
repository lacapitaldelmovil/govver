import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon, FunnelIcon, XMarkIcon, TruckIcon,
  ArrowRightIcon, ArrowLeftIcon, UserIcon, MapPinIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon,
  Squares2X2Icon, ListBulletIcon,
  ExclamationTriangleIcon, EyeIcon
} from '@heroicons/react/24/outline';
import FiltroSelect from '../../components/ui/FiltroSelect';

export default function VehiculosLista() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [secretarias, setSecretarias] = useState([]);
  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') || '');
  const [vistaLista, setVistaLista] = useState(false);
  
  // Tab activo: 'catalogo' o 'determinacion'
  const [tabActivo, setTabActivo] = useState(searchParams.get('tab') || 'catalogo');
  
  // Datos de determinación
  const [detVehiculos, setDetVehiculos] = useState([]);
  const [detPropuestos, setDetPropuestos] = useState([]);
  const [detLoading, setDetLoading] = useState(false);
  const [detFiltro, setDetFiltro] = useState('todos');
  const [detBusqueda, setDetBusqueda] = useState('');
  
  // Filtros
  const [filtros, setFiltros] = useState({
    estado_operativo: searchParams.get('estado_operativo') || '',
    regimen: searchParams.get('regimen') || '',
    secretaria_id: searchParams.get('secretaria_id') || '',
    marca: searchParams.get('marca') || '',
    tipo: searchParams.get('tipo') || '',
    condicion: searchParams.get('condicion') || '',
    clasificacion: searchParams.get('clasificacion') || '',
    proveedor: searchParams.get('proveedor') || '',
    municipio: searchParams.get('municipio') || ''
  });

  // Lista de municipios
  const [municipios, setMunicipios] = useState([]);

  // Estadísticas rápidas
  const [stats, setStats] = useState(null);
  const [segurosStats, setSegurosStats] = useState(null);

  // --- Asignaciones: modal de salida / entrada ---
  const puedeAsignar = ['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol);
  const [modalSalida, setModalSalida] = useState(null); // vehículo para registrar salida
  const [modalEntrada, setModalEntrada] = useState(null); // vehículo para registrar entrada
  const [salidaForm, setSalidaForm] = useState({
    conductor_nombre: '', conductor_cargo: '', conductor_telefono: '',
    fecha_salida: '', hora_salida: '', km_salida: '',
    combustible_salida: '', destino: '', motivo: '', observaciones_salida: ''
  });
  const [entradaForm, setEntradaForm] = useState({
    fecha_entrada: '', hora_entrada: '', km_entrada: '',
    combustible_entrada: '', estado_devolucion: 'Bueno', observaciones_entrada: ''
  });
  const [enviandoAsg, setEnviandoAsg] = useState(false);

  const abrirSalida = (v) => {
    setModalSalida(v);
    setSalidaForm({
      conductor_nombre: '', conductor_cargo: '', conductor_telefono: '',
      fecha_salida: new Date().toISOString().split('T')[0],
      hora_salida: new Date().toTimeString().slice(0, 5),
      km_salida: v.kilometraje || '',
      combustible_salida: '', destino: '', motivo: '', observaciones_salida: ''
    });
  };

  const abrirEntrada = (v) => {
    setModalEntrada(v);
    setEntradaForm({
      fecha_entrada: new Date().toISOString().split('T')[0],
      hora_entrada: new Date().toTimeString().slice(0, 5),
      km_entrada: '', combustible_entrada: '',
      estado_devolucion: 'Bueno', observaciones_entrada: ''
    });
  };

  const registrarSalida = async () => {
    if (!salidaForm.conductor_nombre || !salidaForm.motivo) {
      toast.error('Nombre del conductor y motivo son obligatorios');
      return;
    }
    setEnviandoAsg(true);
    try {
      const payload = {
        vehiculo_id: modalSalida.id,
        ...salidaForm,
        km_salida: salidaForm.km_salida ? parseInt(salidaForm.km_salida) : null
      };
      const res = await api.post('/asignaciones', payload);
      toast.success(res.data.message || 'Salida registrada');
      toast(`📋 Folio: ${res.data.folio}`, { icon: '✅', duration: 5000 });
      setModalSalida(null);
      cargarVehiculos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar salida');
    }
    setEnviandoAsg(false);
  };

  const registrarEntrada = async () => {
    if (!entradaForm.fecha_entrada) {
      toast.error('La fecha de entrada es obligatoria');
      return;
    }
    setEnviandoAsg(true);
    try {
      const res = await api.put(`/asignaciones/${modalEntrada.asignacion_id}/devolver`, entradaForm);
      toast.success(res.data.message || 'Entrada registrada');
      if (res.data.km_recorridos) {
        toast(`📏 Km recorridos: ${res.data.km_recorridos.toLocaleString()} km`, { icon: '🚗' });
      }
      setModalEntrada(null);
      cargarVehiculos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar entrada');
    }
    setEnviandoAsg(false);
  };

  useEffect(() => {
    cargarSecretarias();
    cargarStats();
    cargarMunicipios();
  }, []);

  // Detectar cambios en la URL (búsqueda desde header, sidebar links, etc.)
  useEffect(() => {
    const busquedaParam = searchParams.get('busqueda') || '';
    if (busquedaParam !== busqueda) {
      setBusqueda(busquedaParam);
    }
    
    // Sincronizar filtros desde URL
    const urlFiltros = {
      proveedor: searchParams.get('proveedor') || '',
      clasificacion: searchParams.get('clasificacion') || '',
      estado_operativo: searchParams.get('estado_operativo') || '',
      regimen: searchParams.get('regimen') || '',
      condicion: searchParams.get('condicion') || '',
      municipio: searchParams.get('municipio') || '',
    };
    
    let changed = false;
    const newFiltros = { ...filtros };
    Object.entries(urlFiltros).forEach(([key, val]) => {
      if (val !== filtros[key]) {
        newFiltros[key] = val;
        changed = true;
      }
    });
    if (changed) {
      setFiltros(newFiltros);
    }
    
    // Detectar tab desde URL
    const tabParam = searchParams.get('tab') || 'catalogo';
    if (tabParam !== tabActivo) {
      setTabActivo(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    cargarVehiculos();
  }, [filtros, page, busqueda]);

  // Cargar datos de determinación cuando se activa esa pestaña
  useEffect(() => {
    if (tabActivo === 'determinacion') {
      cargarDeterminacion();
    }
  }, [tabActivo]);

  const cargarSecretarias = async () => {
    try {
      const res = await api.get('/secretarias');
      setSecretarias(res.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarMunicipios = async () => {
    try {
      const res = await api.get('/vehiculos/municipios');
      setMunicipios(res.data || []);
    } catch (error) {
      console.error('Error cargando municipios:', error);
    }
  };

  const cargarStats = async () => {
    try {
      const [statsRes, segurosRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/alertas-seguros')
      ]);
      setStats(statsRes.data);
      setSegurosStats(segurosRes.data?.stats || null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarDeterminacion = async () => {
    try {
      setDetLoading(true);
      const [detRes, propRes] = await Promise.all([
        api.get('/vehiculos?limit=1000&busqueda=DIF-DET'),
        api.get('/vehiculos?limit=1000'),
      ]);
      const conDET = (detRes.data.vehiculos || []).filter(v => v.numero_inventario?.includes('DIF-DET'));
      const propuestos = (propRes.data.vehiculos || []).filter(v => 
        v.propuesto_baja === 1 || v.propuesto_baja === '1' || v.propuesto_baja === true
      );
      setDetVehiculos(conDET);
      setDetPropuestos(propuestos);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDetLoading(false);
    }
  };

  const cambiarTab = (tab) => {
    setTabActivo(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'catalogo') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params);
  };

  const cargarVehiculos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '100');
      
      if (busqueda) params.set('busqueda', busqueda);
      if (filtros.estado_operativo) params.set('estado_operativo', filtros.estado_operativo);
      if (filtros.regimen) params.set('regimen', filtros.regimen);
      if (filtros.secretaria_id) params.set('secretaria_id', filtros.secretaria_id);
      if (filtros.marca) params.set('marca', filtros.marca);
      if (filtros.tipo) params.set('tipo', filtros.tipo);
      if (filtros.condicion) params.set('estatus', filtros.condicion);
      if (filtros.clasificacion) params.set('clasificacion', filtros.clasificacion);
      if (filtros.proveedor) params.set('proveedor', filtros.proveedor);
      if (filtros.municipio) params.set('municipio', filtros.municipio);

      const res = await api.get(`/vehiculos?${params.toString()}`);
      setVehiculos(res.data.vehiculos || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1);
    
    // Actualizar URL
    const params = new URLSearchParams(searchParams);
    if (valor) {
      params.set(campo, valor);
    } else {
      params.delete(campo);
    }
    setSearchParams(params);
  };

  const limpiarFiltros = () => {
    setFiltros({ estado_operativo: '', regimen: '', secretaria_id: '', marca: '', tipo: '', condicion: '', clasificacion: '', proveedor: '', municipio: '' });
    setBusqueda('');
    setSearchParams({});
    setPage(1);
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v) || busqueda;

  // Obtener marcas únicas
  const marcasUnicas = [...new Set(vehiculos.map(v => v.marca))].filter(Boolean);

  // Obtener tipos únicos
  const tiposUnicos = [...new Set(vehiculos.map(v => v.tipo))].filter(Boolean).sort();

  // Obtener proveedores únicos
  const proveedoresUnicos = [...new Set(vehiculos.map(v => v.proveedor_arrendadora))].filter(Boolean);

  // Función para calcular estado del seguro
  const getEstadoSeguro = (vigenciaStr) => {
    if (!vigenciaStr || vigenciaStr === 'NO APLICA' || vigenciaStr === 'N/A') {
      return null;
    }
    
    let fecha = null;
    const cleanStr = vigenciaStr.replace(/\s*VENCIDA\s*/gi, '').trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      fecha = new Date(cleanStr);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanStr)) {
      const [dia, mes, anio] = cleanStr.split('/');
      fecha = new Date(anio, parseInt(mes) - 1, parseInt(dia));
    } else if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(cleanStr)) {
      const [mes, dia, anio] = cleanStr.split('/');
      const anioCompleto = parseInt(anio) > 50 ? 1900 + parseInt(anio) : 2000 + parseInt(anio);
      fecha = new Date(anioCompleto, parseInt(mes) - 1, parseInt(dia));
    }
    
    if (!fecha || isNaN(fecha.getTime())) return null;
    
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);
    
    if (fecha < hoy) {
      return { label: 'V', clase: 'bg-red-100 text-red-700', titulo: 'Seguro vencido' };
    } else if (fecha <= en30Dias) {
      return { label: 'P', clase: 'bg-orange-100 text-orange-700', titulo: 'Seguro por vencer' };
    } else {
      return { label: 'OK', clase: 'bg-green-100 text-green-700', titulo: 'Seguro vigente' };
    }
  };

  // Función para detectar situaciones especiales en situacion_juridica
  const getSituacionEspecial = (situacion) => {
    if (!situacion) return null;
    const sitUpper = situacion.toUpperCase();
    
    if (sitUpper.includes('ROBADO')) return { icono: '', texto: 'Robado' };
    if (sitUpper.includes('CALCINADO')) return { icono: '', texto: 'Calcinado' };
    if (sitUpper.includes('ACCIDENTADO')) return { icono: '', texto: 'Accidentado' };
    if (sitUpper.includes('DONADO A BOMBEROS')) return { icono: '', texto: 'Donado' };
    if (sitUpper.includes('CORRALON') || sitUpper.includes('CORRALÓN')) return { icono: '', texto: 'Corralón' };
    if (sitUpper.includes('SIN UBICACION') || sitUpper.includes('SIN UBICACIÓN')) return { icono: '', texto: 'Sin ubicar' };
    
    return null;
  };

  // Determinar si el usuario puede ver todos los filtros (admin, flota, usuario_principal)
  const puedeVerFiltrosCompletos = user?.rol === 'admin' || user?.rol === 'flota' || user?.rol === 'usuario_principal';
  
  // Determinar si el usuario puede agregar vehículos
  const puedeAgregarVehiculos = user?.rol === 'admin' || user?.rol === 'flota' || user?.rol === 'usuario_principal' || user?.rol === 'admin_secretaria';

  // Puede ver pestaña de determinación
  const puedeVerDeterminacion = ['admin', 'gobernacion', 'admin_secretaria'].includes(user?.rol);

  // Datos filtrados de determinación
  const detTodos = [...detVehiculos, ...detPropuestos.filter(p => !detVehiculos.find(v => v.id === p.id))];
  const detMostrados = (() => {
    let lista = detFiltro === 'dictaminados' ? detPropuestos : detFiltro === 'determinacion' ? detVehiculos : detTodos;
    if (detBusqueda) {
      const q = detBusqueda.toLowerCase();
      lista = lista.filter(v =>
        (v.marca||'').toLowerCase().includes(q) || (v.modelo||'').toLowerCase().includes(q) ||
        (v.placas||'').toLowerCase().includes(q) || (v.numero_inventario||'').toLowerCase().includes(q)
      );
    }
    return lista;
  })();

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ═══ TABS: Catálogo / Determinación ═══ */}
          {puedeVerDeterminacion && (
            <div className="bg-white border-b px-4 sm:px-6 pt-3 pb-0 flex items-center gap-1">
              <button
                onClick={() => cambiarTab('catalogo')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                  tabActivo === 'catalogo'
                    ? 'border-veracruz-600 text-veracruz-700 bg-veracruz-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TruckIcon className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Catálogo
              </button>
              <button
                onClick={() => cambiarTab('determinacion')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                  tabActivo === 'determinacion'
                    ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Det. Administrativa
                {stats?.propuestosBaja > 0 && (
                  <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                    {detVehiculos.length || '…'}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ═══════════ PESTAÑA DETERMINACIÓN ═══════════ */}
          {tabActivo === 'determinacion' && puedeVerDeterminacion ? (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
                {/* Header Determinación */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <ExclamationTriangleIcon className="h-7 w-7 text-amber-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Determinación Administrativa</h1>
                  </div>
                  <p className="text-sm text-gray-500">Vehículos pendientes de baja ante Secretaría de Hacienda</p>
                </div>

                {/* Alerta informativa */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-amber-800 font-semibold text-sm">Proceso de Baja</h3>
                      <p className="text-amber-700 text-xs mt-0.5">
                        Estos vehículos requieren trámite de baja ante la Secretaría de Hacienda. Están fuera de operación y pendientes de resolución administrativa.
                      </p>
                    </div>
                  </div>
                </div>

                {detLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-amber-500"></div>
                  </div>
                ) : (
                  <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button onClick={() => setDetFiltro(f => f === 'determinacion' ? 'todos' : 'determinacion')}
                        className={`rounded-xl p-4 text-left transition-all border ${
                          detFiltro === 'determinacion'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-lg ring-2 ring-amber-300'
                            : 'bg-white hover:bg-amber-50 border-gray-100 shadow-sm'
                        }`}>
                        <p className={`text-xs font-medium ${detFiltro === 'determinacion' ? 'text-amber-100' : 'text-gray-500'}`}>Total Determinación</p>
                        <p className={`text-2xl font-bold ${detFiltro === 'determinacion' ? 'text-white' : 'text-amber-600'}`}>{detVehiculos.length}</p>
                      </button>
                      <button onClick={() => setDetFiltro(f => f === 'dictaminados' ? 'todos' : 'dictaminados')}
                        className={`rounded-xl p-4 text-left transition-all border ${
                          detFiltro === 'dictaminados'
                            ? 'bg-red-600 text-white border-red-600 shadow-lg ring-2 ring-red-300'
                            : 'bg-white hover:bg-red-50 border-red-200 shadow-sm'
                        }`}>
                        <p className={`text-xs font-medium ${detFiltro === 'dictaminados' ? 'text-red-100' : 'text-gray-500'}`}>Dictaminados Baja</p>
                        <p className={`text-2xl font-bold ${detFiltro === 'dictaminados' ? 'text-white' : 'text-red-600'}`}>{detPropuestos.length}</p>
                      </button>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs font-medium text-gray-500">Valor en Libros</p>
                        <p className="text-xl font-bold text-gray-700">${detVehiculos.reduce((a, v) => a + (v.valor_libros || 0), 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs font-medium text-gray-500">Antigüedad Promedio</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round(detVehiculos.reduce((a, v) => a + (2026 - (v.anio || 2020)), 0) / (detVehiculos.length || 1))} años
                        </p>
                      </div>
                    </div>

                    {/* Buscador + indicador filtro */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Buscar por placa, marca, inventario..."
                          value={detBusqueda} onChange={e => setDetBusqueda(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                      </div>
                      {detFiltro !== 'todos' && (
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            detFiltro === 'determinacion' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {detFiltro === 'determinacion' ? 'Determinación' : 'Dictaminados Baja'}
                          </span>
                          <button onClick={() => setDetFiltro('todos')} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <span className="text-xs text-gray-400">{detMostrados.length} vehículos</span>
                    </div>

                    {/* Tabla */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b text-left">
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehículo</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Placas</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Año</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Valor</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detMostrados.map((v) => (
                              <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                                <td className="px-4 py-3">
                                  <Link to={`/vehiculos/${v.id}`} className="group">
                                    <p className="font-semibold text-gray-900 group-hover:text-veracruz-700 text-sm">{v.marca} {v.linea || v.modelo}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{v.numero_inventario}</p>
                                  </Link>
                                </td>
                                <td className="px-4 py-3 font-mono text-sm text-gray-700">{v.placas || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{v.anio}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    v.propuesto_baja ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                  }`}>{v.propuesto_baja ? 'Dictaminado' : 'Determinación'}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{v.tipo || '-'}</td>
                                <td className="px-4 py-3 text-xs text-green-700 font-medium hidden lg:table-cell">
                                  {v.valor_libros ? `$${Number(v.valor_libros).toLocaleString()}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Link to={`/vehiculos/${v.id}`}
                                    className="text-[10px] font-semibold px-2.5 py-1 bg-veracruz-50 text-veracruz-700 border border-veracruz-200 rounded-lg hover:bg-veracruz-100 transition-colors inline-flex items-center gap-1">
                                    <EyeIcon className="h-3 w-3" /> Ver
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {detMostrados.length === 0 && (
                        <div className="p-10 text-center">
                          <ExclamationTriangleIcon className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No hay vehículos en esta categoría</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
          <>
          {/* ═══════════ PESTAÑA CATÁLOGO (existente) ═══════════ */}
          <div className="bg-white border-b px-4 sm:px-6 py-4">
            {puedeVerFiltrosCompletos ? (
              /* Vista completa para admin/flota */
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Catálogo de Vehículos</h1>
                  <p className="text-sm text-gray-500">{total} vehículos encontrados</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por placa, marca, modelo, serie..."
                      value={busqueda}
                      onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                      className="pl-9 pr-4 py-2 w-full sm:w-64 border border-gray-200 rounded-lg text-sm focus:border-veracruz-500 focus:ring-1 focus:ring-veracruz-500"
                    />
                  </div>

                  {/* Toggle vista */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setVistaLista(false)}
                      className={`p-1.5 rounded-md transition-all ${!vistaLista ? 'bg-white shadow-sm text-veracruz-700' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vista tarjetas">
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button onClick={() => setVistaLista(true)}
                      className={`p-1.5 rounded-md transition-all ${vistaLista ? 'bg-white shadow-sm text-veracruz-700' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vista lista">
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <Link 
                    to="/vehiculos/nuevo"
                    className="bg-veracruz-600 text-white px-4 py-2 rounded-lg hover:bg-veracruz-700 transition-colors text-sm font-medium whitespace-nowrap text-center"
                  >
                    + Agregar
                  </Link>
                </div>
              </div>
            ) : (
              /* Vista simplificada para secretarías - buscador + contador + botón agregar */
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 w-full max-w-2xl">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar vehículo por placa, marca, modelo, serie..."
                      value={busqueda}
                      onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:border-veracruz-500 focus:ring-2 focus:ring-veracruz-200 shadow-sm"
                    />
                  </div>

                  {/* Toggle vista */}
                  <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
                    <button onClick={() => setVistaLista(false)}
                      className={`p-2 rounded-lg transition-all ${!vistaLista ? 'bg-white shadow-sm text-veracruz-700' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vista tarjetas">
                      <Squares2X2Icon className="h-5 w-5" />
                    </button>
                    <button onClick={() => setVistaLista(true)}
                      className={`p-2 rounded-lg transition-all ${vistaLista ? 'bg-white shadow-sm text-veracruz-700' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vista lista">
                      <ListBulletIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {puedeAgregarVehiculos && (
                    <Link 
                      to="/vehiculos/nuevo"
                      className="bg-veracruz-600 text-white px-5 py-3 rounded-xl hover:bg-veracruz-700 transition-colors text-base font-medium whitespace-nowrap flex items-center gap-2 shadow-sm"
                    >
                      <TruckIcon className="h-5 w-5" />
                      Agregar Vehículo
                    </Link>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {total} vehículos encontrados
                </span>
              </div>
            )}
          </div>

          {/* Filtros para secretarías */}
          {!puedeVerFiltrosCompletos && (
            <div className="bg-white border-b px-6 py-3">
              <div className="flex flex-wrap justify-center gap-2">
                {/* Estado operativo */}
                <FiltroSelect
                  value={filtros.estado_operativo}
                  onChange={(val) => aplicarFiltro('estado_operativo', val)}
                  onClear={() => aplicarFiltro('estado_operativo', '')}
                  options={[
                    { value: 'Operando', label: 'Operando' },
                    { value: 'Disponible', label: 'Disponible' },
                    { value: 'En taller', label: 'En taller' },
                    { value: 'Mal estado', label: 'Mal estado' },
                    { value: 'Baja', label: 'Baja' },
                  ]}
                  placeholder="Estado"
                  color="veracruz"
                />

                {/* Condición */}
                <FiltroSelect
                  value={filtros.condicion}
                  onChange={(val) => aplicarFiltro('condicion', val)}
                  onClear={() => aplicarFiltro('condicion', '')}
                  options={[
                    { value: 'Bueno', label: 'Bueno' },
                    { value: 'Regular', label: 'Regular' },
                    { value: 'Malo', label: 'Malo' },
                  ]}
                  placeholder="Condición"
                  color="amber"
                />

                {/* Municipio */}
                <FiltroSelect
                  value={filtros.municipio}
                  onChange={(val) => aplicarFiltro('municipio', val)}
                  onClear={() => aplicarFiltro('municipio', '')}
                  options={municipios.map(m => ({ value: m, label: m }))}
                  placeholder="Municipio"
                  color="emerald"
                  searchable
                />

                {/* Régimen */}
                <FiltroSelect
                  value={filtros.regimen}
                  onChange={(val) => aplicarFiltro('regimen', val)}
                  onClear={() => aplicarFiltro('regimen', '')}
                  options={[
                    { value: 'Propio', label: 'Propio' },
                    { value: 'Comodato', label: 'Comodato' },
                  ]}
                  placeholder="Régimen"
                  color="purple"
                />

                {/* Proveedor */}
                {proveedoresUnicos.length > 0 && (
                  <FiltroSelect
                    value={filtros.proveedor}
                    onChange={(val) => aplicarFiltro('proveedor', val)}
                    onClear={() => aplicarFiltro('proveedor', '')}
                    options={proveedoresUnicos.map(p => ({ value: p, label: p }))}
                    placeholder="Proveedor"
                    color="indigo"
                    searchable
                  />
                )}

                {/* Limpiar */}
                {hayFiltrosActivos && (
                  <button 
                    onClick={limpiarFiltros} 
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filtros compactos - Solo para admins/flota */}
          {puedeVerFiltrosCompletos && (
            <div className="bg-white border-b px-6 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Estado */}
                <FiltroSelect
                  value={filtros.estado_operativo}
                  onChange={(val) => aplicarFiltro('estado_operativo', val)}
                  onClear={() => aplicarFiltro('estado_operativo', '')}
                  options={[
                    { value: 'Operando', label: `Operando (${stats?.vehiculosPorEstado?.find(e => e.estado === 'Operando')?.cantidad || 0})` },
                    { value: 'Disponible', label: `Disponible (${stats?.vehiculosPorEstado?.find(e => e.estado === 'Disponible')?.cantidad || 0})` },
                    { value: 'En taller', label: `En taller (${stats?.vehiculosPorEstado?.find(e => e.estado === 'En taller')?.cantidad || 0})` },
                    { value: 'Mal estado', label: `Mal estado (${stats?.vehiculosPorEstado?.find(e => e.estado === 'Mal estado')?.cantidad || 0})` },
                    { value: 'Baja', label: `Baja (${stats?.vehiculosPorEstado?.find(e => e.estado === 'Baja')?.cantidad || 0})` },
                  ]}
                  placeholder="Estado"
                  color="veracruz"
                />

                {/* Régimen */}
                <FiltroSelect
                  value={filtros.regimen}
                  onChange={(val) => aplicarFiltro('regimen', val)}
                  onClear={() => aplicarFiltro('regimen', '')}
                  options={[
                    { value: 'Propio', label: `Propio (${stats?.vehiculosPorRegimen?.find(r => r.regimen === 'Propio')?.cantidad || 0})` },
                    { value: 'Arrendado', label: `Arrendado (${stats?.vehiculosPorRegimen?.find(r => r.regimen === 'Arrendado')?.cantidad || 0})` },
                    { value: 'Comodato', label: `Comodato (${stats?.vehiculosPorRegimen?.find(r => r.regimen === 'Comodato')?.cantidad || 0})` },
                  ]}
                  placeholder="Régimen"
                  color="purple"
                />

                {/* Condición */}
                <FiltroSelect
                  value={filtros.condicion}
                  onChange={(val) => aplicarFiltro('condicion', val)}
                  onClear={() => aplicarFiltro('condicion', '')}
                  options={[
                    { value: 'Bueno', label: 'Bueno' },
                    { value: 'Regular', label: 'Regular' },
                    { value: 'Malo', label: 'Malo' },
                  ]}
                  placeholder="Condición"
                  color="amber"
                />

                {/* Clasificación */}
                <FiltroSelect
                  value={filtros.clasificacion}
                  onChange={(val) => aplicarFiltro('clasificacion', val)}
                  onClear={() => aplicarFiltro('clasificacion', '')}
                  options={[
                    { value: 'operativo', label: 'Operativos' },
                    { value: 'donado', label: 'Donados' },
                    { value: 'determinacion', label: 'Determinación' },
                    { value: 'comodato_externo', label: 'Comodato Ext.' },
                  ]}
                  placeholder="Clasificación"
                  color="teal"
                />

                {/* Dependencia */}
                <FiltroSelect
                  value={filtros.secretaria_id}
                  onChange={(val) => aplicarFiltro('secretaria_id', val)}
                  onClear={() => aplicarFiltro('secretaria_id', '')}
                  options={secretarias.map(sec => ({ value: sec.id.toString(), label: sec.siglas }))}
                  placeholder="Dependencia"
                  color="blue"
                  searchable
                />

                {/* Marca */}
                <FiltroSelect
                  value={filtros.marca}
                  onChange={(val) => aplicarFiltro('marca', val)}
                  onClear={() => aplicarFiltro('marca', '')}
                  options={marcasUnicas.map(m => ({ value: m, label: m }))}
                  placeholder="Marca"
                  color="gray"
                  searchable
                />

                {/* Tipo de Vehículo */}
                <FiltroSelect
                  value={filtros.tipo}
                  onChange={(val) => aplicarFiltro('tipo', val)}
                  onClear={() => aplicarFiltro('tipo', '')}
                  options={tiposUnicos.map(t => ({ value: t, label: t }))}
                  placeholder="Tipo"
                  color="cyan"
                  searchable
                />

                {/* Proveedor */}
                <FiltroSelect
                  value={filtros.proveedor}
                  onChange={(val) => aplicarFiltro('proveedor', val)}
                  onClear={() => aplicarFiltro('proveedor', '')}
                  options={proveedoresUnicos.map(p => ({ value: p, label: p }))}
                  placeholder="Proveedor"
                  color="indigo"
                  searchable
                />

                {/* Municipio */}
                <FiltroSelect
                  value={filtros.municipio}
                  onChange={(val) => aplicarFiltro('municipio', val)}
                  onClear={() => aplicarFiltro('municipio', '')}
                  options={municipios.map(m => ({ value: m, label: m }))}
                  placeholder="Municipio"
                  color="emerald"
                  searchable
                />

              {/* Limpiar filtros */}
              {hayFiltrosActivos && (
                <button 
                  onClick={limpiarFiltros} 
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Limpiar
                </button>
              )}
              </div>
            </div>
          )}

          {/* Área de scroll para el contenido */}
          <div className="flex-1 overflow-y-auto p-6">

          {/* === Stat Cards: resumen de flota === */}
          {stats && (
            <div className="mb-5">
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { label: 'Total', value: stats.totalVehiculos, filter: '', color: 'gray', activeBg: 'bg-gray-800', hoverBg: 'hover:bg-gray-50' },
                  { label: 'Operando', value: stats.vehiculosPorEstado?.find(e => e.estado === 'Operando')?.cantidad || 0, filter: 'Operando', color: 'green', activeBg: 'bg-green-600', hoverBg: 'hover:bg-green-50' },
                  { label: 'Disponible', value: stats.vehiculosPorEstado?.find(e => e.estado === 'Disponible')?.cantidad || 0, filter: 'Disponible', color: 'blue', activeBg: 'bg-blue-600', hoverBg: 'hover:bg-blue-50' },
                  { label: 'Taller', value: stats.vehiculosEnTaller || 0, filter: 'En taller', color: 'yellow', activeBg: 'bg-yellow-600', hoverBg: 'hover:bg-yellow-50' },
                  { label: 'Mal Estado', value: stats.vehiculosPorEstado?.find(e => e.estado === 'Mal estado')?.cantidad || 0, filter: 'Mal estado', color: 'orange', activeBg: 'bg-orange-600', hoverBg: 'hover:bg-orange-50' },
                  { label: 'Baja', value: stats.vehiculosPorEstado?.find(e => e.estado === 'Baja')?.cantidad || 0, filter: 'Baja', color: 'red', activeBg: 'bg-red-600', hoverBg: 'hover:bg-red-50' },
                  { label: 'Dict. Baja', value: stats.propuestosBaja || 0, filter: '__propuesto_baja', color: 'purple', activeBg: 'bg-purple-600', hoverBg: 'hover:bg-purple-50' },
                ].map((card) => {
                  const isActive = card.filter === '' 
                    ? !filtros.estado_operativo 
                    : filtros.estado_operativo === card.filter;
                  return (
                    <button
                      key={card.label}
                      onClick={() => {
                        if (card.filter === '__propuesto_baja') {
                          aplicarFiltro('estado_operativo', '');
                        } else {
                          aplicarFiltro('estado_operativo', card.filter === filtros.estado_operativo ? '' : card.filter);
                        }
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl text-center transition-all ${
                        isActive 
                          ? `${card.activeBg} text-white shadow-lg ring-2 ring-offset-1 ring-${card.color}-400` 
                          : `bg-white text-gray-700 ${card.hoverBg} shadow-sm border border-gray-100`
                      }`}
                    >
                      <div className="text-xl sm:text-2xl font-bold leading-none">{card.value}</div>
                      <div className="text-[10px] sm:text-xs mt-1 font-medium opacity-80">{card.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Seguros summary pills */}
              {segurosStats && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Seg. Vencidos: {segurosStats.vencidos}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Por Vencer: {segurosStats.por_vencer}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Vigentes: {segurosStats.vigentes}
                  </span>
                  {segurosStats.sin_seguro > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      Sin Seguro: {segurosStats.sin_seguro}
                    </span>
                  )}
                  {segurosStats.en_tramite > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      En Trámite: {segurosStats.en_tramite}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Grid de Vehículos */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-dorado-500"></div>
            </div>
          ) : vehiculos.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <TruckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No se encontraron vehículos</h3>
              <p className="text-gray-500 mt-2">Intenta cambiar los filtros de búsqueda</p>
            </div>
          ) : vistaLista ? (
            /* ==================== VISTA LISTA / TABLA ==================== */
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-left">
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Vehículo</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Placas</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Serie</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Régimen</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Dependencia</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Municipio</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">Km</th>
                      <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">Valor</th>
                      {puedeAsignar && <th className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider w-40">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vehiculos.map((v) => {
                      const seguro = getEstadoSeguro(v.vigencia_seguro);
                      const sitEsp = getSituacionEspecial(v.situacion_juridica);
                      return (
                        <tr key={v.id} className={`hover:bg-gray-50/70 transition-colors ${v.asignacion_id ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-3 py-2.5">
                            <Link to={`/vehiculos/${v.id}`} className="block group">
                              <div className="flex items-center gap-2">
                                {v.asignacion_id && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="En uso" />}
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 group-hover:text-veracruz-700 truncate text-sm">{v.marca} {v.linea || v.modelo}</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-400">{v.anio}</span>
                                    {v.color && <span className="text-xs text-gray-400">• {v.color}</span>}
                                    {v.tipo && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{v.tipo}</span>}
                                  </div>
                                </div>
                              </div>
                              {v.asignacion_id && (
                                <p className="text-[10px] text-amber-600 mt-0.5 truncate">🚗 {v.asignacion_conductor}{v.asignacion_destino ? ` → ${v.asignacion_destino}` : ''}</p>
                              )}
                              {sitEsp && <span className="text-[10px] text-red-600 font-bold">{sitEsp.icono} {sitEsp.texto}</span>}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            <Link to={`/vehiculos/${v.id}`} className="font-mono text-sm font-medium text-gray-800">{v.placas}</Link>
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell">
                            <span className="font-mono text-xs text-gray-400">{v.numero_serie?.substring(0, 17) || '-'}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-block text-center px-2 py-0.5 rounded text-[10px] font-semibold w-fit ${
                                v.estado_operativo === 'Operando' ? 'bg-green-100 text-green-700' :
                                v.estado_operativo === 'En taller' ? 'bg-yellow-100 text-yellow-700' :
                                v.estado_operativo === 'Mal estado' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{v.estado_operativo}</span>
                              {v.estatus && (
                                <span className={`text-[10px] ${
                                  v.estatus === 'Bueno' ? 'text-green-600' :
                                  v.estatus === 'Regular' ? 'text-yellow-600' :
                                  v.estatus === 'Malo' ? 'text-red-600' : 'text-gray-500'
                                }`}>{v.estatus}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              v.regimen === 'Propio' ? 'bg-blue-50 text-blue-600' :
                              v.regimen === 'Arrendado' ? 'bg-purple-50 text-purple-600' :
                              'bg-orange-50 text-orange-600'
                            }`}>{v.regimen || '-'}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <span className="text-xs text-gray-600 font-medium">{v.secretaria_siglas || '-'}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell">
                            <span className="text-xs text-gray-500">{v.municipio || '-'}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden xl:table-cell">
                            <span className="text-xs font-medium text-gray-700">{v.kilometraje ? `${v.kilometraje.toLocaleString()}` : '-'}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden xl:table-cell">
                            <span className="text-xs text-green-700 font-medium">{v.valor_libros ? `$${Number(v.valor_libros).toLocaleString()}` : '-'}</span>
                          </td>
                          {puedeAsignar && (
                            <td className="px-3 py-2.5">
                              {v.asignacion_id ? (
                                <button onClick={() => abrirEntrada(v)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-[10px] font-semibold transition-colors w-full justify-center">
                                  <ArrowLeftIcon className="h-3 w-3" /> Entrada
                                </button>
                              ) : (
                                <button onClick={() => abrirSalida(v)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-[10px] font-semibold transition-colors w-full justify-center">
                                  <ArrowRightIcon className="h-3 w-3" /> Salida
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ==================== VISTA TARJETAS ==================== */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vehiculos.map((v) => (
                <div
                  key={v.id}
                  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 flex flex-col ${
                    v.asignacion_id ? 'border-amber-500' :
                    v.clasificacion === 'donado' ? 'border-orange-500' :
                    v.clasificacion === 'determinacion' ? 'border-red-500' :
                    v.clasificacion === 'comodato_externo' ? 'border-blue-500' :
                    'border-dorado-500'
                  }`}
                >
                  <Link to={`/vehiculos/${v.id}`} className="p-4 flex-1">
                  {/* Badge asignación activa */}
                  {v.asignacion_id && (
                    <div className="mb-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <span className="text-amber-600 text-xs font-bold">🚗 EN USO</span>
                      <span className="text-xs text-gray-600">— {v.asignacion_conductor}</span>
                      {v.asignacion_destino && <span className="text-xs text-gray-400 ml-auto">{v.asignacion_destino}</span>}
                    </div>
                  )}

                  {/* Badge de clasificación especial */}
                  {v.clasificacion && v.clasificacion !== 'operativo' && (
                    <div className={`mb-2 text-xs font-bold px-2 py-1 rounded inline-block ${
                      v.clasificacion === 'donado' ? 'bg-orange-100 text-orange-700' :
                      v.clasificacion === 'determinacion' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {v.clasificacion === 'donado' && 'DONADO'}
                      {v.clasificacion === 'determinacion' && 'DETERMINACIÓN'}
                      {v.clasificacion === 'comodato_externo' && 'COMODATO'}
                    </div>
                  )}
                  
                  {/* Alerta de situación especial (robado, calcinado, accidentado, etc.) */}
                  {getSituacionEspecial(v.situacion_juridica) && (
                    <div className="mb-2 text-xs font-bold px-2 py-1 rounded inline-block bg-red-100 text-red-700 border border-red-300">
                      {getSituacionEspecial(v.situacion_juridica).icono} {getSituacionEspecial(v.situacion_juridica).texto}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{v.marca} {v.linea || v.modelo}</h3>
                      <p className="text-gray-500 text-sm">{v.anio} • {v.color}</p>
                      {v.tipo && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-veracruz-100 text-veracruz-700 rounded text-xs font-medium">
                          {v.tipo}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      v.estado_operativo === 'Operando' ? 'bg-green-100 text-green-800' :
                      v.estado_operativo === 'En taller' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {v.estado_operativo}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Placas:</span>
                      <span className="font-mono font-medium">{v.placas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Serie:</span>
                      <span className="font-mono text-xs text-gray-600">{v.numero_serie?.substring(0, 17) || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Régimen:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        v.regimen === 'Propio' ? 'bg-blue-100 text-blue-700' :
                        v.regimen === 'Arrendado' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{v.regimen}</span>
                    </div>
                    {v.estatus && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Condición:</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          v.estatus === 'Bueno' ? 'bg-green-100 text-green-700' :
                          v.estatus === 'Regular' ? 'bg-yellow-100 text-yellow-700' :
                          v.estatus === 'Malo' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{v.estatus}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dependencia:</span>
                      <span className="font-medium">{v.secretaria_siglas || 'N/A'}</span>
                    </div>
                    {v.situacion_juridica && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sit. Jurídica:</span>
                        <span className={`text-xs px-2 py-0.5 rounded truncate max-w-[150px] ${
                          v.situacion_juridica?.includes('COMODATO') ? 'bg-orange-100 text-orange-700' :
                          v.situacion_juridica?.includes('PROPIO') ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`} title={v.situacion_juridica}>{v.situacion_juridica.split(/[\r\n]/)[0]}</span>
                      </div>
                    )}
                    {v.municipio && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">{v.situacion_juridica?.includes('COMODATO') ? 'Destino:' : 'Ubicación:'}</span>
                        <span className="text-gray-600 font-medium">{v.municipio}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Km:</span>
                      <span className="font-medium">{v.kilometraje?.toLocaleString() || '0'} km</span>
                    </div>
                    {getEstadoSeguro(v.vigencia_seguro) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Seguro:</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getEstadoSeguro(v.vigencia_seguro).clase}`} 
                              title={getEstadoSeguro(v.vigencia_seguro).titulo}>
                          {getEstadoSeguro(v.vigencia_seguro).label} {v.vigencia_seguro}
                        </span>
                      </div>
                    )}
                    {v.valor_libros && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor:</span>
                        <span className="text-green-700 font-medium">${v.valor_libros?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  </Link>

                  {/* Botón de asignación en la tarjeta */}
                  {puedeAsignar && (
                    <div className="border-t px-4 py-2.5 bg-gray-50/80 rounded-b-xl">
                      {v.asignacion_id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); abrirEntrada(v); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-semibold transition-colors"
                        >
                          <ArrowLeftIcon className="h-3.5 w-3.5" />
                          Registrar Entrada — {v.asignacion_conductor}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); abrirSalida(v); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-xs font-semibold transition-colors"
                        >
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                          Registrar Salida
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {total > 100 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 bg-veracruz-500 text-white rounded-lg">
                Página {page} de {Math.ceil(total / 100)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 100)}
                className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          )}
          </div>
          </>)}
        </div>
      </div>

      {/* ==================== MODAL REGISTRAR SALIDA ==================== */}
      {modalSalida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-veracruz-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-veracruz-800 flex items-center gap-2">
                <ArrowRightIcon className="h-5 w-5" /> Registrar Salida
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {modalSalida.marca} {modalSalida.linea || modalSalida.modelo} — {modalSalida.placas}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conductor *</label>
                <input type="text" value={salidaForm.conductor_nombre}
                  onChange={e => setSalidaForm(f => ({ ...f, conductor_nombre: e.target.value }))}
                  placeholder="Nombre completo" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" value={salidaForm.conductor_cargo}
                  onChange={e => setSalidaForm(f => ({ ...f, conductor_cargo: e.target.value }))}
                  placeholder="Cargo del conductor" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha salida *</label>
                  <input type="date" value={salidaForm.fecha_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, fecha_salida: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora salida *</label>
                  <input type="time" value={salidaForm.hora_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, hora_salida: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km salida *</label>
                  <input type="number" value={salidaForm.km_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, km_salida: e.target.value }))}
                    placeholder="Kilometraje actual" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Combustible salida</label>
                  <select value={salidaForm.combustible_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, combustible_salida: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">— Seleccionar —</option>
                    <option value="Lleno">Lleno</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="Vacío">Vacío</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
                <input type="text" value={salidaForm.destino}
                  onChange={e => setSalidaForm(f => ({ ...f, destino: e.target.value }))}
                  placeholder="Destino del viaje" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea value={salidaForm.motivo}
                  onChange={e => setSalidaForm(f => ({ ...f, motivo: e.target.value }))}
                  placeholder="Motivo del viaje" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModalSalida(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button onClick={registrarSalida} disabled={enviandoAsg}
                className="px-6 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-sm font-semibold disabled:opacity-50">
                {enviandoAsg ? 'Registrando...' : 'Registrar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL REGISTRAR ENTRADA ==================== */}
      {modalEntrada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-green-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <ArrowLeftIcon className="h-5 w-5" /> Registrar Entrada (Devolución)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {modalEntrada.marca} {modalEntrada.linea || modalEntrada.modelo} — {modalEntrada.placas}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Folio: {modalEntrada.asignacion_folio} — Conductor: {modalEntrada.asignacion_conductor}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha entrada *</label>
                  <input type="date" value={entradaForm.fecha_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, fecha_entrada: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora entrada *</label>
                  <input type="time" value={entradaForm.hora_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, hora_entrada: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km entrada *</label>
                  <input type="number" value={entradaForm.km_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, km_entrada: e.target.value }))}
                    placeholder="Kilometraje al devolver" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Combustible entrada</label>
                  <select value={entradaForm.combustible_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, combustible_entrada: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">— Seleccionar —</option>
                    <option value="Lleno">Lleno</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="Vacío">Vacío</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de devolución</label>
                <select value={entradaForm.estado_devolucion}
                  onChange={e => setEntradaForm(f => ({ ...f, estado_devolucion: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="con_danos">Con daños</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={entradaForm.observaciones}
                  onChange={e => setEntradaForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Observaciones sobre el estado del vehículo" rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModalEntrada(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button onClick={registrarEntrada} disabled={enviandoAsg}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50">
                {enviandoAsg ? 'Registrando...' : 'Registrar Entrada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
