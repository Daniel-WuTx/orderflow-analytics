import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const { data } = await api.get('/cart');
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    await api.post('/cart/items', { product_id: productId, quantity });
    await fetchCart();
  };

  const updateItem = async (productId, quantity) => {
    await api.patch(`/cart/items/${productId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (productId) => {
    await api.delete(`/cart/items/${productId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setItems([]);
  };

  const checkout = async () => {
    const { data } = await api.post('/cart/checkout');
    setItems([]);
    return data;
  };

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = items.reduce((acc, i) => acc + i.quantity * parseFloat(i.price || i.unitPrice || 0), 0);

  return (
    <CartContext.Provider value={{
      items, loading, totalItems, totalPrice,
      fetchCart, addItem, updateItem, removeItem, clearCart, checkout
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);