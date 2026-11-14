// M0 shell: proves the entry, the flag, the API round trip, i18n and theming. No member data.
// The browser never computes roles: it shows the capability /api/mozora/me returns (brief section 4).
import { useEffect, useState } from 'react';
import { currentLanguage, translate, type MessageKey } from './i18n';

type Me = { userId: string; name: string | null; capability: 'member' | 'trainer' | 'fullAdmin' };
type State =
  | { kind: 'disabled' }
  | { kind: 'loading' }
  | { kind: 'signedOut' }
  | { kind: 'unavailable' }
  | { kind: 'signedIn'; me: Me };

const FLAG_ON = import.meta.env.VITE_MOZORA_ENABLED === '1';

function hostToken(): string | null {
  try {
    const raw = localStorage.getItem('mokza_auth_token');
    const parsed = raw ? (JSON.parse(raw) as { token?: unknown }) : null;
    return parsed && typeof parsed.token === 'string' ? parsed.token : null;
  } catch {
    return null;
  }
}

export function App() {
  const lang = currentLanguage();
  const t = (key: MessageKey, params?: Record<string, string>) => translate(lang, key, params);
  const [state, setState] = useState<State>(FLAG_ON ? { kind: 'loading' } : { kind: 'disabled' });

  useEffect(() => {
    document.documentElement.lang = lang === 'fr' ? 'fr-CA' : 'en-CA';
    if (!FLAG_ON) return;
    const token = hostToken();
    if (!token) {
      setState({ kind: 'signedOut' });
      return;
    }
    let cancelled = false;
    fetch('/api/mozora/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return setState({ kind: 'signedOut' });
        if (!res.ok) return setState({ kind: 'unavailable' });
        setState({ kind: 'signedIn', me: (await res.json()) as Me });
      })
      .catch(() => !cancelled && setState({ kind: 'unavailable' }));
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <main className="mz-shell" aria-live="polite">
      <header className="mz-header">
        <h1>{t('app.title')}</h1>
        <p>{t('app.tagline')}</p>
      </header>
      <section className="mz-card" data-state={state.kind}>
        {state.kind === 'disabled' && <p>{t('app.disabled')}</p>}
        {state.kind === 'loading' && <p>{t('status.loading')}</p>}
        {state.kind === 'signedOut' && <p>{t('status.signedOut')}</p>}
        {state.kind === 'unavailable' && <p role="alert">{t('status.unavailable')}</p>}
        {state.kind === 'signedIn' && (
          <>
            <p>{t('status.signedIn', { name: state.me.name ?? state.me.userId })}</p>
            <p>{t('capability.label', { capability: t(`capability.${state.me.capability}`) })}</p>
            <p className="mz-muted">{t('shell.empty')}</p>
          </>
        )}
      </section>
      <a className="mz-link" href="/">
        {t('action.backToSite')}
      </a>
    </main>
  );
}
