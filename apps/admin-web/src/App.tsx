import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';

import { isSupabaseConfigured, supabase } from './lib/supabase';
import AdminLayout from './layouts/AdminLayout';
import CategoriesPage from './pages/CategoriesPage';
import CitiesPage from './pages/CitiesPage';
import CountriesPage from './pages/CountriesPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import PartnerCreatePage from './pages/PartnerCreatePage';
import PartnerDetailsPage from './pages/PartnerDetailsPage';
import PartnersPage from './pages/PartnersPage';
import PlaceholderPage from './pages/PlaceholderPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsSessionLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();

    if (!supabase) {
      setAuthMessage(t('auth.configMissing'));
      return;
    }

    setIsSigningIn(true);
    setAuthMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const debugDetails = {
        code: 'code' in error ? error.code : undefined,
        message: error.message,
        name: error.name,
        status: error.status,
      };

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Supabase sign-in failed', debugDetails);
      }

      setAuthMessage(
        import.meta.env.DEV
          ? t('auth.loginFailedWithDetails', {
              code: debugDetails.code || 'unknown',
              message: debugDetails.message,
              status: debugDetails.status || 'unknown',
            })
          : t('auth.loginFailed')
      );
    } else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('Supabase sign-in succeeded', {
        hasSession: Boolean(data.session),
        userId: data.user?.id,
      });
    }

    setIsSigningIn(false);
  };

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
  };

  if (isSessionLoading) {
    return (
      <main className="admin-shell">
        <p className="muted">{t('auth.restoringSession')}</p>
      </main>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="admin-shell auth-shell">
        <section className="auth-panel">
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <h1>{t('auth.loginTitle')}</h1>
          <p className="status-message">{t('auth.configMissing')}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-shell auth-shell">
        <section className="auth-panel">
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <h1>{t('auth.loginTitle')}</h1>
          <p className="muted">{t('auth.loginIntro')}</p>

          <form onSubmit={(event) => void signIn(event)} className="auth-form">
            <label>
              <span>{t('auth.email')}</span>
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>{t('auth.password')}</span>
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={isSigningIn}>
              {isSigningIn ? t('auth.signingIn') : t('auth.login')}
            </button>
          </form>

          {authMessage ? <p className="status-message">{authMessage}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminLayout adminEmail={session.user.email ?? ''} onSignOut={() => void signOut()} />
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="members" element={<MembersPage session={session} />} />
          <Route path="partners" element={<PartnersPage session={session} />} />
          <Route path="partners/new" element={<PartnerCreatePage session={session} />} />
          <Route path="partners/:id" element={<PartnerDetailsPage session={session} />} />
          <Route path="discounts" element={<PlaceholderPage titleKey="nav.discounts" />} />
          <Route path="content" element={<PlaceholderPage titleKey="nav.content" />} />
          <Route
            path="content/home-banners"
            element={<PlaceholderPage titleKey="nav.contentHomeBanners" />}
          />
          <Route
            path="content/promotions"
            element={<PlaceholderPage titleKey="nav.contentPromotions" />}
          />
          <Route path="locations" element={<Navigate to="/admin/locations/countries" replace />} />
          <Route path="locations/countries" element={<CountriesPage session={session} />} />
          <Route path="locations/cities" element={<CitiesPage session={session} />} />
          <Route path="locations/categories" element={<CategoriesPage session={session} />} />
          <Route path="analytics" element={<PlaceholderPage titleKey="nav.analytics" />} />
          <Route
            path="administration"
            element={<PlaceholderPage titleKey="nav.administration" />}
          />
          <Route
            path="administration/administrators"
            element={<PlaceholderPage titleKey="nav.administrators" />}
          />
          <Route path="administration/roles" element={<PlaceholderPage titleKey="nav.roles" />} />
          <Route
            path="administration/permissions"
            element={<PlaceholderPage titleKey="nav.permissions" />}
          />
          <Route path="settings" element={<SettingsPage session={session} />} />
          <Route path="reviews" element={<PlaceholderPage titleKey="nav.reviews" />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
