import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Función para obtener emoji según tipo de vehículo
const getVehicleEmoji = (vehiculo) => {
  const texto = `${vehiculo.marca || ''} ${vehiculo.modelo || ''} ${vehiculo.tipo || ''} ${vehiculo.descripcion || ''}`.toLowerCase();
  if (texto.includes('ambulan') || texto.includes('emergencia')) return '🚑';
  if (texto.includes('urvan') || texto.includes('promaster') || texto.includes('express') || texto.includes('van')) return '🚐';
  if (texto.includes('pickup') || texto.includes('pick up') || texto.includes('pick-up') || texto.includes('np300') || texto.includes('frontier') || texto.includes('hilux')) return '🛻';
  if (texto.includes('suburban') || texto.includes('tahoe') || texto.includes('explorer') || texto.includes('suv')) return '🚙';
  if (texto.includes('moto')) return '🏍️';
  if (texto.includes('autobus') || texto.includes('bus') || texto.includes('camion')) return '🚌';
  if (texto.includes('sentra') || texto.includes('tsuru') || texto.includes('versa') || texto.includes('sedan')) return '🚗';
  return '🚗';
};

export default function DashboardSecretaria() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSeguro, setFiltroSeguro] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const vehiculosPorPagina = 10;

  // Leer parámetro de proveedor de la URL al cargar
  useEffect(() => {
    const proveedorParam = searchParams.get('proveedor');
    if (proveedorParam) {
      setFiltroProveedor(proveedorParam);
    }
  }, [searchParams]);

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehiculos');
      setVehiculos(response.data.vehiculos || response.data || []);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas de estado
  // Los propuestos para baja se excluyen de los otros contadores para evitar duplicados
  const propuestosBaja = vehiculos.filter(v => v.propuesto_baja === 1 || v.propuesto_baja === true);
  const noPropuestos = vehiculos.filter(v => v.propuesto_baja !== 1 && v.propuesto_baja !== true);
  
  // Pendientes ante SAT/Hacienda (tienen DIF-DET en número de inventario)
  const pendientesSAT = vehiculos.filter(v => v.numero_inventario?.includes('DIF-DET'));
  
  const estadisticas = {
    total: vehiculos.length,
    operando: noPropuestos.filter(v => v.estado_operativo?.toLowerCase().includes('operando')).length,
    disponible: noPropuestos.filter(v => v.estado_operativo?.toLowerCase().includes('disponible')).length,
    taller: noPropuestos.filter(v => v.estado_operativo?.toLowerCase().includes('taller')).length,
    malEstado: noPropuestos.filter(v => v.estado_operativo?.toLowerCase().includes('mal estado')).length,
    baja: noPropuestos.filter(v => v.estado_operativo?.toLowerCase().includes('baja')).length,
    propuestosBaja: propuestosBaja.length,
    pendientesSAT: pendientesSAT.length,
  };

  // Calcular estadísticas de seguro
  const hoy = new Date();
  const en30Dias = new Date();
  en30Dias.setDate(hoy.getDate() + 30);

  // Mapeo de meses en español
  const mesesES = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const clean = dateStr.toString().trim();
    
    // Formato DD/MM/YYYY
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    
    // Formato ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return new Date(clean);
    }
    
    // Formato español: "31 DE AGOSTO 2026" o "31 DE AGOSTO DE 2026"
    const matchES = clean.match(/^(\d{1,2})\s+DE\s+(\w+)\s+(?:DE\s+)?(\d{4})$/i);
    if (matchES) {
      const dia = parseInt(matchES[1]);
      const mesNombre = matchES[2].toLowerCase();
      const anio = parseInt(matchES[3]);
      const mes = mesesES[mesNombre];
      if (mes !== undefined) {
        return new Date(anio, mes, dia);
      }
    }
    
    const date = new Date(clean);
    return isNaN(date.getTime()) ? null : date;
  };

  const categorizarSeguro = (v) => {
    if (!v.vigencia_seguro || v.vigencia_seguro === 'N/A' || v.vigencia_seguro === 'NO APLICA' || v.vigencia_seguro === 'SIN DATO') {
      return 'noAplica';
    }
    const fechaVigencia = parseDate(v.vigencia_seguro);
    if (!fechaVigencia) return 'noAplica';
    if (fechaVigencia < hoy) return 'vencido';
    if (fechaVigencia <= en30Dias) return 'porVencer';
    return 'vigente';
  };

  const seguros = {
    vencidos: vehiculos.filter(v => categorizarSeguro(v) === 'vencido').length,
    porVencer: vehiculos.filter(v => categorizarSeguro(v) === 'porVencer').length,
    vigentes: vehiculos.filter(v => categorizarSeguro(v) === 'vigente').length,
    noAplica: vehiculos.filter(v => categorizarSeguro(v) === 'noAplica').length,
  };

  // Obtener proveedores únicos
  const proveedoresUnicos = [...new Set(vehiculos.map(v => v.proveedor_arrendadora).filter(Boolean))].sort();

  // Filtrar vehículos
  const vehiculosFiltrados = vehiculos.filter(v => {
    const matchBusqueda = !busqueda || 
      v.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.placas?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.numero_economico?.toLowerCase().includes(busqueda.toLowerCase());

    // Manejar filtros especiales
    let matchEstado = true;
    if (filtroEstado === 'propuesto_baja') {
      matchEstado = v.propuesto_baja === 1 || v.propuesto_baja === true;
    } else if (filtroEstado === 'pendiente_sat') {
      matchEstado = v.numero_inventario?.includes('DIF-DET');
    } else if (filtroEstado) {
      matchEstado = v.estado_operativo?.toLowerCase().includes(filtroEstado.toLowerCase());
    }

    let matchSeguro = true;
    if (filtroSeguro) {
      const categoria = categorizarSeguro(v);
      matchSeguro = categoria === filtroSeguro;
    }

    // Filtro por proveedor
    const matchProveedor = !filtroProveedor || v.proveedor_arrendadora === filtroProveedor;

    return matchBusqueda && matchEstado && matchSeguro && matchProveedor;
  });

  // Paginación
  const totalPaginas = Math.ceil(vehiculosFiltrados.length / vehiculosPorPagina);
  const vehiculosPaginados = vehiculosFiltrados.slice(
    (paginaActual - 1) * vehiculosPorPagina,
    paginaActual * vehiculosPorPagina
  );

  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltroSeguro('');
    setFiltroProveedor('');
    setBusqueda('');
    setPaginaActual(1);
  };

  const aplicarFiltroEstado = (estado) => {
    setFiltroEstado(prev => prev === estado ? '' : estado);
    setFiltroSeguro('');
    setPaginaActual(1);
  };

  const aplicarFiltroSeguro = (tipo) => {
    setFiltroSeguro(prev => prev === tipo ? '' : tipo);
    setFiltroEstado('');
    setPaginaActual(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Cards de Estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <button
          onClick={() => aplicarFiltroEstado('')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === '' && !filtroSeguro
              ? 'bg-gray-800 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
          }`}
        >
          <div className="text-3xl font-bold">{estadisticas.total}</div>
          <div className="text-sm">Total</div>
        </button>

        <button
          onClick={() => aplicarFiltroEstado('operando')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'operando'
              ? 'bg-green-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-green-50 shadow'
          }`}
        >
          <div className="text-3xl font-bold">{estadisticas.operando}</div>
          <div className="text-sm">Operando</div>
        </button>

        <button
          onClick={() => aplicarFiltroEstado('disponible')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'disponible'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-blue-50 shadow'
          }`}
        >
          <div className="text-3xl font-bold">{estadisticas.disponible}</div>
          <div className="text-sm">Disponible</div>
        </button>

        <button
          onClick={() => aplicarFiltroEstado('taller')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'taller'
              ? 'bg-yellow-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-yellow-50 shadow'
          }`}
        >
          <div className="text-3xl font-bold">{estadisticas.taller}</div>
          <div className="text-sm">Taller</div>
        </button>

        <button
          onClick={() => aplicarFiltroEstado('mal estado')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'mal estado'
              ? 'bg-orange-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-orange-50 shadow'
          }`}
        >
          <div className="text-3xl font-bold">{estadisticas.malEstado}</div>
          <div className="text-sm">Mal Estado</div>
        </button>

        <button
          onClick={() => aplicarFiltroEstado('baja')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'baja'
              ? 'bg-red-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-red-50 shadow'
          }`}
        >
          <div className="text-3xl font-bold">{estadisticas.baja}</div>
          <div className="text-sm">Baja</div>
          {estadisticas.pendientesSAT > 0 && (
            <div className="text-xs text-amber-600 font-medium mt-1">({estadisticas.pendientesSAT} pend. Hacienda)</div>
          )}
        </button>

        <button
          onClick={() => aplicarFiltroEstado('propuesto_baja')}
          className={`p-4 rounded-xl text-center transition-all ${
            filtroEstado === 'propuesto_baja'
              ? 'bg-purple-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-purple-50 shadow'
          }`}
        >
          <div className="text-3xl font-bold">{estadisticas.propuestosBaja}</div>
          <div className="text-sm">Dict. Baja</div>
        </button>
      </div>

      {/* Filtros Especiales: Dictaminados Baja y Seguro */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => aplicarFiltroSeguro('vencido')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            filtroSeguro === 'vencido'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          Vencidos ({seguros.vencidos})
        </button>

        <button
          onClick={() => aplicarFiltroSeguro('porVencer')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            filtroSeguro === 'porVencer'
              ? 'bg-yellow-600 text-white shadow-lg'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          Por Vencer ({seguros.porVencer})
        </button>

        <button
          onClick={() => aplicarFiltroSeguro('vigente')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            filtroSeguro === 'vigente'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          Vigentes ({seguros.vigentes})
        </button>

        <button
          onClick={() => aplicarFiltroSeguro('noAplica')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            filtroSeguro === 'noAplica'
              ? 'bg-gray-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          No Aplica ({seguros.noAplica})
        </button>
      </div>

      {/* Buscador y Filtros adicionales */}
      <div className="max-w-4xl mx-auto mb-8 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por marca, modelo, placa o número económico..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all shadow-sm"
          />
          <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Filtro por Proveedor */}
        <div className="flex justify-center">
          <select
            value={filtroProveedor}
            onChange={(e) => {
              setFiltroProveedor(e.target.value);
              setPaginaActual(1);
            }}
            className={`px-4 py-2 rounded-full border-2 transition-all cursor-pointer ${
              filtroProveedor
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <option value="">Todos los Proveedores</option>
            {proveedoresUnicos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtro activo indicator */}
      {(filtroEstado || filtroSeguro || filtroProveedor || busqueda) && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-sm text-gray-500">
            Mostrando {vehiculosFiltrados.length} de {vehiculos.length} vehículos
            {filtroProveedor && ` • Proveedor: ${filtroProveedor}`}
          </span>
          <button
            onClick={limpiarFiltros}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Tabla de Vehículos */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vehículo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">No. Económico</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Seguro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehiculosPaginados.map((vehiculo) => (
              <tr
                key={vehiculo.id}
                onClick={() => navigate(`/vehiculos/${vehiculo.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getVehicleEmoji(vehiculo)}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {vehiculo.marca} {vehiculo.modelo}
                      </div>
                      <div className="text-sm text-gray-500">{vehiculo.anio || vehiculo.año || ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{vehiculo.placas || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{vehiculo.numero_economico || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    vehiculo.estado_operativo?.toLowerCase().includes('operando')
                      ? 'bg-green-100 text-green-700'
                      : vehiculo.estado_operativo?.toLowerCase().includes('disponible')
                      ? 'bg-blue-100 text-blue-700'
                      : vehiculo.estado_operativo?.toLowerCase().includes('taller')
                      ? 'bg-yellow-100 text-yellow-700'
                      : vehiculo.estado_operativo?.toLowerCase().includes('mal estado')
                      ? 'bg-orange-100 text-orange-700'
                      : vehiculo.estado_operativo?.toLowerCase().includes('baja')
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {vehiculo.estado_operativo || 'Sin estado'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const cat = categorizarSeguro(vehiculo);
                    if (cat === 'vencido') return <span className="text-red-600 font-medium">Vencido</span>;
                    if (cat === 'porVencer') return <span className="text-yellow-600 font-medium">Por vencer</span>;
                    if (cat === 'vigente') return <span className="text-green-600 font-medium">Vigente</span>;
                    return <span className="text-gray-400">N/A</span>;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vehiculosPaginados.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron vehículos
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
