import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLowPillAlert } from "@/lib/email";

// POST /api/controller/dispense
// Microcontroller confirms dispensing and reduces pill counts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, pill1, pill2, pill3, pill4, pill5 } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Patient key is required" },
        { status: 400 }
      );
    }

    // Fetch patient
    const patient = await prisma.patient.findUnique({
      where: { id: key },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Calculate new pill counts
    const newPill1Count = Math.max(0, patient.pill1Count - (pill1 || 0));
    const newPill2Count = Math.max(0, patient.pill2Count - (pill2 || 0));
    const newPill3Count = Math.max(0, patient.pill3Count - (pill3 || 0));
    const newPill4Count = Math.max(0, patient.pill4Count - (pill4 || 0));
    const newPill5Count = Math.max(0, patient.pill5Count - (pill5 || 0));

    // Update patient pill counts
    await prisma.patient.update({
      where: { id: key },
      data: {
        pill1Count: newPill1Count,
        pill2Count: newPill2Count,
        pill3Count: newPill3Count,
        pill4Count: newPill4Count,
        pill5Count: newPill5Count,
      },
    });

    // Record dispensing history
    await prisma.dispensingHistory.create({
      data: {
        patientId: key,
        pill1Dispensed: pill1 || 0,
        pill2Dispensed: pill2 || 0,
        pill3Dispensed: pill3 || 0,
        pill4Dispensed: pill4 || 0,
        pill5Dispensed: pill5 || 0,
        success: true,
      },
    });

    // Check for low pill alerts and send emails
    const adminEmail = process.env.SMTP_USER || "";
    const alerts = [];

    if (newPill1Count <= patient.pill1Threshold && pill1 > 0) {
      alerts.push(
        sendLowPillAlert(adminEmail, patient.name, patient.id, "Pill 1", newPill1Count)
      );
    }
    if (newPill2Count <= patient.pill2Threshold && pill2 > 0) {
      alerts.push(
        sendLowPillAlert(adminEmail, patient.name, patient.id, "Pill 2", newPill2Count)
      );
    }
    if (newPill3Count <= patient.pill3Threshold && pill3 > 0) {
      alerts.push(
        sendLowPillAlert(adminEmail, patient.name, patient.id, "Pill 3", newPill3Count)
      );
    }
    if (newPill4Count <= patient.pill4Threshold && pill4 > 0) {
      alerts.push(
        sendLowPillAlert(adminEmail, patient.name, patient.id, "Pill 4", newPill4Count)
      );
    }
    if (newPill5Count <= patient.pill5Threshold && pill5 > 0) {
      alerts.push(
        sendLowPillAlert(adminEmail, patient.name, patient.id, "Pill 5", newPill5Count)
      );
    }

    // Send all alerts
    if (alerts.length > 0) {
      await Promise.all(alerts);
    }

    return NextResponse.json({
      success: true,
      message: "Dispensing recorded successfully",
      pillCounts: {
        pill1: newPill1Count,
        pill2: newPill2Count,
        pill3: newPill3Count,
        pill4: newPill4Count,
        pill5: newPill5Count,
      },
    });
  } catch (error) {
    console.error("Error recording dispensing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
