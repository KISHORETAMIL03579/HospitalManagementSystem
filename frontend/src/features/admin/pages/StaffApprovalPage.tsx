import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  RefreshCw,
  Search,
  Building2,
  User,
  AlertCircle,
  AlertTriangle,
  MailCheck,
  Send,
  Edit,
} from "lucide-react";
import {
  authApi,
  StaffRegistrationRequest,
  isPendingStatus,
  isApprovedStatus,
  isRejectedStatus,
} from "../../auth/api/authApi";
import { doctorApi } from "../../doctors/api/doctorApi";
import { DepartmentDto } from "../../doctors/types/doctor.types";
import { formatDateByPattern } from "../../../utils/dateUtils";

export const StaffApprovalPage: React.FC = () => {
  const [requests, setRequests] = useState<StaffRegistrationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Approval Modal State
  const [selectedRequestForApprove, setSelectedRequestForApprove] =
    useState<StaffRegistrationRequest | null>(null);
  const [roles, setRoles] = useState<{ roleId: number; name: string }[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(
    undefined,
  );

  // Rejection Modal State
  const [selectedRequestForReject, setSelectedRequestForReject] =
    useState<StaffRegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [rejectError, setRejectError] = useState<string>("");

  // Edit Request Modal State
  const [selectedRequestForEdit, setSelectedRequestForEdit] =
    useState<StaffRegistrationRequest | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    requestedRoleId: 0,
    departmentId: 0,
    status: 0,
    rejectionReason: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Feedback Notification
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchRequests = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await authApi.getStaffRequests();
      setRequests(data);
    } catch (err: any) {
      console.error("Failed to load staff registration requests:", err);
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Failed to load staff requests from server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await authApi.getRoles();
      setRoles(data);
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await doctorApi.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchRoles();
    fetchDepartments();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const pending = requests.filter((r) => isPendingStatus(r.status)).length;
    const approved = requests.filter((r) => isApprovedStatus(r.status)).length;
    const rejected = requests.filter((r) => isRejectedStatus(r.status)).length;
    const failedEmails = requests.filter(
      (r) =>
        r.emailStatus === 3 || String(r.emailStatus).toLowerCase() === "failed",
    ).length;
    return {
      pending,
      approved,
      rejected,
      failedEmails,
      total: requests.length,
    };
  }, [requests]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Tab filter
      if (activeTab === "pending" && !isPendingStatus(r.status)) return false;
      if (activeTab === "approved" && !isApprovedStatus(r.status)) return false;
      if (activeTab === "rejected" && !isRejectedStatus(r.status)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = r.fullName.toLowerCase().includes(query);
        const emailMatch = r.email.toLowerCase().includes(query);
        const empMatch = r.employeeId?.toLowerCase().includes(query) ?? false;
        const roleMatch = r.requestedRoleName.toLowerCase().includes(query);
        const codeMatch = r.invitationCode.toLowerCase().includes(query);
        return nameMatch || emailMatch || empMatch || roleMatch || codeMatch;
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!selectedRequestForApprove) return;
    setActionLoadingId(selectedRequestForApprove.id);
    try {
      await authApi.approveStaffRequest(selectedRequestForApprove.id, {
        authorizedRoleId:
          selectedRoleId || selectedRequestForApprove.requestedRoleId,
      });
      setFeedback({
        type: "success",
        message: `Successfully approved request for ${selectedRequestForApprove.fullName}. Account activated and notification email queued.`,
      });
      setSelectedRequestForApprove(null);
      fetchRequests();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to approve staff request.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject with Validation
  const handleConfirmReject = async () => {
    if (!selectedRequestForReject) return;

    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectError("Rejection reason is required (minimum 5 characters).");
      return;
    }

    setActionLoadingId(selectedRequestForReject.id);
    try {
      await authApi.rejectStaffRequest(
        selectedRequestForReject.id,
        rejectionReason.trim(),
      );
      setFeedback({
        type: "success",
        message: `Rejected request for ${selectedRequestForReject.fullName}.`,
      });
      setSelectedRequestForReject(null);
      setRejectionReason("");
      setRejectError("");
      fetchRequests();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to reject staff request.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Edit Request Opening
  const openEditModal = (req: StaffRegistrationRequest) => {
    setSelectedRequestForEdit(req);
    const numericStatus =
      typeof req.status === "number"
        ? req.status
        : isApprovedStatus(req.status)
          ? 1
          : isRejectedStatus(req.status)
            ? 2
            : 0;

    setEditForm({
      fullName: req.fullName,
      email: req.email,
      employeeId: req.employeeId || "",
      requestedRoleId: req.requestedRoleId,
      departmentId: req.departmentId || 0,
      status: numericStatus,
      rejectionReason: req.rejectionReason || "",
    });
    setEditErrors({});
  };

  // Handle Edit Submit with Full Validation
  const handleConfirmEdit = async () => {
    if (!selectedRequestForEdit) return;

    const errors: Record<string, string> = {};
    if (!editForm.fullName.trim() || editForm.fullName.trim().length < 2) {
      errors.fullName = "Full name is required (minimum 2 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email.trim() || !emailRegex.test(editForm.email.trim())) {
      errors.email = "A valid email address is required.";
    }
    if (!editForm.requestedRoleId) {
      errors.requestedRoleId = "Please select a valid role.";
    }
    if (
      editForm.status === 2 &&
      (!editForm.rejectionReason.trim() ||
        editForm.rejectionReason.trim().length < 5)
    ) {
      errors.rejectionReason =
        "Rejection reason is required (minimum 5 characters).";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setActionLoadingId(selectedRequestForEdit.id);
    try {
      await authApi.updateStaffRequest(selectedRequestForEdit.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        employeeId: editForm.employeeId.trim() || undefined,
        requestedRoleId: editForm.requestedRoleId,
        departmentId:
          editForm.departmentId > 0 ? editForm.departmentId : undefined,
        status: editForm.status,
        rejectionReason:
          editForm.status === 2 ? editForm.rejectionReason.trim() : undefined,
      });

      setFeedback({
        type: "success",
        message: `Successfully updated onboarding request for ${editForm.fullName.trim()}.`,
      });
      setSelectedRequestForEdit(null);
      fetchRequests();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Failed to update staff request details.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Email Retry
  const handleRetryEmail = async (requestId: number, applicantName: string) => {
    setActionLoadingId(requestId);
    try {
      const updated = await authApi.retryStaffEmail(requestId);
      setFeedback({
        type: "success",
        message: `Re-sent notification email for ${applicantName}. Delivery status: ${
          updated.emailStatus === 1 ? "SENT" : "QUEUED"
        }.`,
      });
      fetchRequests();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to retry email delivery.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getEmailStatusBadge = (
    emailStatus: number | string,
    errorMessage?: string,
  ) => {
    const statusStr = String(emailStatus).toLowerCase();
    if (
      emailStatus === 1 ||
      statusStr === "sent" ||
      statusStr === "delivered"
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <MailCheck className="w-3.5 h-3.5 text-emerald-600" />
          SENT
        </span>
      );
    }
    if (emailStatus === 0 || statusStr === "queued") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Send className="w-3.5 h-3.5 text-blue-500" />
          QUEUED
        </span>
      );
    }
    if (
      emailStatus === 3 ||
      statusStr === "failed" ||
      statusStr === "bounced"
    ) {
      return (
        <span
          title={errorMessage || "Email delivery failed"}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          FAILED
        </span>
      );
    }
    if (emailStatus === 5 || statusStr === "retrying") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
          RETRYING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Mail className="w-3.5 h-3.5" />
        PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Staff Approval Requests
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review staff onboarding applications, assign RBAC permissions,
                and track email delivery.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchRequests(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Requests
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "pending"
              ? "bg-amber-500/10 border-amber-400 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.pending}
            </span>
            <span className="text-xs text-slate-500">awaiting decision</span>
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setActiveTab("approved")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "approved"
              ? "bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Approved Accounts
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.approved}
            </span>
            <span className="text-xs text-slate-500">activated staff</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setActiveTab("rejected")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "rejected"
              ? "bg-rose-500/10 border-rose-400 ring-2 ring-rose-500/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Rejected Requests
            </span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.rejected}
            </span>
            <span className="text-xs text-slate-500">access denied</span>
          </div>
        </div>

        {/* Failed Email Health Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Email Health Status
            </span>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.total - metrics.failedEmails} / {metrics.total}
            </span>
            {metrics.failedEmails > 0 ? (
              <span className="text-xs font-bold text-rose-600">
                ({metrics.failedEmails} failed retry)
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600">
                100% Healthy
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "pending"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending ({metrics.pending})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "approved"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Approved ({metrics.approved})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "rejected"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rejected ({metrics.rejected})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Requests ({metrics.total})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, employee ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Staff Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            Loading staff onboarding requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No staff registration requests match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-700 min-w-[980px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[260px]">
                    Applicant & Details
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">
                    Requested Role
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">
                    Invitation Code
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">
                    Submitted At
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">
                    Approval Status
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">
                    Email Status
                  </th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[250px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Applicant & Details */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {req.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {req.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <a
                              href={`mailto:${req.email}`}
                              className="hover:underline text-blue-600 font-medium"
                            >
                              {req.email}
                            </a>
                            {req.employeeId && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">
                                {req.employeeId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Requested Role & Department */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <User className="w-3 h-3 text-blue-500" />
                          {req.requestedRoleName}
                        </span>
                        {req.departmentName && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {req.departmentName}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Invitation Code */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono font-semibold text-slate-600 text-xs">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-800">
                        {req.invitationCode}
                      </span>
                    </td>

                    {/* Submitted At */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap text-slate-500 text-xs">
                      <div>
                        {formatDateByPattern(req.submittedAt, "MMM dd, yyyy")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateByPattern(req.submittedAt, "hh:mm a")}
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {req.status === 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                      {req.status === 1 && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Approved
                          </span>
                          {req.reviewedByName && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              by {req.reviewedByName}
                            </div>
                          )}
                        </div>
                      )}
                      {req.status === 2 && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Rejected
                          </span>
                          {req.rejectionReason && (
                            <div
                              title={req.rejectionReason}
                              className="text-[10px] text-rose-600 truncate max-w-[140px] mt-0.5 italic"
                            >
                              "{req.rejectionReason}"
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Email Status */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="space-y-1">
                        {getEmailStatusBadge(
                          req.emailStatus,
                          req.emailErrorMessage,
                        )}
                        {req.lastEmailAttempt && (
                          <div className="text-[10px] text-slate-400">
                            {formatDateByPattern(
                              req.lastEmailAttempt,
                              "hh:mm a",
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button for all stages */}
                        <button
                          onClick={() => openEditModal(req)}
                          disabled={actionLoadingId === req.id}
                          title="Edit request details & workflow stage"
                          className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {/* Stage Action Buttons */}
                        {req.status === 0 ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequestForApprove(req);
                                setSelectedRoleId(req.requestedRoleId);
                              }}
                              disabled={actionLoadingId === req.id}
                              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm flex items-center gap-1 shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequestForReject(req);
                                setRejectionReason("");
                                setRejectError("");
                              }}
                              disabled={actionLoadingId === req.id}
                              className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        ) : req.status === 2 ? (
                          <button
                            onClick={() => {
                              setSelectedRequestForApprove(req);
                              setSelectedRoleId(req.requestedRoleId);
                            }}
                            disabled={actionLoadingId === req.id}
                            className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-xs transition-colors shadow-sm flex items-center gap-1 shrink-0"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Re-approve
                          </button>
                        ) : null}

                        {/* Retry Email Button if email failed */}
                        {req.emailStatus === 3 && (
                          <button
                            onClick={() =>
                              handleRetryEmail(req.id, req.fullName)
                            }
                            disabled={actionLoadingId === req.id}
                            title="Re-send notification email"
                            className="h-8 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors shrink-0"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                actionLoadingId === req.id ? "animate-spin" : ""
                              }`}
                            />
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      {selectedRequestForApprove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedRequestForApprove.status === 2
                    ? "Re-approve Staff Registration"
                    : "Approve Staff Registration"}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRequestForApprove.status === 2
                    ? "Re-evaluate and re-activate user account access."
                    : "Authorize and provision active user account."}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">
                  {selectedRequestForApprove.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Work Email:</span>
                <span className="font-medium text-slate-800">
                  {selectedRequestForApprove.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono text-slate-800">
                  {selectedRequestForApprove.employeeId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Role:</span>
                <span className="font-bold text-blue-600">
                  {selectedRequestForApprove.requestedRoleName}
                </span>
              </div>
            </div>

            {/* Select Authorized Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Confirm Authorized Role
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 italic">
                Role will be assigned in database transaction. Access token will
                reflect this role.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRequestForApprove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                {actionLoadingId !== null && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                {selectedRequestForApprove.status === 2
                  ? "Confirm Re-approval & Reactivate"
                  : "Confirm Approval & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {selectedRequestForReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Reject Staff Registration
                </h3>
                <p className="text-xs text-slate-500">
                  Deny access request for this applicant.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">
                  {selectedRequestForReject.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">
                  {selectedRequestForReject.email}
                </span>
              </div>
            </div>

            {/* Rejection Reason Text Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Rejection Reason (included in notification email) *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="e.g. Employee ID verification failed or credentials could not be validated (min 5 chars)."
                className={`w-full p-3 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                  rejectError
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-rose-500/20 focus:border-rose-500"
                }`}
              />
              {rejectError && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{rejectError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequestForReject(null);
                  setRejectError("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={
                  actionLoadingId !== null ||
                  !rejectionReason.trim() ||
                  rejectionReason.trim().length < 5
                }
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                {actionLoadingId !== null && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REQUEST MODAL */}
      {selectedRequestForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Onboarding Request
                </h3>
                <p className="text-xs text-slate-500">
                  Update applicant details, assigned role, or transition
                  workflow stage.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => {
                    setEditForm({ ...editForm, fullName: e.target.value });
                    if (editErrors.fullName)
                      setEditErrors({ ...editErrors, fullName: "" });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    editErrors.fullName
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20"
                  }`}
                />
                {editErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {editErrors.fullName}
                  </p>
                )}
              </div>

              {/* Work Email & Employee ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => {
                      setEditForm({ ...editForm, email: e.target.value });
                      if (editErrors.email)
                        setEditErrors({ ...editErrors, email: "" });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                      editErrors.email
                        ? "border-rose-400 focus:ring-rose-500/20"
                        : "border-slate-200 focus:ring-blue-500/20"
                    }`}
                  />
                  {editErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {editErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={editForm.employeeId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, employeeId: e.target.value })
                    }
                    placeholder="EMP-XXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={editForm.requestedRoleId}
                    onChange={(e) => {
                      setEditForm({
                        ...editForm,
                        requestedRoleId: Number(e.target.value),
                      });
                      if (editErrors.requestedRoleId)
                        setEditErrors({ ...editErrors, requestedRoleId: "" });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {roles.map((r) => (
                      <option key={r.roleId} value={r.roleId}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Clinical Department
                  </label>
                  <select
                    value={editForm.departmentId}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        departmentId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={0}>General / None</option>
                    {departments.map((d: any) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Workflow Stage */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Workflow Stage / Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: 0 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      editForm.status === 0
                        ? "bg-amber-500/10 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Pending (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: 1 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      editForm.status === 1
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Approved (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: 2 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      editForm.status === 2
                        ? "bg-rose-500/10 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Rejected (2)
                  </button>
                </div>
              </div>

              {/* Rejection Reason (when status === 2) */}
              {editForm.status === 2 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.rejectionReason}
                    onChange={(e) => {
                      setEditForm({
                        ...editForm,
                        rejectionReason: e.target.value,
                      });
                      if (editErrors.rejectionReason)
                        setEditErrors({ ...editErrors, rejectionReason: "" });
                    }}
                    placeholder="Enter reason for rejection (min 5 chars)..."
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                      editErrors.rejectionReason
                        ? "border-rose-400 focus:ring-rose-500/20"
                        : "border-slate-200 focus:ring-rose-500/20"
                    }`}
                  />
                  {editErrors.rejectionReason && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {editErrors.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequestForEdit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                {actionLoadingId !== null && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Save Changes & Apply Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
