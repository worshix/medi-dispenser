import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subDays } from "date-fns";

// GET /api/stats - Get dashboard statistics
export async function GET() {
  try {
    // Get total patients
    const totalPatients = await prisma.patient.count();

    // Get active patients
    const activePatients = await prisma.patient.count({
      where: { status: "Active" },
    });

    // Get dispensing history for the last 7 days (for chart)
    const sevenDaysAgo = subDays(new Date(), 7);
    const dispensingHistory = await prisma.dispensingHistory.findMany({
      where: {
        dispensedAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { dispensedAt: "asc" },
    });

    // Group by day of week
    const dispensingByDay = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    dispensingHistory.forEach((record) => {
      const dayName = new Date(record.dispensedAt).toLocaleDateString("en-US", {
        weekday: "short",
      });
      const totalPills =
        record.pill1Dispensed +
        record.pill2Dispensed +
        record.pill3Dispensed +
        record.pill4Dispensed +
        record.pill5Dispensed;
      dispensingByDay[dayName as keyof typeof dispensingByDay] += totalPills;
    });

    // Get compliance data for the last 4 weeks
    const complianceData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = endOfWeek(weekStart);

      const weekDispensing = await prisma.dispensingHistory.count({
        where: {
          dispensedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
          success: true,
        },
      });

      // Calculate expected doses (assuming 3 doses per day * 7 days * active patients)
      const expectedDoses = activePatients * 3 * 7;
      const compliance = expectedDoses > 0 ? (weekDispensing / expectedDoses) * 100 : 0;

      complianceData.push({
        week: `Week ${4 - i}`,
        compliance: Math.min(100, Math.round(compliance)),
      });
    }

    // Get recent dispensing history
    const recentDispensing = await prisma.dispensingHistory.findMany({
      take: 10,
      orderBy: { dispensedAt: "desc" },
      include: {
        patient: true,
      },
    });

    return NextResponse.json({
      totalPatients,
      activePatients,
      dispensingByDay,
      complianceData,
      recentDispensing,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
