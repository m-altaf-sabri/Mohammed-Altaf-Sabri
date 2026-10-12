import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getLoggedInUser } from "../../../../../../lib/auth";
import { getUsersCollection } from "../../../../../../lib/models/User";

export async function GET(request) {
    const appUrl = new URL(request.url).origin;
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const returnedError = searchParams.get("error");
    const savedState = request.cookies.get("github_link_state")?.value;

    const redirectWithError = (message) => {
        const response = NextResponse.redirect(
            new URL(
                `/ dashboard ? github_link_error = ${ encodeURIComponent(message) } `,
                appUrl
            )
        );

        response.cookies.set("github_link_state", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    };

    if (returnedError || !code || !state || !savedState) {
        return redirectWithError("github_link_cancelled");
    }

    if (state !== savedState) {
        return redirectWithError("invalid_oauth_state");
    }

    const {
        GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET,
    } = process.env;

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return redirectWithError("server_configuration");
    }

    try {
        // Confirm the user is still logged in.
        const currentUser = await getLoggedInUser();

        if (!currentUser?.id || !ObjectId.isValid(currentUser.id)) {
            return redirectWithError("login_required");
        }

        // Exchange the authorization code for a GitHub access token.
        const tokenResponse = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code,
                }),
                cache: "no-store",
            }
        );

        if (!tokenResponse.ok) {
            return redirectWithError("github_token_exchange_failed");
        }

        const tokenData = await tokenResponse.json();

        if (tokenData.error || !tokenData.access_token) {
            return redirectWithError("github_token_exchange_failed");
        }

        const githubHeaders = {
            Authorization: `Bearer ${ tokenData.access_token } `,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        };

        // Fetch the authenticated GitHub profile.
        const profileResponse = await fetch(
            "https://api.github.com/user",
            {
                headers: githubHeaders,
                cache: "no-store",
            }
        );

        if (!profileResponse.ok) {
            return redirectWithError("github_profile_failed");
        }

        const githubProfile = await profileResponse.json();

        if (!githubProfile.id) {
            return redirectWithError("github_profile_failed");
        }

        // Fetch verified email when available.
        let githubEmail = null;

        const emailResponse = await fetch(
            "https://api.github.com/user/emails",
            {
                headers: githubHeaders,
                cache: "no-store",
            }
        );

        if (emailResponse.ok) {
            const emails = await emailResponse.json();

            if (Array.isArray(emails)) {
                const primaryVerifiedEmail = emails.find(
                    (email) => email.primary && email.verified
                );

                const verifiedEmail = emails.find(
                    (email) => email.verified
                );

                githubEmail =
                    primaryVerifiedEmail?.email ||
                    verifiedEmail?.email ||
                    null;
            }
        }

        const users = await getUsersCollection();
        const profileHubUserId = new ObjectId(currentUser.id);

        const profileHubUser = await users.findOne({
            _id: profileHubUserId,
        });

        if (!profileHubUser) {
            return redirectWithError("profilehub_user_not_found");
        }

        const githubId = String(githubProfile.id);

        // Prevent linking a GitHub account already owned by another user.
        const existingOwner = await users.findOne({
            githubId,
        });

        if (
            existingOwner &&
            existingOwner._id.toString() !== currentUser.id
        ) {
            return redirectWithError("github_account_already_linked");
        }

        // Prevent replacing a different GitHub account already linked here.
        if (
            profileHubUser.githubId &&
            String(profileHubUser.githubId) !== githubId
        ) {
            return redirectWithError("another_github_account_linked");
        }

        await users.updateOne(
            { _id: profileHubUserId },
            {
                $set: {
                    githubId,
                    githubUsername: githubProfile.login || null,
                    githubName: githubProfile.name || null,
                    githubEmail,
                    githubProfileUrl: githubProfile.html_url || null,
                    githubLinkedAt: new Date(),
                },
            }
        );

        const response = NextResponse.redirect(
            new URL("/dashboard?github_linked=success", appUrl)
        );

        response.cookies.set("github_link_state", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error("GitHub account linking failed:", error);
        return redirectWithError("github_link_failed");
    }
}
