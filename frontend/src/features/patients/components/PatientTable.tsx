import React, { useState } from 'react';
import { usePatients } from '../hooks/usePatients';
import { formatDate, calculateAge } from '../../../lib/utils';
import { Gender } from '../types/patient.types';
import { Search, ChevronLeft, ChevronRight, Phone, FileText } from 'lucide-react';

export const PatientTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError } = usePatients(searchTerm, page, pageSize);

  const getGenderBadge = (gender: Gender) => {
    switch (gender) {
      case Gender.Male:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">Male</span>;
      case Gender.Female:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">Female</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Other</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by MRN, Name or Phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>

        <div className="text-xs font-medium text-slate-500">
          {data ? `Showing ${data.items.length} of ${data.totalCount} patients` : 'Loading patients...'}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">MRN</th>
              <th className="px-6 py-3.5">Patient Name</th>
              <th className="px-6 py-3.5">DOB / Age</th>
              <th className="px-6 py-3.5">Gender</th>
              <th className="px-6 py-3.5">Contact Phone</th>
              <th className="px-6 py-3.5">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-rose-500">
                  Failed to load patient directory. Please check backend connection.
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-slate-600">No patients registered yet</p>
                  <p className="text-xs text-slate-400">Use the registration form above to create the first patient record.</p>
                </td>
              </tr>
            ) : (
              data?.items.map((patient) => (
                <tr key={patient.patientId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-600">
                    {patient.medicalRecordNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{patient.fullName}</div>
                        {patient.email && <div className="text-xs text-slate-400">{patient.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700">{formatDate(patient.dateOfBirth)}</div>
                    <div className="text-xs text-slate-400">{calculateAge(patient.dateOfBirth)} yrs old</div>
                  </td>
                  <td className="px-6 py-4">
                    {getGenderBadge(patient.gender)}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{patient.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {formatDate(patient.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-sm">
          <div className="text-xs text-slate-500">
            Page {data.page} of {data.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
