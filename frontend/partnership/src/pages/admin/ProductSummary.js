import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, CardMedia, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import {
  Search as SearchIcon, Inventory2 as InventoryIcon, Edit as EditIcon,
  Inventory as StockIcon, Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function ProductSummary() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [organizationIds, setOrganizationIds] = useState([]);
  const [dialogMode, setDialogMode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [response, optionsResponse] = await Promise.all([
        fetch(`${API_URL}/admin/products/summary`, { headers }),
        fetch(`${API_URL}/admin/products/options`, { headers }),
      ]);
      if (response.status === 401 || optionsResponse.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      if (response.status === 403 || optionsResponse.status === 403) {
        setError('หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
        return;
      }
      if (!response.ok || !optionsResponse.ok) {
        setError('ไม่สามารถโหลดสรุปสินค้าได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }
      const [productData, options] = await Promise.all([
        response.json(),
        optionsResponse.json(),
      ]);
      setProducts(productData);
      setCategoriesOptions(options.categories);
      setOrganizationIds(options.organizationIds);
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(
    () => ['ทั้งหมด', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products
      .filter((product) => category === 'ทั้งหมด' || product.category === category)
      .filter((product) =>
        !query ||
        product.productName?.toLocaleLowerCase().includes(query) ||
        product.serialNumber?.toLocaleLowerCase().includes(query)
      )
      .sort((first, second) => {
        if (sortBy === 'sold') return second.totalSold - first.totalSold;
        if (sortBy === 'stock') return second.remainingStock - first.remainingStock;
        return (first.productName || '').localeCompare(second.productName || '', 'th');
      });
  }, [category, products, search, sortBy]);

  const formatPrice = (price) => price == null
    ? '—'
    : new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 2,
    }).format(Number(price));

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setForm({
      productName: '',
      serialNumber: '',
      categoryId: '',
      organizationId: organizationIds[0] || '',
      normalPrice: '',
      boxPrice: '',
      unitType: 'UNIT',
      stockQuantity: '',
      imageData: '',
    });
    setImagePreview('');
    setDialogError('');
    setDialogMode('create');
  };

  const openEditDialog = (product) => {
    const defaultOrganizationId = organizationIds.includes(1) ? 1 : organizationIds[0] || '';
    const categoryId = categoriesOptions.find((option) => option.name === product.category)?.id || '';
    setSelectedProduct(product);
    setForm({
      productName: product.productName || '',
      serialNumber: product.serialNumber || '',
      categoryId,
      organizationId: defaultOrganizationId,
      normalPrice: product.organizationPrices?.[defaultOrganizationId]
        ?? product.normalPrice
        ?? '',
      boxPrice: product.organizationBoxPrices?.[defaultOrganizationId]
        ?? product.normalBoxPrice
        ?? '',
      unitType: product.unitType || 'UNIT',
      stockQuantity: product.remainingStock ?? 0,
      imageData: '',
    });
    setImagePreview(product.image || '');
    setDialogError('');
    setDialogMode('edit');
  };

  const openStockDialog = (product) => {
    setSelectedProduct(product);
    setForm({ stockQuantity: product.remainingStock ?? 0 });
    setImagePreview(product.image || '');
    setDialogError('');
    setDialogMode('stock');
  };

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setDialogError('รองรับไฟล์ PNG, JPG, WEBP หรือ GIF เท่านั้น');
      event.target.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      setDialogError('ขนาดรูปภาพต้องไม่เกิน 1 MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result);
      setForm((current) => ({ ...current, imageData }));
      setImagePreview(imageData);
      setDialogError('');
    };
    reader.onerror = () => setDialogError('ไม่สามารถอ่านไฟล์รูปภาพได้');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveChanges = async () => {
    if (dialogMode !== 'create' && !selectedProduct) return;
    setSaving(true);
    setDialogError('');
    try {
      const token = localStorage.getItem('accessToken');
      const isStockUpdate = dialogMode === 'stock';
      const isCreate = dialogMode === 'create';
      const response = await fetch(
        isStockUpdate
          ? `${API_URL}/admin/products/${selectedProduct.productId}/stock`
          : isCreate
            ? `${API_URL}/admin/products`
            : `${API_URL}/admin/products/${selectedProduct.productId}`,
        {
          method: isStockUpdate ? 'PATCH' : isCreate ? 'POST' : 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(isStockUpdate
            ? { stockQuantity: Number(form.stockQuantity) }
            : {
              ...form,
              categoryId: Number(form.categoryId),
              organizationId: Number(form.organizationId),
              normalPrice: Number(form.normalPrice),
              boxPrice: Number(form.boxPrice),
              stockQuantity: Number(form.stockQuantity),
            }),
        },
      );
      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      if (!response.ok) {
        setDialogError(
          response.status === 403
            ? 'คุณไม่มีสิทธิ์จัดการข้อมูลสินค้า'
            : 'บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง',
        );
        return;
      }
      setDialogMode('');
      setSelectedProduct(null);
      await loadProducts();
    } catch {
      setDialogError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองอีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="action" />
          <Typography variant="h5" fontWeight={700}>
            สรุปยอดสินค้า &amp; คลังพัสดุคงเหลือ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          disabled={categoriesOptions.length === 0 || organizationIds.length === 0}
        >
          เพิ่มพัสดุสินค้า
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="product-sort-label">เรียงตาม</InputLabel>
          <Select
            labelId="product-sort-label"
            value={sortBy}
            label="เรียงตาม"
            onChange={(event) => setSortBy(event.target.value)}
          >
            <MenuItem value="name">ชื่อสินค้า</MenuItem>
            <MenuItem value="sold">ยอดขายมากที่สุด</MenuItem>
            <MenuItem value="stock">คงเหลือมากที่สุด</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="ค้นหาสินค้า / รหัสสินค้า"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="product-category-label">หมวดหมู่</InputLabel>
          <Select
            labelId="product-category-label"
            value={category}
            label="หมวดหมู่"
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !error ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  '& .MuiTableCell-root': {
                    backgroundColor: '#100548',
                    color: '#fff',
                    fontWeight: 700,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    py: 1.5,
                  },
                }}
              >
                <TableCell align="left">สินค้า</TableCell>
                <TableCell>รหัสสินค้า</TableCell>
                <TableCell>ราคาขายปกติ</TableCell>
                <TableCell>ยอดขายสะสม</TableCell>
                <TableCell>สต๊อกคงเหลือ</TableCell>
                <TableCell>ปรับปรุง</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">ไม่พบสินค้า</Typography>
                  </TableCell>
                </TableRow>
              ) : visibleProducts.map((product) => (
                <TableRow key={product.productId} hover>
                  <TableCell sx={{ minWidth: 190 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CardMedia
                        component="img"
                        image={product.image || '/favicon.ico'}
                        alt=""
                        onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
                        sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', bgcolor: '#eef2ff' }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{product.productName || 'ไม่ระบุชื่อ'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.category || 'ไม่ระบุหมวดหมู่'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{product.serialNumber || product.productId}</TableCell>
                  <TableCell align="center" sx={{ color: 'success.dark', fontWeight: 700 }}>
                    <Typography variant="body2">หน่วย: {formatPrice(product.normalPrice)}</Typography>
                    <Typography variant="body2">กล่อง: {formatPrice(product.normalBoxPrice)}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'info.dark', fontWeight: 700 }}>
                    {Number(product.totalSold) || 0}
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'info.dark', fontWeight: 700 }}>
                    {Number(product.remainingStock) || 0} {product.unitType || 'หน่วยนับ'}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.75} justifyContent="center">
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<EditIcon />}
                        onClick={() => openEditDialog(product)}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<StockIcon />}
                        onClick={() => openStockDialog(product)}
                      >
                        ปรับปรุงสต็อก
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Dialog
        open={dialogMode === 'edit' || dialogMode === 'create'}
        onClose={() => !saving && setDialogMode('')}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ color: '#fff', background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}>
          {dialogMode === 'create' ? '➕ เพิ่มพัสดุสินค้าใหม่ลงขายในระบบ' : '🖊️ แก้ไขข้อมูลพัสดุสินค้า'}
        </DialogTitle>
        <DialogContent sx={{ pt: '18px !important' }}>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          {(dialogMode === 'create' || selectedProduct) && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="ชื่อพัสดุ / สินค้า"
                value={form.productName || ''}
                onChange={updateForm('productName')}
                required
                fullWidth
                sx={{ gridColumn: { sm: '1 / -1' } }}
              />
              <FormControl fullWidth required>
                <InputLabel id="edit-product-category-label">หมวดหมู่สินค้า</InputLabel>
                <Select
                  labelId="edit-product-category-label"
                  value={form.categoryId || ''}
                  label="หมวดหมู่สินค้า"
                  onChange={updateForm('categoryId')}
                >
                  {categoriesOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="รหัสสินค้า"
                value={form.serialNumber || ''}
                onChange={updateForm('serialNumber')}
                fullWidth
              />
              <TextField
                label="ราคาขายต่อหน่วย (บาท)"
                type="number"
                value={form.normalPrice ?? ''}
                onChange={updateForm('normalPrice')}
                inputProps={{ min: 0, step: '0.01' }}
                required
                fullWidth
              />
              <TextField
                label="ราคาขายต่อกล่อง (บาท)"
                type="number"
                value={form.boxPrice ?? ''}
                onChange={updateForm('boxPrice')}
                inputProps={{ min: 0, step: '0.01' }}
                required
                fullWidth
                helperText="1 กล่อง = 12 หน่วย"
              />
              <FormControl fullWidth required>
                <InputLabel id="edit-product-organization-label">หน่วยงานของราคา</InputLabel>
                <Select
                  labelId="edit-product-organization-label"
                  value={form.organizationId || ''}
                  label="หน่วยงานของราคา"
                  onChange={(event) => {
                    const organizationId = Number(event.target.value);
                    setForm((current) => ({
                      ...current,
                      organizationId,
                      normalPrice: selectedProduct?.organizationPrices?.[organizationId] ?? '',
                      boxPrice: selectedProduct?.organizationBoxPrices?.[organizationId] ?? '',
                    }));
                  }}
                >
                  {organizationIds.map((organizationId) => (
                    <MenuItem key={organizationId} value={organizationId}>
                      หน่วยงาน #{organizationId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel id="edit-product-unit-label">หน่วยนับหลัก</InputLabel>
                <Select
                  labelId="edit-product-unit-label"
                  value={form.unitType || 'UNIT'}
                  label="หน่วยนับหลัก"
                  onChange={updateForm('unitType')}
                >
                  <MenuItem value="UNIT">หน่วย</MenuItem>
                  <MenuItem value="BOX">กล่อง</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="จำนวนสต็อก"
                type="number"
                value={form.stockQuantity ?? ''}
                onChange={updateForm('stockQuantity')}
                inputProps={{ min: 0, step: 1 }}
                required
                fullWidth
              />
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>อัปโหลดรูปภาพ</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    value={form.imageData || ''}
                    onChange={(event) => {
                      updateForm('imageData')(event);
                      setImagePreview(event.target.value);
                    }}
                    placeholder="วาง URL รูปภาพ หรือเลือกไฟล์"
                    size="small"
                    fullWidth
                  />
                  <Button component="label" variant="outlined" sx={{ minWidth: 150 }}>
                    เลือกไฟล์รูปภาพ
                    <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectImage} />
                  </Button>
                </Stack>
                {imagePreview && (
                  <CardMedia
                    component="img"
                    image={imagePreview}
                    alt={form.productName || ''}
                    sx={{ mt: 1, width: 120, height: 90, objectFit: 'cover', borderRadius: 1 }}
                  />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogMode('')} disabled={saving} color="inherit">ยกเลิก</Button>
          <Button onClick={saveChanges} variant="contained" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : dialogMode === 'create' ? 'บันทึกข้อมูลสินค้า' : 'บันทึกข้อมูลสินค้า'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogMode === 'stock'}
        onClose={() => !saving && setDialogMode('')}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: '#ffb547', bgcolor: '#123d70', fontWeight: 800 }}>
          📦 ปรับเพิ่ม/ลด สต็อกสินค้าคงเหลือ
        </DialogTitle>
        <DialogContent sx={{ pt: '18px !important' }}>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          {selectedProduct && (
            <>
              <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <CardMedia
                  component="img"
                  image={imagePreview || '/favicon.ico'}
                  alt=""
                  sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }}
                />
                <Box>
                  <Typography fontWeight={700}>{selectedProduct.productName}</Typography>
                  <Typography color="text.secondary">
                    {selectedProduct.serialNumber || selectedProduct.productId}
                  </Typography>
                </Box>
              </Paper>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                จำนวนสต็อกคงเหลือปัจจุบัน: {selectedProduct.remainingStock} {selectedProduct.unitType || 'หน่วยนับสินค้า'}
              </Typography>
              <TextField
                label="จำนวนสต็อกคงเหลือใหม่"
                type="number"
                value={form.stockQuantity ?? ''}
                onChange={updateForm('stockQuantity')}
                inputProps={{ min: 0, step: 1 }}
                fullWidth
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogMode('')} disabled={saving} color="inherit">ยกเลิก</Button>
          <Button onClick={saveChanges} variant="contained" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกสต็อก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProductSummary;
