import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from '@mui/material/styles';
import { Stack, Typography, Avatar, Fab, IconButton, Menu, MenuItem } from '@mui/material';
import { IconCurrencyDollar, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

const MonthlyEarnings = () => {
  const theme = useTheme();
  const secondary = theme.palette.secondary.main;
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'month'|'day'>('month');

  useEffect(() => {
    fetchData();
  }, [month, year, viewMode]);

  const fetchData = async () => {
    if (viewMode === 'month') {
      // Doanh thu từng ngày trong tháng
      let arr = [];
      let sum = 0;
      const days = new Date(year, month, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const from = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+07:00`;
        const to = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}T23:59:59+07:00`;
        const { data: orders } = await supabase.from('orders').select('amount').gte('created_at', from).lte('created_at', to).eq('status', 'delivered');
        const daySum = orders ? orders.reduce((acc, o) => acc + (o.amount || 0), 0) : 0;
        arr.push(daySum);
        sum += daySum;
      }
      setData(arr);
      setTotal(sum);
      // Tháng trước
      let prevSum = 0;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevDays = new Date(prevYear, prevMonth, 0).getDate();
      for (let d = 1; d <= prevDays; d++) {
        const from = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+07:00`;
        const to = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}T23:59:59+07:00`;
        const { data: orders } = await supabase.from('orders').select('amount').gte('created_at', from).lte('created_at', to).eq('status', 'delivered');
        prevSum += orders ? orders.reduce((acc, o) => acc + (o.amount || 0), 0) : 0;
      }
      setPrevTotal(prevSum);
    }
  };

  const handleMonthChange = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  };

  const percent = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

  const options = {
    chart: { type: 'line', toolbar: { show: false } },
    xaxis: { categories: Array.from({length: new Date(year, month, 0).getDate()}, (_, i) => `${i+1}`) },
    yaxis: { labels: { formatter: (val: number) => val.toLocaleString('vi-VN') + ' ₫' } },
    colors: [secondary],
    dataLabels: { enabled: false },
    grid: { show: true },
  };

  return (
    <DashboardCard
      title="Doanh thu tháng"
      action={
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => handleMonthChange(-1)}><IconArrowLeft /></IconButton>
          <Typography>{month}/{year}</Typography>
          <IconButton onClick={() => handleMonthChange(1)}><IconArrowRight /></IconButton>
        </Stack>
      }
      footer={
        <Chart options={options} series={[{ name: 'Doanh thu', data }]} type="line" height={60} width={"100%"} />
      }
    >
      <>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Fab color="secondary" size="medium" sx={{color: '#ffffff'}}>
            <IconCurrencyDollar width={24} />
          </Fab>
          <Typography variant="h3" fontWeight="700" mt="-20px">
            {total.toLocaleString('vi-VN')} ₫
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} my={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight="600" color={percent >= 0 ? 'green' : 'red'}>
            {percent >= 0 ? '+' : ''}{percent}%
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            so với tháng trước
          </Typography>
        </Stack>
      </>
    </DashboardCard>
  );
};

export default MonthlyEarnings;
