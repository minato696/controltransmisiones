// src/components/UtilidadesFecha.js

/**
 * Utilidades para manejo de fechas y cálculos temporales
 * Incluye soporte para sábado (6 días laborables)
 */

// Configuración de zona horaria
export const TIMEZONE_PERU = 'America/Lima';

// Días de la semana - ACTUALIZADO PARA INCLUIR SÁBADO
export const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Meses del año
export const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Obtener fecha actual en zona horaria de Perú
export const obtenerFechaLocal = () => {
  const ahora = new Date();
  return new Date(ahora.toLocaleString('en-US', { timeZone: TIMEZONE_PERU }));
};

// Formatear fecha para mostrar (DD/MM/YYYY)
export const formatearFechaLocal = (fecha) => {
  if (!fecha) return '';
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const año = fecha.getFullYear();
  return `${dia}/${mes}/${año}`;
};

// Formatear fecha con hora completa
export const formatearFechaHoraCompleta = (fecha) => {
  if (!fecha) return '';
  return fecha.toLocaleString('es-PE', {
    timeZone: TIMEZONE_PERU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Formatear fecha para el backend (YYYY-MM-DD)
export const formatearFechaParaBackendReporte = (fecha) => {
  if (!fecha) return '';
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

// Obtener la semana actual basada en una fecha - ACTUALIZADO PARA 6 DÍAS
export const getSemanaFromDate = (fecha) => {
  const diaSemana = fecha.getDay();
  
  // Ajustar para que lunes sea el inicio de la semana
  let diasDesdeInicio;
  if (diaSemana === 0) { // Domingo
    diasDesdeInicio = 6; // El domingo cuenta como día 7, retroceder al lunes anterior
  } else {
    diasDesdeInicio = diaSemana - 1; // Lunes = 0, Martes = 1, etc.
  }
  
  const inicio = new Date(fecha);
  inicio.setDate(fecha.getDate() - diasDesdeInicio);
  
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 5); // Cambiado de 4 a 5 para incluir sábado
  
  // Generar array de fechas (6 días: lunes a sábado)
  const fechas = [];
  for (let i = 0; i < 6; i++) { // Cambiado de 5 a 6
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + i);
    fechas.push(fecha);
  }
  
  return { inicio, fin, fechas };
};

// Generar calendario para un mes
export const generarCalendario = (fecha) => {
  const año = fecha.getFullYear();
  const mes = fecha.getMonth();
  
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  
  const primerDiaSemana = primerDia.getDay();
  const diasEnMes = ultimoDia.getDate();
  
  const calendario = [];
  
  // Días del mes anterior
  const diasMesAnterior = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
  const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
  
  for (let i = diasMesAnterior; i > 0; i--) {
    calendario.push({
      fecha: new Date(año, mes - 1, ultimoDiaMesAnterior - i + 1),
      esDelMes: false
    });
  }
  
  // Días del mes actual
  for (let dia = 1; dia <= diasEnMes; dia++) {
    calendario.push({
      fecha: new Date(año, mes, dia),
      esDelMes: true
    });
  }
  
  // Días del mes siguiente
  const diasRestantes = 42 - calendario.length;
  for (let dia = 1; dia <= diasRestantes; dia++) {
    calendario.push({
      fecha: new Date(año, mes + 1, dia),
      esDelMes: false
    });
  }
  
  return calendario;
};

// Calcular estadísticas - ACTUALIZADO PARA 6 DÍAS
export const calcularEstadisticas = (filiales, semanaActual, fechaSeleccionada, programaActivo, modoVista, obtenerEstadoReporte) => {
  let total = 0;
  let transmitidas = 0;
  let noTransmitidas = 0;
  let tardias = 0;
  let pendientes = 0;
  
  if (!programaActivo) {
    return { total, transmitidas, noTransmitidas, tardias, pendientes };
  }
  
  filiales.forEach(filial => {
    if (modoVista === 'semana') {
      // Vista semanal: contar 6 días por filial
      semanaActual.fechas.forEach(fecha => {
        total++;
        const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fecha);
        
        switch (reporte.estado) {
          case 'si':
            transmitidas++;
            break;
          case 'no':
            noTransmitidas++;
            break;
          case 'tarde':
            tardias++;
            break;
          default:
            pendientes++;
        }
      });
    } else {
      // Vista diaria: contar solo el día seleccionado
      total++;
      const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fechaSeleccionada);
      
      switch (reporte.estado) {
        case 'si':
          transmitidas++;
          break;
        case 'no':
          noTransmitidas++;
          break;
        case 'tarde':
          tardias++;
          break;
        default:
          pendientes++;
      }
    }
  });
  
  return { total, transmitidas, noTransmitidas, tardias, pendientes };
};

// Obtener color según estado
export const obtenerColor = (estado) => {
  switch (estado) {
    case 'si':
      return 'bg-green-500';
    case 'no':
      return 'bg-red-500';
    case 'tarde':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-300';
  }
};

// Generar clave única para un reporte
export const generarClave = (filialId, programaId, fecha) => {
  const fechaStr = formatearFechaParaBackendReporte(fecha);
  return `${filialId}-${programaId}-${fechaStr}`;
};

// Generar clave para nota general
export const generarClaveNota = (filialId, fecha) => {
  const semana = getSemanaFromDate(fecha);
  const fechaInicio = formatearFechaLocal(semana.inicio);
  return `${filialId}-${fechaInicio}`;
};