import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '../schemas/loginSchema';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, AlertCircle, LogIn, KeyRound } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
      navigate('/patients');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleDemoFill = (username: string, pass: string) => {
    setValue('usernameOrEmail', username);
    setValue('password', pass);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CareFlow HMS</h1>
        <p className="text-sm text-slate-500">Sign in to access your hospital workspace</p>
      </div>

      {loginError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Invalid username/email or password. Please try again.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Username or Email
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              {...register('usernameOrEmail')}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. admin@careflow.com"
            />
          </div>
          {errors.usernameOrEmail && <p className="text-xs text-rose-500 mt-1">{errors.usernameOrEmail.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              {...register('password')}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoggingIn ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In to System</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Helper */}
      <div className="border-t border-slate-100 pt-4 text-center space-y-2">
        <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1">
          <KeyRound className="w-3 h-3" /> Quick Demo Credentials
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleDemoFill('admin@careflow.com', 'Admin123!')}
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Admin Account
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('reception@careflow.com', 'Reception123!')}
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Receptionist
          </button>
        </div>
      </div>
    </div>
  );
};
