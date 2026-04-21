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

let ALL_ANIME_DATA = [];

async function loadFolders() {
    const allContainer = document.getElementById('all-list-container');
    allContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #555;">Загрузка...</div>';
    
    try {
        const res = await fetch(JSON_MAIN);
        ALL_ANIME_DATA = await res.json();
        renderList(ALL_ANIME_DATA, 'all-list-container');
        updateMyList();
    } catch (e) {
        allContainer.innerHTML = `<div style="color:red; text-align:center;">Ошибка загрузки</div>`;
    }
}
        
async function renderList(data, containerId) {
    const list = document.getElementById(containerId);
    list.innerHTML = '';
    let musicChecklist = [];
    let musicChecklistByTest = [];
    try {
        const [m1, m2] = await Promise.all([fetch(AMUSIC_SERVER_CHECK), fetch(AMUSIC_TEST_SERVER_CHECK)]);
        musicChecklist = await m1.json();
        musicChecklistByTest = await m2.json();
    } catch(e) {}

    data.forEach((item) => {
        const hasMusic = musicChecklist.some(m => m.name === item.name);
        const hasMusicByTest = musicChecklistByTest.some(m => m.name === item.name);
        const isStatusHidden = item.status === "—";
        
        const wrapper = document.createElement('div');
        wrapper.className = 'anime-wrapper';
        const uniqueId = `${containerId}-${item.id}`;
        wrapper.innerHTML = `
            <div class="folder-item" data-name="${item.name.toLowerCase()}" onclick="toggleFolder(this, '${uniqueId}', '${item.id}')">
                <img src="${GIT_COVER}${item.id}.jpg" class="folder-icon">
                <div class="folder-info">
                    <b>${item.name}</b>
                    <div class="genre-label">${item.genre}</div>
                    ${!isStatusHidden ? `<div class="status-label" style="font-size:11px; color:#888;">${item.status}</div>` : ''}
                </div>
                <img src="${HASMUSIC_AMUSIC_ICON_URL}" class="music-icon ${hasMusic ? 'visible' : ''}" onclick="handleMusicClick(event, ${hasMusic}, '${item.name}')">
                <img src="${HASMUSIC_BY_TEST_AMUSIC_ICON_URL}" class="music-icon-t ${hasMusicByTest ? 'visible' : ''}" onclick="handleMusicByTestClick(event, ${hasMusicByTest}, '${item.name}')">
            </div>
            <div class="sub-list" id="list-${uniqueId}"></div>
        `;
        list.appendChild(wrapper);
    });
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
        const filteredData = ALL_ANIME_DATA.filter(item => myIds.includes(item.id));
        renderList(filteredData, 'my-list-container');
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

async function fetchSubItems(id, container) {
    try {
        const response = await fetch(`${GIT_BASE}${id}`);
        const subData = await response.json();
        
        container.innerHTML = subData.map((sub, index) => `
            <div class="sub-item">
                <img src="${GIT_ASSET}${id}/${index + 1}.jpg" class="folder-icon" style="width:50px; height:50px; border-radius: 8px; object-fit: cover;">
                <div class="sub-info">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <b style="font-size: 14px; text-align: left; padding-right: 10px;">${sub.name}</b>
                        <span style="font-size: 10px; color: var(--accent); font-weight: bold; text-transform: uppercase; white-space: nowrap;">${sub.type}</span>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px; text-align: left;">${sub.studio_name}</div>
                    <div class="sub-center-row">
                        <span>${sub.year}</span>
                        <span>${sub.episode} эп.</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.setAttribute('data-loaded', 'true');
    } catch (e) {
        container.innerHTML = `<div style="padding:10px; color:red; font-size:12px;">Download ERROR</div>`;
        console.error("Ошибка подгрузки:", e);
    }
}
loadFolders();

        searchInput.oninput = () => {
            const val = searchInput.value.toLowerCase().trim();
            const wrappers = document.querySelectorAll('.anime-wrapper');
            wrappers.forEach(wrapper => {
                const folderItem = wrapper.querySelector('.folder-item');
                const name = folderItem.getAttribute('data-name') || "";
                
                if (name.includes(val)) {
                    wrapper.style.display = 'block';
                } else {
                    wrapper.style.display = 'none';
                }
            });
        };

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