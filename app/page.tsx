"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalPatients: number;
  activePatients: number;
  dispensingByDay: Record<string, number>;
  complianceData: Array<{ week: string; compliance: number }>;
  recentDispensing: Array<{
    id: string;
    dispensedAt: string;
    patient: { name: string };
    pill1Dispensed: number;
    pill2Dispensed: number;
    pill3Dispensed: number;
    pill4Dispensed: number;
    pill5Dispensed: number;
  }>;
}

const defaultStats: Stats = {
  totalPatients: 0,
  activePatients: 0,
  dispensingByDay: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
  complianceData: [],
  recentDispensing: [],
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalPatients: data.totalPatients ?? 0,
          activePatients: data.activePatients ?? 0,
          dispensingByDay: data.dispensingByDay ?? defaultStats.dispensingByDay,
          complianceData: data.complianceData ?? [],
          recentDispensing: data.recentDispensing ?? [],
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const dispensingChartData = Object.entries(stats.dispensingByDay).map(
    ([day, value]) => ({ day, pills: value })
  );

  return (
    <div className="h-screen overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-500">Medication management overview</p>
          </div>
          <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
            <Link href="/schedule">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              View Schedule
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-8">
        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Patients</p>
                  <p className="mt-1.5 text-3xl font-bold text-slate-900">{stats.totalPatients}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                  <Users className="h-5 w-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Patients</p>
                  <p className="mt-1.5 text-3xl font-bold text-slate-900">{stats.activePatients}</p>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Currently active</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dispenses Today</p>
                  <p className="mt-1.5 text-3xl font-bold text-slate-900">
                    {stats.dispensingByDay[new Date().toLocaleDateString("en-US", { weekday: "short" })] ?? 0}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Compliance Rate</p>
                  <p className="mt-1.5 text-3xl font-bold text-slate-900">
                    {stats.complianceData.length > 0
                      ? `${Math.round(stats.complianceData.reduce((a, b) => a + b.compliance, 0) / stats.complianceData.length)}%`
                      : "—"}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <Calendar className="h-5 w-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Dispensing History</CardTitle>
              <p className="text-xs text-slate-400">Pills dispensed per day this week</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dispensingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: "11px" }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "11px" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pills"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ fill: "#0d9488", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Medication Compliance</CardTitle>
              <p className="text-xs text-slate-400">Weekly adherence percentage</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.complianceData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: "11px" }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "11px" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v) => [`${v}%`, "Compliance"]}
                  />
                  <Bar dataKey="compliance" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Dispensing Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Recent Dispensing Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date &amp; Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pills Dispensed</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentDispensing.length > 0 ? (
                  stats.recentDispensing.map((record) => {
                    const totalPills =
                      record.pill1Dispensed +
                      record.pill2Dispensed +
                      record.pill3Dispensed +
                      record.pill4Dispensed +
                      record.pill5Dispensed;
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5 text-sm font-medium text-slate-900">{record.patient.name}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-500">
                          {new Date(record.dispensedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600">{totalPills} pills</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Success
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                      No dispensing activity yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
