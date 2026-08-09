import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Outlet />
    </div>
  );
}
