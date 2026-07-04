import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const contracts = await prisma.rentalContract.findMany({
    include: {
      tenant: true,
      apartment: true
    }
  });
  console.log("CONTRACTS:", JSON.stringify(contracts, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
