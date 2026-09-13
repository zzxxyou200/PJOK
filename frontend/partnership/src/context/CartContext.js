import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('accessToken');

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    let cancelled = false;
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/cart`, { headers: authHeaders() });
        if (res.status === 401) {
          if (!cancelled) setItems([]);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCart();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const addToCart = async (product, qty = 1, unitType = 'UNIT') => {
    if (!qty || qty < 1) return null;
    const data = await handleResponse(await fetch(`${API_URL}/cart`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ productId: product.productId, amount: qty, unitType }),
    }));
    setItems((prev) => {
      const exists = prev.some((i) => i.productId === data.productId && i.unitType === data.unitType);
      return exists
        ? prev.map((i) =>
            i.productId === data.productId && i.unitType === data.unitType ? data : i
          )
        : [...prev, data];
    });
    return data;
  };

  const updateQty = async (cartId, qty) => {
    if (qty <= 0) {
      await removeFromCart(cartId);
      return;
    }
    const data = await handleResponse(await fetch(`${API_URL}/cart/${cartId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ amount: qty }),
    }));
    if (data) {
      setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
    }
  };

  const removeFromCart = async (cartId) => {
    await handleResponse(await fetch(`${API_URL}/cart/${cartId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }));
    setItems((prev) => prev.filter((i) => i.id !== cartId));
  };

  const clearCart = async () => {
    await handleResponse(await fetch(`${API_URL}/cart`, {
      method: 'DELETE',
      headers: authHeaders(),
    }));
    setItems([]);
  };

  const value = useMemo(() => {
    const totalCount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPrice = items.reduce((sum, i) => sum + (i.amount || 0) * (Number(i.price) || 0), 0);
    return {
      items,
      loading,
      totalCount,
      totalPrice,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

export default CartContext;