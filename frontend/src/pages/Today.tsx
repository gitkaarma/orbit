import { ApodHero } from '@/components/today/ApodHero'
import { AsteroidsCard } from '@/components/today/AsteroidsCard'
import { EarthCard } from '@/components/today/EarthCard'
import { ExploreStrip } from '@/components/today/ExploreStrip'
import { IssCard } from '@/components/today/IssCard'

export function Today() {
  return (
    <div className="space-y-8">
      <ApodHero />

      <div className="grid gap-4 sm:grid-cols-3">
        <IssCard />
        <AsteroidsCard />
        <EarthCard />
      </div>

      <ExploreStrip />
    </div>
  )
}
