import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function OrganizationSummary() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummaries = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/organizations/summary`, {
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
        setError('ไม่สามารถโหลดสรุปหน่วยงานได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }
      setOrganizations(await response.json());
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const formatPrice = (price) => new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        สรุปหน่วยงาน
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !error && organizations.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">ยังไม่มีข้อมูลหน่วยงาน</Typography>
          </CardContent>
        </Card>
      ) : !error ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 2,
            alignItems: 'start',
          }}
        >
          {organizations.map((organization) => {
            const fullyPaid = organization.orderCount > 0
              && Number(organization.outstandingTotal) === 0;
            const customPricing = organization.customPricedProductCount > 0;

            return (
              <Card
                key={organization.organizationId}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: '#dedee8',
                  boxShadow: '0 3px 12px rgba(30, 41, 59, 0.08)',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {organization.organizationName}
                    </Typography>
                    <Typography variant="subtitle2" color="primary.main" sx={{ flexShrink: 0 }}>
                      {organization.orderCount} ออเดอร์
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    ผู้ติดต่อ: {organization.contactName} ({organization.contactPhone})
                  </Typography>

                  <Chip
                    label={
                      organization.orderCount === 0
                        ? 'ยังไม่มีคำสั่งซื้อ'
                        : fullyPaid
                          ? `ชำระเงินครบถ้วน ${formatPrice(organization.paidTotal)}`
                          : `ค้างชำระ ${formatPrice(organization.outstandingTotal)}`
                    }
                    color={fullyPaid ? 'success' : 'default'}
                    variant={fullyPaid ? 'filled' : 'outlined'}
                    sx={{ width: '100%', justifyContent: 'flex-start', mb: 1.5 }}
                  />

                  <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="caption">ยอดสั่งซื้อสะสม</Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {formatPrice(organization.orderTotal)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="caption">ชำระเงินแล้วทั้งหมด</Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {formatPrice(organization.paidTotal)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="caption">เรทราคาขายเฉพาะ</Typography>
                      <Typography variant="caption" fontWeight={700} textAlign="right">
                        {customPricing
                          ? `ราคาพิเศษ (${organization.customPricedProductCount} รายการ)`
                          : 'ราคาปกติ (0%)'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    onClick={() => navigate('/admin/orders')}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    ตรวจสอบรายการคำสั่งซื้อ &amp; ประวัติ
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}

export default OrganizationSummary;
