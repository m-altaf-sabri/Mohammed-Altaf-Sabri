import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { getLoggedInUser } from "../../../lib/auth";
import { getUsersCollection } from "../../../lib/models/User";

const ALLOWED_PLATFORMS = [
    "LinkedIn",
    "GitHub",
    "Instagram",
    "Facebook",
    "X",
    "YouTube",
    "Website",
];

function validUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

export async function GET() {
    try {
        const user = await getLoggedInUser();

        if (!user || !ObjectId.isValid(user.id)) {
            return NextResponse.json(
                { message: "Please log in to view linked accounts." },
                { status: 401 }
            );
        }

        const users = await getUsersCollection();
        const account = await users.findOne(
            { _id: new ObjectId(user.id) },
            { projection: { linkedAccounts: 1 } }
        );

        if (!account) {
            return NextResponse.json(
                { message: "User account not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            accounts: account.linkedAccounts || [],
        });
    } catch (error) {
        console.error("Get linked accounts failed:", error);
        return NextResponse.json(
            { message: "Could not load linked accounts." },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const user = await getLoggedInUser();

        if (!user || !ObjectId.isValid(user.id)) {
            return NextResponse.json(
                { message: "Please log in to add an account." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const platform =
            typeof body.platform === "string" ? body.platform : "";
        const url =
            typeof body.url === "string" ? body.url.trim() : "";

        if (!ALLOWED_PLATFORMS.includes(platform)) {
            return NextResponse.json(
                { message: "Choose a supported platform." },
                { status: 400 }
            );
        }

        if (url.length > 2048 || !validUrl(url)) {
            return NextResponse.json(
                { message: "Enter a valid HTTP or HTTPS profile URL." },
                { status: 400 }
            );
        }

        const users = await getUsersCollection();
        const account = await users.findOne(
            { _id: new ObjectId(user.id) },
            { projection: { linkedAccounts: 1 } }
        );

        if (!account) {
            return NextResponse.json(
                { message: "User account not found." },
                { status: 404 }
            );
        }

        const currentAccounts = account.linkedAccounts || [];

        if (currentAccounts.length >= 20) {
            return NextResponse.json(
                { message: "You can add up to 20 linked accounts." },
                { status: 400 }
            );
        }

        const duplicate = currentAccounts.some(
            (item) =>
                item.platform === platform &&
                item.url.toLowerCase() === url.toLowerCase()
        );

        if (duplicate) {
            return NextResponse.json(
                { message: "That link has already been added." },
                { status: 409 }
            );
        }

        const newAccount = {
            id: randomUUID(),
            platform,
            url,
            createdAt: new Date(),
        };

        await users.updateOne(
            { _id: new ObjectId(user.id) },
            { $push: { linkedAccounts: newAccount } }
        );

        return NextResponse.json(
            { message: "Linked account added.", account: newAccount },
            { status: 201 }
        );
    } catch (error) {
        console.error("Add linked account failed:", error);
        return NextResponse.json(
            { message: "Could not add linked account." },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const user = await getLoggedInUser();

        if (!user || !ObjectId.isValid(user.id)) {
            return NextResponse.json(
                { message: "Please log in to remove an account." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const id = typeof body.id === "string" ? body.id : "";

        if (!id || id.length > 100) {
            return NextResponse.json(
                { message: "A valid linked account ID is required." },
                { status: 400 }
            );
        }

        const users = await getUsersCollection();

        const result = await users.updateOne(
            { _id: new ObjectId(user.id) },
            { $pull: { linkedAccounts: { id } } }
        );

        if (result.matchedCount !== 1) {
            return NextResponse.json(
                { message: "User account not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Linked account removed.",
        });
    } catch (error) {
        console.error("Remove linked account failed:", error);
        return NextResponse.json(
            { message: "Could not remove linked account." },
            { status: 500 }
        );
    }
}
