import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getLoggedInUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("profilehub_token")?.value;

        if (!token || !process.env.JWT_SECRET) {
            return null;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (
            typeof decoded !== "object" ||
            !decoded ||
            typeof decoded.email !== "string"
        ) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}
