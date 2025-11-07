

#  Charity Donation Platform

A **Node.js + Express** based backend for a **secure online charity donation platform** where users can register, donate to verified charities, and download donation receipts in PDF format.
Built with **Sequelize + PostgreSQL**, integrated with **Razorpay** for payments and **Cloudinary** for image hosting.

---

##  Tech Stack

| Layer                      | Technologies                   |
| -------------------------- | ------------------------------ |
| **Backend Framework**      | Node.js (v18) + Express        |
| **Database**               | PostgreSQL (via Sequelize ORM) |
| **Authentication**         | JWT + bcryptjs                 |
| **File Uploads**           | Multer + Cloudinary            |
| **Payment Gateway**        | Razorpay                       |
| **Email Notifications**    | Nodemailer                     |
| **PDF Receipts**           | PDFKit                         |
| **Environment Management** | dotenv                         |

---

##  Folder Structure

```
 charity_donation_platform
├── app.js                  # Main application entry
├── config/                 # DB & environment config
├── controllers/            # Business logic (charity, donation, auth)
├── middleware/             # Authentication & validation
├── models/                 # Sequelize models (User, Charity, Donation)
├── routes/                 # Express route definitions
├── utils/                  # Email, cloudinary, helper functions
├── public/                 # Static HTML, CSS, JS (frontend)
└── .env                    # Environment variables
```

---

##  Environment Setup

### 1️ Clone the repository

```bash
git clone https://github.com/yourusername/charity-donation-platform.git
cd charity-donation-platform
```

### 2️ Install dependencies

```bash
npm install
```

### 3️ Create `.env` file

```env
PORT=5000

# Database
DB_NAME=charity_db
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_DIALECT=postgres

# JWT
JWT_SECRET=your_jwt_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

---

##  Scripts

| Command         | Description                                |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Start server in development (with nodemon) |
| `npm start`     | Start production server                    |
| `npm run build` | Install dependencies before build          |

---

##  Features

✅ **Charity Management** – Add, update, approve, and manage registered charities
✅ **User Authentication** – JWT-based secure login and signup
✅ **Donation Processing** – Seamless Razorpay integration for payments
✅ **PDF Receipts** – Generate and email auto-generated receipts for donors
✅ **Email Notifications** – Automated emails using Nodemailer
✅ **Cloudinary Uploads** – Upload charity logos or documents
✅ **Admin Controls** – Approve or reject charity applications
✅ **Responsive Public Pages** – Frontend served via `/public` folder (HTML, CSS, JS)

---

##  AI Integration (Future Enhancement)

You can extend this project by adding **AI-driven donor recommendations**:

* **Donor segmentation:** Recommend campaigns based on past donation history
* **Charity ranking:** Use AI embeddings (OpenAI or Jina) to suggest similar charities
* **Predictive donation trends:** Analyze donor behavior for retention strategies

Example route (`controllers/aiController.js`):

```js
exports.getRecommendedCharities = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const allCharities = await Charity.findAll();

  // Simple AI-like mock: recommend based on user's previous donations
  const recommended = allCharities
    .filter(c => c.category === user.lastDonatedCategory)
    .slice(0, 5);

  res.json({ success: true, recommendations: recommended });
};
```

---

##  API Endpoints Overview

| Method | Endpoint                    | Description                   |
| ------ | --------------------------- | ----------------------------- |
| `POST` | `/api/auth/register`        | Register new user             |
| `POST` | `/api/auth/login`           | Login user & issue token      |
| `POST` | `/api/charity/add`          | Add new charity (vendor only) |
| `GET`  | `/api/charity/list`         | Get all user charities        |
| `PUT`  | `/api/charity/:id`          | Update charity info           |
| `GET`  | `/api/charity/approved`     | Public list of approved NGOs  |
| `POST` | `/api/donation/create`      | Make a donation               |
| `GET`  | `/api/donation/receipt/:id` | Download donation PDF         |

---

##  Razorpay Payment Flow

1. User selects charity and donation amount.
2. Frontend calls `/api/donation/create` to generate Razorpay order.
3. User completes payment securely on Razorpay checkout.
4. Server verifies payment signature.
5. Receipt generated using **PDFKit** and emailed via **Nodemailer**.

---

##  Deployment

### On Render / Railway:

```bash
npm install
npm run build
npm start
```

### On Localhost:

```bash
npm run dev
```

Visit ➜ [http://localhost:5000](http://localhost:5000)

---

##  Author

**Dheeraj Sonekar**
[dheerajsonekar@example.com](mailto:dheerajsonekar@example.com)
[LinkedIn](https://linkedin.com/in/dheeraj-sonekar)

---

##  Future Enhancements

* [ ] Add AI-based donor recommendations
* [ ] Implement Stripe payment support
* [ ] Integrate dashboard analytics (Top donors, charities)
* [ ] Add React or Next.js frontend



