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

// Variabili di stato globali per il player
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let currentSongIndex = 0;
let currentPlaylist = []; // Array di oggetti canzone che rappresenta la playlist attualmente in riproduzione
let shuffleHistory = [];
const MAX_SHUFFLE_HISTORY = 20;

// Variabili per gestire le playlist in localStorage
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let myPlaylist = JSON.parse(localStorage.getItem('myPlaylist')) || [];


// --- ELEMENTI DEL DOM ---
const audio = new Audio();
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const loopBtn = document.getElementById('loop-btn');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const currentSongName = document.getElementById('current-song-name');
const currentArtistName = document.getElementById('current-artist-name');
const currentAlbumCover = document.getElementById('current-album-cover');
const volumeControl = document.getElementById('volume-control');
const volumeIcon = document.getElementById('volume-icon');

const likedSongsContainer = document.getElementById('liked-songs-list');
const myPlaylistSongsContainer = document.getElementById('my-playlist-songs-list');
const addSongToMyPlaylistBtn = document.getElementById('add-song-to-my-playlist-btn');
const addSongSearchOverlay = document.getElementById('add-song-search-overlay');
const closeSearchOverlay = document.getElementById('close-search-overlay');
const searchInput = document.getElementById('search-input');
const searchSongsList = document.getElementById('search-songs-list');
const addToLikedBtn = document.getElementById('add-to-liked-btn'); // Bottone cuore per i preferiti nel player

// --- FUNZIONI DI UTILITY ---

function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast-message');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100); // Piccolo ritardo per l'animazione

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 3000);
}


// --- FUNZIONI DEL PLAYER AUDIO ---

function playSong(song, index) {
    audio.src = song.src;
    currentSongIndex = index;
    currentPlaylist = currentPlaylist || []; // Assicurati che currentPlaylist non sia null
    currentSongName.textContent = song.name;
    currentArtistName.textContent = song.artist;
    currentAlbumCover.src = song.cover;
    audio.play();
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';

    highlightCurrentSongInPlaylist();
    updateLikedButtonState(song); // Aggiorna lo stato del cuore
}

function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    } else {
        audio.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    }
    isPlaying = !isPlaying;
}

function playNextSong() {
    if (currentPlaylist.length === 0) {
        console.warn("Nessuna canzone nella playlist corrente.");
        return;
    }

    if (isLoop) {
        playSong(currentPlaylist[currentSongIndex], currentSongIndex);
        return;
    }

    if (isShuffle) {
        playRandomSong();
        return;
    }

    currentSongIndex++;
    if (currentSongIndex >= currentPlaylist.length) {
        currentSongIndex = 0; // Torna all'inizio della playlist
    }
    playSong(currentPlaylist[currentSongIndex], currentSongIndex);
}

function playPrevSong() {
    if (currentPlaylist.length === 0) {
        console.warn("Nessuna canzone nella playlist corrente.");
        return;
    }

    if (isShuffle && shuffleHistory.length > 1) {
        shuffleHistory.pop(); // Rimuove la canzone corrente
        const prevSongData = shuffleHistory.pop(); // Ottiene la canzone precedente dalla storia
        currentSongIndex = currentPlaylist.findIndex(s => s.src === prevSongData.src);
        if (currentSongIndex === -1) {
             currentSongIndex = 0; // Fallback se non trovata (dovrebbe essere rara)
        }
        playSong(currentPlaylist[currentSongIndex], currentSongIndex);
    } else {
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = currentPlaylist.length - 1; // Torna alla fine della playlist
        }
        playSong(currentPlaylist[currentSongIndex], currentSongIndex);
    }
}


function playRandomSong() {
    if (currentPlaylist.length === 0) return;

    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * currentPlaylist.length);
    } while (newIndex === currentSongIndex && currentPlaylist.length > 1);

    // Gestione della cronologia per shuffle
    if (shuffleHistory.length >= MAX_SHUFFLE_HISTORY) {
        shuffleHistory.shift(); // Rimuove l'elemento più vecchio
    }
    shuffleHistory.push(currentPlaylist[currentSongIndex]); // Aggiunge la canzone corrente alla history

    playSong(currentPlaylist[newIndex], newIndex);
}


function updateProgressBar() {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeDisplay.textContent = formatDuration(audio.currentTime);
}

function setProgressBar(e) {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
    showToast(`Shuffle ${isShuffle ? 'attivato' : 'disattivato'}`);
    if (isShuffle) {
        shuffleHistory = []; // Resetta la storia quando si attiva lo shuffle
    }
}

function toggleLoop() {
    isLoop = !isLoop;
    loopBtn.classList.toggle('active', isLoop);
    showToast(`Loop ${isLoop ? 'attivato' : 'disattivato'}`);
}

function setVolume() {
    audio.volume = volumeControl.value;
    updateVolumeIcon();
}

function updateVolumeIcon() {
    const volume = audio.volume;
    if (volume === 0) {
        volumeIcon.className = 'bi bi-volume-mute-fill';
    } else if (volume < 0.5) {
        volumeIcon.className = 'bi bi-volume-down-fill';
    } else {
        volumeIcon.className = 'bi bi-volume-up-fill';
    }
}

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
    if (audio.src.endsWith(songSrc)) { // Se la canzone rimossa è quella in riproduzione
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
        addToLikedBtn.classList.add('active');
    } else {
        addToLikedBtn.classList.remove('active');
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
        likedSongsContainer.innerHTML = '<p class="empty-list-message">Nessun brano aggiunto ai preferiti. Clicca ❤️ su un brano per aggiungerlo!</p>';
        return;
    }

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
            <button class="remove-from-liked" data-src="${song.src}"><i class="bi bi-trash-fill"></i></button>
            <button class="add-to-myplaylist" data-src="${song.src}"><i class="bi bi-plus-circle-fill"></i></button>
        `;

        li.querySelector('.playlist-item-info').addEventListener('click', () => {
            currentPlaylist = [...likedSongs]; // Imposta la playlist corrente sui liked songs
            const songIndex = currentPlaylist.findIndex(s => s.src === song.src);
            if (songIndex !== -1) {
                playSong(song, songIndex);
            }
        });

        li.querySelector('.remove-from-liked').addEventListener('click', (e) => {
            e.stopPropagation();
            removeSongFromLiked(song.src);
        });

        li.querySelector('.add-to-myplaylist').addEventListener('click', (e) => {
            e.stopPropagation();
            // Trova l'oggetto canzone completo da ALL_AVAILABLE_SONGS prima di aggiungerlo
            const songToAdd = ALL_AVAILABLE_SONGS.find(s => s.src === song.src);
            if (songToAdd) {
                addSongToMyPlaylist(songToAdd);
            } else {
                console.error("Canzone non trovata in ALL_AVAILABLE_SONGS:", song.src);
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
    searchSongsList.innerHTML = '';
    const lowerCaseQuery = query.toLowerCase();

    // Filtra ALL_AVAILABLE_SONGS (che viene dal localStorage)
    const filteredSongs = ALL_AVAILABLE_SONGS.filter(song =>
        song.name.toLowerCase().includes(lowerCaseQuery) ||
        song.artist.toLowerCase().includes(lowerCaseQuery) ||
        song.albumName.toLowerCase().includes(lowerCaseQuery)
    );

    if (filteredSongs.length === 0) {
        searchSongsList.innerHTML = '<p class="empty-list-message">Nessun brano trovato.</p>';
        return;
    }

    filteredSongs.forEach(song => {
        const li = document.createElement('li');
        li.classList.add('search-result-item');
        li.innerHTML = `
            <img src="${song.cover}" alt="Cover" class="search-result-cover">
            <div class="search-result-info">
                <span class="search-result-name">${song.name}</span>
                <span class="search-result-artist">${song.artist} - ${song.albumName}</span>
            </div>
            <button class="add-to-myplaylist-search" data-src="${song.src}"><i class="bi bi-plus-circle-fill"></i></button>
        `;
        // Quando aggiungi da qui, devi passare l'oggetto canzone completo
        li.querySelector('.add-to-myplaylist-search').addEventListener('click', (e) => {
            e.stopPropagation();
            addSongToMyPlaylist(song); // Passa l'intero oggetto song
        });
        searchSongsList.appendChild(li);
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
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault(); // Necessario per permettere il drop
    e.dataTransfer.dropEffect = 'move';
    const targetItem = this;
    if (draggedItem !== targetItem) {
        const targetRect = targetItem.getBoundingClientRect();
        const mouseY = e.clientY;
        const middleY = targetRect.top + targetRect.height / 2;

        if (mouseY < middleY) {
            targetItem.classList.remove('drag-after');
            targetItem.classList.add('drag-before');
        } else {
            targetItem.classList.remove('drag-before');
            targetItem.classList.add('drag-after');
        }
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
    // Inizializza il rendering delle playlist all'avvio
    renderLikedSongs();
    renderMyPlaylist();

    // Event listeners per i controlli del player
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', playPrevSong);
    nextBtn.addEventListener('click', playNextSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    loopBtn.addEventListener('click', toggleLoop);
    progressContainer.addEventListener('click', setProgressBar);
    audio.addEventListener('timeupdate', updateProgressBar);
    audio.addEventListener('ended', playNextSong);
    audio.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatDuration(audio.duration);
    });
    volumeControl.addEventListener('input', setVolume);
    volumeIcon.addEventListener('click', () => {
        if (audio.volume === 0) {
            audio.volume = 0.5; // Riporta a un volume di default se era muto
        } else {
            audio.volume = 0; // Muta
        }
        volumeControl.value = audio.volume;
        updateVolumeIcon();
    });

    // Listener per il bottone "Aggiungi ai preferiti" nel player
    addToLikedBtn.addEventListener('click', () => {
        if (currentPlaylist.length > 0) {
            const currentSong = currentPlaylist[currentSongIndex];
            addSongToLiked(currentSong);
        } else {
            showToast("Nessuna canzone in riproduzione da aggiungere ai preferiti.");
        }
    });

    // Inizializza l'icona del volume
    updateVolumeIcon();

    // Event listeners per la funzionalità di ricerca e aggiunta
    addSongToMyPlaylistBtn.addEventListener('click', openAddSongSearch);
    closeSearchOverlay.addEventListener('click', closeAddSongSearch);
    searchInput.addEventListener('input', (e) => displaySearchResults(e.target.value));

    // Quando l'overlay di ricerca si apre, mostra subito tutti i brani
    addSongSearchOverlay.addEventListener('transitionend', () => {
        if (addSongSearchOverlay.classList.contains('active')) {
            displaySearchResults('');
        }
    });

    // Gestione della riproduzione dalla myPlaylist se presente nel localStorage e player attivo
    if (myPlaylist.length > 0) {
        // Puoi decidere se caricare automaticamente la prima canzone della myPlaylist
        // o lasciare che l'utente la selezioni. Per ora, non la carico automaticamente.
    }
});