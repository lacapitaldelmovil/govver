import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function DeterminacionLista() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [propuestosBaja, setPropuestosBaja] = useState([]);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'determinacion', 'dictaminados'

  useEffect(() => {
    cargarDeterminacion();
  }, []);

  const cargarDeterminacion = async () => {
    try {
      setLoading(true);
      // Buscar vehículos con prefijo DIF-DET (Determinación Administrativa)
      const res = await api.get('/vehiculos?limit=1000&busqueda=DIF-DET');
      
      // Buscar vehículos propuestos para baja
      const resPropuestos = await api.get('/vehiculos?limit=1000');
      const propuestos = (resPropuestos.data.vehiculos || []).filter(v => 
        v.propuesto_baja === 1 || v.propuesto_baja === '1' || v.propuesto_baja === true
      );
      
      // Filtrar solo los que tienen DIF-DET en inventario
      const conDET = (res.data.vehiculos || []).filter(v => 
        v.numero_inventario?.includes('DIF-DET')
      );
      
      setVehiculos(conDET);
      setPropuestosBaja(propuestos);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  };

  // Vehículos a mostrar según filtro
  const vehiculosFiltrados = filtro === 'dictaminados' 
    ? propuestosBaja 
    : filtro === 'determinacion' 
      ? vehiculos 
      : [...vehiculos, ...propuestosBaja.filter(p => !vehiculos.find(v => v.id === p.id))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-veracruz-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ExclamationTriangleIcon className="h-8 w-8 text-amber-600" />
          <h1 className="text-3xl font-bold text-gray-900">Determinación Administrativa</h1>
        </div>
        <p className="text-gray-600">
          Vehículos pendientes de baja ante Secretaría de Hacienda
        </p>
      </div>

      {/* Alerta informativa */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-amber-800 font-semibold">Proceso de Baja</h3>
            <p className="text-amber-700 text-sm mt-1">
              Estos vehículos requieren trámite de baja ante la Secretaría de Hacienda. 
              Están fuera de operación y pendientes de resolución administrativa.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Clickeables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setFiltro('determinacion')}
          className={`rounded-xl shadow p-6 text-left transition-all ${
            filtro === 'determinacion'
              ? 'bg-amber-600 text-white ring-4 ring-amber-300 scale-105'
              : 'bg-white hover:bg-amber-50'
          }`}
        >
          <p className={`text-sm ${filtro === 'determinacion' ? 'text-amber-100' : 'text-gray-600'}`}>Total Determinación</p>
          <p className={`text-3xl font-bold ${filtro === 'determinacion' ? 'text-white' : 'text-amber-600'}`}>{vehiculos.length}</p>
        </button>
        
        <button
          onClick={() => setFiltro('dictaminados')}
          className={`rounded-xl shadow p-6 text-left transition-all ${
            filtro === 'dictaminados'
              ? 'bg-red-600 text-white ring-4 ring-red-300 scale-105'
              : 'bg-white hover:bg-red-50 border-2 border-red-200'
          }`}
        >
          <p className={`text-sm ${filtro === 'dictaminados' ? 'text-red-100' : 'text-gray-600'}`}>Dictaminados Baja</p>
          <p className={`text-3xl font-bold ${filtro === 'dictaminados' ? 'text-white' : 'text-red-600'}`}>{propuestosBaja.length}</p>
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Valor en Libros</p>
          <p className="text-2xl font-bold text-gray-700">
            ${vehiculos.reduce((acc, v) => acc + (v.valor_libros || 0), 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Antigüedad Promedio</p>
          <p className="text-3xl font-bold text-blue-600">
            {Math.round(vehiculos.reduce((acc, v) => acc + (2026 - (v.anio || 2020)), 0) / (vehiculos.length || 1))} años
          </p>
        </div>
      </div>

      {/* Indicador de filtro activo */}
      {filtro !== 'todos' && (
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            filtro === 'determinacion' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
          }`}>
            Mostrando: {filtro === 'determinacion' ? 'Determinación Administrativa' : 'Dictaminados para Baja'}
          </span>
          <button 
            onClick={() => setFiltro('todos')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* Tabla Única de Vehículos */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className={`px-6 py-4 border-b ${
          filtro === 'dictaminados' ? 'bg-red-50' : filtro === 'determinacion' ? 'bg-amber-50' : 'bg-gray-50'
        }`}>
          <h2 className={`text-lg font-semibold ${
            filtro === 'dictaminados' ? 'text-red-800' : filtro === 'determinacion' ? 'text-amber-800' : 'text-gray-800'
          }`}>
            {filtro === 'dictaminados' 
              ? `Vehículos Dictaminados para Baja (${vehiculosFiltrados.length})`
              : filtro === 'determinacion'
                ? `Vehículos en Determinación (${vehiculosFiltrados.length})`
                : `Todos los Vehículos (${vehiculosFiltrados.length})`
            }
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehiculosFiltrados.map((vehiculo) => (
                <tr key={vehiculo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{vehiculo.marca} {vehiculo.modelo}</div>
                    <div className="text-xs text-gray-500">{vehiculo.numero_inventario}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{vehiculo.placas}</td>
                  <td className="px-6 py-4 text-sm">{vehiculo.anio}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehiculo.propuesto_baja ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {vehiculo.propuesto_baja ? 'Dictaminado' : 'Determinación'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{vehiculo.tipo}</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/vehiculos/${vehiculo.id}`}
                      className="text-veracruz-600 hover:text-veracruz-800 inline-flex items-center gap-1"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {vehiculosFiltrados.length === 0 && (
          <div className="p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay vehículos en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
