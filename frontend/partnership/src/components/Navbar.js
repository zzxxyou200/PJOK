import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Button, Box,
} from '@mui/material';
import { Storefront } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'ตะกร้าสินค้า', to: '/cart' },
    { label: 'ประวัติการซื้อ', to: '/purchase-history' },
    { label: 'Profile', to: '/profile' },
  ];

  return (
    <AppBar position="static" className="appbar">
      <Toolbar>
        <Button component={RouterLink} to="/" className="appbar-brand">
          <Storefront className="appbar-brand-icon" />
          SomeShop
        </Button>
        <Box className="appbar-links">
          {isAuthenticated && menuItems.map((item) => (
            <Button key={item.to} component={RouterLink} to={item.to} className="appbar-link">
              {item.label}
            </Button>
          ))}
        </Box>
        {isAuthenticated ? (
          <Button className="appbar-link appbar-logout" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <Box className="appbar-auth">
            <Button component={RouterLink} to="/login" className="appbar-link">
              Login
            </Button>
            <Button component={RouterLink} to="/register" className="appbar-link appbar-register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;