import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useState } from 'react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, avatarUrl?: string) => Promise<void>;
}

export function AuthDialog({ open, onOpenChange, onLogin, onRegister }: AuthDialogProps) {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      if (mode === 'register' && !name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(name.trim(), email.trim(), password, avatarUrl || undefined);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border border-gray-200 bg-white">
        <form onSubmit={(e)=>{ e.preventDefault(); submit(); }} className="p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-semibold text-gray-900">{mode === 'login' ? 'Welcome back!' : 'Create your account'}</DialogTitle>
            <div className="mt-1 text-center text-gray-500 text-sm">{mode === 'login' ? 'Sign in to continue your design workflow' : 'Join to save templates and access them anywhere'}</div>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            {mode === 'register' && (
              <Input name="name" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
            )}
            <Input name="email" autoFocus placeholder="Enter your email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <Input name="password" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            {mode === 'register' && (
              <Input name="avatarUrl" placeholder="Avatar URL (optional)" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} />
            )}

            <div className="flex items-center justify-between text-xs text-gray-700 mt-1">
              <label className="inline-flex items-center gap-2 select-none">
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="accent-blue-600" />
                Remember me
              </label>
              <button type="button" className="hover:underline text-gray-500">Forgot password?</button>
            </div>

            {error && <div className="text-red-600 text-xs mt-1">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full mt-2 h-10 rounded-md bg-blue-600 text-white hover:bg-blue-500">
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </Button>

            <div className="flex items-center gap-3 my-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-gray-400 text-xs">Or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button type="button" disabled className="w-full h-10 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition">Sign in with Google</button>

            <div className="text-center text-sm text-gray-700 mt-4">
              {mode === 'login' ? (
                <>Don’t have an account? <button type="button" className="underline" onClick={()=>setMode('register')}>Sign Up</button></>
              ) : (
                <>Already have an account? <button type="button" className="underline" onClick={()=>setMode('login')}>Log In</button></>
              )}
            </div>
          </div>
        </form>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
