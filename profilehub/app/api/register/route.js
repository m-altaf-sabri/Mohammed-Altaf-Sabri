import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser } from "../../../lib/models/User";

export async function POST(request) {
    try {
        const body = await request.json();

        const name =
            typeof body.name === "string" ? body.name.trim() : "";
        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";
        const password =
            typeof body.password === "string" ? body.password : "";

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: "Name, email, and password are required." },
                { status: 400 }
            );
        }

        if (name.length > 100 || email.length > 254) {
            return NextResponse.json(
                { success: false, message: "Name or email is too long." },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, message: "Enter a valid email address." },
                { status: 400 }
            );
        }

        if (password.length < 8 || password.length > 72) {
            return NextResponse.json(
                { success: false, message: "Password must be 8–72 characters long." },
                { status: 400 }
            );
        }

        if (!process.env.JWT_SECRET) {
            return NextResponse.json(
                { success: false, message: "Server configuration error." },
                { status: 500 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await createUser({ name, email, passwordHash });

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const response = NextResponse.json(
            {
                success: true,
                message: "Account created successfully.",
                user,
            },
            { status: 201 }
        );

        response.cookies.set("profilehub_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        if (
            error.message === "EMAIL_ALREADY_EXISTS" ||
            error.code === 11000
        ) {
            return NextResponse.json(
                { success: false, message: "An account with this email already exists." },
                { status: 409 }
            );
        }

        console.error("Registration error:", error.message);

        return NextResponse.json(
            { success: false, message: "Unable to create account." },
            { status: 500 }
        );
    }
}