import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Compass, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Anchor, Database } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username / Email dan Password tidak boleh kosong!');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      // Handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'operator') => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('Admin123!Portiva');
    } else {
      setUsername('operator');
      setPassword('Admin123!Portiva');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Maritime Waves & Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl opacity-5 [background-image:radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Brand Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 text-white shadow-xl shadow-sky-600/30 mb-4 border border-sky-400/30">
            <Compass className="w-9 h-9 animate-[spin_20s_linear_infinite]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider flex items-center justify-center gap-2">
            PORTIVA
            <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase tracking-widest">
              PORT-OPS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Aplikasi Manajemen Muatan Kapal, Data Penumpang & Operasional Pelayaran
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/60">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Login Admin & Petugas</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan masukkan kredensial resmi otoritas pelabuhan
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau admin@portiva.co.id"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kata Sandi (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 hover:from-blue-600 hover:to-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard PORTIVA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Akses Cepat Pengujian (Demo):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-colors text-left"
              >
                <span className="font-bold text-sky-400 block">Super Admin</span>
                <span className="text-[10px] text-slate-400">Capt. Hendra W.</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('operator')}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-colors text-left"
              >
                <span className="font-bold text-cyan-400 block">Operator Pelabuhan</span>
                <span className="text-[10px] text-slate-400">Dewi Anggraini</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real Database Badge */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span>Terhubung ke Real Database Relasional Permanen (Atomic Server Store)</span>
        </div>
      </div>
    </div>
  );
};
