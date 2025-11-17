"use client";

import Link from "next/link";
import { useState } from "react";
import { NavbarLinks, navbarLinks } from "./NavbarLinks";

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-indigo-100 shadow-sm">
            <div className="max-w-7xl w-full flex md:grid md:grid-cols-12 items-center px-4 md:px-8 mx-auto py-4">
                <div className="md:col-span-3 flex items-center justify-between w-full md:w-auto">
                    <Link href="/" className="group hover:opacity-90 transition-opacity">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <span className="text-white font-bold text-lg">N</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Needle
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5">Reverse Marketplace</p>
                            </div>
                        </div>
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {mobileMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
                <NavbarLinks />
                
                {/* Auth Buttons - Desktop */}
                <div className="hidden md:flex items-center justify-end gap-3 col-span-3">
                    <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/register"
                        className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
            
            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-indigo-100 bg-white/95 backdrop-blur-lg">
                    <div className="px-4 py-4 space-y-2">
                        {navbarLinks.map((link) => (
                            <Link
                                key={link.id}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-3 px-4 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-indigo-100 space-y-2">
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-3 px-4 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-center"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-3 px-4 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all duration-200 text-center"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}  