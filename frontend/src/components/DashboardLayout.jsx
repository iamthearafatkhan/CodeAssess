import Sidebar from './Sidebar';

export default function DashboardLayout({ navItems, children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <Sidebar navItems={navItems} />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}