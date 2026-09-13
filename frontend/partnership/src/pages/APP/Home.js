import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Typography, Card, CardMedia, CardContent, CardActions, Chip,
  CircularProgress, Alert, Paper, FormControl, InputLabel, Select, MenuItem, Snackbar,
} from '@mui/material';
import { Storefront, ShoppingCart } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const CATEGORIES = ['All', 'Accessories', 'Consumables', 'Electronics', 'Spare Parts'];

const SORT_OPTIONS = [
  { value: 'none', label: 'Sort by...' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'sales-desc', label: 'Sales: Most First' },
  { value: 'sales-asc', label: 'Sales: Least First' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

function Home() {
  const { isAuthenticated, logout } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, name: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('q') || '').trim();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const url = selectedCategory === 'All'
          ? `${API_URL}/products/priced`
          : `${API_URL}/products/priced?category=${encodeURIComponent(selectedCategory)}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          setError('Failed to load products');
          return;
        }

        const data = await response.json();
        setProducts(data);
        setError('');
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthenticated, selectedCategory, logout, navigate]);

  const formatPrice = (price) =>
    price == null ? 'N/A' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
    }).format(price);

  const statusColor = (status) =>
    status === 'AVAILABLE' ? 'success'
      : status === 'RESERVED' ? 'warning'
      : status === 'SOLD' ? 'error'
      : 'default';

  const sortedProducts = useMemo(() => {
    if (sortBy === 'none') return products;
    const [field, dir] = sortBy.split('-');
    const arr = [...products];
    arr.sort((a, b) => {
      let cmp = 0;
      if (field === 'name') {
        cmp = String(a.productName || '').localeCompare(String(b.productName || ''));
      } else if (field === 'price') {
        cmp = (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
      } else if (field === 'sales') {
        cmp = (a.totalSold ?? 0) - (b.totalSold ?? 0);
      }
      return dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [products, sortBy]);

  const visibleProducts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return sortedProducts;
    return sortedProducts.filter((p) =>
      String(p.productName || '').toLowerCase().includes(q) ||
      String(p.serialNumber || '').toLowerCase().includes(q) ||
      String(p.category || '').toLowerCase().includes(q) ||
      (p.categories || []).some((c) => String(c).toLowerCase().includes(q))
    );
  }, [sortedProducts, searchTerm]);

  return (
    <div className="page home-page">
<Paper
  elevation={0}
  className="home-hero"
  sx={{
    background: 'linear-gradient(135deg, #09004d 0%, #16149b 100%)',
    borderRadius: 9,
    color: '#ffffff',
    textAlign: 'left',
    p: 5, // Recommended: adds padding inside the rounded paper
  }}
>
  {/* <Storefront className="home-hero-icon" /> */}
  <Typography variant="h3" component="h1" className="home-hero-title">
    ศูนย์รวมวัสดุสำนักงาน วัสดุหมึกปริ้นเตอร์ วัสดุงานบ้านงานครัว และวัสดุคอมพิวเตอร์สำหรับสำนักงาน
  </Typography>
<Typography 
  variant="h6" 
  component="h1" 
  className="home-hero-subtitle"
  sx={{ fontWeight: 'bold' }} // หรือ fontWeight: 700
>
  สั่งวันนี้ - พรุ่งนี้ถึง
</Typography>
  <Typography variant="h6" className="home-hero-subtitle">
    บริการจัดส่งพัสดุสำหรับ อบต. , เทศบาล , โรงเรียน , โรงพยาบาล ฯลฯ สั่งซื้อรูปแบบเครดิต ไม่ต้องชำระเงินทันที พร้อมออก QR Code เช็คติดตามสถานะพัสดุ และพิมพ์ใบขอเบิกพัสดุราชการมาตรฐาน
  </Typography>
</Paper>

      {!isAuthenticated ? (
        <Box className="home-empty">
          <Typography variant="body1">Please log in to see available products.</Typography>
        </Box>
      ) : (
        <Box className="home-content">
          {error && <Alert severity="error" className="home-alert">{error}</Alert>}

          <Box className="category-bar">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                size="small"
                className="category-pill"
                variant={selectedCategory === category ? 'contained' : 'outlined'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
            <Box className="category-bar-sort">
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel id="sort-label">Sort by</InputLabel>
                <Select
                  labelId="sort-label"
                  label="Sort by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {loading ? (
            <Box className="home-loading">
              <CircularProgress />
            </Box>
          ) : visibleProducts.length === 0 ? (
            <Box className="home-empty">
              <Typography variant="body1">
                {searchTerm
                  ? `No products match "${searchTerm}".`
                  : selectedCategory === 'All'
                    ? 'No products with pricing available for your organization.'
                    : 'No products in this category.'}
              </Typography>
            </Box>
          ) : (
            <Box className="product-grid">
              {visibleProducts.map((p) => {
                const image = p.images?.split(',')[0]?.trim();
                return (
                  <Card
                    className="product-card"
                    key={p.productId}
                    onClick={() => navigate(`/products/${p.productId}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box className="product-card-media">
                      {image ? (
                        <CardMedia component="img" height="160" image={image} alt={p.productName} />
                      ) : (
                        <Box className="product-card-media-fallback">
                          <Storefront />
                        </Box>
                      )}
                    </Box>
                    <CardContent>
                      <Box className="product-card-head">
                        <Typography variant="h6" className="product-card-name">
                          {p.productName}
                        </Typography>
                        <Chip
                          label={p.itemStatus}
                          size="small"
                          color={statusColor(p.itemStatus)}
                          className="product-card-status"
                        />
                      </Box>
                      <Typography variant="body2" className="product-card-meta">
                        SN: {p.serialNumber}
                      </Typography>
                      <Typography variant="body2" className="product-card-meta">
                        {p.category} · {p.conditionStatus}
                      </Typography>
                      <Typography variant="body2" className="product-card-meta">
                        Sold: {p.totalSold ?? 0}
                      </Typography>
                      <Typography variant="h6" className="product-card-price">
                        {formatPrice(p.price)}
                      </Typography>
                    </CardContent>
                     <CardActions
    className="product-card-actions"
    sx={{
      display: "flex",
      justifyContent: "flex-end",
    }}
  >
    <Button
      size="small"
      variant="outlined"
      startIcon={<ShoppingCart fontSize="small" />}
      onClick={(e) => {
        e.stopPropagation();
        addToCart(p);
        setToast({ open: true, name: p.productName });
      }}
    >
      Add to Cart
    </Button>
  </CardActions>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      )}
      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast({ open: false, name: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast({ open: false, name: '' })}>
          Added "{toast.name}" to cart
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Home;