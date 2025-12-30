import React, { Suspense, useEffect, useMemo, useState } from "react";
import { DecodingText } from "../ui/matrix-a/components/DecodingText.jsx";
import { GithubStar } from "../ui/matrix-a/components/GithubStar.jsx";
import { copy } from "../lib/copy.js";

const MatrixRain = React.lazy(() =>
  import("../ui/matrix-a/components/MatrixRain.jsx").then((mod) => ({
    default: mod.MatrixRain,
  }))
);
const LandingExtras = React.lazy(() =>
  import("./LandingExtras.jsx").then((mod) => ({
    default: mod.LandingExtras,
  }))
);

function useDeferredMount(delayMs = 0) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let timer = null;
    let idleId = null;
    const run = () => setMounted(true);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: delayMs || 200 });
      return () => {
        if (typeof window.cancelIdleCallback === "function" && idleId != null) {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    timer = window.setTimeout(run, delayMs);
    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, [delayMs]);

  return mounted;
}

export function LandingPage({ signInUrl }) {
  const specialHandle = copy("landing.handle.special");
  const defaultHandle = copy("landing.handle.default");
  const [handle, setHandle] = useState(defaultHandle);
  const effectsReady = useDeferredMount(250);
  const installEntryKey = "vibescore.dashboard.from_landing.v1";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(installEntryKey, "1");
    } catch (_e) {
      // ignore write errors (private mode/quota)
    }
  }, [installEntryKey]);

  const handlePlaceholder = useMemo(
    () => copy("landing.handle.placeholder", { handle: specialHandle }),
    [specialHandle]
  );

  const rankLabel = useMemo(() => {
    const rank =
      handle === specialHandle
        ? copy("landing.rank.singularity")
        : copy("landing.rank.unranked");
    return copy("landing.rank.expectation", { rank });
  }, [handle, specialHandle]);

  const handleChange = (event) => {
    setHandle(event.target.value.toUpperCase());
  };

  const extrasSkeleton = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
      <div className="h-44 border border-[#00FF41]/15 bg-[#00FF41]/5"></div>
      <div className="h-44 border border-[#00FF41]/15 bg-[#00FF41]/5"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-matrix-dark font-matrix text-matrix-primary text-body flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {effectsReady ? (
        <Suspense fallback={null}>
          <MatrixRain />
        </Suspense>
      ) : null}
      <GithubStar />
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]"></div>

      {/* 主面板 */}
      <main className="w-full max-w-4xl relative z-10 flex flex-col items-center space-y-12 py-10">
        {/* Slogan 区域 */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none glow-text select-none">
            <DecodingText text={copy("landing.hero.title_primary")} /> <br />
            <span className="text-matrix-primary">
              <DecodingText text={copy("landing.hero.title_secondary")} />
            </span>
          </h1>

          <div className="flex flex-col items-center space-y-2">
            <div className="px-6 py-3 border border-matrix-ghost bg-matrix-panel relative group">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-matrix-primary"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-matrix-primary"></div>
              <p className="text-caption uppercase font-bold text-matrix-bright">
                {copy("landing.hero.tagline")}
              </p>
            </div>
            {/* 包含 Codex CLI Token 的精准描述 */}
            <p className="text-caption text-matrix-muted uppercase">
              {copy("landing.hero.subtagline")}
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 text-caption uppercase tracking-widest text-matrix-dim">
          <a
            href="#features"
            className="hover:text-matrix-bright transition-colors"
          >
            {copy("landing.seo.nav.features")}
          </a>
          <a
            href="#how"
            className="hover:text-matrix-bright transition-colors"
          >
            {copy("landing.seo.nav.how")}
          </a>
          <a
            href="#manifesto"
            className="hover:text-matrix-bright transition-colors"
          >
            {copy("landing.seo.nav.manifesto")}
          </a>
          <a
            href="#docs"
            className="hover:text-matrix-bright transition-colors"
          >
            {copy("landing.seo.nav.docs")}
          </a>
          <a
            href="#security"
            className="hover:text-matrix-bright transition-colors"
          >
            {copy("landing.seo.nav.security")}
          </a>
        </nav>

        {/* 演示区域 */}
        {effectsReady ? (
          <Suspense fallback={extrasSkeleton}>
            <LandingExtras
              handle={handle}
              onHandleChange={handleChange}
              specialHandle={specialHandle}
              handlePlaceholder={handlePlaceholder}
              rankLabel={rankLabel}
            />
          </Suspense>
        ) : (
          extrasSkeleton
        )}

        <section
          id="features"
          className="w-full max-w-3xl border border-matrix-ghost bg-matrix-panel px-6 py-6 space-y-4"
        >
          <h2
            id="features-title"
            className="text-2xl md:text-3xl font-bold text-matrix-bright tracking-tight"
          >
            {copy("landing.seo.title")}
          </h2>
          <p className="text-body text-matrix-muted">
            {copy("landing.seo.summary")}
          </p>
          <p className="text-body text-matrix-muted">
            {copy("landing.seo.detail1")}
          </p>
          <p className="text-body text-matrix-muted">
            {copy("landing.seo.detail2")}
          </p>
          <figure className="space-y-3">
            <img
              src={copy("landing.seo.image.src")}
              alt={copy("landing.seo.image.alt")}
              className="w-full border border-matrix-ghost bg-matrix-panelStrong"
              loading="lazy"
            />
            <figcaption className="text-caption text-matrix-dim">
              {copy("landing.seo.image.caption")}
            </figcaption>
          </figure>
          <ul className="space-y-2 text-body text-matrix-muted">
            <li className="flex gap-2">
              <span className="text-matrix-primary">-</span>
              <span>{copy("landing.seo.point1")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-matrix-primary">-</span>
              <span>{copy("landing.seo.point2")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-matrix-primary">-</span>
              <span>{copy("landing.seo.point3")}</span>
            </li>
          </ul>
          <p className="text-caption text-matrix-dim uppercase">
            {copy("landing.seo.roadmap")}
          </p>
        </section>

        <section
          id="how"
          className="w-full max-w-3xl border border-matrix-ghost bg-matrix-panel px-6 py-6 space-y-4"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-matrix-bright tracking-tight">
            {copy("landing.seo.how.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-heading font-bold text-matrix-bright">
                {copy("landing.seo.how.step1.title")}
              </h3>
              <p className="text-body text-matrix-muted">
                {copy("landing.seo.how.step1.body")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-heading font-bold text-matrix-bright">
                {copy("landing.seo.how.step2.title")}
              </h3>
              <p className="text-body text-matrix-muted">
                {copy("landing.seo.how.step2.body")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-heading font-bold text-matrix-bright">
                {copy("landing.seo.how.step3.title")}
              </h3>
              <p className="text-body text-matrix-muted">
                {copy("landing.seo.how.step3.body")}
              </p>
            </div>
          </div>
        </section>

        <section
          id="manifesto"
          className="w-full max-w-3xl border border-matrix-ghost bg-matrix-panel px-6 py-6 space-y-3"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-matrix-bright tracking-tight">
            {copy("landing.seo.manifesto.title")}
          </h2>
          <p className="text-body text-matrix-muted">
            {copy("landing.seo.manifesto.body")}
          </p>
        </section>

        <section
          id="docs"
          className="w-full max-w-3xl border border-matrix-ghost bg-matrix-panel px-6 py-6 space-y-4"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-matrix-bright tracking-tight">
            {copy("landing.seo.docs.title")}
          </h2>
          <p className="text-body text-matrix-muted">
            {copy("landing.seo.docs.body")}
          </p>
          <ol className="space-y-2 text-body text-matrix-muted list-decimal list-inside">
            <li>{copy("landing.seo.docs.step1")}</li>
            <li>{copy("landing.seo.docs.step2")}</li>
            <li>{copy("landing.seo.docs.step3")}</li>
          </ol>
        </section>

        <section
          id="security"
          className="w-full max-w-3xl border border-matrix-ghost bg-matrix-panel px-6 py-6 space-y-4"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-matrix-bright tracking-tight">
            {copy("landing.seo.security.title")}
          </h2>
          <p className="text-body text-matrix-muted">
            {copy("landing.seo.security.body")}
          </p>
          <ul className="space-y-2 text-body text-matrix-muted">
            <li className="flex gap-2">
              <span className="text-matrix-primary">-</span>
              <span>{copy("landing.seo.security.point1")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-matrix-primary">-</span>
              <span>{copy("landing.seo.security.point2")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-matrix-primary">-</span>
              <span>{copy("landing.seo.security.point3")}</span>
            </li>
          </ul>
        </section>

        <section
          id="references"
          className="w-full max-w-3xl border border-matrix-ghost bg-matrix-panel px-6 py-6 space-y-3"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-matrix-bright tracking-tight">
            {copy("landing.seo.references.title")}
          </h2>
          <p className="text-body text-matrix-muted">
            {copy("landing.seo.references.body")}
          </p>
          <div className="flex flex-wrap gap-4 text-caption uppercase tracking-widest text-matrix-primary">
            <a
              href={copy("landing.seo.references.link_openai.url")}
              className="hover:text-matrix-bright transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy("landing.seo.references.link_openai.label")}
            </a>
            <a
              href={copy("landing.seo.references.link_anthropic.url")}
              className="hover:text-matrix-bright transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy("landing.seo.references.link_anthropic.label")}
            </a>
            <a
              href={copy("landing.seo.references.link_google.url")}
              className="hover:text-matrix-bright transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy("landing.seo.references.link_google.label")}
            </a>
          </div>
        </section>

        {/* 核心操作区域 */}
        <div className="w-full max-w-sm flex flex-col items-center space-y-4">
          <a
            href={signInUrl}
            className="block w-full group relative border-2 border-matrix-primary bg-matrix-panelStrong py-5 overflow-hidden transition-all hover:bg-matrix-primary hover:text-black active:scale-95 shadow-[0_0_20px_rgba(0,255,65,0.2)] text-center no-underline text-matrix-primary hover:text-black"
          >
            <span className="font-black uppercase tracking-[0.4em] text-heading relative z-10 animate-pulse group-hover:animate-none">
              {copy("landing.cta.initialize")}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </a>

          {/* 核心补充 */}
          <div className="text-center">
            <p className="text-caption text-matrix-muted uppercase font-bold">
              {copy("landing.cta.subtext")}
            </p>
          </div>

          <div className="flex space-x-8 text-caption uppercase tracking-widest text-matrix-dim pt-4">
            <a
              href="#manifesto"
              className="hover:text-matrix-bright transition-colors"
            >
              {copy("landing.footer.link.manifesto")}
            </a>
            <a
              href="#docs"
              className="hover:text-matrix-bright transition-colors"
            >
              {copy("landing.footer.link.docs")}
            </a>
            <a
              href="#security"
              className="hover:text-matrix-bright transition-colors"
            >
              {copy("landing.footer.link.security")}
            </a>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-8 text-caption text-matrix-dim tracking-[0.6em] uppercase select-none">
        {copy("landing.footer.system_ready")}
      </footer>
    </div>
  );
}
