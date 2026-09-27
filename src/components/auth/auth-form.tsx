'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export function AuthForm({ mode, nextPath }: { mode: 'login' | 'register'; nextPath?: string }) {
  const router = useRouter();
  const { user, initialized, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const destination = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';

  useEffect(() => {
    if (initialized && user) router.replace(destination);
  }, [initialized, user, destination, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (mode === 'register' && !name.trim()) return setError('Masukkan nama Anda.');
    if (password.length < 6) return setError('Kata sandi minimal 6 karakter.');
    setBusy(true);
    try {
      if (mode === 'login') await signInWithEmail(email.trim(), password);
      else await signUpWithEmail(email.trim(), password, name.trim());
      router.replace(destination);
    } catch {
      setError(useAuthStore.getState().error || 'Tidak dapat masuk. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  async function loginWithGoogle() {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
      router.replace(destination);
    } catch {
      setError(useAuthStore.getState().error || 'Masuk dengan Google gagal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page container">
      <div className="auth-intro">
        <Link href="/" className="text-link"><ArrowLeft size={17} /> Kembali ke katalog</Link>
        <p className="auth-mark">CHANFLIX</p>
        <h1>{mode === 'login' ? 'Lanjutkan ceritanya.' : 'Mulai dari sini.'}</h1>
        <p>Simpan film yang ingin Anda tonton dan bagikan ruang nonton dengan teman.</p>
      </div>
      <div className="auth-panel">
        <h2>{mode === 'login' ? 'Masuk' : 'Buat akun'}</h2>
        <p className="muted">{mode === 'login' ? 'Masukkan akun Anda untuk melanjutkan.' : 'Satu akun untuk wishlist dan nonton bareng.'}</p>
        {error && <p role="alert" className="form-error">{error}</p>}
        <form onSubmit={submit} className="form-stack">
          {mode === 'register' && <label>Nama lengkap<Input autoComplete="name" value={name} onChange={e => setName(e.target.value)} required /></label>}
          <label>Email<Input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Kata sandi<div className="password-field"><Input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /><button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          <Button type="submit" disabled={busy || !initialized} size="lg">{busy ? <LoaderCircle className="animate-spin" size={18} /> : mode === 'login' ? 'Masuk' : 'Buat akun'}</Button>
        </form>
        <div className="auth-divider"><span>atau</span></div>
        <Button type="button" variant="outline" size="lg" onClick={loginWithGoogle} disabled={busy || !initialized} className="w-full">Lanjutkan dengan Google</Button>
        <p className="auth-switch">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <Link href={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Daftar' : 'Masuk'}</Link></p>
      </div>
    </div>
  );
}
