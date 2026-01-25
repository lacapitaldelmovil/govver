import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { TruckIcon, ArrowRightOnRectangleIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function DashboardConductor() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vehiculoAsignado, setVehiculoAsignado] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState('salida');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Simular vehículo asignado (en producción vendría de la BD)
      const vehiculosRes = await api.get('/vehiculos?limit=1');
      if (vehiculosRes.data.vehiculos?.length > 0) {
        setVehiculoAsignado(vehiculosRes.data.vehiculos[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const registrarMovimiento = async () => {
    if (!vehiculoAsignado) return;
    
    try {
      // Aquí se registraría el movimiento en la BD
      const nuevoRegistro = {
        id: Date.now(),
        tipo: tipoRegistro,
        fecha: new Date().toLocaleString('es-MX'),
        observaciones: observaciones,
        vehiculo: `${vehiculoAsignado.marca} ${vehiculoAsignado.modelo}`
      };
      
      setRegistros([nuevoRegistro, ...registros]);
      setMostrarFormulario(false);
      setObservaciones('');
      toast.success(`${tipoRegistro === 'salida' ? 'Salida' : 'Regreso'} registrado correctamente`);
    } catch (error) {
      toast.error('Error al registrar movimiento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-dorado-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Conductor
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido/a, {user?.nombre}
        </p>
      </div>

      {/* Vehículo Asignado */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Mi Vehículo Asignado</h2>
        
        {vehiculoAsignado ? (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <TruckIcon className="h-16 w-16 text-veracruz-600" />
                </div>
                <h3 className="text-2xl font-bold">{vehiculoAsignado.marca} {vehiculoAsignado.modelo}</h3>
                <p className="text-gray-600">{vehiculoAsignado.anio} - {vehiculoAsignado.color}</p>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Placas:</span>
                <span className="font-bold font-mono">{vehiculoAsignado.placas}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">No. Serie:</span>
                <span className="font-mono text-sm">{vehiculoAsignado.numero_serie}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  vehiculoAsignado.estado_operativo === 'Operando' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {vehiculoAsignado.estado_operativo}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Kilometraje:</span>
                <span className="font-bold">{vehiculoAsignado.kilometraje?.toLocaleString() || 0} km</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="flex justify-center mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400" />
            </div>
            <p>No tienes vehículo asignado actualmente</p>
          </div>
        )}
      </div>

      {/* Botones de Registro */}
      {vehiculoAsignado && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => { setTipoRegistro('salida'); setMostrarFormulario(true); }}
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl p-6 text-center transition-colors"
          >
            <div className="flex justify-center mb-2">
              <ArrowRightOnRectangleIcon className="h-10 w-10" />
            </div>
            <div className="text-xl font-bold">Registrar Salida</div>
          </button>
          <button
            onClick={() => { setTipoRegistro('regreso'); setMostrarFormulario(true); }}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-6 text-center transition-colors"
          >
            <div className="flex justify-center mb-2">
              <HomeIcon className="h-10 w-10" />
            </div>
            <div className="text-xl font-bold">Registrar Regreso</div>
          </button>
        </div>
      )}

      {/* Formulario de Registro */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">
              Registrar {tipoRegistro === 'salida' ? 'Salida' : 'Regreso'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full border rounded-lg p-3 h-24"
                placeholder="Ej: Comisión a Xalapa, reunión de trabajo..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarFormulario(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={registrarMovimiento}
                className={`flex-1 text-white py-3 rounded-lg transition-colors ${
                  tipoRegistro === 'salida' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Confirmar {tipoRegistro === 'salida' ? 'Salida' : 'Regreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Registros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Mis Registros Recientes</h2>
        
        {registros.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay registros recientes</p>
        ) : (
          <div className="space-y-3">
            {registros.map((reg) => (
              <div key={reg.id} className={`p-4 rounded-lg border-l-4 ${
                reg.tipo === 'salida' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold">
                      {reg.tipo === 'salida' ? 'Salida' : 'Regreso'}
                    </span>
                    <span className="text-gray-600 text-sm ml-2">{reg.fecha}</span>
                  </div>
                  <span className="text-sm text-gray-500">{reg.vehiculo}</span>
                </div>
                {reg.observaciones && (
                  <p className="text-gray-600 text-sm mt-2">{reg.observaciones}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
