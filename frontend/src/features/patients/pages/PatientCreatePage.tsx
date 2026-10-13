import React, { useEffect } from "react";
import { PatientForm } from "../components/PatientForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

export const PatientCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const roleLower = (user?.roleName || user?.role || "")
    .toString()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const isPatient =
    roleLower === "patient" || user?.hierarchyLevel === 20 || user?.role === 20;

  useEffect(() => {
    if (isPatient) {
      navigate("/patients", { replace: true });
    }
  }, [isPatient, navigate]);

  if (isPatient) return null;

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
