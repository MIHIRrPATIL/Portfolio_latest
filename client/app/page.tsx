import Hero from '@/components/Hero'
import About from '@/components/About'
import AchievementsSection from '@/components/Achievements'
import ProjectsSection from '@/components/Projects'
import ThoughtsSection from '@/components/ThoughtsSection'
import { SocialFooter } from '@/components/global/SocialFooter'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-transparent">
      <Hero />
      <About />
      <AchievementsSection />
      <ProjectsSection />
      <ThoughtsSection />
      <SocialFooter />
    </main>
  );
}
