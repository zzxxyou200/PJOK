import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Button, Box,
} from '@mui/material';
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
    <AppBar position="static">
      <Toolbar>
        <Button component={RouterLink} to="/" color="inherit" sx={{ fontWeight: 'bold', mr: 2 }}>
          SomeShop
        </Button>
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {isAuthenticated && menuItems.map((item) => (
            <Button key={item.to} component={RouterLink} to={item.to} color="inherit">
              {item.label}
            </Button>
          ))}
        </Box>
        {isAuthenticated ? (
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <>
            <Button component={RouterLink} to="/login" color="inherit">
              Login
            </Button>
            <Button component={RouterLink} to="/register" color="inherit">
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;