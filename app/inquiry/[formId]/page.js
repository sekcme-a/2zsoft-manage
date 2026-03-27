"use client";

import InquiryForm from "@/app/[groupId]/(authenticated)/[companyId]/inquiries/components/InquiryForm";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function PublicInquiryPage() {
  const { formId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-xl"
      >
        <div className="flex justify-center mb-12">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-xl">
            L.
          </div>
        </div>

        <InquiryForm
          formId={formId}
          companyId="b3949df3-1fa5-4f8b-a4e2-fb311e118087"
        />

        <p className="text-center text-gray-300 text-xs mt-12">
          Powered by YourAdmin System. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
