import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginThunk, verifyEmailOtpThunk, setOtpStep } from './authSlice';
import { authApi } from '../../api/services';
import toast from 'react-hot-toast';

type View = 'login' | 'register' | 'otp';

const formatApiMessage = (value: any, fallback: string): string => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const messages = value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
          return field ? `${field}: ${item.msg}` : item.msg;
        }
        return null;
      })
      .filter(Boolean);
    return messages.length ? messages.join(', ') : fallback;
  }
  if (typeof value === 'object' && typeof value.msg === 'string') {
    return value.msg;
  }
  return fallback;
};

const getApiErrorMessage = (err: any, fallback: string) =>
  formatApiMessage(err?.response?.data?.detail, formatApiMessage(err?.response?.data?.message, fallback));

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, otpStep } = useAppSelector((s) => s.auth);

  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    try {
      const { data } = await authApi.register({ name, email, phone, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter full 6-digit OTP'); return; }
    const result = await dispatch(verifyEmailOtpThunk({ email: pendingEmail, otp: code }));
    if (verifyEmailOtpThunk.fulfilled.match(result)) {
      toast.success('Email verified! Welcome!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">L</div>
          <div className="auth-title">
            {view === 'login' ? 'Welcome back' : view === 'register' ? 'Create account' : 'Verify email'}
          </div>
          <div className="auth-sub">
            {view === 'login' ? 'Sign in to your vendor dashboard' :
             view === 'register' ? 'Start selling on LocalShop' :
             `Enter the 6-digit OTP sent to ${pendingEmail}`}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* ── Login ── */}
        {view === 'login' && (
          <>
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Email address</label>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Sign In'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              New vendor? <span className="auth-link" onClick={() => setView('register')}>Create account</span>
            </p>
          </>
        )}

        {/* ── Register ── */}
        {view === 'register' && (
          <>
            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Phone</label>
                <input className="form-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" required />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
              </div>
              <button className="auth-submit" type="submit" disabled={loading || localLoading}>
                {loading || localLoading ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Create Account'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              Already have account? <span className="auth-link" onClick={() => setView('login')}>Sign in</span>
            </p>
          </>
        )}

        {/* ── OTP ── */}
        {view === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-inputs">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Verify OTP'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5, color: 'var(--text-muted)' }}>
              Didn't receive?{' '}
              <span className="auth-link" onClick={() => authApi.sendEmailOtp(pendingEmail).then(() => toast.success('OTP resent'))}>
                Resend OTP
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
