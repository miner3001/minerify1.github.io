"use strict";

document.addEventListener('DOMContentLoaded', function () {
    // Elementi del DOM
    const playPauseButton = document.getElementById('play-pause');
    const prevSongButton = document.getElementById('prev-song');
    const nextSongButton = document.getElementById('next-song');
    const progressBar = document.getElementById('progress-bar');
    const volumeControl = document.getElementById('volume-control');
    const currentSong = document.getElementById('current-song');
    const currentAlbumCover = document.getElementById('current-album-cover');
    const currentTime = document.getElementById('current-time');
    const totalDuration = document.getElementById('total-duration');
    const likeButton = document.getElementById('like-button');
    const audioPlayer = document.getElementById('audio-player');
    const songList = document.getElementById('song-list');

    // Variabili di stato
    let isPlaying = false;
    let currentFavoriteIndex = 0;
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

    // Funzione per riprodurre una canzone preferita
    function playFavoriteSong(index) {
        if (index >= 0 && index < likedSongs.length) {
            const song = likedSongs[index];
            audioPlayer.src = song.src;
            audioPlayer.play();
            currentSong.textContent = song.name;
            currentAlbumCover.src = song.cover;
            playPauseButton.textContent = '⏸️';
            isPlaying = true;
            currentFavoriteIndex = index;
            updateLikeButton();
            savePlayerState();
        }
    }

    // Funzione per mostrare i brani preferiti
    function displayFavoriteSongs() {
        songList.innerHTML = ''; // Svuota la lista

        likedSongs.forEach((song, index) => {
            const card = document.createElement('div');
            card.classList.add('album-card');
            card.innerHTML = `
                <img src="${song.cover}" alt="${song.name}">
                <h3>${song.name}</h3>
                <button class="listen-now" data-index="${index}">Ascolta ora</button>
                <button class="remove-favorite">❤️</button>
            `;
            songList.appendChild(card);

            // Listener per il pulsante "Ascolta ora"
            card.querySelector('.listen-now').addEventListener('click', function () {
                playFavoriteSong(index);
            });

            // Listener per il pulsante "Rimuovi dai preferiti"
            card.querySelector('.remove-favorite').addEventListener('click', function () {
                likedSongs.splice(index, 1);
                saveFavorites();
                displayFavoriteSongs();
            });
        });
    }

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
        savePlayerState();
    });

    // Listener per il pulsante "Precedente"
    prevSongButton.addEventListener('click', function () {
        if (likedSongs.length > 0) {
            currentFavoriteIndex = (currentFavoriteIndex - 1 + likedSongs.length) % likedSongs.length;
            playFavoriteSong(currentFavoriteIndex);
        }
    });

    // Listener per il pulsante "Successivo"
    nextSongButton.addEventListener('click', function () {
        if (likedSongs.length > 0) {
            currentFavoriteIndex = (currentFavoriteIndex + 1) % likedSongs.length;
            playFavoriteSong(currentFavoriteIndex);
        }
    });

    // Listener per il controllo del volume
    volumeControl.addEventListener('input', function () {
        audioPlayer.volume = volumeControl.value / 100;
    });

    // Listener per aggiornare la barra di progresso
    audioPlayer.addEventListener('timeupdate', updateProgressBar);

    progressBar.addEventListener('input', function () {
        if (!isNaN(audioPlayer.duration)) {
            audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
        }
    });

    // Ripristina lo stato all'avvio
    restorePlayerState();

    // Mostra i brani preferiti all'avvio
    displayFavoriteSongs();

    // Salva lo stato ogni volta che cambia
    audioPlayer.addEventListener('timeupdate', savePlayerState);
    audioPlayer.addEventListener('play', savePlayerState);
    audioPlayer.addEventListener('pause', savePlayerState);

    // Funzione per inizializzare la searchbar
    function initializeSearch() {
        const searchBar = document.getElementById('search-bar');
        const searchResults = document.getElementById('search-results');

        searchBar.addEventListener('input', function () {
            const searchTerm = searchBar.value.toLowerCase();
            const filteredSongs = likedSongs.filter(song =>
                song.name.toLowerCase().includes(searchTerm)
            );
            displaySearchResults(filteredSongs, searchResults);
        });

        document.addEventListener('click', function (event) {
            if (!searchBar.contains(event.target) && !searchResults.contains(event.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    // Funzione per mostrare i risultati della ricerca
    function displaySearchResults(results, container) {
        container.innerHTML = '';
        if (results.length === 0) {
            container.style.display = 'none';
            return;
        }

        results.forEach(song => {
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = song.name;
            a.addEventListener('click', function (event) {
                event.preventDefault();
                const index = likedSongs.indexOf(song);
                if (index !== -1) {
                    playFavoriteSong(index);
                }
            });
            container.appendChild(a);
        });
        container.style.display = 'block';
    }

    // Inizializza la searchbar
    initializeSearch();
});
