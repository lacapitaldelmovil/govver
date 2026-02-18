import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  MapPinIcon,
  TruckIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeAmericasIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

/* Mapa de regiones de Veracruz para agrupar municipios */
const REGIONES_VERACRUZ = {
  'Zona Norte': ['PÁNUCO', 'PANUCO', 'TAMPICO ALTO', 'TUXPAN', 'TUXPAM', 'TEMPOAL', 'TANTOYUCA', 'CHICONTEPEC', 'ÁLAMO', 'ALAMO', 'CERRO AZUL', 'NARANJOS', 'OZULUAMA', 'PUEBLO VIEJO', 'TAMALÍN', 'CITLALTÉPETL'],
  'Zona Centro-Norte': ['POZA RICA', 'PAPANTLA', 'GUTIÉRREZ ZAMORA', 'GUTIERREZ ZAMORA', 'TECOLUTLA', 'CAZONES', 'COATZINTLA', 'TIHUATLÁN', 'TIHUATLAN', 'ESPINAL', 'MARTÍNEZ DE LA TORRE', 'MARTINEZ DE LA TORRE', 'MISANTLA', 'NAUTLA'],
  'Zona Capital': ['XALAPA', 'COATEPEC', 'XICO', 'TEOCELO', 'BANDERILLA', 'EMILIANO ZAPATA', 'JILOTEPEC', 'RAFAEL LUCIO', 'TLALNELHUAYOCAN', 'NAOLINCO', 'ACAJETE', 'LAS VIGAS', 'PEROTE', 'ALTOTONGA'],
  'Zona Centro': ['VERACRUZ', 'BOCA DEL RÍO', 'BOCA DEL RIO', 'MEDELLÍN', 'MEDELLIN', 'ALVARADO', 'LA ANTIGUA', 'ÚRSULO GALVÁN', 'URSULO GALVAN', 'PUENTE NACIONAL', 'PASO DE OVEJAS', 'SOLEDAD DE DOBLADO', 'JAMAPA', 'MANLIO FABIO ALTAMIRANO', 'COTAXTLA'],
  'Zona Montañas': ['CÓRDOBA', 'CORDOBA', 'ORIZABA', 'FORTÍN', 'FORTIN', 'HUATUSCO', 'COSCOMATEPEC', 'ZONGOLICA', 'CAMERINO Z. MENDOZA', 'IXTACZOQUITLÁN', 'IXTACZOQUITLAN', 'RÍO BLANCO', 'RIO BLANCO', 'NOGALES', 'ACULTZINGO', 'MALTRATA', 'TEQUILA', 'TEHUIPANGO'],
  'Zona Sur': ['COATZACOALCOS', 'MINATITLÁN', 'MINATITLAN', 'COSOLEACAQUE', 'NANCHITAL', 'AGUA DULCE', 'LAS CHOAPAS', 'MOLOACÁN', 'IXHUATLÁN DEL SURESTE', 'IXHUATLAN DEL SURESTE', 'JÁLTIPAN', 'JALTIPAN', 'OLUTA', 'TEXISTEPEC', 'ZARAGOZA', 'HIDALGOTITLÁN'],
  'Zona Tuxtlas': ['SAN ANDRÉS TUXTLA', 'SAN ANDRES TUXTLA', 'SANTIAGO TUXTLA', 'CATEMACO', 'LERDO DE TEJADA', 'ÁNGEL R. CABADA', 'ANGEL R. CABADA', 'HUEYAPAN DE OCAMPO'],
  'Zona Papaloapan': ['TIERRA BLANCA', 'TRES VALLES', 'COSAMALOAPAN', 'CARLOS A. CARRILLO', 'ISLA', 'JUAN RODRÍGUEZ CLARA', 'JUAN RODRIGUEZ CLARA', 'JOSÉ AZUETA', 'JOSE AZUETA', 'PLAYA VICENTE', 'OTATITLÁN', 'TLACOJALPAN', 'CHACALTIANGUIS', 'TUXTILLA'],
  'Zona Olmeca': ['ACAYUCAN', 'SAN JUAN EVANGELISTA', 'SAYULA DE ALEMÁN', 'SAYULA DE ALEMAN', 'JESÚS CARRANZA', 'JESUS CARRANZA', 'SOTEAPAN', 'MECAYAPAN', 'PAJAPAN', 'TATAHUICAPAN']
};

function getRegion(municipio) {
  if (!municipio) return 'Otros';
  const upper = municipio.toUpperCase().trim();
  for (const [region, muns] of Object.entries(REGIONES_VERACRUZ)) {
    if (muns.some(m => upper.includes(m) || m.includes(upper))) return region;
  }
  return 'Otros';
}

const regionColors = {
  'Zona Norte': { bg: 'bg-sky-50', border: 'border-sky-400', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  'Zona Centro-Norte': { bg: 'bg-teal-50', border: 'border-teal-400', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  'Zona Capital': { bg: 'bg-veracruz-50', border: 'border-veracruz-400', badge: 'bg-veracruz-100 text-veracruz-700', dot: 'bg-veracruz-500' },
  'Zona Centro': { bg: 'bg-blue-50', border: 'border-blue-400', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'Zona Montañas': { bg: 'bg-emerald-50', border: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'Zona Sur': { bg: 'bg-amber-50', border: 'border-amber-400', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  'Zona Tuxtlas': { bg: 'bg-lime-50', border: 'border-lime-400', badge: 'bg-lime-100 text-lime-700', dot: 'bg-lime-500' },
  'Zona Papaloapan': { bg: 'bg-orange-50', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  'Zona Olmeca': { bg: 'bg-rose-50', border: 'border-rose-400', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  'Otros': { bg: 'bg-gray-50', border: 'border-gray-400', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
};

export default function MunicipiosLista() {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState('municipios');
  const [vistaCards, setVistaCards] = useState(true);
  const [agruparPorRegion, setAgruparPorRegion] = useState(false);
  const [regionesColapsadas, setRegionesColapsadas] = useState({});
  const [ordenarPor, setOrdenarPor] = useState('nombre');

  useEffect(() => {
    cargarMunicipios();
  }, []);

  const cargarMunicipios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/municipios-stats');
      setDatos(res.data || []);
    } catch (error) {
      console.error('Error cargando municipios:', error);
    } finally {
      setLoading(false);
    }
  };

  const municipios = datos.filter(d => !d.es_dependencia);
  const dependencias = datos.filter(d => d.es_dependencia);
  const datosBase = vistaActiva === 'municipios' ? municipios : dependencias;

  const datosFiltrados = useMemo(() => {
    let filtrados = datosBase.filter(m =>
      m.municipio?.toLowerCase().includes(busqueda.toLowerCase())
    );
    switch (ordenarPor) {
      case 'vehiculos':
        filtrados.sort((a, b) => (b.total || 0) - (a.total || 0));
        break;
      case 'operando':
        filtrados.sort((a, b) => (b.operando || 0) - (a.operando || 0));
        break;
      default:
        filtrados.sort((a, b) => a.municipio?.localeCompare(b.municipio));
    }
    return filtrados;
  }, [datosBase, busqueda, ordenarPor]);

  const datosAgrupados = useMemo(() => {
    if (!agruparPorRegion || vistaActiva !== 'municipios') return null;
    const grupos = {};
    datosFiltrados.forEach(m => {
      const region = getRegion(m.municipio);
      if (!grupos[region]) grupos[region] = [];
      grupos[region].push(m);
    });
    const ordenRegiones = Object.keys(REGIONES_VERACRUZ);
    ordenRegiones.push('Otros');
    return ordenRegiones
      .filter(r => grupos[r]?.length > 0)
      .map(r => ({ region: r, items: grupos[r] }));
  }, [datosFiltrados, agruparPorRegion, vistaActiva]);

  const totalMunicipios = municipios.reduce((sum, m) => sum + (m.total || 0), 0);
  const totalDependencias = dependencias.reduce((sum, m) => sum + (m.total || 0), 0);
  const totalOperando = datosBase.reduce((sum, m) => sum + (m.operando || 0), 0);
  const totalMalEstado = datosBase.reduce((sum, m) => sum + (m.mal_estado || 0), 0);
  const totalBaja = datosBase.reduce((sum, m) => sum + (m.baja || 0), 0);
  const totalEnTaller = datosBase.reduce((sum, m) => sum + (m.en_taller || 0), 0);
  const totalVehiculos = datosBase.reduce((sum, m) => sum + (m.total || 0), 0);

  const toggleRegion = (region) => {
    setRegionesColapsadas(prev => ({ ...prev, [region]: !prev[region] }));
  };

  const pctOperando = (m) => {
    if (!m.total) return 0;
    return Math.round(((m.operando || 0) / m.total) * 100);
  };

  const colorSemaforo = (pct) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const bgSemaforo = (pct) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  /* ========== Render Card ========== */
  const renderCard = (mun, idx) => {
    const pct = pctOperando(mun);
    const esDepe = vistaActiva === 'dependencias';

    return (
      <Link
        key={idx}
        to={`/vehiculos?municipio=${encodeURIComponent(mun.municipio)}`}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group overflow-hidden"
      >
        <div className={`h-1.5 ${bgSemaforo(pct)}`} />
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-veracruz-600 transition-colors truncate">
                {mun.municipio || 'Sin asignar'}
              </h3>
              {!esDepe && (
                <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${regionColors[getRegion(mun.municipio)]?.badge || 'bg-gray-100 text-gray-600'}`}>
                  {getRegion(mun.municipio)}
                </span>
              )}
            </div>
            <div className="ml-2 flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                esDepe ? 'bg-amber-100 text-amber-700' : 'bg-veracruz-100 text-veracruz-700'
              }`}>
                {mun.total}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span>Operatividad</span>
              <span className={`font-bold ${colorSemaforo(pct)}`}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${bgSemaforo(pct)}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {mun.operando > 0 && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-500">Operando</span>
                <span className="font-semibold text-green-700 ml-auto">{mun.operando}</span>
              </div>
            )}
            {(mun.disponible > 0) && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-gray-500">Disponible</span>
                <span className="font-semibold text-blue-700 ml-auto">{mun.disponible}</span>
              </div>
            )}
            {mun.mal_estado > 0 && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                <span className="text-gray-500">Mal estado</span>
                <span className="font-semibold text-orange-700 ml-auto">{mun.mal_estado}</span>
              </div>
            )}
            {mun.en_taller > 0 && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-gray-500">Taller</span>
                <span className="font-semibold text-purple-700 ml-auto">{mun.en_taller}</span>
              </div>
            )}
            {mun.baja > 0 && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-gray-500">Baja</span>
                <span className="font-semibold text-red-700 ml-auto">{mun.baja}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-50 px-4 py-2 bg-gray-50/50 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <EyeIcon className="h-3 w-3" />
            Ver vehículos
          </span>
          <TruckIcon className="h-3.5 w-3.5 text-gray-300 group-hover:text-veracruz-400 transition-colors" />
        </div>
      </Link>
    );
  };

  /* ========== Render Table Row ========== */
  const renderTableRow = (mun, idx) => {
    const pct = pctOperando(mun);

    return (
      <tr key={idx} className="hover:bg-veracruz-50/30 transition-colors">
        <td className="px-4 py-3">
          <Link
            to={`/vehiculos?municipio=${encodeURIComponent(mun.municipio)}`}
            className="font-medium text-gray-900 hover:text-veracruz-600 hover:underline"
          >
            {mun.municipio || 'Sin asignar'}
          </Link>
          {vistaActiva === 'municipios' && (
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${regionColors[getRegion(mun.municipio)]?.badge || 'bg-gray-100 text-gray-600'}`}>
              {getRegion(mun.municipio)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="font-bold text-gray-900">{mun.total}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-green-700 font-medium">{mun.operando || 0}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-orange-600 font-medium">{mun.mal_estado || 0}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-red-600 font-medium">{mun.baja || 0}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
              <div className={`h-full rounded-full ${bgSemaforo(pct)}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-bold ${colorSemaforo(pct)}`}>{pct}%</span>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-veracruz-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ===================== HEADER + STATS INTEGRADO ===================== */}
      <div className="bg-gradient-to-r from-veracruz-600 via-veracruz-700 to-veracruz-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-veracruz-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <GlobeAmericasIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Distribución Vehicular</h1>
              <p className="text-veracruz-200 text-[11px] sm:text-xs">Flota por municipios y dependencias</p>
            </div>
          </div>
          <button onClick={cargarMunicipios} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Actualizar">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Stats integrados en header */}
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-2">
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{municipios.length}</p>
            <p className="text-[9px] text-veracruz-200 uppercase tracking-wider">Municipios</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{totalMunicipios}</p>
            <p className="text-[9px] text-veracruz-200 uppercase tracking-wider">Veh. Mun.</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{dependencias.length}</p>
            <p className="text-[9px] text-veracruz-200 uppercase tracking-wider">Depend.</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{totalDependencias}</p>
            <p className="text-[9px] text-veracruz-200 uppercase tracking-wider">Veh. Dep.</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{totalOperando}</p>
            <p className="text-[9px] text-green-300 uppercase tracking-wider">Operando</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{totalMalEstado}</p>
            <p className="text-[9px] text-amber-300 uppercase tracking-wider">Mal Est.</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{totalEnTaller}</p>
            <p className="text-[9px] text-purple-300 uppercase tracking-wider">Taller</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg sm:text-xl font-black leading-tight">{totalBaja}</p>
            <p className="text-[9px] text-red-300 uppercase tracking-wider">Baja</p>
          </div>
        </div>
      </div>

      {/* ===================== TOOLBAR ===================== */}
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="flex flex-col gap-2">
          {/* Tabs + Search + View toggle en una fila */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => { setVistaActiva('municipios'); setAgruparPorRegion(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all text-xs whitespace-nowrap ${
                  vistaActiva === 'municipios' ? 'bg-veracruz-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                <MapPinIcon className="h-3.5 w-3.5" />
                Municipios ({municipios.length})
              </button>
              <button
                onClick={() => { setVistaActiva('dependencias'); setAgruparPorRegion(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all text-xs whitespace-nowrap ${
                  vistaActiva === 'dependencias' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                <BuildingOffice2Icon className="h-3.5 w-3.5" />
                Dependencias ({dependencias.length})
              </button>
            </div>

            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={`Buscar ${vistaActiva === 'municipios' ? 'municipio' : 'dependencia'}...`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="text-[11px] border rounded-lg px-2 py-1.5 text-gray-600 focus:ring-veracruz-500 focus:border-veracruz-500"
              >
                <option value="nombre">A-Z</option>
                <option value="vehiculos">+ Vehículos</option>
                <option value="operando">+ Operando</option>
              </select>

              {vistaActiva === 'municipios' && (
                <button
                  onClick={() => setAgruparPorRegion(!agruparPorRegion)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    agruparPorRegion ? 'bg-veracruz-100 text-veracruz-700 border-veracruz-300' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <GlobeAmericasIcon className="h-3 w-3" />
                  Región
                </button>
              )}

              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setVistaCards(true)}
                  className={`p-1 rounded-md transition-all ${vistaCards ? 'bg-white shadow-sm text-veracruz-600' : 'text-gray-400'}`}
                  title="Tarjetas"
                >
                  <Squares2X2Icon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setVistaCards(false)}
                  className={`p-1 rounded-md transition-all ${!vistaCards ? 'bg-white shadow-sm text-veracruz-600' : 'text-gray-400'}`}
                  title="Tabla"
                >
                  <ListBulletIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== CONTENT ===================== */}
      {vistaCards ? (
        agruparPorRegion && datosAgrupados ? (
          <div className="space-y-2">
            {datosAgrupados.map(({ region, items }) => {
              const rc = regionColors[region] || regionColors['Otros'];
              const collapsed = regionesColapsadas[region];
              const regionTotal = items.reduce((s, m) => s + (m.total || 0), 0);
              const regionOp = items.reduce((s, m) => s + (m.operando || 0), 0);
              const regionPct = regionTotal > 0 ? Math.round((regionOp / regionTotal) * 100) : 0;

              return (
                <div key={region} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <button
                    onClick={() => toggleRegion(region)}
                    className={`w-full flex items-center justify-between px-3 py-2 ${rc.bg} border-b hover:opacity-90 transition-all`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${rc.dot}`} />
                      <h3 className="font-bold text-gray-800 text-sm">{region}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rc.badge}`}>
                        {items.length} mun. • {regionTotal} veh.
                      </span>
                      <span className={`text-[10px] font-bold ${colorSemaforo(regionPct)}`}>
                        {regionPct}% op.
                      </span>
                    </div>
                    {collapsed ? <ChevronDownIcon className="h-4 w-4 text-gray-400" /> : <ChevronUpIcon className="h-4 w-4 text-gray-400" />}
                  </button>

                  {!collapsed && (
                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                      {items.map((m, i) => renderCard(m, `${region}-${i}`))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {datosFiltrados.map((mun, idx) => renderCard(mun, idx))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {vistaActiva === 'municipios' ? 'Municipio' : 'Dependencia'}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Operando</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Mal Est.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Baja</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Operatividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {datosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                      No se encontraron resultados
                    </td>
                  </tr>
                ) : (
                  datosFiltrados.map((mun, idx) => renderTableRow(mun, idx))
                )}
              </tbody>
              {datosFiltrados.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td className="px-4 py-3 text-gray-700">
                      Total ({datosFiltrados.length})
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900">{totalVehiculos}</td>
                    <td className="px-4 py-3 text-center text-green-700">{totalOperando}</td>
                    <td className="px-4 py-3 text-center text-orange-600">{totalMalEstado}</td>
                    <td className="px-4 py-3 text-center text-red-600">{totalBaja}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${colorSemaforo(totalVehiculos ? Math.round((totalOperando / totalVehiculos) * 100) : 0)}`}>
                        {totalVehiculos ? Math.round((totalOperando / totalVehiculos) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {datosFiltrados.length === 0 && vistaCards && (
        <div className="text-center py-16">
          <MapPinIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No se encontraron {vistaActiva === 'municipios' ? 'municipios' : 'dependencias'}</p>
          {busqueda && <p className="text-gray-300 text-sm mt-1">con &ldquo;{busqueda}&rdquo;</p>}
        </div>
      )}
    </div>
  );
}
