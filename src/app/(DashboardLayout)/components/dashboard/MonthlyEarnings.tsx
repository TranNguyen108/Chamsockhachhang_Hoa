'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { Box, Typography, Stack, IconButton, Fab } from '@mui/material';
import { IconArrowLeft, IconArrowRight, IconCurrencyDollar } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

const MonthlyEarnings = () => {
  const theme = useTheme();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchRevenueData = useCallback(async (targetMonth: number, targetYear: number) => {
    setLoading(true);
    try {
      const from = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00+07:00`;
      const to = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00+07:00`;

      const { data } = await supabase
        .from('orders')
        .select('amount')
        .gte('created_at', from)
        .lt('created_at', to)
        .eq('status', 'delivered');

      const totalRevenue = data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      setTotal(totalRevenue);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenueData(month, year);
  }, [month, year, fetchRevenueData]);

  const handleMonthChange = (delta: number) => {
    setMonth(prevMonth => {
      let m = prevMonth + delta;
      let y = year;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      setYear(y);
      return m;
    });
  };

  return (
    <Box sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 3, boxShadow: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
       <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>Doanh thu tháng</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => handleMonthChange(-1)} disabled={loading}>
            <IconArrowLeft />
          </IconButton>
          <Typography fontWeight={600}>{`Tháng ${String(month).padStart(2, '0')}`}</Typography>
          <IconButton onClick={() => handleMonthChange(1)} disabled={loading}>
            <IconArrowRight />
          </IconButton>
        </Stack>
      </Stack>

      <Box mt={4} textAlign="center">
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
          <Typography variant="h4" fontWeight={600}>
            {loading ? 'Đang tải...' : `${total.toLocaleString('vi-VN')} ₫`}
          </Typography>
        </Stack>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Tổng doanh thu tháng {String(month).padStart(2, '0')}/{year}
        </Typography>
      </Box>
    </Box>
  );
};

export default MonthlyEarnings;
