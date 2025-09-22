import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/auth.service';

const PublicRoute = () => {
  const user = authService.getCurrentUser();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default PublicRoute;
