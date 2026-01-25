import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, TruckIcon } from '@heroicons/react/24/outline';

export default function VehiculosLista() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [secretarias, setSecretarias] = useState([]);
  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') || '');
  
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

  useEffect(() => {
    cargarSecretarias();
    cargarStats();
    cargarMunicipios();
  }, []);

  // Detectar cambios en la URL (búsqueda desde header)
  useEffect(() => {
    const busquedaParam = searchParams.get('busqueda') || '';
    if (busquedaParam !== busqueda) {
      setBusqueda(busquedaParam);
    }
    
    // Detectar cambios en el proveedor desde la URL
    const proveedorParam = searchParams.get('proveedor') || '';
    if (proveedorParam !== filtros.proveedor) {
      setFiltros(prev => ({ ...prev, proveedor: proveedorParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    cargarVehiculos();
  }, [filtros, page, busqueda]);

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
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
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
    setFiltros({ estado_operativo: '', regimen: '', secretaria_id: '', marca: '' });
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header con búsqueda */}
          <div className="bg-white border-b px-6 py-4">
            {puedeVerFiltrosCompletos ? (
              /* Vista completa para admin/flota */
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Catálogo de Vehículos</h1>
                  <p className="text-sm text-gray-500">{total} vehículos encontrados</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por placa, marca, modelo, serie..."
                      value={busqueda}
                      onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                      className="pl-9 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:border-veracruz-500 focus:ring-1 focus:ring-veracruz-500"
                    />
                  </div>
                  
                  <Link 
                    to="/vehiculos/nuevo"
                    className="bg-veracruz-600 text-white px-4 py-2 rounded-lg hover:bg-veracruz-700 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    + Agregar
                  </Link>
                </div>
              </div>
            ) : (
              /* Vista simplificada para secretarías - buscador + contador */
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-full max-w-xl">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar vehículo por placa, marca, modelo, serie..."
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:border-veracruz-500 focus:ring-2 focus:ring-veracruz-200 shadow-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {total} vehículos
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Filtros para secretarías */}
          {!puedeVerFiltrosCompletos && (
            <div className="bg-white border-b px-6 py-3">
              <div className="flex flex-wrap justify-center gap-2">
                {/* Estado operativo */}
                <select
                  value={filtros.estado_operativo}
                  onChange={(e) => aplicarFiltro('estado_operativo', e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                    filtros.estado_operativo 
                      ? 'bg-veracruz-600 text-white border-veracruz-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option value="">Estado</option>
                  <option value="Operando">Operando</option>
                  <option value="Disponible">Disponible</option>
                  <option value="En taller">En taller</option>
                  <option value="Mal estado">Mal estado</option>
                  <option value="Baja">Baja</option>
                </select>

                {/* Condición */}
                <select
                  value={filtros.condicion}
                  onChange={(e) => aplicarFiltro('condicion', e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                    filtros.condicion 
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option value="">Condición</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>

                {/* Municipio */}
                <select
                  value={filtros.municipio}
                  onChange={(e) => aplicarFiltro('municipio', e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                    filtros.municipio 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option value="">Municipio</option>
                  {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                </select>

                {/* Régimen */}
                <select
                  value={filtros.regimen}
                  onChange={(e) => aplicarFiltro('regimen', e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                    filtros.regimen 
                      ? 'bg-purple-600 text-white border-purple-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option value="">Régimen</option>
                  <option value="Propio">Propio</option>
                  <option value="Comodato">Comodato</option>
                </select>

                {/* Proveedor */}
                {proveedoresUnicos.length > 0 && (
                  <select
                    value={filtros.proveedor}
                    onChange={(e) => aplicarFiltro('proveedor', e.target.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                      filtros.proveedor 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Proveedor</option>
                    {proveedoresUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
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
              <select
                value={filtros.estado_operativo}
                onChange={(e) => aplicarFiltro('estado_operativo', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.estado_operativo 
                    ? 'bg-veracruz-600 text-white border-veracruz-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Estado ▾</option>
                <option value="Operando">Operando ({stats?.vehiculosPorEstado?.find(e => e.estado === 'Operando')?.cantidad || 0})</option>
                <option value="Disponible">Disponible ({stats?.vehiculosPorEstado?.find(e => e.estado === 'Disponible')?.cantidad || 0})</option>
                <option value="En taller">En taller ({stats?.vehiculosPorEstado?.find(e => e.estado === 'En taller')?.cantidad || 0})</option>
                <option value="Mal estado">Mal estado ({stats?.vehiculosPorEstado?.find(e => e.estado === 'Mal estado')?.cantidad || 0})</option>
                <option value="Baja">Baja ({stats?.vehiculosPorEstado?.find(e => e.estado === 'Baja')?.cantidad || 0})</option>
              </select>

              {/* Régimen */}
              <select
                value={filtros.regimen}
                onChange={(e) => aplicarFiltro('regimen', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.regimen 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Régimen ▾</option>
                <option value="Propio">Propio ({stats?.vehiculosPorRegimen?.find(r => r.regimen === 'Propio')?.cantidad || 0})</option>
                <option value="Arrendado">Arrendado ({stats?.vehiculosPorRegimen?.find(r => r.regimen === 'Arrendado')?.cantidad || 0})</option>
                <option value="Comodato">Comodato ({stats?.vehiculosPorRegimen?.find(r => r.regimen === 'Comodato')?.cantidad || 0})</option>
              </select>

              {/* Condición */}
              <select
                value={filtros.condicion}
                onChange={(e) => aplicarFiltro('condicion', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.condicion 
                    ? 'bg-amber-600 text-white border-amber-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Condición ▾</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
              </select>

              {/* Clasificación */}
              <select
                value={filtros.clasificacion}
                onChange={(e) => aplicarFiltro('clasificacion', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.clasificacion 
                    ? 'bg-teal-600 text-white border-teal-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Clasificación ▾</option>
                <option value="operativo">Operativos</option>
                <option value="donado">Donados</option>
                <option value="determinacion">Determinación</option>
                <option value="comodato_externo">Comodato Ext.</option>
              </select>

              {/* Dependencia */}
              <select
                value={filtros.secretaria_id}
                onChange={(e) => aplicarFiltro('secretaria_id', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer max-w-[200px] ${
                  filtros.secretaria_id 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Dependencia ▾</option>
                {secretarias.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.siglas}</option>
                ))}
              </select>

              {/* Marca */}
              <select
                value={filtros.marca}
                onChange={(e) => aplicarFiltro('marca', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.marca 
                    ? 'bg-gray-700 text-white border-gray-700' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Marca ▾</option>
                {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* Tipo de Vehículo */}
              <select
                value={filtros.tipo}
                onChange={(e) => aplicarFiltro('tipo', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.tipo 
                    ? 'bg-cyan-600 text-white border-cyan-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Tipo ▾</option>
                {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {/* Proveedor */}
              <select
                value={filtros.proveedor}
                onChange={(e) => aplicarFiltro('proveedor', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.proveedor 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Proveedor ▾</option>
                {proveedoresUnicos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {/* Municipio */}
              <select
                value={filtros.municipio}
                onChange={(e) => aplicarFiltro('municipio', e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                  filtros.municipio 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Municipio ▾</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vehiculos.map((v) => (
                <Link
                  key={v.id}
                  to={`/vehiculos/${v.id}`}
                  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 border-l-4 ${
                    v.clasificacion === 'donado' ? 'border-orange-500' :
                    v.clasificacion === 'determinacion' ? 'border-red-500' :
                    v.clasificacion === 'comodato_externo' ? 'border-blue-500' :
                    'border-dorado-500'
                  }`}
                >
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
                      <h3 className="font-bold text-lg">{v.marca} {v.modelo}</h3>
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
        </div>
      </div>
    </div>
  );
}
