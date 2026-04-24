document.getElementById('current-year').textContent = new Date().getFullYear();

const JSON_MAIN = 'https://raw.githubusercontent.com/REDYQ/Anime_List/refs/heads/main/file/data.json'; // AList data
const AMUSIC_SERVER_CHECK = 'https://raw.githubusercontent.com/REDYQ/Anime_Music/refs/heads/main/file/data.json'; // AMusic data
const AMUSIC_TEST_SERVER_CHECK = 'https://raw.githubusercontent.com/REDYQ/Anime_Music/refs/heads/main/file/test/data.json'; // AMusic data (Test Server)
const GIT_BASE = 'https://raw.githubusercontent.com/REDYQ/Anime_List/refs/heads/main/file/data_id/'; // вложенные JSON
const GIT_COVER = 'https://raw.githubusercontent.com/REDYQ/Anime_List/refs/heads/main/file/icon/cover/'; // cover
const GIT_ASSET = 'https://raw.githubusercontent.com/REDYQ/Anime_List/refs/heads/main/file/icon/asset/'; // asset
const HASMUSIC_AMUSIC_ICON_URL = 'https://raw.githubusercontent.com/REDYQ/Anime_List/refs/heads/main/file/icon/system/ic1.jpg'; // has Music
const HASMUSIC_BY_TEST_AMUSIC_ICON_URL = 'https://raw.githubusercontent.com/REDYQ/Anime_List/refs/heads/main/file/icon/system/ic2.jpg'; // has Music By Test (Test Server)

const searchInput = document.getElementById('search-input');
let myListMode = 'titles'; 

let ALL_ANIME_DATA = [];
let musicChecklist = []; 
let musicChecklistByTest = []; 

async function loadFolders() {
    const allContainer = document.getElementById('all-list-container');
    allContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #555;">Загрузка...</div>';
    
    try {
        const [res, m1, m2] = await Promise.all([
            fetch(JSON_MAIN),
            fetch(AMUSIC_SERVER_CHECK),
            fetch(AMUSIC_TEST_SERVER_CHECK)
        ]);
        
        ALL_ANIME_DATA = await res.json();
        musicChecklist = await m1.json(); 
        musicChecklistByTest = await m2.json(); 
        
        await renderList(ALL_ANIME_DATA, 'all-list-container');
        updateMyList();
    } catch (e) {
        allContainer.innerHTML = `<div style="color:red; text-align:center;">Ошибка загрузки</div>`;
    }
}
        
async function renderList(data, containerId, isMyList = false, userItems = []) {
    const list = document.getElementById(containerId);
    list.innerHTML = '';

    if (isMyList && data.length > 0) {
        const ctrl = document.createElement('div');
        ctrl.style = "display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 20px; padding: 0 10px;";
        ctrl.innerHTML = `
            <svg onclick="setMyListMode('titles')" style="cursor:pointer; width:22px; fill: ${myListMode === 'titles' ? 'var(--accent)' : '#555'}" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.68-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
            <svg onclick="setMyListMode('folders')" style="cursor:pointer; width:22px; fill: ${myListMode === 'folders' ? 'var(--accent)' : '#555'}" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
        list.appendChild(ctrl);
    }

    const rawData = localStorage.getItem('my_anime_list');
    const myItems = rawData ? JSON.parse(rawData) : [];

    for (const item of data) {
        const hasMusic = musicChecklist.some(m => m.name === item.name);
        const hasMusicByTest = musicChecklistByTest.some(m => m.name === item.name);
        const isStatusHidden = item.status === "—";
        const wrapper = document.createElement('div');
        wrapper.className = 'anime-wrapper';
        const uniqueId = `${containerId}-${item.id}`;
        
        const isTitles = (isMyList && myListMode === 'titles');

        wrapper.innerHTML = `
        ${!isTitles ? `
            <div class="folder-item" data-name="${item.name.toLowerCase()}" onclick="toggleFolder(this, '${uniqueId}', '${item.id}')">
                <img src="${GIT_COVER}${item.id}.jpg" class="folder-icon">
                <div class="folder-info">
                    <b>${item.name}</b>
                    <div class="genre-label">${item.genre}</div>
                    ${!isStatusHidden ? `<div class="status-label" style="font-size:11px; color:#888;">${item.status}</div>` : ''}
                </div>
                <img src="${HASMUSIC_AMUSIC_ICON_URL}" class="music-icon ${hasMusic ? 'visible' : ''}" onclick="handleMusicClick(event, ${hasMusic}, '${item.name}')">
                <img src="${HASMUSIC_BY_TEST_AMUSIC_ICON_URL}" class="music-icon-t ${hasMusicByTest ? 'visible' : ''}" onclick="handleMusicByTestClick(event, ${hasMusicByTest}, '${item.name}')">
            </div>` : ''}
            <div class="sub-list" id="list-${uniqueId}"></div>
        `;
        list.appendChild(wrapper);
        
                if (isMyList) {
            const subList = wrapper.querySelector('.sub-list');
            const userFolder = myItems.find(u => u.id === item.id);
            const userPos = userFolder ? userFolder.pos.split(',').map(Number) : [];

			await fetchSubItems(item.id, subList, userPos, isMyList);

            if (isTitles) {
                subList.classList.add('open');
                subList.style.maxHeight = 'none';
                subList.style.marginLeft = '0';
                subList.style.borderLeft = 'none';
            }
        }
    }
}

function updateMyList() {
    const myContainer = document.getElementById('my-list-container');

    if (!ALL_ANIME_DATA || ALL_ANIME_DATA.length === 0) {
        myContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #555;">Загрузка данных...</div>';
        return;
    }

    const rawData = localStorage.getItem('my_anime_list');
    const myIds = rawData ? JSON.parse(rawData) : [];

    if (myIds.length === 0) {
        myContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 20px;">
                <div style="color: #555; font-size: 14px;">Ваш список пуст</div>
                <button onclick="triggerImport()" style="background: var(--accent); color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer;">IMPORT</button>
            </div>`;
    } else {
        myIds.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true}));
        
        const filteredData = ALL_ANIME_DATA.filter(item => myIds.some(u => u.id.split('_')[0] === item.id));
        renderList(filteredData, 'my-list-container', true, myIds);
    }
}

function switchScreen(screen) {
    const allList = document.getElementById('all-list-container');
    const myList = document.getElementById('my-list-container');
    
    if (screen === 'my') {
        allList.style.display = 'none';
        myList.style.display = 'block';
        updateMyList();
    } else {
        allList.style.display = 'block';
        myList.style.display = 'none';
    }
}

async function toggleFolder(element, uniqueId, originalId) {
    const subList = document.getElementById(`list-${uniqueId}`);
    const isActive = element.classList.contains('active');

    if (!isActive) {
        const container = element.closest('.container');
        container.querySelectorAll('.folder-item.active').forEach(activeEl => {
            activeEl.classList.remove('active');
            const openList = activeEl.nextElementSibling;
            if (openList) {
                openList.classList.remove('open');
                openList.style.maxHeight = null;
            }            
        });

        element.classList.add('active');
        subList.classList.add('open');
        subList.style.maxHeight = subList.scrollHeight + "px";

        if (subList.getAttribute('data-loaded') !== 'true') {
            await fetchSubItems(originalId, subList);
            subList.style.maxHeight = subList.scrollHeight + "px";
        }
    } else {
        element.classList.remove('active');
        subList.classList.remove('open');
        subList.style.maxHeight = null;
    }
}

async function fetchSubItems(folderId, container, userItems = [], isMyList = false) {
    try {
        const response = await fetch(`${GIT_BASE}${folderId}`);
        const subData = await response.json();
        
        container.innerHTML = subData.map((sub, index) => {
            const currentId = `${folderId}_${index + 1}`; 
            
            const userData = isMyList ? userItems.find(u => u.id === currentId) : null;
            const isSelected = !!userData;

            if (isMyList && myListMode === 'titles' && !isSelected) return '';

            const voiceover = userData ? userData.voiceover : sub.studio_name;
            const episodes = userData ? userData.episode : sub.episode;
            const relookCount = userData ? userData.relook : "";
            
            const dimmedStyle = (isMyList && myListMode === 'folders' && !isSelected) 
                ? 'style="opacity: 0.15; filter: grayscale(1); pointer-events: none;"' 
                : '';

            return `
            <div class="sub-item" ${dimmedStyle}>
                <img src="${GIT_ASSET}${folderId}/${index + 1}.jpg" class="folder-icon" style="width:50px; height:50px; border-radius: 8px; object-fit: cover;">
                <div class="sub-info">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <b style="font-size: 14px; text-align: left;">${sub.name}</b>
                        <span style="font-size: 10px; color: var(--accent); font-weight: bold;">${sub.type}</span>
                    </div>
                    
                    <!-- Блок Озвучки/Студии -->
                    <div style="font-size: 12px; color: #ccc; margin-top: 2px;">${voiceover}</div>
                    
                    <div class="sub-center-row">
                        <!-- Блок Пересмотров (скрываем если пусто) -->
                        ${relookCount ? `<span style="color: #888;">Пересмотрено ${relookCount} раз</span>` : `<span>${sub.year}</span>`}
                        <span>${episodes} эп.</span>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        container.setAttribute('data-loaded', 'true');
    } catch (e) {
        container.innerHTML = `<div style="padding:10px; color:red; font-size:12px;">Download ERROR</div>`;
    }
}
loadFolders();

searchInput.oninput = () => {
    const val = searchInput.value.toLowerCase().trim();
    const wrappers = document.querySelectorAll('.anime-wrapper');
    wrappers.forEach(wrapper => {
        const titleTag = wrapper.querySelector('.folder-info b, .sub-info b');
        const titleText = titleTag ? titleTag.textContent.toLowerCase() : "";
        
        wrapper.style.display = titleText.includes(val) ? '' : 'none';
    });
};

function setMyListMode(mode) {
    myListMode = mode;
    updateMyList();
}

function handleMusicClick(event, hasMusic, name) {
    event.stopPropagation();
    
    if (hasMusic) {
        window.open(`https://redyq.github.io/RQ.online/amusic.html`, '_blank');
    } else {
        showToast("Тайтл отсутствует в AMusic");
    }
}

/*Test Server*/
function handleMusicByTestClick(event, hasMusicByTest, name) {
    event.stopPropagation();
    
    if (hasMusicByTest) {
        window.open(`https://redyq.github.io/RQ.online/test/amusic.html`, '_blank');
    } else {
        showToast("Тайтл отсутствует на тестовом сервере AMusic");
    }
}
/*END*/
       
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

const brandName = document.getElementById('brand-name');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const drawerContent = document.getElementById('drawer-content');

brandName.onclick = () => {
	drawer.classList.add('open');
    overlay.classList.add('show');
	renderDrawerMenu(); 

    const btnAll = document.getElementById('btn-all-list');
    const btnMy = document.getElementById('btn-my-list');
    const moreTrigger = document.getElementById('more-trigger');
    const contextMenu = document.getElementById('context-menu');

    if (moreTrigger) {
        moreTrigger.onclick = (e) => {
            e.stopPropagation();
            contextMenu.classList.toggle('show');
        };
    }
};

overlay.onclick = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
};

function renderDrawerMenu() {
    const isAllVisible = document.getElementById('all-list-container').style.display !== 'none';
    
    drawerContent.innerHTML = `
        <div class="drawer-item ${isAllVisible ? 'active-screen' : ''}" id="btn-all-list">
            <span">All List</span>
        </div>
        
        <div class="drawer-item ${!isAllVisible ? 'active-screen' : ''}" id="btn-my-list">
            <span>Мой список</span>
            <div class="more-menu-container">
                <div id="more-trigger" style="margin-bottom: 4px;">⋮</div>
                <div class="context-menu" id="context-menu">
                    <div class="menu-item" id="export-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" /></svg>
                        EXPORT
                    </div>
                    <div class="menu-item" id="import-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" /></svg>
                        IMPORT
                    </div>
                </div>
            </div>
        </div>
    `;
    setupDrawerEvents();
}


const setActiveTab = (activeBtn, inactiveBtn) => {
        activeBtn.classList.add('active-screen');
        inactiveBtn.classList.remove('active-screen');
    };
    
function setupDrawerEvents() {
    const moreTrigger = document.getElementById('more-trigger');
    const contextMenu = document.getElementById('context-menu');
    const btnAll = document.getElementById('btn-all-list');
    const btnMy = document.getElementById('btn-my-list');

    if (!moreTrigger || !contextMenu) return;
    
    moreTrigger.onclick = (e) => {
        e.stopPropagation();
        contextMenu.classList.toggle('show');
    };

    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.classList.remove('show');
    }, { once: true });

    document.getElementById('export-btn').onclick = (e) => {
        e.stopPropagation();
        const data = localStorage.getItem('my_anime_list') || "[]";
        const date = new Date().toLocaleDateString('ru-RU');
        const blob = new Blob([data], { type: 'application/octet-stream' }); 
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AList_My [${date}].rq`;
        a.click();
    };

    document.getElementById('import-btn').onclick = (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.rq';
        input.onchange = (ev) => {
            const file = ev.target.files[0];
            if (file && file.name.endsWith('.rq')) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    localStorage.setItem('my_anime_list', re.target.result);
                    location.reload();
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    btnAll.onclick = () => {
        setActiveTab(btnAll, btnMy);
        drawer.classList.remove('open');
        overlay.classList.remove('show');
        switchScreen('all');
    };

    btnMy.onclick = (e) => {
        if(e.target.id === 'more-trigger') return;
        setActiveTab(btnMy, btnAll);
        drawer.classList.remove('open');
        overlay.classList.remove('show');
        switchScreen('my');
    };
}

function triggerImport() {
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'file';
    hiddenInput.accept = '.rq';
    hiddenInput.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (re) => {
            localStorage.setItem('my_anime_list', re.target.result);
            location.reload();
        };
        reader.readAsText(file);
    };
    hiddenInput.click();
}