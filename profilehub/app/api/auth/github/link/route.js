import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getLoggedInUser } from "../../../../../lib/auth";

export async function GET(request) {
    const user = await getLoggedInUser();

    if (!user?.id) {
        return NextResponse.redirect(
            new URL("/login?error=login_required", request.url)
        );
    }

    const {
        GITHUB_CLIENT_ID,
        GITHUB_REDIRECT_URI,
    } = process.env;

    if (!GITHUB_CLIENT_ID || !GITHUB_REDIRECT_URI) {
        return NextResponse.json(
            {
                success: false,
                message: "GitHub OAuth is not configured.",
            },
            { status: 500 }
        );
    }

    const state = randomBytes(32).toString("hex");

    const authorizationUrl = new URL(
        "https://github.com/login/oauth/authorize"
    );

    authorizationUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
    authorizationUrl.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI);
    authorizationUrl.searchParams.set("scope", "read:user user:email");
    authorizationUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set("github_link_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
    });

    return response;
}