/* app.js
   Substitua SUPABASE_HOST e ANON_KEY pelos seus valores.
   Coloque este arquivo na mesma pasta do index.html e styles.css.
*/

const SUPABASE_HOST = "https://zitresvvjiondhgiuqal.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdHJlc3Z2amlvbmRoZ2l1cWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI2MjksImV4cCI6MjA3NzcyODYyOX0.Z_cBFBjyLF77pkVAnd5xMaNM7YX3bdZmqjMUOMZHI9k";

function mapEmbedUrlFor(address){
  if(!address) return "";
  return "https://www.google.com/maps?q=" + encodeURIComponent(address) + "&output=embed";
}
function mapOpenUrlFor(address){
  if(!address) return "";
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
}

async function fetchData(sensor_id = "") {
  let url = SUPABASE_HOST + "/rest/v1/v_distancias_com_fill?select=*&order=created_at.desc&limit=100";
  if (sensor_id) url += "&sensor_id=eq." + encodeURIComponent(sensor_id);
  const res = await fetch(url, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": "Bearer " + ANON_KEY,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    console.error("Erro:", res.status, await res.text());
    return [];
  }
  return await res.json();
}

async function populateSensorFilter(){
  const url = SUPABASE_HOST + "/rest/v1/lixeiras?select=sensor_id,nome&order=nome";
  const res = await fetch(url, {
    headers: { "apikey": ANON_KEY, "Authorization": "Bearer " + ANON_KEY }
  });
  if (!res.ok) return;
  const data = await res.json();
  const sel = document.getElementById('sensorFilter');
  sel.innerHTML = '<option value="">(Todos)</option>';
  data.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.sensor_id;
    opt.textContent = s.nome ? `${s.nome} (${s.sensor_id})` : s.sensor_id;
    sel.appendChild(opt);
  });
}

function clearMap(){
  const c = document.getElementById('mapContainer');
  c.innerHTML = '<div class="no-address" id="noAddressMsg">Selecione um sensor ou clique em "Ver mapa" em uma linha.</div>';
}

function showMapFor(address){
  const c = document.getElementById('mapContainer');
  if(!address){
    clearMap();
    return;
  }
  const url = mapEmbedUrlFor(address);
  c.innerHTML = `<iframe class="map" src="${url}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

function updateTable(rows){
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";
  const ordered = rows.slice(); // já vem do mais recente
  for(const r of ordered){
    const p = r.fill_percent;
    const badgeClass = (p === null || p === undefined) ? 'badge green' : (p >= 80 ? 'badge red' : (p >= 50 ? 'badge orange' : 'badge green'));
    const row = document.createElement('tr');

    const enderecoText = r.endereco ? r.endereco : '—';

    // Para responsividade: adicionamos data-label em cada td
    row.innerHTML = `
      <td data-label="Sensor">${r.sensor_id || ''}</td>
      <td data-label="Nome">${r.nome || ''}</td>
      <td data-label="Endereço" title="${enderecoText}" style="max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${enderecoText}</td>
      <td data-label="Distance">${r.distance}</td>
      <td data-label="Preenchimento"><span class="${badgeClass}">${p === null ? '—' : p + '%'}</span></td>
      <td data-label="Timestamp">${r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
      <td class="actions-cell" data-label="Ações">
        <div class="actions">
          <button class="link-btn" data-address="${encodeURIComponent(enderecoText)}">Ver mapa</button>
          <button class="link-btn" data-open="${encodeURIComponent(enderecoText)}">Abrir no Maps</button>
        </div>
      </td>
    `;

    const btnMap = row.querySelector('button[data-address]');
    btnMap.addEventListener('click', (ev) => {
      const a = decodeURIComponent(ev.currentTarget.getAttribute('data-address'));
      if(a && a !== '—') showMapFor(a);
      else alert('Endereço não disponível para este registro.');
    });

    const btnOpen = row.querySelector('button[data-open]');
    btnOpen.addEventListener('click', (ev) => {
      const a = decodeURIComponent(ev.currentTarget.getAttribute('data-open'));
      if(a && a !== '—') window.open(mapOpenUrlFor(a), '_blank');
      else alert('Endereço não disponível para este registro.');
    });

    tbody.appendChild(row);
  }
}

async function refresh(){
  const sensor = document.getElementById('sensorFilter').value;
  const data = await fetchData(sensor);
  updateTable(data);
}

document.getElementById('refreshBtn').addEventListener('click', () => refresh());

document.getElementById('sensorFilter').addEventListener('change', () => {
  const sel = document.getElementById('sensorFilter');
  const val = sel.value;
  if(val){
    (async ()=>{
      const url = SUPABASE_HOST + "/rest/v1/lixeiras?select=endereco&sensor_id=eq." + encodeURIComponent(val) + "&limit=1";
      const res = await fetch(url, { headers: { "apikey": ANON_KEY, "Authorization": "Bearer " + ANON_KEY }});
      if(res.ok){
        const arr = await res.json();
        if(arr && arr.length > 0 && arr[0].endereco) showMapFor(arr[0].endereco);
        else clearMap();
      } else {
        clearMap();
      }
    })();
  } else {
    clearMap();
  }
  refresh();
});

/* ===== CONFIG PARA CHAMAR O APPS SCRIPT (AJUSTE SE NECESSÁRIO) ===== */
// URL do seu Web App (deploy -> Web app -> URL /exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQyVCEwUXy5JT7irpWE0orFPJhk6G5xwMF-79w9dU6g7PW5sljQOxTj8Ljx_lwNbPw/exec";
// chave que seu Apps Script verifica (se estiver usando validação)
const APPS_SCRIPT_KEY = "teste123";
// Threshold padrão (pode passar outro ao chamar)
const ALERT_THRESHOLD_DEFAULT = 70;
/* ================================================================== */

/**
 * sendAlert(threshold)
 * - Faz POST simples (form-encoded) para o Apps Script
 * - Usa mode: "no-cors" para evitar preflight OPTIONS/405
 * - NÃO permite ler a resposta do servidor (navegador bloqueia),
 *   mas o Apps Script vai executar e você verá logs/executions no editor do Apps Script.
 */
async function sendAlert(threshold = ALERT_THRESHOLD_DEFAULT) {
  // preparar payload (form-encoded)
  const form = new URLSearchParams();
  form.append("api_key", APPS_SCRIPT_KEY);
  form.append("threshold", String(threshold));

  // adiciona um timestamp opcional para debugging
  form.append("client_ts", new Date().toISOString());

  try {
    // no-cors evita preflight OPTIONS, mas bloqueia leitura de resposta
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        // NÃO colocar Content-Type: application/json aqui, queremos form-encoded simples
        // deixe o browser setar o content-type para application/x-www-form-urlencoded;charset=UTF-8
      },
      body: form.toString()
    });

    // Aviso amigável ao usuário
    alert("✅ Alerta enviado. O servidor (Apps Script) deve processar e enviar os emails. Verifique os logs no Apps Script se necessário.");
  } catch (err) {
    // normalmente não chega aqui em no-cors, mas deixo fallback
    console.error("Erro ao enviar alerta:", err);
    alert("Erro ao tentar enviar alerta: " + (err && err.message ? err.message : err));
  }
}

/* --- anexa listener no botão --- */
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendAlertBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      // opcional: pegar threshold de entrada do usuário; aqui usa padrão 70
      sendBtn.disabled = true;
      const original = sendBtn.textContent;
      sendBtn.textContent = "Enviando...";
      sendAlert(ALERT_THRESHOLD_DEFAULT).finally(() => {
        setTimeout(() => { sendBtn.disabled = false; sendBtn.textContent = original; }, 1200);
      });
    });
  }
});


/* inicialização */
populateSensorFilter().then(() => {
  refresh();
  clearMap();
});

/* polling */
setInterval(refresh, 5000);
