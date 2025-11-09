import { auth } from '@/auth'
import { CreateFamily } from '@/components/families/form/create'

export default async function CreateFamilyPage({}) {
  const session = await auth()
  if (!session) return null

  return <CreateFamily userId={session.user.id!} />
}
