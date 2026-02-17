# Medi Dispenser.

This webapp is for monitoring how clients take their medicine. It will be connected to a pill dispenser that is capable of dispensing different types of pills. We will be using an sqlite with prisma. I want you to check the 2 images in the roote folder. /image1.jpeg ang image2.jpeg. We will be using shadcn components. 

I only want content that fits one page on a big screen then for the phone do what you want. 

I will be using this webapp to communicate with a micro controller so create the necessary routes. Lets say the controller connected to the app to get its schedule as soon as it lights up using its key. It should be very short and easy. Lets not complicate the code by separating patient and dispenser. Make sure its just one thing. 

In the patients tab, we just add patients and a new id is generated which is the same as the key for the controller.

On the schedule page we create schedules for the patients with time, and quantity per pill for the five pills. Each patient has one schedule. 

We also need to know how many pill of a certain type each patient has so we know and alert the admin via email. We also email the patience when its time to take a pill.

Lets also put a route for the controller to confirm that it finished dispensing so that we reduce the number of pills.

The last time I used AI with prisma it suffered to create a working client so I am giving you a snippet that worked in the end.

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Create LibSQL adapter for local SQLite
const adapter = new PrismaLibSql({
  url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

```
Below is a snippet of the environment variables. Use them for sending emails using nodemailer

```env
DATABASE_URL="file:./dev.db"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="worshiplivingstone@gmail.com"
SMTP_PASS="necmdedextgqjqmc"
```

People like to see tables and graphical representation of data so make sure you have that.