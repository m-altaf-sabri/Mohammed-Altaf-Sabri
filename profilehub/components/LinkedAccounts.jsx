"use client";

import { useEffect, useState } from "react";



const STORAGE_KEY = "profilehub_public_links";

const emptyLink = {
    title: "",
    url: "",
    platform: "Website",
};

const platforms = [
    "Website",
    "Google",
    "GitHub",
    "LinkedIn",
    "Instagram",
    "YouTube",
    "Other",
];

function normalizeUrl(value) {
    const trimmed = value.trim();

    if (!trimmed) return null;

    try {
        const url = new URL(
            /^https?:\/\//i.test(trimmed)
                ? trimmed
                : `https://${trimmed}`
        );

        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }

        return url.href;
    } catch {
        return null;
    }
}

export default function LinkedAccounts() {
    const [links, setLinks] = useState([]);
    const [form, setForm] = useState(emptyLink);
    const [message, setMessage] = useState("");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);

            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) setLinks(parsed);
            }
        } catch {
            setMessage("Unable to load saved profile links.");
        } finally {
            setLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!loaded) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
        } catch {
            setMessage("Unable to save links in this browser.");
        }
    }, [links, loaded]);

    function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        const title = form.title.trim();
        const url = normalizeUrl(form.url);

        if (!title || !url) {
            setMessage("Enter a title and a valid website URL.");
            return;
        }

        setLinks((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                title,
                url,
                platform: form.platform,
            },
        ]);

        setForm(emptyLink);
        setMessage("Profile link added successfully.");
    }

    function removeLink(id) {
        setLinks((current) => current.filter((link) => link.id !== id));
        setMessage("Profile link removed.");
    }

    return (
        <section className="linked-accounts">
            <div className="linked-accounts-heading">
                <div>
                    <span className="hub-kicker">YOUR PROFILE LINKS</span>
                    <h3>Manage your links</h3>
                    <p>
                        Add public profiles and websites to keep everything
                        organized in one place.
                    </p>
                </div>

                <span className="linked-count">
                    {links.length} {links.length === 1 ? "link" : "links"}
                </span>
            </div>

            <form className="linked-account-form" onSubmit={handleSubmit}>
                <label>
                    Link title
                    <input
                        type="text"
                        value={form.title}
                        onChange={(event) =>
                            setForm({ ...form, title: event.target.value })
                        }
                        placeholder="My portfolio"
                        maxLength={80}
                        required
                    />
                </label>

                <label>
                    Platform
                    <select
                        value={form.platform}
                        onChange={(event) =>
                            setForm({ ...form, platform: event.target.value })
                        }
                    >
                        {platforms.map((platform) => (
                            <option key={platform} value={platform}>
                                {platform}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="linked-url-field">
                    Profile URL
                    <input
                        type="text"
                        value={form.url}
                        onChange={(event) =>
                            setForm({ ...form, url: event.target.value })
                        }
                        placeholder="https://example.com/my-profile"
                        maxLength={2048}
                        required
                    />
                </label>

                <button className="linked-add-button" type="submit">
                    Add link <span aria-hidden="true">+</span>
                </button>
            </form>

            {message && (
                <p className="hub-notice" role="status">
                    {message}
                </p>
            )}

            <div className="linked-accounts-list">
                {links.length === 0 ? (
                    <div className="linked-empty">
                        <span aria-hidden="true">↗</span>
                        <h4>No profile links yet</h4>
                        <p>Add your first public profile or website above.</p>
                    </div>
                ) : (
                    links.map((link) => (
                        <article className="linked-account-item" key={link.id}>
                            <div className="linked-item-icon" aria-hidden="true">
                                ↗
                            </div>

                            <div className="linked-item-details">
                                <h4>{link.title}</h4>
                                <span>{link.platform}</span>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {link.url}
                                </a>
                            </div>

                            <div className="linked-item-actions">
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Open ${link.title} in a new tab`}
                                >
                                    Open
                                </a>

                                <button
                                    type="button"
                                    onClick={() => removeLink(link.id)}
                                    aria-label={`Remove ${link.title}`}
                                >
                                    Remove
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
}