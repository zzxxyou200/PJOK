import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Divider, CircularProgress, Alert, Chip, Button, Stack,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const REPORT_URL = `${API_URL}/reports/purchase-history/requisition`;
const PDF_URL = `${REPORT_URL}.pdf`;
// Spring Boot serves the report fonts and logo from the server root, not from /api.
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

function PurchaseHistory() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/purchase-history`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        if (!response.ok) {
          setError('Failed to load purchase history');
          return;
        }
        setRecords(await response.json());
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [logout, navigate]);

  const handleReportError = (response) => {
    if (response.status === 401) {
      logout();
      navigate('/login');
      return true;
    }
    if (response.status === 404) {
      setReportError('ไม่พบประวัติการซื้อ จึงไม่สามารถออกใบขอเบิกพัสดุได้');
      return true;
    }
    setReportError('ไม่สามารถสร้างใบขอเบิกพัสดุได้ กรุณาลองใหม่อีกครั้ง');
    return true;
  };

  const downloadReport = async () => {
    setReportBusy(true);
    setReportError('');
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(PDF_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        handleReportError(response);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ใบขอเบิกพัสดุราชการ.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setReportError('ไม่สามารถดาวน์โหลดใบขอเบิกพัสดุได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setReportBusy(false);
    }
  };

  const previewReport = async () => {
    setReportBusy(true);
    setReportError('');
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(REPORT_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        handleReportError(response);
        return;
      }
      const html = await response.text();
      // The report markup is served from a different origin than this app, so anchor the
      // relative font and logo paths to the API host before rendering the preview.
      const popup = window.open('', '_blank');
      if (!popup) {
        setReportError('กรุณาอนุญาตการเปิดหน้าต่างใหม่เพื่อดูตัวอย่างเอกสาร');
        return;
      }
      popup.document.open();
      popup.document.write(
        html.replace('<head>', `<head><base href="${SERVER_ORIGIN}/">`)
      );
      popup.document.close();
    } catch {
      setReportError('ไม่สามารถเปิดตัวอย่างใบขอเบิกพัสดุได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setReportBusy(false);
    }
  };

  const formatPrice = (price) =>
    price == null ? 'N/A' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
    }).format(price);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : '';

  const orders = records.reduce((groups, record) => {
    const key = record.checkoutId || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">ประวัติการซื้อ</Typography>
        {records.length > 0 && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              disabled={reportBusy}
              onClick={previewReport}
            >
              ดูตัวอย่างใบขอเบิก
            </Button>
            <Button
              variant="contained"
              disabled={reportBusy}
              onClick={downloadReport}
            >
              ดาวน์โหลด PDF
            </Button>
          </Stack>
        )}
      </Box>

      {reportBusy && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {reportError && <Alert severity="error" sx={{ mt: 2 }}>{reportError}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            ยังไม่มีประวัติการซื้อ
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/home')}>
            ไปเลือกซื้อสินค้า
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(orders).map(([checkoutId, orderItems]) => {
            const orderTotal = orderItems.reduce(
              (sum, i) => sum + (Number(i.total) || 0),
              0
            );
            return (
              <Paper key={checkoutId} sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order #{checkoutId.slice(0, 8).toUpperCase()}
                    </Typography>
                    <Typography variant="body2">{formatDate(orderItems[0]?.purchaseDate)}</Typography>
                  </Box>
                  <Chip label="COMPLETED" color="success" size="small" />
                </Box>

                <Divider sx={{ my: 2 }} />

                {orderItems.map((item, idx) => (
                  <Box key={item.id}>
                    {idx > 0 && <Divider sx={{ my: 1.5 }} />}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.productName}
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          objectFit: 'cover',
                          background: '#eef2ff',
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontWeight={700}>{item.productName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          SN: {item.serialNumber} · {item.unitType || 'UNIT'} · {formatPrice(item.price)} × {item.amount}
                        </Typography>
                      </Box>
                      <Typography fontWeight={700}>{formatPrice(item.total)}</Typography>
                    </Box>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Typography variant="subtitle1">Total</Typography>
                  <Typography variant="h6" fontWeight={800}>{formatPrice(orderTotal)}</Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default PurchaseHistory;