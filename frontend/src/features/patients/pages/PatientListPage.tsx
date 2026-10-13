import React from "react";
import { PatientTable } from "../components/PatientTable";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Users,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  ShieldAlert,
  CalendarPlus,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useMyPatientProfile } from "../hooks/usePatients";
import { PageHeader } from "../../../components/common/PageHeader";
import { calculateAge, formatDate } from "../../../lib/utils";
import { Gender } from "../types/patient.types";

export const PatientListPage: React.FC = () => {
  const { user } = useAuth();

  const roleLower = (user?.roleName || user?.role || "")
    .toString()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const isPatient =
    roleLower === "patient" || user?.hierarchyLevel === 20 || user?.role === 20;

  const {
    data: myProfile,
    isLoading: isProfileLoading,
    isError,
  } = useMyPatientProfile({ enabled: isPatient });

  const getGenderText = (gender: Gender | number) => {
    switch (gender) {
      case Gender.Male:
      case 1:
        return "Male";
      case Gender.Female:
      case 2:
        return "Female";
      case Gender.Other:
      case 3:
        return "Other";
      default:
        return "Unspecified";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPatient ? "My Health Profile" : "Patient Directory"}
        subtitle={
          isPatient
            ? "View your personal hospital registration, health record, and emergency details."
            : "Manage and view all registered hospital patients"
        }
        icon={isPatient ? UserCheck : Users}
        actions={
          !isPatient ? (
            <Link
              to="/patients/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </Link>
          ) : (
            <Link
              to="/appointments"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
          )
        }
      />

      {isPatient ? (
        <div className="space-y-6">
          {isProfileLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 animate-pulse">
              Loading your personal health profile...
            </div>
          ) : isError || !myProfile ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Patient Record Not Linked
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Your login account is active, but a clinical patient profile has
                not yet been connected. Please consult hospital reception to
                link your MRN.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Profile Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl text-white shadow-inner">
                    {myProfile.firstName?.[0]}
                    {myProfile.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{myProfile.fullName}</h2>
                    <div className="flex items-center gap-2 mt-1 text-blue-100 text-xs">
                      <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-semibold">
                        MRN: {myProfile.medicalRecordNumber}
                      </span>
                      <span>•</span>
                      <span>
                        {calculateAge(myProfile.dateOfBirth)} years old (
                        {getGenderText(myProfile.gender)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                    Active Patient
                  </span>
                </div>
              </div>

              {/* Patient Details Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Demographic & Vitals */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Demographic Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        <strong className="font-medium text-slate-900 dark:text-white">
                          Date of Birth:
                        </strong>{" "}
                        {formatDate(myProfile.dateOfBirth)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>
                        <strong className="font-medium text-slate-900 dark:text-white">
                          Blood Group:
                        </strong>{" "}
                        {myProfile.bloodGroup || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Contact Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{myProfile.phone || "No phone provided"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>{myProfile.email || "No email provided"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{myProfile.address || "No address on file"}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Emergency Contact
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {myProfile.emergencyContactName || "Not assigned"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{myProfile.emergencyContactPhone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical History Section */}
              {myProfile.medicalHistory && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Medical History & Notes
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {myProfile.medicalHistory}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <PatientTable />
      )}
    </div>
  );
};
