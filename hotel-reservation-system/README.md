# Hotel Reservation System (Starter)

Projekt startowy Next.js + Prisma dla systemu rezerwacji hoteli.

Szybkie kroki:

- Skopiuj `.env` i uzupełnij `DATABASE_URL` i `JWT_SECRET`.
- Zainstaluj zależności: `npm install`.
- Uruchom lokalnie: `npm run dev`.
- Baza Postgres: możesz użyć `docker-compose up`.

Struktura:

```
hotel-reservation-system/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── pages/
│   ├── components/
│   ├── api/
│   ├── hooks/
│   └── utils/
├── .env
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

Następne kroki: dodać migracje Prisma i podstawowe endpointy rejestracji/logowania.
