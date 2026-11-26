'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@shared/contracts';
import { apiFetch } from '@/lib/api';
import { Currency, Lang } from '@/lib/i18n';

export type RouteId =
  | 'landing'
  | 'inventory'
  | 'live-room'
  | 'schedule'
  | 'inspector'
  | 'reports'
  | 'admin';

const ROUTE_TO_PATH: Record<RouteId, string> = {
  landing: '/',
  inventory: '/inventory',
  'live-room': '/live-room',
  schedule: '/schedule',
  inspector: '/inspector',
  reports: '/reports',
  admin: '/admin',
};

function pathToRoute(pathname: string): RouteId {
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/live-room')) return 'live-room';
  if (pathname.startsWith('/schedule')) return 'schedule';
  if (pathname.startsWith('/inspector')) return 'inspector';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'landing';
}

export interface DemoAccountSummary {
  id: string;
  email: string;
  fullName: string;
  role: User['role'];
  tenantId: string;
  tenantName: string;
  avatarInitials: string;
}

interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

interface AppContextValue {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  accounts: DemoAccountSummary[];
  route: RouteId;
  activeAuctionId: string;
  scheduleVehicleId: string | null;
  lang: Lang;
  currency: Currency;
  exchangeRate: number;
  darkMode: boolean;
  toasts: ToastMessage[];
  setRoute: (r: RouteId) => void;
  setActiveAuctionId: (id: string) => void;
  setScheduleVehicleId: (id: string | null) => void;
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  toggleDarkMode: () => void;
  switchPersona: (userId: string, targetRoute?: RouteId) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
  pushToast: (title: string, detail?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  dataVersion: number;
  bumpDataVersion: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname() ?? '/';

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<DemoAccountSummary[]>([]);
  const [activeAuctionId, setActiveAuctionId] = useState<string>('auc-bmw-320d');
  const [scheduleVehicleId, setScheduleVehicleId] = useState<string | null>('veh-qashqai');
  const [lang, setLang] = useState<Lang>('en');
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [exchangeRate, setExchangeRate] = useState<number>(44.2);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dataVersion, setDataVersion] = useState<number>(0);

  const route = pathToRoute(pathname);

  const setRoute = useCallback(
    (r: RouteId) => {
      router.push(ROUTE_TO_PATH[r]);
    },
    [router]
  );

  const pushToast = useCallback(
    (title: string, detail?: string, tone: ToastMessage['tone'] = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [{ id, title, detail, tone }, ...prev].slice(0, 4));
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const bumpDataVersion = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  // Hydrate persisted JWT session on client mount
  useEffect(() => {
    try {
      const savedToken = window.localStorage.getItem('drivehub_token');
      const savedUser = window.localStorage.getItem('drivehub_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as User);
      }
    } catch {
      // ignore storage errors
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    apiFetch<{ accounts: DemoAccountSummary[]; exchangeRateGbpToTry: number }>('/api/demo/accounts')
      .then((res) => {
        setAccounts(res.accounts);
        setExchangeRate(res.exchangeRateGbpToTry);
      })
      .catch(() => {
        // Backend starting up
      });
  }, []);

  const persistSession = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    try {
      window.localStorage.setItem('drivehub_token', newToken);
      window.localStorage.setItem('drivehub_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
  };

  const switchPersona = useCallback(
    async (userId: string, targetRoute?: RouteId) => {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/demo-switch', {
        method: 'POST',
        body: { userId },
      });
      persistSession(res.token, res.user);
      if (targetRoute) {
        setRoute(targetRoute);
      } else {
        if (res.user.role === 'DEALER') setRoute('live-room');
        else if (res.user.role === 'INSPECTOR') setRoute('inspector');
        else if (res.user.role === 'PLATFORM_ADMIN') setRoute('admin');
        else setRoute('inventory');
      }
      bumpDataVersion();
      pushToast(
        `${res.user.fullName} · ${res.user.role.replace('_', ' ')}`,
        `Laravel JWT issued for ${res.user.tenantName}`,
        'success'
      );
    },
    [bumpDataVersion, pushToast, setRoute]
  );

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      persistSession(res.token, res.user);
      if (res.user.role === 'DEALER') setRoute('live-room');
      else if (res.user.role === 'INSPECTOR') setRoute('inspector');
      else if (res.user.role === 'PLATFORM_ADMIN') setRoute('admin');
      else setRoute('inventory');
      bumpDataVersion();
      pushToast(`Welcome back, ${res.user.fullName}`, res.user.tenantName, 'success');
    },
    [bumpDataVersion, pushToast, setRoute]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      window.localStorage.removeItem('drivehub_token');
      window.localStorage.removeItem('drivehub_user');
    } catch {
      // ignore
    }
    setRoute('landing');
    pushToast('Signed out', 'Session cleared', 'info');
  }, [pushToast, setRoute]);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        hydrated,
        accounts,
        route,
        activeAuctionId,
        scheduleVehicleId,
        lang,
        currency,
        exchangeRate,
        darkMode,
        toasts,
        setRoute,
        setActiveAuctionId,
        setScheduleVehicleId,
        setLang,
        setCurrency,
        toggleDarkMode: () => setDarkMode((d) => !d),
        switchPersona,
        loginWithCredentials,
        logout,
        pushToast,
        dismissToast,
        dataVersion,
        bumpDataVersion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
