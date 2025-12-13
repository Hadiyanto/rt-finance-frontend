export default function Topbar() {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      <div className="font-medium">Welcome, Admin</div>

      <div className="flex items-center gap-4">
        <button className="text-sm text-gray-600 hover:underline">
          Logout
        </button>
      </div>
    </header>
  );
}
