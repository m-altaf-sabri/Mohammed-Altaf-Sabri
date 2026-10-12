
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { getLoggedInUser } from "../../../../../lib/auth";

export async function GET(request) {
    const user = await getLoggedInUser();

    if (!user?.id) {
        return NextResponse.redirect(
            new URL("/login?error=login_required", request.url)
        );
    }

    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        JWT_SECRET,
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !JWT_SECRET) {
        return NextResponse.json(
            { success: false, message: "Google OAuth is not configured." },
            { status: 500 }
        );
    }

    const state = randomBytes(32).toString("hex");

    const callbackUrl = new URL(
        "/api/auth/google/link/callback",
        request.url
    ).toString();

    const oauthClient = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        callbackUrl
    );

    const authorizationUrl = oauthClient.generateAuthUrl({
        access_type: "online",
        scope: ["openid", "email", "profile"],
        state,
        prompt: "select_account",
    });

    // Sign both the OAuth state and the current ProfileHub user ID.
    const signedState = jwt.sign(
        { state, userId: user.id, purpose: "google_account_link" },
        JWT_SECRET,
        { expiresIn: "10m" }
    );

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set("google_link_state", signedState, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
    });

    return response;
}
