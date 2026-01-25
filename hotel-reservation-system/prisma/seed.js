const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findOrCreateHotel({ name, address, city, country, description }) {
  let hotel = await prisma.hotel.findFirst({
    where: { name, address },
    select: { id: true },
  });

  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: { name, address, city, country, description },
      select: { id: true },
    });
  }

  return hotel;
}

async function seedHotel({
  name,
  address,
  city,
  country,
  description,
  roomTypes,
  rooms,
  services,
}) {
  const hotel = await findOrCreateHotel({ name, address, city, country, description });

  for (const rt of roomTypes) {
    await prisma.roomType.upsert({
      where: { hotelId_name: { hotelId: hotel.id, name: rt.name } },
      update: {
        capacity: rt.capacity,
        basePrice: rt.basePrice,
        description: rt.description,
      },
      create: {
        hotelId: hotel.id,
        name: rt.name,
        capacity: rt.capacity,
        basePrice: rt.basePrice,
        description: rt.description,
      },
    });
  }

  const roomTypeByName = {};
  for (const rt of roomTypes) {
    const found = await prisma.roomType.findUnique({
      where: { hotelId_name: { hotelId: hotel.id, name: rt.name } },
      select: { id: true },
    });
    roomTypeByName[rt.name] = found.id;
  }

  if (Array.isArray(services)) {
    for (const s of services) {
      await prisma.service.upsert({
        where: { hotelId_name: { hotelId: hotel.id, name: s.name } },
        update: {
          description: s.description,
          pricingModel: s.pricingModel,
          price: s.price,
          isActive: true,
        },
        create: {
          hotelId: hotel.id,
          name: s.name,
          description: s.description,
          pricingModel: s.pricingModel,
          price: s.price,
          isActive: true,
        },
      });
    }
  }

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { hotelId_number: { hotelId: hotel.id, number: r.number } },
      update: {
        floor: r.floor,
        roomTypeId: roomTypeByName[r.roomTypeName],
        isActive: true,
      },
      create: {
        hotelId: hotel.id,
        number: r.number,
        floor: r.floor,
        roomTypeId: roomTypeByName[r.roomTypeName],
        isActive: true,
      },
    });
  }

  return hotel.id;
}

async function main() {
  const hotelIds = [];

  hotelIds.push(
    await seedHotel({
      name: 'Hotel Aurora',
      address: 'ul. Przykładowa 1',
      city: 'Warszawa',
      country: 'PL',
      description: 'Przykładowy hotel do seedowania bazy.',
      roomTypes: [
        { name: 'Single', capacity: 1, basePrice: '199.00', description: 'Pokój jednoosobowy' },
        { name: 'Double', capacity: 2, basePrice: '299.00', description: 'Pokój dwuosobowy' },
        { name: 'Suite', capacity: 4, basePrice: '599.00', description: 'Apartament' },
      ],
      rooms: [
        { number: '101', floor: 1, roomTypeName: 'Single' },
        { number: '102', floor: 1, roomTypeName: 'Single' },
        { number: '201', floor: 2, roomTypeName: 'Double' },
        { number: '202', floor: 2, roomTypeName: 'Double' },
        { number: '301', floor: 3, roomTypeName: 'Suite' },
      ],
      services: [
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
    }),
  );

  hotelIds.push(
    await seedHotel({
      name: 'Hotel Baltic View',
      address: 'ul. Nadmorska 10',
      city: 'Gdańsk',
      country: 'PL',
      description: 'Hotel nad morzem.',
      roomTypes: [
        { name: 'Single', capacity: 1, basePrice: '229.00', description: 'Pokój jednoosobowy' },
        { name: 'Double', capacity: 2, basePrice: '349.00', description: 'Pokój dwuosobowy' },
        { name: 'Family', capacity: 3, basePrice: '459.00', description: 'Pokój rodzinny' },
      ],
      rooms: [
        { number: '11', floor: 1, roomTypeName: 'Single' },
        { number: '12', floor: 1, roomTypeName: 'Single' },
        { number: '21', floor: 2, roomTypeName: 'Double' },
        { number: '22', floor: 2, roomTypeName: 'Double' },
        { number: '31', floor: 3, roomTypeName: 'Family' },
      ],
      services: [
        {
          name: 'Śniadanie',
          description: 'Śniadanie w formie bufetu',
          pricingModel: 'PER_NIGHT',
          price: '49.00',
        },
      ],
    }),
  );

  hotelIds.push(
    await seedHotel({
      name: 'Hotel Mountain Peak',
      address: 'ul. Górska 5',
      city: 'Zakopane',
      country: 'PL',
      description: 'Hotel w górach.',
      roomTypes: [
        { name: 'Double', capacity: 2, basePrice: '319.00', description: 'Pokój dwuosobowy' },
        { name: 'Suite', capacity: 4, basePrice: '649.00', description: 'Apartament' },
      ],
      rooms: [
        { number: 'A1', floor: 1, roomTypeName: 'Double' },
        { number: 'A2', floor: 1, roomTypeName: 'Double' },
        { number: 'B1', floor: 2, roomTypeName: 'Suite' },
      ],
      services: [
        {
          name: 'Parking',
          description: 'Miejsce parkingowe',
          pricingModel: 'PER_NIGHT',
          price: '39.00',
        },
      ],
    }),
  );

  console.log('Seed complete');
  console.log('hotelIds:');
  for (const id of hotelIds) console.log('-', id);
  console.log('Open: http://localhost:3000 (copy a hotelId into the UI)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
