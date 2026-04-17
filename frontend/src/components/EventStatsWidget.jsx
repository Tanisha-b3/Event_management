import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowDownward,
  ArrowUpward,
  EventAvailable,
  Insights,
  MonetizationOn,
  PeopleAlt,
  TrendingUp,
} from '@mui/icons-material';
import { apiClient } from '../utils/api';

const defaultStats = [
  {
    label: 'Registrations',
    value: 1248,
    delta: 12.4,
    trend: 'up',
    helpText: 'vs last 7 days',
    icon: <PeopleAlt fontSize="small" />,
    progress: 72,
  },
  {
    label: 'Revenue',
    value: 84200,
    prefix: '$',
    delta: 8.1,
    trend: 'up',
    helpText: 'net after fees',
    icon: <MonetizationOn fontSize="small" />,
    progress: 64,
  },
  {
    label: 'Conversion',
    value: 4.8,
    suffix: '%',
    delta: -0.3,
    trend: 'down',
    helpText: 'checkout completion',
    icon: <TrendingUp fontSize="small" />,
    progress: 48,
  },
  {
    label: 'Upcoming events',
    value: 14,
    delta: 2,
    trend: 'up',
    helpText: 'next 30 days',
    icon: <EventAvailable fontSize="small" />,
    progress: 38,
  },
];

const formatValue = (val, prefix, suffix) => {
  const number = typeof val === 'number' ? val : 0;
  const formatted = Math.abs(number) >= 1000
    ? `${(number / 1000).toFixed(1)}k`
    : number;
  return `${prefix || ''}${formatted}${suffix || ''}`;
};

const mapApiStats = (data) => {
  if (!data) return [];
  const revenueGoal = 100000; // simple target for progress bar scaling
  return [
    {
      label: 'Registrations',
      value: data.registrations ?? 0,
      delta: undefined,
      trend: 'up',
      helpText: 'Total tickets sold',
      icon: <PeopleAlt fontSize="small" />,
      progress: data.totals?.capacity
        ? Math.min(100, (data.registrations || 0) / data.totals.capacity * 100)
        : 0,
    },
    {
      label: 'Revenue',
      value: data.revenue ?? 0,
      prefix: '$',
      delta: undefined,
      trend: 'up',
      helpText: 'Gross ticket revenue',
      icon: <MonetizationOn fontSize="small" />,
      progress: Math.min(100, ((data.revenue || 0) / revenueGoal) * 100),
    },
    {
      label: 'Conversion',
      value: data.conversion ?? 0,
      suffix: '%',
      delta: undefined,
      trend: (data.conversion ?? 0) >= 50 ? 'up' : 'down',
      helpText: 'Capacity fill rate',
      icon: <TrendingUp fontSize="small" />,
      progress: Math.min(100, data.conversion || 0),
    },
    {
      label: 'Upcoming events',
      value: data.upcomingEvents ?? 0,
      delta: undefined,
      trend: 'up',
      helpText: 'Next 30 days',
      icon: <EventAvailable fontSize="small" />,
      progress: data.totals?.events
        ? Math.min(100, ((data.upcomingEvents || 0) / data.totals.events) * 100)
        : 0,
    },
  ];
};

const TrendChip = ({ trend, delta }) => {
  if (delta === undefined || delta === null) return null;
  const isUp = trend !== 'down';
  const color = isUp ? 'success' : 'error';
  const Icon = isUp ? ArrowUpward : ArrowDownward;

  return (
    <Chip
      size="small"
      color={color}
      variant="outlined"
      icon={<Icon fontSize="small" />}
      label={`${Math.abs(delta)}%`}
      sx={{
        fontWeight: 700,
        borderRadius: 999,
        px: 0.5,
      }}
    />
  );
};

const EventStatsWidget = ({ title = 'Event performance', subtitle = 'Live metrics for your events', stats }) => {
  const [remoteStats, setRemoteStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get('/events/stats/overview');
        if (isMounted && data?.data) {
          setRemoteStats(mapApiStats(data.data));
        }
      } catch (error) {
        // Silently fall back to defaults on failure
        console.warn('Failed to load event stats, using defaults', error?.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = useMemo(() => {
    if (stats && stats.length) return stats;
    if (remoteStats && remoteStats.length) return remoteStats;
    return defaultStats;
  }, [stats, remoteStats]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.12)',
            color: 'primary.main',
          }}
        >
          <Insights fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1 }}>
            {subtitle}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Box>
        {loading && (
          <LinearProgress
            sx={{ flex: 1, ml: 2, borderRadius: 99, height: 6, opacity: 0.9 }}
          />
        )}
      </Stack>

      <Grid container spacing={2}>
        {items.map(({ label, value, prefix, suffix, delta, trend, helpText, icon, progress }, idx) => (
          <Grid item xs={12} sm={6} md={3} key={`${label}-${idx}`}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                height: '100%',
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      background: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.08)',
                      color: 'primary.main',
                      flexShrink: 0,
                    }}
                  >
                    {icon || <TrendingUp fontSize="small" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {label}
                  </Typography>
                </Stack>
                <TrendChip trend={trend} delta={delta} />
              </Stack>

              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
                {formatValue(value, prefix, suffix)}
              </Typography>
              {helpText && (
                <Typography variant="caption" color="text.secondary">
                  {helpText}
                </Typography>
              )}

              {typeof progress === 'number' && (
                <Box sx={{ pt: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(0, Math.min(100, progress))}
                    sx={{
                      height: 6,
                      borderRadius: 99,
                      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 99,
                      },
                    }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default EventStatsWidget;
