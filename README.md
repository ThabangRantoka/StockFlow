# StockFlow

StockFlow is a full-stack retail inventory and order management system designed to demonstrate a modern retail/omnichannel software architecture.

The application provides a centralized interface for managing products, inventory, customers, orders, and operational data through a React frontend connected to a Node.js/Express REST API and PostgreSQL database.

> **Project Status:** In active development.

## Features

- Product management
- Inventory tracking
- Low-stock monitoring
- Inventory restocking
- Customer management
- Order creation and tracking
- Order item management
- Automatic inventory reduction when products are ordered
- Order status management
- Dashboard statistics
- Recent order activity
- REST API architecture
- PostgreSQL relational database
- Role-based authentication architecture in development
- Responsive administrative interface

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- Recharts

### Backend

- Node.js
- Express.js
- REST APIs
- PostgreSQL
- `pg` PostgreSQL driver
- dotenv
- CORS

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Postman
- npm

## Architecture

```text
React + TypeScript Frontend
          |
          | HTTP / REST API
          v
Node.js + Express Backend
          |
          | SQL
          v
      PostgreSQL
```

The application follows a layered backend structure:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
PostgreSQL Database
```

This separation helps keep routing, business logic, and database operations maintainable as the application grows.

## Project Structure

```text
StockFlow/
│
├── backend/
│   ├── database/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## REST API

The backend exposes API endpoints for the main StockFlow resources.

Examples:

```text
GET    /api/health

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/customers
GET    /api/customers/:id
POST   /api/customers

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders

GET    /api/inventory
GET    /api/inventory/low-stock
GET    /api/inventory/summary

GET    /api/dashboard
```

## Database Design

StockFlow currently uses PostgreSQL with core entities including:

- Products
- Customers
- Orders
- Order Items

Relationships are enforced using primary keys and foreign keys.

For example:

```text
Customer
   |
   | 1
   |
   | N
 Order
   |
   | 1
   |
   | N
Order Item
   |
   | N
   |
   | 1
 Product
```

Order operations use database transactions where appropriate to help keep order totals and inventory quantities consistent.

## Running the Project Locally

### Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ThabangRantoka/StockFlow.git
cd StockFlow
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as the template and configure your PostgreSQL connection.

Then run:

```bash
npm run dev
```

The API runs locally on:

```text
http://localhost:5000
```

### 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs locally on:

```text
http://localhost:5173
```

## Security

Sensitive environment variables are excluded from Git using `.gitignore`.

The repository should never contain production database passwords, API secrets, or authentication secrets.

Authentication and role-based authorization are planned as part of the ongoing development of StockFlow.

## Roadmap

Planned development includes:

- Connect all frontend screens to the real REST API
- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Improved API validation and error handling
- Automated backend testing
- Frontend testing
- Reporting and analytics
- API integration monitoring
- Azure deployment
- Azure Database for PostgreSQL
- Production environment configuration
- Logging and monitoring

## What I Am Learning

StockFlow is being developed as a practical full-stack engineering project with a focus on:

- React and TypeScript application development
- Node.js and Express backend development
- REST API design
- PostgreSQL database design
- SQL relationships and transactions
- Frontend/backend integration
- Git and GitHub workflows
- Authentication and authorization
- Testing and debugging
- Cloud deployment using Microsoft Azure

## Author

**Moyahabo Thabang Rantoka**

Computer Systems Engineering | Full Stack Developer

- GitHub: `ThabangRantoka`
- Portfolio: `thabangrantoka.github.io/Moyahabo-PortFolio/`

## License

This project is currently developed for educational, portfolio, and professional development purposes.