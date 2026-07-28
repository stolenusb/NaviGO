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
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="grid min-h-screen grid-cols-1 items-center px-6 py-6 lg:grid-cols-[1fr_30rem] lg:px-16 xl:grid-cols-[1fr_34rem] xl:px-24">
        <div className="hidden lg:flex lg:items-center lg:justify-center">
          <img src={logoUrl} alt="NaviGO" className="h-[30rem] w-auto object-contain xl:h-[34rem]" />
        </div>

        <div
          className={`justify-self-end w-full max-w-[34rem] rounded-[2rem] bg-white px-8 py-10 shadow-[10px_10px_0_rgba(0,0,0,0.35)] sm:px-10 sm:py-12 ${cardClassName}`}
        >
          <div className="mb-6 flex justify-start lg:hidden">
            <img src={logoUrl} alt="NaviGO" className="h-24 w-auto object-contain" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}