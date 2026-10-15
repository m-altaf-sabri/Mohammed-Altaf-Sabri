
"use client";

import { useCallback, useEffect, useState } from "react";
import LinkedAccounts from "./LinkedAccounts";

const integrations = [
    {
        id: "google",
        name: "Google",
        description: "Connect your Google profile",
        icon: "G",
        className: "google",
        connectUrl: "/api/auth/google/link",
    },
    {
        id: "github",
        name: "GitHub",
        description: "Showcase your developer profile",
        icon: "GH",
        className: "github",
        connectUrl: "/api/auth/github/link",
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        description: "Highlight your professional profile",
        icon: "in",
        className: "linkedin",
        connectUrl: "/api/auth/linkedin/link",
    },
];

function getInitial(value) {
    return typeof value === "string" && value.trim()
        ? value.trim().charAt(0).toUpperCase()
        : "U";
}

function getFirstName(name) {
    if (typeof name !== "string" || !name.trim()) {
        return "there";
    }

    return name.trim().split(/\s+/)[0];
}

function accountIsConnected(value) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value.trim().length > 0 && value.toLowerCase() !== "false";
    }

    if (value && typeof value === "object") {
        return Boolean(
            value.connected ??
            value.isConnected ??
            value.email ??
            value.username
        );
    }

    return false;
}

export default function DashboardContent({ user }) {
    const [accounts, setAccounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const displayName =
        typeof user?.name === "string" && user.name.trim()
            ? user.name.trim()
            : "Your profile";

    const email =
        typeof user?.email === "string" ? user.email : "";

    const initial = getInitial(user?.name || email);

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/linked-accounts/status", {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 404
                        ? "The linked-account status API is not configured yet."
                        : "Unable to load linked-account status. Please try again."
                );
            }

            const data = await response.json();
            const accountData = data?.accounts ?? data;

            if (
                !accountData ||
                typeof accountData !== "object" ||
                Array.isArray(accountData)
            ) {
                throw new Error("The account-status API returned an invalid response.");
            }

            setAccounts(accountData);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load linked-account status."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    async function handleLogout() {
        if (loggingOut) return;

        setLoggingOut(true);
        setError("");
        setNotice("");

        try {
            const response = await fetch("/api/logout", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Logout failed. Please try again.");
            }

            window.location.assign("/login");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not log out. Please try again."
            );
            setLoggingOut(false);
        }
    }

    function isConnected(id) {
        const value = accounts[id];

        if (typeof value === "boolean") return value;

        if (typeof value === "string") {
            return value === "true";
        }

        if (value && typeof value === "object") {
            return value.connected === true || value.isConnected === true;
        }

        return false;
      }

    function handleIntegrationClick(item, connected) {
        setError("");
        setNotice("");

        if (connected) {
            setNotice(
                `${item.name} is marked as connected. Disconnecting it requires a server-side unlink endpoint, which is not implemented by this component.`
            );
            return;
        }

        window.location.assign(item.connectUrl);
    }

    const connectedCount = integrations.filter((item) =>
        isConnected(item.id)
    ).length;

    return (
        <main className="hub-dashboard">
            <aside className="hub-sidebar">
                <a className="hub-brand" href="/dashboard">
                    <span className="hub-brand-mark">P</span>
                    <span>ProfileHub</span>
                </a>

                <div className="hub-nav-label">WORKSPACE</div>

                <a className="hub-nav-item active" href="/dashboard">
                    <span>▦</span>
                    Overview
                </a>

                <a className="hub-nav-item" href="#hub-integrations">
                    <span>◎</span>
                    Social accounts
                </a>

                <a className="hub-nav-item" href="#hub-profile">
                    <span>♙</span>
                    My profile
                </a>

                <div className="hub-sidebar-bottom">
                    <div className="hub-help">
                        <span className="hub-help-icon">✦</span>
                        <strong>Your digital identity</strong>
                        <p>
                            Keep your profiles connected in one place.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="hub-logout"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        <span>↪</span>
                        {loggingOut ? "Signing out..." : "Log out"}
                    </button>
                </div>
            </aside>

            <section className="hub-main">
                <header className="hub-topbar">
                    <div>
                        <div className="hub-breadcrumb">
                            Workspace / Overview
                        </div>
                        <h1>Dashboard</h1>
                    </div>

                    <div className="hub-top-user">
                        <div className="hub-avatar">{initial}</div>

                        <div className="hub-top-user-copy">
                            <strong>{displayName}</strong>
                            <span>Personal workspace</span>
                        </div>
                    </div>
                </header>

                <div className="hub-content">
                    <section className="hub-welcome">
                        <div>
                            <span className="hub-eyebrow">
                                YOUR DIGITAL SPACE
                            </span>

                            <h2>
                                Welcome back, {getFirstName(user?.name)}!
                            </h2>

                            <p>
                                Manage your identity and social profiles
                                from one place.
                            </p>
                        </div>

                        <div
                            className="hub-welcome-art"
                            aria-hidden="true"
                        >
                            <div className="hub-orbit orbit-one" />
                            <div className="hub-orbit orbit-two" />
                            <div className="hub-orbit orbit-three" />
                            <span>✦</span>
                        </div>
                    </section>

                    {error && (
                        <div className="hub-error" role="alert">
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                aria-label="Dismiss error"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {notice && (
                        <div className="hub-notice" role="status">
                            {notice}
                            <button
                                type="button"
                                onClick={() => setNotice("")}
                                aria-label="Dismiss notice"
                                style={{
                                    marginLeft: 12,
                                    border: 0,
                                    background: "transparent",
                                    color: "inherit",
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <section className="hub-stats">
                        <article className="hub-stat-card">
                            <div className="hub-stat-icon purple">◎</div>
                            <div>
                                <span>Connected accounts</span>
                                <strong>
                                    {loading ? "—" : connectedCount}
                                    <small> / 3</small>
                                </strong>
                            </div>
                        </article>

                        <article className="hub-stat-card">
                            <div className="hub-stat-icon green">✓</div>
                            <div>
                                <span>Account security</span>
                                <strong className="hub-stat-word">
                                    Protected
                                </strong>
                            </div>
                        </article>

                        <article className="hub-stat-card">
                            <div className="hub-stat-icon orange">♙</div>
                            <div>
                                <span>Profile</span>
                                <strong className="hub-stat-word">
                                    {user?.name && email
                                        ? "Complete"
                                        : "In progress"}
                                </strong>
                            </div>
                        </article>
                    </section>

                    <section
                        id="hub-integrations"
                        className="hub-section"
                    >
                        <div className="hub-section-heading">
                            <div>
                                <span className="hub-eyebrow">
                                    INTEGRATIONS
                                </span>

                                <h2>Your social accounts</h2>

                                <p>
                                    Connect your profiles and keep your
                                    digital identity organized.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="hub-refresh"
                                onClick={loadAccounts}
                                disabled={loading}
                            >
                                {loading ? "Checking..." : "↻ Refresh"}
                            </button>
                        </div>

                        <div className="hub-integration-grid">
                            {integrations.map((item) => {
                                const connected = isConnected(item.id);

                                return (
                                    <article
                                        className="hub-integration-card"
                                        key={item.id}
                                    >
                                        <div className="hub-card-top">
                                            <div
                                                className={`hub-social-icon ${item.className}`}
                                            >
                                                {item.icon}
                                            </div>

                                            <span
                                                className={`hub-status ${loading
                                                        ? "status-loading"
                                                        : connected
                                                            ? "status-connected"
                                                            : "status-disconnected"
                                                    }`}
                                            >
                                                <span className="hub-status-dot" />
                                                {loading
                                                    ? "Checking"
                                                    : connected
                                                        ? "Connected"
                                                        : "Not connected"}
                                            </span>
                                        </div>

                                        <h3>{item.name}</h3>
                                        <p>{item.description}</p>

                                        {connected && (
                                            <div className="hub-connected-note">
                                                <span>✓</span>
                                                Your account is linked
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className={`hub-connect-button ${connected
                                                    ? "hub-button-connected"
                                                    : ""
                                                }`}
                                            disabled={loading}
                                            onClick={() =>
                                                handleIntegrationClick(
                                                    item,
                                                    connected
                                                )
                                            }
                                        >
                                            {connected
                                                ? "Manage connection ↗"
                                                : `Connect ${item.name} →`}
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section
                        id="hub-profile"
                        className="hub-profile-section"
                    >
                        <div className="hub-section-heading">
                            <div>
                                <span className="hub-eyebrow">
                                    PERSONAL INFORMATION
                                </span>

                                <h2>Your profile</h2>

                                <p>
                                    Your account details associated with
                                    ProfileHub.
                                </p>
                            </div>
                        </div>

                        <div className="hub-profile-card">
                            <div className="hub-profile-avatar">
                                {initial}
                            </div>

                            <div className="hub-profile-details">
                                <span className="hub-profile-label">
                                    FULL NAME
                                </span>
                                <strong>
                                    {user?.name || "Name not provided"}
                                </strong>

                                <span className="hub-profile-label">
                                    EMAIL ADDRESS
                                </span>
                                <strong>
                                    {email || "Email not available"}
                                </strong>
                            </div>

                            <span className="hub-profile-badge">
                                Personal account
                            </span>
                        </div>
                    </section>

                    <section className="hub-extra-section">
                        <div>
                            <h2>More profile links</h2>
                            <p>
                                Add your other public profiles, websites,
                                and portfolio links.
                            </p>
                        </div>

                        <a
                            href="#hub-linked"
                            className="hub-secondary-link"
                        >
                            Manage links →
                        </a>
                    </section>

                    <section
                        id="hub-linked"
                        className="hub-linked-accounts"
                    >
                        <LinkedAccounts />
                    </section>

                    <footer className="hub-footer">
                        <span>
                            © {new Date().getFullYear()} ProfileHub
                        </span>
                        <span>
                            One place for your digital identity.
                        </span>
                    </footer>
                </div>
            </section>
        </main>
    );
}
