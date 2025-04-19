const createFallingStar = () => {
    const star = document.createElement("div");
    star.classList.add("falling-star");

    star.style.left = `${Math.random() * 100}vw`;
    star.style.top = `-${Math.random() * 20}vh`;

    const size = Math.random() * 3 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    star.style.animationDuration = `${Math.random() * 3 + 2}s`;
    star.style.animationDelay = `${Math.random() * 5}s`;

    document.body.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 5000);
};

setInterval(createFallingStar, 200);