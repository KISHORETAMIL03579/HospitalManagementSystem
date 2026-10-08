import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "../schemas/loginSchema";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { UserRole } from "../types/auth.types";
import {
  Activity,
  Lock,
  User,
  AlertCircle,
  LogIn,
  KeyRound,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
} from "lucide-react";

export const LoginForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();

  // Registration state
  const [regData, setRegData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: UserRole.Receptionist,
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notRegisteredMessage, setNotRegisteredMessage] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setNotRegisteredMessage(null);
    try {
      await login(data);
      navigate("/");
    } catch (err: any) {
      const responseData = err?.response?.data;
      if (responseData?.isNotRegistered || err?.response?.status === 404) {
        setNotRegisteredMessage(
          responseData?.message ||
            `The email/username '${data.usernameOrEmail}' is not registered in CareFlow HMS.`,
        );
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (regData.password !== regData.confirmPassword) {
      setRegError("Passwords do not match. Please re-enter.");
      return;
    }

    if (regData.password.length < 6) {
      setRegError("Password must be at least 6 characters long.");
      return;
    }

    setIsRegistering(true);
    try {
      await authApi.register({
        username: regData.username.trim(),
        email: regData.email.trim(),
        password: regData.password,
        fullName: regData.fullName.trim(),
        role: regData.role,
      });

      setRegSuccess("Account registered successfully! Logging you in...");
      // Auto login after registration
      setTimeout(async () => {
        await login({
          usernameOrEmail: regData.email,
          password: regData.password,
        });
        navigate("/");
      }, 1000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Registration failed. Please check details.";
      setRegError(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDemoFill = (username: string, pass: string) => {
    setActiveTab("login");
    setValue("usernameOrEmail", username);
    setValue("password", pass);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
      {/* Header Logo */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          CareFlow HMS
        </h1>
        <p className="text-sm text-slate-500">
          Hospital Operating & Management System
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab("login");
            setNotRegisteredMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "login"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "register"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Register Account
        </button>
      </div>

      {/* Sign In Form */}
      {activeTab === "login" && (
        <div className="space-y-4">
          {notRegisteredMessage ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-start gap-2 text-amber-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{notRegisteredMessage}</span>
              </div>
              <p className="text-[11px] text-amber-700">
                This account is not registered. Would you like to create a new
                account now?
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegData((prev) => ({
                    ...prev,
                    email: errors.usernameOrEmail
                      ? ""
                      : (
                          document.querySelector(
                            'input[name="usernameOrEmail"]',
                          ) as HTMLInputElement
                        )?.value || "",
                  }));
                  setActiveTab("register");
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Account Now</span>
              </button>
            </div>
          ) : loginError ? (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Invalid password or username. Please check your credentials.
              </span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register("usernameOrEmail")}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. admin@careflow.com"
                />
              </div>
              {errors.usernameOrEmail && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.usernameOrEmail.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register("password")}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.password.message}
                </p>
              )}
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
        </div>
      )}

      {/* Register Form */}
      {activeTab === "register" && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
          {regError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          {regSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Sarah Jenkins"
              value={regData.fullName}
              onChange={(e) =>
                setRegData({ ...regData, fullName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                placeholder="sjenkins"
                value={regData.username}
                onChange={(e) =>
                  setRegData({ ...regData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role *
              </label>
              <select
                value={regData.role}
                onChange={(e) =>
                  setRegData({
                    ...regData,
                    role: Number(e.target.value) as UserRole,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-600 bg-white"
              >
                <option value={UserRole.Receptionist}>Receptionist</option>
                <option value={UserRole.Admin}>Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="sarah@careflow.com"
              value={regData.email}
              onChange={(e) =>
                setRegData({ ...regData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regData.password}
                onChange={(e) =>
                  setRegData({ ...regData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regData.confirmPassword}
                onChange={(e) =>
                  setRegData({ ...regData, confirmPassword: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isRegistering ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>
      )}

      {/* Demo Credentials Helper */}
      <div className="border-t border-slate-100 pt-4 text-center space-y-2">
        <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1">
          <KeyRound className="w-3 h-3" /> Quick Demo Credentials
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleDemoFill("admin@careflow.com", "Admin123!")}
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Admin Account
          </button>
          <button
            type="button"
            onClick={() =>
              handleDemoFill("reception@careflow.com", "Reception123!")
            }
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Receptionist
          </button>
        </div>
      </div>
    </div>
  );
};
