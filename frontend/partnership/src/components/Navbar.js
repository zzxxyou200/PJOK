import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AppBar, Toolbar, Button, Box, InputBase, IconButton, Badge, alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search as SearchIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from './images/หน้าเว็บสั่งซื้อสินค้า.png';

const SearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  flexGrow: 1,
  maxWidth: 380,
  pl: 2,
  pr: 1,
}));

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      applySearch(query);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const applySearch = (value) => {
    const trimmed = value.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed }, { replace: true });
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete('q');
      setSearchParams(params, { replace: true });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home', to: '/home' },
    { label: 'Products', to: '/products' },
    { label: 'ตะกร้าสินค้า', to: '/cart' },
    { label: 'ประวัติการซื้อ', to: '/purchase-history' },
    { label: 'Profile', to: '/profile' },
  ];

  return (
    <AppBar position="static" className="appbar">
      <Toolbar>
        <Button component={RouterLink} to="/home" className="appbar-brand">
          <Box component="img" src={logo} alt="SomeShop" className="appbar-brand-logo" />
          SomeShop
        </Button>
        {isAuthenticated && (
          <SearchBox>
            <InputBase
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                color: '#fff',
                flexGrow: 1,
                py: 0.4,
                fontSize: '0.9rem',
              }}
              inputProps={{ 'aria-label': 'search' }}
            />
            <IconButton
              size="small"
              onClick={() => applySearch(query)}
              sx={{ color: '#fff' }}
              aria-label="search"
            >
              <SearchIcon />
            </IconButton>
          </SearchBox>
        )}
        <Box className="appbar-links">
          {isAuthenticated && menuItems.map((item) => (
            item.to === '/cart' ? (
              <Button key={item.to} component={RouterLink} to={item.to} className="appbar-link">
                <Badge badgeContent={totalCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
                <Box component="span" sx={{ ml: 0.6 }}>
                  {item.label}
                </Box>
              </Button>
            ) : (
              <Button key={item.to} component={RouterLink} to={item.to} className="appbar-link">
                {item.label}
              </Button>
            )
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