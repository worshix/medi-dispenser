import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/schedules - Create or update a schedule for a patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      times,
      pill1Quantity,
      pill2Quantity,
      pill3Quantity,
      pill4Quantity,
      pill5Quantity,
    } = body;

    if (!patientId || !times) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Convert times array to comma-separated string if it's an array
    const timesString = Array.isArray(times) ? times.join(",") : times;

    // Check if schedule already exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { patientId },
    });

    let schedule;
    if (existingSchedule) {
      // Update existing schedule
      schedule = await prisma.schedule.update({
        where: { patientId },
        data: {
          times: timesString,
          pill1Quantity: parseInt(pill1Quantity) || 0,
          pill2Quantity: parseInt(pill2Quantity) || 0,
          pill3Quantity: parseInt(pill3Quantity) || 0,
          pill4Quantity: parseInt(pill4Quantity) || 0,
          pill5Quantity: parseInt(pill5Quantity) || 0,
        },
      });
    } else {
      // Create new schedule
      schedule = await prisma.schedule.create({
        data: {
          patientId,
          times: timesString,
          pill1Quantity: parseInt(pill1Quantity) || 0,
          pill2Quantity: parseInt(pill2Quantity) || 0,
          pill3Quantity: parseInt(pill3Quantity) || 0,
          pill4Quantity: parseInt(pill4Quantity) || 0,
          pill5Quantity: parseInt(pill5Quantity) || 0,
        },
      });
    }

    return NextResponse.json(schedule, { status: existingSchedule ? 200 : 201 });
  } catch (error) {
    console.error("Error creating/updating schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
