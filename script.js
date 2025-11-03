/* app.js
   Substitua SUPABASE_HOST e ANON_KEY pelos seus valores.
   Coloque este arquivo na mesma pasta do index.html e styles.css.
*/

const SUPABASE_HOST = "https://SEU_PROJETO.supabase.co"; // <<-- coloque seu host
const ANON_KEY = "SUA_ANON_KEY"; // <<-- coloque sua anon key

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

/* inicialização */
populateSensorFilter().then(() => {
  refresh();
  clearMap();
});

/* polling */
setInterval(refresh, 5000);
