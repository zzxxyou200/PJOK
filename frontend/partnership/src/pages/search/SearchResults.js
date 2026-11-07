import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Typography, Card, CardMedia, CardContent, CardActions, Chip,
  CircularProgress, Alert, Snackbar,
} from '@mui/material';
import { Storefront, ShoppingCart } from '@mui/icons-material';
import { useCart } from '../../context/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const UNITS_PER_BOX = 12;

function SearchResults() {
  const { addToCart, items: cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, name: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('q') || '').trim();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      navigate('/login');
      return;
    }

    if (!searchTerm) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/products/search?search=${encodeURIComponent(searchTerm)}`,
          { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal },
        );

        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/login');
          return;
        }
        if (!response.ok) {
          setError('Failed to load search results');
          return;
        }

        const data = await response.json();
        setProducts(data);
        setError('');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Something went wrong. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [navigate, searchTerm]);

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

  const productCards = useMemo(
    () => products.map((p) => {
      const image = p.images?.split(',')[0]?.trim();
      const cartedQuantity = cartItems
        .filter((item) => Number(item.productId) === Number(p.productId))
        .reduce((sum, item) => sum + (Number(item.amount) || 0)
          * (item.unitType === 'BOX' ? UNITS_PER_BOX : 1), 0);
      const canAddToCart = (Number(p.stockQuantity) || 0) > cartedQuantity;
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
            sx={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<ShoppingCart fontSize="small" />}
              disabled={!canAddToCart || p.price == null}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await addToCart(p);
                  setToast({ open: true, name: p.productName, severity: 'success' });
                } catch (addError) {
                  setToast({
                    open: true,
                    name: addError.message === 'Requested quantity exceeds available stock'
                      ? 'จำนวนสินค้าคงเหลือไม่เพียงพอ กรุณาตรวจสอบสต็อกและรายการในตะกร้า'
                      : addError.message || 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้',
                    severity: 'error',
                  });
                }
              }}
            >
              {canAddToCart ? 'Add to Cart' : 'Out of stock'}
            </Button>
          </CardActions>
        </Card>
      );
    }),
    [products, addToCart, cartItems, navigate],
  );

  return (
    <Box className="page" sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Search Results{searchTerm && ` for "${searchTerm}"`}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !searchTerm ? (
        <Alert severity="info" sx={{ mb: 2 }}>Type a keyword in the search bar to find products.</Alert>
      ) : productCards.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No products match "{searchTerm}".
        </Alert>
      ) : (
        <Box className="product-grid">
          {productCards}
        </Box>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast({ open: false, name: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity || 'success'} variant="filled" onClose={() => setToast({ open: false, name: '' })}>
          {toast.severity === 'error' ? toast.name : `Added "${toast.name}" to cart`}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SearchResults;