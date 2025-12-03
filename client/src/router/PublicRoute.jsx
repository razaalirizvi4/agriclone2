import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/auth.service';

const PublicRoute = () => {
  const user = authService.getCurrentUser();
  if (user) {
    // If user is logged in but has not completed the farm wizard, send them to wizard first
    const id =
      user?._id || user?.id || user?.userId || user?.user?._id || null;

    let redirectPath = "/";

    if (id && typeof window !== "undefined") {
      const wizardKey = `farmWizardCompleted_${id}`;
      const hasCompletedWizard = localStorage.getItem(wizardKey) === "true";
      redirectPath = hasCompletedWizard ? "/" : "/wizard";
    }

    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};

export default PublicRoute;
