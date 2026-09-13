import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Layout from './components/Layout';
import Home from './pages/APP/Home';
import Login from './pages/APP/Login';
import Register from './pages/APP/Register';
import Products from './pages/product/Products';
import ProductDetail from './pages/product/ProductDetail';
import Cart from './pages/cart/Cart';
import PurchaseHistory from './pages/history/PurchaseHistory';
import Profile from './pages/profile/Profile';
import './App.css';

function Shell() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/purchase-history" element={<PurchaseHistory />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
      {isAuthenticated && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;