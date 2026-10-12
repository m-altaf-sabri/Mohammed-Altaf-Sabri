import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define MONGODB_URI inside .env.local"
    );
}

let cached = global.mongoose || {
    conn: null,
    promise: null,
};

export async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI, {
                bufferCommands: false,
                serverSelectionTimeoutMS: 10000,
            })
            .then((instance) => instance)
            .catch((error) => {
                console.error(
                    "MongoDB connection failed:",
                    error
                );
                cached.promise = null;
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
        global.mongoose = cached;
        console.log("MongoDB connected successfully");
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        throw error;
    }
}