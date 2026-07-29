import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const logoUrl = '/src/assets/images/logo.png';

export default function MainNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userEmailVisible, setUserEmailVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
  const isLoggedIn = Boolean(token);
  const displayEmail = localStorage.getItem('email');

  useEffect(() => {
    setProfileOpen(false);
    setUserEmailVisible(false);
  }, [location.pathname]);

  useEffect(() => {
    setUserEmailVisible(profileOpen);
  }, [profileOpen]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between bg-white px-6 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="NaviGO" className="h-14 w-auto" />
          </Link>

          <Link
            to="/login"
            className="rounded-full border border-black px-4 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full overflow-visible bg-transparent backdrop-blur-0">
      <div className="mx-auto flex h-[72px] w-full max-w-[980px] items-center justify-between bg-white/95 px-4 shadow-[0_1px_0_rgba(0,0,0,0.08)] backdrop-blur sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoUrl} alt="NaviGO" className="h-12 w-auto" />
        </Link>

        <div ref={menuRef} className={`relative flex items-center overflow-visible transition-all duration-300 ${profileOpen ? 'gap-1 translate-x-[-72px]' : 'gap-1.5 translate-x-0'}`}>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-black hover:bg-gray-100" aria-label="Notifications">
            <span className="relative block h-5 w-5 rounded-t-full border-2 border-black border-b-0">
              <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-black" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800"
            aria-label="Profile menu"
          >
            <span className="block h-6 w-6 rounded-full bg-white" />
          </button>

          <span className={`max-w-48 truncate text-sm text-gray-800 transition-all duration-300 ease-out ${userEmailVisible ? 'ml-2 translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'}`}>
            {displayEmail}
          </span>

          {profileOpen ? (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <Link to="/profile" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                Profile
              </Link>
              <Link to="/history" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                History
              </Link>
              <Link to="/settings" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                Settings
              </Link>
              <button
                type="button"
                onClick={() => navigate('/logout')}
                className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}