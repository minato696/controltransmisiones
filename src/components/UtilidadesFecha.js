// src/components/UtilidadesFecha.js
import { TIMEZONE_PERU } from '../services/api';

/**
 * Utilidades para manejo de fechas y cálculos temporales
 * Responsabilidades:
 * - Formateo de fechas en zona horaria de Perú
 * - Cálculos de semanas y rangos de fechas
 * - Generación de claves para reportes
 * - Cálculo de estadísticas
 */

// ==================== UTILIDADES DE FECHA ====================

export const obtenerFechaLocal = () => {
  return new Date(new Date().toLocaleString('en-US', {timeZone: TIMEZONE_PERU}));
};

export const formatearFechaLocal = (fecha) => {
  const fechaEnPeru = new Date(fecha.toLocaleString('en-US', {timeZone: TIMEZONE_PERU}));
  return fechaEnPeru.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE_PERU
  });
};

export const formatearFechaHoraCompleta = (fecha) => {
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

export const formatearFechaParaBackendReporte = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ==================== CÁLCULOS DE SEMANA ====================

export const getSemanaFromDate = (fecha) => {
  // Usar la fecha en zona horaria de Perú
  const fechaLocal = new Date(fecha.toLocaleString('en-US', {timeZone: TIMEZONE_PERU}));
  const lunes = new Date(fechaLocal);
  lunes.setDate(fechaLocal.getDate() - fechaLocal.getDay() + 1);
  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);
  
  return {
    inicio: lunes,
    fin: viernes,
    fechas: [
      new Date(lunes),
      new Date(lunes.getTime() + 24*60*60*1000),
      new Date(lunes.getTime() + 2*24*60*60*1000),
      new Date(lunes.getTime() + 3*24*60*60*1000),
      new Date(lunes.getTime() + 4*24*60*60*1000)
    ]
  };
};

// ==================== GENERACIÓN DE CLAVES ====================

export const generarClave = (filialId, programaId, fecha) => {
  const fechaStr = formatearFechaParaBackendReporte(fecha);
  return `${filialId}-${programaId}-${fechaStr}`;
};

export const generarClaveNota = (filialId, fecha) => {
  const semana = getSemanaFromDate(fecha);
  return `${filialId}-${formatearFechaLocal(semana.inicio)}`;
};

// ==================== GENERACIÓN DE CALENDARIO ====================

export const generarCalendario = (fechaSeleccionada) => {
  // Usar la fecha en zona horaria de Perú
  const fechaLocal = new Date(fechaSeleccionada.toLocaleString('en-US', {timeZone: TIMEZONE_PERU}));
  const año = fechaLocal.getFullYear();
  const mes = fechaLocal.getMonth();
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const diaInicioSemana = primerDia.getDay() === 0 ? 7 : primerDia.getDay();
  
  const dias = [];
  
  for (let i = diaInicioSemana - 1; i > 0; i--) {
    const diaAnterior = new Date(año, mes, 1 - i);
    dias.push({ fecha: diaAnterior, esDelMes: false });
  }
  
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(año, mes, dia);
    dias.push({ fecha, esDelMes: true });
  }
  
  const diasRestantes = 42 - dias.length;
  for (let dia = 1; dia <= diasRestantes; dia++) {
    const fechaSiguiente = new Date(año, mes + 1, dia);
    dias.push({ fecha: fechaSiguiente, esDelMes: false });
  }
  
  return dias;
};

// ==================== CÁLCULO DE ESTADÍSTICAS ====================

export const calcularEstadisticas = (filiales, semanaActual, fechaSeleccionada, programaActivo, modoVista, obtenerEstadoReporte) => {
  if (modoVista === 'dia') {
    const total = filiales.length;
    let transmitidas = 0, noTransmitidas = 0, tardias = 0;
    
    filiales.forEach(filial => {
      const reporte = obtenerEstadoReporte(filial.id, programaActivo?.id, fechaSeleccionada);
      if (reporte.estado === 'si') transmitidas++;
      else if (reporte.estado === 'no') noTransmitidas++;
      else if (reporte.estado === 'tarde') tardias++;
    });
    
    return { total, transmitidas, noTransmitidas, tardias, pendientes: total - transmitidas - noTransmitidas - tardias };
  } else {
    const total = filiales.length * 5;
    let transmitidas = 0, noTransmitidas = 0, tardias = 0;
    
    filiales.forEach(filial => {
      semanaActual.fechas.forEach(fecha => {
        const reporte = obtenerEstadoReporte(filial.id, programaActivo?.id, fecha);
        if (reporte.estado === 'si') transmitidas++;
        else if (reporte.estado === 'no') noTransmitidas++;
        else if (reporte.estado === 'tarde') tardias++;
      });
    });
    
    return { total, transmitidas, noTransmitidas, tardias, pendientes: total - transmitidas - noTransmitidas - tardias };
  }
};

// ==================== UTILIDADES DE ESTADO ====================

export const obtenerColor = (estado) => {
  switch (estado) {
    case 'si': return 'bg-green-500';
    case 'no': return 'bg-red-500';
    case 'tarde': return 'bg-yellow-500';
    default: return 'bg-gray-300';
  }
};

export const obtenerIcono = (estado) => {
  switch (estado) {
    case 'si': return 'CheckCircle';
    case 'no': return 'XCircle';
    case 'tarde': return 'AlertCircle';
    default: return null;
  }
};

// ==================== CONSTANTES ====================

export const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];