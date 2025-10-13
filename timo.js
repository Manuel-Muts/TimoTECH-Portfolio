// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
document.addEventListener('DOMContentLoaded', function () {
  const slides = document.querySelector('.slides');
  const images = document.querySelectorAll('.slides img');
  let currentIndex = 0;
  const total = images.length;

  function showSlide(index) {
    slides.style.transform = `translateX(-${index * 100}%)`;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % total;
    showSlide(currentIndex);
  }

  setInterval(nextSlide, 3000); // Change slide every 3 seconds
  showSlide(currentIndex);
});
