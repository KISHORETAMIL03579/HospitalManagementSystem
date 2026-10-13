import React from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Mail,
  Phone,
  Clock,
  Building2,
  ArrowLeft,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-8 py-7 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-5 h-5 text-blue-400" />
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
              CareFlow HMS Support Desk
            </span>
          </div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            Hospital Administration & IT Helpdesk
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Assistance for staff registration, clinical credentials, and account
            statuses.
          </p>
        </div>

        {/* Support Details */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Email Support
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  General Administration:{" "}
                  <a
                    href="mailto:support@careflow.com"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    support@careflow.com
                  </a>
                </p>
                <p className="text-xs text-slate-600">
                  IT / Security Officer:{" "}
                  <a
                    href="mailto:security@careflow.com"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    security@careflow.com
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Phone Helpdesk
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Clinical IT Support: +1 (800) 555-CARE (ext 204)
                </p>
                <p className="text-xs text-slate-600">
                  Hospital Administration: +1 (800) 555-0199
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Operating Hours
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Staff Onboarding Desk: Mon - Fri, 8:00 AM - 6:00 PM EST
                </p>
                <p className="text-xs text-slate-600">
                  Clinical Emergency IT: 24/7 Priority Hotline
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Physical Office
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  CareFlow Medical Center · Administration Building, 3rd Floor,
                  Wing B
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
