# Keycloak Login React App

A minimal React + Vite frontend that authenticates users with Keycloak over OIDC. It checks if the user is already logged in, shows a "Log in with Keycloak" button when not authenticated, and displays a success message plus user details after login.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Provide your Keycloak settings. Create a `.env` file in the project root (or export the variables) with:

   ```bash
   VITE_KEYCLOAK_URL=https://your-keycloak-domain
   VITE_KEYCLOAK_REALM=your-realm
   VITE_KEYCLOAK_CLIENT_ID=your-client-id
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   The app listens on port `5173` by default.

## How it works

- On load, the app calls `keycloak.init` with `check-sso` to detect existing sessions without forcing a redirect.
- If authenticated, it fetches the user profile and shows key fields (username, name, email, roles).
- If not authenticated, it renders a **Log in with Keycloak** button to start the OIDC flow.
- Tokens are refreshed automatically while the session is active; a logout button is also provided.
