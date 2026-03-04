import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginThunk, googleLoginThunk, verifyEmailOtpThunk, setOtpStep } from './authSlice';
import { authApi } from '../../api/services';
import toast from 'react-hot-toast';

type View = 'login' | 'register' | 'otp';

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

  const handleGoogleLogin = async () => {
    const result = await dispatch(googleLoginThunk());
    if (googleLoginThunk.fulfilled.match(result)) {
      toast.success('Logged in with Google!');
      navigate('/dashboard');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    try {
      await authApi.register({ name, email, phone, password });
      await authApi.sendEmailOtp(email);
      setPendingEmail(email);
      setView('otp');
      dispatch(setOtpStep('email_sent'));
      toast.success('OTP sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
              </svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>or</span></div>
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
