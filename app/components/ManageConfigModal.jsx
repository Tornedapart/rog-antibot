"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ManageConfigModal({
	open,
	onClose,
	config,
	onSave,
	onChange,
}) {
	const [copied, setCopied] = useState(false);
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					className="fixed inset-0 z-40 w-full flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
					style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
				>
					<motion.div
						className="bg-[#0a0a0a] text-white max-w-md w-full p-6 rounded-2xl shadow-2xl relative border border-white"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5 }}
					>
						<button
							className="cursor-pointer absolute top-3 right-3 text-2xl text-white hover:text-red-600 hover:scale-140 transition-all duration-200 focus:outline-none"
							onClick={onClose}
							aria-label="Close configuration"
						>
							&times;
						</button>
						<h3 className="text-2xl font-extrabold mb-6 text-center text-red-700 tracking-tight drop-shadow">
							Manage Configuration
						</h3>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								onSave();
							}}
							className="flex flex-col gap-4"
						>
							<label className="flex flex-col gap-1">
								<span className="font-semibold">Allowed Countries</span>
								<input
									type="text"
									className="border rounded px-2 py-1"
									value={config.allowCountries}
									onChange={(e) =>
										onChange({ ...config, allowCountries: e.target.value })
									}
									placeholder="e.g. US, ID, SG"
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="font-semibold">Your domain for shortlink</span>
								<input
									type="text"
									className="border rounded px-2 py-1"
									value={config.bridgeDomain || ""}
									onChange={(e) =>
										onChange({ ...config, bridgeDomain: e.target.value })
									}
									placeholder="e.g. https://yourdomain.com"
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="font-semibold">Shortlink Parameter</span>
								<input
									type="text"
									className="border rounded px-2 py-1 font-mono"
									value={config.shortlinkPath || ""}
									onChange={(e) =>
										onChange({ ...config, shortlinkPath: e.target.value })
									}
									placeholder="e.g. abc123"
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="font-semibold">Destination</span>
								<input
									type="text"
									className="border rounded px-2 py-1"
									value={config.mainSite || ""}
									onChange={(e) =>
										onChange({ ...config, mainSite: e.target.value })
									}
									placeholder="e.g. https://yourmainsite.com"
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="font-semibold">Block IP</span>
								<input
									type="text"
									className="border rounded px-2 py-1 font-mono"
									value={config.blockIps || ""}
									onChange={(e) =>
										onChange({ ...config, blockIps: e.target.value })
									}
									placeholder="e.g. 1.2.3.4, 5.6.7.8"
								/>
							</label>
							{config.bridgeDomain && config.shortlinkPath && (
								<AnimatePresence>
									<motion.div
										className="flex items-center justify-center mt-2 p-2 rounded text-sm text-black select-all break-all font-bold"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.9 }}
										style={{
											background: "#0a0a0a",
											backdropFilter: "blur(2px)",
										}}
									>
										<span
											className="px-3 py-1 rounded bg-yellow-600 text-xs font-mono cursor-pointer hover:bg-yellow-700 transition duration-300"
											onClick={() => {
												if (config?.bridgeDomain) {
													navigator.clipboard.writeText(
														config.bridgeDomain.replace(/\/$/, "") +
															"/rog/" +
															config.shortlinkPath
													);
													setCopied(true);
													setTimeout(() => setCopied(false), 1500);
												}
											}}
											title="Copy Shortlink"
										>
											{`${config.bridgeDomain.replace(/\/$/, "")}/rog/${
												config.shortlinkPath
											}`}
										</span>
										<br />
									</motion.div>
								</AnimatePresence>
							)}
							{copied && (
								<AnimatePresence>
									<motion.div
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
											SHORTLINK COPIED
										</span>
									</motion.div>
								</AnimatePresence>
							)}
							<button type="submit" className="button">
								Save Configuration
							</button>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
