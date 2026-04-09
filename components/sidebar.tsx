"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  Activity,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Schedule", href: "/schedule", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-56 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
          <Pill className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">MediDispenser</p>
          <p className="text-[10px] text-slate-500 leading-tight">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-800 px-3 py-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600/20">
            <Activity className="h-3.5 w-3.5 text-teal-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-200">System Online</p>
            <p className="text-[10px] text-teal-400">All devices active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
