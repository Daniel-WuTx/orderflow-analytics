import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar    from './components/Navbar';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Products  from './pages/Products';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"         element={<Navigate to="/products" />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/dashboard" element={
            <PrivateRoute adminOnly>
              <Dashboard />
            </PrivateRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}