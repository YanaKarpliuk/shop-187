import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const daysAgo = (n: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
};

async function main() {
  await prisma.returnRequestItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  await prisma.$executeRawUnsafe('ALTER SEQUENCE return_request_number_seq RESTART WITH 1');

  // 1. Normal order — everything returnable.
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-1001',
      email: 'anna@example.com',
      orderedAt: daysAgo(3),
      items: {
        create: [
          { name: 'Cast-iron teapot', quantity: 1, isSale: false, category: 'accessory' },
          { name: 'Ceramic mug', quantity: 3, isSale: false, category: 'accessory' },
        ],
      },
    },
  });

  // 2. Outside the 30-day window.
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-1002',
      email: 'ben@example.com',
      orderedAt: daysAgo(40),
      items: {
        create: [
          { name: 'Stainless tea infuser', quantity: 2, isSale: false, category: 'accessory' },
        ],
      },
    },
  });

  // 3. Sale item — excluded unless damaged.
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-1003',
      email: 'carla@example.com',
      orderedAt: daysAgo(5),
      items: {
        create: [
          { name: 'Sale mug (clearance)', quantity: 2, isSale: true, category: 'accessory' },
          { name: 'Tea strainer', quantity: 1, isSale: false, category: 'accessory' },
        ],
      },
    },
  });

  // 4. Tea + accessory — food excluded on hygiene grounds unless damaged.
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-1004',
      email: 'deniz@example.com',
      orderedAt: daysAgo(7),
      items: {
        create: [
          { name: 'Earl Grey loose leaf 100g', quantity: 2, isSale: false, category: 'food' },
          { name: 'Ceramic cup', quantity: 1, isSale: false, category: 'accessory' },
        ],
      },
    },
  });

  // 5. Partially returned — 4 ordered, 1 already in an open request, 3 left.
  const partiallyReturned = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1005',
      email: 'emil@example.com',
      orderedAt: daysAgo(10),
      items: {
        create: [{ name: 'Glass mug', quantity: 4, isSale: false, category: 'accessory' }],
      },
    },
    include: { items: true },
  });

  const [{ n }] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT nextval('return_request_number_seq') AS n
  `;

  await prisma.returnRequest.create({
    data: {
      orderId: partiallyReturned.id,
      returnNumber: `RET-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`,
      status: 'open',
      items: {
        create: [{ orderItemId: partiallyReturned.items[0].id, quantity: 1, reason: 'changed_mind' }],
      },
    },
  });

  console.log('Seed complete. Test orders:');
  console.log('  ORD-1001 anna@example.com   — normal, all returnable');
  console.log('  ORD-1002 ben@example.com    — outside 30-day window');
  console.log('  ORD-1003 carla@example.com  — contains a sale item');
  console.log('  ORD-1004 deniz@example.com  — mixed tea (food) + accessory');
  console.log('  ORD-1005 emil@example.com   — 4 ordered, 1 already requested → 3 left');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
