import { useEffect, useMemo, useState } from 'react';
import keycloak from './keycloak.js';
import './styles.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState('');

  const redirectUri = useMemo(() => window.location.origin + window.location.pathname, []);

  const profileFields = useMemo(() => {
    if (!userDetails) return [];
    return Object.entries(userDetails)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => ({ key, value }));
  }, [userDetails]);

  useEffect(() => {
    let isMounted = true;

    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        redirectUri,
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`
      })
      .then(async (authenticated) => {
        if (!isMounted) return;
        setIsAuthenticated(authenticated);

        if (authenticated) {
          try {
            const profile = await keycloak.loadUserProfile();
            if (!isMounted) return;
            setUserDetails({
              username: profile.username,
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              id: profile.id,
              realmRoles: keycloak.realmAccess?.roles,
              clientRoles: keycloak.resourceAccess?.[keycloak.clientId]?.roles
            });
          } catch (profileError) {
            setError(profileError.message || 'Failed to load user profile.');
          }
        }
      })
      .catch((initError) => {
        if (!isMounted) return;
        setError(initError?.message || 'Keycloak initialization failed.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const refreshInterval = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(30).catch(() => {
          keycloak.login();
        });
      }
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [redirectUri]);

  const handleLogin = () => {
    setError('');
    keycloak.login({ redirectUri });
  };

  if (isLoading) {
    return (
      <main className="app">
        <h1>Keycloak Login</h1>
        <p className="status">Checking authentication status...</p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Keycloak Login</h1>
      {error && <p className="error">{error}</p>}

      {isAuthenticated ? (
        <section className="card">
          <p className="success">Logged in</p>
          <h2>User details</h2>
          {profileFields.length === 0 ? (
            <p>No user details available.</p>
          ) : (
            <ul className="details">
              {profileFields.map(({ key, value }) => (
                <li key={key}>
                  <strong>{key}</strong>: {Array.isArray(value) ? value.join(', ') : value}
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="button secondary" onClick={() => keycloak.logout()}>
            Log out
          </button>
        </section>
      ) : (
        <section className="card">
          <p className="status">You are not logged in.</p>
          <button type="button" className="button" onClick={handleLogin}>
            Log in with Keycloak
          </button>
        </section>
      )}
    </main>
  );
}

export default App;
