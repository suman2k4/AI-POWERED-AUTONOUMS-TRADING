import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <TopBar />
        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
