import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function JCloudShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#090a0a] text-[#e8e8e3]">

      <Sidebar />

      <div className="lg:pl-[250px]">

        <Header />

        <main className="px-6 py-8 lg:px-10 lg:py-12">

          <div className="mx-auto max-w-[1500px]">

            {children}

          </div>

        </main>

      </div>

    </div>
  )
}