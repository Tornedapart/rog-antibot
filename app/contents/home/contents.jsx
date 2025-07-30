"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import RogLoading from "@/app/components/loading";

const fadeInUp = {
	hidden: { opacity: 0, y: 40 },
	show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const sectionVariant = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.2,
		},
	},
};

export default function RogHome() {
	const [hasScrolled, setHasScrolled] = useState(false);
	const [showRightClickMessage, setShowRightClickMessage] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 50) {
				setHasScrolled(true);
			} else {
				setHasScrolled(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

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
		<>
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
			{/* Header */}
			<motion.header
				className="sticky top-0 z-50 px-5 bg-[#0a0a0a] text-white"
				initial="hidden"
				whileInView="show"
				viewport={{ once: false }}
				variants={sectionVariant}
			>
				<motion.div
					layout
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					className={`flex items-center w-full transition-all duration-500 ${
						hasScrolled ? "justify-center" : "justify-between"
					}`}
				>
					<motion.div
						layout
						className={`text-2xl font-bold tracking-widest transition-opacity duration-300 ${
							hasScrolled
								? "opacity-0 w-0 overflow-hidden"
								: "opacity-100 w-auto"
						}`}
					></motion.div>

					<motion.div layout className="flex gap-2 items-center">
						<Link
							href="/login"
							className="hover:scale-110 transition-transform duration-300"
						>
							<RogLoading />
						</Link>
						<button className={`${hasScrolled ? "" : "hidden"}`}>
							<span className="mr-5">
								We don’t block bots — we eliminate them.
							</span>
							<span
								className={`relative inline-block group cursor-pointer text-red-700`}
							>
								<Link
									href="https://t.me/tornapartx"
									target="_blank"
									rel="noopener noreferrer"
								>
									Get Access Now!
								</Link>
								<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-red-700 transition-all duration-300 group-hover:w-full"></span>
							</span>
						</button>
					</motion.div>
				</motion.div>
			</motion.header>

			{/* Hero Section */}
			<motion.section
				className="cursor-default h-[90vh] flex flex-col justify-center items-center text-center bg-gradient-to-br from-red-900/80 to-black text-white px-6"
				initial="hidden"
				whileInView="show"
				viewport={{ once: false }}
				variants={sectionVariant}
			>
				<motion.h1
					className="text-black text-3xl md:text-6xl font-extrabold leading-tight mb-4"
					variants={fadeInUp}
				>
					We don’t block bots <span className="text-white">—</span>{" "}
					<span className="text-red-800"> we eliminate them.</span>
				</motion.h1>

				<motion.p
					className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8"
					variants={fadeInUp}
				>
					ROG Antibot detects and defends your web applications against
					malicious bot activity using real-time AI and behavioral analysis.
				</motion.p>
			</motion.section>

			{/* Features Section */}
			<motion.section
				className="cursor-default bg-gradient-to-br from-black to-red-900/80 py-20 px-6 md:px-20"
				initial="hidden"
				whileInView="show"
				viewport={{ once: false }}
				variants={sectionVariant}
			>
				<div className="max-w-6xl mx-auto text-center">
					<motion.h2
						className="text-3xl md:text-4xl font-bold mb-10 text-white"
						variants={fadeInUp}
					>
						Why Choose ROG Antibot?
					</motion.h2>
					<div className="grid md:grid-cols-3 gap-10 text-left">
						{[
							{
								title: "Behavioral AI",
								desc: "Detect bots with advanced pattern recognition and real-time AI analysis.",
							},
							{
								title: "Zero Day Protection",
								desc: "Continuously updated algorithms to guard against emerging threats.",
							},
							{
								title: "Lightweight Integration",
								desc: "Integrate in minutes with minimal impact on performance.",
							},
						].map((item, i) => (
							<motion.div
								key={i}
								className="bg-black p-6 rounded-lg hover:ring-2 hover:ring-red-700 transition"
								variants={fadeInUp}
							>
								<h3 className="text-xl font-semibold mb-3 text-red-700">
									{item.title}
								</h3>
								<p className="text-white">{item.desc}</p>
							</motion.div>
						))}
					</div>
				</div>
			</motion.section>

			{/* How It Works */}
			<motion.section
				className="cursor-default bg-gradient-to-br from-red-900/80 to-black text-white py-20 px-6 md:px-20"
				initial="hidden"
				whileInView="show"
				viewport={{ once: false }}
				variants={sectionVariant}
			>
				<div className="max-w-5xl mx-auto text-center">
					<motion.h2 className="text-3xl font-bold mb-12" variants={fadeInUp}>
						How ROG Antibot Works
					</motion.h2>
					<div className="grid md:grid-cols-3 gap-10 text-left">
						{[
							{
								step: "1",
								title: "Install SDK",
								desc: "Embed the ROG Antibot SDK into your frontend or backend.",
							},
							{
								step: "2",
								title: "Real-Time Analysis",
								desc: "Incoming traffic is analyzed for bot-like behavior instantly.",
							},
							{
								step: "3",
								title: "Automated Blocking",
								desc: "Malicious activity is blocked while letting real users through.",
							},
						].map((step, i) => (
							<motion.div
								key={i}
								className="p-6 border-l-4 border-red-700 bg-black hover:border-none hover:ring-2 hover:ring-red-700 rounded transition-all duration-300"
								variants={fadeInUp}
							>
								<h4 className="text-red-700 text-sm uppercase mb-1">
									Step {step.step}
								</h4>
								<h3 className="text-xl font-semibold mb-2">{step.title}</h3>
								<p className="text-gray-300">{step.desc}</p>
							</motion.div>
						))}
					</div>
				</div>
			</motion.section>

			{/* Pricing */}
			<motion.section
				className="cursor-default bg-gradient-to-br from-black to-red-900/80 py-20 px-6 md:px-20"
				initial="hidden"
				whileInView="show"
				viewport={{ once: false }}
				variants={sectionVariant}
			>
				<div className="max-w-6xl mx-auto text-center">
					<motion.h2
						className="text-3xl font-bold mb-12 text-white"
						variants={fadeInUp}
					>
						Pricing Plans
					</motion.h2>
					<div className="flex flex-col md:flex-row w-full mx-auto justify-center gap-10 items-center">
						{[
							{
								price: "$22",
							},
							{
								price: "$61",
							},
						].map((plan, i) => (
							<motion.div
								key={i}
								className="p-6 rounded-xl hover:ring-2 hover:ring-red-700 bg-black text-white transition w-full max-w-xs text-center flex flex-col items-center justify-center"
								whileHover={{ scale: 1.05 }}
								variants={fadeInUp}
							>
								{plan.price == "$22" ? (
									<div className="flex gap-2 items-center">
										<p className="text-3xl font-bold text-green-600">
											{plan.price}
										</p>
										<span className="text-3xl">/ Week</span>
									</div>
								) : (
									<div className="flex gap-2 items-center">
										<p className="text-3xl font-bold text-green-600">
											{plan.price}
										</p>
										<span className="text-3xl">/ Month</span>
									</div>
								)}
							</motion.div>
						))}
					</div>
				</div>
			</motion.section>

			{/* Final CTA */}
			<motion.section
				className="cursor-default bg-gradient-to-br from-red-900/80 to-black text-white text-center py-16 px-6"
				initial="hidden"
				whileInView="show"
				viewport={{ once: false }}
				variants={fadeInUp}
			>
				<h2 className="text-3xl font-bold mb-4">Protect Your App Today</h2>
				<div className="flex flex-col items-center">
					<p className="mb-6 text-lg">
						Start using ROG Antibot and stop bots in their tracks.
					</p>
				</div>
			</motion.section>
		</>
	);
}
