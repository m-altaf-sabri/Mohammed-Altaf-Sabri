
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";

export async function GET() {
    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI,
    } = process.env;

    if (
        !GOOGLE_CLIENT_ID ||
        !GOOGLE_CLIENT_SECRET ||
        !GOOGLE_REDIRECT_URI
    ) {
        return NextResponse.json(
            {
                success: false,
                message: "Google OAuth is not configured.",
            },
            { status: 500 }
        );
    }

    const state = randomBytes(32).toString("hex");

    const oauthClient = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    const authorizationUrl = oauthClient.generateAuthUrl({
        access_type: "online",
        scope: ["openid", "email", "profile"],
        state,
        prompt: "select_account",
    });

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set("google_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
    });

    return response;
}
