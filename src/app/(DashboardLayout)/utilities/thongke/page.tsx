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
import BarChartIcon from "@mui/icons-material/BarChart";

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
  // Thêm state cho so sánh doanh thu 7 ngày
  const [compareStats, setCompareStats] = useState<{ current: number; previous: number; percent: number }>({
    current: 0,
    previous: 0,
    percent: 0,
  });
  // Thêm state cho so sánh trạng thái đơn hàng theo tháng
  const [monthCompare, setMonthCompare] = useState<{
    current: { done: number; cancelled: number; delivering: number };
    previous: { done: number; cancelled: number; delivering: number };
    percent: { done: number; cancelled: number; delivering: number };
  }>({
    current: { done: 0, cancelled: 0, delivering: 0 },
    previous: { done: 0, cancelled: 0, delivering: 0 },
    percent: { done: 0, cancelled: 0, delivering: 0 },
  });
  const [compareType, setCompareType] = useState<"day" | "month" | "year" | "range">("day");
  const [compareDate1, setCompareDate1] = useState<Date | null>(new Date());
  const [compareDate2, setCompareDate2] = useState<Date | null>(new Date());
  const [compareDate3, setCompareDate3] = useState<Date | null>(null);
  const [compareDate4, setCompareDate4] = useState<Date | null>(null);
  const [compareResult, setCompareResult] = useState<{ result1: Stats; result2: Stats } | null>(null);
  const [searchOrderId, setSearchOrderId] = useState("");

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
      // Lấy ngày cuối cùng của tháng
      const lastDay = new Date(y, m, 0).getDate();
      from = `${y}-${String(m).padStart(2, "0")}-01T00:00:00+07:00`;
      to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59+07:00`;
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
      if (!ordersData) throw new Error("Không có dữ liệu trả về từ Supabase");
      const ordersList = Array.isArray(ordersData) ? ordersData : [];
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
    } catch (error: any) {
      // Log lỗi chi tiết hơn
      console.error("Lỗi khi lấy dữ liệu thống kê:", error?.message || error);
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

  // So sánh doanh thu 7 ngày
  useEffect(() => {
    const last7 = getLast7Days(orders);
    const prev7 = getPrev7Days(orders);
    const current = Object.values(last7).reduce((a, b) => a + b, 0);
    const previous = Object.values(prev7).reduce((a, b) => a + b, 0);
    const percent = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
    setCompareStats({ current, previous, percent });
  }, [orders]);

  // Lấy 7 ngày gần nhất
  const getLast7Days = (orders: Order[]) => {
    const days: { [date: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("vi-VN");
      days[key] = 0;
    }
    orders.forEach((o) => {
      const key = new Date(o.created_at).toLocaleDateString("vi-VN");
      if (days[key] !== undefined) days[key] += o.amount || 0;
    });
    return days;
  };

  // Lấy 7 ngày trước đó
  const getPrev7Days = (orders: Order[]) => {
    const days: { [date: string]: number } = {};
    for (let i = 13; i >= 7; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("vi-VN");
      days[key] = 0;
    }
    orders.forEach((o) => {
      const key = new Date(o.created_at).toLocaleDateString("vi-VN");
      if (days[key] !== undefined) days[key] += o.amount || 0;
    });
    return days;
  };

  // Dữ liệu biểu đồ doanh thu 7 ngày gần nhất
  const last7Days = useMemo(() => getLast7Days(orders), [orders]);
  const chartCategories = useMemo(() => Object.keys(last7Days), [last7Days]);
  const chartData = useMemo(() => Object.values(last7Days), [last7Days]);
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

  // Hàm lấy đơn hàng theo tháng bất kỳ
  const getOrdersByMonth = (orders: Order[], year: number, month: number) => {
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  };

  // Hàm lấy đơn hàng theo năm bất kỳ
  const getOrdersByYear = (orders: Order[], year: number) => {
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getFullYear() === year;
    });
  };

  // So sánh trạng thái đơn hàng giữa tháng/tháng trước hoặc năm/năm trước
  useEffect(() => {
    if (filterType !== "month" && filterType !== "year") return;
    if (!date) return;
    let current: { done: number; cancelled: number; delivering: number } = { done: 0, cancelled: 0, delivering: 0 };
    let previous: { done: number; cancelled: number; delivering: number } = { done: 0, cancelled: 0, delivering: 0 };
    if (filterType === "month") {
      const now = date;
      const prev = new Date(date);
      prev.setMonth(now.getMonth() - 1);
      const ordersCurrent = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      const ordersPrev = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
      });
      const countStatus = (arr: Order[]) => ({
        done: arr.filter((o) => o.status === "delivered").length,
        cancelled: arr.filter((o) => o.status === "cancelled").length,
        delivering: arr.filter((o) => o.status === "pending").length,
      });
      current = countStatus(ordersCurrent);
      previous = countStatus(ordersPrev);
    } else if (filterType === "year") {
      const nowYear = date.getFullYear();
      const prevYear = nowYear - 1;
      const ordersCurrent = getOrdersByYear(orders, nowYear);
      const ordersPrev = getOrdersByYear(orders, prevYear);
      const countStatus = (arr: Order[]) => ({
        done: arr.filter((o) => o.status === "delivered").length,
        cancelled: arr.filter((o) => o.status === "cancelled").length,
        delivering: arr.filter((o) => o.status === "pending").length,
      });
      current = countStatus(ordersCurrent);
      previous = countStatus(ordersPrev);
    }
    const percent = {
      done: previous.done === 0 ? 0 : Math.round(((current.done - previous.done) / previous.done) * 100),
      cancelled: previous.cancelled === 0 ? 0 : Math.round(((current.cancelled - previous.cancelled) / previous.cancelled) * 100),
      delivering: previous.delivering === 0 ? 0 : Math.round(((current.delivering - previous.delivering) / previous.delivering) * 100),
    };
    setMonthCompare({ current, previous, percent });
  }, [orders, filterType, date]);

  return (
    <PageContainer title="Thống kê doanh thu" description="Báo cáo doanh thu, đơn hàng, khách hàng, biểu đồ, xuất file.">
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <BarChartIcon color="primary" fontSize="large" />
        <Typography variant="h4">Thống kê doanh thu</Typography>
      </Box>
      {/* Card bộ lọc */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" flexWrap="wrap">
          <Box minWidth={140}>
            <Typography fontWeight={500} mb={0.5} fontSize={14}>
              Kiểu lọc
            </Typography>
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
          </Box>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            {filterType === "day" && (
              <Box minWidth={160}>
                <Typography fontWeight={500} mb={0.5} fontSize={14}>Chọn ngày</Typography>
                <DatePicker
                  views={["year", "month", "day"]}
                  value={date}
                  onChange={(newValue) => newValue && setDate(newValue)}
                  slotProps={{ textField: { size: "small" } }}
                />
              </Box>
            )}
            {filterType === "month" && (
              <Box minWidth={160}>
                <Typography fontWeight={500} mb={0.5} fontSize={14}>Chọn tháng/năm</Typography>
                <DatePicker
                  views={["year", "month"]}
                  openTo="month"
                  value={date}
                  onChange={(newValue) => newValue && setDate(newValue)}
                  slotProps={{ textField: { size: "small" } }}
                />
              </Box>
            )}
            {filterType === "year" && (
              <Box minWidth={160}>
                <Typography fontWeight={500} mb={0.5} fontSize={14}>Chọn năm</Typography>
                <DatePicker
                  views={["year"]}
                  openTo="year"
                  value={date}
                  onChange={(newValue) => newValue && setDate(newValue)}
                  slotProps={{ textField: { size: "small" } }}
                />
              </Box>
            )}
            {filterType === "range" && (
              <>
                <Box minWidth={160}>
                  <Typography fontWeight={500} mb={0.5} fontSize={14}>Từ ngày</Typography>
                  <DatePicker
                    views={["year", "month", "day"]}
                    value={date}
                    onChange={(newValue) => newValue && setDate(newValue)}
                    slotProps={{ textField: { size: "small" } }}
                  />
                </Box>
                <Box minWidth={160}>
                  <Typography fontWeight={500} mb={0.5} fontSize={14}>Đến ngày</Typography>
                  <DatePicker
                    views={["year", "month", "day"]}
                    value={dateTo}
                    onChange={(newValue) => newValue && setDateTo(newValue)}
                    slotProps={{ textField: { size: "small" } }}
                  />
                </Box>
              </>
            )}
          </LocalizationProvider>
          <Button variant="contained" onClick={fetchData} disabled={loading} sx={{ minWidth: 100 }}>
            {loading ? "Đang tải..." : "Lọc"}
          </Button>
          <Button variant="outlined" onClick={exportExcel} disabled={orders.length === 0} sx={{ minWidth: 120 }}>
            Xuất Excel
          </Button>
        </Stack>
      </Card>
      {/* Card thống kê tổng quan */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 1, background: "#f8fafc" }}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <Box flex={3} minWidth={180}>
            <Typography>
              Tổng doanh thu: <b>{stats.total.toLocaleString("vi-VN")} ₫</b>
            </Typography>
          </Box>
          <Box flex={2} minWidth={120}>
            <Typography>
              Số đơn: <b>{orders.length}</b>
            </Typography>
          </Box>
          <Box flex={2} minWidth={120}>
            <Typography>
              Hoàn tất: <b>{stats.done}</b>
            </Typography>
          </Box>
          <Box flex={2} minWidth={120}>
            <Typography>
              Huỷ: <b>{stats.cancelled}</b>
            </Typography>
          </Box>
          <Box flex={2} minWidth={120}>
            <Typography>
              Đang giao: <b>{stats.delivering}</b>
            </Typography>
          </Box>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <Box flex={4} minWidth={200}>
            <Typography>
              Khách hàng mua nhiều nhất:{" "}
              <b>
                {stats.topCustomer || "-"} ({stats.maxCount} lần, {stats.maxTotal.toLocaleString("vi-VN")} ₫)
              </b>
            </Typography>
          </Box>
          <Box flex={4} minWidth={200}>
            <Typography>
              Giá trị đơn trung bình: <b>{stats.avgOrder.toLocaleString("vi-VN")} ₫</b>
            </Typography>
          </Box>
        </Box>
      </Card>
      {/* Biểu đồ chỉ xuất hiện khi lọc ngày */}
      {filterType === "day" && (
        <>
          <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6">Biểu đồ doanh thu 7 ngày gần nhất</Typography>
              <Box>
                <Typography fontSize={14}>
                  7 ngày gần nhất: <b>{compareStats.current.toLocaleString("vi-VN")} ₫</b>
                </Typography>
                <Typography fontSize={14}>
                  7 ngày trước đó: <b>{compareStats.previous.toLocaleString("vi-VN")} ₫</b>
                </Typography>
                <Typography
                  fontSize={14}
                  color={compareStats.percent >= 0 ? "success.main" : "error.main"}
                >
                  {compareStats.percent >= 0 ? "+" : ""}
                  {compareStats.percent}% so với tuần trước
                </Typography>
              </Box>
            </Box>
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
          </Card>
          <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 1 }}>
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
          </Card>
        </>
      )}

      {/* Card so sánh trạng thái đơn hàng tháng/tháng trước hoặc năm/năm trước */}
      {(filterType === "month" || filterType === "year") && (
        <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 1, background: "#f8fafc" }}>
          <Typography variant="subtitle1" mb={1} fontWeight={600}>
            So sánh trạng thái đơn hàng {filterType === "month" ? "tháng này và tháng trước" : "năm này và năm trước"}
          </Typography>
          <Box display="flex" gap={4}>
            <Box>
              <Typography fontWeight={500}>{filterType === "month" ? "Tháng này" : "Năm nay"}</Typography>
              <Typography fontSize={14}>Hoàn tất: <b>{monthCompare.current.done}</b></Typography>
              <Typography fontSize={14}>Huỷ: <b>{monthCompare.current.cancelled}</b></Typography>
              <Typography fontSize={14}>Đang giao: <b>{monthCompare.current.delivering}</b></Typography>
            </Box>
            <Box>
              <Typography fontWeight={500}>{filterType === "month" ? "Tháng trước" : "Năm trước"}</Typography>
              <Typography fontSize={14}>Hoàn tất: <b>{monthCompare.previous.done}</b></Typography>
              <Typography fontSize={14}>Huỷ: <b>{monthCompare.previous.cancelled}</b></Typography>
              <Typography fontSize={14}>Đang giao: <b>{monthCompare.previous.delivering}</b></Typography>
            </Box>
            <Box>
              <Typography fontWeight={500}>Tăng/giảm</Typography>
              <Typography fontSize={14} color={monthCompare.percent.done >= 0 ? "success.main" : "error.main"}>
                Hoàn tất: {monthCompare.percent.done >= 0 ? "+" : ""}{monthCompare.percent.done}%
              </Typography>
              <Typography fontSize={14} color={monthCompare.percent.cancelled >= 0 ? "success.main" : "error.main"}>
                Huỷ: {monthCompare.percent.cancelled >= 0 ? "+" : ""}{monthCompare.percent.cancelled}%
              </Typography>
              <Typography fontSize={14} color={monthCompare.percent.delivering >= 0 ? "success.main" : "error.main"}>
                Đang giao: {monthCompare.percent.delivering >= 0 ? "+" : ""}{monthCompare.percent.delivering}%
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "#fff" }}>
        <Typography variant="h6" mb={2}>
          Danh sách đơn hàng
        </Typography>
        <Paper sx={{ maxHeight: 400, overflow: "auto", borderRadius: 2, boxShadow: 0, background: "#f6f8fa", mb: 2 }}>
          <Box p={2}>
            <TextField
              label="Tìm kiếm theo mã đơn hàng"
              value={searchOrderId}
              onChange={e => setSearchOrderId(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />
          </Box>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ background: "#e3e9f6" }}>
                <TableCell sx={{ fontWeight: 700 }}>Mã đơn</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày đặt</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Tổng tiền (₫)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.filter(o => o.id.toString().toLowerCase().includes(searchOrderId.toLowerCase())).map(({ id, created_at, customer_name, product, status, amount }, idx) => (
                <TableRow
                  key={id}
                  sx={{
                    background: idx % 2 === 0 ? "#fff" : "#f0f4fa",
                    transition: "background 0.2s",
                    "&:hover": { background: "#e3e9f6" },
                  }}
                >
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
      </Card>
    </PageContainer>
  );
};

export default ThongKePage;
