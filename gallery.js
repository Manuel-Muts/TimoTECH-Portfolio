import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { firestore } from "./firebase.js";

const gallery = document.getElementById("gallery");
const status = document.createElement("p");
status.className = "gallery-status";
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");
gallery.before(status);

const galleryQuery = query(collection(firestore, "gallery"), orderBy("createdAt", "asc"));
onSnapshot(
  galleryQuery,
  (snapshot) => {
    gallery.querySelectorAll("[data-firebase-photo]").forEach((photo) => photo.remove());
    snapshot.forEach((photoSnapshot) => {
      const photo = photoSnapshot.data();
      if (typeof photo.imageUrl !== "string") {
        return;
      }
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      figure.className = "gallery-item";
      figure.dataset.firebasePhoto = "true";
      image.src = photo.imageUrl;
      image.alt = photo.caption || "TimoTECH Films gallery photo";
      image.loading = "lazy";
      figure.append(image);
      if (photo.caption) {
        const caption = document.createElement("figcaption");
        caption.textContent = photo.caption;
        figure.append(caption);
      }
      gallery.append(figure);
    });
    status.textContent = "";
    status.hidden = true;
  },
  (error) => {
    status.hidden = false;
    status.textContent = `New gallery photos could not be loaded: ${error.message}`;
  }
);
