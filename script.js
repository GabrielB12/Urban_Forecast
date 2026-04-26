/* script.js (client-only) - versão com remoção direta via Supabase REST
   - Requer que a ANON_KEY permita DELETE na tabela (ver notas).
   - Ajuste TABLE_NAME para o nome real da tabela onde estão as leituras (não a view).
*/

const SUPABASE_HOST = "https://zitresvvjiondhgiuqal.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdHJlc3Z2amlvbmRoZ2l1cWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI2MjksImV4cCI6MjA3NzcyODYyOX0.Z_cBFBjyLF77pkVAnd5xMaNM7YX3bdZmqjMUOMZHI9k";

/* APPS SCRIPT CONFIG (opcional — usado apenas para sendAlert no seu fluxo original) */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbza4WQXC5yHejMkn8x5t-Kvgo9FPE4KdH3Igow-Pthg88lOeHfjN1hIuGxLy8RJLxiP/exec";
const APPS_SCRIPT_KEY = "teste123";
const ALERT_THRESHOLD_DEFAULT = 70;

/* --- CONFIG para deletar localmente --- */
const TABLE_NAME = 'distancias'; // <--- ajuste aqui para a tabela real que contém as leituras (não a view)
const MAX_CONCURRENT_DELETES = 4; // throttle simples (opcional)

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

/* updateTable: agora inclui checkbox como primeira coluna */
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
    const createdAtRaw = r.created_at || '';

    row.innerHTML = `
      <td data-label="Selecionar">
        <input type="checkbox" class="row-select" data-sensor="${encodeURIComponent(r.sensor_id || '')}" data-created="${encodeURIComponent(createdAtRaw)}" />
      </td>
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
      if(a && a !== '—') window.open(mapOpenUrlFor(a), '_blank');
      else alert('Endereço não disponível para este registro.');
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

/* ===================== Deleção diretamente no Supabase (client-only) ===================== */
/* Atenção: só use se sua anon key permitir DELETE. Recomendo testar em dev. */

/**
 * Deleta um registro via Supabase REST usando sensor_id + created_at como filtro.
 * Retorna { ok, status, text }.
 * Se você tiver um PK (id), prefira deletar por id.
 */
async function supabaseDeleteRecord(sensor, created_at) {
  // Monta URL para o DELETE
  const base = SUPABASE_HOST.replace(/\/$/, '') + '/rest/v1/' + TABLE_NAME;
  let url = base + '?';
  const s = sensor || '';
  const c = created_at || '';
  if (c) {
    url += 'sensor_id=eq.' + encodeURIComponent(s) + '&created_at=eq.' + encodeURIComponent(c);
  } else {
    url += 'sensor_id=eq.' + encodeURIComponent(s);
  }

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text: text };
  } catch (err) {
    console.error('supabaseDeleteRecord exception', err);
    return { ok: false, status: 0, text: String(err) };
  }
}

/**
 * Deleta vários registros sequencialmente (pode ser trocado por concorrência controlada).
 * Retorna { deleted: n, details: [...] }.
 */
async function supabaseDeleteReadings(entries) {
  if (!entries || entries.length === 0) return { deleted: 0, details: [] };

  const details = [];
  // processa em lotes para não sobrecarregar o servidor
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const r = await supabaseDeleteRecord(e.sensor, e.created);
    details.push(r);
  }
  const deleted = details.filter(x => x.ok).length;
  return { deleted: deleted, details: details };
}

/* UI wrappers */

/** coletar checkboxes marcados e deletar via Supabase (cliente) */
async function deleteSelectedClient() {
  const checks = Array.from(document.querySelectorAll('input.row-select:checked'));
  if (!checks.length) { alert('Nenhum registro selecionado.'); return; }
  if (!confirm('Remover ' + checks.length + ' leituras selecionadas? Esta ação não pode ser desfeita.')) return;

  const entries = checks.map(c => ({ sensor: decodeURIComponent(c.getAttribute('data-sensor')), created: decodeURIComponent(c.getAttribute('data-created')) }));

  const btn = document.getElementById('deleteSelectedBtn');
  if (btn) { btn.disabled = true; var originalText = btn.textContent; btn.textContent = 'Removendo...'; }
  try {
    const res = await supabaseDeleteReadings(entries);
    console.log('deleteSelectedClient result:', res);
    alert('Remoção concluída. Registros deletados (aprox): ' + res.deleted + '. Veja console para detalhes.');
    await refresh();
  } catch (err) {
    console.error('deleteSelectedClient error', err);
    alert('Erro ao remover registros. Veja console para detalhes.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
  }
}

/** Deletar todas as leituras (chamada perigosa) */
async function deleteAllClient() {
  if (!confirm('Remover *todas* as leituras? Esta ação é irreversível.')) return;
  const btn = document.getElementById('deleteAllBtn');
  if (btn) { btn.disabled = true; var originalText = btn.textContent; btn.textContent = 'Removendo todas...'; }
  try {
    const url = SUPABASE_HOST.replace(/\/$/, '') + '/rest/v1/' + TABLE_NAME;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    const text = await res.text();
    if (res.ok) {
      alert('Tentativa de remoção de todas as leituras enviada com sucesso.');
    } else {
      console.error('deleteAllClient failed', res.status, text);
      alert('Falha ao remover todas as leituras: ' + res.status + '. Veja console para detalhes.');
    }
    await refresh();
  } catch (err) {
    console.error('deleteAllClient exception', err);
    alert('Erro ao remover todas as leituras. Veja console.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
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
        fetchPrevisao(val);
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

    // listeners para deleção (se botões existirem no HTML)
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn && !deleteSelectedBtn.dataset.listenerAttached) {
      deleteSelectedBtn.addEventListener('click', () => deleteSelectedClient());
      deleteSelectedBtn.dataset.listenerAttached = "1";
      log("listener -> #deleteSelectedBtn");
    }

    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn && !deleteAllBtn.dataset.listenerAttached) {
      deleteAllBtn.addEventListener('click', () => deleteAllClient());
      deleteAllBtn.dataset.listenerAttached = "1";
      log("listener -> #deleteAllBtn");
    }

  } catch (err) {
    console.error("safeAttachListeners error:", err);
  }
}

// async function fetchPrevisao(sensor) {

//     const box = document.getElementById("previsaoBox");
  
//     if (!sensor) {
//       box.innerHTML = "Selecione uma lixeira para ver previsão.";
//       return;
//     }
  
//     try {
  
//       await fetch(SUPABASE_HOST + "/rest/v1/rpc/calcular_previsao", {
//         method: "POST",
//         headers: {
//           "apikey": ANON_KEY,
//           "Authorization": "Bearer " + ANON_KEY,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           sensor: sensor,
//           threshold_input: 90
//         })
//       });
  
//       const res = await fetch(
//         SUPABASE_HOST + "/rest/v1/previsoes?select=*&sensor_id=eq." +
//         encodeURIComponent(sensor) +
//         "&order=created_at.desc&limit=1",
//         {
//           headers: {
//             "apikey": ANON_KEY,
//             "Authorization": "Bearer " + ANON_KEY
//           }
//         }
//       );
  
//       if (!res.ok) {
//         box.innerHTML = "Erro ao buscar previsão.";
//         return;
//       }
  
//       const data = await res.json();
  
//       if (!data.length) {
//         box.innerHTML = "Sem dados suficientes para previsão.";
//         return;
//       }
  
//       const p = data[0];
  
//       box.innerHTML = `
//         <b>Nível atual:</b> ${p.nivel_atual}%<br>
//         <b>Taxa média:</b> ${Number(p.taxa_media).toFixed(2)}%/h<br>
//         <b>Horas restantes:</b> ${Number(p.horas_restantes).toFixed(2)}h<br>
//         <b>Data estimada:</b> ${new Date(p.data_prevista).toLocaleString()}
//       `;
  
//     } catch (err) {
//       box.innerHTML = "Erro ao calcular previsão.";
//       console.error(err);
//     }
// }

async function fetchPrevisao(sensor) {

  console.log("🔥 Chamando API com sensor:", sensor);

  const box = document.getElementById("previsaoBox");

  if (!sensor) {
    box.innerHTML = "Selecione uma lixeira.";
    return;
  }

  try {

    console.log("➡️ Enviando request...");

    const res = await fetch("https://site-lixeira-1.onrender.com/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sensor_id: sensor
      })
    });

    console.log("⬅️ Resposta recebida:", res.status);


    const data = await res.json();

    console.log("📦 Dados:", data);

    if (!res.ok || !data) {
      box.innerHTML = "Erro na previsão.";
      return;
    }

    box.innerHTML = `
      <b>Nível atual:</b> ${data.nivel_atual}%<br>
      <b>Taxa média:</b> ${data.taxa_media.toFixed(2)}%/h<br>
      <b>Horas restantes:</b> ${data.horas_restantes.toFixed(2)}h<br>
      <b>Data estimada:</b> ${new Date(data.data_prevista).toLocaleString()}
    `;

  } catch (err) {
    console.error(err);
    box.innerHTML = "Erro ao conectar com a API.";
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
  // polling
  if (!window.__lixeiras_polling_interval) {
    window.__lixeiras_polling_interval = setInterval(refresh, 5000);
  }
});
