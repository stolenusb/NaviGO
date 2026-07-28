import type { AnchorHTMLAttributes } from 'react';

type AuthLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export default function AuthLink({ className = '', ...props }: AuthLinkProps) {
  return <a {...props} className={`text-[0.95rem] text-[#222] underline underline-offset-4 ${className}`} />;
}