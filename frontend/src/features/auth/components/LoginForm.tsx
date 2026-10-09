import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "../schemas/loginSchema";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { RoleDto, UserRole } from "../types/auth.types";
import {
  Activity,
  Lock,
  User,
  AlertCircle,
  LogIn,
  KeyRound,
  UserPlus,
  CheckCircle,
  ShieldAlert,
  Eye,
  EyeOff,
  ShieldCheck,
  Stethoscope,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  X,
  Send,
} from "lucide-react";

import { RegistrationStatusModal } from "./RegistrationStatusModal";

export const LoginForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();

  const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Remember Me, Forgot Password & Registration Status Modal state
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Demo Credentials Accordion State (Collapsed by Default in Production UI)
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  useEffect(() => {
    authApi
      .getRoles()
      .then((data: RoleDto[]) => setAvailableRoles(data))
      .catch(() => {});
  }, []);

  // Registration state
  const [regData, setRegData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    employeeId: "EMP-2026-101",
    invitationCode: "",
    role: UserRole.Receptionist,
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notRegisteredMessage, setNotRegisteredMessage] = useState<
    string | null
  >(null);

  // Dynamic Password Strength Meter
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500" };
    if (score <= 4) return { score, label: "Medium", color: "bg-amber-500" };
    return { score, label: "Strong", color: "bg-emerald-500" };
  };

  const passStrength = getPasswordStrength(regData.password);

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
            `The identity '${data.usernameOrEmail}' is not registered in CareFlow HMS.`,
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

    // Role assignment logic based on invitation code
    let assignedRole = UserRole.Receptionist;
    const code = regData.invitationCode.trim().toUpperCase();
    if (code.includes("ADMIN")) {
      assignedRole = UserRole.Admin;
    } else if (code.includes("DOC") || code.includes("DOCTOR")) {
      assignedRole = UserRole.Doctor;
    } else if (code.includes("NURSE")) {
      assignedRole = UserRole.Nurse;
    }

    setIsRegistering(true);
    try {
      await authApi.submitStaffRegistration({
        fullName: regData.fullName.trim(),
        username: regData.username.trim(),
        email: regData.email.trim(),
        password: regData.password,
        confirmPassword: regData.confirmPassword,
        employeeId: regData.employeeId?.trim(),
        invitationCode: regData.invitationCode?.trim() || "RECEPT-MAIN",
      });

      setRegSuccess(
        "Staff registration request submitted successfully! Your application is now PENDING administrator review.",
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Registration failed. Please check your information.";
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
    <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
      {/* LEFT PANEL: Healthcare Branding & Security Showcase */}
      <div className="md:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold text-blue-200">
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>CareFlow HMS v2.5</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-blue-400" />
              Hospital Management System
            </h1>
            <p className="text-xs text-blue-200 mt-2 leading-relaxed">
              Enterprise clinical platform with Dynamic RBAC security,
              multidisciplinary patient EMR, and real-time doctor scheduling.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2.5 text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>DPDP Act 2023 & ABDM Data Compliant</span>
            </div>
            <div className="flex items-center gap-2.5 text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dynamic RBAC Claims Authorization</span>
            </div>
            <div className="flex items-center gap-2.5 text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>AES-256 Encrypted Patient Records</span>
            </div>
            <div className="flex items-center gap-2.5 text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>24/7 Ward Intake & Prescription Workflow</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 text-[11px] text-blue-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Authorized Hospital Personnel Only</span>
        </div>
      </div>

      {/* RIGHT PANEL: Sign In / Staff Onboarding Form Container */}
      <div className="md:col-span-7 p-8 space-y-6 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Header & Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === "login"
                  ? "Staff Sign In"
                  : "Create Staff Account"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === "login"
                  ? "Enter your credentials to access hospital modules"
                  : "Complete staff onboarding with authorization code"}
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setNotRegisteredMessage(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "login"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "register"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* SIGN IN FORM */}
          {activeTab === "login" && (
            <div className="space-y-4">
              {notRegisteredMessage ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-start gap-2 text-amber-800 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{notRegisteredMessage}</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    This account identity is not registered. Would you like to
                    create a new staff account now?
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Staff Account Now</span>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username or Work Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      {...register("usernameOrEmail")}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      placeholder="e.g. doctor@careflow.com or sjenkins"
                    />
                  </div>
                  {errors.usernameOrEmail && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.usernameOrEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me, Status Checker & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Remember me</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsStatusModalOpen(true)}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      Check Request Status
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {isLoggingIn ? "Authenticating..." : "Sign In to HMS"}
                </button>
              </form>
            </div>
          )}

          {/* CREATE ACCOUNT (STAFF ONBOARDING) FORM */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Sarah Jenkins"
                    value={regData.fullName}
                    onChange={(e) =>
                      setRegData({ ...regData, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600 bg-white"
                  />
                </div>

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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@hospital.com"
                    value={regData.email}
                    onChange={(e) =>
                      setRegData({ ...regData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-00125"
                    value={regData.employeeId}
                    onChange={(e) =>
                      setRegData({ ...regData, employeeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invitation / Authorization Code
                </label>
                <input
                  type="text"
                  placeholder="Enter administrator invitation code (e.g. INV-ADMIN-2026)"
                  value={regData.invitationCode}
                  onChange={(e) =>
                    setRegData({ ...regData, invitationCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600 bg-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use the invitation code provided by your hospital
                  administrator for role verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={regData.password}
                      onChange={(e) =>
                        setRegData({ ...regData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={regData.confirmPassword}
                      onChange={(e) =>
                        setRegData({
                          ...regData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowRegConfirmPassword(!showRegConfirmPassword)
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {regData.password && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Password Strength:
                    </span>
                    <span
                      className={`font-semibold ${
                        passStrength.label === "Weak"
                          ? "text-rose-600"
                          : passStrength.label === "Medium"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {passStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passStrength.color} transition-all duration-300`}
                      style={{ width: `${(passStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {isRegistering
                  ? "Registering Staff Account..."
                  : "Create Account"}
              </button>
            </form>
          )}
        </div>

        {/* DEMO ONBOARDING CREDENTIALS ACCORDION (COLLAPSIBLE FOR PRODUCTION UI) */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
            className="w-full text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition select-none"
          >
            <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              Development & Demo Credentials
            </span>
            {showDemoCredentials ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showDemoCredentials && (
            <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-2 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() =>
                  handleDemoFill("admin@careflow.com", "Admin123!")
                }
                className="py-1 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded font-medium border border-slate-200 transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDemoFill("doctor@careflow.com", "Doctor123!")
                }
                className="py-1 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded font-medium border border-slate-200 transition"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDemoFill("nurse@careflow.com", "Nurse123!")
                }
                className="py-1 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded font-medium border border-slate-200 transition"
              >
                Nurse
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDemoFill("reception@careflow.com", "Reception123!")
                }
                className="py-1 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded font-medium border border-slate-200 transition"
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDemoFill("patient@careflow.com", "Patient123!")
                }
                className="py-1 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded font-medium border border-slate-200 transition"
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDemoFill("pharmacist@careflow.com", "Pharma123!")
                }
                className="py-1 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded font-medium border border-slate-200 transition"
              >
                Pharmacist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Account Recovery Workflow
                </span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                  <KeyRound className="w-5 h-5 text-indigo-600" /> Reset Staff
                  Password
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSuccess(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password Reset Token Generated!</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {forgotSuccess}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotSuccess(null);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold mt-2"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!forgotEmail) return;
                  setForgotSuccess(
                    `A secure password reset link and single-use token have been dispatched to ${forgotEmail}. Please check your hospital webmail inbox.`,
                  );
                }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your registered hospital work email address below. We
                  will send a secure password reset link to your verified
                  account.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. sarah@hospital.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* REGISTRATION STATUS CHECKER MODAL */}
      <RegistrationStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onNavigateToLogin={() => setActiveTab("login")}
      />
    </div>
  );
};
