import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/controller/schedule?key=PATIENT_ID
// Microcontroller fetches schedule using patient ID as key
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Patient key is required" },
        { status: 400 }
      );
    }

    // Fetch patient and their schedule
    const patient = await prisma.patient.findUnique({
      where: { id: key },
      include: { schedule: true },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    if (!patient.schedule) {
      return NextResponse.json(
        { error: "No schedule found for this patient" },
        { status: 404 }
      );
    }

    // Return schedule data in a simple format for microcontroller
    return NextResponse.json({
      patientId: patient.id,
      patientName: patient.name,
      times: patient.schedule.times.split(","), // Convert comma-separated to array
      pills: {
        pill1: patient.schedule.pill1Quantity,
        pill2: patient.schedule.pill2Quantity,
        pill3: patient.schedule.pill3Quantity,
        pill4: patient.schedule.pill4Quantity,
        pill5: patient.schedule.pill5Quantity,
      },
      pillCounts: {
        pill1: patient.pill1Count,
        pill2: patient.pill2Count,
        pill3: patient.pill3Count,
        pill4: patient.pill4Count,
        pill5: patient.pill5Count,
      },
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
