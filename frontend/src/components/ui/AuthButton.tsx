import type { ButtonHTMLAttributes } from 'react';

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function AuthButton({ className = '', ...props }: AuthButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-[0.55rem] bg-[#1f1f1f] px-4 py-3 text-[0.95rem] font-normal text-white transition hover:bg-black ${className}`}
    />
  );
}