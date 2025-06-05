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
  const [editForm, setEditForm] = useState({ name: "", phone: "", note: "", point: "0" });

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

  // Thêm hàm mở dialog sửa khách hàng
  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      note: customer.note || "",
      point: customer.point?.toString() || "0",
    });
  };

  // Thêm hàm lưu chỉnh sửa
  const handleEditSave = async () => {
    if (!editCustomer) return;
    if (!editForm.name || !editForm.phone) {
      setError("Vui lòng nhập tên và số điện thoại");
      return;
    }
    // Tính điểm mới: trừ số điểm nhập vào điểm hiện có
    const currentPoint = Number(editCustomer.point) || 0;
    const subtractPoint = Number(editForm.point) || 0;
    if (subtractPoint < 0) {
      setError("Số điểm trừ phải lớn hơn hoặc bằng 0");
      return;
    }
    if (subtractPoint > currentPoint) {
      setError("Không thể trừ nhiều hơn số điểm hiện có");
      return;
    }
    const newPoint = currentPoint - subtractPoint;
    const updates: any = {
      name: editForm.name,
      phone: editForm.phone,
      note: editForm.note,
      point: newPoint,
    };
    await supabase.from("customers").update(updates).eq("id", editCustomer.id);
    setEditCustomer(null);
    fetchCustomers();
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
                  <TableCell sx={{ minWidth: 120 }}>{c.note || "-"}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{c.point || 0}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(c)} sx={{ color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' } }}><IconEdit size={18} /></IconButton>
                    <IconButton onClick={() => handleDelete(c.id)} sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}><IconTrash size={18} /></IconButton>
                    <IconButton onClick={() => handleView(c)} sx={{ color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' } }}><IconEye size={18} /></IconButton>
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

      {/* Dialog sửa khách hàng */}
      <Dialog open={!!editCustomer} onClose={() => setEditCustomer(null)}>
        <DialogTitle>Sửa khách hàng</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Tên khách hàng"
            name="name"
            value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Số điện thoại"
            name="phone"
            value={editForm.phone}
            onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Ghi chú"
            name="note"
            value={editForm.note}
            onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
            fullWidth
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, mb: 0.5 }}>
            Nhập số điểm muốn trừ
          </Typography>
          <TextField
            margin="dense"
            label="Điểm tích luỹ"
            name="point"
            type="number"
            value={editForm.point}
            onChange={e => setEditForm(f => ({ ...f, point: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCustomer(null)}>Huỷ</Button>
          <Button onClick={handleEditSave} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default CustomerManagement;
