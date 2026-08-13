'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, agentBadgeClass, formatLogTime } from '@/lib/utils'
import { logLine, viewportOnce } from '@/lib/motion'

interface LogEntry {
  id: string
  timestamp: string
  agent: 'SCOUT' | 'SEO' | 'PR' | 'SENTINEL' | 'ANOMALY' | 'ORCH'
  detail: string
}

const INITIAL_LOGS: LogEntry[] = [
  { id: '1', timestamp: formatLogTime(), agent: 'ORCH', detail: 'System initialized. All agents standing by.' },
  { id: '2', timestamp: formatLogTime(), agent: 'SENTINEL', detail: 'Uptime check: 100%. Latency: 42ms.' },
  { id: '3', timestamp: formatLogTime(), agent: 'SCOUT', detail: 'New commit detected in /core-engine. Drafting post...' },
]

const AGENTS = ['SCOUT', 'SEO', 'PR', 'SENTINEL', 'ANOMALY', 'ORCH'] as const
const ACTIONS = [
  'Analyzed traffic spike from 192.168.1.1',
  'Optimized meta-tags for keyword "ML Engineer"',
  'Generated social share preview for Project Nexus',
  'Detected bot signature: Googlebot-Simulated',
  'Synced LinkedIn bio with GitHub updates',
  'Memory layer re-indexed 42 embeddings',
]

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setLogs(INITIAL_LOGS)
    
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: formatLogTime(),
        agent: AGENTS[Math.floor(Math.random() * AGENTS.length)],
        detail: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
      }
      setLogs((prev) => [...prev.slice(-14), newLog])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <section className="px-6 py-24 md:px-12 md:py-32 lg:px-24">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Administrative Layer</span>
          <h2 className="text-4xl font-black uppercase tracking-tight md:text-6xl">System Sentinel</h2>
        </div>

        {!mounted ? (
          <div className="h-[400px] w-full animate-pulse bg-foreground/5 rounded-lg" />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Terminal */}
            <div className="lg:col-span-8 overflow-hidden rounded-lg border border-foreground/10 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-2 bg-foreground/5 font-mono text-[10px] uppercase tracking-wider">
                <span>Agent Log Feed</span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Live Connection
                </span>
              </div>
              <div 
                ref={scrollRef}
                className="h-[400px] overflow-y-auto p-4 font-mono text-[11px] leading-6 md:text-xs"
              >
                <AnimatePresence mode="popLayout">
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      variants={logLine}
                      initial="hidden"
                      animate="visible"
                      className="flex gap-4"
                    >
                      <span className="opacity-30">[{log.timestamp}]</span>
                      <span className={cn("px-1.5 rounded", agentBadgeClass(log.agent))}>
                        {log.agent}
                      </span>
                      <span className="opacity-80">· {log.detail}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Status Chips */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="rounded-lg border border-foreground/10 p-6 bg-linear-to-t from-foreground/2 to-transparent">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Agent Status</span>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {AGENTS.map((agent) => (
                    <div key={agent} className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-mono text-[11px] uppercase tracking-wider">{agent}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="rounded-lg border border-foreground/10 p-6 bg-linear-to-t from-foreground/2 to-transparent">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Memory Index</span>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '68%' }}
                      className="h-full bg-foreground"
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] opacity-40">
                    <span>Vector Density</span>
                    <span>68.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
