"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Pill,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-blue-600 to-blue-700 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
          <Pill className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold">MediDispenser</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Support */}
      <div className="border-t border-white/20 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
            <span className="text-xs font-bold">!</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium">Support</p>
            <p className="text-xs text-white/60">Need help?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
