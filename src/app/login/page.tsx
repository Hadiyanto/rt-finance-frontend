'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdArrowBack, MdVisibilityOff, MdVisibility, MdError } from 'react-icons/md';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login gagal');
            }

            // Save to localStorage or sessionStorage based on "Ingat Saya"
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('token', data.token);
            storage.setItem('user', JSON.stringify(data.user));

            // Dispatch event to notify other components
            window.dispatchEvent(new Event('authChange'));

            // Redirect to home
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark mx-auto max-w-[480px]">
            {/* TopAppBar */}
            <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between">
                <div
                    onClick={() => router.push('/')}
                    className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center cursor-pointer"
                >
                    <MdArrowBack className="text-2xl" />
                </div>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1">Masuk</h2>
            </div>

            {/* HeaderImage (Logo Placeholder) */}
            <div className="flex justify-center pt-8">
                <div className="w-32 h-32 bg-white dark:bg-background-dark rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                    {/* Empty icon placeholder - user will replace this */}
                    <div className="text-6xl text-gray-300 dark:text-gray-600">
                        {/* Icon goes here */}
                    </div>
                </div>
            </div>

            {/* HeadlineText */}
            <h2 className="text-[#111418] dark:text-white tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-2 pt-6">
                Selamat Datang
            </h2>

            {/* BodyText */}
            <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal pb-6 pt-1 px-4 text-center">
                Silakan masuk untuk mengelola iuran warga Anda.
            </p>

            {/* LoginForm */}
            <form onSubmit={handleSubmit} className="px-4 space-y-4">
                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <MdError className="text-red-500 text-xl flex-shrink-0" />
                        <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Email/Phone TextField */}
                <div className="flex flex-col gap-2">
                    <label className="flex flex-col w-full">
                        <p className="text-[#111418] dark:text-white text-base font-medium leading-normal pb-2">
                            Email
                        </p>
                        <input
                            className="form-input flex w-full min-w-0 flex-1 rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1c2632] h-14 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal"
                            placeholder="Masukkan email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </label>
                </div>

                {/* Password TextField */}
                <div className="flex flex-col gap-2">
                    <label className="flex flex-col w-full">
                        <div className="flex justify-between items-center pb-2">
                            <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">
                                Kata Sandi
                            </p>
                            <a className="text-primary text-sm font-semibold hover:underline" href="#">
                                Lupa Kata Sandi?
                            </a>
                        </div>
                        <div className="relative">
                            <input
                                className="form-input flex w-full min-w-0 flex-1 rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1c2632] h-14 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal pr-12"
                                placeholder="Masukkan kata sandi"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <MdVisibility className="text-xl" />
                                ) : (
                                    <MdVisibilityOff className="text-xl" />
                                )}
                            </button>
                        </div>
                    </label>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 py-2">
                    <input
                        className="w-5 h-5 rounded border-[#dbe0e6] dark:border-gray-700 text-primary focus:ring-primary bg-white dark:bg-[#1c2632]"
                        id="remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="text-[#111418] dark:text-white text-sm font-medium cursor-pointer" htmlFor="remember">
                        Ingat Saya
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg mt-4 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        'Masuk'
                    )}
                </button>
            </form>

            {/* Registration Link */}
            <div className="mt-auto px-4 py-8 text-center">
                <p className="text-[#617589] dark:text-gray-400 text-sm">
                    Warga baru?{' '}
                    <a className="text-primary font-bold hover:underline" href="#">
                        Hubungi Admin
                    </a>{' '}
                    untuk pendaftaran akun.
                </p>
            </div>

            <div className="h-10 bg-background-light dark:bg-background-dark"></div>
        </div>
    );
}
