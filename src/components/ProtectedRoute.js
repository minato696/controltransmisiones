// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Componente ProtectedRoute actualizado para sistema dual de autenticación
 * 
 * Tipos de protección:
 * - 'user': Solo usuarios regulares (exitosa/147ABC55)
 * - 'admin': Solo administradores 
 * - 'any': Cualquier tipo de usuario autenticado (por defecto)
 */

const ProtectedRoute = ({ 
  children, 
  requireAuth = 'any', // 'user', 'admin', 'any'
  redirectTo = null // Ruta personalizada de redirección
}) => {
  const location = useLocation();
  
  // Verificar autenticación de usuarios regulares
  const isUserAuthenticated = localStorage.getItem('user_authenticated') === 'true';
  
  // Verificar autenticación de administradores
  const isAdminAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
  
  // Determinar si el usuario actual cumple con los requisitos
  let hasAccess = false;
  let defaultRedirect = '/login'; // Por defecto, redirigir a login de usuarios
  
  switch (requireAuth) {
    case 'user':
      // Solo usuarios regulares pueden acceder
      hasAccess = isUserAuthenticated;
      defaultRedirect = '/login';
      break;
      
    case 'admin':
      // Solo administradores pueden acceder
      hasAccess = isAdminAuthenticated;
      defaultRedirect = '/admin';
      break;
      
    case 'any':
    default:
      // Cualquier usuario autenticado puede acceder
      hasAccess = isUserAuthenticated || isAdminAuthenticated;
      // Si no está autenticado, redirigir al login apropiado
      // Por defecto: login de usuarios para acceso general
      defaultRedirect = '/login';
      break;
  }
  
  // Si no tiene acceso, redirigir
  if (!hasAccess) {
    const redirectPath = redirectTo || defaultRedirect;
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }
  
  return children;
};

// ==================== COMPONENTES ESPECÍFICOS ====================

// Componente para rutas que requieren específicamente usuarios regulares
export const UserProtectedRoute = ({ children, redirectTo = '/login' }) => {
  return (
    <ProtectedRoute requireAuth="user" redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

// Componente para rutas que requieren específicamente administradores
export const AdminProtectedRoute = ({ children, redirectTo = '/admin' }) => {
  return (
    <ProtectedRoute requireAuth="admin" redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

// Componente para rutas que requieren cualquier tipo de autenticación
export const AnyUserProtectedRoute = ({ children, redirectTo = '/login' }) => {
  return (
    <ProtectedRoute requireAuth="any" redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;