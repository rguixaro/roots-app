import { TreesFeed, Toolbar, Milestones, Highlights } from '@/components/trees'

export default async function TreesPage() {
  return (
    <main className="flex items-start justify-center">
      <div className="w-3/4 sm:w-3/4">
        <div className="text-ocean-400 flex h-full items-center justify-center">
          <div className="mb-20 h-full w-full sm:w-3/5">
            <Toolbar />
            <TreesFeed />
            <div className="mx-auto my-6 w-5/6 items-center justify-center">
              <div className="bg-ocean-100 h-1 rounded shadow-lg" />
            </div>
            <Milestones />
            <div className="mx-auto my-6 w-5/6 items-center justify-center">
              <div className="bg-ocean-100 h-1 rounded shadow-lg" />
            </div>
            <Highlights />
          </div>
        </div>
      </div>
    </main>
  )
}
