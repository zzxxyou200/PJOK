import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Stack, CircularProgress, Alert,
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
          }
          setError('Failed to load profile');
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
    };

    fetchProfile();
  }, [navigate]);

  const role = user?.authorities?.map((a) => a.authority).join(', ') || '';

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!user && !error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3, maxWidth: 400 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.username}</Typography>
              <Typography variant="body2" color="text.secondary">
                {role}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

export default Profile;