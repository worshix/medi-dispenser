# MediDispenser API Documentation

## Overview
This document describes the API endpoints for the MediDispenser system, designed for microcontroller integration and web application management.

## Base URL
```
http://localhost:3000/api
```

---

## Microcontroller Endpoints

### 1. Get Schedule
**Endpoint:** `GET /api/controller/schedule`

**Description:** Microcontroller fetches patient schedule using patient ID as key.

**Query Parameters:**
- `key` (required): Patient ID (used as controller key)

**Example Request:**
```bash
curl "http://localhost:3000/api/controller/schedule?key=PATIENT_ID"
```

**Success Response (200):**
```json
{
  "patientId": "clxxx123456",
  "patientName": "John Doe",
  "times": ["08:00", "14:00", "20:00"],
  "pills": {
    "pill1": 2,
    "pill2": 1,
    "pill3": 0,
    "pill4": 1,
    "pill5": 0
  },
  "pillCounts": {
    "pill1": 50,
    "pill2": 30,
    "pill3": 0,
    "pill4": 25,
    "pill5": 0
  }
}
```

**Error Responses:**
- `400`: Missing patient key
- `404`: Patient not found or no schedule

---

### 2. Confirm Dispensing
**Endpoint:** `POST /api/controller/dispense`

**Description:** Microcontroller confirms pill dispensing and updates pill counts.

**Request Body:**
```json
{
  "key": "PATIENT_ID",
  "pill1": 2,
  "pill2": 1,
  "pill3": 0,
  "pill4": 1,
  "pill5": 0
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/controller/dispense \
  -H "Content-Type: application/json" \
  -d '{
    "key": "clxxx123456",
    "pill1": 2,
    "pill2": 1,
    "pill3": 0,
    "pill4": 1,
    "pill5": 0
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Dispensing recorded successfully",
  "pillCounts": {
    "pill1": 48,
    "pill2": 29,
    "pill3": 0,
    "pill4": 24,
    "pill5": 0
  }
}
```

**Notes:**
- Automatically sends low pill alert emails when counts fall below threshold
- Records dispensing history in database

---

## Web Application Endpoints

### 3. Get All Patients
**Endpoint:** `GET /api/patients`

**Success Response (200):**
```json
[
  {
    "id": "clxxx123456",
    "name": "John Doe",
    "age": 65,
    "condition": "Hypertension",
    "medication": "Lisinopril",
    "email": "john@example.com",
    "status": "Active",
    "pill1Count": 50,
    "pill2Count": 30,
    "pill3Count": 0,
    "pill4Count": 25,
    "pill5Count": 0,
    "schedule": {
      "times": "08:00,14:00,20:00",
      "pill1Quantity": 2,
      "pill2Quantity": 1,
      "pill3Quantity": 0,
      "pill4Quantity": 1,
      "pill5Quantity": 0
    }
  }
]
```

---

### 4. Create Patient
**Endpoint:** `POST /api/patients`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "age": 72,
  "condition": "Diabetes",
  "medication": "Metformin",
  "email": "jane@example.com",
  "pill1Count": 60,
  "pill2Count": 40,
  "pill3Count": 0,
  "pill4Count": 0,
  "pill5Count": 0
}
```

**Success Response (201):**
Returns created patient object with generated ID.

---

### 5. Get Single Patient
**Endpoint:** `GET /api/patients/[id]`

**Success Response (200):**
Returns patient object with schedule and dispensing history.

---

### 6. Update Patient
**Endpoint:** `PATCH /api/patients/[id]`

**Request Body:** (partial update supported)
```json
{
  "pill1Count": 100,
  "status": "Active"
}
```

---

### 7. Delete Patient
**Endpoint:** `DELETE /api/patients/[id]`

**Success Response (200):**
```json
{
  "success": true
}
```

---

### 8. Create/Update Schedule
**Endpoint:** `POST /api/schedules`

**Request Body:**
```json
{
  "patientId": "clxxx123456",
  "times": ["08:00", "14:00", "20:00"],
  "pill1Quantity": 2,
  "pill2Quantity": 1,
  "pill3Quantity": 0,
  "pill4Quantity": 1,
  "pill5Quantity": 0
}
```

**Success Response (200/201):**
Returns created or updated schedule object.

---

### 9. Get Dashboard Statistics
**Endpoint:** `GET /api/stats`

**Success Response (200):**
```json
{
  "totalPatients": 5,
  "activePatients": 4,
  "dispensingByDay": {
    "Mon": 12,
    "Tue": 15,
    "Wed": 10,
    "Thu": 14,
    "Fri": 13,
    "Sat": 11,
    "Sun": 9
  },
  "complianceData": [
    { "week": "Week 1", "compliance": 85 },
    { "week": "Week 2", "compliance": 90 },
    { "week": "Week 3", "compliance": 80 },
    { "week": "Week 4", "compliance": 95 }
  ],
  "recentDispensing": [...]
}
```

---

## Email Notifications

The system automatically sends emails in the following scenarios:

1. **Low Pill Alert**: When pill count falls below threshold (default: 10)
   - Sent to: Admin email (SMTP_USER from .env)
   - Contains: Patient name, pill type, remaining count

2. **Medication Reminder**: (Can be triggered via scheduled jobs)
   - Sent to: Patient email
   - Contains: Reminder to take medication at scheduled time

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (missing required fields)
- `404`: Not Found
- `500`: Internal Server Error

Error Response Format:
```json
{
  "error": "Error message description"
}
```

---

## Microcontroller Integration Example

### Arduino/ESP32 Example:
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* patientKey = "clxxx123456";
const char* serverUrl = "http://192.168.1.100:3000/api";

void getSchedule() {
  HTTPClient http;
  String url = String(serverUrl) + "/controller/schedule?key=" + patientKey;
  http.begin(url);
  
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    // Parse JSON and dispense pills
  }
  http.end();
}

void confirmDispensing(int p1, int p2, int p3, int p4, int p5) {
  HTTPClient http;
  String url = String(serverUrl) + "/controller/dispense";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  String json = "{\"key\":\"" + String(patientKey) + 
                "\",\"pill1\":" + String(p1) +
                ",\"pill2\":" + String(p2) +
                ",\"pill3\":" + String(p3) +
                ",\"pill4\":" + String(p4) +
                ",\"pill5\":" + String(p5) + "}";
  
  int httpCode = http.POST(json);
  http.end();
}
```
