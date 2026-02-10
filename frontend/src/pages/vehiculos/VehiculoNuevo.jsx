import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, TruckIcon, BuildingOfficeIcon, WrenchScrewdriverIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, DocumentTextIcon,
  CurrencyDollarIcon, FireIcon, BoltIcon, MapPinIcon, UserIcon,
  ShieldCheckIcon, CameraIcon, Cog6ToothIcon, ArchiveBoxIcon,
  DocumentCheckIcon, ClipboardDocumentListIcon, PhotoIcon, TrashIcon, CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import SelectModerno from '../../components/ui/SelectModerno';
import useAuthStore from '../../store/authStore';

export default function VehiculoNuevo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [secretarias, setSecretarias] = useState([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [fotos, setFotos] = useState([]); // Array de URLs de fotos subidas
  const [formData, setFormData] = useState({
    // === 1. IDENTIFICACIÓN (NUM, INVENT, PLACA, VIN, NUM_MOTOR, NUM_INV) ===
    numero_inventario: '', numero_economico: '', placas: '', numero_serie: '', numero_motor: '',
    
    // === 2. CARACTERÍSTICAS (MARCA, MODELO, COLOR, TIPO_VEH, TIPO_COMB, CAPACIDAD, CILIND) ===
    marca: '', linea: '', modelo: '', color: '', cilindraje: '', capacidad_pasajeros: 5,
    tipo: '', tipo_combustible: 'Gasolina',
    
    // === 3. ASIGNACIÓN E INSTITUCIÓN (INST, ASIGN, ASIG_FEC) ===
    secretaria_id: '', asignacion_actual: '', uso: '',
    asign: '', // Cuenta o no con documento de asignación
    asig_fec: '', // Fecha de asignación
    
    // === 4. RESPONSABLE DEL VEHÍCULO (RESP_N1, RESP_N2, RESP_AP, RESP_AM, RESP_RFC, RESP_NT, RESP_UR) ===
    resp_n1: '', // Primer nombre
    resp_n2: '', // Segundo nombre
    resp_ap: '', // Apellido paterno
    resp_am: '', // Apellido materno
    resp_rfc: '', // RFC con homoclave
    resp_nt: '', // Número de trabajador
    resp_ur: '', // Unidad responsable (Dirección General)
    resguardante_nombre: '', resguardante_cargo: '', resguardante_telefono: '', resguardante_email: '',
    
    // === 5. ÁREA RESPONSABLE (AR) ===
    ar: '', // Área que genera/posee/actualiza la información
    
    // === 6. ADQUISICIÓN Y PROVEEDOR (FORMA_ADQ, PV_RFC, PV_NP, PV_RS, F_ADQ, FAC_OR, VAL_FAC, CONTRATO, VAL_CONT, FUENTE_FIN) ===
    forma_adquisicion: 'Compra', 
    pv_rfc: '', // RFC proveedor del vehículo
    pv_np: '', // Número de padrón proveedor
    pv_rs: '', // Razón social proveedor (antes proveedor_unidad)
    proveedor_unidad: '', // Mantener compatibilidad
    fecha_adquisicion: '',
    valor_contrato: '', cfdi: '', contrato: '', factura_original: '',
    valor_factura: '', valor_mercado: '', valor_libros: '',
    fuente_fin: '', // Fuente de financiamiento (estatal/federal/propio)
    
    // === 7. DEPRECIACIÓN (P_DEPRE, VIDA_UR, DEP_AC) ===
    p_depre: '20', // Tasa de depreciación anual (%)
    vida_ur: '', // Vida útil remanente (meses)
    dep_ac: '', // Depreciación acumulada
    
    // === 8. DOCUMENTACIÓN (placas, tarjeta, verificación, etc.) ===
    tipo_placas: 'Oficiales', fecha_expedicion_placas: '',
    comp_pl: '', // Documento que acredita alta/actualización placas
    acta_entrega_recepcion: '', resguardo_vehicular: '',
    tarjeta_circulacion: '', vigencia_tarjeta: '',
    verificacion_vehicular: '', vigencia_verificacion: '',
    comprobante_reemplacamiento: '', pago_derechos: '',
    
    // === 9. ADEUDOS VEHICULARES (DD_VV, DD_VVC) ===
    dd_vv: '', // ¿Tiene adeudos en Derechos de Control Vehicular?
    dd_vvc: '', // Monto del adeudo
    
    // === 10. INVENTARIO PATRIMONIAL (F_ALTA) ===
    inventario_patrimonial: '', fecha_alta_inventario: '', bitacora_mantenimiento: '',
    
    // === 11. ESTATUS (EST_ADM, EST_OP, STAT_GEN) ===
    estatus_operativo: 'Operando', estatus_administrativo: 'Activo',
    stat_gen: '', // Status general (muy bueno/bueno/regular/malo/muy malo)
    
    // === 12. UBICACIÓN (UBI_LON, UBI_LAT, EST_UBI, MUN_UBI, UBI_DIR, UBI_DES) ===
    municipio: '', ubicacion_fisica: '', ubicacion_especifica: '', 
    latitud: '', longitud: '', direccion_completa: '',
    est_ubi: 'Veracruz', // Entidad federativa
    
    // === 13. SEGURIDAD DEL RESGUARDO (UBI_SEG, UBI_SEG_T, UBI_SEG_E) ===
    ubi_seg: '', // ¿Cuenta con seguridad 24hrs?
    ubi_seg_t: '', // Tipo de seguridad
    ubi_seg_e: '', // Empresa de seguridad
    
    // === 14. USO DEL VEHÍCULO (USO, F_USO, USO_S1-S4) ===
    f_uso: '', // Fecha en que comenzó a operar
    uso_s1: '', uso_s2: '', uso_s3: '', uso_s4: '', // Días de uso por semana
    
    // === 15. KILOMETRAJE (KM_AC, KM_MEN, KM_EN2025-KM_DI2025) ===
    km_ac: '', // Kilometraje acumulado total
    km_men: '', // Kilometraje del mes inmediato anterior
    kilometraje: '', // Campo existente
    km_en2025: '', km_fe2025: '', km_ma2025: '', km_ab2025: '',
    km_may2025: '', km_ju2025: '', km_jul2025: '', km_ag2025: '',
    km_se2025: '', km_oc2025: '', km_no2025: '', km_di2025: '',
    
    // === 16. SEGURO (SEGURO, SEG_VIG_I, SEG_VIG_F, ASEG, NUM_POL, VAL_POL) ===
    seguro: '', aseguradora: '', poliza_seguro: '', 
    vigencia_seguro: '', // Fecha fin (antes solo este)
    seg_vig_i: '', // Fecha inicio cobertura
    seg_vig_f: '', // Fecha fin cobertura
    val_pol: '', // Valor anual de la póliza
    
    // === 17. COMBUSTIBLE (CARG_BIT, CAR_S1-S4, REND, LT_EN2025-LT_DI2025) ===
    carg_bit: '', // ¿Cuenta con bitácora de combustible?
    car_s1: '', car_s2: '', car_s3: '', car_s4: '', // Carga por semana (lts)
    rend: '', // Rendimiento lts/km
    consumo_combustible: '', // Campo existente
    lt_en2025: '', lt_fe2025: '', lt_ma2025: '', lt_ab2025: '',
    lt_may2025: '', lt_ju2025: '', lt_jul2025: '', lt_ag2025: '',
    lt_se2025: '', lt_oc2025: '', lt_no2025: '', lt_di2025: '',
    
    // === 18. ÚLTIMO MANTENIMIENTO (MAN_FEC, MAN_COST, MAN_RS, MAN_TIPO, MP_RFC, MP_NP) ===
    ultimo_servicio: '', // MAN_FEC
    man_cost: '', // Costo del último mantenimiento
    man_rs: '', // Razón social proveedor mantenimiento
    man_tipo: '', // Tipo (preventivo/correctivo/predictivo)
    mp_rfc: '', // RFC proveedor mantenimiento
    mp_np: '', // Número de padrón proveedor
    
    // === 19. HISTORIAL MANTENIMIENTOS EJERCICIO ACTUAL (NUM_MAN, M1-M3) ===
    num_man: '', // Número de mantenimientos en el ejercicio fiscal
    m1_tipo: '', m1_fec: '', m1_rfc: '', m1_np: '', m1_rs: '',
    m2_tipo: '', m2_fec: '', m2_rfc: '', m2_np: '', m2_rs: '',
    m3_tipo: '', m3_fec: '', m3_rfc: '', m3_np: '', m3_rs: '',
    
    // === 20. HISTORIAL MANTENIMIENTOS 2025 (NUMM_2025, M1T_2025-M3S_2025) ===
    numm_2025: '', // Número de mantenimientos 2025
    m1t_2025: '', m1f_2025: '', m1r_2025: '', m1n_2025: '', m1s_2025: '',
    m2t_2025: '', m2f_2025: '', m2r_2025: '', m2n_2025: '', m2s_2025: '',
    m3t_2025: '', m3f_2025: '', m3r_2025: '', m3n_2025: '', m3s_2025: '',
    
    // === 21. BITÁCORA MANTENIMIENTO (BIT_MAN) ===
    bit_man: '', // ¿Cuenta con registro histórico de servicios?
    
    // === 22. SERVICIO MECÁNICO DETALLADO (COST_MEC, MEC_TIPO, MEC_FEC, MEC_RFC, MEC_NP, MEC_RS) ===
    cost_mec: '', // Gasto mensual en mecánico
    mec_tipo: '', // Tipo de arreglo mecánico
    mec_fec: '', // Fecha del arreglo
    mec_rfc: '', // RFC proveedor mecánico
    mec_np: '', // Número padrón proveedor mecánico
    mec_rs: '', // Razón social proveedor mecánico
    
    // === 23. MECÁNICO 2025 (CM_2025, FM_2025, MR_2025, MN_2025, MS_2025) ===
    cm_2025: '', // Gasto anual mecánico 2025
    fm_2025: '', // Frecuencia mecánico 2025
    mr_2025: '', // RFC mecánico 2025
    mn_2025: '', // Número padrón mecánico 2025
    ms_2025: '', // Razón social mecánico 2025
    
    // Campos existentes de mantenimiento general
    porcentaje_motor: '', porcentaje_transmision: '', porcentaje_chasis: '',
    costo_mantenimiento_anual: '', proveedor_mantenimiento: '',
    desglose_mantenimiento: '', observaciones_tecnicas: '',
    
    // Campos existentes mecánico/eléctrico
    costo_anual_mecanico: '', frecuencia_mecanico: '', desglose_mecanico: '', proveedor_mecanico: '',
    costo_anual_electrico: '', frecuencia_electrico: '', desglose_electrico: '', proveedor_electrico: '',
    
    // === 24. EVIDENCIA Y OBSERVACIONES ===
    evidencia_fotografica: '', observaciones: '',
    
    // === 25. PRÉSTAMO ===
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

  // Subir fotos
  const handleUploadFotos = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFotos(true);
    const formDataUpload = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('fotos', files[i]);
    }

    try {
      const response = await api.post('/vehiculos/upload-fotos', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.urls) {
        setFotos(prev => [...prev, ...response.data.urls]);
        // Actualizar el campo evidencia_fotografica con todas las URLs
        const allUrls = [...fotos, ...response.data.urls].join(', ');
        setFormData(prev => ({ ...prev, evidencia_fotografica: allUrls }));
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      toast.error(error.response?.data?.error || 'Error al subir las fotos');
    } finally {
      setUploadingFotos(false);
      e.target.value = ''; // Limpiar input
    }
  };

  // Eliminar foto
  const handleRemoveFoto = (indexToRemove) => {
    const newFotos = fotos.filter((_, index) => index !== indexToRemove);
    setFotos(newFotos);
    setFormData(prev => ({ ...prev, evidencia_fotografica: newFotos.join(', ') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { esta_prestado, prestado_a_secretaria_id, prestamo_fecha_inicio, prestamo_motivo, ...vehiculoData } = formData;
      const datos = Object.fromEntries(Object.entries(vehiculoData).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
      if (datos.secretaria_id) datos.secretaria_id = parseInt(datos.secretaria_id);
      // Mapear 'modelo' a 'anio' para compatibilidad con backend
      if (datos.modelo) {
        datos.anio = parseInt(datos.modelo);
      }
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
    { value: 'camiones', label: 'Camiones por clase', icon: TruckIcon },
    { value: 'chasis_coraza', label: 'Chasis Coraza', icon: TruckIcon },
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
  const opcionesCuentaNoCuenta = [
    { value: '1', label: 'Cuenta', icon: CheckCircleIcon },
    { value: '2', label: 'No cuenta', icon: XCircleIcon },
  ];
  const opcionesVigencia = [
    { value: 'Vigente', label: 'Vigente', icon: CheckCircleIcon },
    { value: 'No vigente', label: 'No vigente', icon: XCircleIcon },
    { value: 'En trámite', label: 'En trámite', icon: ClockIcon },
  ];
  const opcionesUsoCompleto = [
    { value: '1', label: 'Notificación de oficios', icon: DocumentTextIcon },
    { value: '2', label: 'Trámites administrativos', icon: DocumentTextIcon },
    { value: '3', label: 'Transporte de personal', icon: UserIcon },
    { value: '4', label: 'Transporte de personal directivo', icon: UserIcon },
    { value: '5', label: 'Supervisión e inspección', icon: CheckCircleIcon },
    { value: '6', label: 'Traslado de equipo', icon: TruckIcon },
    { value: '7', label: 'Traslado de insumos', icon: TruckIcon },
    { value: '8', label: 'Traslado de medicamentos', icon: ShieldCheckIcon },
    { value: '9', label: 'Atención médica', icon: ShieldCheckIcon },
    { value: '10', label: 'Atención social', icon: UserIcon },
    { value: '11', label: 'Operación de programas públicos', icon: BuildingOfficeIcon },
    { value: '12', label: 'Seguridad institucional', icon: ShieldCheckIcon },
    { value: '13', label: 'Protección civil y emergencias', icon: ShieldCheckIcon },
    { value: '14', label: 'Servicios públicos', icon: BuildingOfficeIcon },
    { value: '15', label: 'Obra pública y mantenimiento', icon: WrenchScrewdriverIcon },
    { value: '16', label: 'Servicios ambientales', icon: MapPinIcon },
    { value: '17', label: 'Educación y cultura', icon: DocumentTextIcon },
    { value: '18', label: 'Deporte y recreación', icon: UserIcon },
    { value: '19', label: 'Comunicación social', icon: DocumentTextIcon },
    { value: '20', label: 'Logística y apoyo operativo', icon: TruckIcon },
    { value: '21', label: 'Uso temporal o eventual', icon: ClockIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesTipoMantenimiento = [
    { value: '1', label: 'Preventivo', icon: WrenchScrewdriverIcon },
    { value: '2', label: 'Correctivo', icon: WrenchScrewdriverIcon },
    { value: '3', label: 'Predictivo', icon: WrenchScrewdriverIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesFuenteFinanciamiento = [
    { value: '1', label: 'Recurso estatal', icon: BuildingOfficeIcon },
    { value: '2', label: 'Recurso propio', icon: CurrencyDollarIcon },
    { value: '3', label: 'Recursos federales transferidos', icon: BuildingOfficeIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesUbiDes = [
    { value: '1', label: 'Estacionamiento techado (dependencia)', icon: BuildingOfficeIcon },
    { value: '2', label: 'Estacionamiento abierto (dependencia)', icon: MapPinIcon },
    { value: '3', label: 'Pensión estacionamiento techado', icon: BuildingOfficeIcon },
    { value: '4', label: 'Pensión estacionamiento abierto', icon: MapPinIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesTipoSeguridad = [
    { value: '1', label: 'IPAX', icon: ShieldCheckIcon },
    { value: '2', label: 'Seguridad Privada', icon: ShieldCheckIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesStatGen = [
    { value: '1', label: 'Muy bueno', icon: CheckCircleIcon },
    { value: '2', label: 'Bueno', icon: CheckCircleIcon },
    { value: '3', label: 'Regular', icon: ClockIcon },
    { value: '4', label: 'Malo', icon: XCircleIcon },
    { value: '5', label: 'Muy malo', icon: XCircleIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesMarca = [
    { value: '1', label: 'Ford Motor Co.', icon: TruckIcon },
    { value: '2', label: 'Volkswagen Group', icon: TruckIcon },
    { value: '3', label: 'General Motors', icon: TruckIcon },
    { value: '4', label: 'Toyota Motor Corp.', icon: TruckIcon },
    { value: '5', label: 'Hyundai Motor Group', icon: TruckIcon },
    { value: '6', label: 'Renault-Nissan-Mitsubishi', icon: TruckIcon },
    { value: '7', label: 'Nissan', icon: TruckIcon },
    { value: '8', label: 'Mitsubishi', icon: TruckIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesColor = [
    { value: '1', label: 'Blanco', icon: DocumentTextIcon },
    { value: '2', label: 'Gris / Plata', icon: DocumentTextIcon },
    { value: '3', label: 'Negro', icon: DocumentTextIcon },
    { value: '4', label: 'Rojo / Guinda', icon: DocumentTextIcon },
    { value: '5', label: 'Azul', icon: DocumentTextIcon },
    { value: '6', label: 'Verde', icon: DocumentTextIcon },
    { value: '7', label: 'Amarillo / Dorado', icon: DocumentTextIcon },
    { value: '8', label: 'Café / Arena', icon: DocumentTextIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesCilindrada = [
    { value: '1', label: '3 - 4 Cilindros', icon: Cog6ToothIcon },
    { value: '2', label: '4 Cilindros', icon: Cog6ToothIcon },
    { value: '3', label: '4 Cilindros Turbo', icon: Cog6ToothIcon },
    { value: '4', label: '4 Cil. Grande / V6', icon: Cog6ToothIcon },
    { value: '5', label: 'V8 / V12', icon: Cog6ToothIcon },
    { value: '999', label: 'Otro', icon: DocumentTextIcon },
  ];
  const opcionesTipoVehiculoAgrupadas = [
    { label: '🚗 Automóviles', options: [
      { value: 'sedan', label: 'Automóvil sedán' },
      { value: 'sedan', label: 'Automóvil hatchback' },
      { value: 'sedan', label: 'Automóvil coupé' },
      { value: 'sedan', label: 'Automóvil convertible' },
      { value: 'sedan', label: 'Automóvil turismo' },
    ]},
    { label: '🚙 SUV / Camioneta', options: [
      { value: 'suv', label: 'Camioneta SUV' },
      { value: 'suv', label: 'Camioneta crossover' },
      { value: 'camioneta', label: 'Camioneta' },
    ]},
    { label: '🛻 Pick Up', options: [
      { value: 'pickup', label: 'Pick up cabina sencilla' },
      { value: 'pickup', label: 'Pick up cabina doble' },
    ]},
    { label: '🚐 Van', options: [
      { value: 'van', label: 'Van de pasajeros' },
      { value: 'van', label: 'Van de carga / furgoneta' },
      { value: 'van', label: 'Minivan' },
    ]},
    { label: '🚌 Autobús', options: [
      { value: 'autobus', label: 'Microbús' },
      { value: 'autobus', label: 'Autobús' },
      { value: 'autobus', label: 'Autobús turístico' },
    ]},
    { label: '🏍️ Motocicleta', options: [
      { value: 'motocicleta', label: 'Motocicleta' },
      { value: 'motocicleta', label: 'Motocicleta equipada' },
      { value: 'motocicleta', label: 'Motoneta' },
      { value: 'motocicleta', label: 'Triciclo motorizado' },
    ]},
    { label: '🚛 Camión', options: [
      { value: 'camion', label: 'Camión ligero' },
      { value: 'camion', label: 'Camión mediano' },
      { value: 'camion', label: 'Camión pesado' },
      { value: 'camion', label: 'Camión con caja seca' },
      { value: 'camion', label: 'Camión con redilas' },
      { value: 'camion', label: 'Camión plataforma' },
      { value: 'camion', label: 'Camión refrigerado' },
      { value: 'camion', label: 'Camión cisterna' },
      { value: 'camion', label: 'Camión de volteo' },
    ]},
    { label: '🚚 Remolque', options: [
      { value: 'remolque', label: 'Remolque' },
      { value: 'remolque', label: 'Semirremolque' },
      { value: 'remolque', label: 'Remolque agrícola' },
    ]},
    { label: '🏗️ Grúa / Tractor', options: [
      { value: 'grua', label: 'Grúa' },
      { value: 'grua', label: 'Grúa de rescate' },
      { value: 'tractor', label: 'Tractor' },
      { value: 'tractor', label: 'Tractor agrícola' },
      { value: 'todoterreno', label: 'Vehículo todo terreno (ATV/UTV)' },
    ]},
    { label: '🚑 Emergencia / Médica', options: [
      { value: 'emergencia', label: 'Ambulancia' },
      { value: 'emergencia', label: 'Ambulancia de traslado' },
      { value: 'emergencia', label: 'Ambulancia de terapia intensiva' },
      { value: 'emergencia', label: 'Unidad médica móvil' },
      { value: 'emergencia', label: 'Unidad de vacunación móvil' },
    ]},
    { label: '🚤 Embarcaciones', options: [
      { value: 'embarcacion', label: 'Embarcación' },
      { value: 'embarcacion', label: 'Lancha' },
      { value: 'embarcacion', label: 'Moto acuática' },
      { value: 'embarcacion', label: 'Barco' },
      { value: 'remolque', label: 'Remolque acuático' },
    ]},
    { label: '✈️ Aéreo', options: [
      { value: 'aeronave', label: 'Aeronave' },
      { value: 'aeronave', label: 'Avión' },
      { value: 'helicoptero', label: 'Helicóptero' },
    ]},
    { label: '📋 Otro', options: [
      { value: 'otro', label: 'Otro' },
    ]},
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vehiculos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Vehículo</h1>
          <p className="text-gray-500">Padrón Vehicular Estatal - 151 Variables</p>
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vehículo *</label>
              <SelectModerno name="tipo" value={formData.tipo} onChange={handleChange} icon={TruckIcon} groupedOptions={opcionesTipoVehiculoAgrupadas} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Cilindraje</label>
              <SelectModerno name="cilindraje" value={formData.cilindraje} onChange={handleChange} icon={Cog6ToothIcon} placeholder="..." options={opcionesCilindrada} /></div>
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Uso *</label>
              <SelectModerno name="uso" value={formData.uso} onChange={handleChange} icon={DocumentTextIcon} placeholder="Seleccionar..." options={opcionesUsoCompleto} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">¿Documento de asignación?</label>
              <SelectModerno name="asign" value={formData.asign} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Asignación</label>
              <input type="date" name="asig_fec" value={formData.asig_fec} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio Operación</label>
              <input type="date" name="f_uso" value={formData.f_uso} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-1 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Unidad Responsable (Dirección General)</label>
              <input type="text" name="resp_ur" value={formData.resp_ur} onChange={handleChange} className="input-field" placeholder="Indicar nombre completo de la Dirección General encargada" /></div>
          </div>
          <div className="grid md:grid-cols-1 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Área Responsable (AR)</label>
              <input type="text" name="ar" value={formData.ar} onChange={handleChange} className="input-field" placeholder="Área que genera, posee, publica y actualiza la información" /></div>
          </div>
        </div>

        {/* 4. RESPONSABLE DEL VEHÍCULO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-veracruz-600" /> 4. Responsable del Vehículo
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Primer Nombre</label>
              <input type="text" name="resp_n1" value={formData.resp_n1} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Segundo Nombre</label>
              <input type="text" name="resp_n2" value={formData.resp_n2} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
              <input type="text" name="resp_ap" value={formData.resp_ap} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
              <input type="text" name="resp_am" value={formData.resp_am} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">RFC (con homoclave)</label>
              <input type="text" name="resp_rfc" value={formData.resp_rfc} onChange={handleChange} className="input-field" maxLength="13" placeholder="XXXX000000XXX" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Trabajador</label>
              <input type="text" name="resp_nt" value={formData.resp_nt} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input type="text" name="resguardante_cargo" value={formData.resguardante_cargo} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" name="resguardante_telefono" value={formData.resguardante_telefono} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="resguardante_email" value={formData.resguardante_email} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo (resguardante)</label>
              <input type="text" name="resguardante_nombre" value={formData.resguardante_nombre} onChange={handleChange} className="input-field" /></div>
          </div>
        </div>

        {/* 5. ADQUISICIÓN */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-veracruz-600" /> 5. Adquisición y Proveedor
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Forma Adquisición</label>
              <SelectModerno name="forma_adquisicion" value={formData.forma_adquisicion} onChange={handleChange} icon={CurrencyDollarIcon} options={opcionesAdquisicion} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Adquisición</label>
              <input type="date" name="fecha_adquisicion" value={formData.fecha_adquisicion} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fuente Financiamiento</label>
              <SelectModerno name="fuente_fin" value={formData.fuente_fin} onChange={handleChange} icon={CurrencyDollarIcon} placeholder="..." options={opcionesFuenteFinanciamiento} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Contrato</label>
              <input type="text" name="contrato" value={formData.contrato} onChange={handleChange} className="input-field" /></div>
          </div>
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">Datos del Proveedor del Vehículo</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Razón Social (PV_RS)</label>
              <input type="text" name="pv_rs" value={formData.pv_rs} onChange={handleChange} className="input-field" placeholder="Razón social del proveedor" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">RFC Proveedor (PV_RFC)</label>
              <input type="text" name="pv_rfc" value={formData.pv_rfc} onChange={handleChange} className="input-field" maxLength="13" placeholder="RFC con homoclave" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Padrón Proveedor (PV_NP)</label>
              <input type="text" name="pv_np" value={formData.pv_np} onChange={handleChange} className="input-field" /></div>
          </div>
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">Valores y Documentación</h3>
          <div className="grid md:grid-cols-5 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">CFDI</label>
              <input type="text" name="cfdi" value={formData.cfdi} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Factura Original</label>
              <SelectModerno name="factura_original" value={formData.factura_original} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Factura</label>
              <input type="number" name="valor_factura" value={formData.valor_factura} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Contrato</label>
              <input type="number" name="valor_contrato" value={formData.valor_contrato} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Mercado</label>
              <input type="number" name="valor_mercado" value={formData.valor_mercado} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
        </div>

        {/* 6. DOCUMENTACIÓN */}
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Comprobante Placas (COMP_PL)</label>
              <SelectModerno name="comp_pl" value={formData.comp_pl} onChange={handleChange} icon={DocumentTextIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Bitácora Mant. (BIT_MAN)</label>
              <SelectModerno name="bit_man" value={formData.bit_man} onChange={handleChange} icon={ClipboardDocumentListIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
          </div>
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">Adeudos Vehiculares</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pago Derechos</label>
              <SelectModerno name="pago_derechos" value={formData.pago_derechos} onChange={handleChange} icon={CurrencyDollarIcon} placeholder="..." options={[{ value: 'Vigente', label: 'Vigente', icon: CheckCircleIcon }, { value: 'No vigente', label: 'No vigente', icon: XCircleIcon }, { value: 'Exento', label: 'Exento', icon: DocumentTextIcon }]} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">¿Adeudo en Derechos? (DD_VV)</label>
              <SelectModerno name="dd_vv" value={formData.dd_vv} onChange={handleChange} icon={CurrencyDollarIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Monto Adeudo (DD_VVC)</label>
              <input type="number" name="dd_vvc" value={formData.dd_vvc} onChange={handleChange} className="input-field" step="0.01" placeholder="Monto en pesos" /></div>
          </div>
        </div>

        {/* 7. INVENTARIO Y DEPRECIACIÓN */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArchiveBoxIcon className="h-5 w-5 text-veracruz-600" /> 7. Inventario y Depreciación
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Inv. Patrimonial</label>
              <input type="text" name="inventario_patrimonial" value={formData.inventario_patrimonial} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Alta Inventario</label>
              <input type="date" name="fecha_alta_inventario" value={formData.fecha_alta_inventario} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor en Libros</label>
              <input type="number" name="valor_libros" value={formData.valor_libros} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tasa Depreciación Anual (%) (P_DEPRE)</label>
              <input type="number" name="p_depre" value={formData.p_depre} onChange={handleChange} className="input-field" step="0.01" placeholder="20" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vida Útil Remanente (meses) (VIDA_UR)</label>
              <input type="number" name="vida_ur" value={formData.vida_ur} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Depreciación Acumulada (DEP_AC)</label>
              <input type="number" name="dep_ac" value={formData.dep_ac} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
        </div>

        {/* 8. ESTATUS */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-veracruz-600" /> 8. Estatus
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Estatus Operativo *</label>
              <SelectModerno name="estatus_operativo" value={formData.estatus_operativo} onChange={handleChange} icon={Cog6ToothIcon} options={opcionesOperativo} />
              <p className="text-xs text-gray-500 mt-1">Estado de funcionamiento</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Estatus Administrativo *</label>
              <SelectModerno name="estatus_administrativo" value={formData.estatus_administrativo} onChange={handleChange} icon={DocumentTextIcon} options={opcionesAdmin} />
              <p className="text-xs text-gray-500 mt-1">Estado en el padrón</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status General (STAT_GEN)</label>
              <SelectModerno name="stat_gen" value={formData.stat_gen} onChange={handleChange} icon={Cog6ToothIcon} placeholder="..." options={opcionesStatGen} />
              <p className="text-xs text-gray-500 mt-1">Condición general del vehículo</p></div>
          </div>
        </div>

        {/* 9. UBICACIÓN Y SEGURIDAD */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-veracruz-600" /> 9. Ubicación y Seguridad del Resguardo
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Entidad Federativa</label>
              <input type="text" name="est_ubi" value={formData.est_ubi} onChange={handleChange} className="input-field" placeholder="Veracruz" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
              <input type="text" name="municipio" value={formData.municipio} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción Ubicación</label>
              <SelectModerno name="ubicacion_fisica" value={formData.ubicacion_fisica} onChange={handleChange} icon={MapPinIcon} placeholder="..." options={opcionesUbiDes} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Específica</label>
              <input type="text" name="ubicacion_especifica" value={formData.ubicacion_especifica} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Latitud (13 decimales)</label>
              <input type="text" name="latitud" value={formData.latitud} onChange={handleChange} className="input-field" placeholder="19.5438000000000" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Longitud (13 decimales)</label>
              <input type="text" name="longitud" value={formData.longitud} onChange={handleChange} className="input-field" placeholder="-96.9102000000000" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
              <input type="text" name="direccion_completa" value={formData.direccion_completa} onChange={handleChange} className="input-field" placeholder="Calle, número, colonia..." /></div>
          </div>
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">Seguridad del Lugar de Resguardo</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">¿Seguridad 24hrs? (UBI_SEG)</label>
              <SelectModerno name="ubi_seg" value={formData.ubi_seg} onChange={handleChange} icon={ShieldCheckIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Seguridad (UBI_SEG_T)</label>
              <SelectModerno name="ubi_seg_t" value={formData.ubi_seg_t} onChange={handleChange} icon={ShieldCheckIcon} placeholder="..." options={opcionesTipoSeguridad} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Empresa de Seguridad (UBI_SEG_E)</label>
              <input type="text" name="ubi_seg_e" value={formData.ubi_seg_e} onChange={handleChange} className="input-field" placeholder="Razón social de la empresa" /></div>
          </div>
        </div>

        {/* 10. SEGURO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-veracruz-600" /> 10. Seguro Vehicular
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">¿Cuenta con Seguro?</label>
              <SelectModerno name="seguro" value={formData.seguro} onChange={handleChange} icon={ShieldCheckIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Aseguradora (ASEG)</label>
              <input type="text" name="aseguradora" value={formData.aseguradora} onChange={handleChange} className="input-field" placeholder="Razón social" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Póliza (NUM_POL)</label>
              <input type="text" name="poliza_seguro" value={formData.poliza_seguro} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Inicio Cobertura (SEG_VIG_I)</label>
              <input type="date" name="seg_vig_i" value={formData.seg_vig_i} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fin Cobertura (SEG_VIG_F)</label>
              <input type="date" name="seg_vig_f" value={formData.seg_vig_f} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Anual Póliza (VAL_POL)</label>
              <input type="number" name="val_pol" value={formData.val_pol} onChange={handleChange} className="input-field" step="0.01" placeholder="Costo unitario anual" /></div>
          </div>
        </div>

        {/* 11. MANTENIMIENTO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-veracruz-600" /> 11. Uso, Kilometraje y Combustible
          </h2>
          
          {/* Uso semanal del mes anterior */}
          <h3 className="font-medium text-gray-700 mb-3">📅 Días de Uso por Semana (mes anterior)</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Semana 1 (USO_S1)</label>
              <input type="number" name="uso_s1" value={formData.uso_s1} onChange={handleChange} className="input-field" min="0" max="7" placeholder="0-7" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Semana 2 (USO_S2)</label>
              <input type="number" name="uso_s2" value={formData.uso_s2} onChange={handleChange} className="input-field" min="0" max="7" placeholder="0-7" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Semana 3 (USO_S3)</label>
              <input type="number" name="uso_s3" value={formData.uso_s3} onChange={handleChange} className="input-field" min="0" max="7" placeholder="0-7" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Semana 4 (USO_S4)</label>
              <input type="number" name="uso_s4" value={formData.uso_s4} onChange={handleChange} className="input-field" min="0" max="7" placeholder="0-7" /></div>
          </div>
          
          {/* Kilometraje */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">🚗 Kilometraje</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Km Acumulado Total (KM_AC)</label>
              <input type="number" name="km_ac" value={formData.km_ac} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Km Mes Anterior (KM_MEN)</label>
              <input type="number" name="km_men" value={formData.km_men} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje Actual</label>
              <input type="number" name="kilometraje" value={formData.kilometraje} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Rendimiento (lts/km)</label>
              <input type="number" name="rend" value={formData.rend} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
          
          {/* Kilometraje mensual 2025 */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">📊 Kilometraje Mensual 2025</h3>
          <div className="grid md:grid-cols-6 gap-3">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Enero</label>
              <input type="number" name="km_en2025" value={formData.km_en2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Febrero</label>
              <input type="number" name="km_fe2025" value={formData.km_fe2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Marzo</label>
              <input type="number" name="km_ma2025" value={formData.km_ma2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Abril</label>
              <input type="number" name="km_ab2025" value={formData.km_ab2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Mayo</label>
              <input type="number" name="km_may2025" value={formData.km_may2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Junio</label>
              <input type="number" name="km_ju2025" value={formData.km_ju2025} onChange={handleChange} className="input-field text-sm" /></div>
          </div>
          <div className="grid md:grid-cols-6 gap-3 mt-2">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Julio</label>
              <input type="number" name="km_jul2025" value={formData.km_jul2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Agosto</label>
              <input type="number" name="km_ag2025" value={formData.km_ag2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Septiembre</label>
              <input type="number" name="km_se2025" value={formData.km_se2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Octubre</label>
              <input type="number" name="km_oc2025" value={formData.km_oc2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Noviembre</label>
              <input type="number" name="km_no2025" value={formData.km_no2025} onChange={handleChange} className="input-field text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Diciembre</label>
              <input type="number" name="km_di2025" value={formData.km_di2025} onChange={handleChange} className="input-field text-sm" /></div>
          </div>
          
          {/* Combustible */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">⛽ Combustible</h3>
          <div className="grid md:grid-cols-5 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">¿Bitácora Combustible?</label>
              <SelectModerno name="carg_bit" value={formData.carg_bit} onChange={handleChange} icon={ClipboardDocumentListIcon} placeholder="..." options={opcionesCuentaNoCuenta} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Carga S1 (lts)</label>
              <input type="number" name="car_s1" value={formData.car_s1} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Carga S2 (lts)</label>
              <input type="number" name="car_s2" value={formData.car_s2} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Carga S3 (lts)</label>
              <input type="number" name="car_s3" value={formData.car_s3} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Carga S4 (lts)</label>
              <input type="number" name="car_s4" value={formData.car_s4} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
          
          {/* Litros mensuales 2025 */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">📊 Litros de Combustible Mensual 2025</h3>
          <div className="grid md:grid-cols-6 gap-3">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Enero</label>
              <input type="number" name="lt_en2025" value={formData.lt_en2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Febrero</label>
              <input type="number" name="lt_fe2025" value={formData.lt_fe2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Marzo</label>
              <input type="number" name="lt_ma2025" value={formData.lt_ma2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Abril</label>
              <input type="number" name="lt_ab2025" value={formData.lt_ab2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Mayo</label>
              <input type="number" name="lt_may2025" value={formData.lt_may2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Junio</label>
              <input type="number" name="lt_ju2025" value={formData.lt_ju2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
          </div>
          <div className="grid md:grid-cols-6 gap-3 mt-2">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Julio</label>
              <input type="number" name="lt_jul2025" value={formData.lt_jul2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Agosto</label>
              <input type="number" name="lt_ag2025" value={formData.lt_ag2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Septiembre</label>
              <input type="number" name="lt_se2025" value={formData.lt_se2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Octubre</label>
              <input type="number" name="lt_oc2025" value={formData.lt_oc2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Noviembre</label>
              <input type="number" name="lt_no2025" value={formData.lt_no2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Diciembre</label>
              <input type="number" name="lt_di2025" value={formData.lt_di2025} onChange={handleChange} className="input-field text-sm" step="0.01" /></div>
          </div>
        </div>

        {/* 12. MANTENIMIENTO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-veracruz-600" /> 12. Mantenimiento
          </h2>
          
          {/* Último mantenimiento */}
          <h3 className="font-medium text-gray-700 mb-3">🔧 Último Mantenimiento</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha (MAN_FEC)</label>
              <input type="date" name="ultimo_servicio" value={formData.ultimo_servicio} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo (MAN_COST)</label>
              <input type="number" name="man_cost" value={formData.man_cost} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo (MAN_TIPO)</label>
              <SelectModerno name="man_tipo" value={formData.man_tipo} onChange={handleChange} icon={WrenchScrewdriverIcon} placeholder="..." options={opcionesTipoMantenimiento} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo Anual Mant.</label>
              <input type="number" name="costo_mantenimiento_anual" value={formData.costo_mantenimiento_anual} onChange={handleChange} className="input-field" step="0.01" /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Razón Social Proveedor (MAN_RS)</label>
              <input type="text" name="man_rs" value={formData.man_rs} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">RFC Proveedor (MP_RFC)</label>
              <input type="text" name="mp_rfc" value={formData.mp_rfc} onChange={handleChange} className="input-field" maxLength="13" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Padrón (MP_NP)</label>
              <input type="text" name="mp_np" value={formData.mp_np} onChange={handleChange} className="input-field" /></div>
          </div>
          
          {/* Condición del vehículo */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">📊 Condición del Vehículo</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">% Motor</label>
              <input type="number" name="porcentaje_motor" value={formData.porcentaje_motor} onChange={handleChange} className="input-field" min="0" max="100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">% Transmisión</label>
              <input type="number" name="porcentaje_transmision" value={formData.porcentaje_transmision} onChange={handleChange} className="input-field" min="0" max="100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">% Chasis</label>
              <input type="number" name="porcentaje_chasis" value={formData.porcentaje_chasis} onChange={handleChange} className="input-field" min="0" max="100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Consumo (L/100km)</label>
              <input type="number" name="consumo_combustible" value={formData.consumo_combustible} onChange={handleChange} className="input-field" step="0.1" /></div>
          </div>
          
          {/* Historial mantenimientos ejercicio actual */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">📋 Historial Mantenimientos (Ejercicio Actual)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° de Mantenimientos (NUM_MAN)</label>
              <input type="number" name="num_man" value={formData.num_man} onChange={handleChange} className="input-field" min="0" /></div>
          </div>
          
          {/* Mantenimiento 1 */}
          <div className="bg-gray-50 p-3 rounded-lg mt-3">
            <p className="text-sm font-medium text-gray-600 mb-2">Mantenimiento #1</p>
            <div className="grid md:grid-cols-5 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <SelectModerno name="m1_tipo" value={formData.m1_tipo} onChange={handleChange} icon={WrenchScrewdriverIcon} placeholder="..." options={opcionesTipoMantenimiento} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Fecha</label>
                <input type="date" name="m1_fec" value={formData.m1_fec} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">RFC</label>
                <input type="text" name="m1_rfc" value={formData.m1_rfc} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">N° Padrón</label>
                <input type="text" name="m1_np" value={formData.m1_np} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Razón Social</label>
                <input type="text" name="m1_rs" value={formData.m1_rs} onChange={handleChange} className="input-field text-sm" /></div>
            </div>
          </div>
          
          {/* Mantenimiento 2 */}
          <div className="bg-gray-50 p-3 rounded-lg mt-2">
            <p className="text-sm font-medium text-gray-600 mb-2">Mantenimiento #2</p>
            <div className="grid md:grid-cols-5 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <SelectModerno name="m2_tipo" value={formData.m2_tipo} onChange={handleChange} icon={WrenchScrewdriverIcon} placeholder="..." options={opcionesTipoMantenimiento} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Fecha</label>
                <input type="date" name="m2_fec" value={formData.m2_fec} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">RFC</label>
                <input type="text" name="m2_rfc" value={formData.m2_rfc} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">N° Padrón</label>
                <input type="text" name="m2_np" value={formData.m2_np} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Razón Social</label>
                <input type="text" name="m2_rs" value={formData.m2_rs} onChange={handleChange} className="input-field text-sm" /></div>
            </div>
          </div>
          
          {/* Mantenimiento 3 */}
          <div className="bg-gray-50 p-3 rounded-lg mt-2">
            <p className="text-sm font-medium text-gray-600 mb-2">Mantenimiento #3</p>
            <div className="grid md:grid-cols-5 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <SelectModerno name="m3_tipo" value={formData.m3_tipo} onChange={handleChange} icon={WrenchScrewdriverIcon} placeholder="..." options={opcionesTipoMantenimiento} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Fecha</label>
                <input type="date" name="m3_fec" value={formData.m3_fec} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">RFC</label>
                <input type="text" name="m3_rfc" value={formData.m3_rfc} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">N° Padrón</label>
                <input type="text" name="m3_np" value={formData.m3_np} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Razón Social</label>
                <input type="text" name="m3_rs" value={formData.m3_rs} onChange={handleChange} className="input-field text-sm" /></div>
            </div>
          </div>
          
          {/* Historial mantenimientos 2025 */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">📋 Historial Mantenimientos 2025</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° de Mantenimientos 2025 (NUMM_2025)</label>
              <input type="number" name="numm_2025" value={formData.numm_2025} onChange={handleChange} className="input-field" min="0" /></div>
          </div>
          
          {/* Mantenimiento 1 - 2025 */}
          <div className="bg-blue-50 p-3 rounded-lg mt-3">
            <p className="text-sm font-medium text-blue-600 mb-2">Mantenimiento #1 (2025)</p>
            <div className="grid md:grid-cols-5 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <SelectModerno name="m1t_2025" value={formData.m1t_2025} onChange={handleChange} icon={WrenchScrewdriverIcon} placeholder="..." options={opcionesTipoMantenimiento} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Fecha</label>
                <input type="date" name="m1f_2025" value={formData.m1f_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">RFC</label>
                <input type="text" name="m1r_2025" value={formData.m1r_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">N° Padrón</label>
                <input type="text" name="m1n_2025" value={formData.m1n_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Razón Social</label>
                <input type="text" name="m1s_2025" value={formData.m1s_2025} onChange={handleChange} className="input-field text-sm" /></div>
            </div>
          </div>
          
          {/* Mantenimiento 2 - 2025 */}
          <div className="bg-blue-50 p-3 rounded-lg mt-2">
            <p className="text-sm font-medium text-blue-600 mb-2">Mantenimiento #2 (2025)</p>
            <div className="grid md:grid-cols-5 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <SelectModerno name="m2t_2025" value={formData.m2t_2025} onChange={handleChange} icon={WrenchScrewdriverIcon} placeholder="..." options={opcionesTipoMantenimiento} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Fecha</label>
                <input type="date" name="m2f_2025" value={formData.m2f_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">RFC</label>
                <input type="text" name="m2r_2025" value={formData.m2r_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">N° Padrón</label>
                <input type="text" name="m2n_2025" value={formData.m2n_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Razón Social</label>
                <input type="text" name="m2s_2025" value={formData.m2s_2025} onChange={handleChange} className="input-field text-sm" /></div>
            </div>
          </div>
          
          {/* Mantenimiento 3 - 2025 */}
          <div className="bg-blue-50 p-3 rounded-lg mt-2">
            <p className="text-sm font-medium text-blue-600 mb-2">Mantenimiento #3 (2025)</p>
            <div className="grid md:grid-cols-5 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <SelectModerno name="m3t_2025" value={formData.m3t_2025} onChange={handleChange} icon={WrenchScrewdriverIcon} placeholder="..." options={opcionesTipoMantenimiento} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Fecha</label>
                <input type="date" name="m3f_2025" value={formData.m3f_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">RFC</label>
                <input type="text" name="m3r_2025" value={formData.m3r_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">N° Padrón</label>
                <input type="text" name="m3n_2025" value={formData.m3n_2025} onChange={handleChange} className="input-field text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Razón Social</label>
                <input type="text" name="m3s_2025" value={formData.m3s_2025} onChange={handleChange} className="input-field text-sm" /></div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-1 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Desglose Mantenimiento General</label>
              <textarea name="desglose_mantenimiento" value={formData.desglose_mantenimiento} onChange={handleChange} className="input-field" rows={2} placeholder="Descripción de mantenimientos realizados..." /></div>
          </div>
        </div>

        {/* 13. SERVICIO MECÁNICO DETALLADO */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-veracruz-600" /> 13. Servicio Mecánico
          </h2>
          
          <h3 className="font-medium text-gray-700 mb-3">🔧 Mecánico - Mes Anterior</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Gasto Mensual (COST_MEC)</label>
              <input type="number" name="cost_mec" value={formData.cost_mec} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo Arreglo (MEC_TIPO)</label>
              <input type="text" name="mec_tipo" value={formData.mec_tipo} onChange={handleChange} className="input-field" placeholder="Describir" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Arreglo (MEC_FEC)</label>
              <input type="date" name="mec_fec" value={formData.mec_fec} onChange={handleChange} className="input-field" /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">RFC Proveedor (MEC_RFC)</label>
              <input type="text" name="mec_rfc" value={formData.mec_rfc} onChange={handleChange} className="input-field" maxLength="13" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Padrón (MEC_NP)</label>
              <input type="text" name="mec_np" value={formData.mec_np} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Razón Social (MEC_RS)</label>
              <input type="text" name="mec_rs" value={formData.mec_rs} onChange={handleChange} className="input-field" /></div>
          </div>
          
          <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4">📊 Mecánico - Ejercicio 2025</h3>
          <div className="grid md:grid-cols-5 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Gasto Anual (CM_2025)</label>
              <input type="number" name="cm_2025" value={formData.cm_2025} onChange={handleChange} className="input-field" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia (FM_2025)</label>
              <input type="number" name="fm_2025" value={formData.fm_2025} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">RFC (MR_2025)</label>
              <input type="text" name="mr_2025" value={formData.mr_2025} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Padrón (MN_2025)</label>
              <input type="text" name="mn_2025" value={formData.mn_2025} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Razón Social (MS_2025)</label>
              <input type="text" name="ms_2025" value={formData.ms_2025} onChange={handleChange} className="input-field" /></div>
          </div>
          
          <div className="grid md:grid-cols-1 gap-4 mt-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Desglose Mecánico</label>
              <textarea name="desglose_mecanico" value={formData.desglose_mecanico} onChange={handleChange} className="input-field" rows={2} placeholder="Detalle de servicios mecánicos..." /></div>
          </div>
          
          {/* Servicio Eléctrico */}
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

        {/* 14. PRÉSTAMO */}
        <div className="card border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-3 mb-4">
            <input type="checkbox" id="esta_prestado" checked={formData.esta_prestado} onChange={(e) => setFormData(prev => ({ ...prev, esta_prestado: e.target.checked }))} className="h-5 w-5 text-amber-600 rounded" />
            <label htmlFor="esta_prestado" className="font-semibold text-gray-900 cursor-pointer">14. Prestado a otra Secretaría</label>
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

        {/* 15. EVIDENCIA */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-veracruz-600" /> 15. Evidencia
          </h2>
          <div className="space-y-4">
            {/* Subir fotos directamente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subir Fotos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-veracruz-400 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleUploadFotos}
                  className="hidden"
                  id="fotos-upload"
                  disabled={uploadingFotos}
                />
                <label htmlFor="fotos-upload" className="cursor-pointer">
                  {uploadingFotos ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-veracruz-600"></div>
                      <span className="text-sm text-gray-500">Subiendo fotos...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CloudArrowUpIcon className="h-10 w-10 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        <span className="text-veracruz-600 font-medium">Clic para seleccionar</span> o arrastra las fotos aquí
                      </span>
                      <span className="text-xs text-gray-400">JPG, PNG, WebP o GIF (máx. 5MB cada una)</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Vista previa de fotos subidas */}
            {fotos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fotos Subidas ({fotos.length})</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {fotos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campo URL manual (alternativo) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <PhotoIcon className="h-4 w-4" />
                  URLs de Fotos (alternativo)
                </span>
              </label>
              <input 
                type="text" 
                name="evidencia_fotografica" 
                value={formData.evidencia_fotografica} 
                onChange={handleChange} 
                className="input-field" 
                placeholder="https://ejemplo.com/foto1.jpg, https://ejemplo.com/foto2.jpg"
              />
              <p className="text-xs text-gray-400 mt-1">Separar múltiples URLs con coma</p>
            </div>

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
