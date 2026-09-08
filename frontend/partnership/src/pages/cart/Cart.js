import { Box, Typography, Paper } from '@mui/material';

function Cart() {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        ตะกร้าสินค้า
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          ยังไม่มีสินค้าในตะกร้า
        </Typography>
      </Paper>
    </Box>
  );
}

export default Cart;