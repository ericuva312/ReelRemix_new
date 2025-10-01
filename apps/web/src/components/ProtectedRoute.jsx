import React from 'react';
import ApiService from '../services/api.js';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = ApiService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    window.location.href = '/auth';
    return null;
  }
  
  return children;
};

export default ProtectedRoute;
