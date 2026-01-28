import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  UserCircleIcon,
  KeyIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

export default function UsuariosLista() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [secretarias, setSecretarias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellidos: '',
    cargo: '',
    telefono: '',
    rol: 'admin_secretaria',
    secretaria_id: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [usuariosRes, secretariasRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/secretarias')
      ]);
      // Manejar ambos formatos de respuesta
      setUsuarios(usuariosRes.data.data || usuariosRes.data || []);
      setSecretarias(secretariasRes.data.data || secretariasRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar usuarios');
    }
    setLoading(false);
  };

  const abrirModalNuevo = () => {
    setUsuarioEditar(null);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellidos: '',
      cargo: '',
      telefono: '',
      rol: 'admin_secretaria',
      secretaria_id: ''
    });
    setShowModal(true);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditar(usuario);
    setFormData({
      ...usuario,
      password: ''
    });
    setShowModal(true);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    
    try {
      if (usuarioEditar) {
        await api.put(`/usuarios/${usuarioEditar.id}`, formData);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/usuarios', formData);
        toast.success('Usuario creado');
      }
      setShowModal(false);
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const toggleActivo = async (usuario) => {
    try {
      await api.put(`/usuarios/${usuario.id}`, { activo: !usuario.activo });
      toast.success(usuario.activo ? 'Usuario desactivado' : 'Usuario activado');
      cargarDatos();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const resetearPassword = async (usuario) => {
    const nuevaPassword = `Veracruz${new Date().getFullYear()}!`;
    
    if (!confirm(`¿Resetear contraseña de ${usuario.nombre}?\n\nLa nueva contraseña será:\n${nuevaPassword}`)) {
      return;
    }
    
    try {
      await api.put(`/usuarios/${usuario.id}/password`, { password: nuevaPassword });
      toast.success(
        <div>
          <p className="font-bold">Contraseña reseteada</p>
          <p className="text-sm mt-1">Nueva: <span className="font-mono bg-gray-100 px-1 rounded">{nuevaPassword}</span></p>
        </div>,
        { duration: 10000 }
      );
      
      // Copiar al portapapeles
      navigator.clipboard.writeText(nuevaPassword).then(() => {
        toast.success('Contraseña copiada al portapapeles', { duration: 2000 });
      });
    } catch (error) {
      toast.error('Error al resetear contraseña');
    }
  };

  const getRolLabel = (rol) => {
    const labels = {
      'admin': 'Super Administrador',
      'gobernacion': 'Gobernación',
      'admin_secretaria': 'Admin Secretaría',
      'conductor': 'Conductor'
    };
    return labels[rol] || rol;
  };

  const getRolBadge = (rol) => {
    const badges = {
      'admin': 'bg-red-100 text-red-800',
      'gobernacion': 'bg-purple-100 text-purple-800',
      'admin_secretaria': 'bg-blue-100 text-blue-800',
      'conductor': 'bg-gray-100 text-gray-800'
    };
    return badges[rol] || 'badge-gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={abrirModalNuevo} className="btn-primary w-full sm:w-auto justify-center">
          <PlusIcon className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="block sm:hidden space-y-4">
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {usuario.nombre} {usuario.apellidos}
                  </p>
                  <p className="text-sm text-gray-500">{usuario.email}</p>
                </div>
              </div>
              <span className={`badge ${usuario.activo ? 'badge-green' : 'badge-red'}`}>
                {usuario.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Rol:</span>
                <span className={`badge ${getRolBadge(usuario.rol)}`}>
                  {getRolLabel(usuario.rol)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Secretaría:</span>
                <span className="text-gray-700">{usuario.secretaria_siglas || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Último acceso:</span>
                <span className="text-gray-700">
                  {usuario.ultimo_acceso 
                    ? new Date(usuario.ultimo_acceso).toLocaleDateString()
                    : 'Nunca'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button
                onClick={() => resetearPassword(usuario)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"
              >
                <KeyIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => abrirModalEditar(usuario)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <PencilIcon className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => toggleActivo(usuario)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium ${
                  usuario.activo 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {usuario.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de usuarios - solo desktop */}
      <div className="hidden sm:block card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Usuario</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Secretaría</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Último Acceso</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <UserCircleIcon className="h-10 w-10 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {usuario.nombre} {usuario.apellidos}
                        </p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${getRolBadge(usuario.rol)}`}>
                      {getRolLabel(usuario.rol)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {usuario.secretaria_siglas || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${usuario.activo ? 'badge-green' : 'badge-red'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {usuario.ultimo_acceso 
                      ? new Date(usuario.ultimo_acceso).toLocaleDateString()
                      : 'Nunca'
                    }
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => resetearPassword(usuario)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Resetear contraseña"
                      >
                        <KeyIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => toggleActivo(usuario)}
                        className={`px-3 py-1 text-sm rounded-lg ${
                          usuario.activo 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {usuario.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
            </div>
            
            <form onSubmit={guardarUsuario} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos || ''}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                  disabled={usuarioEditar}
                />
              </div>

              {!usuarioEditar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    required={!usuarioEditar}
                    minLength={8}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={formData.cargo || ''}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="conductor">Conductor</option>
                    <option value="admin_secretaria">Admin Secretaría</option>
                    <option value="gobernacion">Gobernación</option>
                    <option value="admin">Super Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secretaría {formData.rol === 'admin_secretaria' && '*'}
                  </label>
                  <select
                    value={formData.secretaria_id || ''}
                    onChange={(e) => setFormData({ ...formData, secretaria_id: e.target.value })}
                    className="input-field"
                    required={formData.rol === 'admin_secretaria'}
                  >
                    <option value="">Sin asignar</option>
                    {secretarias.map((s) => (
                      <option key={s.id} value={s.id}>{s.siglas} - {s.nombre}</option>
                    ))}
                  </select>
                  {formData.rol === 'admin_secretaria' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Admin de secretaría requiere asignar una secretaría
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {usuarioEditar ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
