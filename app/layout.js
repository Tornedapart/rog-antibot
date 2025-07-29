import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
    variable: "--font-assistant",
    subsets: ["latin"],
    display: "swap", // optional: improves rendering behavior
});

export const metadata = {
    title: `ROG Antibot #Home`,
    description: `ROG Antibot is a powerful, developer-friendly antibot security platform designed to detect, block, and filter malicious traffic including bots, proxies, VPNs, and suspicious IPs.`,
    keywords: ['antibot', 'security', 'ip filtering', 'bot protection', 'proxy detection', 'vpn detection', 'web security', 'ROG Antibot', 'traffic filtering', 'threat mitigation'],
    openGraph: {
        siteName: 'ROG Antibot',
        title: `ROG Antibot | Advanced Web Security & Bot Protection`,
        description: `ROG Antibot helps secure your web applications with intelligent bot detection, IP analysis, and advanced traffic filtering. Protect your platform from abuse and unauthorized access.`,
        url: 'https://rog-antibot.vercel.app',
        type: 'website',
        images: [
            {
                url: '/rog.svg',
                width: 1200,
                height: 630,
                alt: `ROG Antibot Featured Security System`,
            },
            {
                url: '/rog.svg',
                width: 800,
                height: 800,
                alt: `ROG Antibot Shield Icon`,
            },
            {
                url: '/rog.svg',
                width: 800,
                height: 800,
                alt: `ROG Antibot Logo`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `ROG Antibot | Advanced Web Security & Bot Protection`,
        description: `Fortify your website with ROG Antibot — the next-gen solution for detecting bots, filtering proxies/VPNs, and managing traffic security with precision.`,
        images: '/rog.svg',
    },
    /*facebook: {
        appId: 'your-facebook-app-id',
    },*/
};


export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${assistant.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    );
}
