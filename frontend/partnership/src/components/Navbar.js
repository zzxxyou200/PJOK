import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AppBar, Toolbar, Button, Box, IconButton, Badge, alpha, Autocomplete,
  TextField, ListItem, ListItemText, CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search as SearchIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from './images/หน้าเว็บสั่งซื้อสินค้า.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const SearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.common.black, 0.06),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.1),
  },
  flexGrow: 1,
  maxWidth: 380,
  pl: 2,
  pr: 1,
}));

function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState((searchParams.get('q') || '').trim());
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = inputValue.trim();
      if (!isAuthenticated || !q) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      fetchSuggestions(q);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, isAuthenticated]);

  const fetchSuggestions = async (q) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `${API_URL}/products/search?search=${encodeURIComponent(q)}&limit=6`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setOpen(true);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const goSearch = (value) => {
    const q = value.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    setOpen(false);
  };

  const formatPrice = (price) =>
    price == null ? 'N/A' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
    }).format(price);

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
    ...(isAdmin ? [{ label: 'จัดการคำสั่งซื้อ', to: '/admin/orders' }] : []),
    ...(isAdmin ? [{ label: 'สรุปหน่วยงาน', to: '/admin/organizations' }] : []),
    ...(isAdmin ? [{ label: 'สรุปยอดขายประจำวัน', to: '/admin/sales/daily' }] : []),
    ...(isAdmin ? [{ label: 'สรุปยอดสินค้า', to: '/admin/products/summary' }] : []),
  ];

  return (
<AppBar
  position="static"
  className="appbar"
  sx={{
    backgroundColor: '#2b2929FFF',
    color: '#000000',
  }}
>      <Toolbar>
        <Button component={RouterLink} to="/home" className="appbar-brand">
          <Box component="img" src={logo} alt="SomeShop" className="appbar-brand-logo" />
          SomeShop
        </Button>
        {isAuthenticated && (
          <SearchBox>
            <Autocomplete
              freeSolo
              disableClearable
              fullWidth
              options={suggestions}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.productName || ''
              }
              popupIcon={null}
              inputValue={inputValue}
              onInputChange={(event, newValue) => setInputValue(newValue)}
              onChange={(event, value) => {
                if (value && typeof value !== 'string') {
                  goSearch(value.productName);
                } else {
                  goSearch(inputValue);
                }
              }}
              onOpen={() => setOpen(true)}
              onClose={() => setOpen(false)}
              open={open}
              loading={loadingSuggestions}
              noOptionsText="No products found"
              loadingText="Searching..."
              renderOption={(props, option) => (
                <ListItem {...props} component="div" dense>
                  <ListItemText
                    primary={option.productName}
                    secondary={`SN: ${option.serialNumber} · ${formatPrice(option.price)}`}
                    primaryTypographyProps={{ color: 'text.primary' }}
                  />
                </ListItem>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search products..."
                  size="small"
                  variant="standard"
                  sx={{
                    flexGrow: 1,
                    py: 0.4,
                    fontSize: '0.9rem',
                    '& .MuiInputBase-root': { color: '#2b2929' },
                    '& .MuiInput-underline:before, & .MuiInput-underline:after': {
                      borderBottom: 'none',
                    },
                  }}
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': 'search',
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: loadingSuggestions ? (
                      <CircularProgress size={18} sx={{ color: '#2b2929', mr: 1 }} />
                    ) : null,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goSearch(inputValue);
                    }
                  }}
                  onFocus={() => {
                    const q = inputValue.trim();
                    if (q) {
                      fetchSuggestions(q);
                    } else {
                      setSuggestions([]);
                    }
                  }}
                />
              )}
            />
            <IconButton
              size="small"
              onClick={() => goSearch(inputValue)}
              sx={{ color: '#2b2929' }}
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