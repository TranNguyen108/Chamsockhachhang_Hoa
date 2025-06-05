'use client';

import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

import { Box, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@mui/material/styles';

const YearlyBreakup = () => {
  const theme = useTheme();
  const [year, setYear] = useState(new Date().getFullYear());
  const [totals, setTotals] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);

  const fetchRevenueData = useCallback(async (startYear: number) => {
    setLoading(true);
    try {
      const range = Array.from({ length: 5 }, (_, i) => startYear - 2 + i);
      const newTotals: { [key: number]: number } = {};

      await Promise.all(
        range.map(async (y) => {
          const { data, error } = await supabase
            .from('orders')
            .select('amount')
            .gte('created_at', `${y}-01-01T00:00:00+07:00`)
            .lte('created_at', `${y}-12-31T23:59:59+07:00`)
            .eq('status', 'delivered');

          if (!error && data) {
            newTotals[y] = data.reduce((acc, o) => acc + (o.amount || 0), 0);
          }
        })
      );

      setTotals(newTotals);
    } catch (err) {
      console.error('Fetch revenue error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenueData(year);
  }, [year, fetchRevenueData]);

  const maxValue = useMemo(() => Math.max(...Object.values(totals)), [totals]);

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.paper,
        borderRadius: 3,
        boxShadow: 3,
        position: 'relative',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6"> Doanh thu năm</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setYear((y) => y - 1)} disabled={loading}>
            <IconArrowLeft />
          </IconButton>
          <IconButton onClick={() => setYear((y) => y + 1)} disabled={loading}>
            <IconArrowRight />
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="end" justifyContent="space-between" mt={4} spacing={2}>
        {Object.entries(totals).map(([y, total]) => {
          const height = maxValue ? (total / maxValue) * 100 : 0;
          const isCurrent = +y === year;

          return (
            <Stack key={y} alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <Tooltip title={`${parseInt(y)}: ${total.toLocaleString('vi-VN')} ₫`} arrow>
                <Box
                  sx={{
                    width: 18,
                    height: `${height}%`,
                    minHeight: 10,
                    bgcolor: isCurrent ? theme.palette.primary.main : '#ccc',
                    borderRadius: 2,
                    transition: '0.3s',
                  }}
                />
              </Tooltip>
              <Typography variant="caption" color={isCurrent ? 'primary' : 'textSecondary'}>
                {y}
              </Typography>
            </Stack>
          );
        })}
      </Stack>

      <Box mt={4} textAlign="center">
        <Typography variant="h4" fontWeight={600}>
          {loading
            ? 'Đang tải...'
            : `${(totals[year] || 0).toLocaleString('vi-VN')} ₫`}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Tổng doanh thu năm {year}
        </Typography>
      </Box>
    </Box>
  );
};

export default YearlyBreakup;
