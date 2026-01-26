import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  EyeIcon, 
  BuildingOfficeIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function PrestamosLista() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [vehiculoDevolver, setVehiculoDevolver] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [vistaActual, setVistaActual] = useState('municipios'); // 'municipios' o 'secretarias'

  const esAdmin = ['admin', 'gobernacion'].includes(user?.rol);

  useEffect(() => {
    cargarPrestamos();
  }, []);

  const cargarPrestamos = async () => {
    try {
      setLoading(true);
      const url = esAdmin 
        ? '/vehiculos?limit=1000&regimen=Comodato&todas=true'
        : '/vehiculos?limit=1000&regimen=Comodato';
      const res = await api.get(url);
      setVehiculos(res.data.vehiculos || res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar prestamos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalDevolver = (vehiculo) => {
    setVehiculoDevolver(vehiculo);
    setObservaciones('');
    setShowDevolverModal(true);
  };

  const ordenarDevolucion = async () => {
    if (!vehiculoDevolver) return;
    try {
      await api.put('/vehiculos/' + vehiculoDevolver.id, {
        regimen: 'Propio',
        municipio: null,
        ubicacion_fisica: vehiculoDevolver.secretaria_siglas || 'Oficinas centrales'
      });
      toast.success('Orden de devolucion enviada');
      setShowDevolverModal(false);
      cargarPrestamos();
    } catch (error) {
      toast.error('Error al ordenar devolucion');
    }
  };

  const agrupadoPorSecretaria = vehiculos.reduce((acc, v) => {
    const sec = v.secretaria_siglas || v.secretaria_nombre || 'Sin asignar';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(v);
    return acc;
  }, {});

  const agrupadoPorDestino = vehiculos.reduce((acc, v) => {
    const destino = v.municipio || v.ubicacion_fisica || 'Sin especificar';
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(v);
    return acc;
  }, {});

  // Separar: comodato_externo = prestados a otras dependencias/secretarías
  // El resto = prestados a municipios
  const vehiculosADependencias = vehiculos.filter(v => v.clasificacion === 'comodato_externo');
  const vehiculosAMunicipios = vehiculos.filter(v => v.clasificacion !== 'comodato_externo');

  // Agrupar vehículos a dependencias por su destino (municipio o ubicacion_fisica)
  const agrupadoPorDependencia = vehiculosADependencias.reduce((acc, v) => {
    const destino = v.municipio || v.ubicacion_fisica || 'Otra Dependencia';
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(v);
    return acc;
  }, {});

  // Agrupar vehículos a municipios
  const agrupadoPorMunicipio = vehiculosAMunicipios.reduce((acc, v) => {
    const destino = v.municipio || v.ubicacion_fisica || 'Sin especificar';
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(v);
    return acc;
  }, {});

  const destinosMunicipios = Object.entries(agrupadoPorMunicipio)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const destinosSecretarias = Object.entries(agrupadoPorDependencia)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const vehiculosMunicipios = vehiculosAMunicipios.length;
  const vehiculosSecretarias = vehiculosADependencias.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-veracruz-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ArrowsRightLeftIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {esAdmin ? 'Gestion de Prestamos - Gobierno' : 'Vehiculos Prestados'}
          </h1>
        </div>
        <p className="text-gray-600">
          {esAdmin 
            ? 'Todos los vehiculos en prestamo o comodato entre dependencias'
            : 'Vehiculos de tu secretaria en prestamo o comodato'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Total en Prestamo</p>
          <p className="text-3xl font-bold text-blue-600">{vehiculos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">{esAdmin ? 'Secretarias' : 'Destinos'}</p>
          <p className="text-3xl font-bold text-purple-600">
            {esAdmin ? Object.keys(agrupadoPorSecretaria).length : Object.keys(agrupadoPorDestino).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Operando</p>
          <p className="text-3xl font-bold text-green-600">
            {vehiculos.filter(v => v.estado_operativo === 'Operando').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Valor Total</p>
          <p className="text-2xl font-bold text-amber-600">
            ${vehiculos.reduce((acc, v) => acc + (v.valor_libros || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Toggle Municipios / Secretarías - Solo para vista de secretarías */}
      {!esAdmin && (
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Agrupar por:</span>
            <button
              onClick={() => setVistaActual('municipios')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                vistaActual === 'municipios'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MapPinIcon className="h-5 w-5" />
              Municipios
              <span className={`text-xs px-2 py-0.5 rounded-full ${vistaActual === 'municipios' ? 'bg-blue-500' : 'bg-gray-200'}`}>
                {vehiculosMunicipios}
              </span>
            </button>
            <button
              onClick={() => setVistaActual('secretarias')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                vistaActual === 'secretarias'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BuildingOfficeIcon className="h-5 w-5" />
              Secretarías
              <span className={`text-xs px-2 py-0.5 rounded-full ${vistaActual === 'secretarias' ? 'bg-purple-500' : 'bg-gray-200'}`}>
                {vehiculosSecretarias}
              </span>
            </button>
          </div>
        </div>
      )}

      {esAdmin && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-blue-800 font-semibold">Panel de Control de Prestamos</h3>
              <p className="text-blue-700 text-sm mt-1">
                Puede ver todos los vehiculos prestados, identificar propietarios y ordenar devoluciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {esAdmin ? (
        Object.entries(agrupadoPorSecretaria)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([secretaria, vehiculosGrupo]) => (
          <div key={secretaria} className="bg-white rounded-xl shadow mb-6">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                  Prestados por: <span className="text-green-700">{secretaria}</span>
                </h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {vehiculosGrupo.length} vehiculos
                </span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Vehiculo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Placas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Propietario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Prestado a</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Valor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehiculosGrupo.map((vehiculo) => (
                    <tr key={vehiculo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehiculo.marca} {vehiculo.modelo}</div>
                        <div className="text-sm text-gray-500">{vehiculo.tipo} - {vehiculo.anio}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold">{vehiculo.placas}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{vehiculo.secretaria_siglas || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">{vehiculo.municipio || vehiculo.ubicacion_fisica || 'No especificado'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehiculo.estado_operativo === 'Operando' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {vehiculo.estado_operativo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">${(vehiculo.valor_libros || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button onClick={() => abrirModalDevolver(vehiculo)} className="text-orange-600 bg-orange-50 px-2 py-1 rounded inline-flex items-center gap-1">
                          <ArrowUturnLeftIcon className="h-4 w-4" />Devolver
                        </button>
                        <Link to={'/vehiculos/' + vehiculo.id} className="text-veracruz-600 inline-flex items-center gap-1">
                          <EyeIcon className="h-4 w-4" />Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        (vistaActual === 'municipios' ? destinosMunicipios : destinosSecretarias).map(([destino, vehiculosGrupo]) => (
          <div key={destino} className="bg-white rounded-xl shadow mb-6">
            <div className={`px-6 py-4 border-b rounded-t-xl ${
              vistaActual === 'municipios' 
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50' 
                : 'bg-gradient-to-r from-purple-50 to-pink-50'
            }`}>
              <div className="flex items-center gap-2">
                {vistaActual === 'municipios' 
                  ? <MapPinIcon className="h-5 w-5 text-blue-600" />
                  : <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                }
                <h2 className="text-lg font-semibold text-gray-800">
                  Prestado a: <span className={vistaActual === 'municipios' ? 'text-blue-700' : 'text-purple-700'}>{destino}</span>
                </h2>
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                  vistaActual === 'municipios' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {vehiculosGrupo.length} vehículo{vehiculosGrupo.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehiculo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehiculosGrupo.map((vehiculo) => (
                    <tr key={vehiculo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{vehiculo.marca} {vehiculo.modelo}</td>
                      <td className="px-6 py-4 font-mono">{vehiculo.placas}</td>
                      <td className="px-6 py-4">{vehiculo.estado_operativo}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={'/vehiculos/' + vehiculo.id} className="text-veracruz-600">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Mensaje cuando no hay vehículos en la vista seleccionada */}
      {!esAdmin && vehiculos.length > 0 && (vistaActual === 'municipios' ? destinosMunicipios : destinosSecretarias).length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          {vistaActual === 'municipios' ? (
            <>
              <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin préstamos a municipios</h3>
              <p className="text-gray-500">No hay vehículos prestados a municipios</p>
            </>
          ) : (
            <>
              <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin préstamos a secretarías</h3>
              <p className="text-gray-500">No hay vehículos prestados a otras secretarías</p>
            </>
          )}
        </div>
      )}

      {vehiculos.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <ArrowsRightLeftIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin vehiculos prestados</h3>
          <p className="text-gray-500">No hay vehiculos en prestamo o comodato</p>
        </div>
      )}

      {showDevolverModal && vehiculoDevolver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Ordenar Devolucion</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium">{vehiculoDevolver.marca} {vehiculoDevolver.modelo}</p>
              <p className="text-sm text-gray-600">Placas: {vehiculoDevolver.placas}</p>
              <p className="text-sm text-gray-600">Prestado a: {vehiculoDevolver.municipio || vehiculoDevolver.ubicacion_fisica}</p>
              <p className="text-sm text-gray-600">Propietario: {vehiculoDevolver.secretaria_siglas}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Motivo..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDevolverModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={ordenarDevolucion} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg">Ordenar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
