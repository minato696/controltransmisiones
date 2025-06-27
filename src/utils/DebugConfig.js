// src/utils/DebugConfig.js - Configuración de debugging y logging
/**
 * Configuración centralizada para controlar el nivel de logging y debugging
 * en el sistema de transmisiones EXITOSA
 */

// ==================== CONFIGURACIÓN DE DEBUGGING ====================

export const DEBUG_CONFIG = {
  // Controles principales de logging
  ENABLED: false, // Cambiar a true para activar debugging general
  DETAILED_MAPPING_LOGS: false, // Logs detallados del sistema de mapeo
  PERFORMANCE_LOGS: false, // Logs de rendimiento y timing
  API_LOGS: true, // Logs de llamadas a la API
  ERROR_LOGS: true, // Logs de errores (siempre recomendado)
  
  // Niveles específicos de debugging
  LEVELS: {
    REPORTE_MAPPING: false, // Mapeo de reportes específicos
    TARGET_CONVERSION: false, // Conversiones de targets
    BACKEND_SYNC: false, // Sincronización con backend
    UI_INTERACTIONS: false, // Interacciones de usuario
    STATE_CHANGES: false, // Cambios de estado
    CACHE_OPERATIONS: false // Operaciones de caché
  },
  
  // Configuración de rendimiento
  PERFORMANCE: {
    LOG_SLOW_OPERATIONS: true, // Log de operaciones que toman más de X ms
    SLOW_THRESHOLD_MS: 100, // Umbral para considerar operación lenta
    MONITOR_RE_RENDERS: false, // Monitorear re-renders excesivos
    LOG_MEMORY_USAGE: false // Log de uso de memoria
  }
};

// ==================== FUNCIONES DE LOGGING OPTIMIZADAS ====================

/**
 * Logger principal optimizado
 */
export const debugLog = (category, message, data = null) => {
  if (!DEBUG_CONFIG.ENABLED) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}] 🔧 ${category.toUpperCase()}`;
  
  if (data) {
    console.log(`${prefix} - ${message}`, data);
  } else {
    console.log(`${prefix} - ${message}`);
  }
};

/**
 * Logger específico para mapeo de targets
 */
export const mapLog = (operation, input, output, extra = null) => {
  if (!DEBUG_CONFIG.LEVELS.TARGET_CONVERSION) return;
  
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🔄 MAPEO - ${operation}:`, {
    input,
    output,
    ...(extra && { extra })
  });
};

/**
 * Logger para operaciones de reportes
 */
export const reporteLog = (action, reporteId, data = null) => {
  if (!DEBUG_CONFIG.LEVELS.REPORTE_MAPPING) return;
  
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 📄 REPORTE - ${action} (${reporteId}):`, data);
};

/**
 * Logger para llamadas a la API
 */
export const apiLog = (method, endpoint, status, data = null) => {
  if (!DEBUG_CONFIG.API_LOGS) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
  
  console.log(`[${timestamp}] ${statusEmoji} API - ${method} ${endpoint} (${status})`, data);
};

/**
 * Logger para errores
 */
export const errorLog = (component, error, context = null) => {
  if (!DEBUG_CONFIG.ERROR_LOGS) return;
  
  const timestamp = new Date().toLocaleTimeString();
  console.error(`[${timestamp}] ❌ ERROR - ${component}:`, {
    message: error.message,
    stack: error.stack,
    context
  });
};

/**
 * Logger para rendimiento
 */
export const performanceLog = (operation, duration, threshold = null) => {
  if (!DEBUG_CONFIG.PERFORMANCE_LOGS) return;
  
  const actualThreshold = threshold || DEBUG_CONFIG.PERFORMANCE.SLOW_THRESHOLD_MS;
  
  if (duration > actualThreshold || DEBUG_CONFIG.PERFORMANCE.LOG_SLOW_OPERATIONS) {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = duration > actualThreshold ? '🐌' : '⚡';
    console.log(`[${timestamp}] ${emoji} PERF - ${operation}: ${duration}ms`);
  }
};

/**
 * Logger para cambios de estado
 */
export const stateLog = (component, stateName, oldValue, newValue) => {
  if (!DEBUG_CONFIG.LEVELS.STATE_CHANGES) return;
  
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🔄 STATE - ${component}.${stateName}:`, {
    from: oldValue,
    to: newValue
  });
};

// ==================== UTILIDADES DE TIMING ====================

/**
 * Clase para medir tiempo de operaciones
 */
export class PerformanceTimer {
  constructor(operationName) {
    this.operationName = operationName;
    this.startTime = performance.now();
  }
  
  end(logResult = true) {
    const duration = performance.now() - this.startTime;
    
    if (logResult) {
      performanceLog(this.operationName, Math.round(duration));
    }
    
    return duration;
  }
}

/**
 * Decorator para medir tiempo de funciones
 */
export const withTiming = (fn, operationName) => {
  return async (...args) => {
    const timer = new PerformanceTimer(operationName || fn.name);
    try {
      const result = await fn(...args);
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  };
};

// ==================== UTILIDADES DE DEBUGGING ESPECÍFICAS ====================

/**
 * Debug del sistema de mapeo
 */
export const debugMapping = {
  logConversion: (type, input, output) => {
    mapLog(`${type}_CONVERSION`, input, output);
  },
  
  logProcessing: (reporteBefore, reporteAfter) => {
    if (!DEBUG_CONFIG.LEVELS.REPORTE_MAPPING) return;
    
    console.log('🔄 MAPEO - Procesando reporte:', {
      antes: {
        estado: reporteBefore.estado,
        target: reporteBefore.target,
        motivo: reporteBefore.motivo?.substring(0, 50) + '...'
      },
      despues: {
        estado: reporteAfter.estado,
        target: reporteAfter.target,
        motivo: reporteAfter.motivo?.substring(0, 50) + '...'
      }
    });
  },
  
  logTargetInference: (motivo, targetInferido) => {
    mapLog('TARGET_INFERENCE', motivo?.substring(0, 50) + '...', targetInferido);
  }
};

/**
 * Debug de operaciones de backend
 */
export const debugBackend = {
  logSync: (operation, recordCount, duration) => {
    if (!DEBUG_CONFIG.LEVELS.BACKEND_SYNC) return;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🔄 SYNC - ${operation}:`, {
      records: recordCount,
      duration: `${duration}ms`
    });
  },
  
  logApiCall: (method, url, payload, response) => {
    apiLog(method, url, response?.status || 0, {
      payload: payload ? Object.keys(payload) : null,
      responseSize: response?.data ? JSON.stringify(response.data).length : 0
    });
  }
};

/**
 * Debug de interacciones de UI
 */
export const debugUI = {
  logInteraction: (component, action, data = null) => {
    if (!DEBUG_CONFIG.LEVELS.UI_INTERACTIONS) return;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🖱️ UI - ${component}.${action}:`, data);
  },
  
  logReRender: (component, reason) => {
    if (!DEBUG_CONFIG.PERFORMANCE.MONITOR_RE_RENDERS) return;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🔄 RENDER - ${component}: ${reason}`);
  }
};

// ==================== CONFIGURACIÓN DINÁMICA ====================

/**
 * Habilitar debugging dinámicamente desde la consola
 */
window.enableDebug = (level = 'all') => {
  switch (level) {
    case 'all':
      DEBUG_CONFIG.ENABLED = true;
      Object.keys(DEBUG_CONFIG.LEVELS).forEach(key => {
        DEBUG_CONFIG.LEVELS[key] = true;
      });
      break;
    case 'mapping':
      DEBUG_CONFIG.LEVELS.TARGET_CONVERSION = true;
      DEBUG_CONFIG.LEVELS.REPORTE_MAPPING = true;
      break;
    case 'performance':
      DEBUG_CONFIG.PERFORMANCE_LOGS = true;
      DEBUG_CONFIG.PERFORMANCE.MONITOR_RE_RENDERS = true;
      break;
    case 'api':
      DEBUG_CONFIG.API_LOGS = true;
      DEBUG_CONFIG.LEVELS.BACKEND_SYNC = true;
      break;
    default:
      DEBUG_CONFIG.ENABLED = true;
  }
  
  console.log('🔧 Debug habilitado para:', level);
  console.log('📊 Configuración actual:', DEBUG_CONFIG);
};

/**
 * Deshabilitar debugging
 */
window.disableDebug = () => {
  DEBUG_CONFIG.ENABLED = false;
  Object.keys(DEBUG_CONFIG.LEVELS).forEach(key => {
    DEBUG_CONFIG.LEVELS[key] = false;
  });
  DEBUG_CONFIG.PERFORMANCE_LOGS = false;
  DEBUG_CONFIG.PERFORMANCE.MONITOR_RE_RENDERS = false;
  
  console.log('🔇 Debug deshabilitado');
};

/**
 * Mostrar estadísticas de rendimiento
 */
window.showPerformanceStats = () => {
  const stats = {
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
    } : 'No disponible',
    timing: performance.timing ? {
      pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart + ' ms',
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart + ' ms'
    } : 'No disponible'
  };
  
  console.table(stats);
};

// ==================== EXPORT POR DEFECTO ====================

export default {
  DEBUG_CONFIG,
  debugLog,
  mapLog,
  reporteLog,
  apiLog,
  errorLog,
  performanceLog,
  stateLog,
  PerformanceTimer,
  withTiming,
  debugMapping,
  debugBackend,
  debugUI
};