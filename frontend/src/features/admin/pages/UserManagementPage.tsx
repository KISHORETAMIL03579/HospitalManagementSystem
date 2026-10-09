import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCog,
  Clock,
} from "lucide-react";
import {
  authApi,
  AdminUserDto,
  StaffRegistrationRequest,
  isPendingStatus,
} from "../../auth/api/authApi";
import { PhoneNumberInput } from "../../../components/common/PhoneNumberInput";
import { formatDateByPattern } from "../../../utils/dateUtils";

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [requests, setRequests] = useState<StaffRegistrationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<{ roleId: number; name: string }[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<
    number | undefined
  >(undefined);
  const [statusTab, setStatusTab] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");

  // Loading indicator for specific actions
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Notification Toast
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<AdminUserDto | null>(
    null,
  );
  const [deletingUser, setDeletingUser] = useState<AdminUserDto | null>(null);

  // Approval & Rejection Modals for Pending Onboarding Requests
  const [approveRequest, setApproveRequest] =
    useState<StaffRegistrationRequest | null>(null);
  const [approveRoleId, setApproveRoleId] = useState<number>(0);
  const [rejectRequest, setRejectRequest] =
    useState<StaffRegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    roleId: 4, // Default Receptionist
    employeeId: "EMP-2026-101",
  });

  // Edit Form State
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    employeeId: "",
    password: "",
    roleId: 0,
  });

  // Target Role for Role Change Modal
  const [targetRoleId, setTargetRoleId] = useState<number>(0);

  const fetchUsers = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [userData, requestsData] = await Promise.all([
        authApi.getAllAdminUsers(),
        authApi.getStaffRequests(),
      ]);
      setUsers(userData);
      setRequests(requestsData);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Failed to load user accounts from server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await authApi.getRoles();
      setRoles(data);
      if (data.length > 0) {
        setCreateForm((prev) => ({ ...prev, roleId: data[0].roleId }));
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = users.filter((u) => !u.isActive).length;
    const pending = requests.filter((r) => isPendingStatus(r.status)).length;
    const clinical = users.filter(
      (u) =>
        u.roleName.toLowerCase().includes("doc") ||
        u.roleName.toLowerCase().includes("nurse") ||
        u.roleName.toLowerCase().includes("pharma") ||
        u.roleName.toLowerCase().includes("lab"),
    ).length;
    return { total, active, inactive, pending, clinical };
  }, [users, requests]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status Filter
      if (statusTab === "active" && !u.isActive) return false;
      if (statusTab === "inactive" && u.isActive) return false;

      // Role Filter
      if (selectedRoleFilter && u.roleId !== selectedRoleFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = u.fullName.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const usernameMatch = u.username.toLowerCase().includes(q);
        const empMatch = u.employeeId?.toLowerCase().includes(q) ?? false;
        const roleMatch = u.roleName.toLowerCase().includes(q);
        return (
          nameMatch || emailMatch || usernameMatch || empMatch || roleMatch
        );
      }

      return true;
    });
  }, [users, statusTab, selectedRoleFilter, searchQuery]);

  // Filtered Pending Onboarding Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!isPendingStatus(r.status)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = r.fullName.toLowerCase().includes(q);
        const emailMatch = r.email.toLowerCase().includes(q);
        const userMatch = r.username.toLowerCase().includes(q);
        const codeMatch = r.invitationCode.toLowerCase().includes(q);
        const deptMatch = r.departmentName?.toLowerCase().includes(q) ?? false;
        const roleMatch = r.requestedRoleName.toLowerCase().includes(q);
        return (
          nameMatch ||
          emailMatch ||
          userMatch ||
          codeMatch ||
          deptMatch ||
          roleMatch
        );
      }
      return true;
    });
  }, [requests, searchQuery]);

  // CREATE USER HANDLER
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoadingId(-1);
    try {
      const created = await authApi.createAdminUser(createForm);
      setFeedback({
        type: "success",
        message: `Successfully created user account for ${created.fullName} (${created.roleName}).`,
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: "",
        email: "",
        username: "",
        phone: "",
        password: "",
        roleId: roles[0]?.roleId || 4,
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      });
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to create user account.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // EDIT USER HANDLER
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoadingId(editingUser.userId);
    try {
      const updated = await authApi.updateAdminUser(
        editingUser.userId,
        editForm,
      );
      setFeedback({
        type: "success",
        message: `Updated account details for ${updated.fullName}.`,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to update account details.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ROLE CHANGE HANDLER
  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeUser || !targetRoleId) return;
    setActionLoadingId(roleChangeUser.userId);
    try {
      const updated = await authApi.updateAdminUserRole(
        roleChangeUser.userId,
        targetRoleId,
      );
      setFeedback({
        type: "success",
        message: `Role for ${updated.fullName} changed to ${updated.roleName}.`,
      });
      setRoleChangeUser(null);
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to change user role.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // TOGGLE STATUS HANDLER (Activate / Deactivate)
  const handleToggleStatus = async (user: AdminUserDto) => {
    setActionLoadingId(user.userId);
    const nextStatus = !user.isActive;
    try {
      const updated = await authApi.toggleAdminUserStatus(
        user.userId,
        nextStatus,
      );
      setFeedback({
        type: "success",
        message: `Account for ${updated.fullName} has been ${
          updated.isActive ? "ACTIVATED" : "DEACTIVATED"
        }.`,
      });
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to update user status.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // DELETE HANDLER (Soft Delete / Archive)
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setActionLoadingId(deletingUser.userId);
    try {
      await authApi.deleteAdminUser(deletingUser.userId);
      setFeedback({
        type: "success",
        message: `User account for ${deletingUser.fullName} archived successfully. Medical records preserved.`,
      });
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to remove user account.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // APPROVE STAFF REQUEST HANDLER
  const handleApproveSubmit = async () => {
    if (!approveRequest) return;
    setActionLoadingId(approveRequest.id);
    try {
      await authApi.approveStaffRequest(approveRequest.id, {
        authorizedRoleId: approveRoleId || approveRequest.requestedRoleId,
      });
      setFeedback({
        type: "success",
        message: `Employee account for ${approveRequest.fullName} approved and activated successfully!`,
      });
      setApproveRequest(null);
      fetchUsers();
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

  // REJECT STAFF REQUEST HANDLER
  const handleRejectSubmit = async () => {
    if (!rejectRequest) return;
    setActionLoadingId(rejectRequest.id);
    try {
      await authApi.rejectStaffRequest(
        rejectRequest.id,
        rejectionReason || "Application rejected by administrator.",
      );
      setFeedback({
        type: "success",
        message: `Application for ${rejectRequest.fullName} has been rejected.`,
      });
      setRejectRequest(null);
      setRejectionReason("");
      fetchUsers();
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

  const getRoleBadgeColor = (roleName: string) => {
    const r = roleName.toLowerCase();
    if (r.includes("admin")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (r.includes("doc"))
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (r.includes("nurse")) return "bg-cyan-50 text-cyan-700 border-cyan-200";
    if (r.includes("recept"))
      return "bg-amber-50 text-amber-700 border-amber-200";
    if (r.includes("pharma"))
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (r.includes("lab")) return "bg-teal-50 text-teal-700 border-teal-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                User Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage all hospital personnel accounts, assign dynamic RBAC
                roles, and control access in real time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchUsers(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create User Account
          </button>
        </div>
      </div>

      {/* Feedback Notification Toast */}
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
        {/* Total Accounts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Accounts
            </span>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-500">registered users</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div
          onClick={() => setStatusTab("active")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === "active"
              ? "bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Active Staff
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.active}
            </span>
            <span className="text-xs text-slate-500">authorized access</span>
          </div>
        </div>

        {/* Inactive Accounts */}
        <div
          onClick={() => setStatusTab("inactive")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === "inactive"
              ? "bg-rose-500/10 border-rose-400 ring-2 ring-rose-500/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Inactive Accounts
            </span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.inactive}
            </span>
            <span className="text-xs text-slate-500">deactivated</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setStatusTab("pending")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === "pending"
              ? "bg-amber-500/10 border-amber-400 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.pending}
            </span>
            <span className="text-xs text-slate-500">awaiting review</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setStatusTab("all")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              statusTab === "all"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Accounts ({metrics.total})
          </button>
          <button
            onClick={() => setStatusTab("active")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              statusTab === "active"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active ({metrics.active})
          </button>
          <button
            onClick={() => setStatusTab("inactive")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              statusTab === "inactive"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Inactive ({metrics.inactive})
          </button>
          <button
            onClick={() => setStatusTab("pending")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusTab === "pending"
                ? "bg-amber-500 text-white shadow-xs font-bold"
                : "text-amber-800 hover:bg-amber-50"
            }`}
          >
            <span>Pending Approvals</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                statusTab === "pending"
                  ? "bg-white text-amber-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {metrics.pending}
            </span>
          </button>
        </div>

        {/* Role Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Role Filter Dropdown */}
          <select
            value={selectedRoleFilter || ""}
            onChange={(e) =>
              setSelectedRoleFilter(
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full sm:w-44 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Filter by Role (All)</option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, employee ID..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            Loading user accounts...
          </div>
        ) : statusTab === "pending" ? (
          filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              No pending staff onboarding requests matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-amber-50/60 border-b border-amber-200/60 text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Applicant & Contact</th>
                    <th className="py-3.5 px-4">Requested Role & Dept</th>
                    <th className="py-3.5 px-4">Invitation Code</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      {/* Applicant details */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {req.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{req.fullName}</span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                ({req.username})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <a
                                href={`mailto:${req.email}`}
                                className="hover:underline text-blue-600 font-medium"
                              >
                                {req.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Requested Role & Dept */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                              req.requestedRoleName,
                            )}`}
                          >
                            <User className="w-3 h-3" />
                            {req.requestedRoleName}
                          </span>
                          {req.departmentName && (
                            <div className="text-[11px] text-slate-500 font-medium">
                              Dept: {req.departmentName}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Invitation Code */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                          {req.invitationCode}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {formatDateByPattern(
                          req.submittedAt,
                          "MMM dd, yyyy - hh:mm a",
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setApproveRequest(req);
                              setApproveRoleId(req.requestedRoleId);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve & Activate
                          </button>
                          <button
                            onClick={() => setRejectRequest(req)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <UserCog className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No user accounts found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User & Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.userId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* User Details */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{u.fullName}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({u.username})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <a
                              href={`mailto:${u.email}`}
                              className="hover:underline text-blue-600 font-medium"
                            >
                              {u.email}
                            </a>
                            {u.employeeId && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">
                                {u.employeeId}
                              </span>
                            )}
                            {u.phone && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                📞 {u.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                          u.roleName,
                        )}`}
                      >
                        <User className="w-3 h-3" />
                        {u.roleName}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {u.lastLoginAt ? (
                        <div>
                          <div>
                            {formatDateByPattern(u.lastLoginAt, "MMM dd, yyyy")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDateByPattern(u.lastLoginAt, "hh:mm a")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Never logged in
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {formatDateByPattern(u.createdAt, "MMM dd, yyyy")}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Account */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setShowEditPassword(false);
                            setEditForm({
                              fullName: u.fullName,
                              email: u.email,
                              phone: u.phone || "",
                              employeeId: u.employeeId || "",
                              password: "",
                              roleId: u.roleId,
                            });
                          }}
                          title="Edit Account Details"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        {/* Quick Role Switcher */}
                        <button
                          onClick={() => {
                            setRoleChangeUser(u);
                            setTargetRoleId(u.roleId);
                          }}
                          title="Change Assigned Role"
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          Role
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoadingId === u.userId}
                          title={
                            u.isActive
                              ? "Deactivate Account"
                              : "Activate Account"
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                            u.isActive
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>

                        {/* Remove / Soft Delete */}
                        <button
                          onClick={() => setDeletingUser(u)}
                          title="Remove Account (Archive)"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Create User Account
                </h3>
                <p className="text-xs text-slate-500">
                  Direct admin provisioning of staff user credentials.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arun Kumar"
                  value={createForm.fullName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. akumar"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, username: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-001"
                    value={createForm.employeeId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        employeeId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="arun@hospital.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <PhoneNumberInput
                  id="create-user-phone"
                  label="Phone Number (Optional)"
                  value={createForm.phone}
                  onChange={(phone) => setCreateForm({ ...createForm, phone })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Role *
                </label>
                <select
                  value={createForm.roleId}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      roleId: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {roles.map((r) => (
                    <option key={r.roleId} value={r.roleId}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoadingId === -1 && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Create Account Now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Account Details
                </h3>
                <p className="text-xs text-slate-500">
                  Update permitted fields for user #{editingUser.userId}.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <PhoneNumberInput
                  id="edit-user-phone"
                  label="Phone Number (Optional)"
                  value={editForm.phone}
                  onChange={(phone) => setEditForm({ ...editForm, phone })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password (Optional Reset)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Leave blank to keep existing password"
                    value={editForm.password || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter a new password only if you want to reset this user's
                  password.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={editForm.roleId}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        roleId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {roles.map((r) => (
                      <option key={r.roleId} value={r.roleId}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoadingId === editingUser.userId && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {roleChangeUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRoleChangeSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Change User Role
                </h3>
                <p className="text-xs text-slate-500">
                  Update role and RBAC permission level for{" "}
                  {roleChangeUser.fullName}.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Role:</span>
                <span className="font-bold text-indigo-600">
                  {roleChangeUser.roleName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User Email:</span>
                <span className="font-medium text-slate-800">
                  {roleChangeUser.email}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">
                Select New Role
              </label>
              <select
                value={targetRoleId}
                onChange={(e) => setTargetRoleId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 italic">
                Changing role updates permissions immediately. Next API call
                from this user will evaluate against the new role.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleChangeUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoadingId === roleChangeUser.userId && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Confirm Role Change
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REMOVE / ARCHIVE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Remove Account (Archive)
                </h3>
                <p className="text-xs text-slate-500">
                  Deactivate account while preserving medical records.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-900">
              <div className="font-bold">
                Are you sure you want to remove {deletingUser.fullName}?
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                This action disables login access and revokes active refresh
                tokens. The account is archived to ensure patient EMR,
                encounters, prescriptions, and audit logs remain intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoadingId === deletingUser.userId && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Confirm Archive & Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE STAFF REQUEST MODAL */}
      {approveRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Approve Staff Onboarding
                </h3>
                <p className="text-xs text-slate-500">
                  Activate account and grant access for{" "}
                  {approveRequest.fullName}.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">
                  {approveRequest.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">
                  {approveRequest.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invitation Code:</span>
                <span className="font-mono font-bold text-slate-700">
                  {approveRequest.invitationCode}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">
                Confirm or Override Assigned Role
              </label>
              <select
                value={approveRoleId}
                onChange={(e) => setApproveRoleId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 italic">
                The account will be activated immediately with the selected role
                credentials.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApproveRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoadingId === approveRequest.id && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Approve & Activate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT STAFF REQUEST MODAL */}
      {rejectRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Reject Onboarding Request
                </h3>
                <p className="text-xs text-slate-500">
                  Decline registration request for {rejectRequest.fullName}.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">
                  {rejectRequest.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">
                  {rejectRequest.email}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid credentials or expired invitation code."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectRequest(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoadingId === rejectRequest.id && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
