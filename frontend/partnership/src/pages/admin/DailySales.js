import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function DailySales() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDailySales = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/sales/daily`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      if (response.status === 403) {
        setError('หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
        return;
      }
      if (!response.ok) {
        setError('ไม่สามารถโหลดสรุปยอดขายได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }
      setDailySales(await response.json());
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadDailySales();
  }, [loadDailySales]);

  const formatDate = (date) => new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(`${date}T00:00:00`));

  const formatPrice = (total) => new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(Number(total) || 0);

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        สรุปยอดขายประจำวัน
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !error && dailySales.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">ยังไม่มีข้อมูลยอดขาย</Typography>
        </Paper>
      ) : !error ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  '& .MuiTableCell-root': {
                    backgroundColor: '#100548',
                    color: '#fff',
                    fontWeight: 700,
                    py: 1.5,
                  },
                }}
              >
                <TableCell>วันที่ / เวลา</TableCell>
                <TableCell align="center">จำนวนรายการ/วัน</TableCell>
                <TableCell align="right">ยอดรวมสั่งซื้อ (บาท)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailySales.map((row) => (
                <TableRow key={row.date} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{formatDate(row.date)}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{row.quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatPrice(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Box>
  );
}

export default DailySales;
