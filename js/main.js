document.addEventListener('DOMContentLoaded', function () {

  // --- Dark Mode Toggle ---
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const icon = themeToggle.querySelector('i');

  // Check LocalStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    body.classList.remove('light-mode');
    icon.classList.replace('fa-moon', 'fa-sun');
  }

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');

    if (body.classList.contains('dark-mode')) {
      icon.classList.replace('fa-moon', 'fa-sun');
      localStorage.setItem('theme', 'dark');
    } else {
      icon.classList.replace('fa-sun', 'fa-moon');
      localStorage.setItem('theme', 'light');
    }
  });

  // --- Mobile Navigation ---
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Change icon?
    const toggleIcon = navToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
      toggleIcon.classList.replace('fa-bars', 'fa-times');
    } else {
      toggleIcon.classList.replace('fa-times', 'fa-bars');
    }
  });

  // Close mobile menu when clicking a link
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      navToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
    });
  });

  // --- Render Publications ---
  const pubContainer = document.getElementById('publications-container');
  if (pubContainer && typeof publications !== 'undefined') {
    publications.forEach(pub => {
      const pubCard = document.createElement('div');
      pubCard.className = 'pub-card';
      pubCard.innerHTML = `
        <div class="pub-title">${pub.title}</div>
        <div class="pub-authors">${pub.authors}</div>
        <div class="pub-venue">${pub.venue} (${pub.year})</div>
        <div class="pub-meta">
          <div class="pub-citations">
            <i class="fas fa-quote-right"></i> ${pub.citations} Citations
          </div>
          <a href="#" class="project-link" style="padding: 5px 10px; font-size: 0.8rem;">View Paper</a>
        </div>
      `;
      pubContainer.appendChild(pubCard);
    });
  }

  // --- Smooth Scroll (Existing) ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Offset for fixed navbar
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });

  // --- Animations (Existing) ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.project-card, .timeline-content, .about-section, .contact-section').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
});
