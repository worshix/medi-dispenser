-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pill1Count" INTEGER NOT NULL DEFAULT 0,
    "pill2Count" INTEGER NOT NULL DEFAULT 0,
    "pill3Count" INTEGER NOT NULL DEFAULT 0,
    "pill4Count" INTEGER NOT NULL DEFAULT 0,
    "pill5Count" INTEGER NOT NULL DEFAULT 0,
    "pill1Threshold" INTEGER NOT NULL DEFAULT 10,
    "pill2Threshold" INTEGER NOT NULL DEFAULT 10,
    "pill3Threshold" INTEGER NOT NULL DEFAULT 10,
    "pill4Threshold" INTEGER NOT NULL DEFAULT 10,
    "pill5Threshold" INTEGER NOT NULL DEFAULT 10
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "times" TEXT NOT NULL,
    "pill1Quantity" INTEGER NOT NULL DEFAULT 0,
    "pill2Quantity" INTEGER NOT NULL DEFAULT 0,
    "pill3Quantity" INTEGER NOT NULL DEFAULT 0,
    "pill4Quantity" INTEGER NOT NULL DEFAULT 0,
    "pill5Quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DispensingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "dispensedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pill1Dispensed" INTEGER NOT NULL DEFAULT 0,
    "pill2Dispensed" INTEGER NOT NULL DEFAULT 0,
    "pill3Dispensed" INTEGER NOT NULL DEFAULT 0,
    "pill4Dispensed" INTEGER NOT NULL DEFAULT 0,
    "pill5Dispensed" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "DispensingHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_patientId_key" ON "Schedule"("patientId");
