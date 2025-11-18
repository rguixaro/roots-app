export default function NarrowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <div className="w-3/4">{children}</div>
    </div>
  )
}
