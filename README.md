# 🚀 ThaiFx

> A robust, full-stack web application built with Node.js, Express, and PostgreSQL. This project intentionally utilizes **Vanilla JavaScript and CSS** on the frontend alongside EJS, demonstrating a strong foundation in core web technologies and DOM manipulation without relying on heavy frontend frameworks.

## ✨ Key Features

- **Vanilla Web Fundamentals:** Clean, lightweight, and fast user interface built entirely with Vanilla JavaScript (ES6+) and custom CSS.
- **Real-time Communication:** Powered by `socket.io` for instant data updates and bidirectional communication between client and server.
- **Optimized Database Queries:** Utilizes PostgreSQL connection pooling (`pg`) for scalable and efficient data handling.
- **Secure Authentication:** Implements password hashing using `bcrypt` and secure session management via `express-session`.
- **Server-Side Rendering (SSR):** Dynamic and responsive views generated with `EJS`.
- **Dynamic Utilities:** Seamless third-party data fetching using `axios` and on-the-fly QR code generation utilizing the `qrcode` library.

## 🛠️ Tech Stack

**Frontend:**

- HTML5 & EJS (Embedded JavaScript templates)
- Vanilla CSS (Custom styling, responsive design)
- Vanilla JavaScript (DOM manipulation, Fetch API/Socket client)

**Backend:**

- Node.js (ES Modules enabled)
- Express.js
- Socket.io (WebSocket API)

**Database:**

- PostgreSQL (via `pg` node-postgres)

**Security & Utilities:**

- `bcrypt`, `express-session`, `dotenv`, `axios`, `qrcode`

## 📦 Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your local machine.
- A running instance of [PostgreSQL](https://www.postgresql.org/).

### Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/rkokubun3-max/ThaiFx.git
   cd ThaiFx
   ```

2. Install dependencies:
   npm install

3. Create a .env file in the root directory and configure your environment variables:

   PORT=3000
   DATABASE_URL=postgres://[user]:[password]@[host]:[port]/[database]

4. Start the application:
   npm start
