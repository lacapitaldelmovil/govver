import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowsRightLeftIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function ComodatosLista() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);

  useEffect(() => {
    cargarComodatos();
  }, []);

  const cargarComodatos = async () => {
    try {
      setLoading(true);
      // Buscar vehículos con régimen Comodato o que tengan DIF-COM en su inventario
      const res = await api.get('/vehiculos?limit=1000&regimen=Comodato');
      // También buscar los que tienen el prefijo DIF-COM
      const resDIF = await api.get('/vehiculos?limit=1000&busqueda=DIF-COM');
      
      // Combinar y eliminar duplicados
      const todos = [...(res.data.vehiculos || []), ...(resDIF.data.vehiculos || [])];
      const unicos = todos.filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i);
      
      setVehiculos(unicos);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar comodatos');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por dependencia destino
  const agrupadoPorDestino = vehiculos.reduce((acc, v) => {
    // Extraer destino del número de inventario si tiene DIF-COM
    let destino = 'Comodato General';
    if (v.numero_inventario?.includes('DIF-COM-')) {
      const partes = v.numero_inventario.split('-');
      if (partes.length >= 3) {
        destino = partes.slice(2).join('-');
      }
    }
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(v);
    return acc;
  }, {});

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
          <ArrowsRightLeftIcon className="h-8 w-8 text-veracruz-600" />
          <h1 className="text-3xl font-bold text-gray-900">Vehículos en Comodato</h1>
        </div>
        <p className="text-gray-600">
          Vehículos prestados o en comodato a otras dependencias
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Total en Comodato</p>
          <p className="text-3xl font-bold text-blue-600">{vehiculos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Dependencias Destino</p>
          <p className="text-3xl font-bold text-purple-600">{Object.keys(agrupadoPorDestino).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Operando</p>
          <p className="text-3xl font-bold text-green-600">
            {vehiculos.filter(v => v.estado_operativo === 'Operando').length}
          </p>
        </div>
      </div>

      {/* Lista por Destino */}
      {Object.entries(agrupadoPorDestino).map(([destino, vehiculosGrupo]) => (
        <div key={destino} className="bg-white rounded-xl shadow mb-6">
          <div className="px-6 py-4 border-b bg-gray-50 rounded-t-xl">
            <h2 className="text-lg font-semibold text-gray-800">
              {destino}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({vehiculosGrupo.length} vehículo{vehiculosGrupo.length !== 1 ? 's' : ''})
              </span>
            </h2>
          </div>
          <div className="divide-y">
            {vehiculosGrupo.map((vehiculo) => (
              <div key={vehiculo.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {vehiculo.marca} {vehiculo.modelo}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehiculo.estado_operativo === 'Operando' ? 'bg-green-100 text-green-800' :
                      vehiculo.estado_operativo === 'En taller' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {vehiculo.estado_operativo}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="mr-4">Placas: <strong>{vehiculo.placas}</strong></span>
                    <span className="mr-4">Año: {vehiculo.anio}</span>
                    <span>Color: {vehiculo.color}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Serie: {vehiculo.numero_serie}
                  </div>
                </div>
                <Link
                  to={`/vehiculos/${vehiculo.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-veracruz-500 text-white rounded-lg hover:bg-veracruz-600 transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ver detalle
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}

      {vehiculos.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <ArrowsRightLeftIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin vehículos en comodato</h3>
          <p className="text-gray-500">No hay vehículos registrados como comodato</p>
        </div>
      )}
    </div>
  );
}
