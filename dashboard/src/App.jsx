import React, { Suspense, useEffect, useMemo, useState } from "react";

import { getBaseUrl, isSupabaseDataSource } from "./lib/config.js";
import { useAuth } from "./hooks/use-auth.js";
import { buildAuthUrl } from "./lib/auth-url.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { isMockEnabled } from "./lib/mock-data.js";
import { fetchLatestTrackerVersion } from "./lib/npm-version.js";

import { UpgradeAlertModal } from "./ui/matrix-a/components/UpgradeAlertModal.jsx";

// Lazy load pages
const DashboardPage = React.lazy(() =>
  import("./pages/DashboardPage.jsx").then((mod) => ({
    default: mod.DashboardPage,
  }))
);
const AnnualPosterPage = React.lazy(() =>
  import("./pages/AnnualPosterPage.jsx").then((mod) => ({
    default: mod.AnnualPosterPage,
  }))
);
// Lazy load Supabase login page (only loaded when using Supabase data source)
const SupabaseSignInPage = React.lazy(() =>
  import("./components/SupabaseSignInPage.jsx").then((mod) => ({
    default: mod.SupabaseSignInPage,
  }))
);

const LOCAL_REDIRECT_HOSTS = new Set(["127.0.0.1", "localhost"]);

function getSafeRedirect(searchParams) {
  const redirect = searchParams.get("redirect") || "";
  if (!redirect) return null;

  try {
    const redirectUrl = new URL(redirect);
    if (redirectUrl.protocol !== "http:") return null;
    if (!LOCAL_REDIRECT_HOSTS.has(redirectUrl.hostname)) return null;
    return redirectUrl.toString();
  } catch (_e) {
    return null;
  }
}

export default function App() {
  const baseUrl = useMemo(() => getBaseUrl(), []);
  const useSupabase = useMemo(() => isSupabaseDataSource(), []);
  const { auth, signedIn, sessionExpired, signOut } = useAuth();
  const mockEnabled = isMockEnabled();
  const [latestVersion, setLatestVersion] = useState(null);

  useEffect(() => {
    let active = true;
    fetchLatestTrackerVersion({ allowStale: true }).then((version) => {
      if (!active) return;
      setLatestVersion(version);
    });
    return () => {
      active = false;
    };
  }, []);

  const pageUrl = new URL(window.location.href);
  const safeRedirect = getSafeRedirect(pageUrl.searchParams);
  const posterYear = pageUrl.searchParams.get("poster") || "";
  const showPoster = posterYear === "2025";
  const baseUrlOverride =
    safeRedirect && pageUrl.searchParams.get("base_url")
      ? pageUrl.searchParams.get("base_url")
      : "";
  const authBaseUrl = baseUrlOverride || baseUrl;

  const defaultRedirectUrl = useMemo(
    () => `${window.location.origin}/auth/callback`,
    []
  );
  
  // InsForge auth URLs (only used when not using Supabase)
  const signInUrl = useMemo(
    () =>
      buildAuthUrl({
        baseUrl: authBaseUrl,
        path: "/auth/sign-in",
        redirectUrl: safeRedirect || defaultRedirectUrl,
      }),
    [authBaseUrl, defaultRedirectUrl, safeRedirect]
  );
  const signUpUrl = useMemo(
    () =>
      buildAuthUrl({
        baseUrl: authBaseUrl,
        path: "/auth/sign-up",
        redirectUrl: safeRedirect || defaultRedirectUrl,
      }),
    [authBaseUrl, defaultRedirectUrl, safeRedirect]
  );

  const loadingShell = <div className="min-h-screen bg-[#050505]" />;
  let content = null;
  
  if (!signedIn && !mockEnabled) {
    // Show login page based on data source
    if (useSupabase) {
      content = (
        <Suspense fallback={loadingShell}>
          <SupabaseSignInPage redirectUrl={defaultRedirectUrl} />
        </Suspense>
      );
    } else {
      content = <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
    }
  } else if (showPoster) {
    content = (
      <Suspense fallback={loadingShell}>
        <AnnualPosterPage
          baseUrl={baseUrl}
          auth={auth}
          signedIn={signedIn}
        />
      </Suspense>
    );
  } else {
    content = (
      <Suspense fallback={loadingShell}>
        <UpgradeAlertModal requiredVersion={latestVersion} />
        <DashboardPage
          baseUrl={baseUrl}
          auth={auth}
          signedIn={signedIn}
          sessionExpired={sessionExpired}
          signOut={signOut}
        />
      </Suspense>
    );
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}
