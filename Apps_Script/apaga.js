function apagarDados() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abas = planilha.getSheets(); // Obtém todas as abas na planilha
  var colunasParaApagar = [1, 2, 5, 6, 9, 10]; // Colunas A, B, E, F, I e J (1, 2, 5, 6, 9 e 10, respectivamente)
  var linhaInicial = 2; // A partir da segunda linha

  // Itera por todas as abas
  for (var i = 0; i < abas.length; i++) {
    var aba = abas[i];
    
    // Apaga os dados nas colunas especificadas a partir da segunda linha
    for (var j = 0; j < colunasParaApagar.length; j++) {
      aba.getRange(linhaInicial, colunasParaApagar[j], aba.getLastRow() - linhaInicial + 1).clearContent();
    }
  }

  /*
  // Agendamento para executar novamente após o intervalo de tempo
  ScriptApp.newTrigger("apagarDados")
           .timeBased()
           .everyWeeks(2)
           .create();
  */
}
