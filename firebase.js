
// ===================================================
// 🔥 TIMOTECH FIREBASE CORE SCRIPT
// Handles contact form + authentication (signup, login, reset)
// ===================================================

// 1️⃣ IMPORT FIREBASE SDK MODULES
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// 2️⃣ FIREBASE CONFIGURATION
const firebaseConfig = {
   apiKey: "AIzaSyAGITfHWQ5B0-bsMn4VSe3QlZ3ZtBEIP00",
  authDomain: "business-management-55657.firebaseapp.com",
  projectId: "business-management-55657",
  storageBucket: "business-management-55657.firebasestorage.app",
  messagingSenderId: "1092549824400",
  appId: "1:1092549824400:web:cceba12bef33f9f07bad15",
};

// 3️⃣ INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, auth, db, firestore };

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
        .then(async (userCredential) => {
          signupForm.reset();
          try {
            await sendEmailVerification(userCredential.user);
            alert("Account created. Check your email and verify it before using the admin uploader.");
          } catch (error) {
            alert(`Account created, but the verification email could not be sent: ${error.message}`);
          }
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
