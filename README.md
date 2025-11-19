# 🏔️ Mountain Cabin — WAP Project 2024/2025
A full-stack web application for renting mountain cabins in Serbia.  
The project was developed for the **Web Application Programming** course at the School of Electrical Engineering (ETF).

The application supports three types of users:
- **Tourist**
- **Cabin Owner**
- **Administrator**

The backend is developed in **Node.js + Express**, and the frontend in **Angular 18**.  
Database: **MongoDB**.

---

## 🚀 Features

### 👤 Unregistered User
- View general statistics (number of cabins, users, reservations…)
- Search cabins by name and/or location
- Sort (by name, location)
- Login and registration (with profile picture upload)

### 🧳 Tourist
- View and edit profile
- Search cabins + detailed view with a gallery, ratings, and a map
- Cabin reservation (multi-step process)
- View active reservations
- Cancel reservations
- Archive with the option to leave comments and ratings (1–5)

### 🏡 Owner
- Edit profile
- View all reservations for their cabins + confirm/decline
- Reservation calendar (FullCalendar)
- CRUD operations on their own cabins
- Upload cabin images
- Add a cabin via a JSON file
- Statistics — bar chart + pie chart

### 🛠️ Administrator
- User management (CRUD + deactivation)
- Approve / decline registration requests
- View all cabins with special marking for poorly rated ones
- Temporarily block a cabin (48h)

---

## 🏗️ Technologies

### **Frontend**
- Angular 18
- TypeScript
- Angular Material / Bootstrap / Tailwind (depends on what you use — add it)
- Leaflet (dynamic map)
- FullCalendar
- Chart.js (statistics)

### **Backend**
- Node.js + Express
- Multer (image and JSON file uploads)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- MongoDB / Mongoose

### **Database**
- MongoDB (Atlas or local)
