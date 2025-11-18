// Mock básico do React Router para testes
import React from 'react';

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Routes = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Route = ({ element }: { element: React.ReactNode }) => <>{element}</>;
export const Navigate = ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />;
export const Link = ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: any }) => (
  <a href={to} {...props}>{children}</a>
);
export const useNavigate = () => jest.fn();
export const useParams = () => ({});
export const useLocation = () => ({ pathname: '/', search: '', hash: '', state: null });
export const Outlet = () => <div data-testid="outlet" />;

