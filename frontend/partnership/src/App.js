import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Layout from './components/Layout';
import Home from './pages/APP/Home';
import Login from './pages/APP/Login';
import Register from './pages/APP/Register';
import Products from './pages/product/Products';
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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
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
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;