import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase-client.js';

/**
 * SupabaseSignInPage - Sign-in page for Supabase data source
 * Used when VITE_DATA_SOURCE=supabase
 */
export function SupabaseSignInPage({ redirectUrl }) {
    const [mode, setMode] = useState('signin'); // signin | signup
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [cliRedirect, setCliRedirect] = useState(null);
    const [darkMode, setDarkMode] = useState(true);

    // Check URL params
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            if (p.get('mode') === 'signup') setMode('signup');
            
            const redirect = p.get('redirect');
            if (redirect && redirect.startsWith('http://127.0.0.1')) {
                setCliRedirect(redirect);
            }
        }
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const sb = getSupabase();
            
            if (sb._isPlaceholder) {
                throw new Error('Supabase is not configured. Please check your environment variables.');
            }

            let res;
            if (mode === 'signup') {
                res = await sb.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: redirectUrl }
                });
            } else {
                res = await sb.auth.signInWithPassword({ email, password });
            }

            if (res.error) throw res.error;

            if (res.data?.session) {
                if (cliRedirect) {
                    const u = new URL(cliRedirect);
                    u.searchParams.set('access_token', res.data.session.access_token);
                    if (res.data.user?.id) u.searchParams.set('user_id', res.data.user.id);
                    if (res.data.user?.email) u.searchParams.set('email', res.data.user.email);
                    window.location.href = u.toString();
                    return;
                }

                const u = new URL('/auth/callback', window.location.origin);
                u.searchParams.set('access_token', res.data.session.access_token);
                if (res.data.user?.id) u.searchParams.set('user_id', res.data.user.id);
                if (res.data.user?.email) u.searchParams.set('email', res.data.user.email);
                window.location.href = u.toString();
            } else if (mode === 'signup') {
                setSuccess('Please check your email to confirm your account.');
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'An authentication error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider) => {
        try {
            const sb = getSupabase();
            if (sb._isPlaceholder) {
                throw new Error('Supabase is not configured.');
            }

            const { error } = await sb.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectUrl || `${window.location.origin}/auth/callback`,
                }
            });

            if (error) throw error;
        } catch (err) {
            setError(err.message || 'OAuth sign-in failed.');
        }
    };

    const labels = {
        title: 'VibeScore Analytics',
        welcomeBack: 'Welcome Back',
        welcomeSubtitle: 'Log in to access your token usage analytics.',
        welcomeNew: 'Get Started',
        welcomeNewSubtitle: 'Create an account to track your AI usage.',
        emailLabel: 'Email',
        emailPlaceholder: 'name@example.com',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        logIn: 'Log In',
        signUp: 'Sign Up',
        or: 'or',
        continueWithGoogle: 'Continue with Google',
        continueWithGitHub: 'Continue with GitHub',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        signUpLink: 'Sign up',
        signInLink: 'Sign in',
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                        V
                    </div>
                    <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
                    <h2 className="text-xl font-semibold mt-2 text-white">
                        {mode === 'signin' ? labels.welcomeBack : labels.welcomeNew}
                    </h2>
                    <p className="text-sm mt-2 text-gray-400">
                        {mode === 'signin' ? labels.welcomeSubtitle : labels.welcomeNewSubtitle}
                    </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                        {success}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            {labels.emailLabel}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={labels.emailPlaceholder}
                            required
                            autoFocus
                            className="w-full px-4 py-3 rounded-lg border bg-[#111] border-[#222] text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-300">
                                {labels.passwordLabel}
                            </label>
                            {mode === 'signin' && (
                                <a href="#" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                                    {labels.forgotPassword}
                                </a>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={labels.passwordPlaceholder}
                                required
                                className="w-full px-4 py-3 pr-12 rounded-lg border bg-[#111] border-[#222] text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    {mode === 'signin' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-[#111]"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-gray-400">
                                {labels.rememberMe}
                            </label>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                            loading
                                ? 'bg-emerald-500/50 text-white/50 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-500/20'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            mode === 'signin' ? labels.logIn : labels.signUp
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-grow h-px bg-[#222]" />
                    <span className="text-sm text-gray-500">{labels.or}</span>
                    <div className="flex-grow h-px bg-[#222]" />
                </div>

                {/* OAuth Buttons */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleOAuth('google')}
                        className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 bg-[#111] border border-[#222] text-white hover:bg-[#1a1a1a] transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {labels.continueWithGoogle}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleOAuth('github')}
                        className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 bg-[#111] border border-[#222] text-white hover:bg-[#1a1a1a] transition-all"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        {labels.continueWithGitHub}
                    </button>
                </div>

                {/* Switch Mode */}
                <p className="text-center mt-6 text-sm text-gray-400">
                    {mode === 'signin' ? labels.noAccount : labels.haveAccount}{' '}
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
                    >
                        {mode === 'signin' ? labels.signUpLink : labels.signInLink}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default SupabaseSignInPage;
