import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await cartService.getCart();
      const items = res.data?.items || res.items || [];
      
      // Count distinct product items as requested (e.g., 2 pants + 1 shirt = 2 items)
      setCartCount(items.length);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Automatically refresh when user changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value = useMemo(() => ({
    cartCount,
    loading,
    refreshCart
  }), [cartCount, loading, refreshCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
