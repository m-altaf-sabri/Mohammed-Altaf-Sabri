import { NextResponse } from "next/server";
import { getLoggedInUser } from "../../../lib/auth";

export async function GET() {
    const user = await getLoggedInUser();

    if (!user?.id) {
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }

    return NextResponse.json({
        authenticated: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
}
