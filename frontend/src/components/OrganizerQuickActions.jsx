import React from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, Box, Grid, Paper, Stack, Typography, ButtonBase, Chip } from '@mui/material';
import { AddCircle, Group, Insights, LocalOffer, Settings, Timeline } from '@mui/icons-material';

const defaultActions = [
  {
    label: 'Create event',
    description: 'Set the basics, pricing, and tickets',
    icon: <AddCircle fontSize="small" />,
    accent: 'primary',
    id: 'create',
    path: '/create-event',
  },
  {
    label: 'Manage tickets',
    description: 'Inventory, holds, and promo codes',
    icon: <LocalOffer fontSize="small" />,
    accent: 'secondary',
    id: 'tickets',
    path: '/my-tickets',
  },
  {
    label: 'Attendees',
    description: 'Guests, refunds, transfers',
    icon: <Group fontSize="small" />,
    accent: 'info',
    id: 'attendees',
    path: '/organizer',
  },
  {
    label: 'Analytics',
    description: 'Sales, traffic, conversions',
    icon: <Insights fontSize="small" />,
    accent: 'warning',
    id: 'analytics',
    path: '/dashboard',
  },
  {
    label: 'Payouts & settings',
    description: 'Banking, taxes, team roles',
    icon: <Settings fontSize="small" />,
    accent: 'default',
    id: 'settings',
    path: '/profile',
  },
];

const OrganizerQuickActions = ({
  title = 'Organizer quick actions',
  subtitle = 'Jump to the tasks you do most',
  actions = defaultActions,
  onAction,
}) => {
  const navigate = useNavigate();
  const items = actions && actions.length ? actions : defaultActions;

  const handleClick = (action) => {
    if (onAction) {
      onAction(action);
      return;
    }

    if (action?.path) {
      navigate(action.path);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.95)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Chip label="Organizer" color="primary" size="small" variant="outlined" icon={<Timeline fontSize="small" />} />
      </Stack>

      <Grid container spacing={1.5}>
        {items.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.id || action.label}>
            <ButtonBase
              onClick={() => handleClick(action)}
              sx={{
                width: '100%',
                textAlign: 'left',
                borderRadius: 2.5,
                overflow: 'hidden',
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  width: '100%',
                  height: '100%',
                  borderRadius: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  alignItems: 'flex-start',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'background.paper',
                  transition: 'all 150ms ease',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: (theme) => theme.shadows[3],
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={(theme) => {
                      const accentKey = action.accent || 'primary';
                      const accentColor = theme.palette[accentKey]?.main || theme.palette.primary.main;
                      return {
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        color: accentColor,
                        background: alpha(accentColor, theme.palette.mode === 'dark' ? 0.14 : 0.12),
                      };
                    }}
                  >
                    {action.icon || <AddCircle fontSize="small" />}
                  </Box>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {action.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </ButtonBase>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default OrganizerQuickActions;
