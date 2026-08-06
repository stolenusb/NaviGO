import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoUrl from '../../assets/images/logo.png';
import { getSessionDisplayName, getSessionRole } from '../../services/session';

export default function MainNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => typeof window !== 'undefined' && Boolean(localStorage.getItem('jwt'))
  );
  const [accountType, setAccountType] = useState(() => localStorage.getItem('accountType'));
  const [email, setEmail] = useState(() => localStorage.getItem('email') ?? '');

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('jwt')));
      setAccountType(localStorage.getItem('accountType'));
      setEmail(localStorage.getItem('email') ?? '');
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('auth-change', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('auth-change', syncFromStorage);
    };
  }, []);

  const role = useMemo(() => getSessionRole(), [accountType]);
  const displayName = getSessionDisplayName();
  const displayEmail = email || (localStorage.getItem('email') ?? '');
  const dashboardPath = role === 'partner' ? '/dashboard/partner' : role === 'admin' ? '/dashboard/admin' : '/dashboard/customer';
  const historyPath = role === 'customer' ? '/dashboard/customer/history' : role === 'partner' ? '/dashboard/partner/history' : dashboardPath;
  const profilePath = dashboardPath;

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') setProfileOpen(false);
  };

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-400 h-14 w-full bg-white" />

      <header
        className={`fixed inset-x-0 mx-auto flex h-14 w-full items-center justify-center rounded-lg border bg-white px-[4.2px] py-1.5 transition-all duration-300 md:py-2.5 lg:px-[11.2px] xl:px-[5.6px] z-500 ${
          scrolled
            ? 'top-0! md:top-[11.2px]! max-w-[51.2rem] border-gray-200/50 shadow-2xl shadow-black/5'
            : 'top-0 max-w-[57.6rem] border-transparent shadow-none'
        }`}
      >
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-2">
          <Link to="/" className="flex items-center gap-1">
            <img src={logoUrl} alt="NaviGO" className="h-12.5 w-auto" />
          </Link>

          <div ref={menuRef} className="relative flex items-center gap-1 overflow-visible z-600" onKeyDown={onMenuKeyDown}>
            {isLoggedIn ? (
              <>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-black hover:bg-gray-100" aria-label="Notifications">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                    <path d="M10 17a2 2 0 0 0 4 0" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 relative z-601]"
                  aria-label="Profile menu"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M12 12.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2c-4.1 0-7.5 2.5-7.5 5.6V21h15v-1.2c0-3.1-3.4-5.6-7.5-5.6Z" />
                  </svg>
                </button>

                {profileOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-1200 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] animate-[popoverIn_180ms_ease-out] origin-top-right pointer-events-auto"
                  >
                    <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-800">
                      <div className="font-medium">{displayName}</div>
                      <div className="truncate text-xs text-gray-500">{displayEmail}</div>
                    </div>
                    <Link to={profilePath} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
                      Dashboard
                    </Link>
                    <Link to={historyPath} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
                      History
                    </Link>
                    <Link to="/settings" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate('/logout')}
                      className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <Link to="/login" className="rounded-full border border-black px-2 py-0.5 text-sm font-medium text-black transition hover:bg-black hover:text-white">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}