import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function SecretariasLista() {
  const [loading, setLoading] = useState(true);
  const [secretarias, setSecretarias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [secretariaEditar, setSecretariaEditar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    siglas: '',
    titular: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/secretarias');
      setSecretarias(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error cargando secretarias:', error);
      toast.error('Error al cargar secretarias');
    }
    setLoading(false);
  };

  const abrirModalNuevo = () => {
    setSecretariaEditar(null);
    setFormData({
      nombre: '',
      siglas: '',
      titular: '',
      direccion: '',
      telefono: '',
      email: ''
    });
    setShowModal(true);
  };

  const abrirModalEditar = (secretaria) => {
    setSecretariaEditar(secretaria);
    setFormData({
      nombre: secretaria.nombre || '',
      siglas: secretaria.siglas || '',
      titular: secretaria.titular || '',
      direccion: secretaria.direccion || '',
      telefono: secretaria.telefono || '',
      email: secretaria.email || ''
    });
    setShowModal(true);
  };

  const guardarSecretaria = async (e) => {
    e.preventDefault();
    
    try {
      if (secretariaEditar) {
        await api.put(`/secretarias/${secretariaEditar.id}`, formData);
        toast.success('Secretaria actualizada');
      } else {
        await api.post('/secretarias', formData);
        toast.success('Secretaria creada');
      }
      setShowModal(false);
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const getRolBadge = (activa) => {
    return activa ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Activa
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        Inactiva
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Secretarias</h1>
          <p className="text-gray-600 text-sm sm:text-base">Administracion de dependencias gubernamentales</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Secretaria
        </button>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="block sm:hidden space-y-4">
        {secretarias.map((secretaria) => (
          <div key={secretaria.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{secretaria.nombre}</p>
                  <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 rounded">{secretaria.siglas}</span>
                </div>
              </div>
              {getRolBadge(secretaria.activa)}
            </div>
            
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Titular:</span>
                <span className="text-gray-700">{secretaria.titular || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-700 truncate max-w-[180px]">{secretaria.email || '-'}</span>
              </div>
              {secretaria.telefono && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="text-gray-700">{secretaria.telefono}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <button
                onClick={() => abrirModalEditar(secretaria)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                <PencilIcon className="h-4 w-4" />
                Editar Secretaría
              </button>
            </div>
          </div>
        ))}
        
        {secretarias.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
            No hay secretarias registradas
          </div>
        )}
      </div>

      {/* Tabla - solo desktop */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Secretaria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Siglas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titular
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {secretarias.map((secretaria) => (
              <tr key={secretaria.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{secretaria.nombre}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-bold bg-gray-100 rounded">
                    {secretaria.siglas}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {secretaria.titular || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{secretaria.email || '-'}</div>
                  <div className="text-xs">{secretaria.telefono || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRolBadge(secretaria.activa)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => abrirModalEditar(secretaria)}
                    className="text-green-600 hover:text-green-900"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {secretarias.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay secretarias registradas
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {secretariaEditar ? 'Editar Secretaria' : 'Nueva Secretaria'}
            </h2>
            
            <form onSubmit={guardarSecretaria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Siglas
                </label>
                <input
                  type="text"
                  value={formData.siglas}
                  onChange={(e) => setFormData({...formData, siglas: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titular
                </label>
                <input
                  type="text"
                  value={formData.titular}
                  onChange={(e) => setFormData({...formData, titular: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {secretariaEditar ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
