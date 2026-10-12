"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);


      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const responseText = await response.text();

      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error("Non-JSON response from registration API:", responseText);
        setError("The server returned an invalid response. Check the server terminal.");
        return;
      }

      if (!response.ok) {
        setError(data.message || `Registration failed (${response.status}).`);
        console.error("Registration failed:", response.status, data);
        return;
      }

      console.log("Registration successful:", data);

      alert("Account created successfully!");

      router.push("/login");
    } catch (error) {
      console.error(error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>

        <p>Join ProfileHub today</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegister}>
          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Google Sign-In */}
        <a
          href="/api/auth/google"
          className="google-login-button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.03 13.22l7.98 6.19C12.93 13.72 18.01 9.5 24 9.5Z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.62 5.91c4.45-4.12 7.15-10.2 7.15-17.56Z"
            />
            <path
              fill="#FBBC05"
              d="M10.99 28.59A14.4 14.4 0 0 1 10.25 24c0-1.59.27-3.13.74-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.55 3.03 10.78l7.96-6.19Z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.42-4.84 2.27-8.28 2.27-5.99 0-11.07-4.22-12.99-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
            />
          </svg>
          Continue with Google
        </a>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}
