"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ArrowRight, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchPortfolioStats, PortfolioStats } from "@/data/projects";
import { API_V1 } from "@/lib/api-config";

export default function AboutSection3() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<PortfolioStats>({
    totalRepos: 51,
    languagesCount: 12,
    languages: [],
    totalStars: 5
  });

  useEffect(() => {
    fetchPortfolioStats().then((s) => {
      if (s) setStats(s);
    });
  }, []);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.05,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };
  const scaleVariants = {
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.05,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };
  return (
    <section id="about" className="flex py-16 sm:py-24 md:py-40 px-5 sm:px-8 md:px-16 lg:px-24 w-full justify-center items-center overflow-x-hidden bg-black" ref={heroRef}>
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12 sm:gap-24 md:gap-40 lg:gap-52">
        {/* Header - Responsive User Style */}
        <div className="flex flex-row items-center gap-4 sm:gap-8 md:gap-12 p-2 sm:p-4 font-mono">
          <span className="text-red-300 animate-spin text-5xl sm:text-7xl md:text-8xl">✱</span>
          <TimelineContent
            as="span"
            animationNum={0}
            timelineRef={heroRef}
            customVariants={revealVariants}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black font-sans text-white uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] leading-tight"
          >
            WHO AM I ?
          </TimelineContent>
        </div>

        <div className="relative">
          <TimelineContent
            as="figure"
            animationNum={4}
            timelineRef={heroRef}
            customVariants={scaleVariants}
            className="relative group overflow-hidden rounded-2xl sm:rounded-3xl"
          >
            <svg
              className="w-full h-auto"
              width={"100%"}
              viewBox="0 0 100 40"
            >
              <defs>
                <clipPath
                  id="clip-inverted"
                  clipPathUnits={"objectBoundingBox"}
                >
                  <path
                    d="M0.0998072 1H0.422076H0.749756C0.767072 1 0.774207 0.961783 0.77561 0.942675V0.807325C0.777053 0.743631 0.791844 0.731953 0.799059 0.734076H0.969813C0.996268 0.730255 1.00088 0.693206 0.999875 0.675159V0.0700637C0.999875 0.0254777 0.985045 0.00477707 0.977629 0H0.902473C0.854975 0 0.890448 0.138535 0.850165 0.138535H0.0204424C0.00408849 0.142357 0 0.180467 0 0.199045V0.410828C0 0.449045 0.0136283 0.46603 0.0204424 0.469745H0.0523086C0.0696245 0.471019 0.0735527 0.497877 0.0733523 0.511146V0.915605C0.0723903 0.983121 0.090588 1 0.0998072 1Z"
                    fill="#D9D9D9"
                  />
                </clipPath>
              </defs>
              <image
                clipPath="url(#clip-inverted)"
                preserveAspectRatio="xMidYMid slice"
                width={"100%"}
                height={"100%"}
                xlinkHref="https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=1200&auto=format&fit=crop"
                className="brightness-110 contrast-110"
              ></image>
            </svg>
            {/* Brands and Engagement Overlays */}
            <div className="absolute right-0 top-0 h-full w-1/3 md:w-1/4 hidden sm:flex flex-col justify-center items-end pr-4 md:pr-12 text-right pointer-events-none">
              <TimelineContent
                as="div"
                animationNum={6}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="mb-4 md:mb-8"
              >
                <div className="text-3xl sm:text-5xl md:text-8xl font-black text-white leading-none">{stats.totalRepos}+</div>
                <div className="text-[10px] sm:text-xs md:text-2xl font-black text-white/50 uppercase tracking-widest mt-1 sm:mt-2">repos</div>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={7}
                timelineRef={heroRef}
                customVariants={revealVariants}
              >
                <div className="text-2xl sm:text-4xl md:text-6xl font-black text-red-300 leading-none">{stats.languagesCount}+</div>
                <div className="text-[10px] sm:text-xs md:text-xl font-black text-white/50 uppercase tracking-tighter leading-tight mt-1 md:mt-4">languages &<br />Frameworks</div>
              </TimelineContent>
            </div>
          </TimelineContent>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-6 sm:gap-12 py-8 sm:py-12 text-xs sm:text-sm font-mono border-b border-white/10 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="flex items-center gap-3 sm:gap-6 text-white"
            >
              <span className="text-red-300 font-black text-3xl sm:text-5xl md:text-6xl">2+</span>
              <span className="font-bold text-xs sm:text-base md:text-lg leading-tight">years of experience</span>
            </TimelineContent>
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="flex items-center gap-3 sm:gap-6 text-white justify-end"
            >
              <span className="text-red-300 font-black text-3xl sm:text-5xl md:text-6xl">{stats.locDisplay || "900K+"}</span>
              <span className="font-bold text-xs sm:text-base md:text-lg">LOC</span>
            </TimelineContent>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 sm:gap-16 lg:gap-32">
          <div className="lg:col-span-3">
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-[8.5rem] leading-[1.05] sm:leading-[0.9] lg:leading-[0.8] font-black text-white mb-10 sm:mb-16 lg:mb-24 uppercase tracking-tighter break-words">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.1}
                staggerFrom="first"
                reverse={true}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 30,
                  delay: 0.5,
                }}
              >
                Crafting <span className="text-red-300">code</span> That Make a Difference.
              </VerticalCutReveal>
            </h1>

            <TimelineContent
              as="div"
              animationNum={9}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-20 text-white font-medium mt-8 sm:mt-16"
            >
              <TimelineContent
                as="div"
                animationNum={10}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-base sm:text-xl md:text-2xl lg:text-3xl leading-relaxed"
              >
                <p className="text-left font-sans font-medium text-white/90">
                  I build things that are slightly more complicated than they were yesterday. What started as simple web dev quickly spiraled into competing in 20+ hackathons and diving headfirst into complex full-stack and AI ecosystems.
                </p>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={11}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-base sm:text-xl md:text-2xl lg:text-3xl leading-relaxed"
              >
                <p className="text-left font-sans font-medium text-white/90">
                  I love the intricate, messy problems that make other developers close their laptops. Ultimately, I firmly believe there’s no product in existence that a good cup of coffee, deep research, and <span className="text-red-300 font-bold">my specific brand of engineering</span> can't build.
                </p>
              </TimelineContent>
            </TimelineContent>
          </div>

          <div className="lg:col-span-1 flex flex-col justify-start pt-4 sm:pt-8 lg:pt-16">
            <div className="text-left lg:text-right">
              <TimelineContent
                as="div"
                animationNum={12}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-red-300 text-4xl sm:text-6xl lg:text-8xl font-black mb-2 sm:mb-4 uppercase tracking-tighter"
              >
                MIHIR
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={13}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-white/40 text-sm sm:text-lg lg:text-xl mb-8 sm:mb-16 lg:mb-24 font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em]"
              >
                Engineer | Full Stack Dev
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={14}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="mb-8"
              >
                <p className="text-white font-black text-xl sm:text-2xl lg:text-3xl uppercase text-left lg:text-right leading-tight max-w-md lg:ml-auto">
                  Ready to build something magnificent
                </p>
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={15}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="flex flex-col items-stretch lg:items-end gap-3.5 w-full sm:w-80 lg:w-96 sm:ml-auto"
              >
                <button
                  onClick={() => {
                    const syncElem = document.getElementById('sync') || document.getElementById('connect');
                    if (syncElem) {
                      syncElem.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-white text-black hover:bg-red-300 hover:text-black border-none flex items-center justify-between w-full transition-all duration-300 px-6 py-4 sm:px-8 sm:py-5 rounded-2xl cursor-pointer font-black uppercase tracking-tight text-sm sm:text-base shadow-[0_20px_50px_rgba(255,255,255,0.12)] group"
                >
                  <span className="whitespace-nowrap">LET&apos;S COLLABORATE</span>
                  <div className="flex items-center justify-center ml-2">
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>

                <a
                  href={`${API_V1}/public/resume`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white/[0.05] hover:bg-white/10 text-white/80 hover:text-white border border-white/15 hover:border-red-300/40 flex items-center justify-between transition-all duration-300 px-6 py-3.5 rounded-xl cursor-pointer font-mono font-bold uppercase tracking-wider text-xs sm:text-sm group backdrop-blur-md"
                >
                  <span className="whitespace-nowrap">DOWNLOAD CV / RESUME</span>
                  <Download className="w-4 h-4 text-red-300 group-hover:translate-y-0.5 transition-transform ml-2 shrink-0" />
                </a>
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
