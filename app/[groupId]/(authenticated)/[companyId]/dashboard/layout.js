"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-24 pb-20 px-6"
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </motion.main>
    </div>
  );
}
