function checkSensorValue() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var cell = sheet.getRange("D2"); // célula que deseja monitorar.

  var paradas = [];

  var tipoAviso;

  var lixeiras70 = [];
  var lixeiras90 = [];

  var celulas = [
    sheet.getRange("D2"), sheet.getRange("H2"), sheet.getRange("L2")
  ];

  // Verifique se os valores nas células são maiores do que 80 e adicione os endereços correspondentes
  for (var i = 0; i < celulas.length; i++) {
    var valorCelula = celulas[i].getValue();
    tipoAviso = "O preenchimento das lixeiras ultrapassou o limite estabelecido.\n";
    if (valorCelula > 70) {
      var endereco = sheet.getRange(celulas[i].getRow() + 1, celulas[i].getColumn()).getValue();
      lixeiras70.push(endereco);
      paradas.push(endereco);
    }
    if (valorCelula > 90) {
      var endereco = sheet.getRange(celulas[i].getRow() + 1, celulas[i].getColumn()).getValue();
      lixeiras90.push(endereco);
      paradas.push(endereco);
    }
  }

  // Use um loop for para percorrer os elementos de lixeiras70
  /*
for (var i = 0; i < lixeiras70.length; i++) {
  var valor = lixeiras70[i];
  
  // Verifique se o valor está presente em lixeiras90
  if (lixeiras90.indexOf(valor) !== -1) {
    // Se estiver presente, remova-o de lixeiras70 usando filter
    lixeiras70 = lixeiras70.filter(function(item) {
      return item !== valor;
    });
  }
}
*/

// Use um loop for para percorrer os elementos de lixeiras90 e remova-os de lixeiras70
for (var i = 0; i < lixeiras90.length; i++) {
  var valor = lixeiras90[i];

  // Verifique se o valor está presente em lixeiras70
  if (lixeiras70.indexOf(valor) !== -1) {
    // Se estiver presente, remova-o de lixeiras70 usando splice
    var index = lixeiras70.indexOf(valor);
    lixeiras70.splice(index, 1);
  }
}

  var origem = 'Rua Doutor Flavio Americo Maurano, 450, Morumbi, Sao Paulo, SP';
  var destino = 'Rua Doutor Flavio Americo Maurano, 450, Morumbi, Sao Paulo, SP';



/*
var origem = 'Rua Doutor Flavio Americo Maurano, 450, Morumbi, Sao Paulo, SP';
  var destino = 'Rua Doutor Flavio Americo Maurano, 450, Morumbi, Sao Paulo, SP';
  var parada2 = 'Avenida Morumbi, 6340, Morumbi, Sao Paulo, SP';
  var parada1 = 'Cerro Cora, 914, Vila Madalena, Sao Paulo, SP';
  var parada3 = 'Avenida Pompeia, 1308, Pompeia, Sao Paulo, SP';
*/

  if (paradas.length > 0) {
    var link = calcularMelhorRota(origem, destino, paradas);
    var recipient = "gabrielbianchi12@hotmail.com";
    var destinatario = "gabrielbianchi12@hotmail.com";
    var subject = "Alerta: Lixeira cheia!";
    var assunto = "Alerta: Lixeira cheia!";
    var mensagem = tipoAviso + "\n";
    //var message = tipoAviso + " As lixeiras em " + "Segue link com o caminho otimizado: " + link;
    Logger.log(lixeiras70);
    if(lixeiras70.length != 0){
      Logger.log("aaaaaaa");
    }
    
    if(lixeiras70 != 0){
      mensagem += "\nAs lixeiras em " + lixeiras70 + " possuem mais do que 70% de preenchimento.\n\n";
    }
    

    if (lixeiras90 != 0){
      mensagem += "\nAs lixeiras em: " + lixeiras90 + " possuem mais de 90% de preenchimento.\n"
    }

    var mensagemHTML = mensagem + '<p>Clique no link para acessar a -> <a href="' + link + '">Rota Otimizada</a></p>';

    //mensagem += "\n\nSegue link com o caminho otimizado: " + link
    //MailApp.sendEmail(recipient, subject, mensagem);
    MailApp.sendEmail(destinatario, assunto, mensagem, {
    htmlBody: mensagemHTML
  });
  }
}

function calcularMelhorRota(origem, destino, paradas) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getActiveSheet();
  //aba.getRange('L2').clearContent();

  // chave de API do Google Maps
  var apiKey = 'AIzaSyDhIP5St7DGih-hn_1PD6k9dM3xn1-2PYw';

  var waypoints = 'optimize:true|' + paradas.join('|');
  var url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + origem +
          '&destination=' + destino +
          '&waypoints=' + waypoints +
          '&key=' + apiKey;

  var urlEncoded = encodeURI(url);
  //Logger.log(url);
  var response = UrlFetchApp.fetch(urlEncoded);
  var data = JSON.parse(response.getContentText());

  if (data.status === 'OK') {
    var waypointOrder = data.routes[0].waypoint_order;

    var waypointsOrdenados = [];
    waypointsOrdenados.push(origem);
    for (var i = 0; i < waypointOrder.length; i++) {
      waypointsOrdenados.push(data.routes[0].legs[waypointOrder[i]].end_address);
    }
    waypointsOrdenados.push(destino);

    var mapUrl = 'https://www.google.com/maps/dir/?api=1&origin=' + origem +
                 '&waypoints=' + waypointsOrdenados.join('|') + '&destination=' + destino +
                 '&travelmode=driving';

    aba.getRange('M2').setValue(mapUrl);

    //Logger.log('Link para a rota otimizada: ' + mapUrl);
    return mapUrl;
  } else {
    Logger.log('Erro ao calcular a rota: ' + data.status);
    return null;
  }
}
