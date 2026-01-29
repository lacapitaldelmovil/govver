import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, TruckIcon, BuildingOfficeIcon, WrenchScrewdriverIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, DocumentTextIcon,
  CurrencyDollarIcon, FireIcon, BoltIcon, MapPinIcon, UserIcon,
  ShieldCheckIcon, CameraIcon, Cog6ToothIcon, ArchiveBoxIcon,
  DocumentCheckIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import SelectModerno from '../../components/ui/SelectModerno';
import useAuthStore from '../../store/authStore';

export default function VehiculoNuevo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [secretarias, setSecretarias] = useState([]);
  const [formData, setFormData] = useState({
    numero_inventario: '', numero_economico: '', placas: '', numero_serie: '', numero_motor: '',
    marca: '', linea: '', modelo: '', color: '', cilindraje: '', capacidad_pasajeros: 5,
    tipo: 'compactos', tipo_combustible: 'Gasolina',
    secretaria_id: '', asignacion_actual: '', uso: '',
    forma_adquisicion: 'Compra', proveedor_unidad: '', fecha_adquisicion: '',
    valor_contrato: '', cfdi: '', contrato: '', factura_original: '',
    valor_factura: '', valor_mercado: '', valor_libros: '',
    tipo_placas: 'Oficiales', fecha_expedicion_placas: '',
    acta_entrega_recepcion: '', resguardo_vehicular: '',
    tarjeta_circulacion: '', vigencia_tarjeta: '',
    verificacion_vehicular: '', vigencia_verificacion: '',
    comprobante_reemplacamiento: '', pago_derechos: '',
    inventario_patrimonial: '', fecha_alta_inventario: '', bitacora_mantenimiento: '',
    estatus_operativo: 'Operando', estatus_administrativo: 'Activo',
    municipio: '', ubicacion_fisica: '', ubicacion_especifica: '', latitud: '', longitud: '', direccion_completa: '',
    resguardante_nombre: '', resguardante_cargo: '', resguardante_telefono: '', resguardante_email: '',
    seguro: '', aseguradora: '', poliza_seguro: '', vigencia_seguro: '',
    // Mantenimiento general
    ultimo_servicio: '', porcentaje_motor: '', porcentaje_transmision: '', porcentaje_chasis: '',
    kilometraje: '', consumo_combustible: '', costo_mantenimiento_anual: '', proveedor_mantenimiento: '',
    desglose_mantenimiento: '', observaciones_tecnicas: '',
    // Mecánico
    costo_anual_mecanico: '', frecuencia_mecanico: '', desglose_mecanico: '', proveedor_mecanico: '',
    // Eléctrico
    costo_anual_electrico: '', frecuencia_electrico: '', desglose_electrico: '', proveedor_electrico: '',
    // Evidencia
    evidencia_fotografica: '', observaciones: '',
    esta_prestado: false, prestado_a_secretaria_id: '', prestamo_fecha_inicio: '', prestamo_motivo: ''
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await api.get('/secretarias');
        setSecretarias(response.data);
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
      const { esta_prestado, prestado_a_secretaria_id, prestamo_fecha_inicio, prestamo_motivo, ...vehiculoData } = formData;
      const datos = Object.fromEntries(Object.entries(vehiculoData).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
      if (datos.secretaria_id) datos.secretaria_id = parseInt(datos.secretaria_id);
      const response = await api.post('/vehiculos', datos);
      const vehiculoId = response.data.vehiculo?.id || response.data.id;
      if (esta_prestado && prestado_a_secretaria_id && vehiculoId) {
        try {
          await api.post('/movimientos/prestamos', {
            vehiculo_id: vehiculoId,
            secretaria_destino_id: parseInt(prestado_a_secretaria_id),
            fecha_inicio: prestamo_fecha_inicio || new Date().toISOString().split('T')[0],
            motivo: prestamo_motivo || 'Préstamo inicial'
          });
          toast.success('Vehículo creado y préstamo registrado');
        } catch (e) { toast.success('Vehículo creado, error en préstamo'); }
      } else {
        toast.success('Vehículo creado correctamente');
      }
      navigate('/vehiculos');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear vehículo');
    }
    setLoading(false);
  };

  const opcionesTipo = [
    { value: 'subcompactos', label: 'Subcompactos', icon: TruckIcon },
    { value: 'compactos', label: 'Compactos', icon: TruckIcon },
    { value: 'de_lujo', label: 'De lujo', icon: TruckIcon },
    { value: 'deportivos', label: 'Deportivos', icon: TruckIcon },
    { value: 'uso_multiple', label: 'Uso múltiple (SUV/Van)', icon: TruckIcon },
    { value: 'autobuses_integrales', label: 'Autobuses Integrales', icon: TruckIcon },
    { value: 'camiones', label: 'Camiones', icon: TruckIcon },
    { value: 'tractocamiones', label: 'Tractocamiones', icon: TruckIcon },
    { value: 'motocicleta', label: 'Motocicleta', icon: TruckIcon },
    { value: 'maquinaria_pesada', label: 'Maquinaria Pesada', icon: WrenchScrewdriverIcon },
    { value: 'maritimo', label: 'Marítimo', icon: TruckIcon },
    { value: 'aereo', label: 'Aéreo', icon: TruckIcon },
    { value: 'otro', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesCombustible = [
    { value: 'Gasolina', label: 'Gasolina', icon: FireIcon },
    { value: 'Diésel', label: 'Diésel', icon: FireIcon },
    { value: 'Híbrido', label: 'Híbrido', icon: BoltIcon },
    { value: 'Eléctrico', label: 'Eléctrico', icon: BoltIcon },
  ];
  const opcionesAdquisicion = [
    { value: 'Compra', label: 'Compra', icon: CurrencyDollarIcon },
    { value: 'Arrendamiento', label: 'Arrendamiento', icon: DocumentTextIcon },
    { value: 'Comodato', label: 'Comodato', icon: ClockIcon },
    { value: 'Donación', label: 'Donación', icon: CheckCircleIcon },
  ];
  const opcionesUso = [
    { value: 'Notificación de oficios', label: 'Notificación oficios', icon: DocumentTextIcon },
    { value: 'Transporte de personal de confianza', label: 'Personal confianza', icon: UserIcon },
    { value: 'Transporte de personal de base', label: 'Personal base', icon: UserIcon },
    { value: 'Transporte de equipo', label: 'Transporte equipo', icon: TruckIcon },
    { value: 'Transporte de medicamentos', label: 'Medicamentos', icon: ShieldCheckIcon },
    { value: 'Otro', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesPlacas = [
    { value: 'Oficiales', label: 'Oficiales', icon: BuildingOfficeIcon },
    { value: 'Particulares', label: 'Particulares', icon: DocumentTextIcon },
  ];
  const opcionesOperativo = [
    { value: 'Operando', label: 'Operando', icon: CheckCircleIcon },
    { value: 'En mantenimiento', label: 'En mantenimiento', icon: WrenchScrewdriverIcon },
    { value: 'Fuera de servicio', label: 'Fuera de servicio', icon: XCircleIcon },
  ];
  const opcionesAdmin = [
    { value: 'Activo', label: 'Activo', icon: CheckCircleIcon },
    { value: 'En resguardo', label: 'En resguardo', icon: ArchiveBoxIcon },
    { value: 'Baja', label: 'Baja', icon: XCircleIcon },
  ];
  const opcionesUbicacion = [
    { value: 'Patio', label: 'Patio', icon: MapPinIcon },
    { value: 'Cochera', label: 'Cochera', icon: MapPinIcon },
    { value: 'Estacionamiento', label: 'Estacionamiento', icon: MapPinIcon },
    { value: 'Edificio', label: 'Edificio', icon: BuildingOfficeIcon },
  ];
  const opcionesSiNo = [
    { value: 'Sí', label: 'Sí', icon: CheckCircleIcon },
    { value: 'No', label: 'No', icon: XCircleIcon },
    { value: 'En trámite', label: 'En trámite', icon: ClockIcon },
  ];
  const opcionesVigencia = [
    { value: 'Vigente', label: 'Vigente', icon: CheckCircleIcon },
    { value: 'No vigente', label: 'No vigente', icon: XCircleIcon },
    { value: 'En trámite', label: 'En trámite', icon: ClockIcon },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vehiculos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Vehículo</h1>
          <p className="text-gray-500">Padrón Vehicular - 62 Variables</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. IDENTIFICACIÓN */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-veracruz-600" /> 1. Identificación
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Inventario *</label>
              <input type="text" name="numero_inventario" value={formData.numero_inventario} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Económico</label>
              <input type="text" name="numero_economico" value={formData.numero_economico} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Placas *</label>
              <input type="text" name="placas" value={formData.placas} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Serie</label>
              <input type="text" name="numero_serie" value={formData.numero_serie} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Motor</label>
              <input type="text" name="numero_motor" value={formData.numero_motor} onChange={handleChange} className="input-field" /></div>
          </div>
        </div>

        {/* 2. CARACTERÍSTICAS */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-veracruz-600" /> 2. Características
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <input type="text" name="marca" value={formData.marca} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Línea *</label>
              <input type="text" name="linea" value={formData.linea} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Modelo (Año) *</label>
              <input type="number" name="modelo" value={formData.modelo} onChange={handleChange} className="input-field" min="1990" max="2030" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input type="text" name="color" value={formData.color} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <SelectModerno name="tipo" value={formData.tipo} onChange={handleChange} icon={TruckIcon} options={opcionesTipo} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Cilindraje</label>
              <input type="text" name="cilindraje" value={formData.cilindraje} onChange={handleChange} className="input-field" placeholder="2.5L" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input type="number" name="capacidad_pasajeros" value={formData.capacidad_pasajeros} onChange={handleChange} className="input-field" min="1" max="60" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Combustible</label>
              <SelectModerno name="tipo_combustible" value={formData.tipo_combustible} onChange={handleChange} icon={FireIcon} options={opcionesCombustible} /></div>
          </div>
        </div>

        {/* 3. ASIGNACIÓN */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="h-5 w-5 text-veracruz-600" /> 3. Asignación
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Secretaría *</label>
              {(user?.rol === 'admin' || user?.rol === 'gobernacion') ? (
                <SelectModerno name="secretaria_id" value={formData.secretaria_id} onChange={handleChange} icon={BuildingOfficeIcon} placeholder="Seleccionar..." required options={secretarias.map(s => ({ value: s.id.toString(), label: `${s.siglas} - ${s.nombre}`, icon: BuildingOfficeIcon }))} />
              ) : (
                <div className="input-field bg-gray-100 flex items-center gap-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-veracruz-600" />
                  <span>{secretarias.find(s => s.id.toString() === formData.secretaria_id)?.siglas || 'Cargando...'}</span>
                </div>
              )}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Asignación Actual</label>
              <input type="text" name="asignacion_actual" value={formData.asignacion_actual} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Uso</label>
              <SelectModerno name="uso" value={formData.uso} onChange={handleChange} icon={DocumentTextIcon} placeholder="Seleccionar..." options={opcionesUso} /></div>
          </div>
        </div>

        {/* 4. ADQUISICIÓN */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-veracruz-600" /> 4. Adquisición
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Forma Adquisición</label>
              <SelectModerno name="forma_adquisicion" value={formData.forma_adquisicion} onChange={handleChange} icon={CurrencyDollarIcon} options={opcionesAdquisicion} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input type="text" name="proveedor_unidad" value={formData.proveedor_unidad} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Adquisición</label>
              <input type="date" name="fecha_adquisicion" value={formData.fecha_adquisicion} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Contrato</label>
              <input type="text" name="contrato" value={formData.contrato} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-5 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">CFDI</label>
              <input type="text" name="cfdi" value={formData.cfdi} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Factura Original</label>
              <SelectModerno name="factura_original" value={formData.factura_original} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={opcionesSiNo} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Factura</label>
              <input type="number" name="valor_factura" value={formData.valor_factura} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Contrato</label>
              <input type="number" name="valor_contrato" value={formData.valor_contrato} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Mercado</label>
              <input type="number" name="valor_mercado" value={formData.valor_mercado} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
        </div>

        {/* 5. DOCUMENTACIÓN */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DocumentCheckIcon className="h-5 w-5 text-veracruz-600" /> 5. Documentación
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo Placas</label>
              <SelectModerno name="tipo_placas" value={formData.tipo_placas} onChange={handleChange} icon={DocumentTextIcon} options={opcionesPlacas} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Exp. Placas</label>
              <input type="date" name="fecha_expedicion_placas" value={formData.fecha_expedicion_placas} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tarjeta Circulación</label>
              <SelectModerno name="tarjeta_circulacion" value={formData.tarjeta_circulacion} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={opcionesVigencia} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vigencia Tarjeta</label>
              <input type="date" name="vigencia_tarjeta" value={formData.vigencia_tarjeta} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Acta Entrega</label>
              <SelectModerno name="acta_entrega_recepcion" value={formData.acta_entrega_recepcion} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={opcionesSiNo} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Resguardo</label>
              <SelectModerno name="resguardo_vehicular" value={formData.resguardo_vehicular} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={opcionesSiNo} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Verificación</label>
              <SelectModerno name="verificacion_vehicular" value={formData.verificacion_vehicular} onChange={handleChange} icon={CheckCircleIcon} placeholder="..." options={[...opcionesVigencia, { value: 'Exento', label: 'Exento', icon: DocumentTextIcon }]} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vigencia Verif.</label>
              <input type="date" name="vigencia_verificacion" value={formData.vigencia_verificacion} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reemplacamiento</label>
              <SelectModerno name="comprobante_reemplacamiento" value={formData.comprobante_reemplacamiento} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={[{ value: 'Sí', label: 'Sí', icon: CheckCircleIcon }, { value: 'No', label: 'No', icon: XCircleIcon }, { value: 'No aplica', label: 'No aplica', icon: DocumentTextIcon }]} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pago Derechos</label>
              <SelectModerno name="pago_derechos" value={formData.pago_derechos} onChange={handleChange} icon={CurrencyDollarIcon} placeholder="..." options={[{ value: 'Vigente', label: 'Vigente', icon: CheckCircleIcon }, { value: 'No vigente', label: 'No vigente', icon: XCircleIcon }, { value: 'Exento', label: 'Exento', icon: DocumentTextIcon }]} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Bitácora Mant.</label>
              <SelectModerno name="bitacora_mantenimiento" value={formData.bitacora_mantenimiento} onChange={handleChange} icon={ClipboardDocumentListIcon} placeholder="..." options={[{ value: 'Sí', label: 'Sí', icon: CheckCircleIcon }, { value: 'No', label: 'No', icon: XCircleIcon }]} /></div>
          </div>
        </div>

        {/* 6. INVENTARIO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArchiveBoxIcon className="h-5 w-5 text-veracruz-600" /> 6. Inventario
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Inv. Patrimonial</label>
              <input type="text" name="inventario_patrimonial" value={formData.inventario_patrimonial} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Alta</label>
              <input type="date" name="fecha_alta_inventario" value={formData.fecha_alta_inventario} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor en Libros</label>
              <input type="number" name="valor_libros" value={formData.valor_libros} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
        </div>

        {/* 7. ESTATUS */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-veracruz-600" /> 7. Estatus
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Estatus Operativo *</label>
              <SelectModerno name="estatus_operativo" value={formData.estatus_operativo} onChange={handleChange} icon={Cog6ToothIcon} options={opcionesOperativo} />
              <p className="text-xs text-gray-500 mt-1">Estado de funcionamiento</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Estatus Administrativo *</label>
              <SelectModerno name="estatus_administrativo" value={formData.estatus_administrativo} onChange={handleChange} icon={DocumentTextIcon} options={opcionesAdmin} />
              <p className="text-xs text-gray-500 mt-1">Estado en el padrón</p></div>
          </div>
        </div>

        {/* 8. UBICACIÓN */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-veracruz-600" /> 8. Ubicación
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
              <input type="text" name="municipio" value={formData.municipio} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Física</label>
              <SelectModerno name="ubicacion_fisica" value={formData.ubicacion_fisica} onChange={handleChange} icon={MapPinIcon} placeholder="..." options={opcionesUbicacion} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Específica</label>
              <input type="text" name="ubicacion_especifica" value={formData.ubicacion_especifica} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input type="text" name="latitud" value={formData.latitud} onChange={handleChange} className="input-field" placeholder="Ej: 19.5438" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input type="text" name="longitud" value={formData.longitud} onChange={handleChange} className="input-field" placeholder="Ej: -96.9102" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
              <input type="text" name="direccion_completa" value={formData.direccion_completa} onChange={handleChange} className="input-field" placeholder="Calle, número, colonia..." /></div>
          </div>
        </div>

        {/* 9. RESGUARDATARIO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-veracruz-600" /> 9. Resguardatario
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" name="resguardante_nombre" value={formData.resguardante_nombre} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input type="text" name="resguardante_cargo" value={formData.resguardante_cargo} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" name="resguardante_telefono" value={formData.resguardante_telefono} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="resguardante_email" value={formData.resguardante_email} onChange={handleChange} className="input-field" /></div>
          </div>
        </div>

        {/* 10. SEGURO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-veracruz-600" /> 10. Seguro
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <SelectModerno name="seguro" value={formData.seguro} onChange={handleChange} icon={ShieldCheckIcon} placeholder="..." options={opcionesVigencia} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Aseguradora</label>
              <input type="text" name="aseguradora" value={formData.aseguradora} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Póliza</label>
              <input type="text" name="poliza_seguro" value={formData.poliza_seguro} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vigencia</label>
              <input type="date" name="vigencia_seguro" value={formData.vigencia_seguro} onChange={handleChange} className="input-field" /></div>
          </div>
        </div>

        {/* 11. MANTENIMIENTO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-veracruz-600" /> 11. Mantenimiento y Condición
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Último Servicio</label>
              <input type="date" name="ultimo_servicio" value={formData.ultimo_servicio} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje</label>
              <input type="number" name="kilometraje" value={formData.kilometraje} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Consumo (L/100km)</label>
              <input type="number" name="consumo_combustible" value={formData.consumo_combustible} onChange={handleChange} className="input-field" step="0.1" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo Anual Mant.</label>
              <input type="number" name="costo_mantenimiento_anual" value={formData.costo_mantenimiento_anual} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">% Motor</label>
              <input type="number" name="porcentaje_motor" value={formData.porcentaje_motor} onChange={handleChange} className="input-field" min="0" max="100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">% Transmisión</label>
              <input type="number" name="porcentaje_transmision" value={formData.porcentaje_transmision} onChange={handleChange} className="input-field" min="0" max="100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">% Chasis</label>
              <input type="number" name="porcentaje_chasis" value={formData.porcentaje_chasis} onChange={handleChange} className="input-field" min="0" max="100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Proveedor Mant.</label>
              <input type="text" name="proveedor_mantenimiento" value={formData.proveedor_mantenimiento} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-1 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Desglose Mantenimiento (últimos 2 años fiscales)</label>
              <textarea name="desglose_mantenimiento" value={formData.desglose_mantenimiento} onChange={handleChange} className="input-field" rows={2} placeholder="Descripción de mantenimientos realizados..." /></div>
          </div>
          
          {/* 11.1 Mecánico */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">🔧 Servicio Mecánico</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo Anual Mecánico</label>
              <input type="number" name="costo_anual_mecanico" value={formData.costo_anual_mecanico} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia (veces/año)</label>
              <input type="number" name="frecuencia_mecanico" value={formData.frecuencia_mecanico} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Proveedor Mecánico</label>
              <input type="text" name="proveedor_mecanico" value={formData.proveedor_mecanico} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-1 gap-4 mt-2">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Desglose Mecánico</label>
              <textarea name="desglose_mecanico" value={formData.desglose_mecanico} onChange={handleChange} className="input-field" rows={2} placeholder="Detalle de servicios mecánicos..." /></div>
          </div>
          
          {/* 11.2 Eléctrico */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">⚡ Servicio Eléctrico</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo Anual Eléctrico</label>
              <input type="number" name="costo_anual_electrico" value={formData.costo_anual_electrico} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia (veces/año)</label>
              <input type="number" name="frecuencia_electrico" value={formData.frecuencia_electrico} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Proveedor Eléctrico</label>
              <input type="text" name="proveedor_electrico" value={formData.proveedor_electrico} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-1 gap-4 mt-2">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Desglose Eléctrico</label>
              <textarea name="desglose_electrico" value={formData.desglose_electrico} onChange={handleChange} className="input-field" rows={2} placeholder="Detalle de servicios eléctricos..." /></div>
          </div>
          
          {/* Observaciones Técnicas */}
          <div className="grid md:grid-cols-1 gap-4 mt-6 border-t pt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Técnicas</label>
              <textarea name="observaciones_tecnicas" value={formData.observaciones_tecnicas} onChange={handleChange} className="input-field" rows={2} placeholder="Notas técnicas sobre el estado del vehículo..." /></div>
          </div>
        </div>

        {/* 12. PRÉSTAMO */}
        <div className="card border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-3 mb-4">
            <input type="checkbox" id="esta_prestado" checked={formData.esta_prestado} onChange={(e) => setFormData(prev => ({ ...prev, esta_prestado: e.target.checked }))} className="h-5 w-5 text-amber-600 rounded" />
            <label htmlFor="esta_prestado" className="font-semibold text-gray-900 cursor-pointer">12. Prestado a otra Secretaría</label>
          </div>
          {formData.esta_prestado && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-amber-200">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Secretaría *</label>
                <SelectModerno name="prestado_a_secretaria_id" value={formData.prestado_a_secretaria_id} onChange={handleChange} icon={BuildingOfficeIcon} placeholder="..." required options={secretarias.filter(s => s.id != formData.secretaria_id).map(s => ({ value: s.id.toString(), label: `${s.siglas}`, icon: BuildingOfficeIcon }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input type="date" name="prestamo_fecha_inicio" value={formData.prestamo_fecha_inicio} onChange={handleChange} className="input-field" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input type="text" name="prestamo_motivo" value={formData.prestamo_motivo} onChange={handleChange} className="input-field" /></div>
            </div>
          )}
        </div>

        {/* 13. EVIDENCIA */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-veracruz-600" /> 13. Evidencia
          </h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fotos (URL)</label>
              <input type="text" name="evidencia_fotografica" value={formData.evidencia_fotografica} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="input-field" rows={3} /></div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/vehiculos')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Guardando...' : 'Crear Vehículo'}</button>
        </div>
      </form>
    </div>
  );
}
