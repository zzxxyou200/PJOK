import { Box, Typography, Paper } from '@mui/material';

function PurchaseHistory() {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        ประวัติการซื้อ
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          ยังไม่มีประวัติการซื้อ
        </Typography>
      </Paper>
    </Box>
  );
}

export default PurchaseHistory;