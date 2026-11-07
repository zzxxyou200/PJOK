import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Backdrop, Box, TextField, Button, Typography, Alert, Paper, Stack, CircularProgress,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const text = await response.text();
        setError(text || 'Login failed');
        return;
      }

      const data = await response.json();
      login(data.accessToken, data.refreshToken);
      navigate('/home');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <Stack component="form" onSubmit={handleSubmit} spacing={2}>
            <Typography variant="h5" align="center">Login</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              disabled={loading}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Typography variant="body2" align="center">
              Don't have an account?{' '}
              <Link to="/register">Register</Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
      <Backdrop
        open={loading}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fff' }}
      >
        <Stack alignItems="center" spacing={2} role="status" aria-live="polite">
          <CircularProgress color="inherit" />
          <Typography>Logging in...</Typography>
        </Stack>
      </Backdrop>
    </>
  );
}

export default Login;