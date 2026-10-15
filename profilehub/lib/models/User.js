import clientpromise from "../mongodb";

export async function getUsersCollection() {
    const client = await clientpromise;

    const db = client.db("profilehub");

    return db.collection("users");
}


export async function createUser({ name, email, passwordHash }) {
    const users = await getUsersCollection();

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await users.findOne({
        email: normalizedEmail,
    });

    if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const result = await users.insertOne({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        linkedAccounts: [],
        createdAt: new Date(),
    });

    return {
        id: result.insertedId.toString(),
        name: name.trim(),
        email: normalizedEmail,
    };
}
