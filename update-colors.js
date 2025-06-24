#!/usr/bin/env node

/**
 * Script de Actualización Automática de Colores
 * Sistema de Control de Transmisiones
 * 
 * Este script actualiza automáticamente la paleta de colores en todo el proyecto
 */

const fs = require('fs');
const path = require('path');

// Configuración de colores a reemplazar
const colorMappings = {
  // Colores principales (rojo -> verde esmeralda)
  'bg-red-500': 'bg-emerald-500',
  'bg-red-600': 'bg-emerald-600',
  'bg-red-700': 'bg-emerald-700',
  'text-red-500': 'text-emerald-500',
  'text-red-600': 'text-emerald-600',
  'border-red-500': 'border-emerald-500',
  'border-red-600': 'border-emerald-600',
  'hover:bg-red-600': 'hover:bg-emerald-600',
  'hover:text-red-600': 'hover:text-emerald-600',
  'focus:ring-red-500': 'focus:ring-emerald-500',
  'focus:border-red-500': 'focus:border-emerald-500',
  
  // Colores secundarios (azul -> púrpura)
  'bg-blue-600': 'bg-violet-600',
  'bg-blue-700': 'bg-purple-700',
  'bg-blue-800': 'bg-purple-800',
  'text-blue-600': 'text-violet-600',
  'text-blue-700': 'text-purple-700',
  'border-blue-600': 'border-violet-600',
  'from-blue-600': 'from-violet-600',
  'to-blue-700': 'to-purple-700',
  'via-blue-700': 'via-purple-700',
  'hover:bg-blue-700': 'hover:bg-purple-700',
  
  // Variables CSS
  '--color-primary: #ef4444': '--color-primary: #10B981',
  '--color-primary: #DC2626': '--color-primary: #10B981',
  '--color-primary-hover: #dc2626': '--color-primary-hover: #059669',
  '--color-secondary: #2563eb': '--color-secondary: #7C3AED',
  '--color-secondary: #1d4ed8': '--color-secondary: #7C3AED',
  '--color-secondary-hover: #1d4ed8': '--color-secondary-hover: #6D28D9',
  
  // Colores hexadecimales directos
  '#ef4444': '#10B981',
  '#dc2626': '#059669',
  '#b91c1c': '#047857',
  '#2563eb': '#7C3AED',
  '#1d4ed8': '#6D28D9',
  '#1e40af': '#5B21B6',
  
  // Gradientes CSS
  'linear-gradient(to bottom, #2563eb, #1d4ed8)': 'linear-gradient(to bottom, #7C3AED, #6D28D9)',
  'linear-gradient(135deg, #ef4444, #dc2626)': 'linear-gradient(135deg, #10B981, #059669)',
  'bg-gradient-to-b from-blue-600 to-blue-700': 'bg-gradient-to-b from-violet-600 to-purple-700',
  'bg-gradient-to-r from-red-500 to-red-600': 'bg-gradient-to-r from-emerald-500 to-emerald-600',
};

// Archivos y directorios a procesar
const filesToProcess = [
  'src/**/*.js',
  'src/**/*.jsx',
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.css',
  'src/**/*.scss',
  'tailwind.config.js',
  'postcss.config.js'
];

// Función para obtener todos los archivos que coinciden con los patrones
function getFilesRecursively(dir, pattern) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...getFilesRecursively(fullPath, pattern));
    } else if (stat.isFile() && matchesPattern(item, pattern)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function matchesPattern(filename, pattern) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'];
  return extensions.some(ext => filename.endsWith(ext)) || 
         filename === 'tailwind.config.js' || 
         filename === 'postcss.config.js';
}

// Función para actualizar un archivo
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Aplicar todas las transformaciones
    for (const [oldColor, newColor] of Object.entries(colorMappings)) {
      if (content.includes(oldColor)) {
        content = content.replace(new RegExp(escapeRegExp(oldColor), 'g'), newColor);
        hasChanges = true;
        console.log(`✓ Reemplazado "${oldColor}" -> "${newColor}" en ${filePath}`);
      }
    }
    
    // Guardar archivo si hubo cambios
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Función para escapar caracteres especiales en regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Función principal
function updateColorPalette() {
  console.log('🎨 Iniciando actualización de paleta de colores...\n');
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  // Procesar archivos en src/
  if (fs.existsSync('src')) {
    const srcFiles = getFilesRecursively('src', '**/*');
    for (const file of srcFiles) {
      totalFiles++;
      if (updateFile(file)) {
        updatedFiles++;
      }
    }
  }
  
  // Procesar archivos de configuración en la raíz
  const configFiles = ['tailwind.config.js', 'postcss.config.js'];
  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      totalFiles++;
      if (updateFile(configFile)) {
        updatedFiles++;
      }
    }
  }
  
  console.log(`\n📊 Resumen de actualización:`);
  console.log(`   Archivos procesados: ${totalFiles}`);
  console.log(`   Archivos actualizados: ${updatedFiles}`);
  console.log(`   Archivos sin cambios: ${totalFiles - updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log('\n✅ ¡Actualización de colores completada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Revisar los cambios con: git diff');
    console.log('   2. Ejecutar: npm install (si es necesario)');
    console.log('   3. Ejecutar: npm start para probar los cambios');
    console.log('   4. Commit los cambios: git add . && git commit -m "feat: actualizar paleta de colores"');
  } else {
    console.log('\n⚠️  No se encontraron archivos para actualizar.');
    console.log('   Verifica que estés en el directorio correcto del proyecto.');
  }
}

// Función para crear backup
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backup-${timestamp}`;
  
  console.log(`📦 Creando backup en ${backupDir}...`);
  
  try {
    // Crear directorio de backup
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Copiar archivos importantes
    const importantFiles = [
      'src',
      'tailwind.config.js',
      'postcss.config.js',
      'package.json'
    ];
    
    for (const item of importantFiles) {
      if (fs.existsSync(item)) {
        const stat = fs.statSync(item);
        if (stat.isDirectory()) {
          copyDir(item, path.join(backupDir, item));
        } else {
          fs.copyFileSync(item, path.join(backupDir, item));
        }
      }
    }
    
    console.log(`✅ Backup creado exitosamente en ${backupDir}`);
    return backupDir;
  } catch (error) {
    console.error('❌ Error creando backup:', error.message);
    return null;
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Ejecutar script
if (require.main === module) {
  console.log('🎨 Sistema de Control de Transmisiones - Actualizador de Colores\n');
  
  // Verificar que estamos en un proyecto React
  if (!fs.existsSync('package.json')) {
    console.error('❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto.');
    process.exit(1);
  }
  
  // Crear backup antes de los cambios
  const backupDir = createBackup();
  
  if (backupDir) {
    console.log('\n🔄 Procesando archivos...\n');
    updateColorPalette();
  } else {
    console.log('\n⚠️  Continuando sin backup...\n');
    updateColorPalette();
  }
}

module.exports = {
  updateColorPalette,
  colorMappings
};