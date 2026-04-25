export default function NarrowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <div className="mx-auto w-11/12 max-w-6xl">{children}</div>
    </div>
  )
}
