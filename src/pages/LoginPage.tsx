import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface LoginPageProps {
  onLogin: () => void;
}

type Step = 'email' | 'code';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/admin/send-verification-code`, { email });
      setInfo('A verification code has been sent to your email. It expires in 10 minutes.');
      setStep('code');
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/admin/verify-code`, {
        email,
        code,
      });

      const { access_token } = response.data;
      localStorage.setItem('admin_access_token', access_token);
      onLogin();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid or expired code. Please try again or request a new code.');
      } else if (err.response?.status === 403) {
        setError('Access denied. This account does not have admin privileges.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setCode('');
    setError('');
    setInfo('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Admin Login
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            The Stitch Tracker
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {info && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {info}
            </Alert>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendCode}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                sx={{ mb: 3 }}
                autoComplete="email"
                autoFocus
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send verification code'}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </Typography>
              <TextField
                label="Verification code"
                type="text"
                inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                fullWidth
                required
                sx={{ mb: 3 }}
                autoFocus
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || code.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                variant="text"
                fullWidth
                size="small"
                onClick={handleBack}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                Use a different email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
