"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Calendar } from "lucide-react";
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
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const dispensingChartData = Object.entries(stats.dispensingByDay).map(
    ([day, value]) => ({
      day,
      pills: value,
    })
  );

  return (
    <div className="h-screen overflow-y-auto p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">
              Welcome back! Here&apos;s your medication overview
            </p>
          </div>
          <div className="flex gap-3">
            {/* <Button className="bg-blue-600 hover:bg-blue-700">
              <Pill className="mr-2 h-4 w-4" />
              Dispense Now
            </Button> */}
            <Button asChild variant="outline" className="border-blue-200 text-blue-600">
              <Link href="/schedule">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar</Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalPatients}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Active Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.activePatients}
              </div>
              <p className="text-sm text-green-600">Status: Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dispensing History Chart */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Dispensing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dispensingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pills"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Medication Compliance Chart */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Medication Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.complianceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="week"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="compliance" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Dispensing Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Recent Dispensing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Date &amp; Time</th>
                    <th className="pb-3 font-medium">Pills Dispensed</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stats.recentDispensing.length > 0 ? (
                    stats.recentDispensing.map((record) => {
                      const totalPills =
                        record.pill1Dispensed +
                        record.pill2Dispensed +
                        record.pill3Dispensed +
                        record.pill4Dispensed +
                        record.pill5Dispensed;
                      return (
                        <tr key={record.id} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900">
                            {record.patient.name}
                          </td>
                          <td className="py-3 text-gray-600">
                            {new Date(record.dispensedAt).toLocaleString()}
                          </td>
                          <td className="py-3 text-gray-600">{totalPills} pills</td>
                          <td className="py-3">
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Success
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No dispensing activity yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
