document.addEventListener('DOMContentLoaded', function () {
    // Управление гамбургер-меню
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('show');
        // Отображение кнопок избранного и личного кабинета на маленьких устройствах
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons && window.innerWidth <= 992) {
            navButtons.style.display = navMenu.classList.contains('show') ? 'flex' : 'none';
        }
    });

    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            navMenu.classList.remove('show');
            const navButtons = document.querySelector('.nav-buttons');
            if (navButtons && window.innerWidth <= 992) {
                navButtons.style.display = 'none';
            }
        }
    });

    // Инициализация Bootstrap Dropdown
    const dropdownElementList = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdownElementList.forEach((dropdownToggleEl) => {
        new bootstrap.Dropdown(dropdownToggleEl);
    });

    // Управление выпадающим меню на маленьких экранах
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    dropdownToggle.addEventListener('click', () => {
        if (window.innerWidth <= 991.98) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownToggle) || new bootstrap.Dropdown(dropdownToggle);
            // Bootstrap сам управляет видимостью через toggle()
        }
    });

    // Закрытие выпадающего меню при клике вне его на маленьких экранах
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 991.98 && !dropdownMenu.contains(e.target) && !dropdownToggle.contains(e.target)) {
            const dropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
            if (dropdown) {
                dropdown.hide();
            }
        }
    });

    // Плавная прокрутка
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href'))?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Управление каруселью
    let currentIndex = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;

    function updateCarousel() {
        const wrapper = document.querySelector('.carousel-wrapper');
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    function moveSlide(direction) {
        currentIndex += direction;
        if (currentIndex < 0) {
            currentIndex = totalSlides - 1;
        } else if (currentIndex >= totalSlides) {
            currentIndex = 0;
        }
        updateCarousel();
    }

    // Автоматическое переключение каждые 3 секунды
    let autoSlide = setInterval(() => {
        moveSlide(1);
    }, 3000);

    // Остановка автопрокрутки при наведении и возобновление при уходе
    const carousel = document.querySelector('.custom-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => clearInterval(autoSlide));
        carousel.addEventListener('mouseleave', () => {
            autoSlide = setInterval(() => moveSlide(1), 3000);
        });
    }

    // Обработчики для кнопок карусели
    document.querySelector('.carousel-prev')?.addEventListener('click', () => moveSlide(-1));
    document.querySelector('.carousel-next')?.addEventListener('click', () => moveSlide(1));
});