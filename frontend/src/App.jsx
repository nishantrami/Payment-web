import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './layouts/AdminLayout';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerManagement from './pages/CustomerManagement';
import PlansManagement from './pages/PlansManagement';
import AdminPayments from './pages/AdminPayments';
import AdminUserManagement from './pages/AdminUserManagement';
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard'} />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useContext(AuthContext);
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard') : "/login"} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roleRequired="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="plans" element={<PlansManagement />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="users" element={<AdminUserManagement />} />
      </Route>

      {/* Customer Routes */}
      <Route path="/customer/dashboard" element={<ProtectedRoute roleRequired="CUSTOMER"><CustomerDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
