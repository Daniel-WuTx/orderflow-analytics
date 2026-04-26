// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar    from './components/Navbar';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Products  from './pages/Products';
import Dashboard from './pages/Dashboard';
import Users     from './pages/Users';
import Cart      from './pages/Cart';
import Orders    from './pages/Orders';
import Profile   from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/"          element={<Navigate to="/products" />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="/products"  element={<Products />} />
            <Route path="/cart"      element={<Cart />} />
            <Route path="/orders"    element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute adminOnly><Dashboard /></PrivateRoute>} />
            <Route path="/users"     element={<PrivateRoute adminOnly><Users /></PrivateRoute>} />
            <Route path="*"          element={<Navigate to="/products" />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}