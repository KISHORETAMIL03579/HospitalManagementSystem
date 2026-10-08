import React, { useState } from "react";
import {
  useDoctors,
  useDepartments,
  useCreateDoctor,
} from "../hooks/useDoctors";
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
} from "lucide-react";

export const DoctorListPage: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<
    number | undefined
  >(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      {/* Department Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setSelectedDepartment(undefined)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
            selectedDepartment === undefined
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Departments
        </button>
        {departments?.map((dept) => (
          <button
            key={dept.departmentId}
            onClick={() => setSelectedDepartment(dept.departmentId)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              selectedDepartment === dept.departmentId
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      {isDoctorsLoading ? (
        <div className="p-12 text-center text-slate-500">
          Loading doctors...
        </div>
      ) : doctors?.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-xl">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">
            No doctors found
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Try selecting another department or add a new doctor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors?.map((doc) => (
            <div
              key={doc.doctorId}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition space-y-4"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
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
    </div>
  );
};
