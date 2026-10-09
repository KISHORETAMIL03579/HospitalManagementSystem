import React, { useState, useMemo } from "react";
import {
  useDoctors,
  useDepartments,
  useCreateDoctor,
} from "../hooks/useDoctors";
import { DoctorDto } from "../types/doctor.types";
import { formatCurrency } from "../../../lib/utils";
import {
  UserCheck,
  Plus,
  Stethoscope,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Building,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
} from "lucide-react";
import { PhoneNumberInput } from "../../../components/common/PhoneNumberInput";

export const DoctorListPage: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<
    number | undefined
  >(undefined);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<
    "fullName" | "specialization" | "consultationFee"
  >("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDto | null>(null);

  const { data: doctors, isLoading: isDoctorsLoading } =
    useDoctors(selectedDepartment);
  const { data: departments } = useDepartments();
  const createDoctorMutation = useCreateDoctor();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    specialization: "",
    licenseNumber: "",
    departmentId: 0,
    consultationFee: 150,
    phone: "",
    email: "",
    availableDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
    startTime: "09:00:00",
    endTime: "17:00:00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) return;

    await createDoctorMutation.mutateAsync({
      ...formData,
      departmentId: Number(formData.departmentId),
      consultationFee: Number(formData.consultationFee),
    });

    setIsModalOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      specialization: "",
      licenseNumber: "",
      departmentId: 0,
      consultationFee: 150,
      phone: "",
      email: "",
      availableDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
      startTime: "09:00:00",
      endTime: "17:00:00",
    });
  };

  const filteredAndSortedDoctors = useMemo(() => {
    if (!doctors) return [];

    let result = [...doctors];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.fullName.toLowerCase().includes(term) ||
          doc.specialization.toLowerCase().includes(term) ||
          doc.departmentName.toLowerCase().includes(term) ||
          doc.licenseNumber.toLowerCase().includes(term),
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [doctors, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedDoctors.length / pageSize) || 1;
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedDoctors.slice(start, start + pageSize);
  }, [filteredAndSortedDoctors, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-indigo-600" />
            Medical Staff & Specialists
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage hospital doctors, department assignments, and consultation
            schedules.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-5 h-5" />
          Add New Doctor
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor by name, specialization, or license..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort By:</span>
            </div>
            <select
              value={sortField}
              onChange={(e) =>
                setSortField(
                  e.target.value as
                    "fullName" | "specialization" | "consultationFee",
                )
              }
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600 bg-white"
            >
              <option value="fullName">Doctor Name</option>
              <option value="specialization">Specialization</option>
              <option value="consultationFee">Consultation Fee</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              setSelectedDepartment(undefined);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              selectedDepartment === undefined
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Departments
          </button>
          {departments?.map((dept) => (
            <button
              key={dept.departmentId}
              onClick={() => {
                setSelectedDepartment(dept.departmentId);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedDepartment === dept.departmentId
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {isDoctorsLoading ? (
        <div className="p-12 text-center text-slate-500">
          Loading doctors...
        </div>
      ) : filteredAndSortedDoctors.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-xl">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">
            No doctors found
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Try adjusting your search query or department filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDoctors.map((doc) => (
              <div
                key={doc.doctorId}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition space-y-4 cursor-pointer hover:border-indigo-300"
                onClick={() => setSelectedDoctor(doc)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {doc.fullName}
                    </h3>
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full mt-1">
                      {doc.specialization}
                    </span>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">
                    {doc.licenseNumber}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{doc.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{doc.phone}</span>
                  </div>
                  {doc.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{doc.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {doc.startTime.substring(0, 5)} -{" "}
                      {doc.endTime.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>
                      {formatCurrency(doc.consultationFee)} consultation fee
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="bg-white px-6 py-3.5 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
            <div className="text-xs text-slate-500">
              Showing {paginatedDoctors.length} of{" "}
              {filteredAndSortedDoctors.length} doctors (Page {currentPage} of{" "}
              {totalPages})
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800">
              Register New Doctor
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiologist"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DOC-XXXX"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Department
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentId: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
                >
                  <option value={0}>Select Department...</option>
                  {departments?.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <PhoneNumberInput
                    id="doctor-phone"
                    label="Phone"
                    required
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Consultation Fee
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.consultationFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consultationFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createDoctorMutation.isPending ? "Saving..." : "Save Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider font-mono">
                  License: {selectedDoctor.licenseNumber}
                </span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                  <Stethoscope className="w-5 h-5 text-indigo-600" />
                  {selectedDoctor.fullName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-1">
                <div className="font-semibold text-indigo-900 text-base">
                  {selectedDoctor.specialization} Specialist
                </div>
                <div className="text-xs text-indigo-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Department: {selectedDoctor.departmentName}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Phone: {selectedDoctor.phone}</span>
                </div>
                {selectedDoctor.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email: {selectedDoctor.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    Consultation Hours:{" "}
                    {selectedDoctor.startTime.substring(0, 5)} -{" "}
                    {selectedDoctor.endTime.substring(0, 5)}
                  </span>
                </div>
                {selectedDoctor.availableDays && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Available Days: {selectedDoctor.availableDays}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-800 font-semibold pt-2 border-t border-slate-100">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>
                    Consultation Fee:{" "}
                    {formatCurrency(selectedDoctor.consultationFee)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Close Doctor Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
