const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Hotel Aurora',
      address: 'ul. Przykładowa 1',
      city: 'Warszawa',
      country: 'PL',
      description: 'Przykładowy hotel do seedowania bazy.',
      roomTypes: {
        create: [
          {
            name: 'Single',
            capacity: 1,
            basePrice: '199.00',
            description: 'Pokój jednoosobowy',
          },
          {
            name: 'Double',
            capacity: 2,
            basePrice: '299.00',
            description: 'Pokój dwuosobowy',
          },
          {
            name: 'Suite',
            capacity: 4,
            basePrice: '599.00',
            description: 'Apartament',
          },
        ],
      },
      services: {
        create: [
          {
            name: 'Śniadanie',
            description: 'Śniadanie w formie bufetu',
            pricingModel: 'PER_NIGHT',
            price: '45.00',
          },
          {
            name: 'Parking',
            description: 'Miejsce parkingowe',
            pricingModel: 'PER_NIGHT',
            price: '35.00',
          },
        ],
      },
    },
    include: { roomTypes: true },
  });

  const single = hotel.roomTypes.find((rt) => rt.name === 'Single');
  const double = hotel.roomTypes.find((rt) => rt.name === 'Double');
  const suite = hotel.roomTypes.find((rt) => rt.name === 'Suite');

  await prisma.room.createMany({
    data: [
      { hotelId: hotel.id, roomTypeId: single.id, number: '101', floor: 1 },
      { hotelId: hotel.id, roomTypeId: single.id, number: '102', floor: 1 },
      { hotelId: hotel.id, roomTypeId: double.id, number: '201', floor: 2 },
      { hotelId: hotel.id, roomTypeId: double.id, number: '202', floor: 2 },
      { hotelId: hotel.id, roomTypeId: suite.id, number: '301', floor: 3 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete:', { hotelId: hotel.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
