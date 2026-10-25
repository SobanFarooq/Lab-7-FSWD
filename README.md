# Lab Task 7

Two Node.js + Express projects. Each is independent.

## How to run
```bash
cd task1-student-management      # or task2-ecommerce-persistent
npm install
npm start
```
- Task 1 runs on http://localhost:3000 (override with PORT)
- Task 2 runs on http://localhost:4000 (override with PORT)
- Task 2 needs **Node 22.13 or newer** (it uses the built-in `node:sqlite`, so no database server or native build is needed).

---

## Task 1 - Student Management System (in-memory, no authorization)

Data is kept in JS arrays, so it resets when the server restarts.
Every module has full CRUD:

| Method | Path | Action |
|---|---|---|
| POST | /students, /teachers, /attendance, /marks | Create |
| GET | same paths (supports `?field=value` filters) | Read all |
| GET | /{module}/:id | Read one |
| PUT / PATCH | /{module}/:id | Update (full / partial) |
| DELETE | /{module}/:id | Delete |
| GET | /students/:id/report | Student + attendance + marks (bonus) |

Fields (`*` = required)
- **Student**: name*, rollNo*, className*, email, age, phone
- **Teacher**: name*, subject*, email, phone
- **Attendance**: studentId*, date* (YYYY-MM-DD), status* (present / absent / leave), teacherId, subject
- **Marks**: studentId*, subject*, marksObtained*, totalMarks*, teacherId, examType (percentage is calculated automatically)

Attendance and marks check that the student (and teacher) exist.

---

## Task 2 - E-commerce Store (persistent, SQLite)

Data is stored in `data/store.db` and survives restarts.

| Resource | Endpoints |
|---|---|
| Categories | POST/GET `/categories`, GET/PUT/DELETE `/categories/:id` |
| Products | POST/GET `/products` (filters: `category_id`, `search`, `minPrice`, `maxPrice`), GET/PUT/PATCH/DELETE `/products/:id` |
| Customers | POST/GET `/customers`, GET/PUT/DELETE `/customers/:id` |
| Cart | GET/POST/DELETE `/customers/:id/cart`, PUT/DELETE `/customers/:id/cart/:productId` |
| Orders | POST `/orders` (checkout from cart), GET `/orders` (`?customer_id=`), GET/DELETE `/orders/:id`, PATCH `/orders/:id/status` |

Checkout reduces stock and clears the cart; cancelling an order restores stock.

Note: the Lab 3 spec was not available, so the resources above are a standard e-commerce design.
Rename or add fields to match your Lab 3 requirements if needed.

### Example flow
```bash
curl -X POST localhost:4000/categories -H "Content-Type: application/json" -d '{"name":"Electronics"}'
curl -X POST localhost:4000/products   -H "Content-Type: application/json" -d '{"name":"Phone","price":300,"stock":5,"category_id":1}'
curl -X POST localhost:4000/customers  -H "Content-Type: application/json" -d '{"name":"Sara","email":"s@x.com"}'
curl -X POST localhost:4000/customers/1/cart -H "Content-Type: application/json" -d '{"product_id":1,"quantity":2}'
curl -X POST localhost:4000/orders     -H "Content-Type: application/json" -d '{"customer_id":1}'
```
