'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdArrowBack, MdLocationCity, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function NewLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#f6f7f8] dark:bg-[#101922] overflow-x-hidden font-sans">
            <div className="relative w-full bg-[#137fec] pt-12 pb-24 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute top-1/2 -left-20 w-64 h-64 bg-black/5 rounded-full blur-3xl"></div>

                <div
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 text-white flex size-10 items-center justify-center cursor-pointer hover:bg-white/10 rounded-full transition-colors"
                >
                    <MdArrowBack className="text-2xl" />
                </div>

                <div className="relative mb-6">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl rotate-3">
                        <MdLocationCity className="text-[#137fec] text-5xl -rotate-3" />
                    </div>
                </div>

                <h1 className="text-white tracking-tight text-4xl font-extrabold leading-tight mb-2">
                    Citizen Dues
                </h1>
                <p className="text-white/80 text-base max-w-[280px]">
                    Manage your neighborhood contributions easily
                </p>
            </div>

            <div className="px-5 -mt-16 relative z-10 mb-8">
                <div className="bg-white dark:bg-[#101922] rounded-[2rem] shadow-2xl shadow-[#137fec]/20 p-6 md:p-8 border border-white/50 dark:border-gray-800">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#0d141b] dark:text-white">Login</h2>
                        <div className="h-1 w-8 bg-[#137fec] mt-1 rounded-full"></div>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-[#0d141b] dark:text-white text-sm font-semibold leading-normal">
                                Email or Phone Number
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-xl text-[#0d141b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/20 border border-[#cfdbe7] dark:border-gray-700 bg-[#f8fafd] dark:bg-[#101922] focus:border-[#137fec] h-14 placeholder:text-[#4c739a] px-4 text-base font-normal transition-all"
                                placeholder="Enter your email or phone"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[#0d141b] dark:text-white text-sm font-semibold leading-normal">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full rounded-xl text-[#0d141b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/20 border border-[#cfdbe7] dark:border-gray-700 bg-[#f8fafd] dark:bg-[#101922] focus:border-[#137fec] h-14 placeholder:text-[#4c739a] pl-4 pr-12 text-base font-normal transition-all"
                                    placeholder="Enter your password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4c739a] flex items-center justify-center cursor-pointer hover:text-[#137fec] transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <MdVisibilityOff className="text-xl" />
                                    ) : (
                                        <MdVisibility className="text-xl" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 mb-8">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                className="rounded border-[#cfdbe7] text-[#137fec] focus:ring-[#137fec] w-5 h-5 transition-all group-hover:scale-110"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span className="text-[#0d141b] dark:text-white text-sm font-medium">Remember Me</span>
                        </label>
                        <a className="text-[#137fec] text-sm font-bold hover:underline" href="#">Forgot Password?</a>
                    </div>

                    <button className="w-full h-14 bg-[#137fec] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#137fec]/30 hover:shadow-[#137fec]/40 active:scale-[0.98] transition-all">
                        Masuk
                    </button>
                </div>
            </div>

            <div className="mt-auto px-6 py-8 text-center bg-[#f6f7f8] dark:bg-[#101922]">
                <p className="text-[#4c739a] dark:text-gray-400 text-sm leading-relaxed">
                    New resident? <br />
                    <a className="text-[#137fec] font-bold inline-block hover:underline cursor-pointer">Contact Admin</a> to register your account.
                </p>
            </div>

            <div className="h-6 bg-transparent"></div>
        </div>
    );
}
