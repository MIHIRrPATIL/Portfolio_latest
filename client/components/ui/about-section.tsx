"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

export default function AboutSection3() {
  const heroRef = useRef<HTMLDivElement>(null);
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
    <section id="about" className="flex py-20 md:py-48 px-6 md:px-16 lg:px-24 w-full justify-center items-center overflow-x-hidden bg-black" ref={heroRef}>
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16 md:gap-48 lg:gap-64">
        {/* Header - Latest User Style */}
        <div className="flex flex-row items-center gap-12 p-4 font-mono">
          <span className="text-red-300 animate-spin text-8xl">✱</span>
          <TimelineContent
            as="span"
            animationNum={0}
            timelineRef={heroRef}
            customVariants={revealVariants}
            className="text-4xl md:text-5xl lg:text-7xl font-black font-sans text-white uppercase tracking-[0.4em] leading-tight"
          >
            WHO I AM
          </TimelineContent>
        </div>

        <div className="relative">
          <TimelineContent
            as="figure"
            animationNum={4}
            timelineRef={heroRef}
            customVariants={scaleVariants}
            className="relative group overflow-hidden rounded-3xl"
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
                className="mb-8"
              >
                <div className="text-4xl md:text-8xl font-black text-white leading-none">50+</div>
                <div className="text-xs md:text-2xl font-black text-white/50 uppercase tracking-widest mt-2">repos</div>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={7}
                timelineRef={heroRef}
                customVariants={revealVariants}
              >
                <div className="text-3xl md:text-6xl font-black text-red-300 leading-none">5+</div>
                <div className="text-xs md:text-xl font-black text-white/50 uppercase tracking-tighter leading-tight mt-2 md:mt-4">languages &<br />Frameworks</div>
              </TimelineContent>
            </div>
          </TimelineContent>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12 text-sm font-mono border-b border-white/10 uppercase tracking-[0.2em]">
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="flex items-center gap-6 text-white"
            >
              <span className="text-red-300 font-black text-6xl">2+</span>
              <span className="font-bold text-lg">years of experience</span>
            </TimelineContent>
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="flex items-center gap-6 text-white md:justify-end"
            >
              <span className="text-red-300 font-black text-6xl">300k</span>
              <span className="font-bold text-lg">LOC</span>
            </TimelineContent>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-32">
          <div className="md:col-span-3">
            <h1 className="text-4xl sm:text-5xl md:text-[8rem] lg:text-[10rem] !leading-[0.75] font-black text-white mb-24 uppercase tracking-tighter break-words overflow-hidden">
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
              className="grid md:grid-cols-2 gap-12 md:gap-32 text-white font-medium mt-20"
            >
              <TimelineContent
                as="div"
                animationNum={10}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-2xl md:text-3xl leading-relaxed max-w-2xl"
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
                className="text-2xl md:text-3xl leading-relaxed max-w-2xl"
              >
                <p className="text-left font-sans font-medium text-white/90">
                  I love the intricate, messy problems that make other developers close their laptops. Ultimately, I firmly believe there’s no product in existence that a good cup of coffee, deep research, and <span className="text-red-300 font-bold">my specific brand of engineering</span> can't build.
                </p>
              </TimelineContent>
            </TimelineContent>
          </div>

          <div className="md:col-span-1 flex flex-col justify-start pt-8 md:pt-16">
            <div className="text-right">
              <TimelineContent
                as="div"
                animationNum={12}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-red-300 text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter"
              >
                MIHIR
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={13}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-white/40 text-xl mb-16 md:mb-32 font-bold uppercase tracking-[0.3em]"
              >
                Engineer | Full Stack Dev
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={14}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="mb-12"
              >
                <p className="text-white font-black text-2xl md:text-4xl uppercase text-right leading-tight max-w-md ml-auto mb-8">
                  Ready to build something magnificent
                </p>
              </TimelineContent>

              <TimelineContent
                as="button"
                animationNum={15}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="bg-white text-black hover:bg-red-300 hover:text-black border-none flex items-center w-fit ml-auto gap-8 transition-all duration-500 ease-out px-6 py-4 md:px-20 md:py-10 rounded-2xl cursor-pointer font-black uppercase tracking-tighter text-xl md:text-2xl shadow-[0_40px_80px_rgba(255,255,255,0.15)] group"
              >
                LET'S COLLABORATE
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 md:w-10 md:h-10 group-hover:translate-x-6 transition-transform" />
                </div>
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
