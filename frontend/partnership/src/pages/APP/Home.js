import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Card, CardMedia, CardContent, Chip,
  CircularProgress, Alert, Paper,
} from '@mui/material';
import { Storefront } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const CATEGORIES = ['All', 'Accessories', 'Consumables', 'Electronics', 'Spare Parts'];

function Home() {
  const { isAuthenticated, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="page home-page">
      <Paper elevation={0} className="home-hero">
        <Storefront className="home-hero-icon" />
        <Typography variant="h3" component="h1" className="home-hero-title">
          Welcome to SomeShop
        </Typography>
        <Typography variant="h6" className="home-hero-subtitle">
          Discover products priced for your organization
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
          </Box>

          {loading ? (
            <Box className="home-loading">
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Box className="home-empty">
              <Typography variant="body1">
                {selectedCategory === 'All'
                  ? 'No products with pricing available for your organization.'
                  : 'No products in this category.'}
              </Typography>
            </Box>
          ) : (
            <Box className="product-grid">
              {products.map((p) => {
                const image = p.images?.split(',')[0]?.trim();
                return (
                  <Card className="product-card" key={p.productId}>
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
                      <Typography variant="h6" className="product-card-price">
                        {formatPrice(p.price)}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </div>
  );
}

export default Home;