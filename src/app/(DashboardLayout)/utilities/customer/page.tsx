"use client";
import { useEffect, useState, ChangeEvent } from "react";
import {
  Typography,
  Card,
  CardContent,
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
} from "@mui/material";
import { supabase } from "@/utils/supabase";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconEye, IconTrash, IconEdit } from "@tabler/icons-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  note?: string;
  point?: number;
  created_at?: string;
}

interface Order {
  id: string;
  created_at: string;
  product: string;
  amount: number;
  status: string;
  point: number;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editPointCustomer, setEditPointCustomer] = useState<Customer | null>(null);
  const [pointInput, setPointInput] = useState("");
  const [pointError, setPointError] = useState("");
  // Thêm state cho chỉnh sửa tên, số điện thoại
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomers(data || []);
  };

  const handleOpen = () => {
    setError("");
    setForm({ name: "", phone: "", note: "" });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({ name: "", phone: "", note: "" });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      setError("Vui lòng nhập tên và số điện thoại");
      return;
    }
    // Kiểm tra số điện thoại đã tồn tại
    const { data: existed } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", form.phone);

    if (existed && existed.length > 0) {
      setError("Số điện thoại đã tồn tại!");
      return;
    }
    await supabase.from("customers").insert([{ ...form }]);
    handleClose();
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("customers").delete().eq("id", id);
    fetchCustomers();
  };

  const handleView = async (customer: Customer) => {
    setViewCustomer(customer);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const handleEditPoint = (customer: Customer) => {
    setEditPointCustomer(customer);
    setPointInput("");
    setPointError("");
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <PageContainer
      title="Quản lý khách hàng"
      description="Quản lý danh sách khách hàng, thêm, sửa, xoá, tìm kiếm, thống kê."
    >
      <Card sx={{ mb: 3, p: { xs: 1, sm: 2 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" mb={2} gap={2}>
          <Typography variant="h4" fontSize={{ xs: 20, sm: 28 }}>Quản lý khách hàng</Typography>
          <Button variant="contained" color="primary" onClick={handleOpen} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Thêm khách hàng
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} flexWrap="wrap" gap={2} mb={2}>
          <Box flex={8} minWidth={200}>
            <TextField
              label="Tìm theo tên, số điện thoại"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
          <Box flex={4} minWidth={120}>
            <Button variant="outlined" fullWidth sx={{ height: 40 }} onClick={fetchCustomers}>
              Tìm kiếm
            </Button>
          </Box>
        </Box>
        <Paper variant="outlined" sx={{ mt: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell><b>Tên</b></TableCell>
                <TableCell><b>Số điện thoại</b></TableCell>
                <TableCell><b>Ghi chú</b></TableCell>
                <TableCell><b>Điểm tích lũy</b></TableCell>
                <TableCell><b>Ngày tạo</b></TableCell>
                <TableCell><b>Thao tác</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} hover sx={{ transition: 'background 0.2s', cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}>
                  <TableCell sx={{ minWidth: 120 }}>{c.name}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{c.phone}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{c.note}</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>{c.point || 0}</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <IconButton onClick={() => handleView(c)} sx={{ color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' } }}><IconEye size={18} /></IconButton>
                    <IconButton onClick={() => setEditCustomer(c)} sx={{ color: '#388e3c', '&:hover': { bgcolor: '#e8f5e9' } }}><IconEdit size={18} /></IconButton>
                    <IconButton onClick={() => handleDelete(c.id)} sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}><IconTrash size={18} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Card>

      {/* Dialog thêm khách hàng */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Thêm khách hàng</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Tên khách hàng"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Ghi chú"
            name="note"
            value={form.note}
            onChange={handleChange}
            fullWidth
          />
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Huỷ</Button>
          <Button onClick={handleSubmit} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xem lịch sử mua hàng */}
      <Dialog open={!!viewCustomer} onClose={() => setViewCustomer(null)} maxWidth="md" fullWidth>
        <DialogTitle>Lịch sử mua hàng - {viewCustomer?.name}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>
                  <b>Ngày</b>
                </TableCell>
                <TableCell>
                  <b>Sản phẩm</b>
                </TableCell>
                <TableCell>
                  <b>Giá tiền</b>
                </TableCell>
                <TableCell>
                  <b>Trạng thái</b>
                </TableCell>
                <TableCell>
                  <b>Điểm nhận</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.point}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewCustomer(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chỉnh sửa thông tin khách hàng */}
      <Dialog open={!!editCustomer} onClose={() => setEditCustomer(null)}>
        <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Tên khách hàng"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Số điện thoại"
            value={editForm.phone}
            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCustomer(null)}>Huỷ</Button>
          <Button
            onClick={async () => {
              if (!editCustomer) return;
              await supabase
                .from("customers")
                .update({ name: editForm.name, phone: editForm.phone })
                .eq("id", editCustomer.id);
              setEditCustomer(null);
              fetchCustomers();
            }}
            variant="contained"
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chỉnh sửa điểm */}
      <Dialog open={!!editPointCustomer} onClose={() => setEditPointCustomer(null)}>
        <DialogTitle>Trừ điểm tích luỹ & cập nhật ghi chú</DialogTitle>
        <DialogContent>
          <Typography>Điểm hiện tại: {editPointCustomer?.point || 0}</Typography>
          <TextField
            margin="dense"
            label="Nhập số điểm muốn trừ"
            value={pointInput}
            onChange={(e) => setPointInput(e.target.value)}
            fullWidth
            type="number"
          />
          <TextField
            margin="dense"
            label="Ghi chú khách hàng"
            value={editPointCustomer?.note || ""}
            onChange={(e) =>
              setEditPointCustomer(
                editPointCustomer ? { ...editPointCustomer, note: e.target.value } : null
              )
            }
            fullWidth
            multiline
            minRows={2}
          />
          {pointError && <Typography color="error">{pointError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPointCustomer(null)}>Huỷ</Button>
          <Button
            onClick={async () => {
              const value = Number(pointInput);
              if (pointInput && (isNaN(value) || value <= 0)) {
                setPointError("Vui lòng nhập số điểm hợp lệ");
                return;
              }
              if (pointInput && editPointCustomer && (editPointCustomer.point || 0) < value) {
                setPointError("Điểm trừ vượt quá điểm tích luỹ hiện tại");
                return;
              }
              if (editPointCustomer) {
                await supabase
                  .from("customers")
                  .update({
                    point: pointInput ? (editPointCustomer.point || 0) - value : editPointCustomer.point,
                    note: editPointCustomer.note
                  })
                  .eq("id", editPointCustomer.id);
                setEditPointCustomer(null);
                setPointInput("");
                fetchCustomers();
              }
            }}
            variant="contained"
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default CustomerManagement;
