import { getIronSession } from "iron-session";

const sessionOptions = {
    cookieName: "rog_antibot_session",
    password: process.env.SESSION_PASSWORD || "complex_password_at_least_32_characters_long",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
};

export default async function logoutRoute(req, res) {
    const session = await getIronSession(req, res, sessionOptions);
    await session.destroy();
    res.status(200).json({ success: true });
}
