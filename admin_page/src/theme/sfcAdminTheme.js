import { createTheme } from '@mui/material/styles';

/**
 * Mirrors user_page design tokens (App.css) for a consistent SFC admin experience.
 */
export const sfcAdminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#874500',
      dark: '#3a2a16',
      light: '#ffb334',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6bdc45',
      dark: '#2f6b26',
      light: '#b8f22f',
      contrastText: '#1a2610',
    },
    info: {
      main: '#ff7a1a',
    },
    warning: {
      main: '#ffd23f',
    },
    error: {
      main: '#c74f3f',
    },
    success: {
      main: '#2f6f26',
    },
    background: {
      default: '#f4f8ee',
      paper: 'rgba(255, 253, 244, 0.96)',
    },
    text: {
      primary: '#28251d',
      secondary: '#617064',
    },
    divider: '#dfe8d6',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#c8d8c4 transparent',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #874500 0%, #ff7a1a 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #603100 0%, #e06510 100%)',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: 'rgba(223, 232, 214, 0.95)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(223, 232, 214, 0.85)',
          boxShadow: '0 14px 34px rgba(135, 69, 0, 0.07)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: '#dfe8d6',
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(223, 232, 214, 0.95)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
        },
      },
    },
  },
});
