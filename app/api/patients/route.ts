import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/patients - Get all patients
export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        schedule: true,
        dispensingHistory: {
          orderBy: { dispensedAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      age,
      condition,
      medication,
      email,
      pill1Count,
      pill2Count,
      pill3Count,
      pill4Count,
      pill5Count,
    } = body;

    if (!name || !age || !condition || !medication || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        age: parseInt(age),
        condition,
        medication,
        email,
        pill1Count: parseInt(pill1Count) || 0,
        pill2Count: parseInt(pill2Count) || 0,
        pill3Count: parseInt(pill3Count) || 0,
        pill4Count: parseInt(pill4Count) || 0,
        pill5Count: parseInt(pill5Count) || 0,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
