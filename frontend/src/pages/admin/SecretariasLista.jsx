import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserPlusIcon,
  TrashIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon
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
  
  // Estados para modal de usuarios
  const [showUsuariosModal, setShowUsuariosModal] = useState(false);
  const [secretariaSeleccionada, setSecretariaSeleccionada] = useState(null);
  const [usuariosSecretaria, setUsuariosSecretaria] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'admin_secretaria'
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

  // Función para abrir modal de usuarios
  const abrirModalUsuarios = async (secretaria) => {
    setSecretariaSeleccionada(secretaria);
    setShowUsuariosModal(true);
    setLoadingUsuarios(true);
    try {
      const res = await api.get(`/usuarios?secretaria_id=${secretaria.id}`);
      setUsuariosSecretaria(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
    }
    setLoadingUsuarios(false);
  };

  // Crear nuevo usuario para la secretaría
  const crearUsuarioSecretaria = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', {
        ...nuevoUsuario,
        secretaria_id: secretariaSeleccionada.id
      });
      toast.success('Usuario creado exitosamente');
      setShowNuevoUsuario(false);
      setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'admin_secretaria' });
      // Recargar usuarios
      abrirModalUsuarios(secretariaSeleccionada);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (usuarioId) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.delete(`/usuarios/${usuarioId}`);
      toast.success('Usuario eliminado');
      abrirModalUsuarios(secretariaSeleccionada);
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  // Obtener badge de rol de usuario
  const getRolUsuarioBadge = (rol) => {
    const roles = {
      'admin': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Super Admin' },
      'admin_secretaria': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Admin' },
      'gobernacion': { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Gobernación' },
      'conductor': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Conductor' },
      'flota': { bg: 'bg-green-100', text: 'text-green-800', label: 'Flota' }
    };
    const r = roles[rol] || { bg: 'bg-gray-100', text: 'text-gray-800', label: rol };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.bg} ${r.text}`}>{r.label}</span>;
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
            
            <div className="mt-4 pt-3 border-t flex gap-2">
              <button
                onClick={() => abrirModalUsuarios(secretaria)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <UsersIcon className="h-4 w-4" />
                Usuarios
              </button>
              <button
                onClick={() => abrirModalEditar(secretaria)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                <PencilIcon className="h-4 w-4" />
                Editar
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Secretaria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titular
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuarios
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {secretarias.map((secretaria) => (
              <tr key={secretaria.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-bold text-sm">{secretaria.siglas?.substring(0,3)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{secretaria.nombre}</div>
                      <div className="text-xs text-gray-500">{secretaria.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{secretaria.titular || '-'}</div>
                  <div className="text-xs text-gray-500">{secretaria.telefono}</div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => abrirModalUsuarios(secretaria)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                  >
                    <UsersIcon className="h-4 w-4" />
                    Ver Usuarios
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => abrirModalUsuarios(secretaria)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Agregar usuario"
                    >
                      <UserPlusIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => abrirModalEditar(secretaria)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Editar secretaría"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
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

      {/* Modal de Usuarios de la Secretaría */}
      {showUsuariosModal && secretariaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del modal */}
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Usuarios de {secretariaSeleccionada.siglas}
                </h2>
                <p className="text-sm text-gray-500">{secretariaSeleccionada.nombre}</p>
              </div>
              <button
                onClick={() => setShowUsuariosModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingUsuarios ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <>
                  {/* Lista de usuarios */}
                  {usuariosSecretaria.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {usuariosSecretaria.map((usuario) => (
                        <div key={usuario.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-700 font-bold text-lg">
                                {usuario.nombre?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{usuario.nombre}</p>
                              <p className="text-sm text-gray-500">{usuario.email}</p>
                              <div className="mt-1">
                                {getRolUsuarioBadge(usuario.rol)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                // Copiar credenciales al portapapeles
                                navigator.clipboard.writeText(usuario.email);
                                toast.success(`Email copiado: ${usuario.email}`);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-xs font-medium"
                              title="Copiar email para login"
                            >
                              <KeyIcon className="h-3.5 w-3.5" />
                              Copiar Email
                            </button>
                            <button
                              onClick={() => eliminarUsuario(usuario.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-medium"
                              title="Eliminar usuario"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <UsersIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="font-medium">No hay usuarios en esta secretaría</p>
                      <p className="text-sm mt-1">Haz clic en "Agregar Usuario" para crear uno</p>
                    </div>
                  )}

                  {/* Formulario nuevo usuario */}
                  {showNuevoUsuario ? (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium text-gray-900 mb-3">Nuevo Usuario</h3>
                      <form onSubmit={crearUsuarioSecretaria} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                              type="text"
                              value={nuevoUsuario.nombre}
                              onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={nuevoUsuario.email}
                              onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input
                              type="password"
                              value={nuevoUsuario.password}
                              onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                              required
                              minLength={6}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                            <select
                              value={nuevoUsuario.rol}
                              onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                              <option value="admin_secretaria">Administrador</option>
                              <option value="conductor">Conductor</option>
                              <option value="flota">Encargado de Flota</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowNuevoUsuario(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Crear Usuario
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNuevoUsuario(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
                    >
                      <UserPlusIcon className="h-5 w-5" />
                      Agregar Usuario
                    </button>
                  )}
                  
                  {/* Nota de contraseña */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>💡 Contraseña por defecto:</strong> Veracruz2024!
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Los usuarios pueden cambiarla después de iniciar sesión.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowUsuariosModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
