import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { auth, firestore } from "./firebase.js";

const ADMIN_EMAIL = "timotech254@gmail.com";
const CLOUDINARY_CLOUD_NAME = "ynpxvgxs";
const CLOUDINARY_UPLOAD_PRESET = "timotech";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const loginPanel = document.getElementById("login-panel");
const verificationPanel = document.getElementById("verification-panel");
const dashboardPanel = document.getElementById("dashboard-panel");
const statusMessage = document.getElementById("admin-status");
const loginForm = document.getElementById("admin-login-form");
const passwordInput = document.getElementById("admin-password");
const passwordToggle = document.getElementById("toggle-password");
const fileInput = document.getElementById("gallery-files");
const uploadForm = document.getElementById("upload-form");
const uploadButton = document.getElementById("upload-button");
const previewList = document.getElementById("file-preview");
const progressBar = document.getElementById("upload-progress");
const progressLabel = document.getElementById("upload-progress-label");
const adminGallery = document.getElementById("admin-gallery");

let stopGalleryListener;
let previewUrls = [];

passwordToggle.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  passwordToggle.textContent = isVisible ? "Show" : "Hide";
  passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
});

function showStatus(message, state = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}

function showPanel(panel) {
  loginPanel.hidden = panel !== loginPanel;
  verificationPanel.hidden = panel !== verificationPanel;
  dashboardPanel.hidden = panel !== dashboardPanel;
  document.body.classList.toggle("admin-dashboard-mode", panel === dashboardPanel);
}

function clearPreviews() {
  previewUrls.forEach((url) => URL.revokeObjectURL(url));
  previewUrls = [];
  previewList.replaceChildren();
}

function validateFiles(files) {
  if (files.length === 0) {
    return "Choose at least one photo to upload.";
  }
  if (files.length > MAX_FILES_PER_BATCH) {
    return `Choose no more than ${MAX_FILES_PER_BATCH} photos at a time.`;
  }
  const invalidFile = files.find((file) => !ALLOWED_TYPES.has(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE);
  if (invalidFile) {
    return `${invalidFile.name} is not a supported image or exceeds the 10 MB limit.`;
  }
  return "";
}

function renderPreviews(files) {
  clearPreviews();
  files.forEach((file) => {
    const item = document.createElement("li");
    const image = document.createElement("img");
    const name = document.createElement("span");
    const url = URL.createObjectURL(file);
    previewUrls.push(url);
    image.src = url;
    image.alt = "";
    name.textContent = file.name;
    item.append(image, name);
    previewList.append(item);
  });
}

function uploadToCloudinary(file, index, total) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    );
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        progressBar.value = ((index + event.loaded / event.total) / total) * 100;
      }
    });
    request.addEventListener("error", () => reject(new Error("Network error while uploading to Cloudinary.")));
    request.addEventListener("abort", () => reject(new Error("Cloudinary upload was cancelled.")));
    request.addEventListener("load", () => {
      let response;
      try {
        response = JSON.parse(request.responseText);
      } catch {
        reject(new Error("Cloudinary returned an unreadable response."));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error((response.error && response.error.message) || `Cloudinary upload failed (${request.status}).`));
        return;
      }
      if (typeof response.secure_url !== "string" || typeof response.public_id !== "string") {
        reject(new Error("Cloudinary response did not include the image URL and public ID."));
        return;
      }
      resolve(response);
    });
    request.send(formData);
  });
}

function formatPublishedDate(date) {
  const day = date.getDate();
  const ordinal = day % 100 >= 11 && day % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th");
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
  return `${weekday} ${day}${ordinal} ${month} ${date.getFullYear()}`;
}

function listenForPhotos() {
  if (stopGalleryListener) {
    return;
  }

  const galleryQuery = query(collection(firestore, "gallery"), orderBy("createdAt", "desc"));
  stopGalleryListener = onSnapshot(
    galleryQuery,
    (snapshot) => {
      adminGallery.replaceChildren();
      const dateGroups = new Map();

      snapshot.forEach((photoSnapshot) => {
        const photo = photoSnapshot.data();
        const publishedDate = photo.createdAt?.toDate();
        const dateKey = publishedDate
          ? `${publishedDate.getFullYear()}-${publishedDate.getMonth()}-${publishedDate.getDate()}`
          : "unknown";
        if (!dateGroups.has(dateKey)) {
          dateGroups.set(dateKey, { date: publishedDate, photos: [] });
        }
        dateGroups.get(dateKey).photos.push({ id: photoSnapshot.id, photo });
      });

      dateGroups.forEach(({ date, photos }) => {
        const group = document.createElement("section");
        const heading = document.createElement("h3");
        const thumbnails = document.createElement("div");
        group.className = "admin-date-group";
        heading.className = "admin-date-heading";
        heading.textContent = date ? formatPublishedDate(date) : "Date unavailable";
        thumbnails.className = "admin-date-photos";

        photos.forEach(({ id, photo }) => {
          const figure = document.createElement("figure");
          const image = document.createElement("img");
          const caption = document.createElement("figcaption");
          const deleteButton = document.createElement("button");
          image.src = photo.imageUrl;
          image.alt = photo.caption || "Gallery photo";
          caption.textContent = photo.caption || "Published photo";
          deleteButton.className = "admin-photo-delete";
          deleteButton.type = "button";
          deleteButton.setAttribute("aria-label", `Remove ${photo.caption || "photo"} from public gallery`);
          deleteButton.title = "Remove from public gallery";
          deleteButton.textContent = "×";
          deleteButton.addEventListener("click", async () => {
            if (!auth.currentUser || !auth.currentUser.emailVerified || auth.currentUser.email.toLowerCase() !== ADMIN_EMAIL) {
              showStatus("Your admin session is not authorized to remove photos.", "error");
              return;
            }
            if (!window.confirm("Remove this photo from the public gallery? The Cloudinary image file will remain stored.")) {
              return;
            }
            deleteButton.disabled = true;
            try {
              await deleteDoc(doc(firestore, "gallery", id));
              showStatus("Photo removed from the public gallery.");
            } catch (error) {
              deleteButton.disabled = false;
              showStatus(`Could not remove photo: ${error.message}`, "error");
            }
          });
          figure.append(image, caption, deleteButton);
          thumbnails.append(figure);
        });

        group.append(heading, thumbnails);
        adminGallery.append(group);
      });
    },
    (error) => {
      showStatus(`Unable to load published photos: ${error.message}`, "error");
      stopGalleryListener = undefined;
    }
  );
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (stopGalleryListener) {
      stopGalleryListener();
      stopGalleryListener = undefined;
    }
    showPanel(loginPanel);
    return;
  }

  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    showStatus(`This page is restricted to ${ADMIN_EMAIL}.`, "error");
    try {
      await signOut(auth);
    } catch (error) {
      showStatus(`Could not sign out this account: ${error.message}`, "error");
    }
    return;
  }

  if (!user.emailVerified) {
    showPanel(verificationPanel);
    showStatus("Verify the admin email address before uploading photos.", "error");
    return;
  }

  showPanel(dashboardPanel);
  showStatus(`Signed in as ${ADMIN_EMAIL}.`);
  listenForPhotos();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = loginForm.elements.email.value.trim().toLowerCase();
  const password = loginForm.elements.password.value;

  if (email !== ADMIN_EMAIL) {
    showStatus(`Sign in with the authorized admin email: ${ADMIN_EMAIL}.`, "error");
    return;
  }

  showStatus("Signing in…");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showStatus(`Sign-in failed: ${error.message}`, "error");
  }
});

document.getElementById("send-verification").addEventListener("click", async () => {
  if (!auth.currentUser) {
    showStatus("Sign in again before requesting verification.", "error");
    return;
  }
  try {
    await sendEmailVerification(auth.currentUser);
    showStatus("Verification email sent. Check the admin inbox and spam folder.");
  } catch (error) {
    showStatus(`Could not send verification email: ${error.message}`, "error");
  }
});

document.getElementById("check-verification").addEventListener("click", async () => {
  if (!auth.currentUser) {
    showStatus("Sign in again to check verification.", "error");
    return;
  }
  try {
    await auth.currentUser.reload();
    if (!auth.currentUser.emailVerified) {
      showStatus("Email is not verified yet. Open the verification link, then check again.", "error");
      return;
    }
    await auth.currentUser.getIdToken(true);
    showPanel(dashboardPanel);
    showStatus(`Signed in as ${ADMIN_EMAIL}.`);
    listenForPhotos();
  } catch (error) {
    showStatus(`Could not check email verification: ${error.message}`, "error");
  }
});

document.querySelectorAll(".admin-logout").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showStatus("You have been signed out.");
    } catch (error) {
      showStatus(`Could not sign out: ${error.message}`, "error");
    }
  });
});

fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files || []);
  const validationMessage = validateFiles(files);
  uploadButton.disabled = Boolean(validationMessage);
  if (validationMessage) {
    clearPreviews();
    showStatus(validationMessage, "error");
    return;
  }
  renderPreviews(files);
  showStatus(`${files.length} photo${files.length === 1 ? "" : "s"} ready to publish.`);
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const files = Array.from(fileInput.files || []);
  const validationMessage = validateFiles(files);
  if (validationMessage) {
    showStatus(validationMessage, "error");
    return;
  }
  if (!auth.currentUser || !auth.currentUser.emailVerified || auth.currentUser.email.toLowerCase() !== ADMIN_EMAIL) {
    showStatus("Your admin session is not authorized. Sign in again to publish photos.", "error");
    return;
  }

  const caption = uploadForm.elements.caption.value.trim();
  uploadButton.disabled = true;
  fileInput.disabled = true;
  progressBar.hidden = false;
  progressBar.value = 0;
  let publishedCount = 0;

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      progressLabel.textContent = `Uploading ${index + 1} of ${files.length}: ${file.name}`;
      const cloudinaryImage = await uploadToCloudinary(file, index, files.length);
      try {
        await addDoc(collection(firestore, "gallery"), {
          imageUrl: cloudinaryImage.secure_url,
          publicId: cloudinaryImage.public_id,
          caption,
          createdAt: serverTimestamp(),
          uploadedBy: auth.currentUser.uid
        });
        publishedCount += 1;
      } catch (error) {
        throw new Error(`The image uploaded to Cloudinary, but its Firestore metadata could not be saved. It was not published. ${error.message}`);
      }
    }

    uploadForm.reset();
    clearPreviews();
    uploadButton.disabled = true;
    showStatus(`${files.length} photo${files.length === 1 ? "" : "s"} published to the public gallery.`);
  } catch (error) {
    if (publishedCount > 0) {
      uploadForm.reset();
      clearPreviews();
      showStatus(`${publishedCount} photo${publishedCount === 1 ? "" : "s"} published before upload stopped: ${error.message}`, "error");
    } else {
      showStatus(`Upload stopped: ${error.message}`, "error");
    }
  } finally {
    fileInput.disabled = false;
    uploadButton.disabled = !fileInput.files.length;
    progressBar.hidden = true;
    progressLabel.textContent = "";
  }
});
