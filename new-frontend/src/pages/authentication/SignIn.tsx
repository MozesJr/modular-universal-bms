import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AxiosError } from 'axios';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import paths, { rootPaths } from 'routes/paths';
import { useAuth } from 'contexts/AuthContext';
import LogoHeader from 'layouts/main-layout/sidebar/LogoHeader';
import PasswordTextField from 'components/common/PasswordTextField';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [init, setInit] = useState(false);

  // Inisialisasi engine Particles.js
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate(rootPaths.root);
    } catch (err) {
      const message = (err as AxiosError<{ error?: string }>).response?.data?.error;
      setError(message ?? 'Gagal masuk. Periksa kembali username/email dan password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        // backgroundColor: '#0d1117', // Dark background
        backgroundColor: '#ffff', // Dark background
        overflow: 'hidden',
      }}
    >
      {/* Background Particles JS */}
      {init && (
        <Particles
          id="tsparticles"
          options={{
            background: {
              color: { value: 'transparent' },
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onHover: {
                  enable: true,
                  mode: 'grab', // Menghubungkan garis ke kursor mouse
                },
              },
              modes: {
                grab: {
                  distance: 180,
                  links: { opacity: 0.6 },
                },
              },
            },
            particles: {
              color: { value: '#6366f1' },
              links: {
                color: '#818cf8',
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
              },
              move: {
                enable: true,
                speed: 1.5,
                direction: 'none',
                random: false,
                straight: false,
                outModes: { default: 'bounce' },
              },
              number: {
                density: { enable: true },
                value: 80,
              },
              opacity: { value: 0.5 },
              shape: { type: 'circle' },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        />
      )}

      {/* Form Card Overlay */}
      <Container maxWidth="sm" sx={{ py: 10, position: 'relative', zIndex: 1 }}>
        <LogoHeader sx={{ justifyContent: 'center', mb: 5 }} />

        <Paper
          elevation={12}
          sx={{
            p: 5,
            borderRadius: 4,
            backdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography variant="h3">Sign in</Typography>
            <Typography variant="subtitle2" color="neutral.main">
              or{' '}
              <Link href={paths.signup} underline="hover">
                Create an account
              </Link>
            </Typography>
          </Stack>

          <Box component="form" sx={{ mt: 3 }} onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username or email"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                fullWidth
                required
              />

              <PasswordTextField
                id="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
                required
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end" mt={1}>
              <Typography variant="subtitle2" color="primary">
                <Link href="#!" underline="hover">
                  Forgot password?
                </Link>
              </Typography>
            </Stack>

            <Button
              type="submit"
              size="large"
              variant="contained"
              sx={{ mt: 2 }}
              fullWidth
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              Sign in
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignIn;
