/**
 * Script para agregar solicitudes de ejemplo
 */

const { initDatabase, query, closeDatabase } = require('./connection');

async function seedSolicitudes() {
  console.log('📝 Agregando solicitudes de ejemplo...\n');

  await initDatabase();

  // Obtener algunos vehículos y usuarios
  const vehiculos = query('SELECT id FROM vehiculos LIMIT 5');
  const usuarios = query('SELECT id, secretaria_id FROM usuarios WHERE rol = "admin_secretaria" LIMIT 3');
  const secretarias = query('SELECT id FROM secretarias LIMIT 5');

  if (vehiculos.rows.length === 0 || usuarios.rows.length === 0) {
    console.log('❌ No hay vehículos o usuarios para crear solicitudes');
    closeDatabase();
    return;
  }

  // Generar folio único
  function generarFolio() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SOL-${año}${mes}-${random}`;
  }

  const solicitudes = [
    {
      folio: generarFolio(),
      tipo: 'prestamo',
      vehiculo_id: vehiculos.rows[0].id,
      usuario_solicitante_id: usuarios.rows[0].id,
      secretaria_origen_id: usuarios.rows[0].secretaria_id,
      secretaria_destino_id: secretarias.rows[1].id,
      motivo: 'Traslado a reunión interinstitucional en Veracruz',
      justificacion: 'Reunión con funcionarios del puerto para coordinar acciones',
      fecha_inicio: '2026-01-20',
      fecha_fin: '2026-01-20',
      observaciones: 'Salida 8:00 AM, regreso estimado 6:00 PM. Conductor: Juan Pérez López',
      prioridad: 'alta',
      estado: 'pendiente'
    },
    {
      folio: generarFolio(),
      tipo: 'prestamo',
      vehiculo_id: vehiculos.rows[1].id,
      usuario_solicitante_id: usuarios.rows[1].id,
      secretaria_origen_id: usuarios.rows[1].secretaria_id,
      secretaria_destino_id: secretarias.rows[2].id,
      motivo: 'Supervisión de obra pública en Coatzacoalcos',
      justificacion: 'Inspección de avance de obra del nuevo centro comunitario',
      fecha_inicio: '2026-01-22',
      fecha_fin: '2026-01-24',
      observaciones: 'Requiere vehículo con GPS. Conductor: María González',
      prioridad: 'normal',
      estado: 'aprobada',
      fecha_autorizacion: '2026-01-16',
      usuario_autorizador_id: 1
    },
    {
      folio: generarFolio(),
      tipo: 'prestamo',
      vehiculo_id: vehiculos.rows[2].id,
      usuario_solicitante_id: usuarios.rows[2].id,
      secretaria_origen_id: usuarios.rows[2].secretaria_id,
      secretaria_destino_id: secretarias.rows[3].id,
      motivo: 'Entrega de apoyos sociales en Papantla',
      justificacion: 'Distribución de despensas y cobijas para población vulnerable',
      fecha_inicio: '2026-01-18',
      fecha_fin: '2026-01-19',
      observaciones: 'Traslado de material sensible. Conductor: Carlos Hernández',
      prioridad: 'urgente',
      estado: 'aprobada',
      fecha_autorizacion: '2026-01-15',
      usuario_autorizador_id: 1
    },
    {
      folio: generarFolio(),
      tipo: 'prestamo',
      vehiculo_id: vehiculos.rows[3].id,
      usuario_solicitante_id: usuarios.rows[0].id,
      secretaria_origen_id: usuarios.rows[0].secretaria_id,
      secretaria_destino_id: secretarias.rows[4].id,
      motivo: 'Capacitación de personal administrativo',
      justificacion: 'Curso de actualización en sistemas gubernamentales',
      fecha_inicio: '2026-01-25',
      fecha_fin: '2026-01-25',
      observaciones: 'Un solo día. Conductor: Ana López',
      prioridad: 'normal',
      estado: 'pendiente'
    },
    {
      folio: generarFolio(),
      tipo: 'prestamo',
      vehiculo_id: vehiculos.rows[4].id,
      usuario_solicitante_id: usuarios.rows[1].id,
      secretaria_origen_id: usuarios.rows[1].secretaria_id,
      secretaria_destino_id: secretarias.rows[0].id,
      motivo: 'Traslado de documentación oficial',
      justificacion: 'Entrega de expedientes al archivo general',
      fecha_inicio: '2026-01-17',
      fecha_fin: '2026-01-17',
      observaciones: 'Material confidencial. Conductor: Roberto Sánchez',
      prioridad: 'alta',
      estado: 'pendiente'
    }
  ];

  let insertados = 0;
  for (const sol of solicitudes) {
    try {
      query(`
        INSERT INTO solicitudes (
          folio, tipo, vehiculo_id, usuario_solicitante_id,
          secretaria_origen_id, secretaria_destino_id,
          motivo, justificacion, fecha_inicio, fecha_fin,
          observaciones, prioridad, estado,
          fecha_autorizacion, usuario_autorizador_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sol.folio,
        sol.tipo,
        sol.vehiculo_id,
        sol.usuario_solicitante_id,
        sol.secretaria_origen_id,
        sol.secretaria_destino_id,
        sol.motivo,
        sol.justificacion,
        sol.fecha_inicio,
        sol.fecha_fin,
        sol.observaciones,
        sol.prioridad,
        sol.estado,
        sol.fecha_autorizacion || null,
        sol.usuario_autorizador_id || null
      ]);
      insertados++;
      console.log(`✅ ${sol.folio} - ${sol.motivo} (${sol.estado})`);
    } catch (error) {
      console.log(`❌ Error con ${sol.folio}: ${error.message}`);
    }
  }

  console.log(`\n✅ ${insertados}/${solicitudes.length} solicitudes insertadas`);
  
  closeDatabase();
}

seedSolicitudes().catch(console.error);
