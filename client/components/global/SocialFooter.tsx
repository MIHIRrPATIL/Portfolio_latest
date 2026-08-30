'use client'

import React from "react"
import { FaGithub, FaLinkedinIn, FaDiscord, FaEnvelope } from "react-icons/fa"
import SplineWrapper from "./SplineWrapper"
import { API_V1 } from "@/lib/api-config"

export const SocialFooter = () => {
  const [mounted, setMounted] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const footerRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    setMounted(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { rootMargin: "300px" }
    )
    if (footerRef.current) observer.observe(footerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="connect" ref={footerRef} className="w-full relative z-0 overflow-visible min-h-screen flex flex-col px-6 md:px-16 lg:px-24 bg-[#050505]">
      <div id="contact" className="absolute top-0 pointer-events-none" />
      <div id="sync" className="absolute top-0 pointer-events-none" />
      
      {/* CSS to hide the Built with Spline watermark */}
      <style dangerouslySetInnerHTML={{ __html: `
        #connect a[href*="spline"] {
          display: none !important;
          pointer-events: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `}} />

      {/* 
        LAYER -5: Spline 3D Scene 
        Positioned explicitly between background and content with brightness boost.
        Hidden on mobile devices for peak performance and battery optimization.
      */}
      <div className="absolute inset-0 z-[-5] opacity-100 pointer-events-none md:pointer-events-auto hidden md:block" style={{ filter: 'brightness(3.0) contrast(1.15)' }}>
        {isInView && (
          <SplineWrapper 
            scene="https://prod.spline.design/MoEXvcyCFZnnlo5o/scene.splinecode" 
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Inner Scroll Wrapper taking full width and centering content grid */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between py-12 md:py-16 gap-16 min-h-screen pointer-events-none">
        
        {/* Top Spacer to center the content grid */}
        <div className="flex-1 min-h-[5vh]" />

        {/* Content Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16 lg:gap-24 items-center">
          
          {/* Left Side: Cinematic Branding */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-12 pointer-events-auto">
            <div className="space-y-4 sm:space-y-8">
              <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black font-sans text-white uppercase tracking-tighter leading-[0.9] md:leading-[0.75] mb-4 sm:mb-6">
                Let's <br />
                <span className="text-red-300 font-black">Sync.</span>
              </h2>
              <p className="text-white/40 text-base sm:text-xl md:text-2xl lg:text-3xl max-w-xl font-sans font-medium leading-[1.6] tracking-tight">
                Available for new projects and radical collaborations. reach out if you want to push some boundaries.
              </p>
            </div>
          </div>

          {/* Right Side: Social Bento Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 auto-rows-[140px] sm:auto-rows-[180px] md:auto-rows-[220px] pointer-events-auto">
            {/* Email - Large Bento */}
            <BentoLink 
              name="Email" 
              handle="mihirpatil2505@gmail.com"
              href="mailto:mihirpatil2505@gmail.com" 
              Icon={FaEnvelope}
              className="col-span-2 row-span-2 bg-red-500/10 border-red-500/20 hover:bg-red-500 hover:text-white"
            />
            
            {/* GitHub - Square */}
            <BentoLink 
              name="GitHub" 
              handle="@MIHIRr"
              href="https://github.com/MIHIRrPATIL" 
              Icon={FaGithub}
              className="col-span-1 bg-white/5 border-white/10 hover:bg-slate-800 hover:border-slate-700 hover:text-white"
            />

            {/* LinkedIn - Square */}
            <BentoLink 
              name="LinkedIn" 
              handle="Mihir"
              href="https://www.linkedin.com/in/mihirrpatil2505" 
              Icon={FaLinkedinIn}
              className="col-span-1 bg-white/5 border-white/10 hover:bg-blue-600 hover:border-blue-500 hover:text-white"
            />

            {/* Discord - Horizontal Bento */}
            <BentoLink 
              name="Discord" 
              handle="deadly_hammer"
              href="https://discord.com/users/deadly_hammer" 
              Icon={FaDiscord}
              className="col-span-2 row-span-1 bg-white/5 border-white/10 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white"
            />
          </div>
        </div>

        {/* Bottom Spacer to center the content grid */}
        <div className="flex-1 min-h-[3vh] sm:min-h-[5vh]" />

        {/* Bottom Footer Details */}
        <div className="w-full mb-6 sm:mb-10 pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 relative z-10 transition-opacity hover:opacity-100 opacity-65 pointer-events-auto">
          <div className="flex gap-6 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">
            <span>Local Time // {mounted ? new Date().toLocaleTimeString() : "--:--:--"}</span>
          </div>
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white text-center">
             © 2026 MIHIR PATIL // ALL SYSTEMS OPERATIONAL
          </p>
          <div className="flex gap-6 sm:gap-10 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">
            <a href={`${API_V1}/public/resume`} target="_blank" rel="noopener noreferrer" className="hover:text-red-300 transition-colors cursor-pointer">
              Resume (PDF)
            </a>
            <a href="#hero" className="hover:text-red-300 transition-colors cursor-pointer">Return Top</a>
          </div>
        </div>

      </div>
    </section>
  )
}

const BentoLink = ({ Icon, name, handle, href, className }: any) => {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-700 overflow-hidden ${className}`}
    >
      {/* Inner content wrapper with safe padding inside the border-radius */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 sm:p-6 md:p-8">
        {/* Top row: Icon + Arrow */}
        <div className="flex items-start justify-between">
          <Icon className="text-2xl sm:text-3xl text-white/40 group-hover:text-white transition-colors" />
          <svg className="w-4 h-4 sm:w-5 sm:h-5 opacity-20 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </div>

        {/* Bottom row: Label + Handle */}
        <div className="space-y-0.5 sm:space-y-1 mt-auto">
          <h4 className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/40 group-hover:text-white/60 transition-colors">
            {name}
          </h4>
          <p className="text-xs sm:text-base md:text-lg font-bold text-white uppercase tracking-tight truncate leading-tight">
            {handle}
          </p>
        </div>
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
    </a>
  )
}
