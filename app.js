/* ==========================================================================
   AETHER NEXUS // INTERFAZ Y RENDERIZADO (app.js)
   Lógica UI, Filtros, Buscador Seguro y Grabador de Pantalla
   ========================================================================== */

const $ = (id) => document.getElementById(id);

// Referencias DOM principales
const messagesDiv = $('messagesDiv');
const settingsModal = $('settingsModal');
const filterSelect = $('filterSelect');
const dateStart = $('dateStart');
const dateEnd = $('dateEnd');
const searchInput = $('searchInput');
const searchPrevBtn = $('searchPrevBtn');
const searchNextBtn = $('searchNextBtn');
const searchMatchCount = $('searchMatchCount');
const identityMatrix = $('identityMatrix');
const jumpDateSelect = $('jumpDateSelect');
const countInput = $('countInput');
const countResult = $('countResult');
const globalAudioPlayer = $('globalAudioPlayer');
const toggleMusicBtn = $('toggleMusicBtn');
const recordBtn = $('recordBtn');
const playBtn = $('playBtn');

// Variables de Control
let currentScale = 0.85;
let isPlaying = false;
let simInterval = null;

/* ==========================================================================
   1. DICCIONARIO VFX (INTACTO DE V27.2)
   ========================================================================== */
const vfxDictionary = [
    {class:'fx-fire',regex:/\b(fuego|calor|arde|quema|odio|enojo|rabia|maldit[oa]|hdp|ctm|put[oa]|mierda|mrd|carajo|verga|ptm|joder|estupid[oa]|imbecil|idiota|matar|muere|infierno|peligro|bala|sangre|golpe|pelea|callate|perra|cabron|pendejo|🔥|🤬|😡|💢)\b/i},
    {class:'fx-toxic',regex:/\b(ironia|sarcasmo|xd|xdd|lmao|lol|wtf|nmms|wey|weon|cringe|basado|funado|bruh|literal|esquizofrenia|xddd|XD|wtf|alv|clown|payaso|paja|chiste|random|bizarro|🤡|💩|💀|👽)\b/i},
    {class:'fx-love',regex:/\b(amor|te amo|te quiero|hermos[oa]|bonit[oa]|lind[oa]|precios[oa]|bb|bebe|bbita|corazon|vida mia|cielo|mi reina|mi rey|espos[oa]|novi[oa]|casate|beso|abrazo|cariño|ternura|perfect[oa]|magia|😍|🥰|😘|❤️|💕|💖|✨)\b/i},
    {class:'fx-cold',regex:/\b(frio|hielo|nieve|congelad[oa]|triste|lloro|dolor|depresion|ansiedad|rip|f|soledad|vacio|lagrimas|roto|corazon roto|muerto|fallecio|depre|agotad[oa]|cansad[oa]|😭|😢|💔|🥶|🧊)\b/i},
    {class:'fx-sick',regex:/\b(asco|enferm[oa]|vomito|mareo|virus|infeccion|asqueroso|pudre|podrido|malestar|🤢|🤮|🤧|🤒|🦠)\b/i},
    {class:'fx-gold',regex:/\b(dinero|plata|oro|rico|millonario|exito|ganar|premio|lujo|caro|billete|dolar|euro|cash|💰|💎|🤑|👑|💸)\b/i},
    {class:'fx-party',regex:/\b(fiesta|celebracion|feliz|alegria|cumpleaños|felicidades|wiii|yey|genial|epico|🎉|🎊|🥳|🍻|💃|🕺)\b/i},
    {class:'fx-shock',regex:/\b(omg|dios|wow|increible|susto|miedo|terror|sorpresa|wtf|imposible|😱|🤯|😳|😨|🫢)\b/i}
];

// Anti-Lag Visual (Intersection Observer)
const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) entry.target.classList.add('in-view');
        else entry.target.classList.remove('in-view');
    });
}, { rootMargin: '200px' });

/* ==========================================================================
   2. MOTOR DE RENDERIZADO VISUAL
   ========================================================================== */
window.renderChat = async function() {
    showProgressScreen("CONSTRUYENDO", "Inyectando Efectos Visuales...");
    visibilityObserver.disconnect();
    messagesDiv.innerHTML = '';
    
    let lastDate = "";
    const fragment = document.createDocumentFragment();
    jumpDateSelect.innerHTML = '<option value="">[ SELECCIONAR FECHA ]</option>';
    
    const totalMsgs = globalMessages.length;
    
    for(let i = 0; i < totalMsgs; i++) {
        const m = globalMessages[i];
        const iso = m.dateObj.toISOString().split('T')[0];
        const dd = m.dateObj.toLocaleDateString();
        
        // Divisor de Fecha
        if(dd !== lastDate && dd !== "Invalid Date") {
            const divDate = document.createElement('div');
            divDate.className = "date-divider filter-item";
            divDate.setAttribute('data-isodata', iso);
            divDate.innerHTML = `<span>${dd}</span>`;
            fragment.appendChild(divDate);
            lastDate = dd;
            
            const opt = document.createElement('option');
            opt.value = iso; opt.text = dd;
            jumpDateSelect.appendChild(opt);
        }
        
        const isRight = (userAlignmentMap[m.sender] || 'left') === 'right';
        const dispName = userAliasMap[m.sender] || m.sender;
        
        // Media y Tipos
        let finalContent = processMediaContent(m.content).replace(/\n/g, '<br>');
        let msgType = 'text';
        if(finalContent.includes('class="sticker-file"')) msgType = 'sticker';
        else if(finalContent.includes('<img')) msgType = 'photo';
        else if(finalContent.includes('<video')) msgType = 'video';
        else if(finalContent.includes('<audio')) msgType = 'audio';
        
        // VFX Check
        let fxClass = '';
        for(let v of vfxDictionary) {
            if(v.regex.test(m.content)) { fxClass = v.class; break; }
        }
        
        // Contenedor Burbuja
        const div = document.createElement('div');
        div.className = `msg-container filter-item ${isRight ? 'msg-right' : 'msg-left'}`;
        div.setAttribute('data-content', m.content.toLowerCase());
        div.setAttribute('data-isodata', iso);
        div.setAttribute('data-type', msgType);
        
        div.innerHTML = `
            <div class="msg-wrapper ${fxClass}">
                <div class="name-label">${dispName}</div>
                <div class="text-[0.85rem] leading-relaxed text-gray-200 search-target">${finalContent}</div>
                <div class="timestamp">${m.dateObj.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            </div>`;
        fragment.appendChild(div);
        
        if(i % 800 === 0 || i === totalMsgs - 1) {
            updateProgress(Math.floor(((i + 1) / totalMsgs) * 100));
            await new Promise(r => setTimeout(r, 0));
        }
    }
    
    messagesDiv.appendChild(fragment);
    document.querySelectorAll('.msg-wrapper').forEach(el => visibilityObserver.observe(el));
    
    applyFilters();
    
    setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
        hideProgressScreen();
    }, 50);
};

function processMediaContent(text) {
    let result = text;
    for(let fn in globalMediaFiles) {
        const re = new RegExp(fn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g');
        if(re.test(text)) {
            const url = globalMediaFiles[fn].url;
            const ex = fn.split('.').pop().toLowerCase();
            const isSticker = ex === 'webp' || fn.toUpperCase().includes('STK');
            
            if(isSticker) result = result.replace(re, `<br><img src="${url}" class="sticker-file" loading="lazy">`);
            else if(['jpg','jpeg','png','gif'].includes(ex)) result = result.replace(re, `<br><img src="${url}" class="media-file" loading="lazy">`);
            else if(['mp4','webm'].includes(ex)) result = result.replace(re, `<br><video controls src="${url}" class="media-file"></video>`);
            else if(['opus','ogg','mp3','m4a','wav'].includes(ex)) result = result.replace(re, `<br><audio controls src="${url}" class="media-file mt-1"></audio>`);
            else result = result.replace(re, `<br><a href="${url}" download="${fn}" class="text-[var(--sys-blue)] text-xs font-bold underline mt-1 block">DESCARGAR</a>`);
        }
    }
    return result;
}

/* ==========================================================================
   3. FILTROS Y BUSCADOR (SISTEMA SEPARADO PARA EVITAR LAG)
   ========================================================================== */
// A. FILTROS DE VISIBILIDAD (Ocultan mensajes por tipo o fecha)
function applyFilters() {
    const ft = filterSelect.value;
    const sd = dateStart.value;
    const ed = dateEnd.value;
    
    document.querySelectorAll('.filter-item').forEach(el => {
        const iso = el.getAttribute('data-isodata');
        let visible = true;
        
        if(sd && iso < sd) visible = false;
        if(ed && iso > ed) visible = false;
        
        if(el.classList.contains('date-divider')) {
            el.style.display = visible ? 'flex' : 'none';
        } else {
            const ty = el.getAttribute('data-type');
            const matchType = ft === 'all' || ty === ft;
            el.style.display = (visible && matchType) ? 'flex' : 'none';
        }
    });
}

filterSelect.addEventListener('change', applyFilters);
dateStart.addEventListener('change', applyFilters);
dateEnd.addEventListener('change', applyFilters);

// B. BUSCADOR DE TEXTO SEGURO (Solo ilumina y navega, NO oculta nada)
let searchHits = [];
let currentHitIndex = -1;

function executeSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    // Limpiar iluminaciones anteriores
    document.querySelectorAll('.bg-yellow-500').forEach(el => {
        el.classList.remove('bg-yellow-500', 'text-black', 'font-bold', 'rounded', 'px-1');
    });
    
    searchHits = [];
    currentHitIndex = -1;
    
    if(!query) {
        searchMatchCount.classList.add('hidden');
        return;
    }
    
    // Encontrar coincidencias
    const msgs = document.querySelectorAll('.filter-item:not(.date-divider)');
    msgs.forEach(m => {
        if(m.getAttribute('data-content').includes(query) && m.style.display !== 'none') {
            searchHits.push(m);
        }
    });
    
    if(searchHits.length > 0) {
        searchMatchCount.classList.remove('hidden');
        currentHitIndex = 0;
        focusSearchHit();
    } else {
        searchMatchCount.classList.remove('hidden');
        searchMatchCount.innerText = "0/0";
    }
}

function focusSearchHit() {
    searchMatchCount.innerText = `${currentHitIndex + 1}/${searchHits.length}`;
    const targetMsg = searchHits[currentHitIndex];
    
    // Iluminar temporalmente
    const wrapper = targetMsg.querySelector('.msg-wrapper');
    wrapper.style.transition = "all 0.3s";
    wrapper.style.boxShadow = "0 0 20px rgba(255, 255, 0, 0.8)";
    wrapper.style.border = "2px solid yellow";
    
    setTimeout(() => {
        wrapper.style.boxShadow = "";
        wrapper.style.border = "";
    }, 1500);
    
    targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

searchInput.addEventListener('change', executeSearch); // Se ejecuta al dar "Enter" (blur/change)
searchNextBtn.addEventListener('click', () => { if(searchHits.length > 0) { currentHitIndex = (currentHitIndex + 1) % searchHits.length; focusSearchHit(); }});
searchPrevBtn.addEventListener('click', () => { if(searchHits.length > 0) { currentHitIndex = (currentHitIndex - 1 + searchHits.length) % searchHits.length; focusSearchHit(); }});


/* ==========================================================================
   4. MATRIZ DE IDENTIDAD Y AJUSTES
   ========================================================================== */
window.buildIdentityMatrixUI = function() {
    identityMatrix.innerHTML = '';
    Array.from(detectedSenders).forEach((s, i) => {
        let da = userAlignmentMap[s] || ((s.toLowerCase() === 'yo' || i === 0) ? 'right' : 'left');
        userAlignmentMap[s] = da;
        let ca = userAliasMap[s] || '';
        let safeName = s.replace(/"/g, '&quot;');
        
        let row = document.createElement('div');
        row.className = 'flex flex-col gap-1 p-2 bg-white/5 border border-white/10 rounded mb-2';
        
        row.innerHTML = `
            <div class="text-[10px] font-sys text-gray-300 truncate" title="${s}">${s}</div>
            <div><input type="text" class="sys-input py-1 px-2 rounded text-[10px] alias-input" data-user="${safeName}" placeholder="Alias..." value="${ca}"></div>
            <div class="flex gap-1 mt-1">
                <button class="align-trigger flex-1 py-1 text-[9px] border border-white/10 transition-colors ${da==='left'?'bg-[var(--sys-alert)] text-white':'bg-black text-gray-500'}" data-user="${safeName}" data-val="left">IZQ</button>
                <button class="align-trigger flex-1 py-1 text-[9px] border border-white/10 transition-colors ${da==='right'?'bg-[var(--sys-blue)] text-black':'bg-black text-gray-500'}" data-user="${safeName}" data-val="right">DER</button>
            </div>
        `;
        identityMatrix.appendChild(row);
    });

    document.querySelectorAll('.align-trigger').forEach(btn => {
        btn.onclick = (e) => {
            const u = e.target.getAttribute('data-user');
            const v = e.target.getAttribute('data-val');
            userAlignmentMap[u] = v;
            buildIdentityMatrixUI();
        };
    });
};

$('applyMappingBtn').addEventListener('click', async () => {
    document.querySelectorAll('.alias-input').forEach(i => {
        const u = i.getAttribute('data-user');
        const v = i.value.trim();
        if(v) userAliasMap[u] = v; else delete userAliasMap[u];
    });
    settingsModal.style.display = 'none';
    showProgressScreen("APLICANDO", "Guardando configuraciones...");
    updateProgress(50);
    await saveStateToDB();
    await renderChat();
});


/* ==========================================================================
   5. CONTADOR FORENSE Y NAVEGACIÓN GENERAL
   ========================================================================== */
$('countBtn').addEventListener('click', () => {
    const w = countInput.value.trim().toLowerCase();
    if(!w) { countResult.style.display = 'none'; return; }
    
    let t = 0, c = {};
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
    
    globalMessages.forEach(m => {
        const mt = m.content.match(re);
        if(mt) {
            t += mt.length;
            c[m.sender] = (c[m.sender] || 0) + mt.length;
        }
    });
    
    let h = `<div class="text-[var(--sys-blue)] mb-1 font-bold">TOTAL VECES: ${t}</div>`;
    for(let s in c) {
        h += `<div>${userAliasMap[s] || s}: <span class="text-white">${c[s]}</span></div>`;
    }
    countResult.innerHTML = h;
    countResult.style.display = 'block';
});

$('jumpBtn').addEventListener('click', () => {
    const td = jumpDateSelect.value;
    if(!td) return;
    const el = document.querySelector(`.date-divider[data-isodata="${td}"]`);
    if(el) {
        settingsModal.style.display = 'none';
        window.scrollTo({top: el.getBoundingClientRect().top + window.pageYOffset - 65, behavior: "smooth"});
        el.querySelector('span').style.borderColor = "var(--sys-alert)";
        el.querySelector('span').style.color = "var(--sys-alert)";
        setTimeout(() => {
            el.querySelector('span').style.borderColor = "#333";
            el.querySelector('span').style.color = "#94a3b8";
        }, 2000);
    }
});

// Botones UI Básicos
$('toggleSettingsBtn').addEventListener('click', () => settingsModal.style.display = 'flex');
$('closeModalBtn').addEventListener('click', () => settingsModal.style.display = 'none');
$('addMoreBtn').addEventListener('click', () => $('filesInput').click());
$('zoomInBtn').addEventListener('click', () => { currentScale = Math.min(2.5, currentScale + 0.1); document.documentElement.style.setProperty('--chat-scale', currentScale + 'rem'); });
$('zoomOutBtn').addEventListener('click', () => { currentScale = Math.max(0.5, currentScale - 0.1); document.documentElement.style.setProperty('--chat-scale', currentScale + 'rem'); });
$('fullscreenBtn').addEventListener('click', () => { !document.fullscreenElement ? document.documentElement.requestFullscreen().catch(()=>{}) : document.exitFullscreen && document.exitFullscreen(); });


/* ==========================================================================
   6. MODO TEATRO Y REPRODUCTOR MULTIMEDIA
   ========================================================================== */
playBtn.addEventListener('click', () => {
    if(isPlaying) {
        clearInterval(simInterval); isPlaying = false;
        playBtn.innerText = '▶️'; playBtn.classList.remove('playing');
        document.querySelectorAll('.sim-hidden').forEach(el => el.classList.remove('sim-hidden'));
        return;
    }
    isPlaying = true;
    playBtn.innerText = '⏸️'; playBtn.classList.add('playing');
    
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
        if(i >= pending.length) {
            clearInterval(simInterval); isPlaying = false;
            playBtn.innerText = '▶️'; playBtn.classList.remove('playing');
            return;
        }
        const msg = pending[i];
        msg.classList.remove('sim-hidden');
        msg.scrollIntoView({behavior: 'smooth', block: 'end'});
        i++;
    }, 1500);
});

// Control Multimedia (Fondos y Música)
window.applyBackground = function(b) { document.body.style.backgroundImage = `url('${URL.createObjectURL(b)}')`; }
$('bgInput').addEventListener('change', e => { if(e.target.files[0]) { customBgBlob = e.target.files[0]; applyBackground(customBgBlob); }});
$('clearBgBtn').addEventListener('click', () => { customBgBlob = null; document.body.style.backgroundImage = 'none'; $('bgInput').value = ''; });

window.applyMusic = function(b) { globalAudioPlayer.src = URL.createObjectURL(b); toggleMusicBtn.style.display = 'flex'; }
$('musicInput').addEventListener('change', e => { if(e.target.files[0]) { customMusicBlob = e.target.files[0]; applyMusic(customMusicBlob); }});
$('clearMusicBtn').addEventListener('click', () => { customMusicBlob = null; globalAudioPlayer.src = ''; toggleMusicBtn.style.display = 'none'; $('musicInput').value = ''; });

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


/* ==========================================================================
   7. GRABADOR DE PANTALLA SEGURO (CON ESCUDO ANTI-CRASH)
   ========================================================================== */
let mediaRecorder, recordedChunks = [], isRecording = false;

recordBtn.addEventListener('click', async () => {
    if(isRecording) {
        if(mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        return;
    }
    
    // Verificación de Soporte (Evita el crasheo en celulares iOS/Android)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert("⚠️ ATENCIÓN: La función de grabar pantalla (getDisplayMedia) no está permitida por tu navegador actual o estás en un dispositivo móvil.\n\nPor favor, usa el grabador de pantalla nativo de tu teléfono para capturar la evidencia.");
        return;
    }
    
    try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true });
        const options = { mimeType: 'video/webm;codecs=vp9' };
        
        if(!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8';
            if(!MediaRecorder.isTypeSupported(options.mimeType)) options.mimeType = 'video/webm';
        }
        
        mediaRecorder = new MediaRecorder(displayStream, options);
        mediaRecorder.ondataavailable = e => { if(e.data.size > 0) recordedChunks.push(e.data); };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none'; a.href = url; a.download = `AETHER_REC_${Date.now()}.webm`;
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
            
            recordedChunks = [];
            displayStream.getTracks().forEach(track => track.stop());
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.innerText = '🎥 REC';
        };
        
        displayStream.getVideoTracks()[0].onended = () => { if(isRecording) mediaRecorder.stop(); };
        
        mediaRecorder.start();
        isRecording = true;
        recordBtn.classList.add('recording');
        recordBtn.innerText = '⏹ STOP';
        
    } catch(err) {
        console.warn("Grabación cancelada:", err.message);
    }
});
