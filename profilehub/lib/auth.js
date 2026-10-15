import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getLoggedInUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("profilehub_token")?.value;

        if (!token) {
            console.error("Session cookie is missing.");
            return null;
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in auth helper.");
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (
            !decoded ||
            typeof decoded !== "object" ||
            typeof decoded.email !== "string" ||
            typeof decoded.id !== "string"
        ) {
            console.error("JWT payload is invalid.");
            return null;
        }

        return {
            id: decoded.id,
            name: typeof decoded.name === "string" ? decoded.name : "",
            email: decoded.email.trim().toLowerCase(),
        };
    } catch (error) {
        console.error("Session verification failed:", error.message);
        return null;
    }
}
