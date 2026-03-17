# School Management Application

This workspace contains a full-stack starter for a School Management System:

- `frontend`: Angular 20 application
- `backend`: Node.js + Express API with MongoDB-ready models

## Features Included

- Dashboard with summary cards
- Student management connected to backend APIs (CRUD)
- Teacher management connected to backend APIs (CRUD)
- JWT login with role selection (Admin, Teacher, Student, Accountant)
- Angular auth guard + role guard on protected routes
- Attendance, fees, exams, and results backend CRUD APIs
- Starter pages for classes, library, transport, and notices

## Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend URL: `http://localhost:4200`

## Run Backend

1. Copy `.env.example` to `.env` in the `backend` folder.
2. Set your MongoDB connection string in `MONGO_URI`.

```bash
cd backend
npm install
npm run dev
```

Backend URL: `http://localhost:5000`

## API Endpoints

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `GET /api/teachers`
- `POST /api/teachers`
- `PUT /api/teachers/:id`
- `DELETE /api/teachers/:id`

## Suggested Next Steps

1. Connect Students and Teachers pages to backend APIs from `SchoolApiService`.
2. Add JWT authentication and role-based route guards.
3. Add attendance, fee, and exam CRUD APIs.
4. Add PDF/Excel report generation.
5. Add unit and integration tests.
