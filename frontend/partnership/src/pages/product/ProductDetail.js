import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, CardMedia, CardContent, Card, Chip,
  CircularProgress, Alert, Paper, Divider, Stack, Snackbar, IconButton,
} from '@mui/material';
import { ArrowBack, Storefront, ShoppingCart, Remove, Add } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function ProductDetail() {
  const { productId } = useParams();
  const { isAuthenticated, logout } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [image, setImage] = useState('');
  const [related, setRelated] = useState([]);
  const [unitQty, setUnitQty] = useState(0);
  const [boxQty, setBoxQty] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, name: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        if (response.status === 404) {
          setError('Product not found.');
          setLoading(false);
          return;
        }
        if (!response.ok) {
          setError('Failed to load product detail.');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setProduct(data);
        setImage(data.images?.split(',')[0]?.trim() || '');
        setError('');

        const listResponse = await fetch(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const currentId = Number(data.productId);
          const currentCats = new Set(data.categories || []);
          const sorted = listData
            .filter((p) =>
              p.price != null &&
              Number(p.productId) !== currentId &&
              (p.categories || []).some((c) => currentCats.has(c))
            )
            .sort((a, b) => {
              const score = (prod) =>
                (prod.categories || []).filter((c) => currentCats.has(c)).length;
              return score(b) - score(a);
            })
            .slice(0, 4);
          setRelated(sorted);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isAuthenticated, productId, logout, navigate]);

  const images = product?.images
    ? product.images.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleAddToCart = async () => {
    if (!product || (!unitQty && !boxQty)) return;
    setAdding(true);
    try {
      if (unitQty > 0) {
        await addToCart(product, unitQty, 'UNIT');
      }
      if (boxQty > 0) {
        await addToCart(product, boxQty, 'BOX');
      }
      setUnitQty(0);
      setBoxQty(0);
      setToast({ open: true, name: product.productName });
    } finally {
      setAdding(false);
    }
  };

  const anyQty = (unitQty > 0) || (boxQty > 0);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/home')}>
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Button
        variant="text"
        startIcon={<ArrowBack />}
        onClick={() => navigate('/home')}
        sx={{ mb: 2 }}
      >
        Back to Home
      </Button>

      {product ? (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: '0 12px 34px rgba(30,41,59,0.10)' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 5 },
            }}
          >
            <Box sx={{ flex: '1 1 45%' }}>
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #eef2ff, #e0f2fe)',
                  minHeight: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {image ? (
                  <CardMedia component="img" sx={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} image={image} alt={product.productName} />
                ) : (
                  <Storefront sx={{ fontSize: '4rem', color: '#a5b4fc' }} />
                )}
              </Box>
              {images.length > 1 && (
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
                  {images.map((img, i) => (
                    <Box
                      key={i}
                      component="img"
                      src={img}
                      alt={`${product.productName} ${i + 1}`}
                      onClick={() => setImage(img)}
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: image === img ? '2px solid #4f46e5' : '2px solid transparent',
                        opacity: image === img ? 1 : 0.6,
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <Box sx={{ flex: '1 1 55%' }}>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    {product.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SN: {product.serialNumber}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  {product.categories?.map((c) => (
                    <Chip key={c} label={c} size="small" color="primary" variant="outlined" />
                  ))}
                  <Chip
                    label={product.itemStatus}
                    size="small"
                    color={statusColor(product.itemStatus)}
                  />
                  <Chip label={product.conditionStatus} size="small" variant="outlined" />
                </Stack>

                <Divider />

                <Typography variant="h5" fontWeight={700} color="primary">
                  {formatPrice(product.price)}
                </Typography>

                <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>Per Unit</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" onClick={() => setUnitQty(Math.max(0, unitQty - 1))}>
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography variant="body1" sx={{ minWidth: 20, textAlign: 'center' }}>
                        {unitQty}
                      </Typography>
                      <IconButton size="small" onClick={() => setUnitQty(unitQty + 1)}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>Per Box</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" onClick={() => setBoxQty(Math.max(0, boxQty - 1))}>
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography variant="body1" sx={{ minWidth: 20, textAlign: 'center' }}>
                        {boxQty}
                      </Typography>
                      <IconButton size="small" onClick={() => setBoxQty(boxQty + 1)}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCart />}
                    onClick={handleAddToCart}
                    disabled={adding || product.price == null || !anyQty}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                  >
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/cart')}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                  >
                    Go to Cart
                  </Button>
                </Stack>

                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Units Sold</Typography>
                    <Typography variant="h6" fontWeight={700}>{product.totalSold ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Warranty</Typography>
                    <Typography variant="body1">
                      {product.warrantyStartDate ? new Date(product.warrantyStartDate).toLocaleDateString() : '—'}
                      {' to '}
                      {product.warrantyEndDate ? new Date(product.warrantyEndDate).toLocaleDateString() : '—'}
                    </Typography>
                  </Box>
                </Stack>

                {product.note && (
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="body2" color="text.secondary">Note</Typography>
                    <Typography variant="body1">{product.note}</Typography>
                  </CardContent>
                )}
              </Stack>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Alert severity="info">No product data.</Alert>
      )}

      {related.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Recommended Products
          </Typography>
          <Box className="product-grid">
            {related.map((r) => {
              const rImage = r.images?.split(',')[0]?.trim();
              return (
                <Card
                  className="product-card"
                  key={r.productId}
                  onClick={() => navigate(`/products/${r.productId}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box className="product-card-media">
                    {rImage ? (
                      <CardMedia component="img" height="160" image={rImage} alt={r.productName} />
                    ) : (
                      <Box className="product-card-media-fallback">
                        <Storefront />
                      </Box>
                    )}
                  </Box>
                  <CardContent>
                    <Typography variant="h6" className="product-card-name" noWrap>
                      {r.productName}
                    </Typography>
                    <Typography variant="body2" className="product-card-meta">
                      {r.category}
                    </Typography>
                    <Typography variant="h6" className="product-card-price">
                      {formatPrice(r.price)}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
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
    </Box>
  );
}

export default ProductDetail;