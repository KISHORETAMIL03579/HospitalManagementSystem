import React from "react";
import { PhoneInput, PhoneInputProps } from "react-international-phone";
import "react-international-phone/style.css";

export interface PhoneNumberInputProps extends Omit<
  PhoneInputProps,
  "onChange"
> {
  value: string;
  onChange: (phone: string) => void;
  label?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  label = "Phone Number",
  error,
  id = "phone-input",
  disabled = false,
  required = false,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <PhoneInput
          defaultCountry="in"
          value={value}
          onChange={(phone) => onChange(phone)}
          disabled={disabled}
          inputProps={{
            id,
            name: id,
            required,
          }}
          className="w-full flex items-center"
          inputClassName="w-full !h-10 !px-3 !py-2 !text-sm !border !border-slate-300 dark:!border-slate-600 !rounded-r-lg !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white focus:!outline-none focus:!ring-2 focus:!ring-indigo-500 dark:focus:!ring-indigo-400"
          countrySelectorStyleProps={{
            buttonClassName:
              "!h-10 !px-3 !border !border-r-0 !border-slate-300 dark:!border-slate-600 !rounded-l-lg !bg-slate-50 dark:!bg-slate-700 hover:!bg-slate-100 dark:hover:!bg-slate-600 flex items-center justify-center",
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
};

export default PhoneNumberInput;
