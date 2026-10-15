
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getLoggedInUser } from "../../../../../../lib/auth";
import { getUsersCollection } from "../../../../../../lib/models/User";

function redirectToRoot(request, key, value) {
  const destination = new URL("/", request.url);
  destination.searchParams.set(key, value);
  return NextResponse.redirect(destination);
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const returnedError = url.searchParams.get("error");
  const cookieState = request.cookies.get("github_link_state")?.value;

  function clearStateCookie(response) {
    response.cookies.set("github_link_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  if (returnedError) {
    return clearStateCookie(
      redirectToRoot(request, "github_link_failed", "cancelled")
    );
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    return clearStateCookie(
      redirectToRoot(request, "github_link_failed", "state")
    );
  }

  try {
    const user = await getLoggedInUser();

    if (!user?.id || !ObjectId.isValid(user.id)) {
      return clearStateCookie(
        NextResponse.redirect(new URL("/login", request.url))
      );
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return clearStateCookie(
        redirectToRoot(request, "github_link_failed", "config")
      );
    }

    const callbackUrl = new URL(
      "/api/auth/github/link/callback",
      request.url
    ).toString();

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: callbackUrl,
        }),
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GitHub token exchange failed:", {
        httpStatus: tokenResponse.status,
        error: tokenData.error ?? null,
        description: tokenData.error_description ?? null,
      });

      throw new Error(tokenData.error || "GITHUB_ACCESS_TOKEN_MISSING");
    }

    const githubHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const profileResponse = await fetch("https://api.github.com/user", {
      headers: githubHeaders,
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      throw new Error("GITHUB_PROFILE_FETCH_FAILED");
    }

    const githubProfile = await profileResponse.json();

    if (
      githubProfile.id == null ||
      typeof githubProfile.login !== "string" ||
      !githubProfile.login
    ) {
      throw new Error("GITHUB_PROFILE_INVALID");
    }

    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: githubHeaders,
      cache: "no-store",
    });

    let githubEmail = null;

    if (emailResponse.ok) {
      const emails = await emailResponse.json();

      const primaryVerified = Array.isArray(emails)
        ? emails.find((email) => email.primary && email.verified)
        : null;

      githubEmail =
        primaryVerified?.email?.trim().toLowerCase() ?? null;
    }

    const users = await getUsersCollection();
    const currentUserId = new ObjectId(user.id);
    const githubId = String(githubProfile.id);

    const currentProfile = await users.findOne({
      _id: currentUserId,
    });

    if (!currentProfile) {
      throw new Error("PROFILE_USER_NOT_FOUND");
    }

    const existingLink = await users.findOne({
      githubId,
      _id: { $ne: currentUserId },
    });

    if (existingLink) {
      return clearStateCookie(
        redirectToRoot(request, "github_link_failed", "already_linked")
      );
    }

    if (
      currentProfile.githubId &&
      String(currentProfile.githubId) !== githubId
    ) {
      return clearStateCookie(
        redirectToRoot(request, "github_link_failed", "account_conflict")
      );
    }

    const fieldsToSave = {
      githubId,
      githubUsername: githubProfile.login,
    };

    if (githubEmail) {
      fieldsToSave.githubEmail = githubEmail;
    }

    await users.updateOne(
      { _id: currentUserId },
      { $set: fieldsToSave }
    );

    return clearStateCookie(
      redirectToRoot(request, "github_linked", "success")
    );
  } catch (error) {
    console.error("GitHub account linking failed:", error.message);

    return clearStateCookie(
      redirectToRoot(request, "github_link_failed", "1")
    );
  }
}
