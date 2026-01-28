import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function VehiculoNuevo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [secretarias, setSecretarias] = useState([]);
  const [formData, setFormData] = useState({
    numero_inventario: '',
    placas: '',
    marca: '',
    linea: '',
    modelo: '',
    numero_serie: '',
    numero_motor: '',
    color: '',
    tipo: 'sedan',
    capacidad_pasajeros: 5,
    tipo_combustible: 'gasolina',
    regimen: 'propio',
    secretaria_id: '',
    municipio: '',
    ubicacion: '',
    estado_operativo: 'activo',
    fecha_adquisicion: '',
    valor_adquisicion: '',
    aseguradora: '',
    poliza_numero: '',
    poliza_vigencia: '',
    verificacion_vigencia: '',
    resguardatario_nombre: '',
    resguardatario_cargo: '',
    notas: '',
    // Campos de préstamo
    esta_prestado: false,
    prestado_a_secretaria_id: '',
    prestamo_fecha_inicio: '',
    prestamo_fecha_fin_estimada: '',
    prestamo_motivo: ''
  });

  useEffect(() => {
    cargarSecretarias();
  }, []);

  const cargarSecretarias = async () => {
    try {
      const response = await api.get('/secretarias');
      setSecretarias(response.data);
    } catch (error) {
      toast.error('Error al cargar secretarías');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Separar datos del préstamo
      const { esta_prestado, prestado_a_secretaria_id, prestamo_fecha_inicio, prestamo_fecha_fin_estimada, prestamo_motivo, ...vehiculoData } = formData;
      
      // Limpiar campos vacíos
      const datos = Object.fromEntries(
        Object.entries(vehiculoData).filter(([_, v]) => v !== '')
      );

      // Crear el vehículo
      const response = await api.post('/vehiculos', datos);
      const vehiculoId = response.data.vehiculo?.id || response.data.id;
      
      // Si está prestado, crear el registro de préstamo
      if (esta_prestado && prestado_a_secretaria_id && vehiculoId) {
        try {
          await api.post('/movimientos/prestamos', {
            vehiculo_id: vehiculoId,
            secretaria_destino_id: parseInt(prestado_a_secretaria_id),
            fecha_inicio: prestamo_fecha_inicio || new Date().toISOString().split('T')[0],
            fecha_fin_estimada: prestamo_fecha_fin_estimada || null,
            motivo: prestamo_motivo || 'Préstamo inicial al registrar vehículo'
          });
          toast.success('Vehículo creado y préstamo registrado correctamente');
        } catch (prestamoError) {
          console.error('Error al crear préstamo:', prestamoError);
          toast.success('Vehículo creado, pero hubo un error al registrar el préstamo');
        }
      } else {
        toast.success('Vehículo creado correctamente');
      }
      
      navigate('/vehiculos');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear vehículo');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vehiculos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Vehículo</h1>
          <p className="text-gray-500">Registra un nuevo vehículo en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificación */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Identificación</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Inventario *
              </label>
              <input
                type="text"
                name="numero_inventario"
                value={formData.numero_inventario}
                onChange={handleChange}
                className="input-field"
                placeholder="VER-2024-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placas *
              </label>
              <input
                type="text"
                name="placas"
                value={formData.placas}
                onChange={handleChange}
                className="input-field"
                placeholder="ABC-123-A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Serie
              </label>
              <input
                type="text"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                className="input-field"
                placeholder="VIN"
              />
            </div>
          </div>
        </div>

        {/* Características */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Características del Vehículo</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                className="input-field"
                placeholder="Toyota"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Línea *</label>
              <input
                type="text"
                name="linea"
                value={formData.linea}
                onChange={handleChange}
                className="input-field"
                placeholder="Hilux"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo (Año) *</label>
              <input
                type="number"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                className="input-field"
                placeholder="2024"
                min="1990"
                max="2030"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="input-field"
                placeholder="Blanco"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <div className="relative">
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="select-modern"
                  required
                >
                <optgroup label="🚗 Vehículos Terrestres">
                  <option value="sedan">Sedán</option>
                  <option value="suv">SUV</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="pick_up">Pick-up</option>
                  <option value="van">Van / Minivan</option>
                  <option value="autobus">Autobús</option>
                  <option value="motocicleta">Motocicleta</option>
                  <option value="cuatrimoto">Cuatrimoto</option>
                </optgroup>
                <optgroup label="🚑 Vehículos de Emergencia">
                  <option value="ambulancia">Ambulancia</option>
                  <option value="patrulla">Patrulla</option>
                  <option value="bomberos">Camión de Bomberos</option>
                  <option value="rescate">Vehículo de Rescate</option>
                  <option value="grua">Grúa</option>
                </optgroup>
                <optgroup label="🚜 Maquinaria y Carga">
                  <option value="camion_carga">Camión de Carga</option>
                  <option value="tractocamion">Tractocamión</option>
                  <option value="volteo">Volteo</option>
                  <option value="pipa">Pipa</option>
                  <option value="tractor">Tractor</option>
                  <option value="excavadora">Excavadora</option>
                  <option value="retroexcavadora">Retroexcavadora</option>
                  <option value="cargador_frontal">Cargador Frontal</option>
                  <option value="compactadora">Compactadora</option>
                  <option value="motoconformadora">Motoconformadora</option>
                  <option value="montacargas">Montacargas</option>
                  <option value="maquinaria">Otra Maquinaria</option>
                </optgroup>
                <optgroup label="🚤 Embarcaciones">
                  <option value="lancha">Lancha</option>
                  <option value="yate">Yate</option>
                  <option value="remolcador">Remolcador</option>
                  <option value="barcaza">Barcaza</option>
                  <option value="embarcacion">Otra Embarcación</option>
                </optgroup>
                <optgroup label="✈️ Aeronaves">
                  <option value="avion">Avión</option>
                  <option value="helicoptero">Helicóptero</option>
                  <option value="avioneta">Avioneta</option>
                  <option value="dron">Dron</option>
                </optgroup>
                <optgroup label="📋 Otros">
                  <option value="remolque">Remolque</option>
                  <option value="carreta">Carreta</option>
                  <option value="otro">Otro</option>
                </optgroup>
              </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input
                type="number"
                name="capacidad_pasajeros"
                value={formData.capacidad_pasajeros}
                onChange={handleChange}
                className="input-field"
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Combustible</label>
              <div className="relative">
                <select
                  name="tipo_combustible"
                  value={formData.tipo_combustible}
                  onChange={handleChange}
                  className="select-modern"
                >
                  <option value="gasolina">⛽ Gasolina</option>
                  <option value="diesel">🛢️ Diésel</option>
                  <option value="electrico">🔋 Eléctrico</option>
                  <option value="hibrido">🔌 Híbrido</option>
                  <option value="gas">💨 Gas LP</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Motor</label>
              <input
                type="text"
                name="numero_motor"
                value={formData.numero_motor}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Asignación */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Asignación y Ubicación</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secretaría *</label>
              <div className="relative">
                <select
                  name="secretaria_id"
                  value={formData.secretaria_id}
                  onChange={handleChange}
                  className="select-modern"
                  required
                >
                  <option value="">🏛️ Seleccionar secretaría...</option>
                  {secretarias.map(s => (
                    <option key={s.id} value={s.id}>🏢 {s.siglas} - {s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Régimen *</label>
              <div className="relative">
                <select
                  name="regimen"
                  value={formData.regimen}
                  onChange={handleChange}
                  className="select-modern"
                  required
                >
                  <option value="propio">📋 Propio</option>
                  <option value="rentado">💳 Rentado</option>
                  <option value="comodato">🤝 Comodato</option>
                  <option value="asignado_federal">🏛️ Asignado Federal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                className="input-field"
                placeholder="Xalapa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                className="input-field"
                placeholder="Palacio de Gobierno"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado Operativo *</label>
              <div className="relative">
                <select
                  name="estado_operativo"
                  value={formData.estado_operativo}
                  onChange={handleChange}
                  className="select-modern"
                  required
                >
                  <option value="activo">✅ Activo</option>
                  <option value="en_reparacion">🔧 En Reparación</option>
                  <option value="siniestrado">💥 Siniestrado</option>
                  <option value="baja">❌ Baja</option>
                  <option value="ocioso">💤 Ocioso</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resguardatario */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Resguardatario</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                name="resguardatario_nombre"
                value={formData.resguardatario_nombre}
                onChange={handleChange}
                className="input-field"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input
                type="text"
                name="resguardatario_cargo"
                value={formData.resguardatario_cargo}
                onChange={handleChange}
                className="input-field"
                placeholder="Director de..."
              />
            </div>
          </div>
        </div>

        {/* Préstamo a otra Secretaría */}
        <div className="card border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="esta_prestado"
              checked={formData.esta_prestado}
              onChange={(e) => setFormData(prev => ({ ...prev, esta_prestado: e.target.checked }))}
              className="h-5 w-5 text-amber-600 rounded focus:ring-amber-500"
            />
            <label htmlFor="esta_prestado" className="font-semibold text-gray-900 cursor-pointer">
              🔄 Este vehículo está prestado a otra Secretaría
            </label>
          </div>
          
          {formData.esta_prestado && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-amber-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secretaría que lo tiene *
                </label>
                <div className="relative">
                  <select
                    name="prestado_a_secretaria_id"
                    value={formData.prestado_a_secretaria_id}
                    onChange={handleChange}
                    className="select-modern border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                    required={formData.esta_prestado}
                  >
                    <option value="">🏛️ Seleccionar secretaría...</option>
                    {secretarias
                      .filter(s => s.id != formData.secretaria_id)
                      .map(s => (
                        <option key={s.id} value={s.id}>🏢 {s.siglas} - {s.nombre}</option>
                      ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La secretaría que actualmente tiene el vehículo
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Préstamo
                </label>
                <input
                  type="date"
                  name="prestamo_fecha_inicio"
                  value={formData.prestamo_fecha_inicio}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del Préstamo
                </label>
                <input
                  type="text"
                  name="prestamo_motivo"
                  value={formData.prestamo_motivo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Apoyo en operativo, evento especial, etc."
                />
              </div>
            </div>
          )}
          
          {!formData.esta_prestado && (
            <p className="text-sm text-gray-500">
              Marca esta opción si el vehículo pertenece a una secretaría pero actualmente está prestado a otra.
              El préstamo se registrará automáticamente en el sistema.
            </p>
          )}
        </div>

        {/* Información adicional */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Información Adicional</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Adquisición</label>
              <input
                type="date"
                name="fecha_adquisicion"
                value={formData.fecha_adquisicion}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Adquisición</label>
              <input
                type="number"
                name="valor_adquisicion"
                value={formData.valor_adquisicion}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aseguradora</label>
              <input
                type="text"
                name="aseguradora"
                value={formData.aseguradora}
                onChange={handleChange}
                className="input-field"
                placeholder="Nombre de aseguradora"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Póliza</label>
              <input
                type="text"
                name="poliza_numero"
                value={formData.poliza_numero}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia Póliza</label>
              <input
                type="date"
                name="poliza_vigencia"
                value={formData.poliza_vigencia}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia Verificación</label>
              <input
                type="date"
                name="verificacion_vigencia"
                value={formData.verificacion_vigencia}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              className="input-field"
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/vehiculos')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Guardando...' : 'Crear Vehículo'}
          </button>
        </div>
      </form>
    </div>
  );
}
