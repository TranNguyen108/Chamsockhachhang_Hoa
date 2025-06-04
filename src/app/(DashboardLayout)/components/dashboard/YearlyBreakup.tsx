import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, Avatar, IconButton } from '@mui/material';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

const YearlyBreakup = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = '#ecf2ff';
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<number[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    let arr = [];
    let sum = 0;
    for (let m = 1; m <= 12; m++) {
      const from = `${year}-${String(m).padStart(2, '0')}-01T00:00:00+07:00`;
      const to = `${year}-${String(m).padStart(2, '0')}-31T23:59:59+07:00`;
      const { data: orders } = await supabase.from('orders').select('amount').gte('created_at', from).lte('created_at', to).eq('status', 'delivered');
      const monthSum = orders ? orders.reduce((acc, o) => acc + (o.amount || 0), 0) : 0;
      arr.push(monthSum);
      sum += monthSum;
    }
    setData(arr);
    setTotal(sum);
  };

  const options = {
    chart: { type: 'bar', toolbar: { show: false } },
    xaxis: { categories: [
      'T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'] },
    yaxis: { labels: { formatter: (val: number) => val.toLocaleString('vi-VN') + ' ₫' } },
    colors: [primary],
    dataLabels: { enabled: false },
    grid: { show: true },
  };

  return (
    <DashboardCard title="Doanh thu năm">
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={7}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => setYear(y => y - 1)}><IconArrowLeft /></IconButton>
            <Typography variant="h3" fontWeight="700">{total.toLocaleString('vi-VN')} ₫</Typography>
            <IconButton onClick={() => setYear(y => y + 1)}><IconArrowRight /></IconButton>
          </Stack>
          <Typography variant="subtitle2" color="textSecondary">Năm {year}</Typography>
        </Grid>
        <Grid item xs={5}>
          <Chart options={options} series={[{ name: 'Doanh thu', data }]} type="bar" height={150} width={"100%"} />
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default YearlyBreakup;
