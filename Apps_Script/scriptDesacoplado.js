/**
 * envioEmailRota(threshold)
 *
 * - Busca registros em v_distancias_com_fill
 * - Agrupa por sensor_id e mantém somente o registro com maior created_at por sensor
 * - Filtra por fill_percent >= threshold
 * - Monta rota otimizada (Google Maps) usando "endereco" e com base fixa
 * - Envia email HTML para DEFAULT_RECIPIENTS (ou recipientsProp aqui)
 *
 * Uso: envioEmailRota(); // usa threshold default
 *       envioEmailRota(70);
 */
function envioEmailRota(threshold) {
  try {
    var SUPABASE_HOST = "https://zitresvvjiondhgiuqal.supabase.co";
    var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdHJlc3Z2amlvbmRoZ2l1cWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI2MjksImV4cCI6MjA3NzcyODYyOX0.Z_cBFBjyLF77pkVAnd5xMaNM7YX3bdZmqjMUOMZHI9k";
    var recipientsProp = 'gabrielbianchi12@hotmail.com'; // pode deixar aqui ou vir de Script Properties
    var defaultThreshold = 70;

    if (!SUPABASE_HOST || !SUPABASE_KEY) {
      Logger.log('Erro: configure SUPABASE_HOST e SUPABASE_KEY nas Script Properties.');
      return;
    }

    threshold = (typeof threshold === 'number' && !isNaN(threshold)) ? threshold : defaultThreshold;
    Logger.log('envioEmailRota: threshold = %s', threshold);

    // --- Buscar muitos registros (limite ajustável) ---
    var endpoint = SUPABASE_HOST.replace(/\/$/, '') + '/rest/v1/v_distancias_com_fill';
    var select = '?select=sensor_id,nome,endereco,fill_percent,created_at,email_responsavel';
    var url = endpoint + select + '&order=created_at.desc&limit=1000'; // ajustar limit se precisar

    Logger.log('Fetching Supabase URL: %s', url);

    var resp = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Accept': 'application/json'
      }
    });

    var status = resp.getResponseCode();
    var text = resp.getContentText();
    Logger.log('Supabase response code: %s', status);

    if (status < 200 || status >= 300) {
      Logger.log('Erro ao consultar Supabase: %s', text);
      return;
    }

    var rows = JSON.parse(text || '[]');
    Logger.log('rows fetched: %d', rows.length);

    if (!rows || rows.length === 0) {
      Logger.log('Nenhum registro retornado da view. Abortando.');
      return;
    }

    // --- Agrupar por sensor_id mantendo o registro mais recente (created_at) ---
    var latestBySensor = {}; // sensor_id -> registro
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var sid = (r.sensor_id || '').toString();
      if (!sid) continue; // pular registros sem sensor_id
      var ts = parseCreatedAtToMillis(r.created_at);
      if (!latestBySensor[sid]) {
        latestBySensor[sid] = r;
        latestBySensor[sid]._ts = ts;
      } else {
        var existingTs = latestBySensor[sid]._ts || 0;
        if (ts > existingTs) {
          latestBySensor[sid] = r;
          latestBySensor[sid]._ts = ts;
        }
      }
    }

    // Converte mapa para array de registros mais recentes
    var latestRecords = [];
    for (var key in latestBySensor) {
      if (latestBySensor.hasOwnProperty(key)) {
        var rec = latestBySensor[key];
        if (rec._ts) delete rec._ts;
        latestRecords.push(rec);
      }
    }

    Logger.log('latestRecords count (unique sensors): %d', latestRecords.length);

    // --- Filtrar por threshold usando fill_percent ---
    var filled = latestRecords.filter(function (x) {
      return x.fill_percent != null && Number(x.fill_percent) >= threshold;
    });

    Logger.log('filled after threshold: %d', filled.length);

    if (!filled || filled.length === 0) {
      Logger.log('Nenhuma lixeira acima de ' + threshold + '%. Nada a enviar.');
      return;
    }

    // --- Monta corpo do email (texto + HTML) e lista de waypoints (endereços) ---
    var plainLines = [];
    plainLines.push('Lixeiras com preenchimento >= ' + threshold + '%:');
    plainLines.push('');
    var htmlLines = [];
    htmlLines.push('<h3>Lixeiras com preenchimento ≥ ' + threshold + '%</h3>');
    htmlLines.push('<ul>');

    var waypoints = [];

    for (var j = 0; j < filled.length; j++) {
      var item = filled[j];
      var nome = (item.nome || item.sensor_id || ('Lixeira ' + (j + 1))).toString();
      var fill = (item.fill_percent == null) ? '—' : (item.fill_percent + '%');
      var endereco = (item.endereco || '').toString().trim();

      // texto plano
      var plainLine = '- ' + nome + ' Localizada em: ' + (endereco ? (' — ' + endereco) : '') + ' — Nível de preenchimento: ' + fill;
      plainLines.push(plainLine);

      // HTML
      var htmlLine = '<li><strong>' + escapeHtml(nome) + '</strong>';
      htmlLine += ' — ' + escapeHtml(fill);
      if (endereco) htmlLine += ' — ' + escapeHtml(endereco);
      htmlLine += '</li>';
      htmlLines.push(htmlLine);

      if (endereco) waypoints.push(endereco);
    }

    htmlLines.push('</ul>');

    // ========================================
    // CONFIGURAÇÃO: endereço base fixo
    // ========================================
    const BASE_ADDRESS = "Doutor Flávio Américo Maurano, 450, Fazenda Morumbi, São Paulo, SP";
    // troque para o endereço que quiser ↑↑↑
    // ========================================

    // --- Monta rota otimizada no Google Maps ---
    var routeUrl = '';
    if (!waypoints.length) {
      routeUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(BASE_ADDRESS);
    } else {
      var origin = BASE_ADDRESS;
      var destination = BASE_ADDRESS;
      var joined = 'optimize:true|' + waypoints.join('|');
      var waypointsParam = '&waypoints=' + encodeURIComponent(joined);
      routeUrl = 'https://www.google.com/maps/dir/?api=1'
        + '&origin=' + encodeURIComponent(origin)
        + '&destination=' + encodeURIComponent(destination)
        + waypointsParam;
    }

    // adiciona link no HTML
    htmlLines.push('<p><b>Rota otimizada:</b> <a href="' + routeUrl + '" target="_blank">Rota Otimizada</a></p>');

    plainLines.push('');
    plainLines.push('Abrir rota otimizada no Google Maps:');
    plainLines.push(routeUrl);

    var plainBody = plainLines.join('\n');
    var htmlBody = htmlLines.join('\n');

    // --- Destinatários ---
    var recipients = [];
    if (recipientsProp && recipientsProp.length) {
      recipients = recipientsProp.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
    }
    if (!recipients || recipients.length === 0) {
      Logger.log('Nenhum destinatário configurado em DEFAULT_RECIPIENTS. Abortando envio.');
      return;
    }

    // --- Envia email com htmlBody + fallback plain body ---
    var subject = 'Alerta: lixeiras cheias!';
    try {
      MailApp.sendEmail({
        to: recipients.join(','),
        subject: subject,
        body: plainBody,
        htmlBody: htmlBody
      });
      Logger.log('Email enviado para: %s (quantidade: %d)', recipients.join(','), recipients.length);
    } catch (mailErr) {
      Logger.log('Erro ao enviar email: %s', mailErr.toString());
      throw mailErr;
    }

  } catch (err) {
    Logger.log('Erro geral em envioEmailRota: %s', err && err.toString ? err.toString() : JSON.stringify(err));
    throw err;
  }
}

/**
 * Converte created_at (ex: "2025-11-03 14:34:59.324632+00") para timestamp em ms.
 * Retorna 0 se não for possível.
 */
function parseCreatedAtToMillis(createdAtStr) {
  try {
    if (!createdAtStr) return 0;
    // Ajusta formato substituindo espaço entre data/hora por 'T' e removendo fracionário extra se necessário
    var s = createdAtStr.toString().trim().replace(' ', 'T');
    var m = s.match(/\.(\d+)([+-].*)$/);
    if (m && m[1]) {
      var frac = m[1].substring(0, 3); // pegar até 3 dígitos
      s = s.replace(/\.\d+([+-].*)$/, '.' + frac + m[2]);
    }
    var d = new Date(s);
    var t = d.getTime();
    if (isNaN(t)) return 0;
    return t;
  } catch (e) {
    return 0;
  }
}

/** Pequena função utilitária para escapar texto em HTML */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * doPost: wrapper que recebe POSTs do front-end e chama envioEmailRota(threshold)
 * Aceita body form-encoded (application/x-www-form-urlencoded) ou JSON.
 * Espera api_key no body (ou e.parameter.api_key).
 */
function doPost(e) {
  try {
    envioEmailRota();
  } catch (err) {
    Logger.log("doPost wrapper error: %s", err && err.toString ? err.toString() : JSON.stringify(err));
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) })).setMimeType(ContentService.MimeType.JSON).setCode(500);
  }
}

// opcional: responder OPTIONS para preflight (não evita 405 se Web App não aceitar)
function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.JSON);
}

