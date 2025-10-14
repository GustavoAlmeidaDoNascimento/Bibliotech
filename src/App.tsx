import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import AppProviders from './providers/AppProviders';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';
import { publicRoutes, protectedRoutes, RedirectBasedOnAuth } from './config/routes';
import { ROUTES } from './constants';

const App: React.FC = () => {
  return (
    <AppProviders>
      <Router>
        <Routes>
          {/* Public routes */}
          {publicRoutes.map((route, index) => (
            <Route 
              key={index} 
              path={route.path} 
              element={route.element} 
            />
          ))}
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              {protectedRoutes.map((route, index) => (
                <Route 
                  key={index} 
                  path={route.path} 
                  element={route.element} 
                />
              ))}
            </Route>
          </Route>
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
        </Routes>
      </Router>
      <Analytics />
    </AppProviders>
  );
};

export default App;
