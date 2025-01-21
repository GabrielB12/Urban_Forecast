function doGet(e) { 
  Logger.log( JSON.stringify(e) );  // view parameters
  var result = 'Ok'; // assume success
  if (e.parameter == 'undefined') {
    result = 'No Parameters';
  }
  else {
    var sheet_id = '1ZsOUdF7bzeW8IJ9J_Gn49Q4jJlVpj8984DU1bjNQNGI'; 		// Spreadsheet ID
    var sheet = SpreadsheetApp.openById(sheet_id).getActiveSheet();		// get Active sheet
    var newRow = sheet.getLastRow() + 1;						
    var rowData = [];
     											// Timestamp in column A
    for (var param in e.parameter) {
      Logger.log('In for loop, param=' + param);
      var value = stripQuotes(e.parameter[param]);
      Logger.log(param + ':' + e.parameter[param]);
      switch (param) {
        case 'Distance': //Parameter
          rowData[0] = new Date();
          rowData[1] = value; //Value in column B
          result = 'Written on column B';
          break;
        case 'Distance2': //Parameter
          rowData[4] = new Date();  
          rowData[5] = value; //Value in column F
          result += ' ,Written on column C';
          break; 
        case 'Distance3': //Parameter
          rowData[8] = new Date();  
          rowData[9] = value; //Value in column J
          result += ' ,Written on column C';
          break;
        case 'humidity': //Parameter
          rowData[2] = value; //Value in column C
          result += ' ,Written on column C';
          break;  
        default:
          result = "unsupported parameter";
      }
    }
    Logger.log(JSON.stringify(rowData));
    // Write new row below
    var newRange = sheet.getRange(newRow, 1, 1, rowData.length);
    newRange.setValues([rowData]);
  }
  // Return result of operation
  return ContentService.createTextOutput(result);
}
/**
* Remove leading and trailing single or double quotes
*/
function stripQuotes( value ) {
  return value.replace(/^["']|['"]$/g, "");
}
