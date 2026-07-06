const images = document.querySelectorAll(".gallery img");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

const closeBtn = document.querySelector(".close");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let current = 0;

function show(index) {

    current = index;

    lightbox.style.display = "flex";
    lightboxImg.src = images[current].src;

}

images.forEach((img, index) => {

    img.addEventListener("click", () => {

        show(index);

    });

});

function next() {

    current++;

    if (current >= images.length) {

        current = 0;

    }

    show(current);

}

function prev() {

    current--;

    if (current < 0) {

        current = images.length - 1;

    }

    show(current);

}

nextBtn.onclick = next;
prevBtn.onclick = prev;

closeBtn.onclick = () => {

    lightbox.style.display = "none";

};

lightbox.addEventListener("click", (e) => {

    if (e.target === lightbox) {

        lightbox.style.display = "none";

    }

});

document.addEventListener("keydown", (e) => {

    if (lightbox.style.display != "flex") return;

    if (e.key == "ArrowRight") next();

    if (e.key == "ArrowLeft") prev();

    if (e.key == "Escape") lightbox.style.display = "none";

});


/* Mobil swipe */

let startX = 0;

lightbox.addEventListener("touchstart", (e) => {

    startX = e.touches[0].clientX;

});

lightbox.addEventListener("touchend", (e) => {

    let endX = e.changedTouches[0].clientX;

    let diff = startX - endX;

    if (diff > 50) {

        next();

    }

    if (diff < -50) {

        prev();

    }

});