import React from "react";
import { PatientTable } from "../components/PatientTable";
import { Link } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";

export const PatientListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            <span>Patient Directory</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and view all registered hospital patients
          </p>
        </div>

        <Link
          to="/patients/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Patient</span>
        </Link>
      </div>

      <PatientTable />
    </div>
  );
};
