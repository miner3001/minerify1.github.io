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

    // --- Overlay e gestione playlist ---
    const userPlaylistList = document.getElementById('user-playlist-list');
    const openOverlayBtn = document.getElementById('open-overlay-btn');
    const addSongsOverlay = document.getElementById('add-songs-overlay');
    const closeOverlayBtn = document.getElementById('close-overlay-btn');
    const overlayDiscoverList = document.getElementById('overlay-discover-list');
    const overlayAudioPlayer = document.getElementById('overlay-audio-player');

    // Variabili di stato
    let isPlaying = false;
    let currentFavoriteIndex = 0;
    let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

    // Carica playlist utente da localStorage
    let userPlaylist = JSON.parse(localStorage.getItem('userPlaylist')) || [];

    // Carica canzoni disponibili da localStorage (chiave: discoverSongsData)
    let discoverSongs = [];
    try {
        discoverSongs = JSON.parse(localStorage.getItem('discoverSongsData')) || [];
    } catch (e) {
        discoverSongs = [];
    }

    // Funzione per salvare i preferiti nel localStorage
    function saveFavorites() {
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    }

    // Funzione per aggiornare il cuoricino
    function updateLikeButton() {
        const currentSongSrc = audioPlayer.src;
        const isLiked = likedSongs.some(song => song.src === currentSongSrc);
        likeButton.innerHTML = isLiked ? '<i class="bi bi-heart-fill"></i>' : '<i class="bi bi-heart"></i>';
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
                playPauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
            } else {
                playPauseButton.innerHTML = '<i class="bi bi-play-fill"></i>';
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
            playPauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
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
            playPauseButton.innerHTML = '<i class="bi bi-play-fill"></i>';
            isPlaying = false;
        } else {
            audioPlayer.play();
            playPauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
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
            const resultDiv = document.createElement('div');
            resultDiv.className = 'search-result';
            resultDiv.innerHTML = `
                <img src="${song.cover}" alt="${song.name}">
                <div class="result-info">
                    <h4>${song.name}</h4>
                    <p>${song.artist ? song.artist : ''}</p>
                </div>
            `;
            resultDiv.addEventListener('click', function (event) {
                event.preventDefault();
                const index = likedSongs.indexOf(song);
                if (index !== -1) {
                    playFavoriteSong(index);
                }
            });
            container.appendChild(resultDiv);
        });
        container.style.display = 'block';
    }

    // Inizializza la searchbar
    initializeSearch();

    // --- Funzionalità Creazione Playlist ---
    // Dati di esempio per le canzoni disponibili (simulazione dati da "scopri")
    const discoverSongsData = [
        { id: 1, title: 'Bentley', artist: 'Baby Gang' },
        { id: 2, title: 'Libertad', artist: 'Baby Gang' },
        { id: 3, title: 'BUTTERFLY EFFECT', artist: 'Travis Scott' },
        { id: 4, title: 'Sicko Mode', artist: 'Travis Scott' },
        { id: 5, title: 'GRAMMELOT', artist: 'Kid Yugi' },
        { id: 6, title: 'Ricchi x Sempre', artist: 'Sfera Ebbasta' },
        { id: 7, title: 'Paranoia', artist: 'Baby Gang' },
        { id: 8, title: 'HYAENA', artist: 'Travis Scott' },
        { id: 9, title: '20', artist: 'Capo Plaza' },
        { id: 10, title: 'L’Anticristo', artist: 'Kid Yugi' }
        // ...puoi aggiungere altri titoli qui
    ];

    // Salva i dati delle canzoni scoperte nel localStorage
    function saveDiscoverSongsData() {
        localStorage.setItem('discoverSongsData', JSON.stringify(discoverSongsData));
    }

    // Inizializza la lista delle canzoni scoperte (solo se non esiste già)
    function initializeDiscoverSongs() {
        discoverSongs.length = 0;
        if (!localStorage.getItem('discoverSongsData')) {
            discoverSongsData.forEach(song => {
                discoverSongs.push(song);
            });
            saveDiscoverSongsData();
        } else {
            try {
                const savedSongs = JSON.parse(localStorage.getItem('discoverSongsData')) || [];
                savedSongs.forEach(song => {
                    discoverSongs.push(song);
                });
            } catch (e) {
                console.error('Errore nel parsing dei dati delle canzoni scoperte:', e);
            }
        }
    }

    // Chiama la funzione di inizializzazione
    initializeDiscoverSongs();

    // Renderizza la playlist utente all'avvio
    renderUserPlaylist();

    // --- Funzionalità playlist e overlay robusta con play playlist ---
    function getUserPlaylist() {
        try {
            return JSON.parse(localStorage.getItem('userPlaylist')) || [];
        } catch (e) {
            return [];
        }
    }
    function setUserPlaylist(playlist) {
        localStorage.setItem('userPlaylist', JSON.stringify(playlist));
    }
    function getDiscoverSongs() {
        try {
            return JSON.parse(localStorage.getItem('discoverSongsData')) || [];
        } catch (e) {
            return [];
        }
    }

    let playlistCurrentIndex = null;
    let playlistIsPlaying = false;

    function renderUserPlaylist(activeIdx = null) {
        userPlaylist = getUserPlaylist();
        userPlaylistList.innerHTML = '';
        userPlaylist.forEach((song, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="song-title">${song.title}</span>
                <span class="song-artist">${song.artist}</span>
                <button class="remove-song-btn" title="Rimuovi dalla playlist"><i class="bi bi-x-circle"></i></button>
            `;
            if (activeIdx !== null && idx === activeIdx) {
                li.classList.add('playing');
            }
            li.querySelector('.remove-song-btn').addEventListener('click', () => {
                userPlaylist.splice(idx, 1);
                setUserPlaylist(userPlaylist);
                renderUserPlaylist(playlistIsPlaying ? playlistCurrentIndex : null);
            });
            userPlaylistList.appendChild(li);
        });
    }

    function renderOverlayDiscoverSongs() {
        const discoverSongs = getDiscoverSongs();
        userPlaylist = getUserPlaylist();
        overlayDiscoverList.innerHTML = '';
        discoverSongs.forEach(song => {
            const inPlaylist = userPlaylist.some(s => s.id === song.id);
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="song-title">${song.title}</span>
                <span class="song-artist">${song.artist}</span>
                <button class="overlay-song-btn play" title="Ascolta"><i class="bi bi-play-circle"></i></button>
                <button class="overlay-song-btn add" title="Aggiungi alla playlist" ${inPlaylist ? 'disabled' : ''}><i class="bi bi-plus-circle"></i></button>
            `;
            // Play
            const playBtn = li.querySelector('.play');
            playBtn.addEventListener('click', () => {
                if (song.audioUrl) {
                    // Ferma qualsiasi altra riproduzione
                    overlayAudioPlayer.pause();
                    overlayAudioPlayer.currentTime = 0;
                    overlayAudioPlayer.src = song.audioUrl;
                    overlayAudioPlayer.style.display = 'block';
                    overlayAudioPlayer.play();
                    document.querySelectorAll('.overlay-song-btn.play').forEach(btn => btn.classList.remove('active'));
                    playBtn.classList.add('active');
                }
            });
            // Aggiungi
            li.querySelector('.add').addEventListener('click', () => {
                if (!userPlaylist.some(s => s.id === song.id)) {
                    userPlaylist.push(song);
                    setUserPlaylist(userPlaylist);
                    renderUserPlaylist(playlistIsPlaying ? playlistCurrentIndex : null);
                    renderOverlayDiscoverSongs();
                }
            });
            overlayDiscoverList.appendChild(li);
        });
    }

    openOverlayBtn.addEventListener('click', () => {
        addSongsOverlay.classList.add('active');
        renderOverlayDiscoverSongs();
        overlayAudioPlayer.pause();
        overlayAudioPlayer.style.display = 'none';
        overlayAudioPlayer.src = '';
    });
    closeOverlayBtn.addEventListener('click', () => {
        addSongsOverlay.classList.remove('active');
        overlayAudioPlayer.pause();
        overlayAudioPlayer.style.display = 'none';
        overlayAudioPlayer.src = '';
        document.querySelectorAll('.overlay-song-btn.play').forEach(btn => btn.classList.remove('active'));
    });

    // --- Play Playlist ---
    const playPlaylistBtn = document.getElementById('play-playlist-btn');
    playPlaylistBtn.addEventListener('click', () => {
        userPlaylist = getUserPlaylist();
        if (userPlaylist.length === 0) return;
        playlistCurrentIndex = 0;
        playlistIsPlaying = true;
        playPlaylistSong(playlistCurrentIndex);
    });

    function playPlaylistSong(idx) {
        userPlaylist = getUserPlaylist();
        const song = userPlaylist[idx];
        if (!song) return;
        // Usa audioUrl se presente, altrimenti src
        const url = song.audioUrl || song.src;
        if (!url) return;
        audioPlayer.src = url;
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        currentSong.textContent = song.title || song.name || 'Canzone';
        if (song.cover) currentAlbumCover.src = song.cover;
        playPauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
        isPlaying = true;
        updateLikeButton && updateLikeButton();
        savePlayerState && savePlayerState();
        renderUserPlaylist(idx);
        // Avanza alla prossima canzone al termine
        audioPlayer.onended = () => {
            if (playlistIsPlaying && playlistCurrentIndex !== null) {
                playlistCurrentIndex++;
                if (playlistCurrentIndex < userPlaylist.length) {
                    playPlaylistSong(playlistCurrentIndex);
                } else {
                    playlistIsPlaying = false;
                    playlistCurrentIndex = null;
                    renderUserPlaylist();
                }
            }
        };
    }
    // Ferma la sequenza se l'utente interagisce con il player
    [playPauseButton, prevSongButton, nextSongButton].forEach(btn => {
        btn.addEventListener('click', () => {
            playlistIsPlaying = false;
            playlistCurrentIndex = null;
            renderUserPlaylist();
        });
    });
    // All'avvio
    renderUserPlaylist();
});
