"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import RogLoading from "@/app/components/loading";
import { AnimatePresence, motion } from "framer-motion";

export default function LoginPageContents() {
	const [showRightClickMessage, setShowRightClickMessage] = useState(false);
	const [user, setUser] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const [loading, setLoading] = useState(false);
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Login failed");
			} else {
				// Check if expired before redirecting
				try {
					const userInfoRes = await fetch(
						`/api/userinfo?user=${encodeURIComponent(user)}`
					);
					const userInfo = await userInfoRes.json();
					let createdAt = userInfo.createdAt;
					let days = userInfo.days;
					let minutes = userInfo.minutes;
					let expired = false;
					if (createdAt && (days || minutes)) {
						let created = new Date(createdAt);
						let now = new Date();
						let expiry = null;
						if (minutes) {
							expiry = new Date(created.getTime() + minutes * 60 * 1000);
						} else if (days) {
							expiry = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
						}
						if (expiry && now > expiry) expired = true;
					}
					if (expired) {
						setError("Your subscription has expired.");
						setLoading(false);
						return;
					}
				} catch {
					setError("Could not verify subscription expiry.");
					setLoading(false);
					return;
				}
				setError("");
				window.location.href = "/dashboard";
			}
		} catch (err) {
			setError("Network error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const handleContextMenu = (e) => {
			e.preventDefault();
			setShowRightClickMessage(true);

			setTimeout(() => {
				setShowRightClickMessage(false);
			}, 2000);
		};

		document.addEventListener("contextmenu", handleContextMenu);
		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
		};
	}, []);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<AnimatePresence>
				{showRightClickMessage && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5 }}
						className="fixed flex items-center justify-center z-50 top-0 w-full h-full left-1/2 transform -translate-x-1/2 bg-black/90 text-red-700 font-bold text-base xl:text-2xl"
					>
						MAU NGAPAIN?
					</motion.div>
				)}
			</AnimatePresence>
			<AnimatePresence key={"login-page"}>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
					className="w-full max-w-xs mx-auto mt-16 p-8 border border-gray-200 rounded-lg shadow-md bg-black"
				>
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{ duration: 0.5 }}
						className="flex justify-between items-center mb-10"
					>
						<div className="text-2xl">LOGIN</div>
						<Link
							href="/"
							className="hover:scale-110 transition-transform duration-200"
						>
							<RogLoading />
						</Link>
					</motion.div>

					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{ duration: 0.5 }}
					>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block mb-1 font-medium">User</label>
								<input
									type="text"
									value={user}
									onChange={(e) => setUser(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
								/>
							</div>
							<div>
								<label className="block mb-1 font-medium">Key</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
								/>
							</div>
							{error && (
								<div className="text-red-700 text-sm">
									{error}
									{error === "Your subscription has expired." && (
										<>
											<br />
											<span>
												Contact{" "}
												<Link
													href="https://t.me/tornapartx"
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-400 underline"
												>
													Me
												</Link>
											</span>
										</>
									)}
								</div>
							)}
							<button
								type="submit"
								className={`cursor-pointer w-full py-2 font-bold tracking-wide text-white rounded hover:bg-red-800 transition disabled:opacity-50 ${
									loading ? "bg-black cursor-not-allowed" : "bg-red-700"
								}`}
								disabled={loading}
							>
								{loading ? (
									<span className="flex items-center justify-center">
										<RogLoading />
									</span>
								) : (
									"Login"
								)}
							</button>
						</form>
					</motion.div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
