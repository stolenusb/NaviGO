import type { AnchorHTMLAttributes } from 'react';

type AuthLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export default function AuthLink({ className = '', ...props }: AuthLinkProps) {
  return <a {...props} className={`text-base text-black underline ${className}`} />;
}