import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { MapPinIcon, TruckIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

export default function MunicipiosLista() {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState('municipios'); // 'municipios' | 'dependencias'

  useEffect(() => {
    cargarMunicipios();
  }, []);

  const cargarMunicipios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/municipios-stats');
      setDatos(res.data || []);
    } catch (error) {
      console.error('Error cargando municipios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separar municipios de dependencias
  const municipios = datos.filter(d => !d.es_dependencia);
  const dependencias = datos.filter(d => d.es_dependencia);

  // Filtrar por búsqueda según vista activa
  const datosFiltrados = (vistaActiva === 'municipios' ? municipios : dependencias)
    .filter(m => m.municipio?.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => vistaActiva === 'dependencias' 
      ? (b.total || 0) - (a.total || 0) 
      : a.municipio?.localeCompare(b.municipio));

  // Totales
  const totalMunicipios = municipios.reduce((sum, m) => sum + (m.total || 0), 0);
  const totalDependencias = dependencias.reduce((sum, m) => sum + (m.total || 0), 0);

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
      <div className="bg-gradient-to-r from-veracruz-600 to-veracruz-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <MapPinIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Distribución de Vehículos</h1>
        </div>
        <p className="text-veracruz-100">
          Distribución geográfica de la flota vehicular del DIF
        </p>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-3xl font-bold">{municipios.length}</p>
            <p className="text-sm text-veracruz-200">Municipios</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalMunicipios}</p>
            <p className="text-sm text-veracruz-200">Vehículos en municipios</p>
          </div>
          <div className="border-l border-veracruz-400 pl-6">
            <p className="text-3xl font-bold">{dependencias.length}</p>
            <p className="text-sm text-veracruz-200">Dependencias</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalDependencias}</p>
            <p className="text-sm text-veracruz-200">Vehículos en dependencias</p>
          </div>
        </div>
      </div>

      {/* Toggle y Buscador */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Toggle buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaActiva('municipios')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                vistaActiva === 'municipios'
                  ? 'bg-veracruz-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MapPinIcon className="h-5 w-5" />
              Municipios ({municipios.length})
            </button>
            <button
              onClick={() => setVistaActiva('dependencias')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                vistaActiva === 'dependencias'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BuildingOffice2Icon className="h-5 w-5" />
              Dependencias ({dependencias.length})
            </button>
          </div>
          
          {/* Buscador */}
          <input
            type="text"
            placeholder={`Buscar ${vistaActiva === 'municipios' ? 'municipio' : 'dependencia'}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full md:w-96 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
          />
        </div>
      </div>

      {/* Grid de municipios/dependencias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {datosFiltrados.map((mun, idx) => (
          <Link
            key={idx}
            to={`/vehiculos?municipio=${encodeURIComponent(mun.municipio)}`}
            className={`bg-white rounded-xl shadow hover:shadow-lg transition-all p-4 border-l-4 ${
              vistaActiva === 'municipios' 
                ? 'border-veracruz-500 hover:border-veracruz-600' 
                : 'border-amber-500 hover:border-amber-600'
            } group`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-gray-900 text-sm truncate ${
                  vistaActiva === 'municipios' ? 'group-hover:text-veracruz-600' : 'group-hover:text-amber-600'
                }`}>
                  {mun.municipio || 'Sin asignar'}
                </h3>
              </div>
              <div className="ml-2 flex-shrink-0">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  vistaActiva === 'municipios' 
                    ? 'bg-veracruz-100 text-veracruz-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {mun.total}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <TruckIcon className="h-3 w-3" />
              <span>{mun.total} vehículo{mun.total !== 1 ? 's' : ''}</span>
            </div>
            {/* Mini estadísticas */}
            <div className="mt-2 flex gap-2 text-xs flex-wrap">
              {mun.operando > 0 && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                  {mun.operando} op
                </span>
              )}
              {mun.mal_estado > 0 && (
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                  {mun.mal_estado} mal
                </span>
              )}
              {mun.baja > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                  {mun.baja} baja
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {datosFiltrados.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron {vistaActiva === 'municipios' ? 'municipios' : 'dependencias'} con "{busqueda}"
        </div>
      )}
    </div>
  );
}