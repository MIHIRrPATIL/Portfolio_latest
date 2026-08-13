'use client'

import { motion } from 'framer-motion'
import { projects } from '@/data/projects'
import { clipReveal, stagger, viewportOnce, easings } from '@/lib/motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function ProjectGrid() {
  return (
    <section id="projects" className="px-6 py-24 md:px-12 md:py-32 lg:px-24">
      <motion.div 
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24"
      >
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </motion.div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: any, index: number }) {
  // Irregular offsets for masonry feel
  const isEven = index % 2 === 0
  
  return (
    <motion.div 
      variants={fadeUpWithScale}
      className={cn(
        "group relative flex flex-col gap-6",
        !isEven && "md:mt-32"
      )}
    >
      <Link href={`/projects/${project.id}`} className="overflow-hidden bg-foreground/5">
        <motion.div 
          className="relative aspect-square md:aspect-4/3 overflow-hidden"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Main Image */}
          <motion.img 
            layoutId={`img-${project.id}`}
            src={project.image} 
            alt={project.title}
            className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          />
          
          {/* Overlay Wipe */}
          <motion.div 
            variants={clipReveal}
            className="absolute inset-0 bg-accent mix-blend-multiply opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          />
        </motion.div>
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest opacity-40">
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>
        <Link href={`/projects/${project.id}`}>
          <h2 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
            {project.title}
          </h2>
        </Link>
        <p className="max-w-[400px] text-sm leading-relaxed opacity-60">
          {project.description}
        </p>
      </div>
    </motion.div>
  )
}

const fadeUpWithScale = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.8, ease: easings.smooth as any }
  }
}
