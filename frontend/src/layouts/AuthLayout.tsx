import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
  cardClassName?: string;
};

const backgroundUrl = '/src/assets/images/background.jpg';
const logoUrl = '/src/assets/images/logo.png';

export default function AuthLayout({ children, cardClassName = '' }: AuthLayoutProps) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="grid min-h-screen w-full grid-cols-1 items-center justify-items-center px-4 py-8 lg:grid-cols-[minmax(0,1.15fr)_20rem] lg:px-12 lg:py-0 xl:grid-cols-[minmax(0,1.2fr)_20rem] xl:px-16">
        <div className="hidden lg:flex lg:items-center lg:justify-start lg:-ml-40 xl:-ml-60 2xl:-ml-80">
          <img src={logoUrl} alt="NaviGO" className="h-80 w-auto object-contain xl:h-96" />
        </div>

        <div
          className={`justify-self-center w-full max-w-88 rounded-[1.1rem] bg-white px-8 py-10 shadow-[8px_8px_0_rgba(0,0,0,0.22)] sm:px-8 sm:py-10 lg:ml-8 lg:justify-self-start lg:max-w-[20rem] lg:px-7 lg:py-9 xl:ml-0 xl:max-w-84 ${cardClassName}`}
        >
          <div className="mb-6 flex justify-center lg:hidden">
            <img src={logoUrl} alt="NaviGO" className="h-20 w-auto object-contain" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}