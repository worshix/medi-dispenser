import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMedicationReminder(
  patientEmail: string,
  patientName: string,
  time: string
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: patientEmail,
      subject: "Medication Reminder - Time to Take Your Pills",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Medication Reminder</h2>
          <p>Hello ${patientName},</p>
          <p>This is a friendly reminder that it's time to take your medication.</p>
          <p><strong>Scheduled Time:</strong> ${time}</p>
          <p>Please ensure you take your pills as prescribed.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated message from your MediDispenser system.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending medication reminder:", error);
    return { success: false, error };
  }
}

export async function sendLowPillAlert(
  adminEmail: string,
  patientName: string,
  patientId: string,
  pillType: string,
  remainingCount: number
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `Low Pill Alert - ${patientName} (${pillType})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Low Pill Alert</h2>
          <p>This is an alert that a patient is running low on medication.</p>
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>Patient ID:</strong> ${patientId}</p>
          <p><strong>Pill Type:</strong> ${pillType}</p>
          <p><strong>Remaining Count:</strong> ${remainingCount}</p>
          <p style="color: #DC2626; font-weight: bold;">Please refill the medication as soon as possible.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated alert from your MediDispenser system.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending low pill alert:", error);
    return { success: false, error };
  }
}
