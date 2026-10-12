"use client";

import { useState } from "react";
// import LinkedAccounts from "./LinkedAccounts";

const accounts = [
    {
        name: "Google",
        description: "Manage your Google profile",
        icon: "G",
        className: "google",
    },
    {
        name: "GitHub",
        description: "Showcase your developer profile",
        icon: "GH",
        className: "github",
    },
    {
        name: "LinkedIn",
        description: "Highlight your professional profile",
        icon: "in",
        className: "linkedin",
    },
];

export default function DashboardContent({ user }) {
    const [message, setMessage] = useState("");

    const name = user?.name?.trim() || "User";
    const initial = name.charAt(0).toUpperCase();

    return (
        <main className="hub-dashboard">
            <header className="hub-header">
                <div className="hub-header-right">
                    <span className="hub-user-avatar">{initial}</span>
                    <span className="hub-header-name">{name}</span>
                </div>
            </header>

            <div className="hub-content">
                <section className="hub-hero">
                    <div>
                        <span className="hub-kicker">
                            YOUR PERSONAL DASHBOARD
                        </span>
                        <h1>Welcome back, {name}!</h1>
                        <p>
                            Your online identity, organized in one place.
                            Manage your profiles with ease.
                        </p>
                        <a href="#hub-linked" className="hub-hero-button">
                            Manage my links <span>→</span>
                        </a>
                    </div>

                    <div className="hub-hero-decoration" aria-hidden="true">
                        <div className="hub-orbit hub-orbit-one" />
                        <div className="hub-orbit hub-orbit-two" />
                        <div className="hub-hero-symbol">P</div>
                    </div>
                </section>

                <section className="hub-account-summary">
                    <div className="hub-summary-avatar">{initial}</div>
                    <div className="hub-summary-info">
                        <span>YOUR PROFILE</span>
                        <h2>{name}</h2>
                        <p>{user?.email || "Email not available"}</p>
                    </div>
                    <span className="hub-signed-in">
                        <span /> Signed in
                    </span>
                </section>

                <section className="hub-section" id="hub-social">
                    <div className="hub-section-heading">
                        <div>
                            <span className="hub-kicker">
                                CONNECT & GROW
                            </span>
                            <h2>Your social accounts</h2>
                            <p>
                                Keep your important online profiles
                                easy to find.
                            </p>
                        </div>
                        <span className="hub-section-count">03 services</span>
                    </div>

                    <div className="hub-account-grid">
                        {accounts.map((account) => (
                            <article
                                className="hub-account-card"
                                key={account.name}
                            >
                                <div className="hub-card-top">
                                    <div
                                        className={`hub-service-icon ${account.className}`}
                                    >
                                        {account.icon}
                                    </div>
                                    <span className="hub-planned">
                                        Not connected
                                    </span>
                                </div>

                                <h3>{account.name}</h3>
                                <p>{account.description}</p>

                                <button
                                    type="button"
                                    className="hub-card-button"

                                    onClick={() => {
                                        if (account.name === "Google") {
                                            window.location.href = "/api/auth/google/link";
                                            return;
                                        }

                                        setMessage(
                                            `${account.name} account linking is not configured yet.`
                                        );
                                    }}

                                >
                                    Connect account <span>→</span>
                                </button>
                            </article>
                        ))}
                    </div>

                    {message && (
                        <p className="hub-notice" role="status">
                            {message}
                        </p>
                    )}

                    <p className="hub-helper">
                        Direct account sign-in will be enabled when
                        each service's OAuth integration is configured.
                    </p>
                </section>

                <section className="hub-links-panel" id="hub-linked">
                    <div className="hub-section-heading">
                        <div>
                            <span className="hub-kicker">
                                YOUR ONLINE PRESENCE
                            </span>
                            <h2>Linked accounts</h2>
                            <p>
                                Add, view, and manage links to your public
                                profiles and websites.
                            </p>
                        </div>
                        <div className="hub-link-icon" aria-hidden="true">
                            ↗
                        </div>
                    </div>
                </section>

                <footer className="hub-footer">
                    <span>© {new Date().getFullYear()} ProfileHub</span>
                    <span>One profile. All your links.</span>
                </footer>
            </div>
        </main>
    );
}
