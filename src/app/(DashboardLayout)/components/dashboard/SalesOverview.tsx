import { useEffect, useState } from 'react';
import { Card, Typography, Stack } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { supabase } from '@/utils/supabase';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SalesOverview = () => {
  const [chartData, setChartData] = useState({
    categories: [],
    users: [],
    orders: [],
    done: [],
    cancelled: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const days = 7;
    const today = new Date();
    let categories = [];
    let users = [];
    let orders = [];
    let done = [];
    let cancelled = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const from = new Date(d.setHours(0,0,0,0)).toISOString();
      const to = new Date(d.setHours(23,59,59,999)).toISOString();
      categories.push(`${d.getDate()}/${d.getMonth()+1}`);
      // Người dùng mới
      const { count: userCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', from).lte('created_at', to);
      users.push(userCount || 0);
      // Đơn hàng
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', from).lte('created_at', to);
      orders.push(orderCount || 0);
      // Đơn hoàn thành
      const { count: doneCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', from).lte('created_at', to).eq('status', 'delivered');
      done.push(doneCount || 0);
      // Đơn huỷ
      const { count: cancelCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', from).lte('created_at', to).eq('status', 'cancelled');
      cancelled.push(cancelCount || 0);
    }
    setChartData({ categories, users, orders, done, cancelled });
  };

  const options = {
    chart: { type: 'bar', toolbar: { show: false } },
    xaxis: { categories: chartData.categories },
    yaxis: { title: { text: 'Số lượng' } },
    plotOptions: { bar: { horizontal: false, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    colors: ['#1976d2', '#43a047', '#ff9800', '#e53935'],
    legend: { show: true, position: 'top' },
  };

  const series = [
    { name: 'Người dùng mới', data: chartData.users },
    { name: 'Đơn hàng', data: chartData.orders },
    { name: 'Đơn hoàn thành', data: chartData.done },
    { name: 'Đơn huỷ', data: chartData.cancelled },
  ];

  return (
    <DashboardCard title="Tổng quan 7 ngày qua">
      <Stack spacing={2}>
        <Chart options={options} series={series} type="bar" height={350} />
      </Stack>
    </DashboardCard>
  );
};

export default SalesOverview;
