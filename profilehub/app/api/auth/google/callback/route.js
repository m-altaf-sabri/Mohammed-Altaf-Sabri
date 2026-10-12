
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getLoggedInUser } from "../../../../../../lib/auth";
import { getUsersCollection } from "../../../../../../lib/models/User";

export async function GET(request) {
    const appUrl = new URL(request.url).origin;
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const returnedError = searchParams.get("error");
    const signedState = request.cookies.get("google_link_state")?.value;

    const redirectWithError = (message) => {
        const response = NextResponse.redirect(
            new URL(
                `/dashboard?google_link_error=${encodeURIComponent(message)}`,
                appUrl
            )
        );

        response.cookies.set("google_link_state", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    };

    if (returnedError || !code || !state || !signedState) {
        return redirectWithError("google_link_cancelled");
    }

    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        JWT_SECRET,
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !JWT_SECRET) {
        return redirectWithError("server_configuration");
    }

    try {
        // Verify the signed state and ensure it belongs to this linking flow.
        const stateData = jwt.verify(signedState, JWT_SECRET);

        if (
            typeof stateData !== "object" ||
            !stateData ||
            stateData.purpose !== "google_account_link" ||
            stateData.state !== state
        ) {
            return redirectWithError("invalid_oauth_state");
        }

        // The same ProfileHub user must still be signed in.
        const currentUser = await getLoggedInUser();

        if (
            !currentUser?.id ||
            currentUser.id !== stateData.userId
        ) {
            return redirectWithError("login_required");
        }

        const callbackUrl = new URL(
            "/api/auth/google/link/callback",
            request.url
        ).toString();

        const oauthClient = new OAuth2Client(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            callbackUrl
        );

        const { tokens } = await oauthClient.getToken(code);

        if (!tokens.id_token) {
            return redirectWithError("google_verification_failed");
        }

        const ticket = await oauthClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID,
        });

        const googleUser = ticket.getPayload();

        if (
            !googleUser?.sub ||
            !googleUser.email ||
            !googleUser.email_verified
        ) {
            return redirectWithError("google_email_not_verified");
        }

        if (!ObjectId.isValid(currentUser.id)) {
            return redirectWithError("invalid_profilehub_user");
        }

        const users = await getUsersCollection();
        const profileHubUserId = new ObjectId(currentUser.id);

        const profileHubUser = await users.findOne({
            _id: profileHubUserId,
        });

        if (!profileHubUser) {
            return redirectWithError("profilehub_user_not_found");
        }

        // Refuse to replace a different Google identity already linked here.
        if (
            profileHubUser.googleId &&
            profileHubUser.googleId !== googleUser.sub
        ) {
            return redirectWithError("another_google_account_linked");
        }

        // Refuse to link a Google identity owned by another ProfileHub user.
        const existingGoogleOwner = await users.findOne({
            googleId: googleUser.sub,
        });

        if (
            existingGoogleOwner &&
            existingGoogleOwner._id.toString() !== currentUser.id
        ) {
            return redirectWithError("google_account_already_linked");
        }

        await users.updateOne(
            { _id: profileHubUserId },
            {
                $set: {
                    googleId: googleUser.sub,
                    googleEmail: googleUser.email.trim().toLowerCase(),
                },
            }
        );

        const response = NextResponse.redirect(
            new URL("/dashboard?google_linked=success", appUrl)
        );

        response.cookies.set("google_link_state", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error("Google account linking failed:", error);
        return redirectWithError("google_link_failed");
    }
}
