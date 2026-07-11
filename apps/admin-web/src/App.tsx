import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  CategoriesResponse,
  CategoryDto,
  CategoryInput,
  CitiesResponse,
  CityDto,
  CityInput,
  CountriesResponse,
  CountryDto,
  CountryInput,
} from '@apex-card/shared';
import { useTranslation } from 'react-i18next';

import { isSupabaseConfigured, supabase } from './lib/supabase';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000';

const emptyCountry: CountryInput = { name: '', code: '' };
const emptyCity: CityInput = { name: '', countryId: '' };
const emptyCategory: CategoryInput = { name: '', slug: '', icon: '' };

function App() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countries, setCountries] = useState<CountryDto[]>([]);
  const [cities, setCities] = useState<CityDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [countryForm, setCountryForm] = useState<CountryInput>(emptyCountry);
  const [cityForm, setCityForm] = useState<CityInput>(emptyCity);
  const [categoryForm, setCategoryForm] = useState<CategoryInput>(emptyCategory);
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const countryNameById = useMemo(
    () => new Map(countries.map((country) => [country.id, country.name])),
    [countries],
  );

  const request = async <T,>(path: string, options?: RequestInit): Promise<T> => {
    const url = `${apiBaseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        ...options,
      });
    } catch {
      throw new Error(
        t('errors.apiUnavailable', { url }),
      );
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(error?.message ?? t('errors.requestFailedAt', { url }));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [countryData, cityData, categoryData] = await Promise.all([
        request<CountriesResponse>('/api/admin/countries'),
        request<CitiesResponse>('/api/admin/cities'),
        request<CategoriesResponse>('/api/admin/categories'),
      ]);

      setCountries(countryData.countries);
      setCities(cityData.cities);
      setCategories(categoryData.categories);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('errors.loadAdminData'));
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (session) {
      void loadData();
    } else {
      setCountries([]);
      setCities([]);
      setCategories([]);
      setIsLoading(false);
    }
  }, [session]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      setMessage('');
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('errors.requestFailed'));
    }
  };

  const saveCountry = async (event: FormEvent) => {
    event.preventDefault();
    await runAction(async () => {
      const path = editingCountryId
        ? `/api/admin/countries/${editingCountryId}`
        : '/api/admin/countries';
      const method = editingCountryId ? 'PUT' : 'POST';

      await request(path, { method, body: JSON.stringify(countryForm) });
      setCountryForm(emptyCountry);
      setEditingCountryId(null);
      await loadData();
    });
  };

  const saveCity = async (event: FormEvent) => {
    event.preventDefault();
    await runAction(async () => {
      const path = editingCityId ? `/api/admin/cities/${editingCityId}` : '/api/admin/cities';
      const method = editingCityId ? 'PUT' : 'POST';

      await request(path, { method, body: JSON.stringify(cityForm) });
      setCityForm(emptyCity);
      setEditingCityId(null);
      await loadData();
    });
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    await runAction(async () => {
      const path = editingCategoryId
        ? `/api/admin/categories/${editingCategoryId}`
        : '/api/admin/categories';
      const method = editingCategoryId ? 'PUT' : 'POST';

      await request(path, { method, body: JSON.stringify(categoryForm) });
      setCategoryForm(emptyCategory);
      setEditingCategoryId(null);
      await loadData();
    });
  };

  const deleteRecord = async (path: string) => {
    await runAction(async () => {
      await request(path, { method: 'DELETE' });
      await loadData();
    });
  };

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
          : t('auth.loginFailed'),
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
    setMessage('');
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
    <main className="admin-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <h1>{t('admin.setupTitle')}</h1>
          <p className="api-base">{t('admin.apiBase', { url: apiBaseUrl })}</p>
          <p className="api-base">{t('auth.signedInAs', { email: session.user.email })}</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => void loadData()}>
            {t('common.refresh')}
          </button>
          <button type="button" onClick={() => void signOut()}>
            {t('auth.logout')}
          </button>
        </div>
      </header>

      {message ? <p className="status-message">{message}</p> : null}
      {isLoading ? <p className="muted">{t('records.loading')}</p> : null}

      <section className="section-grid">
        <section className="panel">
          <h2>{t('countries.title')}</h2>
          <form onSubmit={(event) => void saveCountry(event)} className="form-row">
            <input
              value={countryForm.name}
              onChange={(event) => setCountryForm({ ...countryForm, name: event.target.value })}
              placeholder={t('countries.namePlaceholder')}
              required
            />
            <input
              value={countryForm.code}
              onChange={(event) => setCountryForm({ ...countryForm, code: event.target.value })}
              placeholder={t('countries.codePlaceholder')}
              required
            />
            <button type="submit">{editingCountryId ? t('common.save') : t('common.add')}</button>
          </form>
          <DataList
            items={countries.map((country) => ({
              id: country.id,
              title: country.name,
              detail: country.code,
              onEdit: () => {
                setCountryForm({ name: country.name, code: country.code });
                setEditingCountryId(country.id);
              },
              onDelete: () => void deleteRecord(`/api/admin/countries/${country.id}`),
            }))}
          />
        </section>

        <section className="panel">
          <h2>{t('cities.title')}</h2>
          <form onSubmit={(event) => void saveCity(event)} className="form-row">
            <input
              value={cityForm.name}
              onChange={(event) => setCityForm({ ...cityForm, name: event.target.value })}
              placeholder={t('cities.namePlaceholder')}
              required
            />
            <select
              value={cityForm.countryId}
              onChange={(event) => setCityForm({ ...cityForm, countryId: event.target.value })}
              required
            >
              <option value="">{t('cities.countryPlaceholder')}</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={!countries.length}>
              {editingCityId ? t('common.save') : t('common.add')}
            </button>
          </form>
          <DataList
            items={cities.map((city) => ({
              id: city.id,
              title: city.name,
              detail: countryNameById.get(city.countryId) || t('records.noCountry'),
              onEdit: () => {
                setCityForm({ name: city.name, countryId: city.countryId });
                setEditingCityId(city.id);
              },
              onDelete: () => void deleteRecord(`/api/admin/cities/${city.id}`),
            }))}
          />
        </section>

        <section className="panel">
          <h2>{t('categories.title')}</h2>
          <form onSubmit={(event) => void saveCategory(event)} className="form-row">
            <input
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, name: event.target.value })
              }
              placeholder={t('categories.namePlaceholder')}
              required
            />
            <input
              value={categoryForm.slug}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, slug: event.target.value })
              }
              placeholder={t('categories.slugPlaceholder')}
              required
            />
            <input
              value={categoryForm.icon}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, icon: event.target.value })
              }
              placeholder={t('categories.iconPlaceholder')}
            />
            <button type="submit">{editingCategoryId ? t('common.save') : t('common.add')}</button>
          </form>
          <DataList
            items={categories.map((category) => ({
              id: category.id,
              title: category.name,
              detail: [category.slug, category.icon].filter(Boolean).join(' / '),
              onEdit: () => {
                setCategoryForm({
                  name: category.name,
                  slug: category.slug,
                  icon: category.icon || '',
                });
                setEditingCategoryId(category.id);
              },
              onDelete: () => void deleteRecord(`/api/admin/categories/${category.id}`),
            }))}
          />
        </section>
      </section>
    </main>
  );
}

function DataList({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    detail: string;
    onEdit: () => void;
    onDelete: () => void;
  }>;
}) {
  const { t } = useTranslation();

  if (!items.length) {
    return <p className="muted">{t('records.empty')}</p>;
  }

  return (
    <ul className="data-list">
      {items.map((item) => (
        <li key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </div>
          <div className="actions">
            <button type="button" onClick={item.onEdit}>
              {t('common.edit')}
            </button>
            <button type="button" className="danger" onClick={item.onDelete}>
              {t('common.delete')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default App;
