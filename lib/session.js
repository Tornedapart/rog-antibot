export const sessionOptions = {
    password: process.env.SESSION_PASSWORD || "complex_password_at_least_32_characters_long",
    cookieName: "rog_antibot_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
};
