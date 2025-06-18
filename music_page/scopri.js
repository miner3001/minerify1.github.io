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
            currentAlbumSongs: currentAlbumSongs,
            currentAlbumNames: currentAlbumNames,
            currentAlbumCoverSrc: currentAlbumCoverSrc,
            currentSongIndex: currentSongIndex,
            volume: audioPlayer.volume,
            isShuffle: isShuffle,
            isLoop: isLoop
        };
        localStorage.setItem('playerState', JSON.stringify(playerState));
    }

    // Ripristina lo stato del player dal localStorage
    function restorePlayerState() {
        try {
            const savedState = JSON.parse(localStorage.getItem('playerState'));
            if (savedState) {
                audioPlayer.src = savedState.src || '';
                audioPlayer.currentTime = savedState.currentTime || 0;
                audioPlayer.volume = savedState.volume || 1;
                currentSong.textContent = savedState.songName || 'Nessuna canzone in riproduzione';
                currentAlbumCover.src = savedState.albumCover || '';
                currentAlbumSongs = savedState.currentAlbumSongs || [];
                currentAlbumNames = savedState.currentAlbumNames || [];
                currentAlbumCoverSrc = savedState.currentAlbumCoverSrc || '';
                currentSongIndex = savedState.currentSongIndex || 0;
                isShuffle = savedState.isShuffle || false;
                isLoop = savedState.isLoop || false;
                
                if (savedState.isPlaying) {
                    audioPlayer.play()
                        .then(() => {
                            isPlaying = true;
                            playPauseButton.textContent = '⏸️';
                        })
                        .catch(() => {
                            isPlaying = false;
                            playPauseButton.textContent = '▶️';
                        });
                }
                
                updateLikeButton();
                updateShuffleLoopButtons();
            }
        } catch (error) {
            console.error('Errore nel ripristino dello stato:', error);
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
        if (!currentAlbumSongs || !currentAlbumSongs.length || index < 0 || index >= currentAlbumSongs.length) {
            console.error('Indice canzone non valido o nessun album selezionato');
            return;
        }

        try {
            currentSongIndex = index;
            audioPlayer.src = currentAlbumSongs[index];
            
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        currentSong.textContent = currentAlbumNames[index];
                        currentAlbumCover.src = currentAlbumCoverSrc;
                        playPauseButton.textContent = '⏸️';
                        isPlaying = true;
                        updateLikeButton();
                        savePlayerState();
                    })
                    .catch(error => {
                        console.error('Errore riproduzione:', error);
                        // Se c'è un errore, prova a passare alla prossima canzone
                        if (!isLoop && currentSongIndex < currentAlbumSongs.length - 1) {
                            playSong(currentSongIndex + 1);
                        }
                    });
            }
        } catch (error) {
            console.error('Errore critico:', error);
        }
    }

    // Funzione per passare all'album successivo
    function playNextAlbum() {
        const albumCards = document.querySelectorAll('.album-card');
        let currentAlbumCard = null;
        
        // Trova l'album corrente
        for (let i = 0; i < albumCards.length; i++) {
            if (albumCards[i].querySelector('img')?.src === currentAlbumCoverSrc) {
                currentAlbumCard = albumCards[i];
                break;
            }
        }

        if (currentAlbumCard) {
            const currentIndex = Array.from(albumCards).indexOf(currentAlbumCard);
            const nextIndex = (currentIndex + 1) % albumCards.length;
            const nextAlbum = albumCards[nextIndex];
            
            if (nextAlbum) {
                const listenNowButton = nextAlbum.querySelector('.listen-now');
                if (listenNowButton) {
                    // Aggiorna tutti i dati dell'album corrente
                    currentAlbumSongs = listenNowButton.getAttribute('data-src').split(',');
                    currentAlbumNames = listenNowButton.getAttribute('data-names').split(',');
                    currentAlbumCoverSrc = nextAlbum.querySelector('img').src;
                    currentSongIndex = 0;
                    
                    // Riproduci la prima canzone del nuovo album
                    playSong(0);
                    
                    // Salva lo stato per mantenere la coerenza
                    savePlayerState();
                }
            }
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

        // Aggiungi le canzoni alla lista con la durata dalla mappa
        albumSongs.forEach((song, index) => {
            const li = document.createElement('li');
            li.classList.add('song-item');
            const src = albumSrcs[index];
            let durationText = 'N/D';
            if (trackDurations[src]) {
                const min = Math.floor(trackDurations[src] / 60);
                const sec = trackDurations[src] % 60;
                durationText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
            }
            li.innerHTML = `
                <span class="song-name">${index + 1}. ${song}</span>
                <span class="song-duration" id="duration-${index}">${durationText}</span>
            `;
            songList.appendChild(li);

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

    // Modifica il listener per la fine della canzone
    audioPlayer.addEventListener('ended', function() {
        if (isLoop) {
            playSong(currentSongIndex);
        } else if (isShuffle) {
            const nextIndex = Math.floor(Math.random() * currentAlbumSongs.length);
            playSong(nextIndex);
        } else if (currentSongIndex < currentAlbumSongs.length - 1) {
            // Still has songs in current album
            playSong(currentSongIndex + 1);
        } else {
            // Last song in album, find and play next album
            const albumCards = document.querySelectorAll('.album-card');
            let currentAlbumCard = null;
            
            // Find current album card
            for (let i = 0; i < albumCards.length; i++) {
                if (albumCards[i].querySelector('img').src === currentAlbumCoverSrc) {
                    currentAlbumCard = albumCards[i];
                    break;
                }
            }

            if (currentAlbumCard) {
                const currentIndex = Array.from(albumCards).indexOf(currentAlbumCard);
                const nextIndex = (currentIndex + 1) % albumCards.length;
                const nextAlbum = albumCards[nextIndex];
                
                if (nextAlbum) {
                    const listenNowButton = nextAlbum.querySelector('.listen-now');
                    if (listenNowButton) {
                        // Update current album data with next album
                        currentAlbumSongs = listenNowButton.getAttribute('data-src').split(',');
                        currentAlbumNames = listenNowButton.getAttribute('data-names').split(',');
                        currentAlbumCoverSrc = nextAlbum.querySelector('img').src;
                        currentSongIndex = 0;
                        
                        // Play first song of next album immediately
                        playSong(0);
                    }
                }
            }
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

    audioPlayer.addEventListener('error', (e) => {
        console.error('Errore audio:', e);
        currentSong.textContent = 'Errore di riproduzione';
        playPauseButton.textContent = '▶️';
        isPlaying = false;
    });

    window.addEventListener('beforeunload', () => {
        savePlayerState();
    });

    // Ripristina lo stato all'avvio
    restorePlayerState();

    // Salva lo stato ogni volta che cambia
    audioPlayer.addEventListener('timeupdate', savePlayerState);
    audioPlayer.addEventListener('play', savePlayerState);
    audioPlayer.addEventListener('pause', savePlayerState);

    // Aggiorna il cuoricino all'avvio
    updateLikeButton();

    // Inizializza la barra di ricerca
    initializeSearch();

    // Inizializza le stelle
    initializeStars();

    // Mostra loader quando l'audio sta caricando
    audioPlayer.addEventListener('loadstart', function() {
        document.getElementById('audio-loader').style.display = 'block';
    });
    // Nasconde loader quando l'audio è pronto
    audioPlayer.addEventListener('canplaythrough', function() {
        document.getElementById('audio-loader').style.display = 'none';
    });
    // Nasconde loader anche in caso di errore
    audioPlayer.addEventListener('error', function() {
        document.getElementById('audio-loader').style.display = 'none';
    });
});

// Mappa delle durate delle tracce (secondi) per ogni file audio
const trackDurations = {
    // Esempio: 'music/1.mp3': 180, // 3:00
     'music/1.mp3': 119,   // 1 min e 59 secondi
  'music/2.mp3': 232,   // 3 min e 52 secondi
  'music/3.mp3': 194,   // 3 min e 14 secondi
  'music/4.mp3': 144,   // 2 min e 24 secondi
  'music/5.mp3': 186,   // 3 min e 06 secondi
  'music/61.mp3': 176,  // 2 min e 56 secondi
  'music/62.mp3': 183,  // 3 min e 03 secondi
  'music/63.mp3': 147,  // 2 min e 27 secondi
  'music/64.mp3': 130,  // 2 min e 10 secondi
  'music/65.mp3': 186,  // 3 min e 06 secondi
  'music/66.mp3': 203,  // 3 min e 23 secondi
  'music/67.mp3': 203,  // 3 min e 23 secondi
  'music/68.mp3': 168,  // 2 min e 48 secondi
  'music/69.mp3': 147,  // 2 min e 27 secondi
  'music/70.mp3': 167,  // 2 min e 47 secondi
  'music/71.mp3': 177,  // 2 min e 57 secondi
  'music/72.mp3': 217,  // 3 min e 37 secondi
  'music/73.mp3': 226   // 3 min e 46 secondi
    // ...aggiungi qui tutte le altre tracce...
};

function initializeSearch() {
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');
    let searchTimeout;

    searchBar.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (searchTerm.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            const albums = document.querySelectorAll('.album-card');
            const results = [];

            // Cerca negli album
            albums.forEach(album => {
                const title = album.querySelector('h3').textContent.toLowerCase();
                const artist = album.dataset.artist.toLowerCase();
                
                if (title.includes(searchTerm) || artist.includes(searchTerm)) {
                    results.push({
                        type: 'album',
                        element: album,
                        title: title,
                        artist: artist,
                        cover: album.querySelector('img').src,
                        year: album.dataset.year
                    });
                }

                // Cerca nelle canzoni dell'album
                const listenNowButton = album.querySelector('.listen-now');
                if (listenNowButton) {
                    const songs = listenNowButton.getAttribute('data-names')?.split(',') || [];
                    songs.forEach((song, index) => {
                        if (song.toLowerCase().includes(searchTerm)) {
                            results.push({
                                type: 'song',
                                element: album,
                                title: song,
                                artist: artist,
                                cover: album.querySelector('img').src,
                                albumTitle: title,
                                songIndex: index
                            });
                        }
                    });
                }
            });

            displaySearchResults(results, searchResults);
        }, 300);
    });
}

function displaySearchResults(results, container) {
    container.innerHTML = '';
    if (results.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    
    results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result';
        
        if (result.type === 'album') {
            resultElement.innerHTML = `
                <img src="${result.cover}" alt="Album cover" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="result-info">
                    <h4>${result.title}</h4>
                    <p>${result.artist} - ${result.year}</p>
                    <span class="result-type">Album</span>
                </div>
            `;
        } else {
            resultElement.innerHTML = `
                <img src="${result.cover}" alt="Album cover" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="result-info">
                    <h4>${result.title}</h4>
                    <p>${result.artist} - ${result.albumTitle}</p>
                    <span class="result-type">Canzone</span>
                </div>
            `;
        }

        resultElement.addEventListener('click', () => {
            const listenNowButton = result.element.querySelector('.listen-now');
            const searchBar = document.getElementById('search-bar'); // Aggiungi questa riga
            
            if (result.type === 'album') {
                listenNowButton.click();
            } else {
                listenNowButton.click();
                setTimeout(() => {
                    playSong(result.songIndex);
                }, 100);
            }
            
            // Resetta il campo di ricerca e nascondi i risultati
            searchBar.value = '';
            container.style.display = 'none';
        });

        container.appendChild(resultElement);
    });
}

function initializeStars() {
    const starsContainer = document.querySelector('.stars');
    const numberOfStars = 1000;
    const maxSize = 2;

    starsContainer.innerHTML = '';

    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Posizione casuale
        const x = Math.random() * 100;
        const y = Math.random() * 300;
        
        // Dimensione più piccola per stelle più realistiche
        const size = 0.3 + Math.random() * maxSize;
        
        // Brillio più lento
        const twinkleDuration = 8 + Math.random() * 12; // 8-20 secondi per brillio
        
        star.style.cssText = `
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            --twinkle-duration: ${twinkleDuration}s;
            animation-delay: ${Math.random() * twinkleDuration}s;
            background: rgba(255, 255, 255, ${0.3 + Math.random() * 0.4}); // Luminosità ridotta
            box-shadow: 0 0 ${size * 1.5}px rgba(255, 255, 255, 0.6);
            position: absolute;
            border-radius: 50%;
        `;
        
        starsContainer.appendChild(star);
    }

    // Movimento molto più lento
    let scrollPosition = 0;
    function moveStars() {
        scrollPosition += 0.01; // Drasticamente ridotta la velocità base
        const stars = document.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            const speed = 0.02 + (index % 5) * 0.005; // Velocità molto ridotta con più variazione
            const y = parseFloat(star.style.top) + speed;
            
            if (y > 300) {
                star.style.top = '-5%';
            } else {
                star.style.top = y + '%';
            }
        });

        requestAnimationFrame(moveStars);
    }

    moveStars();
}

function findNextAlbumCard() {
    const albumCards = document.querySelectorAll('.album-card');
    let currentAlbumCard = null;
    
    // Find current album card
    for (let i = 0; i < albumCards.length; i++) {
        if (albumCards[i].querySelector('img')?.src === currentAlbumCoverSrc) {
            currentAlbumCard = albumCards[i];
            break;
        }
    }

    if (currentAlbumCard) {
        const currentIndex = Array.from(albumCards).indexOf(currentAlbumCard);
        const nextIndex = (currentIndex + 1) % albumCards.length;
        return albumCards[nextIndex];
    }
    
    return null;
}
