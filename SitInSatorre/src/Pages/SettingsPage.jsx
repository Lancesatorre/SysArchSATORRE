import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import AdminSettings from '../Admin/AdminSettings';
import StudentSettings from '../Student/StudentSettings';

export default function SettingsPage() {
  const user = authService.getUser();

  if (!authService.isLoggedIn() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <AdminSettings />;
  }

  return <Navigate to="/student/dashboard" replace />;
}
