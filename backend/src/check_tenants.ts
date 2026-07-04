import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const tenants = await prisma.tenant.findMany({
    include: {
      user: true,
    }
  });
  console.log("TENANTS:", JSON.stringify(tenants, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
