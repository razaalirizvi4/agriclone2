import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/auth.service';

const ProtectedRoute = () => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
