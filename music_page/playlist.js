"use strict";

// --- DATI GLOBALI E CONFIGURAZIONE (DA RECUPERARE DA LOCALSTORAGE) ---

// Recupera tutte le canzoni disponibili dal localStorage (salvate dalla pagina 'Scopri')
// Questo array conterrà già tutti i metadati e la durata per ogni canzone.
const ALL_AVAILABLE_SONGS = JSON.parse(localStorage.getItem('allSongsDataStore')) || [];

// Se hai bisogno di una mappa trackDurations anche qui (meno probabile ora),
// puoi ricrearla dinamicamente. Altrimenti, puoi accedere direttamente a song.duration.
const trackDurations = {};
ALL_AVAILABLE_SONGS.forEach(song => {
    trackDurations[song.src] = song.duration;
});

// --- PLAYER LOGIC PRESO DA scopri.js E ADATTATO PER PLAYLIST ---

// Variabili di stato globali
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let currentSongIndex = 0;
let myPlaylist = JSON.parse(localStorage.getItem('myPlaylist')) || [];
let currentPlaylist = myPlaylist.length > 0 ? [...myPlaylist] : [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let shuffleHistory = [];
const MAX_SHUFFLE_HISTORY = 20;

// Elementi del DOM (adattati per playlist.html)
const playPauseButton = document.getElementById('play-pause');
const prevSongButton = document.getElementById('prev-song');
const nextSongButton = document.getElementById('next-song');
const shuffleButton = document.getElementById('shuffle');
const loopButton = document.getElementById('loop');
const progressBar = document.getElementById('progress-bar');
// progressContainer non esiste, usiamo direttamente progressBar come input range
const volumeControl = document.getElementById('volume-control');
// volumeIcon non esiste, lo rimuoviamo
const currentSong = document.getElementById('current-song');
const currentArtist = document.getElementById('current-artist');
const currentAlbumCover = document.getElementById('current-album-cover');
const currentTime = document.getElementById('current-time');
const totalDuration = document.getElementById('total-duration');
const likeButton = document.getElementById('like-button');
const audioPlayer = document.getElementById('audio-player');

// Elementi aggiuntivi per la gestione della playlist
const likedSongsContainer = document.getElementById('favorite-songs-list');
const myPlaylistSongsContainer = document.getElementById('user-playlist-list');
const addSongToMyPlaylistBtn = document.getElementById('open-overlay-btn');
const addSongSearchOverlay = document.getElementById('add-songs-overlay');
const closeSearchOverlay = document.getElementById('close-overlay-btn');
const searchInput = document.getElementById('overlay-search-bar');
const overlaySongsGrid = document.getElementById('overlay-songs-grid');
const playPlaylistBtn = document.getElementById('play-playlist-btn');

// Protezione: mostra errore chiaro se un elemento non esiste
function checkDomElement(el, name) {
    if (!el) {
        console.error(`Elemento DOM mancante: ${name}`);
    }
}

checkDomElement(playPauseButton, 'play-pause');
checkDomElement(prevSongButton, 'prev-song');
checkDomElement(nextSongButton, 'next-song');
checkDomElement(shuffleButton, 'shuffle');
checkDomElement(loopButton, 'loop');
checkDomElement(progressBar, 'progress-bar');
checkDomElement(volumeControl, 'volume-control');
checkDomElement(currentSong, 'current-song');
checkDomElement(currentArtist, 'current-artist');
checkDomElement(currentAlbumCover, 'current-album-cover');
checkDomElement(currentTime, 'current-time');
checkDomElement(totalDuration, 'total-duration');
checkDomElement(likeButton, 'like-button');
checkDomElement(audioPlayer, 'audio-player');
checkDomElement(playPlaylistBtn, 'play-playlist-btn');

// Funzione per aggiornare il cuoricino
function updateLikeButton() {
    const currentSongSrc = audioPlayer.src;
    const isLiked = likedSongs.some(song => song.src === currentSongSrc);
    likeButton.classList.toggle('active', isLiked);
}

// Funzione per salvare i preferiti nel localStorage
function saveFavorites() {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
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
function playSong(song, index) {
    if (!song) return;
    audioPlayer.src = song.src;
    currentSongIndex = index;
    currentSong.textContent = song.name;
    currentArtist.textContent = song.artist;
    currentAlbumCover.src = song.cover;
    audioPlayer.play().then(() => {
        isPlaying = true;
        playPauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
        if (isShuffle) {
            shuffleHistory.push(song.src);
            if (shuffleHistory.length > MAX_SHUFFLE_HISTORY) shuffleHistory.shift();
        }
        updateLikeButton();
    }).catch(() => {
        isPlaying = false;
        playPauseButton.innerHTML = '<i class="bi bi-play-fill"></i>';
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
});

// Listener per il pulsante "Precedente"
prevSongButton.addEventListener('click', function () {
    if (isShuffle) {
        if (shuffleHistory.length > 1) {
            shuffleHistory.pop();
            const prevSrc = shuffleHistory.pop();
            const songObj = currentPlaylist.find(song => song.src === prevSrc);
            if (songObj) playSong(songObj, currentPlaylist.indexOf(songObj));
        }
        return;
    }
    if (currentSongIndex > 0) {
        playSong(currentPlaylist[currentSongIndex - 1], currentSongIndex - 1);
    }
});

// Listener per il pulsante "Successivo"
nextSongButton.addEventListener('click', function () {
    if (isShuffle) {
        let nextIdx;
        do {
            nextIdx = Math.floor(Math.random() * currentPlaylist.length);
        } while (currentPlaylist.length > 1 && currentPlaylist[nextIdx].src === audioPlayer.src);
        playSong(currentPlaylist[nextIdx], nextIdx);
    } else if (currentSongIndex < currentPlaylist.length - 1) {
        playSong(currentPlaylist[currentSongIndex + 1], currentSongIndex + 1);
    } else if (isLoop) {
        playSong(currentPlaylist[0], 0);
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

// Aggiorna lo stato visivo dei pulsanti loop/shuffle
function updateShuffleLoopButtons() {
    loopButton.classList.toggle('active', isLoop);
    shuffleButton.classList.toggle('active', isShuffle);
}

// Listener per il pulsante loop
loopButton.addEventListener('click', function () {
    isLoop = !isLoop;
    if (isLoop) {
        isShuffle = false;
        shuffleButton.classList.remove('active');
    }
    loopButton.classList.toggle('active', isLoop);
    updateShuffleLoopButtons();
});

// Listener per il pulsante shuffle
shuffleButton.addEventListener('click', function () {
    isShuffle = !isShuffle;
    if (isShuffle) {
        isLoop = false;
        loopButton.classList.remove('active');
    }
    shuffleButton.classList.toggle('active', isShuffle);
    updateShuffleLoopButtons();
});

// Modifica il listener per la fine della canzone
 audioPlayer.addEventListener('ended', function () {
    if (isLoop) {
        playSong(currentPlaylist[currentSongIndex], currentSongIndex);
    } else if (isShuffle) {
        let nextIdx;
        do {
            nextIdx = Math.floor(Math.random() * currentPlaylist.length);
        } while (currentPlaylist.length > 1 && currentPlaylist[nextIdx].src === audioPlayer.src);
        playSong(currentPlaylist[nextIdx], nextIdx);
    } else if (currentSongIndex < currentPlaylist.length - 1) {
        playSong(currentPlaylist[currentSongIndex + 1], currentSongIndex + 1);
    }
});

// Aggiorna il cuoricino all'avvio
updateLikeButton();

// --- GESTIONE PLAYLIST E LOCALSTORAGE ---

function saveLikedSongs() {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
}

function saveMyPlaylist() {
    localStorage.setItem('myPlaylist', JSON.stringify(myPlaylist));
}

function addSongToLiked(songData) {
    if (!songData) return; // Protezione
    if (!likedSongs.some(song => song.src === songData.src)) {
        likedSongs.push(songData);
        saveLikedSongs();
        renderLikedSongs();
        showToast(`"${songData.name}" aggiunto ai preferiti!`);
        updateLikedButtonState(songData);
    } else {
        removeSongFromLiked(songData.src); // Se cliccato di nuovo, rimuovi
    }
}

function removeSongFromLiked(songSrc) {
    likedSongs = likedSongs.filter(song => song.src !== songSrc);
    saveLikedSongs();
    renderLikedSongs();
    showToast('Brano rimosso dai preferiti.');
    if (audioPlayer.src.endsWith(songSrc)) { // Se la canzone rimossa è quella in riproduzione
        updateLikedButtonState(null); // Deseleziona il cuore
    }
}

function addSongToMyPlaylist(songData) {
    if (!songData) return; // Protezione
    if (!myPlaylist.some(song => song.src === songData.src)) {
        myPlaylist.push(songData);
        saveMyPlaylist();
        renderMyPlaylist();
        showToast(`"${songData.name}" aggiunto alla tua playlist!`);
    } else {
        showToast(`"${songData.name}" è già nella tua playlist.`);
    }
}

function removeSongFromMyPlaylist(songSrc) {
    const initialLength = myPlaylist.length;
    myPlaylist = myPlaylist.filter(song => song.src !== songSrc);
    if (myPlaylist.length < initialLength) {
        saveMyPlaylist();
        renderMyPlaylist();
        showToast('Brano rimosso dalla tua playlist.');
        // Se la canzone in riproduzione era in questa playlist e viene rimossa
        if (currentPlaylist === myPlaylist && audio.src.endsWith(songSrc)) {
            // Potresti voler fermare la riproduzione o passare alla successiva
            // Per ora, solo un messaggio
            console.log("Canzone in riproduzione rimossa dalla playlist.");
        }
    }
}

function updateLikedButtonState(song) {
    if (song && likedSongs.some(liked => liked.src === song.src)) {
        likeButton.classList.add('active');
    } else {
        likeButton.classList.remove('active');
    }
}

function highlightCurrentSongInPlaylist() {
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('playing');
    });
    if (currentPlaylist.length > 0 && currentSongIndex !== -1) {
        const playingSongSrc = currentPlaylist[currentSongIndex].src;
        const currentItem = document.querySelector(`.playlist-item[data-src="${playingSongSrc}"]`);
        if (currentItem) {
            currentItem.classList.add('playing');
        }
    }
}

// --- RENDERING DELLE PLAYLIST NELLA PAGINA ---

function renderLikedSongs() {
    likedSongsContainer.innerHTML = '';
    if (likedSongs.length === 0) {
        likedSongsContainer.innerHTML = `
            <li class="table-header">
                <span>Titolo</span>
                <span>Artista</span>
                <span class="actions-header">Azioni</span>
            </li>
            <p class="empty-list-message">Nessun brano aggiunto ai preferiti. Clicca ❤️ su un brano per aggiungerlo!</p>
        `;
        return;
    }

    // Aggiungi header della tabella
    const headerRow = document.createElement('li');
    headerRow.className = 'table-header';
    headerRow.innerHTML = `
        <span>Titolo</span>
        <span>Artista</span>
        <span class="actions-header">Azioni</span>
    `;
    likedSongsContainer.appendChild(headerRow);

    likedSongs.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('playlist-item');
        li.dataset.src = song.src;

        const durationText = formatDuration(song.duration);

        li.innerHTML = `
            <img src="${song.cover}" alt="Cover" class="playlist-item-cover">
            <div class="playlist-item-info">
                <span class="playlist-item-name">${song.name}</span>
                <span class="playlist-item-artist">${song.artist || 'Artista Sconosciuto'}</span>
            </div>
            <span class="playlist-item-duration">${durationText}</span>
            <div class="playlist-item-actions">
                <button class="playlist-action-btn play-btn" title="Riproduci"><i class="bi bi-play-fill"></i></button>
                <button class="playlist-action-btn add-to-playlist-btn" title="Aggiungi alla playlist"><i class="bi bi-plus-circle"></i></button>
                <button class="playlist-action-btn remove-btn" title="Rimuovi dai preferiti"><i class="bi bi-trash"></i></button>
            </div>
        `;

        // Listener per riprodurre la canzone
        li.querySelector('.play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            currentPlaylist = [...likedSongs];
            const songIndex = currentPlaylist.findIndex(s => s.src === song.src);
            if (songIndex !== -1) {
                playSong(song, songIndex);
            }
        });

        // Listener per rimuovere dai preferiti
        li.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeSongFromLiked(song.src);
        });

        // Listener per aggiungere alla playlist
        li.querySelector('.add-to-playlist-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const songToAdd = ALL_AVAILABLE_SONGS.find(s => s.src === song.src);
            if (songToAdd) {
                addSongToMyPlaylist(songToAdd);
            }
        });

        likedSongsContainer.appendChild(li);
    });
    highlightCurrentSongInPlaylist();
}

function renderMyPlaylist() {
    myPlaylistSongsContainer.innerHTML = '';
    if (myPlaylist.length === 0) {
        myPlaylistSongsContainer.innerHTML = '<p class="empty-list-message">La tua playlist è vuota. Clicca su "Aggiungi canzoni" per iniziare!</p>';
        return;
    }

    myPlaylist.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('playlist-item');
        li.dataset.src = song.src;
        li.draggable = true; // Per drag and drop

        const durationText = formatDuration(song.duration);

        li.innerHTML = `
            <img src="${song.cover}" alt="Cover" class="playlist-item-cover">
            <div class="playlist-item-info">
                <span class="playlist-item-name">${song.name}</span>
                <span class="playlist-item-artist">${song.artist || 'Artista Sconosciuto'}</span>
            </div>
            <span class="playlist-item-duration">${durationText}</span>
            <button class="remove-from-myplaylist" data-src="${song.src}"><i class="bi bi-trash-fill"></i></button>
        `;

        li.querySelector('.playlist-item-info').addEventListener('click', () => {
            currentPlaylist = [...myPlaylist]; // Imposta la playlist corrente sulla mia playlist
            const songIndex = currentPlaylist.findIndex(s => s.src === song.src);
            if (songIndex !== -1) {
                playSong(song, songIndex);
            }
        });

        li.querySelector('.remove-from-myplaylist').addEventListener('click', (e) => {
            e.stopPropagation();
            removeSongFromMyPlaylist(song.src);
        });

        myPlaylistSongsContainer.appendChild(li);
    });
    addDragAndDropListeners();
    highlightCurrentSongInPlaylist();
}


// --- FUNZIONI DI RICERCA E AGGIUNTA CANZONI ---

function openAddSongSearch() {
    addSongSearchOverlay.classList.add('active');
    searchInput.value = ''; // Pulisci il campo di ricerca
    displaySearchResults(''); // Mostra tutti i brani inizialmente
    searchInput.focus();
}

function closeAddSongSearch() {
    addSongSearchOverlay.classList.remove('active');
}

function displaySearchResults(query) {
    overlaySongsGrid.innerHTML = '';
    const lowerCaseQuery = query.toLowerCase();

    // Filtra ALL_AVAILABLE_SONGS (che viene dal localStorage)
    const filteredSongs = ALL_AVAILABLE_SONGS.filter(song =>
        song.name.toLowerCase().includes(lowerCaseQuery) ||
        song.artist.toLowerCase().includes(lowerCaseQuery) ||
        song.albumName.toLowerCase().includes(lowerCaseQuery)
    );

    if (filteredSongs.length === 0) {
        overlaySongsGrid.innerHTML = '<p class="empty-list-message">Nessun brano trovato.</p>';
        return;
    }

    filteredSongs.forEach(song => {
        const songCard = document.createElement('div');
        songCard.classList.add('overlay-song-card');
        
        // Controlla se la canzone è già nella playlist
        const isInPlaylist = myPlaylist.some(s => s.src === song.src);
        
        songCard.innerHTML = `
            <img src="${song.cover}" alt="Cover" class="overlay-song-cover">
            <div class="overlay-song-info">
                <div class="overlay-song-title">${song.name}</div>
                <div class="overlay-song-artist">${song.artist} - ${song.albumName}</div>
            </div>
            <button class="overlay-add-btn" ${isInPlaylist ? 'disabled' : ''}>
                <i class="bi bi-${isInPlaylist ? 'check' : 'plus'}"></i> 
                ${isInPlaylist ? 'Aggiunta' : 'Aggiungi'}
            </button>
        `;
        
        // Listener per aggiungere alla playlist
        const addBtn = songCard.querySelector('.overlay-add-btn');
        if (!isInPlaylist) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addSongToMyPlaylist(song);
                // Aggiorna il bottone
                addBtn.disabled = true;
                addBtn.innerHTML = '<i class="bi bi-check"></i> Aggiunta';
                showToast(`"${song.name}" aggiunta alla playlist!`);
            });
        }
          overlaySongsGrid.appendChild(songCard);
    });
}

// --- DRAG AND DROP PER LA MIA PLAYLIST ---

let draggedItem = null;

function addDragAndDropListeners() {
    const items = myPlaylistSongsContainer.querySelectorAll('.playlist-item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedItem = e.target.closest('.playlist-item');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetItem = e.target.closest('.playlist-item');
    if (targetItem && targetItem !== draggedItem) {
        targetItem.style.borderTop = '2px solid #007acc';
    }
}

function handleDragLeave() {
    this.classList.remove('drag-before', 'drag-after');
}

function handleDrop(e) {
    e.stopPropagation();
    if (draggedItem !== this) {
        const draggedSrc = draggedItem.dataset.src;
        const targetSrc = this.dataset.src;

        const draggedIndex = myPlaylist.findIndex(song => song.src === draggedSrc);
        const targetIndex = myPlaylist.findIndex(song => song.src === targetSrc);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = myPlaylist.splice(draggedIndex, 1);
        let insertIndex = targetIndex;
        if (this.classList.contains('drag-after')) {
            insertIndex++;
        }
        myPlaylist.splice(insertIndex, 0, removed);

        saveMyPlaylist();
        renderMyPlaylist(); // Re-render per aggiornare il DOM
        showToast("Canzone riordinata!");
    }
    this.classList.remove('drag-before', 'drag-after');
}

function handleDragEnd() {
    this.classList.remove('dragging');
    myPlaylistSongsContainer.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('drag-before', 'drag-after');
    });
    draggedItem = null;
}


// --- INIZIALIZZAZIONE ---

document.addEventListener('DOMContentLoaded', () => {
    // Controlla se tutti gli elementi DOM esistono
    if (!likedSongsContainer || !myPlaylistSongsContainer) {
        console.error('Elementi DOM mancanti per le playlist');
        return;
    }

    // Controlla se le canzoni sono disponibili
    if (ALL_AVAILABLE_SONGS.length === 0) {
        console.warn('Nessuna canzone disponibile. Assicurati di aver visitato la pagina Scopri prima.');
        showToast('Visita la pagina "Scopri" per caricare le canzoni disponibili.');
    }

    // Inizializza il rendering delle playlist all'avvio
    renderLikedSongs();
    renderMyPlaylist();    // Event listeners per la funzionalità di ricerca e aggiunta
    if (addSongToMyPlaylistBtn) {
        addSongToMyPlaylistBtn.addEventListener('click', openAddSongSearch);
    }
    if (closeSearchOverlay) {
        closeSearchOverlay.addEventListener('click', closeAddSongSearch);
    }    if (searchInput) {
        searchInput.addEventListener('input', (e) => displaySearchResults(e.target.value));
    }

    // Quando l'overlay di ricerca si apre, mostra subito tutti i brani
    if (addSongSearchOverlay) {
        addSongSearchOverlay.addEventListener('transitionend', () => {
            if (addSongSearchOverlay.classList.contains('active')) {
                displaySearchResults('');
            }
        });
    }

    // Aggiorna il cuoricino all'avvio
    updateLikeButton();
      // Event listener per il pulsante Play Playlist
    if (playPlaylistBtn) {
        console.log('Play Playlist button found, adding event listener');
        playPlaylistBtn.addEventListener('click', () => {
            console.log('Play Playlist button clicked');
            console.log('MyPlaylist length:', myPlaylist.length);
            if (myPlaylist.length > 0) {
                // Imposta la playlist corrente sulla mia playlist
                currentPlaylist = [...myPlaylist];
                currentSongIndex = 0;
                // Inizia a riprodurre la prima canzone della playlist
                console.log('Playing first song:', myPlaylist[0]);
                playSong(myPlaylist[0], 0);
                showToast('Riproduzione playlist avviata!');
            } else {
                console.log('Playlist is empty');
                showToast('La playlist è vuota. Aggiungi delle canzoni per iniziare!');
            }
        });
    } else {
        console.error('Play Playlist button not found!');
    }

    console.log('Playlist page initialized successfully');
    console.log('Available songs:', ALL_AVAILABLE_SONGS.length);
});

// Funzioni di utility
function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.opacity = '1', 100);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}