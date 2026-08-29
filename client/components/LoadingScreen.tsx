"use client";
import React from "react";
import { motion } from "framer-motion";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

const PORTFOLIO_LOADING_STATES = [
  { text: "Connecting to GitHub GraphQL API" },
  { text: "Parsing Repository File Tree & Dependencies" },
  { text: "Extracting Core Architecture Manifests" },
  { text: "Initializing OpenRouter Llama-3.3-70B Engine" },
  { text: "Synthesizing AI Technical Case Study" },
  { text: "Calculating Benchmark Metrics & Grading" },
  { text: "Finalizing High-Tech Dossier" }
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  className,
  fullScreen = false
}) => {
  if (fullScreen) {
    return <MultiStepLoader loadingStates={PORTFOLIO_LOADING_STATES} loading={true} duration={1200} loop={true} />;
  }

  // Render 4 Wireframe Skeleton Cards for Inline Grid Loading
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full", className)}>
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex flex-col justify-between rounded-3xl bg-[#09090b] border border-white/10 p-8 md:p-10 relative overflow-hidden animate-pulse min-h-[320px]"
        >
          {/* Shimmer Overlay Wave */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none"
          />

          <div>
            {/* Header Row Skeleton */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
              <div className="h-3 w-28 bg-white/10 rounded-md" />
              <div className="h-5 w-20 bg-red-500/10 border border-red-300/20 rounded-full" />
            </div>

            {/* Title Skeleton */}
            <div className="h-8 w-3/4 bg-white/15 rounded-lg mb-4" />

            {/* Description Lines Skeleton */}
            <div className="space-y-2 mb-8">
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-5/6 bg-white/10 rounded" />
              <div className="h-3 w-2/3 bg-white/10 rounded" />
            </div>
          </div>

          {/* Footer Stack Skeleton */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="h-3 w-16 bg-white/10 rounded" />
              <div className="h-3 w-16 bg-white/10 rounded" />
              <div className="h-3 w-16 bg-white/10 rounded" />
            </div>
            <div className="h-3 w-10 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
