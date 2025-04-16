"use strict";

document.addEventListener('DOMContentLoaded', function () {
    // Elementi del DOM
    const playPauseButton = document.getElementById('play-pause');
    const prevSongButton = document.getElementById('prev-song');
    const nextSongButton = document.getElementById('next-song');
    const shuffleButton = document.getElementById('shuffle');
    const loopButton = document.getElementById('loop');
    const progressBar = document.getElementById('progress-bar');
    const volumeControl = document.getElementById('volume-control');
    const currentSong = document.getElementById('current-song');
    const currentAlbumCover = document.getElementById('current-album-cover');
    const currentTime = document.getElementById('current-time');
    const totalDuration = document.getElementById('total-duration');
    const likeButton = document.getElementById('like-button');
    const audioPlayer = document.getElementById('audio-player');
    const listenNowButtons = document.querySelectorAll('.listen-now');

    // Variabili di stato
    let isPlaying = false;
    let isShuffle = false;
    let isLoop = false;
    let currentSongIndex = 0;
    let currentAlbumSongs = [];
    let currentAlbumNames = [];
    let currentAlbumCoverSrc = '';
    let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

    // Funzione per salvare i preferiti nel localStorage
    function saveFavorites() {
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    }

    // Funzione per aggiornare il cuoricino
    function updateLikeButton() {
        const currentSongSrc = audioPlayer.src;
        const isLiked = likedSongs.some(song => song.src === currentSongSrc);
        likeButton.textContent = isLiked ? "❤️" : "🤍"; // Rosso se nei preferiti, bianco altrimenti
    }

    // Salva lo stato del player nel localStorage
    function savePlayerState() {
        const playerState = {
            src: audioPlayer.src,
            currentTime: audioPlayer.currentTime,
            isPlaying: isPlaying,
            songName: currentSong.textContent,
            albumCover: currentAlbumCover.src,
        };
        localStorage.setItem('playerState', JSON.stringify(playerState));
    }

    // Ripristina lo stato del player dal localStorage
    function restorePlayerState() {
        const savedState = JSON.parse(localStorage.getItem('playerState'));
        if (savedState) {
            audioPlayer.src = savedState.src || '';
            audioPlayer.currentTime = savedState.currentTime || 0;
            currentSong.textContent = savedState.songName || 'Nessuna canzone in riproduzione';
            currentAlbumCover.src = savedState.albumCover || '';
            isPlaying = savedState.isPlaying || false;

            if (isPlaying) {
                audioPlayer.play();
                playPauseButton.textContent = '⏸️';
            } else {
                playPauseButton.textContent = '▶️';
            }
        }
    }

    // Funzione per aggiornare la barra di progresso e il tempo
    function updateProgressBar() {
        if (!isNaN(audioPlayer.duration)) {
            const currentMinutes = Math.floor(audioPlayer.currentTime / 60);
            const currentSeconds = Math.floor(audioPlayer.currentTime % 60);
            const durationMinutes = Math.floor(audioPlayer.duration / 60);
            const durationSeconds = Math.floor(audioPlayer.duration % 60);

            currentTime.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
            totalDuration.textContent = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;

            progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        }
    }

    // Funzione per riprodurre una canzone
    function playSong(index) {
        if (index < 0 || index >= currentAlbumSongs.length) return;

        currentSongIndex = index;
        audioPlayer.src = currentAlbumSongs[index];
        audioPlayer.play().catch(error => {
            console.error('Errore durante la riproduzione:', error);
            alert('Impossibile riprodurre la canzone.');
        });

        currentSong.textContent = currentAlbumNames[index];
        currentAlbumCover.src = currentAlbumCoverSrc;
        playPauseButton.textContent = '⏸️';
        isPlaying = true;
        updateLikeButton();
    }

    // Funzione per passare all'album successivo
    function playNextAlbum() {
        const albumCards = document.querySelectorAll('.album-card');
        const currentAlbumIndex = Array.from(albumCards).findIndex(album => 
            album.querySelector('img').src === currentAlbumCoverSrc
        );

        const nextAlbumIndex = (currentAlbumIndex + 1) % albumCards.length;
        const nextAlbum = albumCards[nextAlbumIndex];

        // Simula un click sul pulsante "Ascolta ora" del prossimo album
        const listenNowButton = nextAlbum.querySelector('.listen-now');
        if (listenNowButton) {
            listenNowButton.click();
        }
    }

    // Funzione per mostrare i dettagli dell'album
    function showAlbumDetails(albumCard) {
        const albumCover = albumCard.querySelector('img').src;
        const albumName = albumCard.querySelector('h3').textContent;
        const listenNowButton = albumCard.querySelector('.listen-now');
        const albumSongs = listenNowButton.getAttribute('data-names').split(',');
        const albumSrcs = listenNowButton.getAttribute('data-src').split(',');
        const albumYear = albumCard.getAttribute('data-year') || 'Anno sconosciuto';
        const albumArtist = albumCard.getAttribute('data-artist') || 'Artista sconosciuto';

        // Mostra l'overlay con i dettagli dell'album
        const overlay = document.getElementById('overlay');
        const songList = document.getElementById('song-list');
        overlay.querySelector('img').src = albumCover;
        overlay.querySelector('h2').textContent = albumName;
        overlay.querySelector('.album-year').textContent = `Anno: ${albumYear}`;
        overlay.querySelector('.album-artist').textContent = `Artista: ${albumArtist}`;
        songList.innerHTML = '';

        // Aggiungi le canzoni alla lista con la durata reale
        albumSongs.forEach((song, index) => {
            const li = document.createElement('li');
            li.classList.add('song-item');
            li.innerHTML = `
                <span class="song-name">${index + 1}. ${song}</span>
                <span class="song-duration" id="duration-${index}">Caricamento...</span>
            `;
            songList.appendChild(li);

            // Calcola la durata reale della canzone
            const audio = new Audio(albumSrcs[index]);
            audio.addEventListener('loadedmetadata', function () {
                const durationMinutes = Math.floor(audio.duration / 60);
                const durationSeconds = Math.floor(audio.duration % 60);
                const formattedDuration = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;
                document.getElementById(`duration-${index}`).textContent = formattedDuration;
            });

            // Listener per riprodurre la canzone cliccata
            li.addEventListener('click', function () {
                currentAlbumSongs = albumSrcs;
                currentAlbumNames = albumSongs;
                currentAlbumCoverSrc = albumCover;
                playSong(index); // Riproduce la canzone cliccata
            });
        });

        overlay.classList.add('visible');
    }

    // Listener per i pulsanti "Ascolta ora"
    listenNowButtons.forEach(button => {
        button.addEventListener('click', function () {
            currentAlbumSongs = button.getAttribute('data-src').split(',');
            currentAlbumNames = button.getAttribute('data-names').split(',');
            const albumCard = button.closest('.album-card');
            currentAlbumCoverSrc = albumCard.querySelector('img').src;

            playSong(0); // Riproduce la prima canzone dell'album
        });
    });

    // Listener per il pulsante Play/Pause
    playPauseButton.addEventListener('click', function () {
        if (isPlaying) {
            audioPlayer.pause();
            playPauseButton.textContent = '▶️';
            isPlaying = false;
        } else {
            audioPlayer.play();
            playPauseButton.textContent = '⏸️';
            isPlaying = true;
        }
    });

    // Listener per il pulsante "Precedente"
    prevSongButton.addEventListener('click', function () {
        if (currentSongIndex > 0) {
            playSong(currentSongIndex - 1);
        }
    });

    // Listener per il pulsante "Successivo"
    nextSongButton.addEventListener('click', function () {
        if (isShuffle) {
            playSong(Math.floor(Math.random() * currentAlbumSongs.length));
        } else if (currentSongIndex < currentAlbumSongs.length - 1) {
            playSong(currentSongIndex + 1);
        } else if (isLoop) {
            playSong(0);
        }
    });

    // Listener per il controllo del volume
    volumeControl.addEventListener('input', function () {
        audioPlayer.volume = volumeControl.value / 100;
    });

    // Listener per il cuoricino (like button)
    likeButton.addEventListener('click', function () {
        const currentSongSrc = audioPlayer.src;
        const currentSongName = currentSong.textContent;
        const currentSongCover = currentAlbumCover.src;

        const isLiked = likedSongs.some(song => song.src === currentSongSrc);

        if (isLiked) {
            likedSongs = likedSongs.filter(song => song.src !== currentSongSrc);
        } else {
            likedSongs.push({ src: currentSongSrc, name: currentSongName, cover: currentSongCover });
        }

        saveFavorites();
        updateLikeButton();
    });

    // Listener per aggiornare la barra di progresso
    audioPlayer.addEventListener('timeupdate', updateProgressBar);

    progressBar.addEventListener('input', function () {
        if (!isNaN(audioPlayer.duration)) {
            audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
        }
    });

    // Listener per passare all'album successivo quando finisce l'ultimo brano
    audioPlayer.addEventListener('ended', function () {
        if (currentSongIndex < currentAlbumSongs.length - 1) {
            playSong(currentSongIndex + 1); // Passa alla prossima canzone
        } else {
            playNextAlbum(); // Passa al prossimo album
        }
    });

    // Listener per le card degli album
    document.querySelectorAll('.album-card').forEach(albumCard => {
        albumCard.addEventListener('click', function (event) {
            // Evita di attivare il listener se si clicca sul pulsante "Ascolta ora"
            if (!event.target.classList.contains('listen-now')) {
                showAlbumDetails(albumCard);
            }
        });
    });

    // Listener per chiudere l'overlay
    document.getElementById('close-overlay').addEventListener('click', function () {
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('visible');
    });

    // Listener per chiudere l'overlay cliccando sulla "X"
    document.getElementById('close-overlay').addEventListener('click', function () {
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('visible');
    });

    // Listener per chiudere l'overlay cliccando fuori dal contenuto
    document.getElementById('overlay').addEventListener('click', function (event) {
        if (event.target === this) { // Controlla che il click sia sull'overlay e non sul contenuto
            this.classList.remove('visible');
        }
    });

    // Ripristina lo stato all'avvio
    restorePlayerState();

    // Salva lo stato ogni volta che cambia
    audioPlayer.addEventListener('timeupdate', savePlayerState);
    audioPlayer.addEventListener('play', savePlayerState);
    audioPlayer.addEventListener('pause', savePlayerState);

    // Aggiorna il cuoricino all'avvio
    updateLikeButton();
});
