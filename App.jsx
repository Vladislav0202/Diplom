import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Meters from './pages/Meters';
import Tickets from './pages/Tickets';
import Voting from './pages/Voting';
import News from './pages/News';
import Security from './pages/Security';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentUser } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={currentUser?.role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />} />
        <Route path="finance" element={<Finance />} />
        <Route path="meters" element={<Meters />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="voting" element={<Voting />} />
        <Route path="news" element={<News />} />
        <Route path="security" element={<Security />} />
        <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
