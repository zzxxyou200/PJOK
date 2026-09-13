import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, IconButton, Divider, Checkbox, FormControlLabel } from '@mui/material';
import { Remove, Add, Delete } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

function Cart() {
  const { items, totalCount, updateQty, removeFromCart, clearCart } = useCart();
  const [selected, setSelected] = useState(() => new Set(items.map((i) => i.id)));

  useEffect(() => {
    setSelected((prev) => new Set([...prev].filter((id) => items.some((i) => i.id === id))));
  }, [items]);

  const toggleItem = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))
    );
  };

  const selectedItems = items.filter((i) => selected.has(i.id));
  const selectedCount = selectedItems.reduce((sum, i) => sum + (i.amount || 0), 0);
  const selectedPrice = selectedItems.reduce(
    (sum, i) => sum + (i.amount || 0) * (Number(i.price) || 0),
    0
  );

  const formatPrice = (price) =>
    price == null ? 'N/A' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
    }).format(price);

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        ตะกร้าสินค้า
      </Typography>

      {items.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            ยังไม่มีสินค้าในตะกร้า
          </Typography>
          <Button component={RouterLink} to="/home" variant="outlined" sx={{ mt: 2 }}>
            ไปเลือกซื้อสินค้า
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selected.size === items.length}
                indeterminate={selected.size > 0 && selected.size < items.length}
                onChange={toggleAll}
              />
            }
            label="เลือกทั้งหมด"
          />
          {items.map((item, idx) => (
            <Box key={item.id}>
              {idx > 0 && <Divider sx={{ my: 2 }} />}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Checkbox
                  checked={selected.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                <Box
                  component="img"
                  src={item.image}
                  alt={item.productName}
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 2,
                    objectFit: 'cover',
                    background: '#eef2ff',
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={700}>{item.productName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    SN: {item.serialNumber} · {formatPrice(item.price)} · {item.unitType || 'UNIT'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <IconButton size="small" onClick={() => updateQty(item.id, item.amount - 1)}>
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="body1">{item.amount}</Typography>
                    <IconButton size="small" onClick={() => updateQty(item.id, item.amount + 1)}>
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography fontWeight={700}>
                    {formatPrice(item.price * item.amount)}
                  </Typography>
                  <IconButton size="small" color="error" onClick={() => removeFromCart(item.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                เลือกแล้ว {selectedCount} item{selectedCount > 1 ? 's' : ''} จาก{' '}
                {totalCount} item{totalCount > 1 ? 's' : ''}
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {formatPrice(selectedPrice)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" color="inherit" onClick={clearCart}>
                ล้างตะกร้า
              </Button>
              <Button variant="contained" disabled={selectedItems.length === 0}>
                Checkout
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default Cart;