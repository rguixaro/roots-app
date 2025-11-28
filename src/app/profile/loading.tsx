import { Loader } from 'lucide-react'

export default function Loading() {
  return (
    <div className="text-ocean-400 flex h-screen items-center justify-center">
      <Loader size={64} className="animate-spin" />
    </div>
  )
}
