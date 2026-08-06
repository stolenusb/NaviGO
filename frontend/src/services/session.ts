export type SessionUser = {
  email: string;
  accountType: 'customer' | 'partner' | 'admin' | string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  roles?: string[];
};

export function getSessionUser(): SessionUser | null {
  const jwt = localStorage.getItem('jwt');
  const email = localStorage.getItem('email') ?? '';

  if (!jwt || !email) {
    return null;
  }

  return {
    email,
    accountType: (localStorage.getItem('accountType') ?? 'customer') as SessionUser['accountType'],
    firstName: localStorage.getItem('firstName') ?? undefined,
    lastName: localStorage.getItem('lastName') ?? undefined,
    companyName: localStorage.getItem('companyName') ?? undefined,
  };
}

export function getSessionRole(): 'customer' | 'partner' | 'admin' {
  const accountType = localStorage.getItem('accountType');

  if (accountType === 'partner') return 'partner';
  if (accountType === 'admin') return 'admin';
  return 'customer';
}

export function getSessionDisplayName(): string {
  const accountType = getSessionRole();
  const firstName = localStorage.getItem('firstName') ?? '';
  const lastName = localStorage.getItem('lastName') ?? '';
  const companyName = localStorage.getItem('companyName') ?? '';

  if (accountType === 'partner') {
    return companyName || 'Partner';
  }

  return `${firstName} ${lastName}`.trim() || localStorage.getItem('email') || 'User';
}