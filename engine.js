/* ==========================================================================
   AETHER NEXUS // MOTOR DE DATOS (engine.js)
   Extraído directamente de V27.2 (100% Funcional y Rápido)
   ========================================================================== */

// 1. VARIABLES GLOBALES (Compartidas con app.js)
let globalMediaFiles = {};
let globalMessages = [];
let detectedSenders = new Set();
let userAlignmentMap = {};
let userAliasMap = {};
let customBgBlob = null;
let customMusicBlob = null;

// Referencias a la UI de carga
const syncOverlay = document.getElementById('syncOverlay');
const overlayText = document.getElementById('overlayText');
const overlaySubtext = document.getElementById('overlaySubtext');
const pixelBarContainer = document.getElementById('pixelBarContainer');
const pixelBarFill = document.getElementById('pixelBarFill');
const pixelBarText = document.getElementById('pixelBarText');
const filesInput = document.getElementById('filesInput');
const loaderUI = document.getElementById('loaderUI');
const chatUI = document.getElementById('chatUI');
const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
const addMoreBtn = document.getElementById('addMoreBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// 2. CONTROL DE PANTALLA DE CARGA
function showProgressScreen(t, s) {
    syncOverlay.style.display = 'flex';
    overlayText.innerText = t;
    overlaySubtext.innerText = s;
    pixelBarContainer.style.display = 'block';
    updateProgress(0);
}

function updateProgress(p) {
    pixelBarFill.style.width = p + '%';
    pixelBarText.innerText = p + '%';
}

function hideProgressScreen() {
    syncOverlay.style.display = 'none';
    pixelBarContainer.style.display = 'none';
}

// 3. BASE DE DATOS (AetherDB_V4 ORIGINAL)
const DB_NAME = "AetherDB_V4";
let db;

function initDB() {
    return new Promise(r => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('dataStore')) {
                db.createObjectStore('dataStore');
            }
        };
        req.onsuccess = e => { db = e.target.result; r(); };
        req.onerror = () => r();
    });
}

async function saveStateToDB() {
    return new Promise(r => {
        try {
            const tx = db.transaction('dataStore', 'readwrite');
            const store = tx.objectStore('dataStore');
            let md = {};
            
            for (let k in globalMediaFiles) {
                md[k] = { blob: globalMediaFiles[k].blob };
            }
            
            store.put(globalMessages, 'messages');
            store.put(md, 'media');
            store.put(Array.from(detectedSenders), 'senders');
            store.put({ userAlignmentMap, userAliasMap, customBgBlob, customMusicBlob }, 'config');
            
            tx.oncomplete = r;
            tx.onerror = r;
        } catch (e) { r(); }
    });
}

async function loadStateFromDB() {
    showProgressScreen("CONECTANDO...", "Cargando memoria V27.2");
    updateProgress(20);
    
    return new Promise(r => {
        try {
            const tx = db.transaction('dataStore', 'readonly');
            const store = tx.objectStore('dataStore');
            let m, md, s, c;
            
            store.get('messages').onsuccess = e => m = e.target.result;
            store.get('media').onsuccess = e => md = e.target.result;
            store.get('senders').onsuccess = e => s = e.target.result;
            store.get('config').onsuccess = e => c = e.target.result;
            
            tx.oncomplete = async () => {
                updateProgress(60);
                if (m && m.length > 0) {
                    globalMessages = m;
                    detectedSenders = new Set(s || []);
                    
                    if (c) {
                        userAlignmentMap = c.userAlignmentMap || {};
                        userAliasMap = c.userAliasMap || {};
                        
                        // Estas funciones vivirán en app.js
                        if (c.customBgBlob) {
                            customBgBlob = c.customBgBlob;
                            if(typeof applyBackground === 'function') applyBackground(customBgBlob);
                        }
                        if (c.customMusicBlob) {
                            customMusicBlob = c.customMusicBlob;
                            if(typeof applyMusic === 'function') applyMusic(customMusicBlob);
                        }
                    }
                    
                    globalMediaFiles = {};
                    if (md) {
                        for (let k in md) {
                            try {
                                globalMediaFiles[k] = { blob: md[k].blob, url: URL.createObjectURL(md[k].blob) };
                            } catch (err) {}
                        }
                    }
                    
                    updateProgress(100);
                    
                    // Llamadas a app.js
                    if(typeof buildIdentityMatrixUI === 'function') buildIdentityMatrixUI();
                    
                    loaderUI.style.display = 'none';
                    chatUI.style.display = 'block';
                    toggleSettingsBtn.style.display = 'flex';
                    addMoreBtn.style.display = 'flex';
                    fullscreenBtn.style.display = 'flex';
                    
                    if(typeof renderChat === 'function') await renderChat();
                } else {
                    hideProgressScreen();
                }
                r();
            };
            tx.onerror = () => { hideProgressScreen(); r(); };
        } catch (e) { hideProgressScreen(); r(); }
    });
}

// ARRANQUE INICIAL
window.onload = async () => {
    await initDB();
    await loadStateFromDB();
};

// 4. LECTURA DE ARCHIVOS (IMPORTACIÓN ORIGINAL)
filesInput.addEventListener('change', async e => {
    const f = Array.from(e.target.files);
    if (!f.length) return;
    
    showProgressScreen("EXTRAYENDO", "Descomprimiendo...");
    try {
        let txts = [];
        for (let i = 0; i < f.length; i++) {
            let fl = f[i];
            if (fl.name.endsWith('.zip')) {
                const zp = await JSZip.loadAsync(fl);
                const fnm = Object.keys(zp.files);
                for (let j = 0; j < fnm.length; j++) {
                    const n = fnm[j];
                    const d = zp.files[n];
                    if (d.dir) continue;
                    
                    if (n.endsWith('.txt')) {
                        txts.push(await d.async("string"));
                    } else {
                        const bl = await d.async("blob");
                        globalMediaFiles[n] = { url: URL.createObjectURL(bl), blob: bl };
                    }
                    if (j % 10 === 0) {
                        updateProgress(Math.floor((j / fnm.length) * 100));
                        await new Promise(r => setTimeout(r, 0));
                    }
                }
            } else if (fl.name.endsWith('.txt')) {
                txts.push(await fl.text());
            } else {
                globalMediaFiles[fl.name] = { url: URL.createObjectURL(fl), blob: fl };
            }
        }
        await processRawTexts(txts);
    } catch (err) {
        alert("ERROR: " + err.message);
        hideProgressScreen();
    }
    filesInput.value = "";
});

// 5. PARSER DE FECHAS ORIGINAL
function parseWhatsAppDate(d, t) {
    try {
        let cd = d.replace(/[^\d\/\-\.]/g, '');
        let ct = t.replace(/[^\d:APM]/gi, '').toUpperCase();
        let p = cd.split(/[\/\-\.]/);
        
        let dy = parseInt(p[0]);
        let mo = parseInt(p[1]) - 1;
        let yr = parseInt(p[2]);
        
        if (dy <= 12 && parseInt(p[1]) > 12) {
            dy = parseInt(p[1]);
            mo = parseInt(p[0]) - 1;
        }
        if (yr < 100) yr += 2000;
        
        let h = parseInt(ct.split(':')[0]);
        let m = parseInt(ct.split(':')[1]);
        
        if (ct.includes('P') && h < 12) h += 12;
        if (ct.includes('A') && h === 12) h = 0;
        
        return new Date(yr, mo, dy, h, m);
    } catch (e) { return new Date(0); }
}

// 6. LÓGICA DE DEDUPLICACIÓN ORIGINAL (INTACTA)
async function processRawTexts(ta) {
    if (!ta.length) {
        await saveStateToDB();
        hideProgressScreen();
        return;
    }
    
    showProgressScreen("SINTETIZANDO", "Filtrando duplicados...");
    
    const rx = /^\[?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[, ]+(\d{1,2}:\d{2}(?::\d{2})?\s*[a-zA-Z\.]{0,4})\]?\s*[\-]?\s*([^:]+):\s*(.*)/;
    let s = new Set();
    globalMessages.forEach(m => s.add(`${m.dateObj.getTime()}_${m.sender}_${m.content}`));
    
    let tl = ta.reduce((a, l) => a + l.split('\n').length, 0);
    let pl = 0;
    
    for (let lg of ta) {
        let c = null;
        let ln = lg.split('\n');
        
        for (let i = 0; i < ln.length; i++) {
            const mt = ln[i].match(rx);
            
            if (mt) {
                detectedSenders.add(mt[3].trim());
                c = {
                    dateObj: parseWhatsAppDate(mt[1], mt[2]),
                    displayDate: `${mt[1]} ${mt[2]}`,
                    sender: mt[3].trim(),
                    content: mt[4].trim()
                };
                const sig = `${c.dateObj.getTime()}_${c.sender}_${c.content}`;
                if (!s.has(sig)) {
                    s.add(sig);
                    globalMessages.push(c);
                }
            } else if (ln[i].trim() && c) {
                let oldSig = `${c.dateObj.getTime()}_${c.sender}_${c.content}`;
                if (s.has(oldSig)) s.delete(oldSig);
                
                c.content += "\n" + ln[i].trim();
                
                let newSig = `${c.dateObj.getTime()}_${c.sender}_${c.content}`;
                if (!s.has(newSig)) {
                    s.add(newSig);
                    if (!globalMessages.includes(c)) globalMessages.push(c);
                } else {
                    c = null;
                }
            }
            
            pl++;
            if (pl % 2000 === 0) {
                updateProgress(Math.floor((pl / tl) * 100));
                await new Promise(r => setTimeout(r, 0));
            }
        }
    }
    
    globalMessages.sort((a, b) => a.dateObj - b.dateObj);
    
    // Llamadas a app.js
    if(typeof buildIdentityMatrixUI === 'function') buildIdentityMatrixUI();
    
    showProgressScreen("GUARDANDO", "Actualizando Base de Datos...");
    updateProgress(50);
    
    await saveStateToDB();
    updateProgress(100);
    
    loaderUI.style.display = 'none';
    chatUI.style.display = 'block';
    toggleSettingsBtn.style.display = 'flex';
    addMoreBtn.style.display = 'flex';
    fullscreenBtn.style.display = 'flex';
    
    if(typeof renderChat === 'function') await renderChat();
}
