import React, { useState } from "react";
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  User,
  AlertTriangle,
  RefreshCw,
  Mail,
  ArrowRight,
} from "lucide-react";
import { authApi, StaffRegistrationRequest } from "../api/authApi";
import { formatDateByPattern } from "../../../utils/dateUtils";

interface RegistrationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLogin?: () => void;
}

export const RegistrationStatusModal: React.FC<
  RegistrationStatusModalProps
> = ({ isOpen, onClose, onNavigateToLogin }) => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [statusRecord, setStatusRecord] =
    useState<StaffRegistrationRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setStatusRecord(null);

    try {
      const data = await authApi.getRegistrationStatus(email.trim());
      setStatusRecord(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `No registration application found matching email '${email}'. Please verify your email or submit a new staff registration request.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Check Onboarding Status
              </h3>
              <p className="text-xs text-slate-500">
                Track your staff registration approval status in CareFlow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 font-bold text-sm flex items-center justify-center transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleCheckStatus} className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">
            Registered Work Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sarah@example.com"
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Check Status
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Result Display */}
        {statusRecord && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            {/* Applicant Summary Header */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  {statusRecord.fullName}
                </span>
                {statusRecord.status === 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    PENDING REVIEW
                  </span>
                )}
                {statusRecord.status === 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    APPROVED & ACTIVATED
                  </span>
                )}
                {statusRecord.status === 2 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    REJECTED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Requested Role
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-blue-500" />
                    {statusRecord.requestedRoleName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Employee ID
                  </span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {statusRecord.employeeId || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Onboarding Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Application Workflow Timeline
              </h4>

              <div className="space-y-2 text-xs">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      Registration Submitted
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Submitted on{" "}
                      {formatDateByPattern(
                        statusRecord.submittedAt,
                        "MMM dd, yyyy - hh:mm a",
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      statusRecord.status === 1
                        ? "bg-emerald-500 text-white"
                        : statusRecord.status === 2
                          ? "bg-rose-500 text-white"
                          : "bg-amber-500 text-white animate-pulse"
                    }`}
                  >
                    {statusRecord.status === 1
                      ? "✓"
                      : statusRecord.status === 2
                        ? "✕"
                        : "2"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      {statusRecord.status === 1
                        ? "Administrator Approval Completed"
                        : statusRecord.status === 2
                          ? "Administrator Review (Rejected)"
                          : "Awaiting Administrator Review"}
                    </div>
                    {statusRecord.reviewedAt && (
                      <div className="text-[10px] text-slate-400">
                        Reviewed on{" "}
                        {formatDateByPattern(
                          statusRecord.reviewedAt,
                          "MMM dd, yyyy - hh:mm a",
                        )}
                        {statusRecord.reviewedByName &&
                          ` by ${statusRecord.reviewedByName}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Specific Warning & Prompt */}
            {statusRecord.status === 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Account Access Disabled During Review
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  In compliance with hospital dynamic RBAC compliance, staff
                  accounts pending review have zero access to patient records,
                  clinical notes, billing, or pharmacy modules.
                </p>
              </div>
            )}

            {statusRecord.status === 1 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-900">
                    Your account is ready for sign in!
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Authorized Role: {statusRecord.requestedRoleName}
                  </div>
                </div>
                {onNavigateToLogin && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToLogin();
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 transition-colors"
                  >
                    Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {statusRecord.status === 2 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Registration Request Rejected
                </div>
                <p className="text-[11px] text-rose-700">
                  Reason provided:{" "}
                  <em>
                    "
                    {statusRecord.rejectionReason ||
                      "HR credentials verification failed."}
                    "
                  </em>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
