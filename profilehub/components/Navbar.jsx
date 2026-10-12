"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        async function checkSession() {
            try {
                const response = await fetch("/api/session", {
                    cache: "no-store",
                });

                setIsLoggedIn(response.ok);
            } catch {
                setIsLoggedIn(false);
            }
        }

        checkSession();
    }, []);

    async function handleLogout() {
        try {
            await fetch("/api/logout", {
                method: "POST",
            });
        } finally {
            setIsLoggedIn(false);
            setMobileOpen(false);
            window.location.href = "/login";
        }
    }

    return (
        <nav className="navbar">
            <a className="hub-logo" href="/dashboard">
                <span className="hub-logo-mark">P</span>
            </a>
            <Link href="/" className="logo">
                ProfileHub<span>.</span>
            </Link>

            <button
                className="menu-button"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation"
            >
                ☰
            </button>

            <div className={`nav-links ${mobileOpen ? "show" : ""}`}>
                {isLoggedIn && (
                    <Link href="/" onClick={() => setMobileOpen(false)}>
                        Dashboard
                    </Link>
                )}

                {isLoggedIn ? (
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                ) : (
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}