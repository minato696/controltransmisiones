// src/components/ExportManager.js
import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileImage } from 'lucide-react';

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
  formatearFecha 
}) => {
  const [mostrarMenuExportar, setMostrarMenuExportar] = useState(false);
  const [cargandoExcel, setCargandoExcel] = useState(false);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (mostrarMenuExportar && !event.target.closest('.export-menu-container')) {
        setMostrarMenuExportar(false);
      }
    };

    document.addEventListener('mousedown', manejarClickFuera);
    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
    };
  }, [mostrarMenuExportar]);

  // Cargar SheetJS de forma segura
  const cargarSheetJS = async () => {
    try {
      if (window.XLSX) {
        return window.XLSX;
      }

      setCargandoExcel(true);

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => {
          if (window.XLSX) {
            resolve(window.XLSX);
          } else {
            reject(new Error('XLSX no se cargó correctamente'));
          }
        };
        script.onerror = () => reject(new Error('Error al cargar la librería XLSX'));
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Error al cargar SheetJS:', error);
      throw error;
    } finally {
      setCargandoExcel(false);
    }
  };

  // Exportar datos a Excel
  const exportarExcel = async () => {
    try {
      const XLSX = await cargarSheetJS();
      
      const workbook = XLSX.utils.book_new();
      
      // Crear datos para la hoja principal
      const datosExcel = [];
      
      // Header con información del reporte
      datosExcel.push([
        'CONTROL DE TRANSMISIONES EXITOSA - PERÚ',
        '', '', '', '', '', '', ''
      ]);
      datosExcel.push([
        `Programa: ${programaActivo.nombre}`,
        `Horario: ${programaActivo.horario}`,
        '', '', '', '', '', ''
      ]);
      datosExcel.push([
        modoVista === 'semana' 
          ? `Período: ${formatearFecha(semanaActual.inicio)} al ${formatearFecha(semanaActual.fin)}`
          : `Fecha: ${formatearFecha(fechaSeleccionada)}`,
        '', '', '', '', '', '', ''
      ]);
      datosExcel.push([
        `Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`,
        '', '', '', '', '', '', ''
      ]);
      datosExcel.push([]); // Línea vacía
      
      // Headers de la tabla
      if (modoVista === 'semana') {
        datosExcel.push([
          'Ciudad',
          'Lunes ' + formatearFecha(semanaActual.fechas[0]),
          'Martes ' + formatearFecha(semanaActual.fechas[1]),
          'Miércoles ' + formatearFecha(semanaActual.fechas[2]),
          'Jueves ' + formatearFecha(semanaActual.fechas[3]),
          'Viernes ' + formatearFecha(semanaActual.fechas[4])
        ]);
      } else {
        const diaNombre = diasSemana[fechaSeleccionada.getDay() === 0 ? 6 : fechaSeleccionada.getDay() - 1] || 'Domingo';
        datosExcel.push([
          'Ciudad',
          `${diaNombre} ${formatearFecha(fechaSeleccionada)}`,
          'Hora Real',
          'Motivo'
        ]);
      }
      
      // Datos de las ciudades
      filialesFiltradas.forEach(filial => {
        if (modoVista === 'semana') {
          const fila = [filial.nombre];
          
          // Estados para cada día de la semana
          semanaActual.fechas.forEach(fecha => {
            const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fecha);
            let estadoTexto = '';
            
            switch (reporte.estado) {
              case 'si':
                estadoTexto = `✓ Transmitió ${reporte.horaReal ? `(${reporte.horaReal})` : ''}`;
                break;
              case 'no':
                estadoTexto = `✗ No transmitió${reporte.motivo ? ` - ${reporte.motivo}` : ''}`;
                break;
              case 'tarde':
                estadoTexto = `⏰ Transmitio Tarde${reporte.horaReal ? ` (${reporte.horaReal})` : ''}${reporte.motivo ? ` - ${reporte.motivo}` : ''}`;
                break;
              default:
                estadoTexto = '⏳ Pendiente';
            }
            
            fila.push(estadoTexto);
          });
          
          datosExcel.push(fila);
        } else {
          // Vista diaria
          const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fechaSeleccionada);
          let estadoTexto = '';
          
          switch (reporte.estado) {
            case 'si':
              estadoTexto = '✓ Transmitió';
              break;
            case 'no':
              estadoTexto = '✗ No transmitió';
              break;
            case 'tarde':
              estadoTexto = '⏰ Transmitio Tarde';
              break;
            default:
              estadoTexto = '⏳ Pendiente';
          }
          
          datosExcel.push([
            filial.nombre,
            estadoTexto,
            reporte.horaReal || '',
            reporte.motivo || ''
          ]);
        }
      });
      
      // Agregar estadísticas al final
      datosExcel.push([]); // Línea vacía
      datosExcel.push(['ESTADÍSTICAS DEL PERÍODO']);
      datosExcel.push(['Total de transmisiones programadas:', stats.total]);
      datosExcel.push(['Transmisiones exitosas:', stats.transmitidas]);
      datosExcel.push(['No transmitidas:', stats.noTransmitidas]);
      datosExcel.push(['Transmisiones tardías:', stats.tardias]);
      datosExcel.push(['Pendientes:', stats.pendientes]);
      datosExcel.push(['Porcentaje de efectividad:', `${stats.total > 0 ? Math.round((stats.transmitidas / stats.total) * 100) : 0}%`]);
      
      // Crear la hoja de cálculo
      const worksheet = XLSX.utils.aoa_to_sheet(datosExcel);
      
      // Configurar anchos de columna
      const colWidths = modoVista === 'semana' 
        ? [{ wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }]
        : [{ wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 40 }];
      
      worksheet['!cols'] = colWidths;
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transmisiones');
      
      // Crear una segunda hoja solo con notas generales si existen
      const notasConContenido = filiales.filter(f => obtenerNotaGeneral(f.id).length > 0);
      if (notasConContenido.length > 0) {
        const datosNotas = [];
        datosNotas.push(['NOTAS GENERALES POR CIUDAD']);
        datosNotas.push([modoVista === 'semana' 
          ? `Semana: ${formatearFecha(semanaActual.inicio)} al ${formatearFecha(semanaActual.fin)}`
          : `Fecha: ${formatearFecha(fechaSeleccionada)}`
        ]);
        datosNotas.push([]);
        datosNotas.push(['Ciudad', 'Observaciones']);
        
        notasConContenido.forEach(filial => {
          const nota = obtenerNotaGeneral(filial.id);
          datosNotas.push([filial.nombre, nota]);
        });
        
        const worksheetNotas = XLSX.utils.aoa_to_sheet(datosNotas);
        worksheetNotas['!cols'] = [{ wch: 15 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(workbook, worksheetNotas, 'Notas Generales');
      }
      
      // Generar el archivo
      const nombreArchivo = modoVista === 'dia' 
        ? `transmisiones_${programaActivo.nombre.replace(/\s+/g, '_')}_${formatearFecha(fechaSeleccionada).replace(/\//g, '-')}.xlsx`
        : `transmisiones_${programaActivo.nombre.replace(/\s+/g, '_')}_semana_${formatearFecha(semanaActual.inicio).replace(/\//g, '-')}.xlsx`;
      
      XLSX.writeFile(workbook, nombreArchivo);
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel. Verifica tu conexión a internet e inténtalo de nuevo.');
    }
  };

  // Exportar datos a PDF
  const exportarPDF = () => {
    try {
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
      
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Error al exportar a PDF. Por favor, inténtalo de nuevo.');
    }
  };

  // Generar HTML para PDF
  const generarHTMLParaPDF = () => {
    const fecha = new Date().toLocaleDateString('es-PE');
    const hora = new Date().toLocaleTimeString('es-PE');
    
    let tablaHTML = '';
    
    if (modoVista === 'semana') {
      // Tabla semanal
      tablaHTML = `
        <table>
          <thead>
            <tr>
              <th>Ciudad</th>
              <th>Lunes<br><small>${formatearFecha(semanaActual.fechas[0])}</small></th>
              <th>Martes<br><small>${formatearFecha(semanaActual.fechas[1])}</small></th>
              <th>Miércoles<br><small>${formatearFecha(semanaActual.fechas[2])}</small></th>
              <th>Jueves<br><small>${formatearFecha(semanaActual.fechas[3])}</small></th>
              <th>Viernes<br><small>${formatearFecha(semanaActual.fechas[4])}</small></th>
            </tr>
          </thead>
          <tbody>
            ${filialesFiltradas.map(filial => {
              const estadosCeldas = semanaActual.fechas.map(fecha => {
                const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fecha);
                let clase = '';
                let texto = '';
                
                switch (reporte.estado) {
                  case 'si':
                    clase = 'exitoso';
                    texto = '✓';
                    break;
                  case 'no':
                    clase = 'fallo';
                    texto = '✗';
                    break;
                  case 'tarde':
                    clase = 'tardio';
                    texto = '⏰';
                    break;
                  default:
                    clase = 'pendiente';
                    texto = '⏳';
                }
                
                return `<td class="${clase}">${texto}</td>`;
              }).join('');
              
              return `<tr><td class="ciudad">${filial.nombre}</td>${estadosCeldas}</tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      // Tabla diaria
      tablaHTML = `
        <table>
          <thead>
            <tr>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Hora Real</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${filialesFiltradas.map(filial => {
              const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fechaSeleccionada);
              let estadoTexto = '';
              let clase = '';
              
              switch (reporte.estado) {
                case 'si':
                  estadoTexto = '✓ Transmitió';
                  clase = 'exitoso';
                  break;
                case 'no':
                  estadoTexto = '✗ No transmitió';
                  clase = 'fallo';
                  break;
                case 'tarde':
                  estadoTexto = '⏰ Transmitio Tarde';
                  clase = 'tardio';
                  break;
                default:
                  estadoTexto = '⏳ Pendiente';
                  clase = 'pendiente';
              }
              
              return `
                <tr>
                  <td class="ciudad">${filial.nombre}</td>
                  <td class="${clase}">${estadoTexto}</td>
                  <td>${reporte.horaReal || '-'}</td>
                  <td>${reporte.motivo || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    // Generar sección de notas generales si existen
    const notasConContenido = filiales.filter(f => obtenerNotaGeneral(f.id).length > 0);
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
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Control de Transmisiones EXITOSA</title>
        <style>
          @page {
            margin: 2cm;
            size: A4;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1e40af;
          }
          
          .header h1 {
            color: #1e40af;
            font-size: 24px;
            margin: 0 0 10px 0;
            font-weight: bold;
          }
          
          .header .info {
            font-size: 14px;
            margin: 5px 0;
          }
          
          .header .programa {
            font-size: 18px;
            font-weight: bold;
            color: #dc2626;
            margin: 10px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 11px;
          }
          
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
          }
          
          th {
            background-color: #1e40af;
            color: white;
            font-weight: bold;
            font-size: 12px;
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
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-top: 20px;
          }
          
          .estadisticas h3 {
            color: #1e40af;
            margin-top: 0;
            margin-bottom: 15px;
          }
          
          .estadisticas-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          
          .estadistica-item {
            text-align: center;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          
          .estadistica-numero {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .estadistica-label {
            font-size: 11px;
            color: #64748b;
          }
          
          .seccion-notas {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          
          .seccion-notas h3 {
            color: #1e40af;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          .nota-ciudad {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            page-break-inside: avoid;
          }
          
          .nota-ciudad h4 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 14px;
          }
          
          .nota-ciudad p {
            margin: 0;
            line-height: 1.6;
            white-space: pre-wrap;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
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
          <div class="programa">${programaActivo.nombre} - ${programaActivo.horario}</div>
          <div class="info">
            ${modoVista === 'semana' 
              ? `Período: ${formatearFecha(semanaActual.inicio)} al ${formatearFecha(semanaActual.fin)}`
              : `Fecha: ${formatearFecha(fechaSeleccionada)}`
            }
          </div>
          <div class="info">Generado: ${fecha} ${hora}</div>
        </div>
        
        ${tablaHTML}
        
        <div class="estadisticas">
          <h3>Estadísticas del Período</h3>
          <div class="estadisticas-grid">
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #1e40af">${stats.total}</div>
              <div class="estadistica-label">Total Programadas</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #16a34a">${stats.transmitidas}</div>
              <div class="estadistica-label">Exitosas</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #dc2626">${stats.noTransmitidas}</div>
              <div class="estadistica-label">No Transmitidas</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #ca8a04">${stats.tardias}</div>
              <div class="estadistica-label">Tardías</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #64748b">${stats.pendientes}</div>
              <div class="estadistica-label">Pendientes</div>
            </div>
            <div class="estadistica-item">
              <div class="estadistica-numero" style="color: #1e40af">${stats.total > 0 ? Math.round((stats.transmitidas / stats.total) * 100) : 0}%</div>
              <div class="estadistica-label">Efectividad</div>
            </div>
          </div>
        </div>
        
        ${seccionNotas}
        
        <div class="footer">
          <p>Sistema de Control de Transmisiones EXITOSA - Generado automáticamente</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="export-menu-container relative">
      <button 
        onClick={() => setMostrarMenuExportar(!mostrarMenuExportar)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        disabled={cargandoExcel}
      >
        <Download className="w-4 h-4" />
        {cargandoExcel ? 'Cargando...' : 'Exportar'}
      </button>
      
      {mostrarMenuExportar && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
          <div className="py-1">
            <button
              onClick={() => {
                exportarExcel();
                setMostrarMenuExportar(false);
              }}
              disabled={cargandoExcel}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Exportar a Excel
            </button>
            <button
              onClick={() => {
                exportarPDF();
                setMostrarMenuExportar(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <FileImage className="w-4 h-4 text-red-600" />
              Exportar a PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportManager;