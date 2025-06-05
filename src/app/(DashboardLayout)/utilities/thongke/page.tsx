"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  Stack,
  Button,
  TextField,
  MenuItem,
  Select,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Divider,
  Grid,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi } from "date-fns/locale";
import { supabase } from "@/utils/supabase";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Order {
  id: string | number;
  created_at: string;
  customer_name: string;
  customer_id: string | number;
  product: string;
  status: string;
  amount: number;
}

interface Stats {
  total: number;
  done: number;
  cancelled: number;
  delivering: number;
  topCustomer: string | null;
  maxTotal: number;
  maxCount: number;
  avgOrder: number;
}

const ThongKePage = () => {
  const [filterType, setFilterType] = useState<"day" | "month" | "year" | "range">("day");
  const [date, setDate] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    done: 0,
    cancelled: 0,
    delivering: 0,
    topCustomer: null,
    maxTotal: 0,
    maxCount: 0,
    avgOrder: 0,
  });

  const getRange = useCallback(() => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    let from = "";
    let to = "";

    if (filterType === "day") {
      from = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+07:00`;
      to = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T23:59:59+07:00`;
    } else if (filterType === "month") {
      from = `${y}-${String(m).padStart(2, "0")}-01T00:00:00+07:00`;
      to = `${y}-${String(m).padStart(2, "0")}-31T23:59:59+07:00`;
    } else if (filterType === "year") {
      from = `${y}-01-01T00:00:00+07:00`;
      to = `${y}-12-31T23:59:59+07:00`;
    } else {
      from = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}T00:00:00+07:00`;
      to = `${dateTo.getFullYear()}-${String(dateTo.getMonth() + 1).padStart(2, "0")}-${String(
        dateTo.getDate()
      ).padStart(2, "0")}T23:59:59+07:00`;
    }
    return { from, to };
  }, [date, dateTo, filterType]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getRange();

      // Lấy đơn hàng trong khoảng thời gian
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to);

      if (ordersError) throw ordersError;
      const ordersList = ordersData || [];
      setOrders(ordersList);

      // Thống kê tổng hợp
      const total = ordersList.reduce((acc, o) => acc + (o.amount || 0), 0);
      const done = ordersList.filter((o) => o.status === "delivered").length;
      const cancelled = ordersList.filter((o) => o.status === "cancelled").length;
      const delivering = ordersList.filter((o) => o.status === "pending").length;

      // Tính khách hàng mua nhiều nhất
      interface ByCustomer {
        [key: string]: { total: number; count: number; name: string };
      }
      const byCustomer: ByCustomer = {};
      ordersList.forEach((o) => {
        if (!byCustomer[o.customer_id])
          byCustomer[o.customer_id] = { total: 0, count: 0, name: o.customer_name };
        byCustomer[o.customer_id].total += o.amount || 0;
        byCustomer[o.customer_id].count += 1;
      });

      let topCustomer = null;
      let maxTotal = 0;
      let maxCount = 0;
      for (const cid in byCustomer) {
        if (byCustomer[cid].total > maxTotal) {
          maxTotal = byCustomer[cid].total;
          maxCount = byCustomer[cid].count;
          topCustomer = byCustomer[cid].name;
        }
      }

      const avgOrder = ordersList.length > 0 ? Math.round((total / ordersList.length) * 100) / 100 : 0;

      setStats({ total, done, cancelled, delivering, topCustomer, maxTotal, maxCount, avgOrder });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu thống kê:", error);
      setOrders([]);
      setStats({
        total: 0,
        done: 0,
        cancelled: 0,
        delivering: 0,
        topCustomer: null,
        maxTotal: 0,
        maxCount: 0,
        avgOrder: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [getRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dữ liệu biểu đồ doanh thu
  const chartCategories = useMemo(
    () => orders.map((o) => new Date(o.created_at).toLocaleDateString("vi-VN")),
    [orders]
  );
  const chartData = useMemo(() => orders.map((o) => o.amount), [orders]);
  const pieData = useMemo(() => [stats.done, stats.cancelled, stats.delivering], [stats]);

  const exportExcel = () => {
    if (!orders || orders.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      orders.map((o) => ({
        "Mã đơn": o.id,
        "Ngày đặt": new Date(o.created_at).toLocaleDateString("vi-VN"),
        "Khách hàng": o.customer_name,
        "Sản phẩm": o.product,
        "Trạng thái": o.status,
        "Tổng tiền": o.amount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");
    XLSX.writeFile(wb, "bao_cao_don_hang.xlsx");
  };

  return (
    <PageContainer title="Thống kê doanh thu" description="Báo cáo doanh thu, đơn hàng, khách hàng, biểu đồ, xuất file.">
      <Typography variant="h4" mb={2}>
        Thống kê doanh thu
      </Typography>
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2} flexWrap="wrap">
          <Select
            size="small"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="day">Ngày</MenuItem>
            <MenuItem value="month">Tháng</MenuItem>
            <MenuItem value="year">Năm</MenuItem>
            <MenuItem value="range">Khoảng thời gian</MenuItem>
          </Select>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <DatePicker
              label="Từ"
              value={date}
              onChange={(newValue) => newValue && setDate(newValue)}
              slotProps={{ textField: { size: "small" } }}
            />
            {filterType === "range" && (
              <DatePicker
                label="Đến"
                value={dateTo}
                onChange={(newValue) => newValue && setDateTo(newValue)}
                slotProps={{ textField: { size: "small" } }}
              />
            )}
          </LocalizationProvider>

          <Button variant="contained" onClick={fetchData} disabled={loading}>
            {loading ? "Đang tải..." : "Lọc"}
          </Button>
          <Button variant="outlined" onClick={exportExcel} disabled={orders.length === 0}>
            Xuất Excel
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={3}>
            <Typography>
              Tổng doanh thu: <b>{stats.total.toLocaleString("vi-VN")} ₫</b>
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography>
              Số đơn: <b>{orders.length}</b>
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography>
              Hoàn tất: <b>{stats.done}</b>
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography>
              Huỷ: <b>{stats.cancelled}</b>
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography>
              Đang giao: <b>{stats.delivering}</b>
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <Typography>
              Khách hàng mua nhiều nhất:{" "}
              <b>
                {stats.topCustomer || "-"} ({stats.maxCount} lần, {stats.maxTotal.toLocaleString("vi-VN")} ₫)
              </b>
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography>
              Giá trị đơn trung bình: <b>{stats.avgOrder.toLocaleString("vi-VN")} ₫</b>
            </Typography>
          </Grid>
        </Grid>

        <Box>
          <Typography variant="h6" mb={1}>
            Biểu đồ doanh thu theo ngày
          </Typography>
          <Chart
            options={{
              chart: { id: "revenue-chart" },
              xaxis: { categories: chartCategories },
              stroke: { curve: "smooth" },
              tooltip: { enabled: true },
            }}
            series={[{ name: "Doanh thu", data: chartData }]}
            type="line"
            height={300}
          />
        </Box>

        <Box mt={4}>
          <Typography variant="h6" mb={1}>
            Biểu đồ trạng thái đơn hàng
          </Typography>
          <Chart
            options={{
              labels: ["Hoàn tất", "Huỷ", "Đang giao"],
              legend: { position: "bottom" },
              colors: ["#4caf50", "#f44336", "#2196f3"],
            }}
            series={pieData}
            type="donut"
            height={300}
          />
        </Box>

        <Box mt={4}>
          <Typography variant="h6" mb={1}>
            Danh sách đơn hàng
          </Typography>
          <Paper sx={{ maxHeight: 400, overflow: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã đơn</TableCell>
                  <TableCell>Ngày đặt</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Tổng tiền (₫)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(({ id, created_at, customer_name, product, status, amount }) => (
                  <TableRow key={id}>
                    <TableCell>{id}</TableCell>
                    <TableCell>{new Date(created_at).toLocaleString("vi-VN")}</TableCell>
                    <TableCell>{customer_name}</TableCell>
                    <TableCell>{product}</TableCell>
                    <TableCell>{status}</TableCell>
                    <TableCell align="right">{amount.toLocaleString("vi-VN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </Card>
    </PageContainer>
  );
};

export default ThongKePage;
