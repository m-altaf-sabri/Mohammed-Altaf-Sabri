
"use client";

import { useEffect, useState } from "react";

const PLATFORMS = [
    "LinkedIn",
    "GitHub",
    "Instagram",
    "Facebook",
    "X",
    "YouTube",
    "Website",
];

export default function LinkedAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [platform, setPlatform] = useState("LinkedIn");
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [removingId, setRemovingId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function loadAccounts() {
        setError("");

        try {
            const response = await fetch("/api/linked-accounts");
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not load accounts.");
                return;
            }

            setAccounts(data.accounts || []);
        } catch {
            setError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAccounts();
    }, []);

    async function handleAdd(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        const cleanUrl = url.trim();

        if (!cleanUrl) {
            setError("Enter your profile URL.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/linked-accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform, url: cleanUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not add this link.");
                return;
            }

            setAccounts((current) => [...current, data.account]);
            setUrl("");
            setMessage("Account link added successfully.");
        } catch {
            setError("Unable to connect to the server.");
        } finally {
            setSaving(false);
        }
    }

    async function handleRemove(id) {
        setError("");
        setMessage("");
        setRemovingId(id);

        try {
            const response = await fetch("/api/linked-accounts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not remove this link.");
                return;
            }

            setAccounts((current) =>
                current.filter((account) => account.id !== id)
            );
            setMessage("Account link removed.");
        } catch {
            setError("Unable to connect to the server.");
        } finally {
            setRemovingId("");
        }
    }

    return (
        <section className="linked-accounts">
            <div className="linked-accounts-heading">
                <div>
                    <p className="linked-accounts-eyebrow">YOUR CONNECTIONS</p>
                    <h2>Linked accounts</h2>
                    <p className="linked-accounts-description">
                        Keep your social profiles and website links together.
                    </p>
                </div>
                <span className="linked-accounts-count">
                    {accounts.length} / 20
                </span>
            </div>

            {message && (
                <p className="linked-accounts-success" role="status">
                    {message}
                </p>
            )}

            {error && (
                <p className="linked-accounts-error" role="alert">
                    {error}
                </p>
            )}

            <form className="linked-accounts-form" onSubmit={handleAdd}>
                <label htmlFor="linked-platform">Platform</label>
                <select
                    id="linked-platform"
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                >
                    {PLATFORMS.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>

                <label htmlFor="linked-url">Profile URL</label>
                <input
                    id="linked-url"
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    maxLength={2048}
                    required
                />

                <button
                    className="linked-accounts-add"
                    type="submit"
                    disabled={saving || accounts.length >= 20}
                >
                    {saving ? "Adding..." : "Add account"}
                </button>
            </form>

            <div className="linked-accounts-list">
                <h3>Your saved links</h3>

                {loading ? (
                    <p>Loading your links...</p>
                ) : accounts.length === 0 ? (
                    <p className="linked-accounts-empty">
                        No links yet. Add your first social profile above.
                    </p>
                ) : (
                    accounts.map((account) => (
                        <article
                            className="linked-account-item"
                            key={account.id}
                        >
                            <div className="linked-account-info">
                                <span className="linked-account-platform">
                                    {account.platform}
                                </span>
                                <a
                                    href={account.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {account.url}
                                </a>
                            </div>

                            <button
                                className="linked-account-remove"
                                type="button"
                                disabled={removingId === account.id}
                                onClick={() => handleRemove(account.id)}
                                aria-label={`Remove ${account.platform} link`}
                            >
                                {removingId === account.id
                                    ? "Removing..."
                                    : "Remove"}
                            </button>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
}
