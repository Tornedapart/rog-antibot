import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VisitorSummaryModal() {
	const [open, setOpen] = React.useState(false);
	const [visitors, setVisitors] = React.useState([]);
	React.useEffect(() => {
		const handler = () => {
			const arr = window.visitorSummary || [];
			setVisitors([...arr].reverse());
			setOpen(true);
		};
		window.addEventListener("showVisitorSummary", handler);
		return () => window.removeEventListener("showVisitorSummary", handler);
	}, []);

	const handleClose = () => setOpen(false);
	const [copied, setCopied] = useState(false);

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
							<motion.div className="overflow-x-auto border w-full rounded-lg shadow-inner max-h-[600px] overflow-y-auto mt-10">
								<table className="min-w-full text-xs cursor-default">
									<thead className="sticky top-0">
										<tr className="bg-[#0a0a0a] text-blue-900">
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												Time
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												IP
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												Country
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												Bot
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												ASN
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												ASN Desc
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												Type
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												User Agent
											</th>
											<th className="px-3 py-2 font-semibold border-b border-r border-white">
												Result
											</th>
											<th className="px-3 py-2 font-semibold border-b border-white">
												Reason
											</th>
										</tr>
									</thead>
									<tbody>
										{visitors.length === 0 ? (
											<tr>
												<td
													colSpan={10}
													className="text-center py-8 text-gray-400"
												>
													No visitors yet.
												</td>
											</tr>
										) : (
											visitors.map((v, i) => (
												<tr key={i} className="bg-[#0a0a0a] text-center">
													<td className="px-3 py-2 whitespace-nowrap font-mono text-xs border-b border-r border-white">
														{v.time}
													</td>
													<td
														className="px-3 py-2 whitespace-nowrap font-mono text-xs border-r border-white"
														onClick={() => {
															if (v.ip) {
																navigator.clipboard.writeText(v.ip);
																setCopied(true);
																setTimeout(() => setCopied(false), 1500);
															}
														}}
														title="Click to copy IP"
													>
														<span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-black cursor-pointer hover:text-white transition-colors">
															{v.ip}
														</span>
													</td>
													<td className="px-3 py-2 whitespace-nowrap border-r border-white">
														{v.country_code ||
															v.ipDetective?.country_code ||
															""}{" "}
														{v.country_name ||
															v.ipDetective?.country_name ||
															""}
													</td>
													<td className="px-3 py-2 whitespace-nowrap border-r border-white">
														<span
															className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
																v.isBot
																	? "bg-red-700 text-black"
																	: "bg-green-600 text-black"
															}`}
														>
															{v.isBot ? "Yes" : "No"}
														</span>
													</td>
													<td className="px-3 py-2 whitespace-nowrap font-mono text-xs border-r border-white">
														{v.ipDetective?.asn || ""}
													</td>
													<td
														className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate border-r border-white"
														title={v.ipDetective?.asn_description}
													>
														{v.ipDetective?.asn_description || ""}
													</td>
													<td className="px-3 py-2 whitespace-nowrap border-r border-white">
														<span className="inline-block px-2 py-0.5 rounded bg-yellow-600 text-black text-xs font-semibold">
															{v.ipDetective?.type.charAt(0).toUpperCase() +
																v.ipDetective?.type.slice(1) || ""}
														</span>
													</td>
													<td
														className="px-3 py-2 max-w-xs truncate border-r border-white"
														title={v.userAgent}
													>
														{v.userAgent}
													</td>
													<td className="px-3 py-2 whitespace-nowrap font-semibold border-r border-white">
														<span
															className={
																v.result === "Blocked"
																	? "inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-700 text-black"
																	: "inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-600 text-black"
															}
														>
															{v.result}
														</span>
													</td>
													<td
														className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate border-white"
														title={v.reason}
													>
														{v.reason}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</motion.div>
						</AnimatePresence>
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
