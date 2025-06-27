// src/components/ExportManager.js
import React from 'react';
import { Download } from 'lucide-react';

/**
 * Componente para exportación de datos - Solo PDF
 * Muestra motivos personalizados cuando se selecciona "Otros"
 */

const ExportManager = ({
  programaActivo,
  fechaSeleccionada,
  semanaActual,
  modoVista,
  filiales,
  filialesFiltradas,
  diasSemana,
  stats,
  obtenerEstadoReporte,
  obtenerNotaGeneral,
  formatearFecha,
  getTargetLabel,
  processReportTarget
}) => {

// Función para generar HTML del PDF - CORREGIDA para filtrar ciudades sin datos
  const generarHTMLParaPDF = () => {
    let tablaHTML = '';
    
    // Array para almacenar motivos personalizados
    const motivosPersonalizados = [];
    
    // FILTRAR CIUDADES: Solo incluir ciudades que tienen al menos un reporte diferente a "pendiente"
    const ciudadesConDatos = filialesFiltradas.filter(filial => {
      if (modoVista === 'semana') {
        // En vista semanal, verificar si algún día tiene reporte diferente a "pendiente"
        return semanaActual.fechas.some(fecha => {
          const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fecha);
          return reporte.estado && reporte.estado !== 'pendiente';
        });
      } else {
        // En vista diaria, verificar si el día seleccionado tiene reporte diferente a "pendiente"
        const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fechaSeleccionada);
        return reporte.estado && reporte.estado !== 'pendiente';
      }
    });
    
    // Si no hay ciudades con datos, mostrar mensaje
    if (ciudadesConDatos.length === 0) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Control de Transmisiones EXITOSA</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .mensaje { font-size: 18px; color: #666; margin-top: 50px; }
          </style>
        </head>
        <body>
          <h1>Control de Transmisiones EXITOSA - PERÚ</h1>
          <h2>${programaActivo.nombre}</h2>
          <p>
            ${modoVista === 'semana' 
              ? `Período: ${formatearFecha(semanaActual.inicio)} al ${formatearFecha(semanaActual.fin)}`
              : `Fecha: ${formatearFecha(fechaSeleccionada)}`
            }
          </p>
          <div class="mensaje">
            <p>No hay datos de transmisiones registrados para mostrar en este período.</p>
            <p>Las ciudades sin reportes no se incluyen en la exportación.</p>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}
          </p>
        </body>
        </html>
      `;
    }
    
    if (modoVista === 'semana') {
      // Tabla semanal con 6 días - SOLO CIUDADES CON DATOS
      tablaHTML = `
        <table class="tabla-principal">
          <thead>
            <tr>
              <th class="th-ciudad">Ciudad</th>
              ${semanaActual.fechas.map((fecha, index) => `
                <th class="th-dia">
                  ${diasSemana[index]}<br>
                  <small>${formatearFecha(fecha)}</small>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${ciudadesConDatos.map(filial => {
              const celdas = semanaActual.fechas.map((fecha, index) => {
                const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fecha);
                const reporteProcesado = processReportTarget ? processReportTarget(reporte) : reporte;
                
                // Recolectar motivos personalizados
                if ((reporteProcesado.estado === 'no' || reporteProcesado.estado === 'tarde') && 
                    reporteProcesado.target === 'Otros' && 
                    reporteProcesado.motivo) {
                  motivosPersonalizados.push({
                    ciudad: filial.nombre,
                    fecha: formatearFecha(fecha),
                    dia: diasSemana[index],
                    motivo: reporteProcesado.motivo,
                    estado: reporteProcesado.estado
                  });
                }
                
                let clase = '';
                let contenido = '';
                let simbolo = '';
                
                switch (reporteProcesado.estado) {
                  case 'si':
                    clase = 'exitoso';
                    simbolo = '✓';
                    contenido = reporteProcesado.horaReal ? `<br><small>${reporteProcesado.horaReal}</small>` : '';
                    break;
                  case 'no':
                    clase = 'fallo';
                    simbolo = '✗';
                    if (reporteProcesado.target) {
                      if (reporteProcesado.target === 'Otros' && reporteProcesado.motivo) {
                        contenido = `<br><small>Otros</small>`;
                      } else {
                        contenido = `<br><small>${reporteProcesado.target}</small>`;
                      }
                    }
                    break;
                  case 'tarde':
                    clase = 'tardio';
                    simbolo = '⏰';
                    if (reporteProcesado.horaReal) {
                      contenido = `<br><small>${reporteProcesado.horaReal}</small>`;
                    }
                    if (reporteProcesado.target) {
                      if (reporteProcesado.target === 'Otros' && reporteProcesado.motivo) {
                        contenido += `<br><small>Otros</small>`;
                      } else {
                        contenido += `<br><small>${reporteProcesado.target}</small>`;
                      }
                    }
                    break;
                  default:
                    clase = 'pendiente';
                    simbolo = '⏳';
                }
                
                return `<td class="${clase}">${simbolo}${contenido}</td>`;
              }).join('');
              
              return `<tr><td class="ciudad">${filial.nombre}</td>${celdas}</tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      // Tabla diaria - SOLO CIUDADES CON DATOS
      tablaHTML = `
        <table class="tabla-principal">
          <thead>
            <tr>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Hora Real</th>
              <th>Hora TT</th>
              <th>Motivo</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${ciudadesConDatos.map(filial => {
              const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fechaSeleccionada);
              const reporteProcesado = processReportTarget ? processReportTarget(reporte) : reporte;
              
              // Recolectar motivos personalizados para vista diaria
              if ((reporteProcesado.estado === 'no' || reporteProcesado.estado === 'tarde') && 
                  reporteProcesado.target === 'Otros' && 
                  reporteProcesado.motivo) {
                motivosPersonalizados.push({
                  ciudad: filial.nombre,
                  fecha: formatearFecha(fechaSeleccionada),
                  dia: diasSemana[fechaSeleccionada.getDay() === 0 ? 6 : fechaSeleccionada.getDay() - 1] || 'Domingo',
                  motivo: reporteProcesado.motivo,
                  estado: reporteProcesado.estado
                });
              }
              
              let estadoTexto = '';
              let clase = '';
              let motivo = '';
              let observaciones = '';
              
              switch (reporteProcesado.estado) {
                case 'si':
                  estadoTexto = '✓ Transmitió';
                  clase = 'exitoso';
                  break;
                case 'no':
                  estadoTexto = '✗ No transmitió';
                  clase = 'fallo';
                  if (reporteProcesado.target) {
                    if (reporteProcesado.target === 'Otros') {
                      motivo = 'Otros';
                      observaciones = reporteProcesado.motivo || '';
                    } else {
                      const targetLabel = getTargetLabel ? getTargetLabel(reporteProcesado.target, false) : reporteProcesado.target;
                      motivo = targetLabel;
                    }
                  }
                  break;
                case 'tarde':
                  estadoTexto = '⏰ Transmitió Tarde';
                  clase = 'tardio';
                  if (reporteProcesado.target) {
                    if (reporteProcesado.target === 'Otros') {
                      motivo = 'Otros';
                      observaciones = reporteProcesado.motivo || '';
                    } else {
                      const targetLabel = getTargetLabel ? getTargetLabel(reporteProcesado.target, false) : reporteProcesado.target;
                      motivo = targetLabel;
                    }
                  }
                  break;
                default:
                  estadoTexto = '⏳ Pendiente';
                  clase = 'pendiente';
              }
              
              return `
                <tr>
                  <td class="ciudad">${filial.nombre}</td>
                  <td class="${clase}">${estadoTexto}</td>
                  <td>${reporteProcesado.horaReal || '-'}</td>
                  <td>${reporteProcesado.hora_tt || '-'}</td>
                  <td>${motivo || '-'}</td>
                  <td>${observaciones || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    // Generar sección de notas generales si existen - SOLO CIUDADES CON DATOS
    const notasConContenido = ciudadesConDatos.filter(f => obtenerNotaGeneral(f.id).length > 0);
    let seccionNotas = '';
    
    if (notasConContenido.length > 0) {
      seccionNotas = `
        <div class="seccion-notas">
          <h3>Notas Generales</h3>
          ${notasConContenido.map(filial => {
            const nota = obtenerNotaGeneral(filial.id);
            return `
              <div class="nota-ciudad">
                <h4>${filial.nombre}</h4>
                <p>${nota}</p>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    // Generar sección de motivos personalizados
    let seccionMotivosPersonalizados = '';
    
    if (motivosPersonalizados.length > 0) {
      seccionMotivosPersonalizados = `
        <div class="seccion-motivos-personalizados">
          <h3>Motivos</h3>
          <table class="tabla-motivos">
            <thead>
              <tr>
                <th>Ciudad</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              ${motivosPersonalizados.map(item => `
                <tr>
                  <td class="ciudad">${item.ciudad}</td>
                  <td>${item.fecha} (${item.dia})</td>
                  <td class="${item.estado === 'no' ? 'estado-no' : 'estado-tarde'}">
                    ${item.estado === 'no' ? 'No transmitió' : 'Transmitió Tarde'}
                  </td>
                  <td class="motivo-texto">${item.motivo}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Recalcular estadísticas solo para ciudades con datos
    const statsParaCiudadesConDatos = {
      total: 0,
      transmitidas: 0,
      noTransmitidas: 0,
      tardias: 0,
      pendientes: 0
    };
    
    ciudadesConDatos.forEach(filial => {
      if (modoVista === 'semana') {
        semanaActual.fechas.forEach(fecha => {
          const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fecha);
          statsParaCiudadesConDatos.total++;
          
          switch (reporte.estado) {
            case 'si':
              statsParaCiudadesConDatos.transmitidas++;
              break;
            case 'no':
              statsParaCiudadesConDatos.noTransmitidas++;
              break;
            case 'tarde':
              statsParaCiudadesConDatos.tardias++;
              break;
            default:
              statsParaCiudadesConDatos.pendientes++;
          }
        });
      } else {
        const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fechaSeleccionada);
        statsParaCiudadesConDatos.total++;
        
        switch (reporte.estado) {
          case 'si':
            statsParaCiudadesConDatos.transmitidas++;
            break;
          case 'no':
            statsParaCiudadesConDatos.noTransmitidas++;
            break;
          case 'tarde':
            statsParaCiudadesConDatos.tardias++;
            break;
          default:
            statsParaCiudadesConDatos.pendientes++;
        }
      }
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Control de Transmisiones EXITOSA</title>
        <style>
          @page {
            margin: 1.5cm;
            size: A4 landscape;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #1e40af;
          }
          
          .header h1 {
            color: #1e40af;
            font-size: 22px;
            margin: 0 0 10px 0;
            font-weight: bold;
          }
          
          .header .info {
            font-size: 12px;
            margin: 5px 0;
          }
          
          .header .programa {
            font-size: 16px;
            font-weight: bold;
            color: #dc2626;
            margin: 10px 0;
          }
          
          .header .ciudades-incluidas {
            font-size: 10px;
            color: #666;
            margin-top: 10px;
            font-style: italic;
          }
          
          .tabla-principal {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
          }
          
          .tabla-principal th,
          .tabla-principal td {
            border: 1px solid #d1d5db;
            padding: 6px;
            text-align: center;
            vertical-align: middle;
          }
          
          .tabla-principal th {
            background-color: #1e40af;
            color: white;
            font-weight: bold;
            font-size: 11px;
          }
          
          .th-ciudad {
            width: 15%;
          }
          
          .th-dia {
            width: 14.16%;
          }
          
          .ciudad {
            text-align: left;
            font-weight: bold;
            background-color: #f8fafc;
          }
          
          .exitoso {
            background-color: #dcfce7;
            color: #166534;
            font-weight: bold;
          }
          
          .fallo {
            background-color: #fef2f2;
            color: #dc2626;
            font-weight: bold;
          }
          
          .tardio {
            background-color: #fefce8;
            color: #ca8a04;
            font-weight: bold;
          }
          
          .pendiente {
            background-color: #f1f5f9;
            color: #64748b;
          }
          
          .estadisticas {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-top: 20px;
            page-break-inside: avoid;
          }
          
          .estadisticas h3 {
            color: #1e40af;
            margin-top: 0;
            margin-bottom: 15px;
          }
          
          .estadisticas-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          
          .estadistica-item {
            text-align: center;
            padding: 8px;
            background-color: white;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          
          .estadistica-numero {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .estadistica-label {
            font-size: 10px;
            color: #64748b;
          }
          
          .seccion-motivos-personalizados {
            margin-top: 20px;
            padding: 15px;
            background-color: #e8f0fc;
            border: 1px solid #104BA7;
            border-radius: 8px;
            page-break-inside: avoid;
            box-shadow: 0 2px 4px rgba(16, 75, 167, 0.1);
          }
          
          .seccion-motivos-personalizados h3 {
            color: #104BA7;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          
          .tabla-motivos {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          
          .tabla-motivos th,
          .tabla-motivos td {
            border: 1px solid #d4e3f4;
            padding: 10px 12px;
            text-align: left;
          }
          
          .tabla-motivos th {
            background-color: #104BA7;
            color: white;
            font-weight: bold;
          }
          
          .tabla-motivos td {
            background-color: white;
          }
          
          .tabla-motivos .ciudad {
            font-weight: bold;
            color: #104BA7;
          }
          
          .tabla-motivos .estado-no {
            color: #dc2626;
            font-weight: bold;
          }
          
          .tabla-motivos .estado-tarde {
            color: #ca8a04;
            font-weight: bold;
          }
          
          .tabla-motivos .motivo-texto {
            font-style: italic;
            color: #374151;
            line-height: 1.4;
          }
          
          .seccion-notas {
            margin-top: 20px;
            page-break-inside: avoid;
          }
          
          .seccion-notas h3 {
            color: #1e40af;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          
          .nota-ciudad {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            page-break-inside: avoid;
          }
          
          .nota-ciudad h4 {
            margin: 0 0 8px 0;
            color: #1e40af;
            font-size: 12px;
          }
          
          .nota-ciudad p {
            margin: 0;
            line-height: 1.5;
            white-space: pre-wrap;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .exitoso, .fallo, .tardio, .pendiente, th { print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CONTROL DE TRANSMISIONES EXITOSA - PERÚ</h1>
          <div class="programa">${programaActivo.nombre}</div>
          <div class="info">
            ${modoVista === 'semana' 
              ? `Período: ${formatearFecha(semanaActual.inicio)} al ${formatearFecha(semanaActual.fin)}`
              : `Fecha: ${formatearFecha(fechaSeleccionada)}`
            }
          </div>
          <div class="info">Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}</div>
          <div class="ciudades-incluidas">
            Ciudades con reportes: ${ciudadesConDatos.map(f => f.nombre).join(', ')} 
            ${ciudadesConDatos.length < filiales.length ? `(${filiales.length - ciudadesConDatos.length} ciudades sin datos omitidas)` : ''}
          </div>
        </div>
        
        ${tablaHTML}
        
        <div class="estadisticas">
          <h3>Estadísticas del Período (Solo ciudades con datos)</h3>
          <div class="estadisticas-grid">
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #1e40af">${statsParaCiudadesConDatos.total}</div>
              <div class="estadistica-label">Total Programadas</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #16a34a">${statsParaCiudadesConDatos.transmitidas}</div>
              <div class="estadistica-label">Exitosas</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #dc2626">${statsParaCiudadesConDatos.noTransmitidas}</div>
              <div class="estadistica-label">No Transmitidas</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #ca8a04">${statsParaCiudadesConDatos.tardias}</div>
              <div class="estadistica-label">Tardías</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #64748b">${statsParaCiudadesConDatos.pendientes}</div>
              <div class="estadistica-label">Pendientes</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #1e40af">${statsParaCiudadesConDatos.total > 0 ? Math.round((statsParaCiudadesConDatos.transmitidas / statsParaCiudadesConDatos.total) * 100) : 0}%</div>
              <div class="estadistica-label">Efectividad</div>
            </div>
          </div>
        </div>
        
        ${seccionMotivosPersonalizados}
        
        ${seccionNotas}
        
        <div class="footer">
          <p>Sistema de Control de Transmisiones EXITOSA - Generado automáticamente</p>
          <p>Solo se incluyen ciudades con reportes registrados</p>
        </div>
      </body>
      </html>
    `;
  };

  // Función para exportar a PDF
  const exportarPDF = () => {
    if (!programaActivo) {
      alert('Por favor selecciona un programa');
      return;
    }

    const contenidoHTML = generarHTMLParaPDF();
    
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
      alert('Por favor, permite las ventanas emergentes para generar el PDF.');
      return;
    }
    
    ventanaImpresion.document.write(contenidoHTML);
    ventanaImpresion.document.close();
    
    ventanaImpresion.onload = () => {
      setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
      }, 500);
    };
  };

  return (
    <button
      onClick={exportarPDF}
      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
      title="Exportar a PDF"
    >
      <Download className="w-4 h-4" />
      Exportar PDF
    </button>
  );
};

export default ExportManager;