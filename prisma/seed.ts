import { PrismaClient, Role, DocumentType, MovementType, DiscountType } from '../generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Create 50 Users
  const users = await Promise.all(
    Array(50).fill(null).map(async () => {
      return prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: await faker.internet.password(), // In production, this should be hashed
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: faker.helpers.arrayElement([Role.SALESPERSON, Role.ADMINISTRATOR]),
          phoneNumber: faker.phone.number(),
          address: faker.location.streetAddress(),
          isActive: faker.datatype.boolean(),
        },
      });
    })
  );

  // Create 50 Clients
  const clients = await Promise.all(
    Array(50).fill(null).map(() => {
      return prisma.client.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phoneNumber: faker.phone.number(),
          address: faker.location.streetAddress(),
          documentType: faker.helpers.arrayElement([DocumentType.CC, DocumentType.TI]),
          documentNumber: faker.string.numeric(10),
          isActive: faker.datatype.boolean(),
        },
      });
    })
  );

  // Create 50 Suppliers
  const suppliers = await Promise.all(
    Array(50).fill(null).map(() => {
      return prisma.supplier.create({
        data: {
          name: faker.company.name(),
          contactName: faker.person.fullName(),
          email: faker.internet.email(),
          phoneNumber: faker.phone.number(),
          address: faker.location.streetAddress(),
          documentType: faker.helpers.arrayElement([DocumentType.CC, DocumentType.TI]),
          documentNumber: faker.string.numeric(10),
          isActive: faker.datatype.boolean(),
        },
      });
    })
  );

  // Create 50 Products
  const products = await Promise.all(
    Array(50).fill(null).map(() => {
      return prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          minQuantity: faker.number.int({ min: 1, max: 10 }),
          maxQuantity: faker.number.int({ min: 50, max: 100 }),
          currentStock: faker.number.int({ min: 10, max: 50 }),
          isActive: faker.datatype.boolean(),
          supplierId: suppliers[faker.number.int({ min: 0, max: 49 })].id,
        },
      });
    })
  );

  // Create 50 Prices
  const prices = await Promise.all(
    Array(50).fill(null).map(() => {
      const purchasePrice = parseFloat(faker.commerce.price({ min: 10, max: 100 }));
      return prisma.price.create({
        data: {
          purchasePrice: purchasePrice,
          sellingPrice: purchasePrice * 1.3, // 30% markup
          isCurrentPrice: faker.datatype.boolean(),
          validFrom: faker.date.past(),
          validTo: faker.date.future(),
          productId: products[faker.number.int({ min: 0, max: 49 })].id,
        },
      });
    })
  );

  // Create 50 Discounts
  await Promise.all(
    Array(50).fill(null).map(() => {
      return prisma.discount.create({
        data: {
          name: faker.commerce.productAdjective() + ' Discount',
          description: faker.lorem.sentence(),
          type: faker.helpers.arrayElement([DiscountType.PERCENTAGE, DiscountType.FIXED_AMOUNT]),
          value: parseFloat(faker.commerce.price({ min: 5, max: 30 })),
          isActive: faker.datatype.boolean(),
          startDate: faker.date.past(),
          endDate: faker.date.future(),
          priceId: prices[faker.number.int({ min: 0, max: 49 })].id,
        },
      });
    })
  );

  // Create 50 Sales
  const sales = await Promise.all(
    Array(50).fill(null).map(() => {
      return prisma.sale.create({
        data: {
          saleDate: faker.date.recent(),
          totalAmount: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
          notes: faker.lorem.sentence(),
          clientId: clients[faker.number.int({ min: 0, max: 49 })].id,
          userId: users[faker.number.int({ min: 0, max: 49 })].id,
        },
      });
    })
  );

  // Create 50 Sale Details
  await Promise.all(
    Array(50).fill(null).map(() => {
      const quantity = faker.number.int({ min: 1, max: 10 });
      const unitPrice = parseFloat(faker.commerce.price({ min: 10, max: 100 }));
      const discountAmount = parseFloat(faker.commerce.price({ min: 1, max: 10 }));
      return prisma.saleDetail.create({
        data: {
          quantity: quantity,
          unitPrice: unitPrice,
          discountAmount: discountAmount,
          subtotal: quantity * unitPrice - discountAmount,
          productId: products[faker.number.int({ min: 0, max: 49 })].id,
          saleId: sales[faker.number.int({ min: 0, max: 49 })].id,
        },
      });
    })
  );

  // Create 50 Inventory Movements
  await Promise.all(
    Array(50).fill(null).map(() => {
      return prisma.inventoryMovement.create({
        data: {
          type: faker.helpers.arrayElement([MovementType.ENTRY, MovementType.EXIT]),
          quantity: faker.number.int({ min: 1, max: 50 }),
          reason: faker.lorem.sentence(),
          notes: faker.lorem.paragraph(),
          movementDate: faker.date.recent(),
          productId: products[faker.number.int({ min: 0, max: 49 })].id,
          supplierId: faker.datatype.boolean() ? suppliers[faker.number.int({ min: 0, max: 49 })].id : null,
          userId: users[faker.number.int({ min: 0, max: 49 })].id,
          saleId: faker.datatype.boolean() ? sales[faker.number.int({ min: 0, max: 49 })].id : null,
        },
      });
    })
  );

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 