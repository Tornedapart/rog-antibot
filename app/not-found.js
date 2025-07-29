'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import RogLoading from "./components/loading";

export default function NotFoundPage() {
    const [showRightClickMessage, setShowRightClickMessage] = useState(false);
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
                        className="fixed flex items-center justify-center z-50 top-0 w-full h-full left-1/2 transform -translate-x-1/2 bg-black/90 text-red-700 text-base xl:text-2xl"
                    >
                        MAU NGAPAIN?
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    key="not-found"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center h-[80vh]"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link href="/" className="text-white text-2xl font-bold mb-4">
                            <RogLoading className="w-40 h-40" />
                        </Link>
                    </motion.div>

                    <motion.h1
                        className="text-3xl font-extrabold text-white"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        404
                    </motion.h1>
                </motion.div>
            </AnimatePresence>
        </>
    );
}
