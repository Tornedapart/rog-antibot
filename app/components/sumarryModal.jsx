import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RogLoading from "./loading";

export default function VisitorSummaryModal() {
	const [open, setOpen] = useState(false);
	const [visitors, setVisitors] = useState([]);
	const [copied, setCopied] = useState(false);
	const [blockedIps, setBlockedIps] = useState([]);

	useEffect(() => {
		const handler = () => {
			const rawData = window.visitorSummary || [];
			const cloned = JSON.parse(JSON.stringify(rawData));
			setVisitors(cloned);
			setOpen(true);
			fetchBlockedIps();
		};
		window.addEventListener("showVisitorSummary", handler);
		return () => window.removeEventListener("showVisitorSummary", handler);
	}, []);

	const fetchBlockedIps = async () => {
		const res = await fetch("/api/blockedIps");
		const data = await res.json();
		setBlockedIps(data);
	};

	const handleClose = () => setOpen(false);

	const formatTime = (input) => {
		try {
			if (!input) return "";
			const date = new Date(input);
			if (isNaN(date)) return input;
			return date.toLocaleString();
		} catch {
			return input;
		}
	};

	const clearBlockedIps = async () => {
		if (!window.confirm("Delete all blocked IPs?")) return;
		await fetch("/api/blockedIps", {
			method: "DELETE",
		});
		setBlockedIps([]);
	};

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					layout
					className="fixed inset-0 z-40 w-full flex justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
					style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
				>
					<motion.div
						className="bg-[#0a0a0a] text-white w-full p-6 relative overflow-auto"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5 }}
					>
						<button
							className="absolute top-3 right-6 text-2xl text-white hover:text-red-700 hover:scale-140 transition-all duration-200 focus:outline-none cursor-pointer"
							onClick={handleClose}
							aria-label="Close visitor summary"
						>
							&times;
						</button>

						<AnimatePresence>
							<motion.div
								className={`overflow-x-auto w-full rounded-lg shadow-inner max-h-[600px] overflow-y-auto mt-10 ${visitors.length < 1 ? "" : "border"}`}
							>
								{visitors.length > 0 ? (
									<table className="min-w-full text-xs cursor-default">
										<thead className="sticky top-0">
											<tr className="bg-[#0a0a0a] text-blue-900">
												{[
													"Time",
													"IP",
													"Country",
													"Bot",
													"ASN",
													"ASN Desc",
													"Type",
													"User Agent",
													"Result",
													"Reason",
												].map((title, i) => (
													<th
														key={i}
														className="px-3 py-2 font-semibold border-b border-r border-white"
													>
														{title}
													</th>
												))}
											</tr>
										</thead>
										<tbody className="text-center bg-[#0a0a0a]">
											{visitors.map((v, i) => (
												<tr key={i}>
													<td className="px-3 py-2 font-mono text-xs border-b border-r border-white">
														{formatTime(v.time || v.createdAt)}
													</td>
													<td
														className="px-3 py-2 font-mono text-xs border-r border-white cursor-pointer"
														title="Click to copy IP"
														onClick={() => {
															if (v.ip) {
																navigator.clipboard.writeText(v.ip);
																setCopied(true);
																setTimeout(() => setCopied(false), 1500);
															}
														}}
													>
														<span className="inline-block px-2 py-0.5 rounded bg-blue-600 text-black hover:text-white transition-colors">
															{v.ip}
														</span>
													</td>
													<td className="px-3 py-2 border-r border-white">
														{v.country_code ||
															v.ipDetective?.country_code ||
															""}{" "}
														{v.country_name ||
															v.ipDetective?.country_name ||
															""}
													</td>
													<td className="px-3 py-2 border-r border-white">
														<span
															className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${v.isBot ? "bg-red-700" : "bg-green-600"} text-black`}
														>
															{v.isBot ? "Yes" : "No"}
														</span>
													</td>
													<td className="px-3 py-2 font-mono text-xs border-r border-white">
														{v.ipDetective?.asn || ""}
													</td>
													<td
														className="px-3 py-2 max-w-[180px] truncate border-r border-white"
														title={v.ipDetective?.asn_description}
													>
														{v.ipDetective?.asn_description || ""}
													</td>
													<td className="px-3 py-2 border-r border-white">
														<span className="inline-block px-2 py-0.5 rounded bg-yellow-600 text-black text-xs font-semibold">
															{v.ipDetective?.type
																? v.ipDetective.type[0].toUpperCase() +
																	v.ipDetective.type.slice(1)
																: ""}
														</span>
													</td>
													<td
														className="px-3 py-2 max-w-xs truncate border-r border-white"
														title={v.userAgent}
													>
														{v.userAgent}
													</td>
													<td className="px-3 py-2 font-semibold border-r border-white">
														<span
															className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${v.result === "Blocked" ? "bg-red-700" : "bg-green-600"} text-black`}
														>
															{v.result}
														</span>
													</td>
													<td
														className="px-3 py-2 max-w-[180px] truncate border-white"
														title={v.reason}
													>
														{v.reason}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								) : (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.5 }}
										className="flex flex-col items-center justify-center h-[60vh] py-10 font-mono"
									>
										<RogLoading className="w-52 h-52" />
										<span>NO VISITORS YET</span>
									</motion.div>
								)}
							</motion.div>
						</AnimatePresence>

						{visitors.length > 0 && (
							<div className="absolute top-0 mt-4 text-center">
								<button
									className="text-xs px-4 py-2 rounded bg-red-700 hover:bg-red-900 text-white font-bold shadow focus:outline-none cursor-pointer"
									onClick={async () => {
										const userId = visitors[0]?.user?._ref;
										if (!userId) return;
										if (!window.confirm("Hapus LOGS ?")) return;

										await fetch("/api/visitors", {
											method: "DELETE",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({ userId }),
										});

										setVisitors([]);
									}}
								>
									CLEAR LOGS
								</button>
							</div>
						)}

						{blockedIps.length > 0 && (
							<div className="mt-10 border-t pt-6 flex flex-col items-center">
								<div className="flex flex-col items-center mb-4 w-full max-w-xl mx-auto text-center">
									<h3 className="font-bold text-xl mb-2">
										IP List that was blocked by ROG Antibot
									</h3>
									<span>
										If there is an ip detected as a bot/crawl/spider/scrapper
										visiting your shortlink, it will be blocked permanently from
										accessing your shortlink and it will be displayed below
										here.
									</span>
								</div>
								<ul className="list-disc list-inside text-xs">
									{blockedIps.map((entry, i) => (
										<li key={i}>
											<span className="font-mono text-red-500">{entry.ip}</span>{" "}
											- {entry.reason} ({formatTime(entry.createdAt)})
										</li>
									))}
								</ul>
								<button
									onClick={clearBlockedIps}
									className="mt-4 px-4 py-1 text-xs font-bold bg-red-800 hover:bg-red-900 rounded text-white"
								>
									Clear All Blocked IPs
								</button>
							</div>
						)}

						{copied && (
							<AnimatePresence>
								<motion.div
									layout
									className="text-center"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.5 }}
									style={{
										background: "#0a0a0a",
										backdropFilter: "blur(2px)",
									}}
								>
									<span className="text-green-600 text-xs animate-fade-in text-center">
										IP ADDRESS COPIED
									</span>
								</motion.div>
							</AnimatePresence>
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
