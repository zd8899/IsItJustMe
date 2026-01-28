import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

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

  // Create a sample user for demonstration and testing
  console.log("Seeding sample user...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const sampleUser = await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: {
      username: "testuser",
      passwordHash: passwordHash,
    },
  });

  // Create a sample post by the registered user
  console.log("Seeding sample post by registered user...");
  const dailyLifeCategory = await prisma.category.findUnique({
    where: { slug: "daily-life" },
  });

  if (dailyLifeCategory) {
    // Check if user already has posts
    const existingPost = await prisma.post.findFirst({
      where: { userId: sampleUser.id },
    });

    if (!existingPost) {
      await prisma.post.create({
        data: {
          frustration: "find time for everything",
          identity: "a busy professional",
          categoryId: dailyLifeCategory.id,
          userId: sampleUser.id,
        },
      });
    }
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
