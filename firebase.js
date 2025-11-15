
// ===================================================
// 🔥 TIMOTECH FIREBASE CORE SCRIPT
// Handles contact form + authentication (signup, login, reset)
// ===================================================

// 1️⃣ IMPORT FIREBASE SDK MODULES
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// 2️⃣ FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyD1WooB8rJKFdIccI7hVKOkgZkhp31VYj8",
  authDomain: "timotech-films.firebaseapp.com",
  projectId: "timotech-films",
  databaseURL: "https://timotech-films-default-rtdb.firebaseio.com/",
  storageBucket: "timotech-films.firebasestorage.app",
  messagingSenderId: "563809562931",
  appId: "1:563809562931:web:de8d5925df077eb09dce46"
};

// 3️⃣ INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// 4️⃣ DOM READY EVENT
document.addEventListener("DOMContentLoaded", () => {

  // CONTACT FORM HANDLER
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = {};
      new FormData(contactForm).forEach((value, key) => (formData[key] = value));

      push(ref(db, "form_submissions"), {
        ...formData,
        timestamp: Date.now(),
      })
        .then(() => {
          alert("✅ Your message was sent successfully!");
          contactForm.reset();
        })
        .catch((error) => {
          console.error("❌ Firebase error:", error);
          alert("Something went wrong. Try again.");
        });
    });
  }

  // SIGNUP HANDLER
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = signupForm.email.value;
      const password = signupForm.password.value;

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          alert("✅ Account created successfully!");
          console.log("User:", userCredential.user);
          signupForm.reset();
        })
        .catch((error) => {
          alert("❌ " + error.message);
        });
    });
  }

  // LOGIN HANDLER
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          alert("✅ Logged in successfully!");
          console.log("User:", userCredential.user);
          window.location.href = "dashboard.html"; // optional redirect
        })
        .catch((error) => {
          alert("❌ " + error.message);
        });
    });
  }

  // PASSWORD RESET HANDLER
  const resetForm = document.getElementById("resetForm");
  if (resetForm) {
    resetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = resetForm.email.value;

      sendPasswordResetEmail(auth, email)
        .then(() => {
          alert("✅ Password reset email sent! Check your inbox.");
          resetForm.reset();
        })
        .catch((error) => {
          alert("❌ " + error.message);
        });
    });
  }
});
