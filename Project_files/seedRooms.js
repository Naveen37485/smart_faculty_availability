import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCR8MuQ5Air9veexYH05gGwo5giaijVTlQ",
  authDomain: "smart-faculty-system.firebaseapp.com",
  projectId: "smart-faculty-system",
  storageBucket: "smart-faculty-system.firebasestorage.app",
  messagingSenderId: "867084201074",
  appId: "1:867084201074:web:74ac8e151199343a7ca6eb",
  measurementId: "G-QSWH4HBP5B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rooms = [
  { room_no: "101", class: "CSE", section: "A" },
  { room_no: "102", class: "CSE", section: "B" },
  { room_no: "103", class: "ECE", section: "A" },
  { room_no: "104", class: "ECE", section: "B" },
  { room_no: "105", class: "IT", section: "A" },
  { room_no: "106", class: "IT", section: "B" },
  { room_no: "107", class: "MECH", section: "A" },
  { room_no: "108", class: "MECH", section: "B" }
];

async function seedRooms() {
  console.log("🚀 Starting seeding process...");
  for (const room of rooms) {
    try {
      await setDoc(doc(db, "rooms", room.room_no), {
        ...room,
        students_present: false,
        faculty_assigned: null,
        assigned_to_library: false
      });
      console.log(`✅ Room ${room.room_no} added successfully.`);
    } catch (error) {
      console.error(`❌ Error adding room ${room.room_no}:`, error);
    }
  }
  console.log("🏁 Seeding complete!");
  process.exit(0);
}

seedRooms();
