# 🚀 Backend Starter Pack

A robust, production-ready backend starter pack built with **Node.js**, **Express**, **TypeScript**, and **Prisma**. Designed for scalability, ease of use, and developer happiness.

## ✨ Features

- **Type Safety**: Built with TypeScript for reliable and maintainable code.
- **Database ORM**: Prisma ORM with MongoDB (easily switchable to PostgreSQL/MySQL).
- **Validation**: Request validation using Zod.
- **Authentication**: Modular auth structure ready to expand.
- **Error Handling**: Centralized global error handler.
- **Logging**: Production-grade logging with Winston and daily rotation.
- **Security**: 
  - Helmet (HTTP headers protection)
  - CORS configured
  - Explicit database connection management
  - Graceful shutdown handling

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (via Prisma)
- **Validation**: Zod
- **Logs**: Winston, Winston Daily Rotate File

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (Local or Atlas URL)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/backend-starter-pack.git
    cd backend-starter-pack
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Create a `.env` file in the root directory (copy from `.env.example` if available) and add:

    ```env
    NODE_ENV=development
    PORT=8000
    DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/my-db?retryWrites=true&w=majority"
    PASSWORD_SALT=12
    CORS_ORIGIN=http://localhost:3000
    ```

4.  **Generate Prisma Client**
    ```bash
    npx prisma generate
    ```

5.  **Run the Server**
    ```bash
    npm run dev
    ```

## 🏗️ Project Architecture

The project follows a **Modular Architecture**. Each feature is encapsulated in its own module within `src/app/modules/`.

```
src/
├── app/
│   ├── middlewares/    # Global middlewares (auth, validation, error handler)
│   ├── modules/        # Feature modules
│   │   └── Auth/       # Example module
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── auth.route.ts
│   │       ├── auth.interface.ts 
│   │       └── auth.validation.ts
│   └── routes/         # Main router entry point
├── config/             # Environment config
├── lib/                # Shared libraries (Prisma client)
├── utils/              # Utility functions (Logger, Hash)
├── app.ts              # Express App setup
└── server.ts           # Server entry point
```

## 🧩 How to Add a New Module

To scale the application, follow this pattern when adding new features (e.g., `Book` module).

1.  **Create the Module Folder**
    Create `src/app/modules/Book/`.

2.  **Create Interface (`book.interface.ts`)**
    Define your TypeScript types.
    ```typescript
    export type IBook = {
      title: string;
      author: string;
      publishedYear: number;
    }
    ```

3.  **Create Validation (`book.validation.ts`)**
    Define Zod schemas for requests.
    ```typescript
    import { z } from "zod";

    export const createBookSchema = z.object({
      body: z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        publishedYear: z.number().int(),
      }),
    });

    export const BookValidation = { createBookSchema };
    ```

4.  **Create Service (`book.service.ts`)**
    Handle business logic and database interactions.
    ```typescript
    import prisma from "../../../lib/prisma";
    import { IBook } from "./book.interface";

    const createBook = async (payload: IBook) => {
      return await prisma.book.create({ data: payload });
    };

    export const BookService = { createBook };
    ```

5.  **Create Controller (`book.controller.ts`)**
    Handle request/response logic. Use `catchAsync` to handle errors automatically.
    ```typescript
    import { Request, Response } from "express";
    import catchAsync from "../../../shared/catchAsync";
    import sendResponse from "../../../shared/sendResponse";
    import { BookService } from "./book.service";

    const createBook = catchAsync(async (req: Request, res: Response) => {
      const result = await BookService.createBook(req.body);
      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Book created successfully",
        data: result,
      });
    });

    export const BookController = { createBook };
    ```

6.  **Create Routes (`book.route.ts`)**
    Define endpoints and apply validation/auth middlewares.
    ```typescript
    import express from "express";
    import { RequestValidation } from "../../middlewares/validateRequest";
    import { BookValidation } from "./book.validation";
    import { BookController } from "./book.controller";

    const router = express.Router();

    router.post(
      "/create-book",
      RequestValidation.validateRequest(BookValidation.createBookSchema),
      BookController.createBook
    );

    export const BookRoutes = router;
    ```

7.  **Register Route**
    Add the new route to `src/app/routes/index.ts`.

## 📈 How to Scale

1.  **Modularization**: Keep strict separation of concerns. Controllers should only handle HTTP req/res, Services should handle logic/DB.
2.  **Database Indexing**: Modify `prisma/schema.prisma` to add indexes as your data grows.
3.  **Caching**: Integrate Redis for caching heavy `GET` requests in the Service layer.
4.  **Validation**: Always validate inputs using Zod to prevent bad data from reaching your logic.
5.  **Logging**: Use the built-in Logger to track errors. Connect it to an external observability tool (like ELK or Datadog) in production.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
