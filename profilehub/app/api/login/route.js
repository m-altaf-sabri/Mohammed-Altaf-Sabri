import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUsersCollection } from "../../../lib/models/User";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email and password are required.",
                },
                { status: 400 }
            );
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing.");

            return NextResponse.json(
                { success: false, message: "Server configuration error." },
                { status: 500 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const users = await getUsersCollection();

        const user = await users.findOne({
            email: normalizedEmail,
        });

        // Temporary diagnostic logs: never log passwords or hashes.
        console.log("Login email:", normalizedEmail);
        console.log("User found:", Boolean(user));
        console.log(
            "Password hash field is a string:",
            typeof user?.passwordHash === "string"
        );

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password.",
                },
                { status: 401 }
            );
        }

        if (
            typeof user.passwordHash !== "string" ||
            !user.passwordHash.startsWith("$2")
        ) {
            console.error(
                "User passwordHash is missing or is not a bcrypt hash."
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Account password configuration is invalid.",
                },
                { status: 500 }
            );
        }


        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        console.log("Password matched:", isPasswordValid);

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password.",
                },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const response = NextResponse.json({
            success: true,
            message: "Login successful.",
            user: {
                name: user.name,
                email: user.email,
            },
        });

        response.cookies.set("profilehub_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to log in. Please try again.",
            },
            { status: 500 }
        );
    }
}
