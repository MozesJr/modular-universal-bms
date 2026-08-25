import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from 'contexts/AuthContext';
import BreakpointsProvider from 'providers/BreakpointsProvider';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from 'routes/router';

import { theme } from 'theme/theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BreakpointsProvider>
          <CssBaseline />
          <RouterProvider router={router} />
        </BreakpointsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
