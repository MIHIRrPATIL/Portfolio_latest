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
  isTeamProject?: boolean
  owner?: string
  features: Feature[]
  metrics: Metric[]
}

// Removed all static dummy data arrays. Dynamic project data is fetched directly from backend DB.
export const projects: Project[] = [];

function formatClientTitle(rawName: string, rawTitle?: string): string {
  const forbidden = [
    "clean human-readable title",
    "clean human readable title",
    "human-readable title",
    "human readable title",
    "project title",
    "clean title",
    "title",
    "placeholder",
    "insert title",
    "clean human"
  ];
  const t = (rawTitle || "").trim();
  if (t && !forbidden.some(f => t.toLowerCase().includes(f)) && t.length > 1) {
    return t;
  }
  const name = (rawName || "Project").replace(/[-_]/g, " ").trim();
  return name
    .split(" ")
    .map(w => {
      const lower = w.toLowerCase();
      if (["ai", "ui", "api", "db", "ml", "nlp", "llm", "ast", "cli", "sdk", "os", "asr", "sih", "rbac", "sse", "r3f", "cad", "css", "html", "js", "ts"].includes(lower)) {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function mapAiProjectToClientProject(item: any): Project {
  const repoOwner = item.owner || 'MIHIRrPATIL';
  const isTeam = item.is_team_project ?? (repoOwner.toLowerCase() !== 'mihirrpatil');
  const rawName = item.name || item.id || 'Project';
  const itemId = (item.id || rawName.toLowerCase().replace(/_/g, '-')).toLowerCase();
  
  let rawLive = item.liveUrl || item.live_url || '';
  if (rawLive.includes('github.com')) {
    rawLive = '';
  }

  const repoLink = item.repoUrl || item.repo_url || `https://github.com/${repoOwner}/${rawName}`;
  const displayTitle = formatClientTitle(rawName, item.title);

  return {
    id: itemId,
    title: displayTitle,
    category: item.category || 'Engineering',
    description: item.description || item.tagline || '',
    longDescription: item.description || '',
    architecture: item.architecture_overview || item.description || '',
    image: item.image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    year: item.year || '2026',
    tags: item.tags || ['TypeScript', 'Python'],
    liveUrl: rawLive,
    repoUrl: repoLink,
    isTeamProject: isTeam,
    owner: repoOwner,
    features: (item.core_capabilities || []).map((cap: string, i: number) => ({
      title: `Core Capability #${i+1}`,
      desc: cap,
      icon: (['cpu', 'zap', 'shield', 'layers'][i % 4]) as any
    })),
    metrics: (item.performance_metrics || []).map((m: any) => ({
      label: m.label || 'Metric',
      value: m.value || 'Active'
    }))
  };
}

let memoryProjectsCache: Project[] | null = null;
const memorySingleProjectsCache: Record<string, Project> = {};

export async function fetchFeaturedProjects(): Promise<Project[]> {
  try {
    const res = await fetch('http://localhost:8000/api/v1/ai/projects/featured', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapAiProjectToClientProject);
      }
    }
  } catch (e) {
    console.warn("FastAPI server offline for featured projects.");
  }
  return memoryProjectsCache || [];
}

export async function fetchAllProjects(): Promise<Project[]> {
  if (memoryProjectsCache && memoryProjectsCache.length > 0) {
    return memoryProjectsCache;
  }

  try {
    const res = await fetch('http://localhost:8000/api/v1/ai/projects/all', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapAiProjectToClientProject);
        const seen = new Set<string>();
        const deduped = mapped.filter((p: Project) => {
          if (!p.id || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        memoryProjectsCache = deduped;
        return deduped;
      }
    }
  } catch (e) {
    console.warn("FastAPI server offline for all projects.");
  }

  return memoryProjectsCache || [];
}

export async function fetchProjectById(id: string): Promise<Project> {
  const normalizedId = id.toLowerCase();
  
  // Return cached single project ONLY if it's already a full AI case study
  const cached = memorySingleProjectsCache[normalizedId];
  if (cached && 
      cached.architecture && 
      cached.architecture.length > 100 &&
      !cached.architecture.includes("Click to trigger") &&
      !cached.architecture.includes("currently unavailable")) {
    return cached;
  }

  try {
    const res = await fetch(`http://localhost:8000/api/v1/ai/projects/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        const mapped = mapAiProjectToClientProject(data);
        memorySingleProjectsCache[normalizedId] = mapped;
        return mapped;
      }
    }
  } catch (e) {
    console.warn(`FastAPI server offline, using fallback lookup for '${id}'.`);
  }

  // Fallback generic data ONLY when API call fails
  const fallback: Project = {
    id: normalizedId,
    title: id.replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase(),
    category: 'Software Engineering',
    description: `Engineering repository '${id}' created by MIHIRrPATIL. Detailed AI case study is currently unavailable.`,
    longDescription: `Engineering repository '${id}' created by MIHIRrPATIL. Detailed AI case study is currently unavailable.`,
    architecture: `The ${id} project incorporates modular component architecture with continuous integration pipelines. Deep AI analysis will be processed during the next scheduled nightly batch.`,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    year: '2026',
    tags: ['GitHub', 'Software'],
    liveUrl: '',
    repoUrl: `https://github.com/MIHIRrPATIL/${id}`,
    isTeamProject: false,
    owner: 'MIHIRrPATIL',
    features: [
      { title: 'Core Capability #1', desc: 'GitHub Repository Tracking', icon: 'cpu' },
      { title: 'Core Capability #2', desc: 'Automated Code Hygiene', icon: 'zap' }
    ],
    metrics: [
      { label: 'Status', value: 'Active' }
    ]
  };
  memorySingleProjectsCache[normalizedId] = fallback;
  return fallback;
}

export interface PortfolioStats {
  totalRepos: number;
  languagesCount: number;
  languages: string[];
  totalStars: number;
  totalLoc?: number;
  locDisplay?: string;
}

export async function fetchPortfolioStats(): Promise<PortfolioStats> {
  try {
    const res = await fetch('http://localhost:8000/api/v1/ai/stats', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        totalRepos: data.total_repos || 51,
        languagesCount: data.languages_count || 18,
        languages: data.languages || ['Python', 'TypeScript', 'JavaScript', 'Rust', 'Next.js', 'React'],
        totalStars: data.total_stars || 5,
        totalLoc: data.total_loc || 938918,
        locDisplay: data.loc_display || '900K+'
      };
    }
  } catch (e) {
    console.warn("FastAPI server offline, returning fallback stats.");
  }
  return {
    totalRepos: 51,
    languagesCount: 18,
    languages: ['Python', 'TypeScript', 'JavaScript', 'Rust', 'Next.js', 'React'],
    totalStars: 5,
    totalLoc: 938918,
    locDisplay: '900K+'
  };
}
