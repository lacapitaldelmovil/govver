import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  TruckIcon, 
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  FireIcon,
  BoltIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import SelectModerno from '../../components/ui/SelectModerno';
import useAuthStore from '../../store/authStore';

export default function VehiculoNuevo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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

  // Cargar secretarías y preseleccionar la del usuario
  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await api.get('/secretarias');
        setSecretarias(response.data);
        
        // Preseleccionar secretaría del usuario
        if (user?.secretaria_id) {
          setFormData(prev => ({ ...prev, secretaria_id: user.secretaria_id.toString() }));
        }
      } catch (error) {
        toast.error('Error al cargar secretarías');
      }
    };
    cargar();
  }, [user]);

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
      
      // Mapear campos del frontend a los nombres del backend
      const datosBackend = {
        numero_inventario: vehiculoData.numero_inventario,
        placas: vehiculoData.placas,
        marca: vehiculoData.marca,
        modelo: vehiculoData.linea, // línea/modelo del vehículo
        anio: vehiculoData.modelo, // año
        numero_serie: vehiculoData.numero_serie,
        numero_motor: vehiculoData.numero_motor,
        color: vehiculoData.color,
        tipo: vehiculoData.tipo,
        capacidad_pasajeros: vehiculoData.capacidad_pasajeros,
        tipo_combustible: vehiculoData.tipo_combustible,
        regimen: vehiculoData.regimen,
        secretaria_id: vehiculoData.secretaria_id ? parseInt(vehiculoData.secretaria_id) : null,
        municipio: vehiculoData.municipio,
        ubicacion_fisica: vehiculoData.ubicacion,
        estado_operativo: vehiculoData.estado_operativo,
        fecha_adquisicion: vehiculoData.fecha_adquisicion || null,
        valor_libros: vehiculoData.valor_adquisicion || null,
        seguro: vehiculoData.aseguradora,
        poliza_seguro: vehiculoData.poliza_numero,
        vigencia_seguro: vehiculoData.poliza_vigencia || null,
        resguardante_nombre: vehiculoData.resguardatario_nombre,
        resguardante_cargo: vehiculoData.resguardatario_cargo,
        observaciones: vehiculoData.notas
      };
      
      // Limpiar campos vacíos
      const datos = Object.fromEntries(
        Object.entries(datosBackend).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );

      console.log('Enviando datos:', datos);

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
      console.error('Error completo:', error);
      console.error('Response:', error.response);
      console.error('Data:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error al crear vehículo';
      toast.error(errorMsg);
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
              <SelectModerno
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                icon={TruckIcon}
                required
                groupedOptions={[
                  {
                    label: 'Vehículos Terrestres',
                    options: [
                      { value: 'sedan', label: 'Sedán', icon: TruckIcon },
                      { value: 'suv', label: 'SUV', icon: TruckIcon },
                      { value: 'camioneta', label: 'Camioneta', icon: TruckIcon },
                      { value: 'pick_up', label: 'Pick-up', icon: TruckIcon },
                      { value: 'van', label: 'Van / Minivan', icon: TruckIcon },
                      { value: 'autobus', label: 'Autobús', icon: TruckIcon },
                      { value: 'motocicleta', label: 'Motocicleta', icon: TruckIcon },
                      { value: 'cuatrimoto', label: 'Cuatrimoto', icon: TruckIcon },
                    ]
                  },
                  {
                    label: 'Vehículos de Emergencia',
                    options: [
                      { value: 'ambulancia', label: 'Ambulancia', icon: ExclamationTriangleIcon },
                      { value: 'patrulla', label: 'Patrulla', icon: ExclamationTriangleIcon },
                      { value: 'bomberos', label: 'Camión de Bomberos', icon: FireIcon },
                      { value: 'rescate', label: 'Vehículo de Rescate', icon: ExclamationTriangleIcon },
                      { value: 'grua', label: 'Grúa', icon: WrenchScrewdriverIcon },
                    ]
                  },
                  {
                    label: 'Maquinaria y Carga',
                    options: [
                      { value: 'camion_carga', label: 'Camión de Carga', icon: TruckIcon },
                      { value: 'tractocamion', label: 'Tractocamión', icon: TruckIcon },
                      { value: 'volteo', label: 'Volteo', icon: TruckIcon },
                      { value: 'pipa', label: 'Pipa', icon: TruckIcon },
                      { value: 'tractor', label: 'Tractor', icon: WrenchScrewdriverIcon },
                      { value: 'excavadora', label: 'Excavadora', icon: WrenchScrewdriverIcon },
                      { value: 'retroexcavadora', label: 'Retroexcavadora', icon: WrenchScrewdriverIcon },
                      { value: 'cargador_frontal', label: 'Cargador Frontal', icon: WrenchScrewdriverIcon },
                      { value: 'compactadora', label: 'Compactadora', icon: WrenchScrewdriverIcon },
                      { value: 'motoconformadora', label: 'Motoconformadora', icon: WrenchScrewdriverIcon },
                      { value: 'montacargas', label: 'Montacargas', icon: WrenchScrewdriverIcon },
                      { value: 'maquinaria', label: 'Otra Maquinaria', icon: WrenchScrewdriverIcon },
                    ]
                  },
                  {
                    label: 'Embarcaciones',
                    options: [
                      { value: 'lancha', label: 'Lancha', icon: TruckIcon },
                      { value: 'yate', label: 'Yate', icon: TruckIcon },
                      { value: 'remolcador', label: 'Remolcador', icon: TruckIcon },
                      { value: 'barcaza', label: 'Barcaza', icon: TruckIcon },
                      { value: 'embarcacion', label: 'Otra Embarcación', icon: TruckIcon },
                    ]
                  },
                  {
                    label: 'Aeronaves',
                    options: [
                      { value: 'avion', label: 'Avión', icon: TruckIcon },
                      { value: 'helicoptero', label: 'Helicóptero', icon: TruckIcon },
                      { value: 'avioneta', label: 'Avioneta', icon: TruckIcon },
                      { value: 'dron', label: 'Dron', icon: TruckIcon },
                    ]
                  },
                  {
                    label: 'Otros',
                    options: [
                      { value: 'remolque', label: 'Remolque', icon: TruckIcon },
                      { value: 'carreta', label: 'Carreta', icon: TruckIcon },
                      { value: 'otro', label: 'Otro', icon: DocumentTextIcon },
                    ]
                  }
                ]}
              />
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
              <SelectModerno
                name="tipo_combustible"
                value={formData.tipo_combustible}
                onChange={handleChange}
                icon={FireIcon}
                options={[
                  { value: 'gasolina', label: 'Gasolina', icon: FireIcon },
                  { value: 'diesel', label: 'Diésel', icon: FireIcon },
                  { value: 'electrico', label: 'Eléctrico', icon: BoltIcon },
                  { value: 'hibrido', label: 'Híbrido', icon: BoltIcon },
                  { value: 'gas', label: 'Gas LP', icon: FireIcon },
                ]}
              />
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
              {/* Solo admin/gobernacion pueden cambiar secretaría, otros usuarios la tienen fija */}
              {(user?.rol === 'admin' || user?.rol === 'gobernacion') ? (
                <SelectModerno
                  name="secretaria_id"
                  value={formData.secretaria_id}
                  onChange={handleChange}
                  icon={BuildingOfficeIcon}
                  placeholder="Seleccionar secretaría..."
                  required
                  options={secretarias.map(s => ({
                    value: s.id.toString(),
                    label: `${s.siglas} - ${s.nombre}`,
                    icon: BuildingOfficeIcon
                  }))}
                />
              ) : (
                <div className="input bg-gray-100 cursor-not-allowed flex items-center gap-2 text-gray-700">
                  <BuildingOfficeIcon className="h-5 w-5 text-veracruz-600" />
                  {secretarias.length > 0 && formData.secretaria_id ? (
                    <span className="font-medium">
                      {secretarias.find(s => s.id.toString() === formData.secretaria_id)?.siglas} - {secretarias.find(s => s.id.toString() === formData.secretaria_id)?.nombre}
                    </span>
                  ) : (
                    <span className="text-gray-400">Cargando secretaría...</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Régimen *</label>
              <SelectModerno
                name="regimen"
                value={formData.regimen}
                onChange={handleChange}
                icon={DocumentTextIcon}
                required
                options={[
                  { value: 'propio', label: 'Propio', icon: CheckCircleIcon },
                  { value: 'rentado', label: 'Rentado', icon: CurrencyDollarIcon },
                  { value: 'comodato', label: 'Comodato', icon: DocumentTextIcon },
                  { value: 'asignado_federal', label: 'Asignado Federal', icon: BuildingOfficeIcon },
                ]}
              />
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
              <SelectModerno
                name="estado_operativo"
                value={formData.estado_operativo}
                onChange={handleChange}
                icon={CheckCircleIcon}
                required
                options={[
                  { value: 'activo', label: 'Activo', icon: CheckCircleIcon },
                  { value: 'propuesto', label: 'Propuesto', icon: DocumentPlusIcon },
                  { value: 'en_reparacion', label: 'En Reparación', icon: WrenchScrewdriverIcon },
                  { value: 'siniestrado', label: 'Siniestrado', icon: ExclamationTriangleIcon },
                  { value: 'baja', label: 'Baja', icon: XCircleIcon },
                  { value: 'ocioso', label: 'Ocioso', icon: ClockIcon },
                ]}
              />
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
              Este vehículo está prestado a otra Secretaría
            </label>
          </div>
          
          {formData.esta_prestado && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-amber-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secretaría que lo tiene *
                </label>
                <SelectModerno
                  name="prestado_a_secretaria_id"
                  value={formData.prestado_a_secretaria_id}
                  onChange={handleChange}
                  icon={BuildingOfficeIcon}
                  placeholder="Seleccionar secretaría..."
                  required={formData.esta_prestado}
                  options={secretarias
                    .filter(s => s.id != formData.secretaria_id)
                    .map(s => ({
                      value: s.id.toString(),
                      label: `${s.siglas} - ${s.nombre}`,
                      icon: BuildingOfficeIcon
                    }))}
                />
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
