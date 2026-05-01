# 🎓 Smart Faculty Availability and Notification System

A real-time web application that digitally tracks faculty availability and helps admin instantly manage unattended classrooms — eliminating manual room-to-room checking completely.

🌐 **Live App:** [smart-faculty-system.web.app](https://smart-faculty-system.web.app/login)

---

## ❌ Problem Statement

In most colleges today, when a faculty member is absent or unavailable:
- Students are left unattended in classrooms without any information
- Admin has no real-time visibility of which rooms have students but no faculty
- Admin has to physically walk room to room to check — wasting time and resources
- There is no proper digital system to track, assign, or notify instantly

---

## ✅ Our Solution

A web-based Smart Faculty Availability and Notification System that:
- Digitally tracks faculty presence in real time
- Monitors all classrooms from one single dashboard
- Instantly assigns available faculty to unattended rooms
- Sends push notifications to faculty and students automatically

---

## 👥 User Roles

### 🎓 Student
- Logs in and sees all rooms as color-coded cards
- Selects their room, class and section
- Receives instant notification when faculty is assigned
- Can change their selection anytime

### 👨‍🏫 Faculty
- Logs in and marks themselves Available or Absent
- If available, selects which room they are present in
- Receives notification when admin assigns them to a room
- Can change status anytime

### 🛡️ Admin
- Monitors everything from one real-time dashboard
- Summary bar shows Total, Attended, Unattended and Library counts
- Left panel shows present and absent faculty lists
- Main table shows all rooms with current status
- Red highlighted rows = students present but no faculty
- Can assign available faculty or send students to library
- All changes trigger automatic push notifications

---

## 🛠️ Tech Stack

### Languages
| Language | Usage |
|---|---|
| HTML5 | Structure of web pages |
| CSS3 | Styling and animations |
| JavaScript (ES6+) | Core programming language |
| JSX | React component syntax |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React.js | v18 | Building UI components |
| Tailwind CSS | v3 | Modern responsive styling |
| React Router | v6 | Page navigation and route guards |
| React Hot Toast | Latest | User feedback notifications |
| Vite | Latest | Fast development build tool |

### Backend
| Technology | Purpose |
|---|---|
| Firebase Authentication | Secure login and signup for all 3 roles |
| Cloud Firestore | Real-time NoSQL database |
| Firebase Cloud Messaging | Push notifications |
| Firebase Hosting | Live deployment |

---

## 🎨 Room Card Color System

| Color | Meaning |
|---|---|
| 🟡 Yellow | Empty room — no students present |
| 🔴 Red | Students present but no faculty assigned |
| 🟢 Green | Fully attended — students and faculty present |

---

## ⚙️ How It Works

```
Student selects room → Room turns Red
       ↓
Faculty sees Red rooms → Selects one → Room turns Green
       ↓
Admin monitors dashboard → Assigns faculty if needed
       ↓
Push notifications sent to Faculty and Students instantly!
```

---

## 🗄️ Database Structure

```
Firestore Collections:

users/
  └── uid, name, email, role, fcm_token

students/
  └── uid, name, department, class, section, room_no

faculty_status/
  └── uid, name, status, room_assigned

rooms/
  └── room_no, class, section, students_present, 
      faculty_assigned, assigned_to_library

notifications/
  └── notification_id, sent_to, message, title, timestamp
```

---

## ✨ Key Features

- ⚡ Real-time updates using Firestore onSnapshot (no page refresh)
- 🎨 3 color-coded room cards for instant status visibility
- 🔐 Role-based route protection
- 🔔 Push notifications via Firebase Cloud Messaging
- 📊 Admin summary bar with live counts
- ⚠️ Faculty warning popup for occupied rooms
- 📱 Student real-time status messages
- 🌙 Modern glassmorphism dark UI
- 📲 Fully responsive on all devices

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/Gattu-Nandini/smart_faculty_avialability.git

# Navigate to project folder
cd smart_faculty_avialability

# Install dependencies
npm install

# Start development server
npm run dev
```

### Firebase Setup
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Email/Password Authentication
3. Create Firestore Database
4. Add your Firebase credentials to `src/firebase/firebaseConfig.js`
5. Run the room seeding script to add initial rooms

### Deployment
```bash
npm run build
firebase deploy --only hosting
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── Student/
│   │   └── StudentDashboard.jsx
│   ├── Faculty/
│   │   ├── FacultyDashboard.jsx
│   │   └── RoomSelection.jsx
│   ├── Admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── FacultyPanel.jsx
│   │   ├── RoomTable.jsx
│   │   └── AssignModal.jsx
│   └── Shared/
│       ├── Navbar.jsx
│       ├── RoomCard.jsx
│       └── Notifications.jsx
├── firebase/
│   └── firebaseConfig.js
├── context/
│   └── AuthContext.jsx
├── App.jsx
└── main.jsx
```

---

## 🌐 Live Demo

**URL:** https://smart-faculty-system.web.app/login

| Role | How to Test |
|---|---|
| Student | Signup → Select room → Select class and section |
| Faculty | Signup → Mark Available → Select room |
| Admin | Signup → Monitor dashboard → Assign faculty |

---

## 💡 Impact

| Before | After |
|---|---|
| Manual room-to-room checking | Zero manual checking |
| Students unattended for hours | No room goes unattended |
| No real-time visibility | Complete real-time dashboard |
| No notification system | Instant push notifications |
| Wasted time and resources | Efficient management |

---

## 👩‍💻 Developer

**Gattu Nandini**
- GitHub: [@Gattu-Nandini](https://github.com/Gattu-Nandini)
- Live Project: [smart-faculty-system.web.app](https://smart-faculty-system.web.app/login)

---


