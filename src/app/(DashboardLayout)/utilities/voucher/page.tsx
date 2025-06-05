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
  MenuItem,
  Select,
} from "@mui/material";
import { supabase } from "@/utils/supabase";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconEdit, IconTrash } from "@tabler/icons-react";

interface Voucher {
  id: string;
  code: string;
  discount: number;
  expired_at: string;
  status: "active" | "expired";
}

const percentOptions = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 95, 100];

function randomVoucherCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 9; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", discount: 10, expired_at: "" });
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [editForm, setEditForm] = useState({ discount: 10, expired_at: "", status: "active" });

  useEffect(() => { fetchVouchers(); }, []);

  const fetchVouchers = async () => {
    const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
    setVouchers(data || []);
  };

  const handleOpen = () => {
    setForm({ code: "", discount: 10, expired_at: "" });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleAdd = async () => {
    if (!form.code || !form.discount || !form.expired_at) return;
    await supabase.from("vouchers").insert([{ ...form, status: "active" }]);
    setOpen(false);
    fetchVouchers();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vouchers").delete().eq("id", id);
    fetchVouchers();
  };

  const handleEdit = (v: Voucher) => {
    setEditVoucher(v);
    setEditForm({ discount: v.discount, expired_at: v.expired_at, status: v.status });
  };

  const handleEditSave = async () => {
    if (!editVoucher) return;
    await supabase.from("vouchers").update(editForm).eq("id", editVoucher.id);
    setEditVoucher(null);
    fetchVouchers();
  };

  const checkStatus = (v: Voucher) => {
    if (v.status === "expired") return "Hết hạn";
    if (new Date(v.expired_at) < new Date()) return "Hết hạn";
    return "Còn hạn";
  };

  return (
    <PageContainer title="Quản lý Voucher" description="Tạo, sửa, xoá voucher giảm giá cho shop hoa.">
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4">Quản lý Voucher</Typography>
          <Button variant="contained" color="primary" onClick={handleOpen}>Thêm voucher</Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Paper variant="outlined" sx={{ mt: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell><b>Voucher code</b></TableCell>
                <TableCell><b>Giảm giá (%)</b></TableCell>
                <TableCell><b>Hạn sử dụng</b></TableCell>
                <TableCell><b>Tình trạng</b></TableCell>
                <TableCell><b>Hành động</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vouchers.map((v) => (
                <TableRow key={v.id} hover sx={{ transition: 'background 0.2s', cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}>
                  <TableCell>{v.code}</TableCell>
                  <TableCell>{v.discount}%</TableCell>
                  <TableCell>{new Date(v.expired_at).toLocaleDateString()}</TableCell>
                  <TableCell>{checkStatus(v)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(v)} sx={{ color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' } }}><IconEdit size={18} /></IconButton>
                    <IconButton onClick={() => handleDelete(v.id)} sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}><IconTrash size={18} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Card>
      {/* Dialog thêm voucher */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Thêm voucher mới</DialogTitle>
        <DialogContent>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <TextField label="Voucher Code" value={form.code} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
            <Button onClick={() => setForm(f => ({ ...f, code: randomVoucherCode() }))} variant="outlined">Tạo</Button>
          </Stack>
          <Select
            label="Phần trăm giảm giá"
            value={form.discount}
            onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
            fullWidth
            sx={{ mb: 2 }}
          >
            {percentOptions.map(p => (
              <MenuItem key={p} value={p}>{p}%</MenuItem>
            ))}
          </Select>
          <TextField
            label="Ngày hết hạn"
            type="date"
            value={form.expired_at}
            onChange={e => setForm(f => ({ ...f, expired_at: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Huỷ</Button>
          <Button onClick={handleAdd} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog sửa voucher */}
      <Dialog open={!!editVoucher} onClose={() => setEditVoucher(null)}>
        <DialogTitle>Sửa voucher</DialogTitle>
        <DialogContent>
          <Select
            label="Phần trăm giảm giá"
            value={editForm.discount}
            onChange={e => setEditForm(f => ({ ...f, discount: Number(e.target.value) }))}
            fullWidth
            sx={{ mb: 2 }}
          >
            {percentOptions.map(p => (
              <MenuItem key={p} value={p}>{p}%</MenuItem>
            ))}
          </Select>
          <TextField
            label="Ngày hết hạn"
            type="date"
            value={editForm.expired_at}
            onChange={e => setEditForm(f => ({ ...f, expired_at: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <Select
            label="Tình trạng"
            value={editForm.status}
            onChange={e => setEditForm(f => ({ ...f, status: e.target.value as any }))}
            fullWidth
          >
            <MenuItem value="active">Còn hạn</MenuItem>
            <MenuItem value="expired">Hết hạn</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditVoucher(null)}>Huỷ</Button>
          <Button onClick={handleEditSave} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default VoucherPage;
