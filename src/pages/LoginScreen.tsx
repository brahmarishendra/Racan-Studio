import React, { useMemo, useState } from 'react';
import { api } from '../lib/api';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bgGrad = useMemo(() => ({
    backgroundImage: 'url(https://i.pinimg.com/736x/38/e0/6d/38e06de0aedc6e7f159762546a2aebe2.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        setSuccess(`Welcome ${res.user.name}`);
        // redirect back to editor
        window.location.href = '/';
      } else {
        const res = await api.auth.register({ name: name || email.split('@')[0], email, password });
        setSuccess(`Welcome ${res.user.name}`);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container as React.CSSProperties}>
      <div style={{...styles.background, ...bgGrad} as React.CSSProperties}>
        <div style={styles.stars as React.CSSProperties}></div>
        <div style={styles.lavenderFields as React.CSSProperties}></div>
      </div>
      <div style={styles.formCard as React.CSSProperties} className="formCard">
        <div style={styles.logo as React.CSSProperties}>
          <div style={styles.logoCenter as React.CSSProperties}></div>
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(0deg) translateX(26px)'} as React.CSSProperties} />
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(45deg) translateX(26px)'} as React.CSSProperties} />
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(90deg) translateX(26px)'} as React.CSSProperties} />
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(135deg) translateX(26px)'} as React.CSSProperties} />
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(180deg) translateX(26px)'} as React.CSSProperties} />
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(225deg) translateX(26px)'} as React.CSSProperties} />
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(270deg) translateX(26px)'} as React.CSSProperties} />
          <div style={{...styles.logoDot, transform:'translate(-50%, -50%) rotate(315deg) translateX(26px)'} as React.CSSProperties} />
        </div>
        <h1 style={styles.title as React.CSSProperties}>{isLogin ? 'Welcome back!' : 'Create Account'}</h1>
        <p style={styles.subtitle as React.CSSProperties}>
          {isLogin
            ? 'Sign in to continue your design workflow'
            : 'Join to save templates and access them anywhere'}
        </p>
        <form onSubmit={handleSubmit} style={styles.form as React.CSSProperties}>
          {!isLogin && (
            <input
              type="text"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              placeholder="Your name"
              required
              style={styles.input as React.CSSProperties}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={styles.input as React.CSSProperties}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={styles.input as React.CSSProperties}
          />
          <div style={styles.checkboxContainer as React.CSSProperties}>
            <label style={styles.checkboxLabel as React.CSSProperties}>
              <input type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} style={styles.checkbox as React.CSSProperties} />
              <span style={styles.checkboxText as React.CSSProperties}>Remember me</span>
            </label>
            <button type="button" style={styles.forgotLink as React.CSSProperties}>Forgot password?</button>
          </div>
          {error && (
            <div style={{...styles.message, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', color:'#fecaca'} as React.CSSProperties}>{error}</div>
          )}
          {success && (
            <div style={{...styles.message, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.35)', color:'#bbf7d0'} as React.CSSProperties}>{success}</div>
          )}
          <button type="submit" disabled={loading} style={styles.loginButton as React.CSSProperties}>
            {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
          </button>
        </form>
        <div style={styles.orDivider as React.CSSProperties}>Or</div>
        <button type="button" style={styles.googleButton as React.CSSProperties} aria-label="Sign in with Google">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.137 0 9.841-1.957 13.409-5.148l-6.197-5.238C29.155 35.091 26.708 36 24 36c-5.204 0-9.62-3.322-11.277-7.952l-6.54 5.038C9.5 39.577 16.208 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.79 2.232-2.262 4.166-4.091 5.614l.003-.003 6.197 5.238C39.053 35.97 44 30.5 44 24c0-1.341-.138-2.651-.389-3.917z"/>
          </svg>
          Sign in with Google
        </button>
        <p style={styles.signupText as React.CSSProperties}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={()=>{ setIsLogin(!isLogin); setError(''); setSuccess(''); }} style={styles.signupLink as React.CSSProperties}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
      <style>{globalStyles}</style>
    </div>
  );
}

const styles: Record<string, any> = {
  container: {
    height: '100vh',
    width: '100vw',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff'
  },
  background: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1,
  },
  stars: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundImage: `
      radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
      radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), rgba(0,0,0,0)),
      radial-gradient(2px 2px at 160px 30px, #eee, rgba(0,0,0,0))
    `,
    backgroundRepeat: 'repeat',
    backgroundSize: '200px 100px',
    animation: 'twinkle 3s linear infinite',
  },
  lavenderFields: {
    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%',
    background: 'linear-gradient(to top, #6a1b9a 0%, rgba(106,27,154,0.3) 100%)',
    backgroundImage: `
      radial-gradient(ellipse at 20% 100%, #b39ddb 0%, transparent 50%),
      radial-gradient(ellipse at 60% 100%, #9575cd 0%, transparent 50%),
      radial-gradient(ellipse at 90% 100%, #7e57c2 0%, transparent 50%)
    `,
  },
  formCard: {
    position: 'relative', zIndex: 2, maxWidth: 480, margin: '0 auto', padding: '36px 28px',
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(18px)',
    borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.45)', top: '50%', transform: 'translateY(-50%)',
    border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center'
  },
  logo: { position: 'relative', width: 72, height: 72, margin: '0 auto 16px' },
  logoCenter: { position: 'absolute', top: '50%', left: '50%', width: 22, height: 22, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', transform: 'translate(-50%, -50%)' },
  logoDot: { position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, background: 'rgba(255,255,255,0.7)', borderRadius: '50%' },
  title: { fontSize: 40, fontWeight: 600, color: '#fff', margin: '4px 0 4px', lineHeight: 1.1 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.78)', margin: '0 0 22px', lineHeight: 1.4 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { padding: '12px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 15, background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none' },
  checkboxContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  checkboxLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  checkbox: { width: 16, height: 16, marginRight: 8, accentColor: '#8ab4ff' },
  checkboxText: { margin: 0 },
  forgotLink: { fontSize: 13, color: 'rgba(255,255,255,0.85)', background:'none', border:'none', cursor:'pointer' },
  message: { padding: '10px 12px', borderRadius: 10, fontSize: 13 },
  loginButton: { padding: 12, background: '#fff', color: '#000', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  orDivider: { margin: '18px 0', fontSize: 13, color: 'rgba(255,255,255,0.75)', position: 'relative' },
  googleButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, fontSize: 15, color: '#fff', cursor: 'pointer', width: '100%' },
  signupText: { marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  signupLink: { color: '#fff', background:'none', border:'none', cursor:'pointer', textDecoration: 'underline', fontWeight: 500 },
};

const globalStyles = `
  @keyframes twinkle { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
`;
