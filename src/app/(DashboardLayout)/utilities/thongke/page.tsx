"use client";
import { useEffect, useState } from "react";
import {
  Box, Typography, Card, Stack, Button, TextField, MenuItem, Select, Table, TableHead, TableRow, TableCell, TableBody, Paper, Divider, Grid, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { supabase } from "@/utils/supabase";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ThongKePage = () => {
  // Bộ lọc thời gian
  const [filterType, setFilterType] = useState<'day'|'month'|'year'|'range'>('day');
  const [date, setDate] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Fix type for byCustomer
  interface ByCustomer {
    [key: string]: { total: number; count: number; name: string };
  }

  useEffect(() => {
    fetchData();
  }, [filterType, date, dateTo]);

  const getRange = () => {
    let from, to;
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    if (filterType === 'day') {
      from = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+07:00`;
      to = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T23:59:59+07:00`;
    } else if (filterType === 'month') {
      from = `${y}-${String(m).padStart(2, '0')}-01T00:00:00+07:00`;
      to = `${y}-${String(m).padStart(2, '0')}-31T23:59:59+07:00`;
    } else if (filterType === 'year') {
      from = `${y}-01-01T00:00:00+07:00`;
      to = `${y}-12-31T23:59:59+07:00`;
    } else {
      from = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T00:00:00+07:00`;
      to = `${dateTo.getFullYear()}-${String(dateTo.getMonth()+1).padStart(2,'0')}-${String(dateTo.getDate()).padStart(2,'0')}T23:59:59+07:00`;
    }
    return { from, to };
  };

  const fetchData = async () => {
    setLoading(true);
    const { from, to } = getRange();
    // Đơn hàng
    const { data: ordersData } = await supabase.from('orders').select('*').gte('created_at', from).lte('created_at', to);
    setOrders(ordersData || []);
    // Khách hàng
    const { data: customersData } = await supabase.from('customers').select('*');
    setCustomers(customersData || []);
    // Thống kê tổng
    const total = ordersData ? ordersData.reduce((acc, o) => acc + (o.amount || 0), 0) : 0;
    const done = ordersData ? ordersData.filter(o => o.status === 'delivered').length : 0;
    const cancelled = ordersData ? ordersData.filter(o => o.status === 'cancelled').length : 0;
    const delivering = ordersData ? ordersData.filter(o => o.status === 'pending').length : 0;
    // Khách hàng mua nhiều nhất
    let topCustomer = null, maxTotal = 0, maxCount = 0, avgOrder = 0;
    if (ordersData && ordersData.length > 0) {
      const byCustomer: ByCustomer = {};
      ordersData.forEach(o => {
        if (!byCustomer[o.customer_id]) byCustomer[o.customer_id] = { total: 0, count: 0, name: o.customer_name };
        byCustomer[o.customer_id].total += o.amount || 0;
        byCustomer[o.customer_id].count += 1;
      });
      for (const cid in byCustomer) {
        if (byCustomer[cid].total > maxTotal) {
          maxTotal = byCustomer[cid].total;
          maxCount = byCustomer[cid].count;
          topCustomer = byCustomer[cid].name;
        }
      }
      avgOrder = Math.round((total / ordersData.length) * 100) / 100;
    }
    setStats({ total, done, cancelled, delivering, topCustomer, maxTotal, maxCount, avgOrder });
    setLoading(false);
  };

  // Biểu đồ cột doanh thu theo ngày/tháng/năm
  const chartCategories = orders.map(o => new Date(o.created_at).toLocaleDateString());
  const chartData = orders.map(o => o.amount);
  // Biểu đồ tròn tỉ lệ đơn hoàn tất/hủy
  const pieData = [stats.done || 0, stats.cancelled || 0, stats.delivering || 0];

  // Xuất file Excel
  const exportExcel = () => {
    if (!orders || orders.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      orders.map((o: any) => ({
        'Mã đơn': o.id,
        'Ngày đặt': new Date(o.created_at).toLocaleDateString(),
        'Khách hàng': o.customer_name,
        'Sản phẩm': o.product,
        'Trạng thái': o.status,
        'Tổng tiền': o.amount
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng');
    XLSX.writeFile(wb, 'bao_cao_don_hang.xlsx');
  };

  return (
    <PageContainer title="Thống kê doanh thu" description="Báo cáo doanh thu, đơn hàng, khách hàng, biểu đồ, xuất file.">
      <Typography variant="h4" mb={2}>Thống kê doanh thu</Typography>
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} size="small">
            <MenuItem value="day">Ngày</MenuItem>
            <MenuItem value="month">Tháng</MenuItem>
            <MenuItem value="year">Năm</MenuItem>
            <MenuItem value="range">Khoảng thời gian</MenuItem>
          </Select>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <DatePicker
              label="Từ"
              value={date}
              onChange={(newValue) => { if (newValue) setDate(newValue as Date); }}
              renderInput={(params: any) => <TextField {...params} size="small" />}
            />
            {filterType === 'range' && (
              <DatePicker
                label="Đến"
                value={dateTo}
                onChange={(newValue) => { if (newValue) setDateTo(newValue as Date); }}
                renderInput={(params: any) => <TextField {...params} size="small" />}
              />
            )}
          </LocalizationProvider>
          <Button variant="contained" onClick={fetchData}>Lọc</Button>
          <Button variant="outlined" onClick={exportExcel}>Xuất Excel</Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={3}><Typography>Tổng doanh thu: <b>{stats.total?.toLocaleString('vi-VN')} ₫</b></Typography></Grid>
          <Grid item xs={12} md={2}><Typography>Số đơn: <b>{orders.length}</b></Typography></Grid>
          <Grid item xs={12} md={2}><Typography>Hoàn tất: <b>{stats.done}</b></Typography></Grid>
          <Grid item xs={12} md={2}><Typography>Huỷ: <b>{stats.cancelled}</b></Typography></Grid>
          <Grid item xs={12} md={2}><Typography>Đang giao: <b>{stats.delivering}</b></Typography></Grid>
        </Grid>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}><Typography>Khách hàng mua nhiều nhất: <b>{stats.topCustomer}</b> ({stats.maxCount} lần, {stats.maxTotal?.toLocaleString('vi-VN')} ₫)</Typography></Grid>
          <Grid item xs={12} md={4}><Typography>Giá trị đơn trung bình: <b>{stats.avgOrder?.toLocaleString('vi-VN')} ₫</b></Typography></Grid>
        </Grid>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" mb={1}>Biểu đồ doanh thu</Typography>
        <Chart options={{
          chart: { type: 'bar', toolbar: { show: false } },
          xaxis: { categories: chartCategories },
          yaxis: { labels: { formatter: (val: number) => val.toLocaleString('vi-VN') + ' ₫' } },
          dataLabels: { enabled: false },
        }} series={[{ name: 'Doanh thu', data: chartData }]} type="bar" height={250} />
        <Typography variant="h6" mt={3} mb={1}>Tỉ lệ đơn hàng</Typography>
        <Chart options={{
          chart: { type: 'pie' },
          labels: ['Hoàn tất', 'Huỷ', 'Đang giao'],
        }} series={pieData} type="pie" height={200} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" mb={1}>Chi tiết đơn hàng</Typography>
        <Paper variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><b>Mã đơn</b></TableCell>
                <TableCell><b>Ngày đặt</b></TableCell>
                <TableCell><b>Khách hàng</b></TableCell>
                <TableCell><b>Sản phẩm</b></TableCell>
                <TableCell><b>Trạng thái</b></TableCell>
                <TableCell><b>Tổng tiền</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell>{o.product}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>{o.amount?.toLocaleString('vi-VN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Card>
    </PageContainer>
  );
};

export default ThongKePage;
