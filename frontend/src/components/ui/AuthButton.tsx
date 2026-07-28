import type { ButtonHTMLAttributes } from 'react';

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function AuthButton({ className = '', ...props }: AuthButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-lg bg-black px-4 py-3 text-lg font-normal text-white transition hover:bg-black/90 ${className}`}
    />
  );
}