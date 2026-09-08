import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert,
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      navigate('/login');
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
          }
          setError('Failed to load products');
          return;
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  const formatPrice = (price) =>
    price == null ? 'N/A' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
    }).format(price);

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Products
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p, i) => (
                <TableRow key={p.productId} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell>{p.serialNumber}</TableCell>
                  <TableCell>{p.conditionStatus}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.itemStatus}
                      size="small"
                      color={
                        p.itemStatus === 'AVAILABLE' ? 'success'
                          : p.itemStatus === 'RESERVED' ? 'warning'
                          : p.itemStatus === 'SOLD' ? 'error'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">{formatPrice(p.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Products;