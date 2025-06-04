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
import { IconTrash } from "@tabler/icons-react";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  product: string;
  amount: number;
  status: string;
  created_at: string;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", product: "", amount: 0 });
  const [error, setError] = useState("");

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
      .in("status", ["pending"])
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const handleOpen = () => {
    setError("");
    setForm({ customer_name: "", customer_phone: "", product: "", amount: 0 });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setForm({ customer_name: "", customer_phone: "", product: "", amount: 0 });
  };
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_phone || !form.product || !form.amount) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    // Tìm khách hàng theo số điện thoại
    const { data: customers } = await supabase.from("customers").select("*").eq("phone", form.customer_phone);
    let customerId = null;
    let currentPoint = 0;
    if (customers && customers.length > 0) {
      customerId = customers[0].id;
      currentPoint = customers[0].point || 0;
    } else {
      // Nếu chưa có khách hàng thì tạo mới
      const { data: newCustomer } = await supabase.from("customers").insert({ name: form.customer_name, phone: form.customer_phone, point: 0 }).select();
      if (newCustomer && newCustomer.length > 0) {
        customerId = newCustomer[0].id;
        currentPoint = 0;
      }
    }
    // Tính điểm tích luỹ
    const addPoint = Math.floor((Number(form.amount) / 100000) * 1000 * 100) / 100; // làm tròn 2 số lẻ
    // Tạo đơn hàng
    await supabase.from("orders").insert([{ ...form, status: "pending", customer_id: customerId }]);
    // Cộng điểm cho khách hàng chỉ khi KHÔNG phải huỷ đơn
    if (customerId && addPoint > 0) {
      await supabase.from("customers").update({ point: currentPoint + addPoint }).eq("id", customerId);
    }
    handleClose();
    fetchOrders();
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
                <TableCell><b>Khách hàng</b></TableCell>
                <TableCell><b>Số điện thoại</b></TableCell>
                <TableCell><b>Sản phẩm</b></TableCell>
                <TableCell><b>Giá tiền</b></TableCell>
                <TableCell><b>Trạng thái</b></TableCell>
                <TableCell><b>Thời gian</b></TableCell>
                <TableCell><b>Thao tác</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.customer_phone}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onChange={e => handleStatus(order.id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="pending">Đang chuẩn bị</MenuItem>
                      <MenuItem value="delivered">Đã giao</MenuItem>
                      <MenuItem value="cancelled">Huỷ đơn</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDelete(order.id)}><IconTrash size={18} /></IconButton>
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
          <TextField margin="dense" label="Sản phẩm" name="product" value={form.product} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Giá tiền" name="amount" type="number" value={form.amount} onChange={handleChange} fullWidth />
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Huỷ</Button>
          <Button onClick={handleSubmit} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default OrderManagement;
