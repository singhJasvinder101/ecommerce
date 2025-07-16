## Tech Stack 💻

- **Framework:** [Next.js](https://nextjs.org)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Authentication:** [Next Auth](https://authjs.dev)
- **Database:** [Postgres](https://www.postgresql.org/)
- **ORM:** [Prisma ORM](https://www.prisma.io)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com)
- **File Uploads:** [uploadthing](https://uploadthing.com)
- **Payments infrastructure:** [Stripe](https://stripe.com/)


## Running Locally

1. Clone the repository

   ```bash
   git clone https://github.com/singhJasvinder101/ecommerce.git
   ```

2. Install dependencies using npm

   ```bash
   npm install
   ```

3. Copy the `.env.example` to `.env` and update the variables.

   ```bash
   cp .env.example .env
   ```

4. Configure your .env file with your secret

   ```env
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   
   NEXT_AUTH_SECRET=
   
   UPLOADTHING_SECRET=
   UPLOADTHING_APP_ID=
   
   MIDTRANS_CLIENT_KEY=
   MIDTRANS_SERVER_KEY=
   
   DATABASE_URL=
   ```

5. Generate prisma client

   ```bash
   npx prisma generate
   ```

6. Push the database schema

   ```bash
   npx prisma db push
   ```

7. Seeding the categories data

   ```bash
   npx prisma db seed
   ```

8. Start the development server

   ```bash
   npm run dev
   ```

## Where do I deploy this?

- For the Nextjs application, I deploy it on [Vercel](https://vercel.com/)
- And for the PostgreSQL database I deploy it on [Neon](https://neon.com/)

## Contributing

Contributions are welcome! Please open an issue if you have any questions or suggestions. Your contributions will be acknowledged. See the [contributing guide](./CONTRIBUTING.md) for more information.

