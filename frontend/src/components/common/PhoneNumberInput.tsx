import React, { useEffect, useState } from "react";
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
  helperText?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  label = "Phone Number",
  error,
  helperText,
  id = "phone-input",
  disabled = false,
  required = false,
  ...props
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const errorId = error ? `${id}-error` : undefined;
  const helperId = !error && helperText ? `${id}-helper` : undefined;
  const describedBy = errorId || helperId;

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
        {isClient ? (
          <PhoneInput
            defaultCountry="in"
            value={value}
            onChange={(phone) => onChange(phone)}
            disabled={disabled}
            inputProps={{
              id,
              name: id,
              required,
              "aria-required": required,
              "aria-invalid": !!error,
              "aria-describedby": describedBy,
            }}
            className="w-full flex items-center"
            inputClassName="w-full !h-10 !px-3 !py-2 !text-sm !border !border-slate-300 dark:!border-slate-600 !rounded-r-lg !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white focus:!outline-none focus:!ring-2 focus:!ring-indigo-500 dark:focus:!ring-indigo-400"
            countrySelectorStyleProps={{
              buttonClassName:
                "!h-10 !px-3 !border !border-r-0 !border-slate-300 dark:!border-slate-600 !rounded-l-lg !bg-slate-50 dark:!bg-slate-700 hover:!bg-slate-100 dark:hover:!bg-slate-600 flex items-center justify-center",
            }}
            {...props}
          />
        ) : (
          <input
            type="tel"
            id={id}
            name={id}
            value={value}
            disabled={disabled}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-10 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="mt-1 text-xs text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          className="mt-1 text-xs text-slate-500 dark:text-slate-400"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default PhoneNumberInput;
