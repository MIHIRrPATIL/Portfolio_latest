export interface Feature {
  title: string
  desc: string
  icon: 'zap' | 'shield' | 'globe' | 'cpu' | 'layers' | 'terminal'
}

export interface Metric {
  label: string
  value: string
}

export interface Project {
  id: string
  title: string
  category: string
  description: string
  longDescription: string
  architecture: string
  image: string
  year: string
  tags: string[]
  liveUrl: string
  repoUrl: string
  features: Feature[]
  metrics: Metric[]
}

export const projects: Project[] = [
  {
    id: 'autonomous-nexus',
    title: 'Autonomous Nexus',
    category: 'Multi-Agent Systems',
    description: 'A decentralized crew of 20+ specialized AI agents collaborating on portfolio management and social outreach.',
    longDescription: 'Autonomous Nexus is an enterprise-grade multi-agent orchestration ecosystem designed to handle complex algorithmic trading strategies, real-time social engagement, and autonomous content generation. By utilizing a hybrid supervisor-worker topology built on CrewAI and Supabase vector streams, the system achieves deterministic task execution while maintaining dynamic adaptability to volatile market events.',
    architecture: 'Built on an event-driven Python runtime connected to Supabase pgvector. Agents communicate via async WebSockets, passing structured JSON payloads verified through Pydantic models. A master Supervisor Agent continuously monitors task priority queues, reallocating worker agents dynamically based on token throughput and compute budgets.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1600',
    year: '2026',
    tags: ['CrewAI', 'Python', 'Supabase', 'Pydantic', 'FastAPI'],
    liveUrl: 'https://github.com/MIHIRrPATIL',
    repoUrl: 'https://github.com/MIHIRrPATIL',
    features: [
      { title: 'Agent Orchestration', desc: 'Dynamic DAG task routing with automatic fallback strategies for failing nodes.', icon: 'cpu' },
      { title: 'Zero-Trust Protocol', desc: 'End-to-end encrypted inter-agent communication signed with asymmetric keys.', icon: 'shield' },
      { title: 'Sub-50ms Telemetry', desc: 'Real-time state streaming to monitoring dashboards via Supabase realtime webhooks.', icon: 'zap' }
    ],
    metrics: [
      { label: 'Active Agents', value: '24' },
      { label: 'Task Execution Time', value: '<45ms' },
      { label: 'Uptime SLA', value: '99.99%' }
    ]
  },
  {
    id: 'sentinel-vision',
    title: 'Sentinel Vision',
    category: 'Cybersecurity ML',
    description: 'Real-time anomaly detection system using Isolation Forests to distinguish between bot traffic and human recruiters.',
    longDescription: 'Sentinel Vision acts as an automated perimeter defense layer for web applications. Powered by scikit-learn Isolation Forests and Redis rate-limiting buckets, it analyzes request telemetry—including keystroke dynamics, request entropy, and IP reputation scores—in sub-10ms intervals to block automated scraping threats before they impact server load.',
    architecture: 'Processes incoming HTTP telemetry through a lightweight Rust edge proxy that extracts 18 behavioral features. Features are streamed into a high-throughput FastAPI inference server backed by cached ONNX runtime instances, allowing ultra-low latency model prediction.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600',
    year: '2025',
    tags: ['Scikit-Learn', 'FastAPI', 'Redis', 'Rust', 'ONNX'],
    liveUrl: 'https://github.com/MIHIRrPATIL',
    repoUrl: 'https://github.com/MIHIRrPATIL',
    features: [
      { title: 'Isolation Forest ML', desc: 'Unsupervised anomaly detection trained on 10M+ web requests.', icon: 'shield' },
      { title: 'Edge Mitigation', desc: 'Instant IP flagging and challenge injection executed directly at CDN edge nodes.', icon: 'globe' },
      { title: 'Low Latency Inference', desc: 'ONNX runtime execution completed within 4.2ms per evaluation.', icon: 'zap' }
    ],
    metrics: [
      { label: 'Inference Speed', value: '4.2ms' },
      { label: 'False Positive Rate', value: '0.01%' },
      { label: 'Bot Traffic Blocked', value: '99.8%' }
    ]
  },
  {
    id: 'kinetic-portfolio',
    title: 'Kinetic Portfolio',
    category: 'Creative Engineering',
    description: 'A high-performance editorial showcase built with Next.js 14, Framer Motion, and Lenis smooth scrolling.',
    longDescription: 'Kinetic Portfolio is an editorial web application engineered to showcase digital craft. Combining Three.js WebGL shaders, smooth Lenis physics scrolling, and dynamic Framer Motion view transitions, it delivers an immersive interactive experience without compromising Lighthouse performance scores.',
    architecture: 'Built on Next.js App Router using Server-Side Rendering (SSR) for static markup and progressive hydration for WebGL canvas contexts. Component state uses lightweight Motion primitives with shared GPU transform layers to guarantee consistent 60 FPS animation execution.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1600',
    year: '2026',
    tags: ['Next.js', 'Framer Motion', 'Tailwind', 'Three.js', 'TypeScript'],
    liveUrl: 'https://github.com/MIHIRrPATIL',
    repoUrl: 'https://github.com/MIHIRrPATIL',
    features: [
      { title: 'WebGL 3D Canvas', desc: 'Custom Three.js shaders with dynamic mouse inertia physics.', icon: 'layers' },
      { title: 'Fluid Motion Engine', desc: 'Layout animation pipeline built on Framer Motion and Lenis scroll hooks.', icon: 'terminal' },
      { title: '100 Lighthouse Performance', desc: 'Fully optimized bundle splitting with automated asset compression.', icon: 'zap' }
    ],
    metrics: [
      { label: 'Frame Rate', value: '60 FPS' },
      { label: 'Lighthouse Score', value: '100' },
      { label: 'First Contentful Paint', value: '0.4s' }
    ]
  },
  {
    id: 'neural-crawler',
    title: 'Neural Crawler',
    category: 'SEO Intelligence',
    description: 'Autonomous SEO strategist that crawls search console data to optimize meta-tags and site structure in real-time.',
    longDescription: 'Neural Crawler continuously monitors search engine indexing, keyword ranking distribution, and competitor content strategies. Powered by OpenAI GPT-4o and headless Playwright instances, it generates semantic content optimizations and automatically issues pull requests with structural fixes.',
    architecture: 'Utilizes a headless Playwright cluster running in Docker containers. Crawled DOM trees are parsed into markdown abstractions, evaluated through custom OpenAI prompt chains, and synthesized into actionable pull requests via GitHub REST APIs.',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=1600',
    year: '2025',
    tags: ['OpenAI', 'Playwright', 'Node.js', 'Docker', 'GitHub API'],
    liveUrl: 'https://github.com/MIHIRrPATIL',
    repoUrl: 'https://github.com/MIHIRrPATIL',
    features: [
      { title: 'Headless Crawler Cluster', desc: 'Multi-threaded Playwright browsers scraping thousands of URLs concurrently.', icon: 'globe' },
      { title: 'LLM Optimization Engine', desc: 'GPT-4o powered semantic analysis producing rank-boosting meta updates.', icon: 'cpu' },
      { title: 'Automated PR Pipeline', desc: 'Direct integration with GitHub actions to submit automated site patches.', icon: 'terminal' }
    ],
    metrics: [
      { label: 'Pages Scraped / Min', value: '1,200+' },
      { label: 'Rank Increase Avg', value: '+34%' },
      { label: 'Automated PRs Sent', value: '500+' }
    ]
  }
]
