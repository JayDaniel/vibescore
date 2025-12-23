import React, { useEffect, useMemo, useState } from "react";
import { MatrixRain } from "../ui/matrix-a/components/MatrixRain.jsx";
import { DecodingText } from "../ui/matrix-a/components/DecodingText.jsx";
import { MatrixAvatar } from "../ui/matrix-a/components/MatrixAvatar.jsx";
import { LiveSniffer } from "../ui/matrix-a/components/LiveSniffer.jsx";
import { SignalBox } from "../ui/matrix-a/components/SignalBox.jsx";
import { GithubStar } from "../ui/matrix-a/components/GithubStar.jsx";
import { copy } from "../lib/copy.js";

export function LandingPage({ signInUrl }) {
  const specialHandle = copy("landing.handle.special");
  const defaultHandle = copy("landing.handle.default");
  const [handle, setHandle] = useState(defaultHandle);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

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

  if (!isLoaded) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#050505] font-mono text-[#00FF41] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 视觉层 */}
      <MatrixRain />
      <GithubStar />
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]"></div>

      {/* 主面板 */}
      <main className="w-full max-w-4xl relative z-10 flex flex-col items-center space-y-12 py-10">
        {/* Slogan 区域 */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none glow-text select-none">
            <DecodingText text={copy("landing.hero.title_primary")} /> <br />
            <span className="text-[#00FF41]">
              <DecodingText text={copy("landing.hero.title_secondary")} />
            </span>
          </h1>

          <div className="flex flex-col items-center space-y-2">
            <div className="px-6 py-2 border-l border-r border-[#00FF41]/40 bg-[#00FF41]/5 relative group">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00FF41]"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00FF41]"></div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold">
                {copy("landing.hero.tagline")}
              </p>
            </div>
            {/* 包含 Codex CLI Token 的精准描述 */}
            <p className="text-[9px] text-[#00FF41]/60 uppercase tracking-[0.2em]">
              {copy("landing.hero.subtagline")}
            </p>
          </div>
        </div>

        {/* 演示区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* 身份探测 */}
          <SignalBox
            title={copy("landing.signal.identity_probe")}
            className="h-44"
          >
            <div className="flex items-center space-x-6 h-full">
              <MatrixAvatar
                name={handle}
                size={80}
                isTheOne={handle === specialHandle}
              />
              <div className="flex-1 text-left space-y-3">
                <div className="flex flex-col">
                  <label className="text-[8px] opacity-40 uppercase tracking-widest mb-1 font-bold">
                    {copy("landing.handle.label")}
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toUpperCase())}
                    className="w-full bg-transparent border-b border-[#00FF41]/50 text-white font-black text-xl p-1 focus:outline-none focus:border-[#00FF41] transition-colors"
                    maxLength={10}
                    placeholder={handlePlaceholder}
                  />
                </div>
                <div className="text-[8px] opacity-60">{rankLabel}</div>
              </div>
            </div>
          </SignalBox>

          {/* 实时抓包 */}
          <SignalBox
            title={copy("landing.signal.live_sniffer")}
            className="h-44"
          >
            <LiveSniffer />
          </SignalBox>
        </div>

        {/* 核心操作区域 */}
        <div className="w-full max-w-sm flex flex-col items-center space-y-4">
          <a
            href={signInUrl}
            className="block w-full group relative border-2 border-[#00FF41] bg-[#00FF41]/10 py-5 overflow-hidden transition-all hover:bg-[#00FF41] hover:text-black active:scale-95 shadow-[0_0_20px_rgba(0,255,65,0.2)] text-center no-underline text-[#00FF41] hover:text-black"
          >
            <span className="font-black uppercase tracking-[0.4em] text-sm relative z-10 animate-pulse group-hover:animate-none">
              {copy("landing.cta.initialize")}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </a>

          {/* 核心补充 */}
          <div className="text-center">
            <p className="text-[9px] text-[#00FF41]/60 uppercase tracking-widest font-bold">
              {copy("landing.cta.subtext")}
            </p>
          </div>

          <div className="flex space-x-8 opacity-20 text-[9px] uppercase tracking-widest pt-4">
            <span className="hover:text-white cursor-pointer transition-colors">
              {copy("landing.footer.link.manifesto")}
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              {copy("landing.footer.link.docs")}
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              {copy("landing.footer.link.security")}
            </span>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-8 opacity-20 text-[9px] tracking-[0.6em] uppercase select-none">
        {copy("landing.footer.system_ready")}
      </footer>

      <style>
        {`
        .glow-text { text-shadow: 0 0 20px rgba(0, 255, 65, 0.5); }
        `}
      </style>
    </div>
  );
}
