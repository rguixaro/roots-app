import { auth } from '@/auth'
import { CreateTree } from '@/components/trees/form/create'

export default async function CreateTreePage({}) {
  const session = await auth()
  if (!session) return null

  return <CreateTree userId={session.user.id!} />
}
