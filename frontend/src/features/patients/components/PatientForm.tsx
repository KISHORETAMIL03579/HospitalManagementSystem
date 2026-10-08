import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatientSchema, CreatePatientFormValues } from '../schemas/patientSchema';
import { useCreatePatient } from '../hooks/useCreatePatient';
import { Gender } from '../types/patient.types';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PatientFormProps {
  onSuccess?: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ onSuccess }) => {
  const { mutateAsync, isPending, error, isSuccess } = useCreatePatient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePatientFormValues>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: Gender.Male,
      phone: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
  });

  const onSubmit = async (data: CreatePatientFormValues) => {
    try {
      await mutateAsync({
        ...data,
        gender: Number(data.gender) as Gender,
      });
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create patient:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Register New Patient</h2>
          <p className="text-sm text-slate-500">Enter patient demographics and emergency contact details</p>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Patient registered successfully with a new Medical Record Number (MRN)!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Registration failed. Please check the information provided and try again.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Details Section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Personal Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. John"
              />
              {errors.firstName && <p className="text-xs text-rose-500 mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. Doe"
              />
              {errors.lastName && <p className="text-xs text-rose-500 mt-1">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.dateOfBirth && <p className="text-xs text-rose-500 mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
              <select
                {...register('gender', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value={Gender.Male}>Male</option>
                <option value={Gender.Female}>Female</option>
                <option value={Gender.Other}>Other</option>
                <option value={Gender.Unspecified}>Unspecified</option>
              </select>
              {errors.gender && <p className="text-xs text-rose-500 mt-1">{errors.gender.message}</p>}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="john.doe@example.com"
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="123 Main St, Apt 4B, City, State"
              />
              {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
              <input
                type="text"
                {...register('emergencyContactName')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                {...register('emergencyContactPhone')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="+1 (555) 999-8888"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Complete Registration</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

