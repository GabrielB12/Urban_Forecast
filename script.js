/* script.js
   Versão unificada do JS: busca Supabase, popula filtro, atualiza tabela, mostra mapa
   Substitua SUPABASE_HOST / ANON_KEY / APPS_SCRIPT_URL conforme necessário.
*/

const SUPABASE_HOST = "https://zitresvvjiondhgiuqal.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdHJlc3Z2amlvbmRoZ2l1cWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI2MjksImV4cCI6MjA3NzcyODYyOX0.Z_cBFBjyLF77pkVAnd5xMaNM7YX3bdZmqjMUOMZHI9k";

/* APPS SCRIPT CONFIG (opcional) */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbza4WQXC5yHejMkn8x5t-Kvgo9FPE4KdH3Igow-Pthg88lOeHfjN1hIuGxLy8RJLxiP/exec";
const APPS_SCRIPT_KEY = "teste123";
const ALERT_THRESHOLD_DEFAULT = 70;

/* util */
function log() { try { console.log.apply(console, arguments); } catch(e){} }
function mapEmbedUrlFor(address){ if(!address) return ""; return "https://www.google.com/maps?q=" + encodeURIComponent(address) + "&output=embed"; }
function mapOpenUrlFor(address){ if(!address) return ""; return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address); }

/* ---------- Supabase fetch ---------- */
async function fetchData(sensor_id = "") {
  let url = SUPABASE_HOST + "/rest/v1/v_distancias_com_fill?select=*&order=created_at.desc&limit=100";
  if (sensor_id) url += "&sensor_id=eq." + encodeURIComponent(sensor_id);
  try {
    const res = await fetch(url, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": "Bearer " + ANON_KEY,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) {
      console.error("Erro fetchData:", res.status, await res.text());
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("Erro fetchData (exception):", err);
    return [];
  }
}

async function populateSensorFilter(){
  try {
    const url = SUPABASE_HOST + "/rest/v1/lixeiras?select=sensor_id,nome&order=nome";
    const res = await fetch(url, {
      headers: { "apikey": ANON_KEY, "Authorization": "Bearer " + ANON_KEY }
    });
    if (!res.ok) { log("populateSensorFilter: supabase returned", res.status); return; }
    const data = await res.json();
    const sel = document.getElementById('sensorFilter');
    if (!sel) { log("populateSensorFilter: #sensorFilter not found"); return; }
    sel.innerHTML = '<option value="">(Todas as lixeiras)</option>';
    data.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sensor_id;
      opt.textContent = s.nome ? `${s.nome} (${s.sensor_id})` : s.sensor_id;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error("populateSensorFilter error:", err);
  }
}

/* ---------- Map / Table ---------- */
function clearMap(){
  const c = document.getElementById('mapContainer');
  if (!c) return;
  c.innerHTML = '<div class="no-address" id="noAddressMsg">Selecione um sensor ou clique em "Ver mapa" em uma linha.</div>';
}

function showMapFor(address){
  const c = document.getElementById('mapContainer');
  if(!c) return;
  if(!address){ clearMap(); return; }
  const url = mapEmbedUrlFor(address);
  c.innerHTML = `<iframe class="map" src="${url}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

function updateTable(rows){
  const tbody = document.querySelector("#dataTable tbody");
  if (!tbody) { log("updateTable: tbody not found"); return; }
  tbody.innerHTML = "";
  const ordered = rows.slice();
  ordered.forEach(r => {
    const p = r.fill_percent;
    const badgeClass = (p === null || p === undefined) ? 'badge green' : (p >= 80 ? 'badge red' : (p >= 50 ? 'badge orange' : 'badge green'));
    const row = document.createElement('tr');
    const enderecoText = r.endereco ? r.endereco : '—';

    row.innerHTML = `
      <td data-label="Lixeira">${r.sensor_id || ''}</td>
      <td data-label="Nome">${r.nome || ''}</td>
      <td data-label="Endereço" title="${enderecoText}" style="max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${enderecoText}</td>
      <td data-label="Distância Medida">${r.distance || ''}</td>
      <td data-label="Preenchimento da Lixeira"><span class="${badgeClass}">${p === null ? '—' : p + '%'}</span></td>
      <td data-label="Data/Hora">${r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
      <td class="actions-cell" data-label="Ações">
        <div class="actions">
          <button class="link-btn" data-address="${encodeURIComponent(enderecoText)}">Ver mapa</button>
          <button class="link-btn" data-open="${encodeURIComponent(enderecoText)}">Abrir no Maps</button>
        </div>
      </td>
    `;

    const btnMap = row.querySelector('button[data-address]');
    if (btnMap) btnMap.addEventListener('click', (ev) => {
      const a = decodeURIComponent(ev.currentTarget.getAttribute('data-address'));
      if(a && a !== '—') showMapFor(a); else alert('Endereço não disponível para este registro.');
    });

    const btnOpen = row.querySelector('button[data-open]');
    if (btnOpen) btnOpen.addEventListener('click', (ev) => {
      const a = decodeURIComponent(ev.currentTarget.getAttribute('data-open'));
      if(a && a !== '—') window.open(mapOpenUrlFor(a), '_blank'); else alert('Endereço não disponível para este registro.');
    });

    tbody.appendChild(row);
  });
}

/* ---------- UI actions ---------- */
async function refresh(){
  try {
    const sensorEl = document.getElementById('sensorFilter');
    const sensor = sensorEl ? sensorEl.value : "";
    const data = await fetchData(sensor);
    updateTable(data);
  } catch (e) { console.error("refresh error:", e); }
}

/* ---------- sendAlert -> chama Apps Script ---------- */
async function sendAlert(threshold = ALERT_THRESHOLD_DEFAULT) {
  const form = new URLSearchParams();
  form.append("api_key", APPS_SCRIPT_KEY);
  form.append("threshold", String(threshold));
  form.append("client_ts", new Date().toISOString());

  try {
    log("[sendAlert] enviando form to", APPS_SCRIPT_URL, "threshold=", threshold);
    // Usamos no-cors para evitar preflight; o Apps Script executará mesmo que não possamos ler a resposta.
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: form.toString()
    });
    alert("✅ Alerta enviado. Verifique o e-mail cadastrado para obter a rota otimizada de coleta!");
  } catch (err) {
    console.error("sendAlert erro:", err);
    alert("Erro ao tentar enviar alerta: " + (err && err.message ? err.message : err));
  }
}

/* ---------- attach listeners com guardas e logs ---------- */
function safeAttachListeners() {
  try {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn && !refreshBtn.dataset.listenerAttached) {
      refreshBtn.addEventListener('click', () => refresh());
      refreshBtn.dataset.listenerAttached = "1";
      log("listener -> #refreshBtn");
    } else if (!refreshBtn) log("#refreshBtn não encontrado");

    const sensorFilter = document.getElementById('sensorFilter');
    if (sensorFilter && !sensorFilter.dataset.listenerAttached) {
      sensorFilter.addEventListener('change', () => {
        const val = sensorFilter.value;
        if (val) {
          (async ()=>{
            try {
              const url = SUPABASE_HOST + "/rest/v1/lixeiras?select=endereco&sensor_id=eq." + encodeURIComponent(val) + "&limit=1";
              const res = await fetch(url, { headers: { "apikey": ANON_KEY, "Authorization": "Bearer " + ANON_KEY }});
              if (res.ok) {
                const arr = await res.json();
                if (arr && arr.length > 0 && arr[0].endereco) showMapFor(arr[0].endereco);
                else clearMap();
              } else clearMap();
            } catch(e){ clearMap(); console.error("sensorFilter change fetch error:", e); }
          })();
        } else {
          clearMap();
        }
        refresh();
      });
      sensorFilter.dataset.listenerAttached = "1";
      log("listener -> #sensorFilter");
    } else if (!sensorFilter) log("#sensorFilter não encontrado");

    const sendBtn = document.getElementById('sendAlertBtn');
    if (sendBtn && !sendBtn.dataset.listenerAttached) {
      sendBtn.addEventListener('click', () => {
        sendBtn.disabled = true;
        const original = sendBtn.textContent;
        sendBtn.textContent = 'Enviando...';
        sendAlert(ALERT_THRESHOLD_DEFAULT).finally(() => {
          setTimeout(()=>{ sendBtn.disabled = false; sendBtn.textContent = original; }, 1200);
        });
      });
      sendBtn.dataset.listenerAttached = "1";
      log("listener -> #sendAlertBtn");
    } else if (!sendBtn) log("#sendAlertBtn não encontrado");

  } catch (err) {
    console.error("safeAttachListeners error:", err);
  }
}

/* ---------- inicialização segura ---------- */
document.addEventListener("DOMContentLoaded", () => {
  log("DOMContentLoaded fired");
  safeAttachListeners();
  populateSensorFilter().then(() => {
    refresh();
    clearMap();
  }).catch(e => { console.error("populateSensorFilter error:", e); });
  // polling (verifica se já existe um interval para evitar duplicação)
  if (!window.__lixeiras_polling_interval) {
    window.__lixeiras_polling_interval = setInterval(refresh, 5000);
  }
});
