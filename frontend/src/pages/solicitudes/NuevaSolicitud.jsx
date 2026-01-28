import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  TruckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [enviando, setEnviando] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo_vehiculo: '',
    cantidad_vehiculos: 1,
    motivo: '',
    fecha_inicio: '',
    fecha_fin: '',
    destino: '',
    observaciones_solicitante: '',
    prioridad: 'normal'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.motivo) {
      toast.error('Ingrese el motivo de la solicitud');
      return;
    }
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast.error('Ingrese las fechas del préstamo');
      return;
    }
    if (!formData.tipo_vehiculo) {
      toast.error('Seleccione el tipo de vehículo requerido');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/solicitudes', formData);
      toast.success('Solicitud enviada correctamente');
      navigate('/solicitudes');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar solicitud');
    }
    setEnviando(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Vehículo</h1>
          <p className="text-gray-500">
            Solicitar vehículo a Coordinación General
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de vehículo requerido */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-veracruz-600" />
            Tipo de Vehículo Requerido
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { value: 'sedan', label: 'Sedán' },
              { value: 'camioneta', label: 'Camioneta' },
              { value: 'pickup', label: 'Pick-up' },
              { value: 'van', label: 'Van/Minivan' },
              { value: 'autobus', label: 'Autobús' },
              { value: 'cualquiera', label: 'Cualquiera' },
            ].map((tipo) => (
              <button
                key={tipo.value}
                type="button"
                onClick={() => setFormData({ ...formData, tipo_vehiculo: tipo.value })}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.tipo_vehiculo === tipo.value
                    ? 'border-veracruz-500 bg-veracruz-50 text-veracruz-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">{tipo.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de vehículos
            </label>
            <select
              value={formData.cantidad_vehiculos}
              onChange={(e) => setFormData({ ...formData, cantidad_vehiculos: parseInt(e.target.value) })}
              className="input-field w-32"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Detalles de la solicitud */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-veracruz-600" />
            Detalles de la Solicitud
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de la solicitud *
              </label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                rows={3}
                placeholder="Describa brevemente el motivo por el cual necesita el vehículo..."
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino / Lugar de uso
              </label>
              <input
                type="text"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                placeholder="Ej: Xalapa, Veracruz Puerto, Coatzacoalcos..."
                className="input-field"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de fin *
                </label>
                <input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  min={formData.fecha_inicio || new Date().toISOString().split('T')[0]}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                className="input-field"
              >
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones adicionales (opcional)
              </label>
              <textarea
                value={formData.observaciones_solicitante}
                onChange={(e) => setFormData({ ...formData, observaciones_solicitante: e.target.value })}
                rows={2}
                placeholder="Información adicional que considere relevante..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Resumen y envío */}
        <div className="card bg-gradient-to-r from-veracruz-50 to-blue-50 border-veracruz-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-700">
                Solicitante: <strong>{user?.secretaria_siglas || user?.nombre}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                La solicitud será revisada por Coordinación General de Gobernación
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || !formData.tipo_vehiculo}
                className="px-6 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
