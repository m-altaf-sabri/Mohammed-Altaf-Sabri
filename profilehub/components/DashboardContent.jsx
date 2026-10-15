"use client";

import { useEffect, useState } from "react";
import LinkedAccounts from "./LinkedAccounts";

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

    const [accountStatus, setAccountStatus] = useState({
        google: { connected: false, id: null, email: null },
        github: { connected: false, id: null, username: null },
        linkedin: { connected: false, id: null, name: null },
    });

    const [statusLoading, setStatusLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadAccountStatus() {
            try {
                const response = await fetch("/api/linked-accounts/status", {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Could not load account status");
                }

                const data = await response.json();

                if (!cancelled) {
                    setAccountStatus(data);
                }
            } catch (error) {
                console.error("Unable to load linked account status:", error);
            } finally {
                if (!cancelled) {
                    setStatusLoading(false);
                }
            }
        }

        loadAccountStatus();

        return () => {
            cancelled = true;
        };
    }, []);

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
                        {accounts.map((account) => {
                            const key = account.name.toLowerCase();
                            const status = accountStatus[key];
                            const connected = Boolean(status?.connected);

                            const accountDetail =
                                key === "google"
                                    ? status?.email
                                    : key === "github"
                                        ? status?.username
                                        : status?.name;

                            const accountId = status?.id;

                            return (
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

                                        <span
                                            className={
                                                connected
                                                    ? "hub-planned hub-connected"
                                                    : "hub-planned"
                                            }
                                        >
                                            {statusLoading
                                                ? "Checking..."
                                                : connected
                                                    ? "Connected"
                                                    : "Not connected"}
                                        </span>
                                    </div>

                                    <h3>{account.name}</h3>
                                    <p>{account.description}</p>

                                    {connected && (
                                        <div className="hub-connected-details">
                                            {accountDetail && (
                                                <p>
                                                    <strong>Account:</strong>{" "}
                                                    {accountDetail}
                                                </p>
                                            )}

                                            {accountId && (
                                                <p>
                                                    <strong>ID:</strong>{" "}
                                                    <span className="hub-account-id">
                                                        {accountId}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="hub-card-button"
                                        disabled={statusLoading}
                                      
onClick={() => {
  setMessage("");

  if (connected) {
    setMessage(`${account.name} is already connected.`);
    return;
  }

  if (account.name === "Google") {
    window.location.href = "/api/auth/google/link";
    return;
  }

  if (account.name === "GitHub") {
    window.location.href = "/api/auth/github/link";
    return;
  }

  setMessage(
    `${account.name} account linking is not configured yet.`
  );
}}

                                    >
                                        {connected ? "Connected ✓" : "Connect account"}
                                        <span>→</span>
                                    </button>
                                </article>
                            );
                        })}
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
                    <LinkedAccounts />
                </section>

                <footer className="hub-footer">
                    <span>© {new Date().getFullYear()} ProfileHub</span>
                    <span>One profile. All your links.</span>
                </footer>
            </div >
        </main >
    );
}





