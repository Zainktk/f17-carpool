import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Testing database connection...");
    const userCount = await prisma.user.count();
    console.log("Current user count:", userCount);
    
    console.log("Attempting to create a test user...");
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        password: "password",
        role: "BOOKER",
        society: "Test Society"
      }
    });
    console.log("Test user created:", testUser.id);
    
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log("Test user deleted.");
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
