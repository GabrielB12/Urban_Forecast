/* script.js - versão definitiva: evita duplicação, toggle funcional, lazy-load do mapa */
(() => {
    // CONFIGURAÇÃO (substitua se precisar)
    const SPREADSHEET_ID = '1ZsOUdF7bzeW8IJ9J_Gn49Q4jJlVpj8984DU1bjNQNGI';
    const RANGE = 'Página1!A1:M3';
    const API_KEY = 'AIzaSyDoBuWBVUo-PAY82kE41vhlVZaurmkOnnI';
  
    const embedUrls = [
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.8046802636463!2d-46.70801542440279!3d-23.53952647881484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce57d3f4c5cb03%3A0x2ba62731dd729c45!2sR.%20Cerro%20Cor%C3%A1%2C%20914%20-%20Vila%20Madalena%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005061-100!5e0!3m2!1spt-BR!2sbr!4v1735338105438!5m2!1spt-BR!2sbr",
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.639369157598!2d-46.71143602440055!3d-23.61726317876141!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce50d611256955%3A0xd368108b420440ae!2sAv.%20Morumbi%2C%206340%20-%20Morumbi%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005650-002!5e0!3m2!1spt-BR!2sbr!4v1735258963462!5m2!1spt-BR!2sbr",
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.9264544992843!2d-46.69150202440291!3d-23.535147478817784!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce57e76c43a29f%3A0xf828598be80d3dda!2sAv.%20Pomp%C3%A9ia%2C%201308%20-%20Pompeia%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2005022-001!5e0!3m2!1spt-BR!2sbr!4v1735338288220!5m2!1spt-BR!2sbr"
    ];
    const mapSearchQueries = [
      "R. Cerro Corá, 914 - Vila Madalena, São Paulo - SP",
      "Av. Morumbi, 6340 - Morumbi, São Paulo - SP",
      "Av. Pompéia, 1308 - Pompeia, São Paulo - SP"
    ];
  
    // estado
    let initialized = false;
    let fetchLock = false;
  
    // refs
    const tableWrap = document.getElementById('table-wrap');
    const dataTable = document.getElementById('data-table');
    const theadRow = dataTable.querySelector('thead tr');
    const tbody = document.getElementById('table-body');
    const progressContainer = document.getElementById('progress-container');
    const originalToggleButton = document.getElementById('toggle-table-button');
  
    // util
    const safeParseInt = v => {
      const n = parseInt(v);
      if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
      return Math.max(0, Math.min(100, n));
    };
    const mapsSearchUrl = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  
    // Remove elementos duplicados que porventura já existam (garante uma única tabela/wrapper)
    function removeDuplicateNodes() {
      // ids que não devem ter duplicatas
      const ids = ['table-wrap', 'data-table', 'table-body', 'progress-container', 'toggle-table-button'];
      ids.forEach(id => {
        const all = Array.from(document.querySelectorAll(`#${id}`));
        if (all.length > 1) {
          // mantem o primeiro, remove o resto
          all.slice(1).forEach(n => n.remove());
        }
      });
    }
  
    // setup toggle: substitui botão por clone para garantir que não existam listeners repetidos
    function setupToggleButton() {
      removeDuplicateNodes();
  
      const btn = document.getElementById('toggle-table-button');
      if (!btn) return;
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
  
      // inicializa estado (salvo no localStorage)
      const saved = localStorage.getItem('tableVisible');
      const visible = saved === null ? true : saved === 'true';
      applyVisibility(newBtn, visible);
  
      newBtn.addEventListener('click', () => {
        const currentlyHidden = tableWrap.classList.toggle('hidden');
        applyVisibility(newBtn, !currentlyHidden);
        localStorage.setItem('tableVisible', String(!currentlyHidden));
      });
    }
  
    function applyVisibility(buttonEl, visible) {
      if (visible) {
        tableWrap.classList.remove('hidden');
        buttonEl.textContent = 'Esconder Tabela';
        buttonEl.setAttribute('aria-expanded', 'true');
      } else {
        tableWrap.classList.add('hidden');
        buttonEl.textContent = 'Mostrar Tabela detalhada';
        buttonEl.setAttribute('aria-expanded', 'false');
      }
    }
  
    // limpa thead/tbody/progress antes de renderizar
    function clearAll() {
      if (theadRow) theadRow.innerHTML = '';
      if (tbody) tbody.innerHTML = '';
      if (progressContainer) progressContainer.innerHTML = '';
    }
  
    // build header
    function buildTableHeader(headers) {
      if (!theadRow) return;
      const frag = document.createDocumentFragment();
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h ?? '';
        frag.appendChild(th);
      });
      theadRow.appendChild(frag);
    }
  
    // build rows: usa headers para data-label
    function buildTableRows(sheetData) {
      if (!tbody) return;
      tbody.innerHTML = '';
      if (!sheetData || sheetData.length <= 1) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.textContent = 'Nenhum dado encontrado.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }
  
      const headers = sheetData[0];
      const columns = headers.length;
      const frag = document.createDocumentFragment();
  
      sheetData.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        for (let i = 0; i < columns; i++) {
          const td = document.createElement('td');
          td.setAttribute('data-label', headers[i] ?? '');
          const cell = row[i] ?? '';
          if (i === 12 && cell) {
            const a = document.createElement('a');
            a.href = cell;
            a.textContent = 'Rota otimizada';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'optimized-route-link';
            td.appendChild(a);
          } else {
            td.textContent = cell;
          }
          tr.appendChild(td);
        }
        frag.appendChild(tr);
      });
  
      tbody.appendChild(frag);
    }
  
    // build progress with lazy map loading
    function buildProgressBars(sheetData) {
      if (!progressContainer) return;
      progressContainer.innerHTML = '';
      const dataRow = (sheetData && sheetData[1]) ? sheetData[1] : [];
      const progressData = [
        { label: 'Nível disponível da Lixeira 1', value: safeParseInt(dataRow[3]), idx: 1 },
        { label: 'Nível disponível da Lixeira 2', value: safeParseInt(dataRow[7]), idx: 2 },
        { label: 'Nível disponível da Lixeira 3', value: safeParseInt(dataRow[11]), idx: 3 }
      ];
  
      const frag = document.createDocumentFragment();
      progressData.forEach(p => {
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.dataset.mapLoaded = '0';
  
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = p.label;
        item.appendChild(label);
  
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${p.value}%`;
        fill.textContent = `${p.value}%`;
        if (p.value === 100) fill.classList.add('progress-100');
        else if (p.value >= 50) fill.classList.add('progress-50');
        else fill.classList.add('progress-0');
        bar.appendChild(fill);
        item.appendChild(bar);
  
        const actions = document.createElement('div');
        actions.style.marginTop = '10px';
  
        // abrir no maps (apenas 1 link)
        const openBtn = document.createElement('a');
        openBtn.className = 'btn secondary';
        openBtn.textContent = 'Abrir no Google Maps';
        openBtn.href = mapsSearchUrl(mapSearchQueriesForIndex(p.idx));
        openBtn.target = '_blank';
        openBtn.rel = 'noopener noreferrer';
        actions.appendChild(openBtn);
  
        // carregar mapa (lazy)
        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn';
        loadBtn.type = 'button';
        loadBtn.textContent = 'Carregar mapa';
        loadBtn.addEventListener('click', () => {
          if (item.dataset.mapLoaded === '1') return;
          const mapDiv = document.createElement('div');
          mapDiv.className = 'map-inline';
          const iframe = document.createElement('iframe');
          iframe.src = embedUrls[p.idx - 1];
          iframe.loading = 'lazy';
          iframe.title = `Mapa ${p.idx}`;
          iframe.referrerPolicy = 'no-referrer-when-downgrade';
          iframe.allowFullscreen = true;
          mapDiv.appendChild(iframe);
          item.appendChild(mapDiv);
          item.dataset.mapLoaded = '1';
          loadBtn.classList.add('disabled');
          loadBtn.textContent = 'Mapa carregado';
        });
        actions.appendChild(loadBtn);
  
        item.appendChild(actions);
        frag.appendChild(item);
      });
  
      progressContainer.appendChild(frag);
    }
  
    function mapSearchQueriesForIndex(index) {
      const idx = Math.max(1, Math.min(mapSearchQueries.length, index));
      return mapSearchQueries[idx - 1];
    }
  
    // fetch + pipeline (com fetchLock)
    function fetchSheetData() {
      if (fetchLock) return;
      fetchLock = true;
      clearAll();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SPREADSHEET_ID)}/values/${encodeURIComponent(RANGE)}?key=${encodeURIComponent(API_KEY)}`;
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(json => {
          const sheetData = json.values || [];
          buildTableHeader(sheetData[0] || []);
          buildTableRows(sheetData);
          buildProgressBars(sheetData);
        })
        .catch(err => {
          console.error('Erro ao buscar planilha:', err);
          // mostra erro na tabela
          if (tbody) {
            tbody.innerHTML = '';
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.textContent = 'Erro ao carregar os dados.';
            tr.appendChild(td);
            tbody.appendChild(tr);
          }
        })
        .finally(() => { fetchLock = false; });
    }
  
    // INIT idempotente
    function init() {
      if (initialized) return;
      initialized = true;
  
      // garantir sem duplicatas de nodes
      removeDuplicateNodes();
  
      // configurar toggle (remove listeners antigos)
      setupToggleButton();
  
      // carregar dados
      fetchSheetData();
    }
  
    // start
    document.addEventListener('DOMContentLoaded', init);
  
    // expor para debug
    window._app = { fetchSheetData, removeDuplicateNodes };
  })();
  