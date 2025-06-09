"use client";
import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Paper,
  Divider,
  Grid,
  MenuItem,
  Select,
} from "@mui/material";
import { supabase } from "@/utils/supabase";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconTrash, IconEdit } from "@tabler/icons-react";

interface Order {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  product: string;
  amount: number;
  status: string;
  created_at: string;
  voucher_code?: string;
  voucher_discount?: number;
  final_amount?: number;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_address: "", product: "", amount: 0 });
  const [error, setError] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherInfo, setVoucherInfo] = useState<{discount: number, code: string} | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", isoToday)
      .order("created_at", { ascending: false }); // Bỏ .in("status", ["pending"]) để lấy tất cả đơn hôm nay
    setOrders(data || []);
  };

  const handleOpen = () => {
    setError("");
    setForm({ customer_name: "", customer_phone: "", customer_address: "", product: "", amount: 0 });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setForm({ customer_name: "", customer_phone: "", customer_address: "", product: "", amount: 0 });
  };
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleVoucherCheck = async (code: string) => {
    if (!code) { setVoucherInfo(null); return; }
    
    // Kiểm tra xem voucher có tồn tại và còn hiệu lực không
    const { data } = await supabase.from("vouchers").select("*").eq("code", code).single();
    if (!data || data.status !== "active" || new Date(data.expired_at) < new Date()) {
      setVoucherInfo(null);
      setError("Voucher không hợp lệ hoặc đã hết hạn");
      return;
    }
    
    // Kiểm tra xem voucher đã được sử dụng chưa (trong bất kỳ đơn hàng nào có trạng thái pending, delivered hoặc cancelled)
    const { data: usedOrders, error: orderCheckError } = await supabase
      .from("orders")
      .select("id")
      .eq("voucher_code", code)
      .in("status", ["pending", "delivered", "cancelled"]);
      
    if (orderCheckError) {
      console.error("Lỗi khi kiểm tra voucher:", orderCheckError);
      setError("Có lỗi xảy ra khi kiểm tra voucher");
      setVoucherInfo(null);
      return;
    }
    
    if (usedOrders && usedOrders.length > 0) {
      setVoucherInfo(null);
      setError("Voucher này đã được sử dụng, mỗi voucher chỉ được sử dụng một lần duy nhất");
      return;
    }
    
    // Voucher hợp lệ và chưa được sử dụng
    setVoucherInfo({ discount: data.discount, code: data.code });
    setError("");
  };
  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_phone || !form.customer_address || !form.product || !form.amount) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    // Tìm khách hàng theo số điện thoại
    const { data: customers } = await supabase.from("customers").select("*").eq("phone", form.customer_phone);
    let customerId = null;
    let currentPoint = 0;
    let isNewCustomer = false;
    if (customers && customers.length > 0) {
      customerId = customers[0].id;
      currentPoint = customers[0].point || 0;
    } else {
      // Nếu chưa có khách hàng thì tạo mới (KHÔNG insert address vì bảng customers không có cột này)
      const { data: newCustomer, error: customerInsertError } = await supabase.from("customers").insert({ name: form.customer_name, phone: form.customer_phone, point: 0 }).select();
      if (customerInsertError) {
        setError("Lỗi khi thêm khách hàng: " + customerInsertError.message);
        return;
      }
      if (newCustomer && newCustomer.length > 0) {
        customerId = newCustomer[0].id;
        currentPoint = 0;
        isNewCustomer = true;
      }
    }
    // Tính điểm tích luỹ
    const addPoint = Math.floor((Number(form.amount) / 100000) * 1000 * 100) / 100; // làm tròn 2 số lẻ
    let discount = 0;
    let voucherUsed = null;
    if (voucherInfo) {
      discount = Math.round(Number(form.amount) * voucherInfo.discount / 100);
      voucherUsed = voucherInfo.code;
    }
    const finalAmount = Number(form.amount) - discount;
    // Tạo đơn hàng
    const { error: insertError } = await supabase.from("orders").insert([
      { ...form, status: "pending", customer_id: customerId, voucher_code: voucherUsed, voucher_discount: discount, final_amount: finalAmount }
    ]);
    if (insertError) {
      setError("Lỗi khi thêm đơn hàng: " + insertError.message);
      return;
    }
    // KHÔNG cộng điểm ở đây, chỉ cộng khi chuyển sang 'delivered'
    handleClose();
    setVoucherCode("");
    setVoucherInfo(null);
    fetchOrders();
    // Nếu vừa thêm khách hàng mới, gọi fetchCustomers bên trang Quản lý khách hàng nếu có thể
    if (isNewCustomer && window && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('customer-added'));
    }
  };
  const handleStatus = async (id: string, status: string) => {
    // Lấy đơn hàng hiện tại
    const { data: orderData } = await supabase.from("orders").select("*").eq("id", id);
    const order = orderData && orderData[0];
    if (!order) return;
    // Nếu chuyển sang huỷ đơn thì không cộng điểm
    if (status === "cancelled") {
      await supabase.from("orders").update({ status }).eq("id", id);
      // Không cộng điểm
    } else if (status === "delivered" && order.status === "pending") {
      // Nếu chuyển sang đã giao và trước đó là pending thì cộng điểm
      const { data: customerData } = await supabase.from("customers").select("*").eq("id", order.customer_id);
      const customer = customerData && customerData[0];
      if (customer) {
        const addPoint = Math.floor((Number(order.amount) / 100000) * 1000 * 100) / 100;
        await supabase.from("customers").update({ point: (customer.point || 0) + addPoint }).eq("id", customer.id);
      }
      await supabase.from("orders").update({ status }).eq("id", id);
    } else {
      await supabase.from("orders").update({ status }).eq("id", id);
    }
    fetchOrders();
  };
  const handleDelete = async (id: string) => {
    await supabase.from("orders").delete().eq("id", id);
    fetchOrders();
  };

  return (
    <PageContainer title="Quản lý đơn hàng" description="Thêm, quản lý đơn hàng hôm nay.">
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4">Quản lý đơn hàng</Typography>
          <Button variant="contained" color="primary" onClick={handleOpen}>
            Thêm đơn hàng
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" mb={2}>
          Danh sách đơn hàng hôm nay ({orders.length})
        </Typography>
        <Paper variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><b>ID đơn hàng</b></TableCell>
                <TableCell><b>Thông tin</b></TableCell>
                <TableCell><b>Sản phẩm</b></TableCell>
                <TableCell><b>Thông tin thanh toán</b></TableCell>
                <TableCell><b>Trạng thái</b></TableCell>
                <TableCell><b>Thời gian</b></TableCell>
                <TableCell><b>Thao tác</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.filter(order => order.status === "pending").map((order) => (
                <TableRow key={order.id} hover sx={{ transition: 'background 0.2s', cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>{order.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>
                    <b>{order.customer_name}</b><br />
                    <span style={{ color: '#888' }}>{order.customer_phone}</span><br />
                    {order.customer_address && <span style={{ color: '#888' }}>{order.customer_address}</span>}
                  </TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>
                    <div>Tổng tiền sản phẩm: {order.amount.toLocaleString()}₫</div>
                    {order.voucher_discount ? <div>Giảm giá từ voucher: -{order.voucher_discount.toLocaleString()}₫</div> : null}
                    {order.voucher_code ? <div>Mã giảm giá: {order.voucher_code}</div> : null}
                    <div>Thành tiền sau giảm: {(order.final_amount || order.amount).toLocaleString()}₫</div>
                    <div>Số điểm tích được: {Math.floor((order.amount / 100000) * 1000 * 100) / 100}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onChange={e => handleStatus(order.id, e.target.value)}
                      size="small"
                      sx={{
                        bgcolor: order.status === 'pending' ? '#fffde7' : order.status === 'delivered' ? '#e8f5e9' : '#ffebee',
                        color: order.status === 'pending' ? '#fbc02d' : order.status === 'delivered' ? '#388e3c' : '#d32f2f',
                        fontWeight: 600,
                        borderRadius: 1
                      }}
                    >
                      <MenuItem value="pending" sx={{ color: '#fbc02d' }}>Đang chuẩn bị</MenuItem>
                      <MenuItem value="delivered" sx={{ color: '#388e3c' }}>Đã giao</MenuItem>
                      <MenuItem value="cancelled" sx={{ color: '#d32f2f' }}>Huỷ đơn</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => { setEditOrder(order); setEditForm(order); }} sx={{ color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' } }}><IconEdit size={18} /></IconButton>
                    <IconButton onClick={() => handleDelete(order.id)} sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}><IconTrash size={18} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Card>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Thêm đơn hàng</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Tên khách hàng" name="customer_name" value={form.customer_name} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Số điện thoại" name="customer_phone" value={form.customer_phone} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Địa chỉ" name="customer_address" value={form.customer_address} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Sản phẩm" name="product" value={form.product} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Giá tiền" name="amount" type="number" value={form.amount} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Mã giảm giá (Voucher)" value={voucherCode} onChange={e => { setVoucherCode(e.target.value.toUpperCase()); handleVoucherCheck(e.target.value.toUpperCase()); }} fullWidth />
          {voucherInfo && <Typography color="success.main">Áp dụng: {voucherInfo.discount}%</Typography>}
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Huỷ</Button>
          <Button onClick={handleSubmit} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog sửa đơn hàng */}
      <Dialog open={!!editOrder} onClose={() => { setEditOrder(null); setError(""); }}>
        <DialogTitle>Sửa đơn hàng</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Tên khách hàng" name="customer_name" value={editForm.customer_name || ""} onChange={e => setEditForm({ ...editForm, customer_name: e.target.value })} fullWidth />
          <TextField margin="dense" label="Số điện thoại" name="customer_phone" value={editForm.customer_phone || ""} onChange={e => setEditForm({ ...editForm, customer_phone: e.target.value })} fullWidth />
          <TextField margin="dense" label="Địa chỉ" name="customer_address" value={editForm.customer_address || ""} onChange={e => setEditForm({ ...editForm, customer_address: e.target.value })} fullWidth />
          <TextField margin="dense" label="Sản phẩm" name="product" value={editForm.product || ""} onChange={e => setEditForm({ ...editForm, product: e.target.value })} fullWidth />
          <TextField margin="dense" label="Giá tiền" name="amount" type="number" value={editForm.amount || 0} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} fullWidth />
          <TextField margin="dense" label="Mã giảm giá (Voucher)" name="voucher_code" value={editForm.voucher_code || ""} onChange={async e => {
            const code = e.target.value.toUpperCase();
            setEditForm({ ...editForm, voucher_code: code });
            if (!code) {
              setEditForm((prev: any) => ({ ...prev, voucher_discount: 0, final_amount: prev.amount }));
              return;
            }
            
            // Kiểm tra xem voucher có tồn tại và còn hiệu lực không
            const { data } = await supabase.from("vouchers").select("*").eq("code", code).single();
            if (!data || data.status !== "active" || new Date(data.expired_at) < new Date()) {
              setEditForm((prev: any) => ({ ...prev, voucher_discount: 0, final_amount: prev.amount }));
              setError("Mã voucher không hợp lệ hoặc đã hết hạn");
              return;
            }
            
            // Kiểm tra xem voucher đã được sử dụng chưa (trong đơn hàng khác)
            const { data: usedOrders, error: orderCheckError } = await supabase
              .from("orders")
              .select("id")
              .eq("voucher_code", code)
              .in("status", ["pending", "delivered", "cancelled"]);
              
            if (orderCheckError) {
              console.error("Lỗi khi kiểm tra voucher:", orderCheckError);
              setError("Có lỗi xảy ra khi kiểm tra voucher");
              return;
            }
            
            // Nếu là voucher cũ của đơn hàng hiện tại thì vẫn được sử dụng
            if (usedOrders && usedOrders.length > 0) {
              // Kiểm tra xem có phải là đơn hàng hiện tại không
              const isCurrentOrder = usedOrders.some(order => order.id === editOrder?.id);
              if (!isCurrentOrder) {
                setEditForm((prev: any) => ({ ...prev, voucher_discount: 0, final_amount: prev.amount }));
                setError("Voucher này đã được sử dụng!!!");
                return;
              }
            }
            
            // Voucher hợp lệ
            const discount = Math.round(Number(editForm.amount) * data.discount / 100);
            setEditForm((prev: any) => ({ ...prev, voucher_discount: discount, final_amount: Number(prev.amount) - discount }));
            setError("");
          }} fullWidth />
          {editForm.voucher_discount ? <Typography color="success.main">Giảm: {editForm.voucher_discount.toLocaleString()}₫</Typography> : null}
          {editForm.final_amount ? <Typography color="primary">Thành tiền: {editForm.final_amount.toLocaleString()}₫</Typography> : null}
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditOrder(null); setError(""); }}>Huỷ</Button>
          <Button variant="contained" onClick={async () => {
            // Validate
            if (!editForm.customer_name || !editForm.customer_phone || !editForm.customer_address || !editForm.product || !editForm.amount) {
              setError("Vui lòng nhập đầy đủ thông tin");
              return;
            }
            if (!editOrder) {
              setError("Không tìm thấy đơn hàng để cập nhật");
              return;
            }
            // Nếu có mã voucher thì kiểm tra lại
            let voucher_discount = 0;
            let final_amount = Number(editForm.amount);
            let voucher_code = editForm.voucher_code || null;
            if (voucher_code) {
              const { data } = await supabase.from("vouchers").select("*").eq("code", voucher_code).single();
              if (data && data.status === "active" && new Date(data.expired_at) >= new Date()) {
                voucher_discount = Math.round(Number(editForm.amount) * data.discount / 100);
                final_amount = Number(editForm.amount) - voucher_discount;
              } else {
                setError("Mã voucher không hợp lệ hoặc đã hết hạn");
                return;
              }
            }
            const { error: updateError } = await supabase.from("orders").update({
              customer_name: editForm.customer_name,
              customer_phone: editForm.customer_phone,
              customer_address: editForm.customer_address,
              product: editForm.product,
              amount: Number(editForm.amount),
              voucher_code: voucher_code,
              voucher_discount: voucher_discount,
              final_amount: final_amount
            }).eq("id", editOrder.id);
            if (!updateError) {
              setEditOrder(null);
              setError("");
              fetchOrders();
            } else {
              setError("Lỗi khi cập nhật đơn hàng: " + updateError.message);
            }
          }}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default OrderManagement;
