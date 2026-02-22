// ==========================================================================
// REFERENCIAS AL DOM (Interfaz)
// ==========================================================================
const filesInput = document.getElementById('filesInput');
const loaderUI = document.getElementById('loaderUI');
const chatUI = document.getElementById('chatUI');
const messagesDiv = document.getElementById('messagesDiv');

const syncOverlay = document.getElementById('syncOverlay');
const overlayText = document.getElementById('overlayText');
const overlaySubtext = document.getElementById('overlaySubtext');
const pixelBarContainer = document.getElementById('pixelBarContainer');
const pixelBarFill = document.getElementById('pixelBarFill');
const pixelBarText = document.getElementById('pixelBarText');

const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
const addMoreBtn = document.getElementById('addMoreBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const purgeBtn = document.getElementById('purgeBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const dateStart = document.getElementById('dateStart');
const dateEnd = document.getElementById('dateEnd');

const identityMatrix = document.getElementById('identityMatrix');
const applyMappingBtn = document.getElementById('applyMappingBtn');
const jumpDateSelect = document.getElementById('jumpDateSelect');
const jumpBtn = document.getElementById('jumpBtn');

const countInput = document.getElementById('countInput');
const countBtn = document.getElementById('countBtn');
const countResult = document.getElementById('countResult');
const bgInput = document.getElementById('bgInput');
const clearBgBtn = document.getElementById('clearBgBtn');
const musicInput = document.getElementById('musicInput');
const clearMusicBtn = document.getElementById('clearMusicBtn');
const globalAudioPlayer = document.getElementById('globalAudioPlayer');
const toggleMusicBtn = document.getElementById('toggleMusicBtn');

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const playBtn = document.getElementById('playBtn');

// ==========================================================================
// VARIABLES GLOBALES (Estado de la App)
// ==========================================================================
let globalMediaFiles = {}; 
let globalMessages = []; 
let detectedSenders = new Set();
let userAlignmentMap = {}; 
let userAliasMap = {};     
let customBgBlob = null; 
let customMusicBlob = null;

let currentScale = 0.85; // Escala inicial del Zoom
let isPlaying = false;   // Estado del reproductor
let simInterval = null;  // Intervalo del simulador

// ==========================================================================
// DICCIONARIO DE EFECTOS VISUALES (VFX OVERDRIVE)
// ==========================================================================
const vfxDictionary = [
    {
        class: 'fx-fire',
        regex: /\b(fuego|calor|arde|quema|odio|enojo|rabia|maldit[oa]|hdp|ctm|put[oa]|mierda|mrd|carajo|verga|ptm|joder|estupid[oa]|imbecil|idiota|matar|muere|infierno|peligro|bala|sangre|pelea|callate|perra|cabron|pendejo|🔥|🤬|😡)\b/i
    },
    {
        class: 'fx-toxic',
        regex: /\b(ironia|sarcasmo|xd|xdd|lmao|lol|wtf|nmms|wey|weon|cringe|basado|funado|bruh|literal|esquizofrenia|xddd|alv|clown|payaso|paja|chiste|random|bizarro|🤡|💩|💀|👽)\b/i
    },
    {
        class: 'fx-love',
        regex: /\b(amor|te amo|te quiero|hermos[oa]|bonit[oa]|lind[oa]|precios[oa]|bb|bebe|bbita|corazon|vida mia|cielo|mi reina|espos[oa]|novi[oa]|casate|beso|abrazo|cariño|ternura|perfect[oa]|magia|😍|🥰|😘|❤️|💕|💖|✨)\b/i
    },
    {
        class: 'fx-cold',
        regex: /\b(frio|hielo|nieve|congelad[oa]|triste|lloro|dolor|depresion|ansiedad|rip|f|soledad|vacio|lagrimas|roto|muerto|fallecio|depre|agotad[oa]|cansad[oa]|😭|😢|💔|🥶|🧊)\b/i
    }
];

// ==========================================================================
// SISTEMA DE UI (PROGRESO, PANTALLA COMPLETA, ZOOM, SIMULADOR)
// ==========================================================================
function showProgressScreen(title, subtitle) {
    syncOverlay.style.display = 'flex'; 
    overlayText.innerText = title; 
    overlaySubtext.innerText = subtitle;
    pixelBarContainer.style.display = 'block'; 
    updateProgress(0);
}

function updateProgress(pct) { 
    pixelBarFill.style.width = pct + '%'; 
    pixelBarText.innerText = pct + '%'; 
}

function hideProgressScreen() { 
    syncOverlay.style.display = 'none'; 
    pixelBarContainer.style.display = 'none'; 
}

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
    else if (document.exitFullscreen) document.exitFullscreen();
});

// MOTOR DE LUPA (ZOOM DINÁMICO)
zoomInBtn.addEventListener('click', () => {
    currentScale = Math.min(2.5, currentScale + 0.1); 
    document.documentElement.style.setProperty('--chat-scale', currentScale + 'rem');
});

zoomOutBtn.addEventListener('click', () => {
    currentScale = Math.max(0.5, currentScale - 0.1); 
    document.documentElement.style.setProperty('--chat-scale', currentScale + 'rem');
});

// MODO REPRODUCTOR (SIMULADOR DE LLEGADA)
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        clearInterval(simInterval); 
        isPlaying = false; 
        playBtn.innerText = '▶️'; 
        playBtn.classList.remove('playing');
        document.querySelectorAll('.sim-hidden').forEach(el => el.classList.remove('sim-hidden')); 
        return;
    }
    
    isPlaying = true; 
    playBtn.innerText = '⏸️'; 
    playBtn.classList.add('playing');
    
    const msgs = Array.from(document.querySelectorAll('.filter-item')); 
    const threshold = window.scrollY + window.innerHeight - 100;
    let pending = [];
    
    msgs.forEach(m => { 
        if(m.getBoundingClientRect().top + window.scrollY > threshold) { 
            m.classList.add('sim-hidden'); 
            pending.push(m); 
        } 
    });
    
    let i = 0;
    simInterval = setInterval(() => {
        if (i >= pending.length) { 
            clearInterval(simInterval); 
            isPlaying = false; 
            playBtn.innerText = '▶️'; 
            playBtn.classList.remove('playing'); 
            return; 
        }
        const msg = pending[i]; 
        msg.classList.remove('sim-hidden');
        msg.scrollIntoView({ behavior: 'smooth', block: 'end' }); 
        i++;
    }, 1500); // <-- Cambia este 1500 si quieres que los mensajes caigan más rápido o más lento
});

// ==========================================================================
// BASE DE DATOS LOCAL (IndexedDB)
// ==========================================================================
const DB_NAME = "AetherDB_V5"; 
let db;

function initDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('dataStore')) db.createObjectStore('dataStore');
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(); };
        request.onerror = () => resolve();
    });
}

async function saveStateToDB() {
    return new Promise((resolve) => {
        try {
            const tx = db.transaction('dataStore', 'readwrite'); 
            const store = tx.objectStore('dataStore');
            let mediaToSave = {};
            for(let key in globalMediaFiles) mediaToSave[key] = { blob: globalMediaFiles[key].blob };
            
            store.put(globalMessages, 'messages');
            store.put(mediaToSave, 'media');
            store.put(Array.from(detectedSenders), 'senders');
            store.put({ userAlignmentMap, userAliasMap, customBgBlob, customMusicBlob }, 'config');
            
            tx.oncomplete = () => resolve(); 
            tx.onerror = () => resolve();
        } catch(e) { resolve(); }
    });
}

async function loadStateFromDB() {
    showProgressScreen("CONECTANDO...", "Cargando memoria principal"); 
    updateProgress(20);
    return new Promise((resolve) => {
        try {
            const tx = db.transaction('dataStore', 'readonly'); 
            const store = tx.objectStore('dataStore');
            let m = null, md = null, s = null, c = null;

            store.get('messages').onsuccess = (e) => m = e.target.result;
            store.get('media').onsuccess = (e) => md = e.target.result;
            store.get('senders').onsuccess = (e) => s = e.target.result;
            store.get('config').onsuccess = (e) => c = e.target.result;

            tx.oncomplete = async () => {
                updateProgress(60);
                if (m && m.length > 0) {
                    globalMessages = m; 
                    detectedSenders = new Set(s || []);
                    if(c) {
                        userAlignmentMap = c.userAlignmentMap || {}; 
                        userAliasMap = c.userAliasMap || {};
                        if (c.customBgBlob) { customBgBlob = c.customBgBlob; applyBackground(customBgBlob); }
                        if (c.customMusicBlob) { customMusicBlob = c.customMusicBlob; applyMusic(customMusicBlob); }
                    }
                    globalMediaFiles = {};
                    if(md) {
                        for(let key in md) {
                            try { globalMediaFiles[key] = { blob: md[key].blob, url: URL.createObjectURL(md[key].blob) }; } catch(err) {}
                        }
                    }
                    updateProgress(100); 
                    buildIdentityMatrixUI();
                    loaderUI.style.display = 'none'; 
                    chatUI.style.display = 'block';
                    toggleSettingsBtn.style.display = 'flex'; 
                    addMoreBtn.style.display = 'flex';
                    fullscreenBtn.style.display = 'flex';
                    await renderChat();
                } else { 
                    hideProgressScreen(); 
                }
                resolve();
            };
            tx.onerror = () => { hideProgressScreen(); resolve(); };
        } catch(e) { hideProgressScreen(); resolve(); }
    });
}

window.onload = async () => { 
    await initDB(); 
    await loadStateFromDB(); 
};

// ==========================================================================
// EVENTOS Y FUNCIONALIDADES DEL PANEL (MULTIMEDIA Y ANALÍTICA)
// ==========================================================================
// FONDO
function applyBackground(blob) { document.body.style.backgroundImage = `url('${URL.createObjectURL(blob)}')`; }
bgInput.addEventListener('change', (e) => {
    if(e.target.files[0]) { customBgBlob = e.target.files[0]; applyBackground(customBgBlob); }
});
clearBgBtn.addEventListener('click', () => { customBgBlob = null; document.body.style.backgroundImage = 'none'; bgInput.value = ''; });

// MÚSICA
function applyMusic(blob) {
    globalAudioPlayer.src = URL.createObjectURL(blob);
    toggleMusicBtn.style.display = 'flex';
}
musicInput.addEventListener('change', (e) => {
    if(e.target.files[0]) { customMusicBlob = e.target.files[0]; applyMusic(customMusicBlob); }
});
clearMusicBtn.addEventListener('click', () => { 
    customMusicBlob = null; globalAudioPlayer.src = ''; toggleMusicBtn.style.display = 'none'; musicInput.value = ''; 
});

let isMusicPlaying = false;
toggleMusicBtn.addEventListener('click', () => {
    if(isMusicPlaying) { 
        globalAudioPlayer.pause(); 
        toggleMusicBtn.style.background = '#0f172a'; 
        toggleMusicBtn.style.color = '#00ff88'; 
    } else { 
        globalAudioPlayer.play().catch(()=>{}); 
        toggleMusicBtn.style.background = '#00ff88'; 
        toggleMusicBtn.style.color = '#000'; 
    }
    isMusicPlaying = !isMusicPlaying;
});

// CONTADOR DE PALABRAS
countBtn.addEventListener('click', () => {
    const word = countInput.value.trim().toLowerCase();
    if(!word) { countResult.style.display = 'none'; return; }
    
    let total = 0; 
    let counts = {};
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    
    globalMessages.forEach(m => {
        const matches = m.content.match(regex);
        if (matches) {
            total += matches.length;
            counts[m.sender] = (counts[m.sender] || 0) + matches.length;
        }
    });
    
    let html = `<div class="text-[var(--sys-blue)] mb-1">TOTAL VECES: ${total}</div>`;
    for(let sender in counts) {
        let alias = userAliasMap[sender] || sender;
        html += `<div>${alias}: <span class="text-white">${counts[sender]}</span></div>`;
    }
    countResult.innerHTML = html; 
    countResult.style.display = 'block';
});

// BOTONES DE AJUSTES
purgeBtn.addEventListener('click', () => {
    if(confirm("¿Estás seguro de borrar la memoria por completo?")) {
        try { 
            db.transaction('dataStore', 'readwrite').objectStore('dataStore').clear().onsuccess = () => location.reload(); 
        } catch(e) { location.reload(); }
    }
});

toggleSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
addMoreBtn.addEventListener('click', () => filesInput.click());

// ==========================================================================
// EXTRACCIÓN Y PROCESAMIENTO (ZIP & TXT)
// ==========================================================================
filesInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files); 
    if (files.length === 0) return;
    
    showProgressScreen("EXTRAYENDO", "Descomprimiendo archivos...");
    try {
        let textLogs = [];
        for (let f = 0; f < files.length; f++) {
            let file = files[f];
            if (file.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file); 
                const fNames = Object.keys(zip.files);
                for (let i = 0; i < fNames.length; i++) {
                    const fn = fNames[i]; 
                    const fd = zip.files[fn]; 
                    if (fd.dir) continue;
                    
                    if (fn.endsWith('.txt')) {
                        textLogs.push(await fd.async("string"));
                    } else { 
                        const blob = await fd.async("blob"); 
                        globalMediaFiles[fn] = { url: URL.createObjectURL(blob), blob: blob }; 
                    }
                    if (i % 10 === 0) { 
                        updateProgress(Math.floor((i / fNames.length) * 100)); 
                        await new Promise(r => setTimeout(r, 0)); 
                    }
                }
            } else if (file.name.endsWith('.txt')) { 
                textLogs.push(await file.text()); 
            } else { 
                globalMediaFiles[file.name] = { url: URL.createObjectURL(file), blob: file }; 
            }
        }
        await processRawTexts(textLogs);
    } catch (err) { 
        alert("ERROR: " + err.message); 
        hideProgressScreen(); 
    }
    filesInput.value = ""; 
});

function parseWhatsAppDate(dateStr, timeStr) {
    try {
        let cDate = dateStr.replace(/[^\d\/\-\.]/g, ''); 
        let cTime = timeStr.replace(/[^\d:APM]/gi, '').toUpperCase();
        let parts = cDate.split(/[\/\-\.]/); 
        let day = parseInt(parts[0]), month = parseInt(parts[1]) - 1, year = parseInt(parts[2]);
        
        if (day <= 12 && parseInt(parts[1]) > 12) { 
            day = parseInt(parts[1]); 
            month = parseInt(parts[0]) - 1; 
        }
        if (year < 100) year += 2000;
        
        let hours = parseInt(cTime.split(':')[0]), mins = parseInt(cTime.split(':')[1]);
        if (cTime.includes('P') && hours < 12) hours += 12; 
        if (cTime.includes('A') && hours === 12) hours = 0;
        
        return new Date(year, month, day, hours, mins);
    } catch (e) { return new Date(0); }
}

async function processRawTexts(textLogsArray) {
    if (textLogsArray.length === 0) {
        await saveStateToDB(); 
        hideProgressScreen(); 
        return;
    }
    
    showProgressScreen("SINTETIZANDO", "Analizando mensajes e inteligencia VFX...");
    const msgRegex = /^\[?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[, ]+(\d{1,2}:\d{2}(?::\d{2})?\s*[a-zA-Z\.]{0,4})\]?\s*[\-]?\s*([^:]+):\s*(.*)/;
    let uniqueSignatures = new Set(); 
    globalMessages.forEach(m => uniqueSignatures.add(`${m.displayDate}_${m.sender}_${m.content}`));

    let totalLines = textLogsArray.reduce((acc, l) => acc + l.split('\n').length, 0); 
    let processedLines = 0;
    
    for (let log of textLogsArray) {
        let currentMsg = null; 
        const lines = log.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(msgRegex);
            if (match) {
                detectedSenders.add(match[3].trim());
                currentMsg = { 
                    dateObj: parseWhatsAppDate(match[1], match[2]), 
                    displayDate: `${match[1]} ${match[2]}`, 
                    sender: match[3].trim(), 
                    content: match[4].trim() 
                };
                const sig = `${currentMsg.displayDate}_${currentMsg.sender}_${currentMsg.content}`;
                if (!uniqueSignatures.has(sig)) { 
                    uniqueSignatures.add(sig); 
                    globalMessages.push(currentMsg); 
                }
            } else if (lines[i].trim() && currentMsg) {
                uniqueSignatures.delete(`${currentMsg.displayDate}_${currentMsg.sender}_${currentMsg.content}`);
                currentMsg.content += "\n" + lines[i].trim();
                uniqueSignatures.add(`${currentMsg.displayDate}_${currentMsg.sender}_${currentMsg.content}`);
            }
            
            processedLines++;
            if (processedLines % 2000 === 0) { 
                updateProgress(Math.floor((processedLines / totalLines) * 100)); 
                await new Promise(r => setTimeout(r, 0)); 
            }
        }
    }
    
    globalMessages.sort((a, b) => a.dateObj - b.dateObj); 
    buildIdentityMatrixUI();
    
    showProgressScreen("GUARDANDO", "Asegurando persistencia..."); 
    updateProgress(50);
    await saveStateToDB(); 
    updateProgress(100);
    
    loaderUI.style.display = 'none'; 
    chatUI.style.display = 'block';
    toggleSettingsBtn.style.display = 'flex'; 
    addMoreBtn.style.display = 'flex';
    fullscreenBtn.style.display = 'flex';
    
    await renderChat(); 
}

// ==========================================================================
// RENDERIZADO Y CONTROL DE CHAT (VFX ENGINE APLICADO)
// ==========================================================================
function buildIdentityMatrixUI() {
    identityMatrix.innerHTML = ''; 
    Array.from(detectedSenders).forEach((sender, index) => {
        let defaultAlign = userAlignmentMap[sender] || ((sender.toLowerCase() === 'yo' || index === 0) ? 'right' : 'left');
        userAlignmentMap[sender] = defaultAlign; 
        let currentAlias = userAliasMap[sender] || '';
        const safeSender = sender.replace(/"/g, '&quot;');
        
        const row = document.createElement('div'); 
        row.className = 'identity-row';
        row.innerHTML = `
            <div class="text-[10px] font-sys text-gray-300 truncate" title="${sender}">${sender}</div>
            <div>
                <input type="text" class="sys-input py-1 px-2 rounded text-[10px] alias-input" data-user="${safeSender}" placeholder="Alias..." value="${currentAlias}">
            </div>
            <div class="radio-group">
                <label>
                    <input type="radio" name="align_${index}" value="left" class="radio-input align-trigger" data-user="${safeSender}" ${defaultAlign === 'left' ? 'checked' : ''}>
                    <span class="radio-label left-side">IZQ</span>
                </label>
                <label>
                    <input type="radio" name="align_${index}" value="right" class="radio-input align-trigger" data-user="${safeSender}" ${defaultAlign === 'right' ? 'checked' : ''}>
                    <span class="radio-label right-side">DER</span>
                </label>
            </div>
        `;
        identityMatrix.appendChild(row);
    });
}

applyMappingBtn.addEventListener('click', async () => {
    document.querySelectorAll('.alias-input').forEach(input => {
        const user = input.getAttribute('data-user'); 
        const val = input.value.trim();
        if (val) userAliasMap[user] = val; 
        else delete userAliasMap[user];
    });
    
    document.querySelectorAll('.align-trigger:checked').forEach(radio => {
        userAlignmentMap[radio.getAttribute('data-user')] = radio.value;
    });
    
    settingsModal.style.display = 'none'; 
    showProgressScreen("APLICANDO", "Guardando ajustes...");
    updateProgress(50); 
    await saveStateToDB(); 
    await renderChat(); 
});

async function renderChat() {
    showProgressScreen("CONSTRUYENDO", "Inyectando Efectos Visuales...");
    messagesDiv.innerHTML = ''; 
    let lastDate = ""; 
    const fragment = document.createDocumentFragment();
    jumpDateSelect.innerHTML = '<option value="">[ SELECCIONAR FECHA ]</option>';
    
    const totalMsgs = globalMessages.length;

    for (let i = 0; i < totalMsgs; i++) {
        const msg = globalMessages[i];
        const isoDate = msg.dateObj.toISOString().split('T')[0]; 
        const displayDate = msg.dateObj.toLocaleDateString();
        
        if (displayDate !== lastDate && displayDate !== "Invalid Date") {
            const dateDiv = document.createElement('div'); 
            dateDiv.className = "date-divider filter-item"; 
            dateDiv.setAttribute('data-isodata', isoDate);
            dateDiv.innerHTML = `<span>${displayDate}</span>`; 
            fragment.appendChild(dateDiv); 
            lastDate = displayDate;
            
            const option = document.createElement('option'); 
            option.value = isoDate; 
            option.text = displayDate; 
            jumpDateSelect.appendChild(option);
        }

        const isRight = (userAlignmentMap[msg.sender] || 'left') === 'right';
        const displayName = userAliasMap[msg.sender] || msg.sender; 
        let finalContent = processMediaContent(msg.content).replace(/\n/g, '<br>');
        
        let msgType = 'text';
        if (finalContent.includes('class="sticker-file"')) msgType = 'sticker';
        else if (finalContent.includes('<img')) msgType = 'photo';
        else if (finalContent.includes('<video')) msgType = 'video';
        else if (finalContent.includes('<audio')) msgType = 'audio';

        // LÓGICA DEL DICCIONARIO PARA APLICAR LA CLASE VFX
        let fxClass = '';
        for (let v of vfxDictionary) {
            if (v.regex.test(msg.content)) {
                fxClass = v.class;
                break; 
            }
        }

        const div = document.createElement('div');
        div.className = `msg-container filter-item ${isRight ? 'msg-right' : 'msg-left'}`;
        div.setAttribute('data-content', msg.content.toLowerCase()); 
        div.setAttribute('data-isodata', isoDate); 
        div.setAttribute('data-type', msgType);

        div.innerHTML = `
            <div class="msg-wrapper ${fxClass}">
                <div class="name-label">${displayName}</div>
                <div class="leading-relaxed text-gray-200">${finalContent}</div>
                <div class="timestamp">${msg.dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `;
        fragment.appendChild(div);

        if (i % 800 === 0 || i === totalMsgs - 1) { 
            updateProgress(Math.floor(((i + 1) / totalMsgs) * 100)); 
            await new Promise(r => setTimeout(r, 0)); 
        }
    }
    
    messagesDiv.appendChild(fragment); 
    applyFilters();
    
    setTimeout(() => { 
        window.scrollTo(0, document.body.scrollHeight); 
        hideProgressScreen(); 
    }, 50);
}

function processMediaContent(text) {
    let result = text;
    for (let filename in globalMediaFiles) {
        const regex = new RegExp(filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (regex.test(text)) {
            const url = globalMediaFiles[filename].url; 
            const ext = filename.split('.').pop().toLowerCase();
            const isSticker = ext === 'webp' || filename.toUpperCase().includes('STK');
            
            if (isSticker) result = result.replace(regex, `<br><img src="${url}" class="sticker-file" loading="lazy">`);
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) result = result.replace(regex, `<br><img src="${url}" class="media-file" loading="lazy">`);
            else if (['mp4', 'webm'].includes(ext)) result = result.replace(regex, `<br><video controls src="${url}" class="media-file"></video>`);
            else if (['opus', 'ogg', 'mp3', 'm4a', 'wav'].includes(ext)) result = result.replace(regex, `<br><audio controls src="${url}" class="media-file mt-1"></audio>`);
            else result = result.replace(regex, `<br><a href="${url}" download="${filename}" class="text-[var(--sys-blue)] text-xs font-bold underline mt-1 block">DESCARGAR</a>`);
        }
    }
    return result;
}

// ==========================================================================
// FILTROS Y BÚSQUEDA
// ==========================================================================
function applyFilters() {
    const term = searchInput.value.toLowerCase().trim(); 
    const filterType = filterSelect.value;
    const startDate = dateStart.value; 
    const endDate = dateEnd.value;     
    
    document.querySelectorAll('.filter-item').forEach(el => {
        const iso = el.getAttribute('data-isodata'); 
        let isDateValid = true;
        
        if (startDate && iso < startDate) isDateValid = false; 
        if (endDate && iso > endDate) isDateValid = false;
        
        if (el.classList.contains('date-divider')) { 
            el.style.display = isDateValid ? 'flex' : 'none'; 
        } else {
            const content = el.getAttribute('data-content'); 
            const type = el.getAttribute('data-type');
            const matchesSearch = content.includes(term); 
            const matchesType = filterType === 'all' || type === filterType;
            
            el.style.display = (isDateValid && matchesSearch && matchesType) ? 'flex' : 'none';
        }
    });
}

searchInput.addEventListener('input', applyFilters); 
filterSelect.addEventListener('change', applyFilters); 
dateStart.addEventListener('change', applyFilters); 
dateEnd.addEventListener('change', applyFilters);

jumpBtn.addEventListener('click', () => {
    const targetDate = jumpDateSelect.value; 
    if (!targetDate) return; 
    
    const element = document.querySelector(`.date-divider[data-isodata="${targetDate}"]`);
    if (element) {
        settingsModal.style.display = 'none'; 
        window.scrollTo({ 
            top: element.getBoundingClientRect().top + window.pageYOffset - 65, 
            behavior: "smooth" 
        });
        
        element.querySelector('span').style.borderColor = "var(--sys-alert)"; 
        element.querySelector('span').style.color = "var(--sys-alert)";
        
        setTimeout(() => { 
            element.querySelector('span').style.borderColor = "#333"; 
            element.querySelector('span').style.color = "#94a3b8"; 
        }, 2000);
    }
});


