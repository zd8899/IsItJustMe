import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Work", slug: "work" },
  { name: "Relationships", slug: "relationships" },
  { name: "Technology", slug: "technology" },
  { name: "Health", slug: "health" },
  { name: "Parenting", slug: "parenting" },
  { name: "Finance", slug: "finance" },
  { name: "Daily Life", slug: "daily-life" },
  { name: "Social", slug: "social" },
  { name: "Other", slug: "other" },
];

async function main() {
  console.log("Seeding categories...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
