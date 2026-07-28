import { useState } from 'react';

type AuthFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  autoComplete?: string;
  required?: boolean;
  as?: 'input' | 'textarea';
  rows?: number;
};

export default function AuthField({
  label,
  type = 'text',
  placeholder,
  name,
  value,
  onChange,
  autoComplete,
  required = true,
  as = 'input',
  rows = 4,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  const EyeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 16a3 3 0 0 0 2.7-1.7" />
      <path d="M6.5 6.7C4.1 8.2 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.4 0 2.6-.2 3.7-.6" />
      <path d="M9.6 4.8A10.8 10.8 0 0 1 12 4.5C18.5 4.5 22 11 22 11s-.9 1.6-2.5 3.3" />
    </svg>
  );

  return (
    <label className="block space-y-2 text-left">
      <span className="block text-[0.95rem] font-normal leading-none text-[#222]">{label}</span>
      <div className="relative">
        {as === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className="w-full resize-y rounded-[0.55rem] border border-black/10 px-4 py-3 text-[0.95rem] text-[#111827] outline-none transition placeholder:text-black/25 focus:border-black/30"
          />
        ) : (
          <input
            type={inputType}
            name={name}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            placeholder={placeholder}
            required={required}
            className="w-full rounded-[0.55rem] border border-black/10 px-4 py-3 pr-12 text-[0.95rem] text-[#111827] outline-none transition placeholder:text-black/25 focus:border-black/30"
          />
        )}
        {isPasswordField && as === 'input' ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-black/55 transition hover:text-black"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </span>
          </button>
        ) : null}
      </div>
    </label>
  );
}