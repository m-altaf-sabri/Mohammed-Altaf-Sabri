import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getLoggedInUser } from "../../../../lib/auth";
import { getUsersCollection } from "../../../../lib/models/User";

export async function GET() {
  try {
    const currentUser = await getLoggedInUser();

    if (!currentUser?.id || !ObjectId.isValid(currentUser.id)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await getUsersCollection();

    const profile = await users.findOne(
      { _id: new ObjectId(currentUser.id) },
      {
        projection: {
          googleId: 1,
          googleEmail: 1,
          githubId: 1,
          githubUsername: 1,
          githubEmail: 1,
          linkedinId: 1,
          linkedinName: 1,
        },
      }
    );

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      google: {
        connected: Boolean(profile.googleId),
        id: profile.googleId ?? null,
        email: profile.googleEmail ?? null,
      },
      github: {
        connected: Boolean(profile.githubId),
        id: profile.githubId ?? null,
        username: profile.githubUsername ?? null,
        email: profile.githubEmail ?? null,
      },
      linkedin: {
        connected: Boolean(profile.linkedinId),
        id: profile.linkedinId ?? null,
        name: profile.linkedinName ?? null,
      },
    });
  } catch (error) {
    console.error("Linked account status error:", error);

    return NextResponse.json(
      { error: "Unable to load linked accounts" },
      { status: 500 }
    );
  }
}