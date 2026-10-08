import React from "react";
import { PatientForm } from "../components/PatientForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const PatientCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate("/patients")}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </button>
      </div>

      <PatientForm
        onSuccess={() => setTimeout(() => navigate("/patients"), 1500)}
      />
    </div>
  );
};
