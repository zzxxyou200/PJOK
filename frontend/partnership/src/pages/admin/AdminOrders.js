import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const deliveryStatuses = {
  PENDING: 'รอดำเนินการ',
  PROCESSING: 'กำลังเตรียมสินค้า',
  SHIPPED: 'จัดส่งแล้ว',
  DELIVERED: 'จัดส่งสำเร็จ',
  CANCELLED: 'ยกเลิก',
};

const paymentStatuses = {
  PENDING: 'รอชำระเงิน',
  PAID: 'ชำระเงินแล้ว',
  FAILED: 'ชำระเงินไม่สำเร็จ',
  REFUNDED: 'คืนเงินแล้ว',
};

function AdminOrders() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const handleUnauthorized = useCallback((response) => {
    if (response.status !== 401) return false;
    logout();
    navigate('/login');
    return true;
  }, [logout, navigate]);

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (handleUnauthorized(response)) return;
      if (response.status === 403) {
        setError('หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
        return;
      }
      if (!response.ok) {
        setError('ไม่สามารถโหลดรายการคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }
      setOrders(await response.json());
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, navigate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openStatusEditor = (order) => {
    setSelectedOrder(order);
    setDeliveryStatus(order.deliveryStatus);
    setPaymentStatus(order.paymentStatus);
    setDialogError('');
  };

  const saveStatuses = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    setDialogError('');
    try {
      const response = await fetch(
        `${API_URL}/admin/orders/${encodeURIComponent(selectedOrder.checkoutId)}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deliveryStatus, paymentStatus }),
        },
      );
      if (handleUnauthorized(response)) return;
      if (!response.ok) {
        setDialogError(
          response.status === 403
            ? 'คุณไม่มีสิทธิ์แก้ไขสถานะคำสั่งซื้อ'
            : 'บันทึกสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        );
        return;
      }
      const updatedOrder = await response.json();
      setOrders((current) => current.map((order) =>
        order.checkoutId === updatedOrder.checkoutId ? updatedOrder : order
      ));
      setSelectedOrder(null);
    } catch {
      setDialogError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(price || 0);

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        จัดการคำสั่งซื้อ
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !error && orders.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">ยังไม่มีคำสั่งซื้อ</Typography>
        </Paper>
      ) : !error ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>เลขที่สั่งซื้อ</TableCell>
                <TableCell>หน่วยงาน</TableCell>
                <TableCell>รายการสินค้า</TableCell>
                <TableCell align="right">ยอดรวม</TableCell>
                <TableCell>สถานะจัดส่ง</TableCell>
                <TableCell>สถานะชำระเงิน</TableCell>
                <TableCell align="center">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.checkoutId} hover>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.organization}</TableCell>
                  <TableCell>
                    {order.items.map((item, index) => (
                      <Typography key={`${item.productName}-${index}`} variant="body2">
                        {item.productName || 'สินค้า'} × {item.amount} {item.unitType || ''}
                      </Typography>
                    ))}
                  </TableCell>
                  <TableCell align="right">{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <Chip label={deliveryStatuses[order.deliveryStatus] || order.deliveryStatus} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={paymentStatuses[order.paymentStatus] || order.paymentStatus}
                      size="small"
                      color={order.paymentStatus === 'PAID' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" onClick={() => openStatusEditor(order)}>
                      แก้ไขสถานะ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Dialog
        open={Boolean(selectedOrder)}
        onClose={() => !saving && setSelectedOrder(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>แก้ไขสถานะคำสั่งซื้อ {selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          {dialogError && <Alert severity="error">{dialogError}</Alert>}
          <FormControl fullWidth>
            <InputLabel id="delivery-status-label">สถานะจัดส่ง</InputLabel>
            <Select
              labelId="delivery-status-label"
              value={deliveryStatus}
              label="สถานะจัดส่ง"
              onChange={(event) => setDeliveryStatus(event.target.value)}
            >
              {Object.entries(deliveryStatuses).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="payment-status-label">สถานะชำระเงิน</InputLabel>
            <Select
              labelId="payment-status-label"
              value={paymentStatus}
              label="สถานะชำระเงิน"
              onChange={(event) => setPaymentStatus(event.target.value)}
            >
              {Object.entries(paymentStatuses).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)} disabled={saving}>ยกเลิก</Button>
          <Button onClick={saveStatuses} variant="contained" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminOrders;
