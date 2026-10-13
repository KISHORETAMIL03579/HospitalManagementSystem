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
  Eye,
  EyeOff,
  Building2,
  X,
} from "lucide-react";
import {
  authApi,
  AdminUserDto,
  StaffRegistrationRequest,
  isPendingStatus,
  isApprovedStatus,
  isRejectedStatus,
} from "../../auth/api/authApi";
import { doctorApi } from "../../doctors/api/doctorApi";
import { DepartmentDto } from "../../doctors/types/doctor.types";
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
  const [viewingRequest, setViewingRequest] =
    useState<StaffRegistrationRequest | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUserDto | null>(null);
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
  const [rejectError, setRejectError] = useState<string>("");

  // Edit Request State for Pending Onboarding Requests
  const [editingRequest, setEditingRequest] =
    useState<StaffRegistrationRequest | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [editRequestForm, setEditRequestForm] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    requestedRoleId: 0,
    departmentId: 0,
    status: 0,
    rejectionReason: "",
  });
  const [editRequestErrors, setEditRequestErrors] = useState<
    Record<string, string>
  >({});

  // Create Form State & Validation
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    roleId: 4, // Default Receptionist
    employeeId: "EMP-2026-101",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit Form State & Validation
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    employeeId: "",
    password: "",
    roleId: 0,
  });
  const [editUserErrors, setEditUserErrors] = useState<Record<string, string>>(
    {},
  );

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

  const fetchDepartments = async () => {
    try {
      const data = await doctorApi.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
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

    const errors: Record<string, string> = {};
    if (!createForm.fullName.trim() || createForm.fullName.trim().length < 2) {
      errors.fullName = "Full name is required (minimum 2 characters).";
    }
    if (!createForm.username.trim() || createForm.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!createForm.email.trim() || !emailRegex.test(createForm.email.trim())) {
      errors.email = "Please provide a valid work email.";
    }
    if (!createForm.password || createForm.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (!createForm.roleId) {
      errors.roleId = "Please assign a role.";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setActionLoadingId(-1);
    try {
      const created = await authApi.createAdminUser(createForm);
      setFeedback({
        type: "success",
        message: `Successfully created user account for ${created.fullName} (${created.roleName}).`,
      });
      setIsCreateModalOpen(false);
      setCreateErrors({});
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

    const errors: Record<string, string> = {};
    if (!editForm.fullName.trim() || editForm.fullName.trim().length < 2) {
      errors.fullName = "Full name is required (minimum 2 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email.trim() || !emailRegex.test(editForm.email.trim())) {
      errors.email = "Please provide a valid work email.";
    }
    if (editForm.password && editForm.password.length < 6) {
      errors.password = "New password must be at least 6 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setEditUserErrors(errors);
      return;
    }

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
      setEditUserErrors({});
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

    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectError("Rejection reason is required (minimum 5 characters).");
      return;
    }

    setActionLoadingId(rejectRequest.id);
    try {
      await authApi.rejectStaffRequest(
        rejectRequest.id,
        rejectionReason.trim(),
      );
      setFeedback({
        type: "success",
        message: `Application for ${rejectRequest.fullName} has been rejected.`,
      });
      setRejectRequest(null);
      setRejectionReason("");
      setRejectError("");
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

  // OPEN EDIT REQUEST MODAL
  const openEditRequestModal = (req: StaffRegistrationRequest) => {
    setEditingRequest(req);
    const numericStatus =
      typeof req.status === "number"
        ? req.status
        : isApprovedStatus(req.status)
          ? 1
          : isRejectedStatus(req.status)
            ? 2
            : 0;

    setEditRequestForm({
      fullName: req.fullName,
      email: req.email,
      employeeId: req.employeeId || "",
      requestedRoleId: req.requestedRoleId,
      departmentId: req.departmentId || 0,
      status: numericStatus,
      rejectionReason: req.rejectionReason || "",
    });
    setEditRequestErrors({});
  };

  // SUBMIT EDIT REQUEST
  const handleEditRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    const errors: Record<string, string> = {};
    if (
      !editRequestForm.fullName.trim() ||
      editRequestForm.fullName.trim().length < 2
    ) {
      errors.fullName = "Full name is required (minimum 2 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !editRequestForm.email.trim() ||
      !emailRegex.test(editRequestForm.email.trim())
    ) {
      errors.email = "A valid email address is required.";
    }
    if (!editRequestForm.requestedRoleId) {
      errors.requestedRoleId = "Please select a valid role.";
    }
    if (
      editRequestForm.status === 2 &&
      (!editRequestForm.rejectionReason.trim() ||
        editRequestForm.rejectionReason.trim().length < 5)
    ) {
      errors.rejectionReason =
        "Rejection reason is required (minimum 5 characters).";
    }

    if (Object.keys(errors).length > 0) {
      setEditRequestErrors(errors);
      return;
    }

    setActionLoadingId(editingRequest.id);
    try {
      await authApi.updateStaffRequest(editingRequest.id, {
        fullName: editRequestForm.fullName.trim(),
        email: editRequestForm.email.trim(),
        employeeId: editRequestForm.employeeId.trim() || undefined,
        requestedRoleId: editRequestForm.requestedRoleId,
        departmentId:
          editRequestForm.departmentId > 0
            ? editRequestForm.departmentId
            : undefined,
        status: editRequestForm.status,
        rejectionReason:
          editRequestForm.status === 2
            ? editRequestForm.rejectionReason.trim()
            : undefined,
      });

      setFeedback({
        type: "success",
        message: `Updated onboarding request for ${editRequestForm.fullName.trim()}.`,
      });
      setEditingRequest(null);
      fetchUsers();
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
    <div className="space-y-6 max-w-full overflow-hidden">
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
        <div
          onClick={() => setStatusTab("all")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === "all"
              ? "bg-blue-500/10 border-blue-400 ring-2 ring-blue-500/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
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
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs max-w-full">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto shrink-0">
          <button
            onClick={() => setStatusTab("all")}
            className={`flex-1 xl:flex-initial px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              statusTab === "all"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/60"
            }`}
          >
            <span>All Accounts</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                statusTab === "all"
                  ? "bg-white text-blue-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {metrics.total}
            </span>
          </button>
          <button
            onClick={() => setStatusTab("active")}
            className={`flex-1 xl:flex-initial px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              statusTab === "active"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <span>Active</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                statusTab === "active"
                  ? "bg-white text-emerald-700"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {metrics.active}
            </span>
          </button>
          <button
            onClick={() => setStatusTab("inactive")}
            className={`flex-1 xl:flex-initial px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              statusTab === "inactive"
                ? "bg-rose-600 text-white shadow-xs font-bold"
                : "text-rose-700 hover:bg-rose-50"
            }`}
          >
            <span>Inactive</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                statusTab === "inactive"
                  ? "bg-white text-rose-700"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {metrics.inactive}
            </span>
          </button>
          <button
            onClick={() => setStatusTab("pending")}
            className={`flex-1 xl:flex-initial px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
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
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
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
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-amber-50/60 border-b border-amber-200/60 text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[200px]">
                      Applicant & Contact
                    </th>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[140px]">
                      Requested Role & Dept
                    </th>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[110px]">
                      Invitation Code
                    </th>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[120px]">
                      Submitted Date
                    </th>
                    <th className="py-3 px-3.5 text-right pr-5 whitespace-nowrap min-w-[300px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      {/* Applicant details (Clickable to view full details) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div
                          onClick={() => setViewingRequest(req)}
                          className="flex items-center gap-3 cursor-pointer group"
                          title="Click to view full application details"
                        >
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0 group-hover:ring-2 group-hover:ring-amber-400 transition">
                            {req.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2 group-hover:text-amber-700 transition">
                              <span>{req.fullName}</span>
                              <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                              <span className="text-[11px] text-slate-400 font-normal">
                                ({req.username})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <a
                                href={`mailto:${req.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline text-blue-600 font-medium"
                              >
                                {req.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Requested Role & Dept */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
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
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>Dept: {req.departmentName}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Invitation Code */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono font-bold text-slate-700 text-xs">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                          {req.invitationCode}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap text-slate-500 text-xs">
                        {formatDateByPattern(
                          req.submittedAt,
                          "MMM dd, yyyy - hh:mm a",
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 pr-5 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {/* View Full Application Details */}
                          <button
                            onClick={() => setViewingRequest(req)}
                            className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                            title="View complete application details"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => openEditRequestModal(req)}
                            className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                            title="Edit applicant details & stage"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setApproveRequest(req);
                              setApproveRoleId(req.requestedRoleId);
                            }}
                            className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectRequest(req);
                              setRejectionReason("");
                              setRejectError("");
                            }}
                            className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 min-w-[210px] whitespace-nowrap">
                    User & Contact
                  </th>
                  <th className="py-3 px-3.5 min-w-[120px] whitespace-nowrap">
                    Role
                  </th>
                  <th className="py-3 px-3.5 min-w-[95px] whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-3 px-3.5 min-w-[120px] whitespace-nowrap">
                    Last Login
                  </th>
                  <th className="py-3 px-3.5 min-w-[105px] whitespace-nowrap">
                    Created Date
                  </th>
                  <th className="py-3 px-3.5 min-w-[320px] pr-5 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.userId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* User Details (Clickable to view full profile) */}
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div
                        onClick={() => setViewingUser(u)}
                        className="flex items-center gap-3 cursor-pointer group"
                        title="Click to view full user profile"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:ring-2 group-hover:ring-blue-400 transition">
                          {u.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2 group-hover:text-blue-600 transition">
                            <span>{u.fullName}</span>
                            <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({u.username})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <a
                              href={`mailto:${u.email}`}
                              onClick={(e) => e.stopPropagation()}
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
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
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
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
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
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap text-slate-500 text-xs">
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
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap text-slate-500 text-xs">
                      {formatDateByPattern(u.createdAt, "MMM dd, yyyy")}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 pr-5 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                        {/* Details View Button */}
                        <button
                          onClick={() => setViewingUser(u)}
                          title="View complete user profile details"
                          className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors shrink-0 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Details</span>
                        </button>

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
                          className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors shrink-0"
                        >
                          <Edit className="w-3.5 h-3.5 shrink-0" />
                          Edit
                        </button>

                        {/* Quick Role Switcher */}
                        <button
                          onClick={() => {
                            setRoleChangeUser(u);
                            setTargetRoleId(u.roleId);
                          }}
                          title="Change Assigned Role"
                          className="h-8 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors shrink-0"
                        >
                          <UserCog className="w-3.5 h-3.5 shrink-0" />
                          Role
                        </button>

                        {/* Activate / Deactivate Toggle (Fixed width to prevent column shifting) */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoadingId === u.userId}
                          title={
                            u.isActive
                              ? "Deactivate Account"
                              : "Activate Account"
                          }
                          className={`h-8 w-[104px] px-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
                            u.isActive
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5 shrink-0" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        {/* Remove / Soft Delete */}
                        <button
                          onClick={() => setDeletingUser(u)}
                          title="Remove Account (Archive)"
                          className="h-8 w-8 inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors shrink-0"
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
                  onChange={(e) => {
                    setCreateForm({ ...createForm, fullName: e.target.value });
                    if (createErrors.fullName)
                      setCreateErrors({ ...createErrors, fullName: "" });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    createErrors.fullName
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20"
                  }`}
                />
                {createErrors.fullName && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {createErrors.fullName}
                  </p>
                )}
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
                    onChange={(e) => {
                      setCreateForm({
                        ...createForm,
                        username: e.target.value,
                      });
                      if (createErrors.username)
                        setCreateErrors({ ...createErrors, username: "" });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                      createErrors.username
                        ? "border-rose-400 focus:ring-rose-500/20"
                        : "border-slate-200 focus:ring-blue-500/20"
                    }`}
                  />
                  {createErrors.username && (
                    <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {createErrors.username}
                    </p>
                  )}
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
                  onChange={(e) => {
                    setCreateForm({ ...createForm, email: e.target.value });
                    if (createErrors.email)
                      setCreateErrors({ ...createErrors, email: "" });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    createErrors.email
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20"
                  }`}
                />
                {createErrors.email && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {createErrors.email}
                  </p>
                )}
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
                  onChange={(e) => {
                    setCreateForm({ ...createForm, password: e.target.value });
                    if (createErrors.password)
                      setCreateErrors({ ...createErrors, password: "" });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    createErrors.password
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20"
                  }`}
                />
                {createErrors.password && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {createErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Role *
                </label>
                <select
                  value={createForm.roleId}
                  onChange={(e) => {
                    setCreateForm({
                      ...createForm,
                      roleId: Number(e.target.value),
                    });
                    if (createErrors.roleId)
                      setCreateErrors({ ...createErrors, roleId: "" });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {roles.map((r) => (
                    <option key={r.roleId} value={r.roleId}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {createErrors.roleId && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {createErrors.roleId}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateErrors({});
                }}
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
                  onChange={(e) => {
                    setEditForm({ ...editForm, fullName: e.target.value });
                    if (editUserErrors.fullName)
                      setEditUserErrors({ ...editUserErrors, fullName: "" });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    editUserErrors.fullName
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-indigo-500/20"
                  }`}
                />
                {editUserErrors.fullName && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {editUserErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => {
                    setEditForm({ ...editForm, email: e.target.value });
                    if (editUserErrors.email)
                      setEditUserErrors({ ...editUserErrors, email: "" });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    editUserErrors.email
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-indigo-500/20"
                  }`}
                />
                {editUserErrors.email && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {editUserErrors.email}
                  </p>
                )}
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
                    onChange={(e) => {
                      setEditForm({ ...editForm, password: e.target.value });
                      if (editUserErrors.password)
                        setEditUserErrors({ ...editUserErrors, password: "" });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl pr-9 focus:outline-none focus:ring-2 ${
                      editUserErrors.password
                        ? "border-rose-400 focus:ring-rose-500/20"
                        : "border-slate-200 focus:ring-indigo-500/20"
                    }`}
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
                {editUserErrors.password && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {editUserErrors.password}
                  </p>
                )}
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
                onClick={() => {
                  setEditingUser(null);
                  setEditUserErrors({});
                }}
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
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="Please explain why this registration is being rejected (minimum 5 characters)..."
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                  rejectError
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-rose-500/20"
                }`}
              />
              {rejectError && (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {rejectError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectRequest(null);
                  setRejectionReason("");
                  setRejectError("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={
                  actionLoadingId !== null || rejectionReason.trim().length < 5
                }
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
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

      {/* EDIT STAFF REGISTRATION REQUEST MODAL */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Edit Staff Onboarding Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modify profile details, role, department or transition
                    stage.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editRequestForm.fullName}
                  onChange={(e) => {
                    setEditRequestForm({
                      ...editRequestForm,
                      fullName: e.target.value,
                    });
                    if (editRequestErrors.fullName)
                      setEditRequestErrors({
                        ...editRequestErrors,
                        fullName: "",
                      });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                    editRequestErrors.fullName
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20"
                  }`}
                />
                {editRequestErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {editRequestErrors.fullName}
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
                    value={editRequestForm.email}
                    onChange={(e) => {
                      setEditRequestForm({
                        ...editRequestForm,
                        email: e.target.value,
                      });
                      if (editRequestErrors.email)
                        setEditRequestErrors({
                          ...editRequestErrors,
                          email: "",
                        });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                      editRequestErrors.email
                        ? "border-rose-400 focus:ring-rose-500/20"
                        : "border-slate-200 focus:ring-blue-500/20"
                    }`}
                  />
                  {editRequestErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {editRequestErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={editRequestForm.employeeId}
                    onChange={(e) =>
                      setEditRequestForm({
                        ...editRequestForm,
                        employeeId: e.target.value,
                      })
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
                    value={editRequestForm.requestedRoleId}
                    onChange={(e) => {
                      setEditRequestForm({
                        ...editRequestForm,
                        requestedRoleId: Number(e.target.value),
                      });
                      if (editRequestErrors.requestedRoleId)
                        setEditRequestErrors({
                          ...editRequestErrors,
                          requestedRoleId: "",
                        });
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
                    value={editRequestForm.departmentId}
                    onChange={(e) =>
                      setEditRequestForm({
                        ...editRequestForm,
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
                    onClick={() =>
                      setEditRequestForm({ ...editRequestForm, status: 0 })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      editRequestForm.status === 0
                        ? "bg-amber-500/10 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Pending (0)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditRequestForm({ ...editRequestForm, status: 1 })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      editRequestForm.status === 1
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Approved (1)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditRequestForm({ ...editRequestForm, status: 2 })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      editRequestForm.status === 2
                        ? "bg-rose-500/10 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Rejected (2)
                  </button>
                </div>
              </div>

              {/* Rejection Reason (when status === 2) */}
              {editRequestForm.status === 2 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={editRequestForm.rejectionReason}
                    onChange={(e) => {
                      setEditRequestForm({
                        ...editRequestForm,
                        rejectionReason: e.target.value,
                      });
                      if (editRequestErrors.rejectionReason)
                        setEditRequestErrors({
                          ...editRequestErrors,
                          rejectionReason: "",
                        });
                    }}
                    placeholder="Enter reason for rejection (min 5 chars)..."
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                      editRequestErrors.rejectionReason
                        ? "border-rose-400 focus:ring-rose-500/20"
                        : "border-slate-200 focus:ring-rose-500/20"
                    }`}
                  />
                  {editRequestErrors.rejectionReason && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {editRequestErrors.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditRequestSubmit}
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

      {/* APPLICATION DETAILS VIEW MODAL */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Application Details
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      #{viewingRequest.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive onboarding information & status history.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Profile Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  {viewingRequest.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {viewingRequest.fullName}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      @{viewingRequest.username}
                    </span>
                    <span>•</span>
                    <a
                      href={`mailto:${viewingRequest.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {viewingRequest.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 text-right">
                {isPendingStatus(viewingRequest.status) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Pending Review
                  </span>
                ) : isApprovedStatus(viewingRequest.status) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Approved
                  </span>
                ) : isRejectedStatus(viewingRequest.status) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {String(viewingRequest.status)}
                  </span>
                )}
              </div>
            </div>

            {/* Application Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Requested Role
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-sm">
                  <User className="w-4 h-4 text-blue-500" />
                  {viewingRequest.requestedRoleName}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Assigned Department
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-sm">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  {viewingRequest.departmentName || "General / None"}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Employee ID
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {viewingRequest.employeeId || "None specified"}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Invitation Code
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 inline-block">
                  {viewingRequest.invitationCode}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Application Submitted
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {formatDateByPattern(
                    viewingRequest.submittedAt,
                    "MMM dd, yyyy - hh:mm a",
                  )}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Review Details
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {viewingRequest.reviewedByName
                    ? `By ${viewingRequest.reviewedByName} ${
                        viewingRequest.reviewedAt
                          ? `on ${formatDateByPattern(
                              viewingRequest.reviewedAt,
                              "MMM dd, yyyy",
                            )}`
                          : ""
                      }`
                    : "Awaiting review decision"}
                </span>
              </div>
            </div>

            {/* Prominent Rejection Reason Card */}
            {viewingRequest.rejectionReason && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Rejection Reason & Auditor Notes</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-rose-200/80 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                  {viewingRequest.rejectionReason}
                </div>
                {viewingRequest.reviewedByName && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    Recorded by{" "}
                    <span className="font-semibold">
                      {viewingRequest.reviewedByName}
                    </span>
                    {viewingRequest.reviewedAt &&
                      ` on ${formatDateByPattern(
                        viewingRequest.reviewedAt,
                        "MMM dd, yyyy - hh:mm a",
                      )}`}
                  </p>
                )}
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingRequest;
                    setViewingRequest(null);
                    openEditRequestModal(target);
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Request
                </button>

                {/* Stage-dependent Actions */}
                {isPendingStatus(viewingRequest.status) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingRequest;
                        setViewingRequest(null);
                        setApproveRequest(target);
                        setApproveRoleId(target.requestedRoleId);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingRequest;
                        setViewingRequest(null);
                        setRejectRequest(target);
                        setRejectionReason("");
                        setRejectError("");
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE DETAILS VIEW MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      User Account Profile
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      #{viewingUser.userId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive hospital user credentials and authorization
                    status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  {viewingUser.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {viewingUser.fullName}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      @{viewingUser.username}
                    </span>
                    <span>•</span>
                    <a
                      href={`mailto:${viewingUser.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {viewingUser.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 text-right">
                {viewingUser.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Active Staff
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Inactive Account
                  </span>
                )}
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Assigned RBAC Role
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                    viewingUser.roleName,
                  )}`}
                >
                  <User className="w-3 h-3" />
                  {viewingUser.roleName}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Employee ID
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {viewingUser.employeeId || "None assigned"}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Phone Number
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  {viewingUser.phone
                    ? `📞 ${viewingUser.phone}`
                    : "No phone provided"}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Account Created
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {formatDateByPattern(
                    viewingUser.createdAt,
                    "MMM dd, yyyy - hh:mm a",
                  )}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 col-span-2">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Last Login Activity
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {viewingUser.lastLoginAt ? (
                    formatDateByPattern(
                      viewingUser.lastLoginAt,
                      "MMMM dd, yyyy - hh:mm a",
                    )
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">
                      Never logged in
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {/* Edit Account */}
                <button
                  type="button"
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
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
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Account
                </button>

                {/* Change Role */}
                <button
                  type="button"
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
                    setRoleChangeUser(u);
                    setTargetRoleId(u.roleId);
                  }}
                  className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <UserCog className="w-3.5 h-3.5" />
                  Change Role
                </button>

                {/* Activate / Deactivate Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
                    handleToggleStatus(u);
                  }}
                  className={`px-3.5 py-2 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 ${
                    viewingUser.isActive
                      ? "bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      : "bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {viewingUser.isActive ? (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Activate
                    </>
                  )}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
                    setDeletingUser(u);
                  }}
                  className="px-3 py-2 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold text-xs rounded-xl transition flex items-center gap-1"
                  title="Archive / Soft Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
