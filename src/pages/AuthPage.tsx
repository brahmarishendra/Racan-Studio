import React, { useMemo, useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

interface AuthPageProps {
  onLogin: (email: string, password: string, remember?: boolean) => Promise<void>;
  onRegister: (name: string, email: string, password: string, avatarUrl?: string) => Promise<void>;
}

export default function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgUrl = useMemo(() => (
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2069&auto=format&fit=crop'
  ), []);

  const handleAvatarFile = async (file: File) => {
    const reader = new FileReader();
    const result = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    setAvatarUrl(result);
  };

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    try {
      setLoading(true);
      if (mode === 'login') {
        await onLogin(email.trim(), password, remember);
      } else {
        if (!name.trim()) {
          setError('Name is required');
          return;
        }
        await onRegister(name.trim(), email.trim(), password, avatarUrl || undefined);
      }
      window.location.href = '/';
    } catch (e: any) {
      setError(e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full">
      <img src={bgUrl} alt="background" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(12,18,42,0.45),rgba(8,12,28,0.85))]" />

      <div className="relative z-10 flex items-center justify-center h-full p-4">
        <div className="w-full max-w-[560px]">
          <div className="mx-auto overflow-hidden rounded-[32px] backdrop-blur-2xl border border-white/20 bg-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative">
            <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,white,transparent)]" aria-hidden="true" />
            <form onSubmit={(e)=>{e.preventDefault(); submit();}} className="p-8 md:p-12">
              <div className="flex justify-center mb-3">
                <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white">☼</div>
              </div>
              <h1 className="text-center text-5xl font-semibold text-white tracking-tight">{mode === 'login' ? 'Welcome back!' : 'Create your account'}</h1>
              <div className="mt-3 text-center text-white/75 text-base">{mode === 'login' ? 'Sign in to continue your design workflow' : 'Join to save templates and access them anywhere'}</div>

              {mode === 'register' && (
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-white/30 bg-white/10">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">No photo</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/80 text-xs mb-1">Profile photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e)=>{ const f=e.target.files?.[0]; if (f) handleAvatarFile(f); }}
                      className="block text-white/90 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-white/90 file:text-black hover:file:bg-white cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-[12px] text-white/80 mb-1.5">Name</label>
                    <Input name="name" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} className="h-12 rounded-2xl bg-white/10 placeholder-white/60 text-white border-white/25 ring-1 ring-white/10 focus-visible:ring-[3px] focus-visible:ring-white/30" />
                  </div>
                )}
                <div>
                  <label className="block text-[12px] text-white/80 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input name="email" autoFocus placeholder="Enter your email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-12 pl-11 rounded-2xl bg-white/10 placeholder-white/70 text-white border-white/25 ring-1 ring-white/10 focus-visible:ring-[3px] focus-visible:ring-indigo-300/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-white/80 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input name="password" placeholder="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} className="h-12 pl-11 pr-11 rounded-2xl bg-white/10 placeholder-white/70 text-white border-white/25 ring-1 ring-white/10 focus-visible:ring-[3px] focus-visible:ring-indigo-300/40" />
                    <button type="button" aria-label="Toggle password" onClick={()=>setShowPassword(p=>!p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/80 mt-1">
                  <label className="inline-flex items-center gap-2 select-none">
                    <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="accent-blue-500" />
                    Remember me
                  </label>
                  <button type="button" className="hover:underline opacity-70">Forgot password?</button>
                </div>

                {error && <div className="text-red-300 text-xs mt-1">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full mt-2 h-12 rounded-full bg-white text-black hover:bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  {mode === 'login' ? 'Log In' : 'Sign Up'}
                </Button>

                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1 bg-white/15" />
                  <span className="text-white/60 text-xs">Or</span>
                  <div className="h-px flex-1 bg-white/15" />
                </div>

                <button type="button" disabled className="w-full h-12 rounded-full border border-white/20 text-white/90 bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Sign in with Google
                </button>

                <div className="text-center text-sm text-white/70 mt-6">
                  {mode === 'login' ? (
                    <>Don’t have an account? <button type="button" className="underline" onClick={()=>setMode('register')}>Sign Up</button></>
                  ) : (
                    <>Already have an account? <button type="button" className="underline" onClick={()=>setMode('login')}>Log In</button></>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
