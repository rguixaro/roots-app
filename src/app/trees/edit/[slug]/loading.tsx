import { Loader } from 'lucide-react'

export default function Loading() {
  return (
    <div className="text-ocean-400 mt-32 flex flex-col items-center justify-center">
      <Loader size={32} className="mb-4 animate-spin" />
    </div>
  )
}
