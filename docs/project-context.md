# Apex Card Project Context

## Internationalisation Strategy

Apex Card supports English and Portuguese for the initial multilingual foundation.

English is always the fallback language. Additional languages should be added by extending the same locale folder structure and key naming convention.

### Translation Library

The frontend apps use:

- `i18next`
- `react-i18next`

Admin Web also uses browser APIs for language detection and persistence. Mobile uses Expo device locale APIs and AsyncStorage.

### Folder Structure

Admin Web translations live in:

```text
apps/admin-web/src/locales/en.json
apps/admin-web/src/locales/pt.json
apps/admin-web/src/i18n/index.ts
```

Mobile translations live in:

```text
apps/mobile/src/locales/en.json
apps/mobile/src/locales/pt.json
apps/mobile/src/i18n/index.ts
```

### Language Detection

Both apps follow this priority:

1. Saved user preference.
2. Device or browser language.
3. English fallback.

Admin Web stores the selected language in `localStorage` using `apex.language`.

Mobile stores the selected language in AsyncStorage using `apex.language`.

### Key Naming

Use namespaced translation keys consistently across apps:

```text
common.save
common.cancel
common.delete
common.edit
auth.login
auth.logout
auth.email
auth.password
dashboard.title
countries.title
countries.add
cities.title
partners.title
benefits.title
settings.language
subscription.title
```

### Adding Translations

When adding new user-facing UI:

1. Add the English key to `en.json`.
2. Add the Portuguese key to `pt.json`.
3. Use `useTranslation()` and `t('namespace.key')` in components.
4. Keep key names stable and descriptive.
5. Do not hardcode new user-facing strings in components.

Do not add database translation fields one by one. Multilingual database content should be handled in a planned schema migration after the MVP data model settles.
