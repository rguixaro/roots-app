import { auth } from '@/auth'
import { getTrees } from '@/server/queries'

import { TreesFeed, Milestones, Greeting, LastActive } from '@/components/trees'

export default async function TreesPage() {
  const session = await auth()
  const username = session?.user?.name ?? ''

  const trees = (await getTrees())?.trees ?? []
  const hasTrees = trees.length > 0

  return (
    <main className="flex flex-col items-start justify-center">
      <div className="mx-auto w-11/12 max-w-6xl space-y-6 self-center py-6">
        <Greeting username={username} />
        {hasTrees && <LastActive />}
        <TreesFeed />
        {hasTrees && <Milestones />}
      </div>
    </main>
  )
}
