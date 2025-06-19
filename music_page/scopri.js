"use strict";

// Variabili di stato globali
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let currentSongIndex = 0;
let currentAlbumSongs = [];
let currentAlbumNames = [];
let currentAlbumCoverSrc = '';
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let allSongsData = [];
let shuffleHistory = [];
const MAX_SHUFFLE_HISTORY = 20;

// Inizializza allSongsData con tutte le canzoni di tutti gli album
function initializeAllSongsData() {
    allSongsData = [];
    const albumCards = document.querySelectorAll('.album-card');
    albumCards.forEach((album, albumIdx) => {
        const listenNowButton = album.querySelector('.listen-now');
        if (!listenNowButton) return;
        const songSources = listenNowButton.getAttribute('data-src')?.split(',') || [];
        const songNames = listenNowButton.getAttribute('data-names')?.split(',') || [];
        const albumTitle = album.querySelector('h3')?.textContent || '';
        const artist = album.dataset.artist || '';
        const cover = album.querySelector('img')?.src || '';
        songSources.forEach((src, songIdx) => {
            const duration = trackDurations[src.trim()] || 0;
            allSongsData.push({
                src: src.trim(),
                name: songNames[songIdx] ? songNames[songIdx].trim() : '',
                albumName: albumTitle,
                artist: artist,
                cover: cover,
                duration: duration,
                originalAlbumIndex: albumIdx,
                originalSongIndexInAlbum: songIdx
            });
        });
    });
    
    // Salva allSongsData nel localStorage per la pagina playlist
    localStorage.setItem('allSongsDataStore', JSON.stringify(allSongsData));
    console.log('All songs data saved to localStorage:', allSongsData.length, 'songs');
}

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
    const totalDuration = document.getElementById('total-duration');    const likeButton = document.getElementById('like-button');
    const addToPlaylistButton = document.getElementById('add-to-playlist-button');
    const audioPlayer = document.getElementById('audio-player');
    const listenNowButtons = document.querySelectorAll('.listen-now');

    // Inizializza allSongsData
    initializeAllSongsData();

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
                            playPauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
                        })
                        .catch(() => {
                            isPlaying = false;
                            playPauseButton.innerHTML = '<i class="bi bi-play-fill"></i>';
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
    function playSong(songData) {
        if (!songData) return;
        setCurrentAlbumContextFromSong(songData);
        audioPlayer.src = songData.src;
        currentSong.textContent = songData.name;
        if (typeof currentArtist !== 'undefined' && currentArtist) currentArtist.textContent = songData.artist;
        currentAlbumCover.src = songData.cover;
        document.getElementById('audio-loading').style.display = 'block';
        audioPlayer.play().then(() => {
            isPlaying = true;
            playPauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
            if (isShuffle) {
                shuffleHistory.push(songData.src);
                if (shuffleHistory.length > MAX_SHUFFLE_HISTORY) shuffleHistory.shift();
            }
            updateLikeButton();
            savePlayerState();
        }).catch(() => {
            isPlaying = false;
            playPauseButton.innerHTML = '<i class="bi bi-play-fill"></i>';
        });
        audioPlayer.oncanplay = function() {
            document.getElementById('audio-loading').style.display = 'none';
        };
        audioPlayer.onerror = function() {
            document.getElementById('audio-loading').style.display = 'none';
        };
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
                // Trova l'oggetto canzone completo da allSongsData usando src
                const songObjectToPlay = allSongsData.find(songObj => songObj.src === albumSrcs[index]);
                if (songObjectToPlay) {
                    currentSongIndex = allSongsData.indexOf(songObjectToPlay);
                    playSong(songObjectToPlay);
                }
            });
        });

        overlay.classList.add('visible');
    }

    // Listener per i pulsanti "Ascolta ora"
    listenNowButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Se il pulsante NON ha attributi data-src/data-names (quello in alto)
            if (!button.hasAttribute('data-src') && !button.hasAttribute('data-names')) {
                // Scegli una canzone casuale da allSongsData
                if (allSongsData.length > 0) {
                    const randomIndex = Math.floor(Math.random() * allSongsData.length);
                    const songObjectToPlay = allSongsData[randomIndex];
                    currentSongIndex = allSongsData.indexOf(songObjectToPlay);
                    playSong(songObjectToPlay);
                }
                return;
            }
            currentAlbumSongs = button.getAttribute('data-src').split(',');
            currentAlbumNames = button.getAttribute('data-names').split(',');
            const albumCard = button.closest('.album-card');
            currentAlbumCoverSrc = albumCard.querySelector('img').src;
            // Trova la prima canzone dell'album come oggetto
            const firstSongSrc = currentAlbumSongs[0];
            const songObjectToPlay = allSongsData.find(songObj => songObj.src === firstSongSrc);
            if (songObjectToPlay) {
                currentSongIndex = allSongsData.indexOf(songObjectToPlay);
                playSong(songObjectToPlay);
            }
        });
    });

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
    });

    // Listener per il pulsante "Precedente"
    prevSongButton.addEventListener('click', function () {
        if (isShuffle) {
            if (shuffleHistory.length > 1) {
                shuffleHistory.pop(); // Rimuovi la canzone attuale
                const prevSrc = shuffleHistory.pop();
                const songObj = allSongsData.find(song => song.src === prevSrc);
                if (songObj) playSong(songObj);
            }
            return;
        }
        if (currentSongIndex > 0) {
            const songObj = allSongsData.find(song => song.src === currentAlbumSongs[currentSongIndex - 1]);
            playSong(songObj);
        }
    });

    // Listener per il pulsante "Successivo"
    nextSongButton.addEventListener('click', function () {
        if (isShuffle) {
            let nextIdx;
            do {
                nextIdx = Math.floor(Math.random() * allSongsData.length);
            } while (allSongsData.length > 1 && allSongsData[nextIdx].src === audioPlayer.src);
            const songObj = allSongsData[nextIdx];
            playSong(songObj);
        } else if (currentSongIndex < currentAlbumSongs.length - 1) {
            const songObj = allSongsData.find(song => song.src === currentAlbumSongs[currentSongIndex + 1]);
            playSong(songObj);
        } else if (isLoop) {
            const songObj = allSongsData.find(song => song.src === currentAlbumSongs[0]);
            playSong(songObj);
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

    // Funzioni per gestire la playlist
    function saveMyPlaylist() {
        localStorage.setItem('myPlaylist', JSON.stringify(myPlaylist));
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1db954;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-weight: 600;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.opacity = '1', 100);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function addSongToMyPlaylist(songData) {
        let myPlaylist = JSON.parse(localStorage.getItem('myPlaylist')) || [];
        
        if (!myPlaylist.some(song => song.src === songData.src)) {
            myPlaylist.push(songData);
            localStorage.setItem('myPlaylist', JSON.stringify(myPlaylist));
            showToast(`"${songData.name}" aggiunta alla playlist!`);
        } else {
            showToast(`"${songData.name}" è già nella playlist.`);
        }
    }

    // Listener per il pulsante "Aggiungi alla playlist"
    addToPlaylistButton.addEventListener('click', function () {
        if (!audioPlayer.src) {
            showToast('Nessuna canzone in riproduzione da aggiungere.');
            return;
        }

        // Trova la canzone corrente in allSongsData
        const currentSongSrc = audioPlayer.src;
        const currentSongData = allSongsData.find(song => currentSongSrc.includes(song.src));
        
        if (currentSongData) {
            addSongToMyPlaylist(currentSongData);
        } else {
            // Fallback: crea oggetto canzone con dati disponibili
            const songData = {
                src: currentSongSrc.split('/').pop(), // Solo il nome del file
                name: currentSong.textContent,
                artist: currentArtist?.textContent || 'Artista Sconosciuto',
                albumName: 'Album Sconosciuto',
                cover: currentAlbumCover.src,
                duration: audioPlayer.duration || 0
            };
            addSongToMyPlaylist(songData);
        }
    });

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

    // Modifica il listener per la fine della canzone
    audioPlayer.addEventListener('ended', function () {
        if (isLoop) {
            const songObj = allSongsData.find(song => song.src === currentAlbumSongs[currentSongIndex]);
            playSong(songObj);
        } else if (isShuffle) {
            let nextIdx;
            do {
                nextIdx = Math.floor(Math.random() * allSongsData.length);
            } while (allSongsData.length > 1 && allSongsData[nextIdx].src === audioPlayer.src);
            const songObj = allSongsData[nextIdx];
            playSong(songObj);
        } else if (currentSongIndex < currentAlbumSongs.length - 1) {
            const songObj = allSongsData.find(song => song.src === currentAlbumSongs[currentSongIndex + 1]);
            playSong(songObj);
        } else {
            playNextAlbum();
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

    // Nasconde loader quando l'audio è pronto
    audioPlayer.addEventListener('canplaythrough', function () {
        document.getElementById('audio-loading').style.display = 'none';
    });
    // Nasconde loader anche in caso di errore
    audioPlayer.addEventListener('error', function () {
        document.getElementById('audio-loading').style.display = 'none';
    });
});

// Mappa delle durate delle tracce (secondi) per ogni file audio
const trackDurations = {
    // Esempio: 'music/1.mp3': 180, // 3:00

    // innocente 
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
    'music/73.mp3': 226,  // 3 min e 46 secondi

    // astroworld
    'music/6.mp3': 191,   // BUTTERFLY EFFECT - Travis Scott (3:11)
    'music/7.mp3': 313,   // Sicko Mode - Travis Scott (5:13)
    'music/8.mp3': 146,   // Skeletons - Travis Scott (2:26)
    'music/9.mp3': 196,   // 5% TINT - Travis Scott (3:16)
    'music/10.mp3': 191,  // ZEZE - Travis Scott (3:11)
    'music/74.mp3': 271,  // STARGAZING - Travis Scott (4:31)
    'music/75.mp3': 180,  // CAROUSEL (Ft. Frank Ocean) - Travis Scott (3:00)
    'music/76.mp3': 186,  // R.I.P. SCREW (Ft. Swae Lee) - Travis Scott (3:06)
    'music/77.mp3': 338,  // STOP TRYING TO BE GOD (Ft. James Blake, Kid Cudi & Philip Bailey) - Travis Scott (5:38)
    'music/78.mp3': 218,  // NO BYSTANDERS (Ft. Juice WRLD & Sheck Wes) - Travis Scott (3:38)
    'music/79.mp3': 232,  // WAKE UP (Ft. The Weeknd) - Travis Scott (3:52)
    'music/80.mp3': 157,  // NC-17 (Ft. 21 Savage) - Travis Scott (2:37)
    'music/81.mp3': 143,  // ASTROTHUNDER - Travis Scott (2:23)
    'music/82.mp3': 150,  // YOSEMITE (Ft. Gunna & NAV) - Travis Scott (2:30)
    'music/83.mp3': 198,  // CAN'T SAY (Ft. Don Toliver) - Travis Scott (3:18)
    'music/84.mp3': 177,  // WHO? WHAT! (Ft. Quavo & Takeoff) - Travis Scott (2:57)
    'music/85.mp3': 218,  // HOUSTONFORNICATION - Travis Scott (3:38)
    'music/86.mp3': 209,  // COFFEE BEAN - Travis Scott (3:29)

    // The Globe - Kid Yugi
    'music/11.mp3': 212,  // DEM - Kid Yugi (ft. Artie 5ive & Tony Boy) 3:32
    'music/12.mp3': 185,  // GRAMMELOT - Kid Yugi 3:05
    'music/13.mp3': 191,  // Il Ferro di Čechov - Kid Yugi 3:11
    'music/14.mp3': 146,  // Il Filmografo - Kid Yugi 2:26
    'music/15.mp3': 117,  // Yung 3P 3 - Kid Yugi 1:57
    'music/93.mp3': 116,  // Hybris - Kid Yugi 1:56
    'music/94.mp3': 180,  // Kabuki - Kid Yugi 3:00
    'music/95.mp3': 175,  // No Gimmick - Kid Yugi 2:55
    'music/96.mp3': 207,  // Sturm und drang - Kid Yugi 3:27
    'music/97.mp3': 145,  // Back n' Forth (ft. Kira) - Kid Yugi 2:25
    'music/98.mp3': 151,  // King Lear (ft. Sosa Priority) - Kid Yugi 2:31
    'music/99.mp3': 182,  // Paradise Now - Kid Yugi 3:02

    // Sfera Ebbasta
    'music/16.mp3': 185,  // Ricchi x Sempre - Sfera Ebbasta (3:05)
    'music/17.mp3': 205,  // Sciroppo (ft. DrefGold) - Sfera Ebbasta (3:25)
    'music/18.mp3': 185,  // Tran Tran - Sfera Ebbasta (3:05)
    'music/19.mp3': 189,  // Bancomat - Sfera Ebbasta (3:09)
    'music/20.mp3': 200,  // Serpenti a Sonagli - Sfera Ebbasta (3:20)
    'music/87.mp3': 183,  // Uber - Sfera Ebbasta (3:03)
    'music/88.mp3': 184,  // Leggenda - Sfera Ebbasta (3:04)
    'music/89.mp3': 210,  // Rockstar - Sfera Ebbasta (3:30)
    'music/90.mp3': 160,  // 20 Collane (ft. Rich The Kid) - Sfera Ebbasta (2:40)
    'music/91.mp3': 210,  // Cupido (ft. Quavo) - Sfera Ebbasta (3:30)
    'music/92.mp3': 143,  // XNX - Sfera Ebbasta (2:23)

    // Baby Gang (Ep2)
    'music/21.mp3': 182,  // Paranoia - Baby Gang (3:02)
    'music/22.mp3': 166,  // Combattere - Baby Gang (2:46)
    'music/23.mp3': 160,  // Carico - Baby Gang (2:40)
    'music/24.mp3': 143,  // 2000 - Baby Gang (2:23)
    'music/25.mp3': 144,  // Cella 3 - Baby Gang (2:24)
    'music/26.mp3': 217,  // Mentalité - Baby Gang (3:37)
    'music/27.mp3': 212,  // Lei - Baby Gang (3:32)
    'music/28.mp3': 169,  // Mamacita - Baby Gang (2:49)

    // UTOPIA - Travis Scott
    'music/29.mp3': 222,  // HYAENA - Travis Scott (3:42)
    'music/30.mp3': 184,  // THANK GOD - Travis Scott (3:04)
    'music/31.mp3': 255,  // MODERN JAM (Ft. Teezo Touchdown) - Travis Scott (4:15)
    'music/32.mp3': 251,  // MY EYES - Travis Scott (4:11)
    'music/33.mp3': 127,  // GOD’S COUNTRY - Travis Scott (2:07)
    'music/34.mp3': 204,  // SIRENS - Travis Scott (3:24)
    'music/35.mp3': 246,  // MELTDOWN (Ft. Drake) - Travis Scott (4:06)
    'music/36.mp3': 191,  // FE!N (Ft. Playboi Carti) - Travis Scott (3:11)
    'music/37.mp3': 274,  // DELRESTO (ECHOES) - Beyoncé & Travis Scott (4:34)
    'music/38.mp3': 211,  // I KNOW ? - Travis Scott (3:31)
    'music/39.mp3': 223,  // TOPIA TWINS (Ft. 21 Savage & Rob49) - Travis Scott (3:43)
    'music/40.mp3': 258,  // CIRCUS MAXIMUS (Ft. Swae Lee & The Weeknd) - Travis Scott (4:18)
    'music/41.mp3': 154,  // PARASAIL (Ft. Dave Chappelle & Yung Lean) - Travis Scott (2:34)
    'music/42.mp3': 366,  // SKITZO (Ft. Young Thug) - Travis Scott (6:06)
    'music/43.mp3': 163,  // LOST FOREVER (Ft. Westside Gunn) - Travis Scott (2:43)
    'music/44.mp3': 226,  // LOOOVE (Ft. Kid Cudi) - Travis Scott (3:46)
    'music/45.mp3': 185,  // K-POP (Ft. Bad Bunny & The Weeknd) - Travis Scott (3:05)
    'music/46.mp3': 353,  // TELEKINESIS (Ft. Future & SZA) - Travis Scott (5:53)

    // 20 capo plaza 
    'music/47.mp3': 241,  // 20 - Capo Plaza (4:01)
    'music/48.mp3': 180,  // Giù da me - Capo Plaza (3:00)
    'music/49.mp3': 185,  // Tesla (Ft. DrefGold & Sfera Ebbasta) - Capo Plaza (3:05)
    'music/50.mp3': 146,  // Nike Boy - Capo Plaza (2:26)
    'music/51.mp3': 197,  // Come me - Capo Plaza (3:17)
    'music/52.mp3': 208,  // J$ JP - Capo Plaza (3:28)
    'music/53.mp3': 135,  // Interlude (Ora è la mia ora) - Capo Plaza (2:15)
    'music/54.mp3': 234,  // Ne è valsa la pena (Ft. Ghali) - Capo Plaza (3:54)
    'music/55.mp3': 208,  // Non cambierò mai - Capo Plaza (3:28)
    'music/56.mp3': 194,  // Taxi - Capo Plaza (3:14)
    'music/57.mp3': 208,  // Uno squillo - Capo Plaza (3:28)
    'music/58.mp3': 195,  // Vabbene - Capo Plaza (3:15)
    'music/59.mp3': 219,  // Forte e chiaro - Capo Plaza (3:39)
    'music/60.mp3': 221,  // Giovane fuoriclasse - Capo Plaza (3:41)

    // I Nomi del Diavolo - Kid Yugi
    'music/100.mp3': 135,  // L’Anticristo (2:15)
    'music/101.mp3': 195,  // Capra a tre Teste (Ft. Artie 5ive & Tony Boy) (3:15)
    'music/102.mp3': 160,  // Eva (Ft. Tedua) (2:40)
    'music/103.mp3': 206,  // Servizio (Ft. Noyz Narcos & Papa V) (3:26)
    'music/104.mp3': 193,  // Il Signore delle Mosche (3:13)
    'music/105.mp3': 164,  // Lilith (2:44)
    'music/106.mp3': 185,  // Nemico (Ft. Ernia) (3:05)
    'music/107.mp3': 144,  // Denaro (Ft. Simba La Rue) (2:24)
    'music/108.mp3': 185,  // Yung 3p 4 (3:05)
    'music/109.mp3': 186,  // Terr1 (Ft. Geolier) (3:06)
    'music/110.mp3': 188,  // Ilva (Fume scure rmx) (Ft. Fido Guido) (3:08)
    'music/111.mp3': 174,  // Paganini (2:54)
    'music/112.mp3': 178,  // Ex Angelo (Ft. Sfera Ebbasta) (2:58)
    'music/113.mp3': 180,  // Lucifero (3:00)

    // Morad
    'music/114.mp3': 160,  // Cristales (2:40)
    'music/115.mp3': 185,  // Paz (by Morad & NICKI NICOLE) (3:05)
    'music/116.mp3': 174,  // Mi Barrio (2:54)
    'music/117.mp3': 203,  // No Estuviste En Lo Malo (3:23)
    'music/118.mp3': 202,  // Andando (by Morad, Eladio Carrión & Beny Jr) (3:22)
    'music/119.mp3': 178,  // Soledad (2:58)
    'music/120.mp3': 185,  // Estopa (3:05)
    'music/121.mp3': 183,  // Niños Pequeños (3:03)
    'music/122.mp3': 207,  // María (Ft. Ninho) (3:27)
    'music/123.mp3': 174,  // Poporopa (2:54)
    'music/124.mp3': 173,  // Se Grita (Ft. JuL) (2:53)
    'music/125.mp3': 177,  // Por Los Míos (2:57)
    'music/126.mp3': 190,  // Ojos Sin Ver (by Morad & ElGrandeToto) (3:10)
    'music/127.mp3': 175,  // Desespero (by Morad & Rvfv) (2:55)
    'music/128.mp3': 195,  // Problemas (3:15)
    'music/129.mp3': 174,  // Walou Bla Bla (2:54)
    'music/130.mp3': 180,  // Un Amigo Me Falló (3:00)
    'music/131.mp3': 185,  // Tiempo de Nada (3:05)
    'music/132.mp3': 180,  // Caballero (3:00)

    // in piazza ci muori 
    'music/133.mp3': 207, // Napoletano - 3:27
    'music/134.mp3': 185, // Piazza di spaccio 2 (Ft. Simba La Rue) - 3:05
    'music/135.mp3': 174, // Fuori Milano - 2:54
    'music/136.mp3': 190, // Regole del blocco (Ft. Sacky) - 3:10
    'music/137.mp3': 202, // Gomorra (Ft. Artie 5ive) - 3:22
    'music/138.mp3': 169, // Gucci bag - 2:49
    'music/139.mp3': 213, // Gangsta life (Ft. Fre_nky & MadPrince (ITA)) - 3:33
    'music/140.mp3': 201, // Piove (Ft. Neima Ezza) - 3:21
    'music/141.mp3': 196, // Sotto indagine (Ft. Savage 167) - 3:16
    'music/142.mp3': 225, // L’ultima notte - 3:45

    //fsk trapshit revenge 
   'music/143.mp3': 225,  // BLA BLA - 3:45
  'music/144.mp3': 192,  // ANSIA NO - 3:12
  'music/145.mp3': 198,  // CAMOSCIO - 3:18
  'music/146.mp3': 209,  // CAPI DELLA TRAP (Ft. Guè) - 3:29
  'music/147.mp3': 185,  // NON FARCELO FARE - 3:05
  'music/148.mp3': 176,  // FRAGOLA EROINA - 2:56
  'music/149.mp3': 215,  // PIÙ DI UN KILO - 3:35
  'music/150.mp3': 172,  // UP - 2:52
  'music/151.mp3': 202,  // NO SPIE - 3:22
  'music/152.mp3': 189,  // CATENE JESUS - 3:09
  'music/153.mp3': 207,  // 4L (Ft. Rosa Chemical) - 3:27
  'music/154.mp3': 191,  // OK NO PLAY - 3:11
  'music/155.mp3': 223,  // LA PROVA DEL CUOCO - 3:43
  'music/156.mp3': 195,  // MELISSA P - 3:15
  'music/157.mp3': 169,  // NON E' MIA - 2:49
  'music/158.mp3': 200,  // CANOTTIERA WHITE - 3:20
  'music/159.mp3': 190,  // ABBIAMO - 3:10
  'music/160.mp3': 213,  // PICKUP (Ft. DAYTONA KK) - 3:33

  //milano demons
   'music/161.mp3': 199,  // Milano Demons - 3:19
  'music/162.mp3': 171,  // Cup - 2:51
  'music/163.mp3': 188,  // Vorrei (Ft. Lazza) - 3:08
  'music/164.mp3': 158,  // Take 4 - 2:38
  'music/165.mp3': 209,  // Rollie AP (Ft. Pyrex & Slings) - 3:29
  'music/166.mp3': 185,  // Cellphone (Ft. Bianca Costa & Rhove) - 3:05
  'music/167.mp3': 187,  // Diamante - 3:07
  'music/168.mp3': 195,  // Non è Easy - 3:15
  'music/169.mp3': 75,   // Messaggio in Segreteria (interlude) - 1:15
  'music/170.mp3': 211,  // Cicatrici (Ft. Tedua) - 3:31
  'music/171.mp3': 185,  // Non lo Sai - 3:05
  'music/172.mp3': 182,  // Naturale - 3:02
  'music/173.mp3': 192,  // Alleluia (Ft. Sfera Ebbasta) - 3:12
  'music/174.mp3': 206,  // Soldi Puliti - 3:26
  'music/175.mp3': 187,  // Dimenticare (Ft. Federica Abbate) - 3:07
  'music/176.mp3': 189,  // Un Altro Show (Ft. Geolier) - 3:09
  'music/177.mp3': 194,  // Se Fosse Per Me - 3:14
  'music/178.mp3': 116,  // 3 Stick Freestyle - 1:56

  //sfera ebbasta 
    'music/179.mp3': 199, // Equilibrio - 3:19
  'music/180.mp3': 187, // Figli Di Papà - 3:07
  'music/181.mp3': 205, // Balenciaga (Ft. SCH) - 3:25
  'music/182.mp3': 216, // Notti - 3:36
  'music/183.mp3': 198, // Visiera A Becco - 3:18
  'music/184.mp3': 196, // No No - 3:16
  'music/185.mp3': 196, // BRNBQ - 3:16
  'music/186.mp3': 191, // Bang Bang - 3:11
  'music/187.mp3': 202, // Quello Che Non Va - 3:22
  'music/188.mp3': 220, // Cartine Cartier by SCH (Ft. Sfera Ebbasta) - 3:40
  'music/189.mp3': 190, // BHMG - 3:10

  //salvatore vive
  'music/190.mp3': 177, // Salvatore vive - Paky - 2:57
  'music/191.mp3': 135, // Belen - Paky - 2:15
  'music/192.mp3': 125, // Sharm El Sheikh - Paky - 2:05
  'music/193.mp3': 194, // La Bellavita (Ft. JuL) - Paky - 3:14
  'music/194.mp3': 192, // Onore e rispetto - Paky - 3:12
  'music/195.mp3': 170, // Intro - Paky - 2:50
  'music/196.mp3': 124, // 100 Uomini - Paky - 2:04
  'music/197.mp3': 175, // Blauer - Paky - 2:55
  'music/198.mp3': 122, // No wallet (Ft. Marracash) - Paky - 2:02
  'music/199.mp3': 122, // Pascià - Paky - 2:02
  'music/200.mp3': 159, // Auto tedesca - Paky - 2:39
  'music/201.mp3': 181, // Star (Ft. Shiva) - Paky - 3:01
  'music/202.mp3': 213, // Salvatore - Paky - 3:33
  'music/203.mp3': 164, // Quando piove - Paky - 2:44
  'music/204.mp3': 184, // Vivi o muori (Ft. Guè) - Paky - 3:04
  'music/205.mp3': 193, // Vita sbagliata - Paky - 3:13
  'music/206.mp3': 189, // Comandamento (Ft. Geolier) - Paky - 3:09
  'music/207.mp3': 170, // Giorno del giudizio (Ft. Luchè & Mahmood) - Paky - 2:50
  'music/208.mp3': 186, // Mi manchi - Paky - 3:06
  'music/209.mp3': 167, // Storie tristi - Paky - 2:47
  'music/210.mp3': 170, // Mama I’m a Criminal - Paky - 2:50
  'music/211.mp3': 104  // Bronx - Paky - 1:44
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
                    const srcs = listenNowButton.getAttribute('data-src')?.split(',') || [];
                    songs.forEach((song, index) => {
                        if (song.toLowerCase().includes(searchTerm)) {
                            results.push({
                                type: 'song',
                                element: album,
                                title: song,
                                artist: artist,
                                cover: album.querySelector('img').src,
                                albumTitle: title,
                                songIndex: index,
                                src: srcs[index] ? srcs[index].trim() : undefined
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
            const searchBar = document.getElementById('search-bar');

            if (result.type === 'album') {
                listenNowButton.click();
            } else {
                // Trova l'oggetto canzone completo da allSongsData usando result.src
                const songObjectToPlay = allSongsData.find(songObj => songObj.src === result.src);
                if (songObjectToPlay) {
                    setCurrentAlbumContextFromSong(songObjectToPlay);
                    currentSongIndex = allSongsData.indexOf(songObjectToPlay);
                    playSong(songObjectToPlay);
                }
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

// Costruzione di allSongsData all'avvio
allSongsData = [];
document.querySelectorAll('.album-card').forEach(albumCard => {
    const listenNowButton = albumCard.querySelector('.listen-now');
    if (!listenNowButton) return;
    const srcs = listenNowButton.getAttribute('data-src').split(',');
    const names = listenNowButton.getAttribute('data-names').split(',');
    const albumName = albumCard.querySelector('h3').textContent;
    const artist = albumCard.getAttribute('data-artist');
    const cover = albumCard.querySelector('img').src;
    srcs.forEach((src, idx) => {
        allSongsData.push({
            src: src.trim(),
            name: names[idx] ? names[idx].trim() : '',
            albumName,
            artist,
            cover
        });
    });
});

// Funzione per trovare l'indice di una canzone in un album
function getSongIndexInAlbum(songSrc, albumSongs) {
    return albumSongs.findIndex(src => src === songSrc);
}

// Funzione per aggiornare il contesto album corrente in base a una canzone globale
function setCurrentAlbumContextFromSong(songData) {
    if (!songData) return;
    const albumCards = document.querySelectorAll('.album-card');
    const albumCard = albumCards[songData.originalAlbumIndex];
    if (!albumCard) return;
    const listenNowButton = albumCard.querySelector('.listen-now');
    if (!listenNowButton) return;
    currentAlbumSongs = listenNowButton.getAttribute('data-src').split(',');
    currentAlbumNames = listenNowButton.getAttribute('data-names').split(',');
    currentAlbumCoverSrc = albumCard.querySelector('img').src;
    currentSongIndex = songData.originalSongIndexInAlbum;
}
