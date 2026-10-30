window.addEventListener("DOMContentLoaded", () => {

    const loader = document.getElementById('loader');
    const progressBar = document.getElementById('progress');
    const loaderGif = document.getElementById('loaderGif');
    const main = document.getElementById('mainContent');

    let progress = 0;

    const interval = setInterval(() => {
        progress++;

        // progress bar
        progressBar.style.width = progress + '%';

        // MLP Move (FIXED)
        const box = document.querySelector('.progress-box');
        loaderGif.style.left= (progress / 100) * box.offsetWidth - loaderGif.offsetWidth + "px"


    }, 20);

    setTimeout(() => {
        clearInterval(interval);

        loader.classList.add('fade-out');

        setTimeout(() => {
            loader.style.display = 'none';
            main.classList.add('show');
            document.body.style.overflow = 'auto';
        }, 600);

    }, 2000);

});


/* CARD FUNCTION */
function openCard(selectedCard) {

    const allCards = document.querySelectorAll('.card');

    // open and back
    if (selectedCard.classList.contains("open")) {
        selectedCard.classList.remove("open");

        allCards.forEach(card => {
            card.classList.remove("hide");
        });

        return;
    }

    // hide 
    allCards.forEach(card => {
        if (card !== selectedCard) {
            card.classList.add("hide");
        }
    });

    selectedCard.classList.add("open");
}