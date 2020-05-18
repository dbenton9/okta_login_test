import * as React from "react";
import { useState, useEffect } from "react";
import "./styles.css";
import OktaAuth from "@okta/okta-auth-js";

const authClient = new OktaAuth({
  issuer: "https://dev1-signon.okta.com/oauth2/default",
  clientId: "0oa3bkyab2pbnRpMb4x6",
  pkce: true,
  tokenManager: {
    secure: true,
  },
});

const TokenContainer = ({ children }: { children: string }) => (
  <pre
    style={{
      maxWidth: "100%",
      overflow: "auto",
      backgroundColor: "lightgray",
      padding: 10,
    }}
  >
    {children}
  </pre>
);

export default function App() {
  const [idToken, setIdToken] = useState("none");
  const [accessToken, setAccessToken] = useState("none");

  useEffect(() => {
    (async () => {
      // On first render, load tokens stored in the token manager
      // A real client will need to listen to tokenManager.on for renewed and expired events.  https://github.com/okta/okta-auth-js#tokenmanageronevent-callback-context
      // renewed events if it's not fetching tokens from the token manager every request
      // expired evenis to redirect back to sign in
      const idToken = await authClient.tokenManager.get("idToken");
      const accessToken = await authClient.tokenManager.get("accessToken");
      idToken?.value && setIdToken(idToken.value);
      accessToken?.value && setAccessToken(accessToken.value);
    })();
  }, []);

  const signIn = async () => {
    // There are other options like full page rediredcts or passing username/password directly but this seemed like the nicest to me.
    const response = await authClient.token.getWithPopup({
      scopes: [
        'openid',
        'email',
        'profile'
      ]
    });
    console.log("Sign in response", response);

    setIdToken(response.tokens.idToken.value);
    setAccessToken(response.tokens.accessToken.value);
    authClient.tokenManager.add("idToken", response.tokens.idToken);
    authClient.tokenManager.add("accessToken", response.tokens.accessToken);
  };

  const clearTokenManager = () => {
    authClient.tokenManager.clear();
    setIdToken("none");
    setAccessToken("none");
  };

  const revokeToken = () => {
    authClient.revokeAccessToken();
  };

  const signOut = () => {
    authClient.signOut();
  };

  const signOutWithoutRedirect = async () => {
    await authClient.revokeAccessToken();
    await authClient.closeSession();

    window.location.reload();
  };

  return (
    <div className="App">
      <h1>Test MissionHub Okta Integration</h1>
      <button onClick={signIn}>Sign In</button>
      <button onClick={signOut}>Sign Out of Okta</button>
      <button onClick={clearTokenManager}>
        Clear token manager (delete tokens stored in browser)
      </button>
      <button onClick={revokeToken}>Revoke token (throws CORS error)</button>
      <button onClick={signOutWithoutRedirect}>
        Sign Out of Okta without redirect (throws CORS error)
      </button>

      <p>Check browser console after sign in for full auth response.</p>
      <p>
        I don't seem to have access to the Trusted Origins part of the admin
        console.{" "}
        <a href="https://developer.okta.com/docs/guides/enable-cors/granting-cors/">
          https://developer.okta.com/docs/guides/enable-cors/granting-cors/
        </a>{" "}
        So the operations that use the Okta API are throwing CORS errors you can
        see in the console.
      </p>
      <p>
        The React error overlay seems to be broken and frezes the app after a
        CORS error, just refresh to fix it for now.
      </p>

      <h3>idToken</h3>
      <TokenContainer>{idToken}</TokenContainer>

      <h3>accessToken</h3>
      <TokenContainer>{accessToken}</TokenContainer>
      <p>
        Docs for @okta/okta-auth-js:{" "}
        <a href="https://github.com/okta/okta-auth-js">
          https://github.com/okta/okta-auth-js
        </a>
      </p>
    </div>
  );
}
