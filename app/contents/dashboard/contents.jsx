"use client";
import React, { useEffect, useState, useRef } from "react";
import JSZip from "jszip";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import VisitorSummaryModal from "@/app/components/sumarryModal";
import ManageConfigModal from "@/app/components/ManageConfigModal";
import RogLoading from "@/app/components/loading";

// Logout API helper
async function logout(router, setLogoutLoading) {
	setLogoutLoading(true);
	await fetch("/api/logout", { method: "POST" });
	router.replace("/");
}

export default function DashboardPageContents() {
	const [showRightClickMessage, setShowRightClickMessage] = useState(false);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [logoutLoading, setLogoutLoading] = useState(false);
	const [showConfig, setShowConfig] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const [config, setConfig] = useState({
		allowCountries: "",
		allowUserAgents: "",
		blockMessage: "",
		bridgeDomain: "",
		mainSite: "",
		shortlinkPath: Math.random().toString(36).slice(2, 8),
	});
	// Drawer state: null | 'actions'
	const [drawer, setDrawer] = useState(null);
	const drawerRef = React.useRef(null);
	const [copied, setCopied] = useState(false);
	const [timeLeft, setTimeLeft] = useState(null);
	const intervalRef = useRef();
	const router = useRouter();

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const res = await fetch("/api/me");
				if (!res.ok) {
					router.replace("/login");
					return;
				}
				const data = await res.json();
				setUser(data.user);
				// Always fetch createdAt from users.json via API (persisted)
				const userRes = await fetch(
					`/api/userinfo?user=${encodeURIComponent(data.user.user)}`
				);
				const userInfo = await userRes.json();
				let createdAt = userInfo.createdAt;
				let subDays = userInfo.days;
				let subMinutes = userInfo.minutes;
				if (!subDays && !subMinutes) {
					setTimeLeft({ unlimited: true });
				} else {
					// Live countdown with Jakarta expiry time
					function updateCountdown() {
						let created = new Date(createdAt);
						if (isNaN(created.getTime())) created = new Date();
						const now = new Date();
						let expiry;
						if (subDays) {
							expiry = new Date(
								created.getTime() + subDays * 24 * 60 * 60 * 1000
							);
						} else if (subMinutes) {
							expiry = new Date(created.getTime() + subMinutes * 60 * 1000);
						}
						let diff = expiry - now;
						if (diff <= 0) {
							// Expired: redirect to login
							if (intervalRef.current) clearInterval(intervalRef.current);
							router.replace("/login");
							return;
						}
						const days = Math.floor(diff / (1000 * 60 * 60 * 24));
						const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
						const minutes = Math.floor((diff / (1000 * 60)) % 60);
						const seconds = Math.floor((diff / 1000) % 60);
						// Format expiry in Asia/Jakarta for display
						const expiryJakarta = expiry.toLocaleString("en-US", {
							timeZone: "Asia/Jakarta",
							hour: "2-digit",
							minute: "2-digit",
							hour12: true,
						});
						setTimeLeft({ days, hours, minutes, seconds, expiryJakarta });
					}
					updateCountdown();
					if (intervalRef.current) clearInterval(intervalRef.current);
					intervalRef.current = setInterval(updateCountdown, 1000);
				}
			} catch {
				router.replace("/login");
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [router]);

	useEffect(() => {
		if (!drawer) return;
		let ignoreClick = false;
		function handle(e) {
			if (e.target.closest("[data-drawer-toggle]")) {
				ignoreClick = true;
				return;
			}
			if (drawerRef.current && !drawerRef.current.contains(e.target)) {
				setDrawer(null);
			}
		}
		document.addEventListener("mousedown", handle);
		return () => {
			document.removeEventListener("mousedown", handle);
		};
	}, [drawer]);

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

	if (loading || !user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
				<RogLoading />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a] text-white">
			<header className="bg-[#0a0a0a]">
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
				<AnimatePresence>
					{drawer === "actions" && (
						<motion.div
							layout
							ref={drawerRef}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5 }}
							className="fixed left-0 items-center top-0 w-full h-full z-40 bg-[#0a0a0a] p-8 flex flex-col gap-6 animate-fade-in"
							style={{ boxShadow: "8px 0 32px 0 rgba(0,0,0,0.4)" }}
						>
							<div className="flex md:flex-row flex-col items-center justify-center gap-4 w-full h-screen">
								<button
									className="absolute right-3 md:right-5 lg:right-5 xl:right-5 top-10 text-white hover:text-red-700 hover:scale-140 transition-all duration-200 text-xl xl:text-2xl cursor-pointer"
									onClick={() => setDrawer(null)}
									aria-label="Close drawer"
								>
									&times;
								</button>
								<button
									className="text-left"
									onClick={async () => {
										if (!user?.apiKey) return;
										const res = await fetch(
											`/api/visitors?apiKey=${user.apiKey}`
										);
										const data = await res.json();
										window.visitorSummary = data.visitors;
										window.dispatchEvent(new CustomEvent("showVisitorSummary"));
										setDrawer(null);
									}}
								>
									<span className="relative inline-block group cursor-pointer">
										VISITORS
										<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
									</span>
								</button>
								<button
									className="text-left"
									onClick={async () => {
										try {
											const [phpTemplate, htaccessTemplate, htmlTemplate] =
												await Promise.all([
													fetch("/index.php.template").then((r) => r.text()),
													fetch("/htaccess.template").then((r) => r.text()),
													fetch("/404.html.template").then((r) => r.text()),
												]);

											const zip = new JSZip();
											zip.file("index.php", phpTemplate);
											zip.file(".htaccess", htaccessTemplate);
											zip.file("404.html", htmlTemplate);

											const blob = await zip.generateAsync({ type: "blob" });
											const url = URL.createObjectURL(blob);
											const a = document.createElement("a");
											a.href = url;
											a.download = "rog-antibot.zip";
											document.body.appendChild(a);
											a.click();

											setTimeout(() => {
												document.body.removeChild(a);
												URL.revokeObjectURL(url);
											}, 100);
										} catch (err) {
											console.error("Download error:", err);
											alert("An error occurred while creating the ZIP.");
										}
									}}
								>
									<span className="relative inline-block group cursor-pointer">
										DOWNLOAD ROG ANTIBOT
										<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
									</span>
								</button>
								<button
									className="text-left"
									onClick={async () => {
										if (!user?.apiKey) return;
										const res = await fetch(
											`/api/config?apiKey=${user.apiKey}`
										);
										const data = await res.json();
										setConfig(data.config);
										setShowConfig(true);
										setDrawer(null);
									}}
								>
									<span className="relative inline-block group cursor-pointer">
										CONFIGS
										<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
									</span>
								</button>
							</div>
							<div className="flex items-center justify-center mt-4">
								<div className="absolute top-20 left-auto flex items-center justify-center">
									<motion.div
										layout
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.5 }}
										className="flex flex-col items-center"
									>
										<span
											className={`tracking-widest break-all rounded font-bold font-mono text-yellow-600 hover:text-2xl text-base md:text-xl transition-all duration-300 cursor-pointer ${
												copied ? "opacity-0" : ""
											}`}
											onClick={() => {
												if (user?.apiKey) {
													navigator.clipboard.writeText(user.apiKey);
													setCopied(true);
													setTimeout(() => setCopied(false), 1500);
												}
											}}
											title="Copy API Key"
										>
											{user.user.toUpperCase()}
										</span>

										<button
											className="text-left"
											onClick={() => logout(router, setLogoutLoading)}
											disabled={logoutLoading}
										>
											{logoutLoading && (
												<div
													className={`absolute top-10 left-2 inline-block group cursor-pointer mt-1`}
												>
													<RogLoading />
												</div>
											)}
											<span
												className={`inline-block group cursor-pointer mt-1 text-base md:text-sm ${
													logoutLoading ? "opacity-0" : ""
												}`}
											>
												LOG OUT
												<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
											</span>
										</button>
									</motion.div>
									<div>
										{copied && (
											<AnimatePresence>
												<motion.div
													layout
													className="absolute top-2 -left-[10px] md:-left-[14px] w-max flex gap-4"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{ duration: 0.5 }}
													style={{
														background: "#0a0a0a",
														backdropFilter: "blur(2px)",
													}}
												>
													<span className="text-green-600 text-xs animate-fade-in text-center font-bold">
														APIKEY COPIED
													</span>
												</motion.div>
											</AnimatePresence>
										)}
									</div>
								</div>
								{timeLeft &&
									(timeLeft.unlimited ? (
										<span className="ml-2 px-2 py-1 rounded bg-blue-700 text-xs font-mono">
											UNLIMITED ACCESS
										</span>
									) : (
										<>
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.3 }}
												className={
													timeLeft.days <= 1
														? "absolute top-50 flex items-center font-mono cursor-pointer text-red-700"
														: "absolute top-50 flex items-center font-mono font-semibold cursor-pointer text-green-600"
												}
											>
												<div>
													<span
														className={`animate-pulse flex items-center justify-center text-center hover:text-white transition-all duration-200 font-semibold text-sm xl:text-xl ${
															showDetails ? "hidden" : ""
														}`}
														onClick={() => setShowDetails(!showDetails)}
														title="Show Countdown"
													>
														{(() => {
															// Show expiry time with month and day
															const now = new Date();
															// Reconstruct expiry date from countdown
															const expiry = new Date(
																now.getTime() +
																	timeLeft.days * 24 * 60 * 60 * 1000 +
																	timeLeft.hours * 60 * 60 * 1000 +
																	timeLeft.minutes * 60 * 1000 +
																	timeLeft.seconds * 1000
															);
															const options = {
																month: "short",
																day: "numeric",
																timeZone: "Asia/Jakarta",
															};
															const monthDay = expiry.toLocaleDateString(
																"en-US",
																options
															);
															return `[ EXPIRES : ${timeLeft.expiryJakarta}, ${monthDay} - JAKARTA TIME (WIB) ]`;
														})()}
													</span>
												</div>
											</motion.div>
											<div className="min-h-[1.8rem] absolute top-50 animate-pulse">
												<AnimatePresence mode="wait">
													{showDetails && (
														<motion.div
															layout
															key="countdown"
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															exit={{ opacity: 0 }}
															transition={{ duration: 0.3 }}
															className={
																timeLeft.days <= 1
																	? "flex text-center justify-center items-center font-mono font-semibold cursor-pointer text-red-700 text-base xl:text-xl"
																	: "flex text-center justify-center items-center font-mono font-semibold cursor-pointer text-green-600 text-base xl:text-xl"
															}
															onClick={() => setShowDetails(false)}
														>
															<span className="hover:text-white transition-all duration-200">
																[ {timeLeft.days}d {timeLeft.hours}h{" "}
																{timeLeft.minutes}m {timeLeft.seconds}s BEFORE
																API EXPIRED ]
															</span>
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										</>
									))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</header>
			<main className="flex min-h-screen items-center justify-center mx-auto max-w-max">
				<div className="flex justify-center items-center">
					<div className="flex flex-col items-center justify-center p-6 rounded-lg shadow-lg gap-10">
						<div className="absolute top-10 left-1/2 md:left-30 transform -translate-x-1/2 flex items-center justify-center">
							<h1>
								Welcome,{" "}
								<span className="font-bold text-yellow-600">
									{user.user.toUpperCase()}
								</span>
								!
							</h1>
						</div>

						<AnimatePresence>
							{drawer !== "actions" && (
								<motion.div
									key="loader-button"
									initial={{ opacity: 0, scale: 0 }}
									animate={{ opacity: 1, scale: 3.5 }}
									exit={{ opacity: 0, scale: 0 }}
									transition={{ duration: 0.4 }}
								>
									<button
										onClick={() =>
											setDrawer(drawer === "actions" ? null : "actions")
										}
										className={`absolute -top-10 -left-6 cursor-pointer hover:scale-110 transition duration-200`}
									>
										<RogLoading />
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</main>
			<VisitorSummaryModal />
			<ManageConfigModal
				open={showConfig}
				onClose={() => setShowConfig(false)}
				config={config}
				onChange={setConfig}
				onSave={async () => {
					if (!user?.apiKey) return;
					await fetch("/api/config", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ apiKey: user.apiKey, config }),
					});
					setShowConfig(false);
				}}
			/>
		</div>
	);
}
