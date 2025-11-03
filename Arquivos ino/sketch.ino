// esp8266_sketch_corrigido.ino
// Mova o Serial.begin antes de qualquer Serial.print
// Substitua SUPABASE_HOST / SUPABASE_ANON_KEY / SENSOR_ID se quiser

#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>

const char* ssid = "Tricolor";
const char* password = "trimundial";

const char* SUPABASE_HOST = "zitresvvjiondhgiuqal.supabase.co";
const int HTTPS_PORT = 443;
const String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdHJlc3Z2amlvbmRoZ2l1cWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI2MjksImV4cCI6MjA3NzcyODYyOX0.Z_cBFBjyLF77pkVAnd5xMaNM7YX3bdZmqjMUOMZHI9k";
const String SENSOR_ID = "Lixeira-A1";

WiFiClientSecure client;

// Pinos do HC-SR04 (use GPIO numbers: D4 -> 2, D3 -> 0)
const int trigP = 2; // GPIO2
const int echoP = 0; // GPIO0

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000; // ms

void setup() {
  Serial.begin(115200);
  delay(50);
  
  // LED interno sempre aceso
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);  // ACESO (ativo em LOW)

  Serial.println();
  Serial.println("Iniciando ESP8266 sketch (corrigido)");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Conectando WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi conectado: " + WiFi.localIP().toString());
  } else {
    Serial.println("Falha ao conectar WiFi (timeout)");
  }

  pinMode(trigP, OUTPUT);
  pinMode(echoP, INPUT);
}

void loop() {
  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL) {
    int distance = readDistance();
    Serial.println("Leitura (cm): " + String(distance));
    if (distance >= 0) {
      sendReading(distance);
    } else {
      Serial.println("Leitura inválida — pulando envio.");
    }
    lastSend = now;
  }
}

int readDistance() {
  long duration;
  digitalWrite(trigP, LOW);
  delayMicroseconds(2);
  digitalWrite(trigP, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigP, LOW);

  duration = pulseIn(echoP, HIGH, 30000); // timeout 30ms
  if (duration == 0) {
    return -1; // sem leitura válida
  }
  int distanceCm = duration * 0.034 / 2;
  return distanceCm;
}

void sendReading(int distance) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado - não envio");
    return;
  }

  client.setInsecure(); // ok para protótipo
  Serial.print("Conectando a ");
  Serial.print(SUPABASE_HOST);
  Serial.print(":");
  Serial.println(HTTPS_PORT);

  if (!client.connect(SUPABASE_HOST, HTTPS_PORT)) {
    Serial.println("Falha na conexão HTTPS");
    return;
  }

  String url = "/rest/v1/distancias";
  String body = "{\"sensor_id\":\"" + SENSOR_ID + "\",\"distance\":" + String(distance) + "}";

  client.print(String("POST ") + url + " HTTP/1.1\r\n" +
               "Host: " + SUPABASE_HOST + "\r\n" +
               "apikey: " + SUPABASE_ANON_KEY + "\r\n" +
               "Authorization: Bearer " + SUPABASE_ANON_KEY + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + String(body.length()) + "\r\n" +
               "Prefer: return=representation\r\n" +
               "Connection: close\r\n\r\n" +
               body);

  // Ler linha de status HTTP
  String statusLine = client.readStringUntil('\n');
  statusLine.trim();
  if (statusLine.length() > 0) Serial.println("Status: " + statusLine);

  // Ler headers até linha vazia
  while (client.connected()) {
    String header = client.readStringUntil('\n');
    header.trim();
    if (header.length() == 0) break;
  }

  // Ler corpo (com timeout)
  String bodyResp;
  unsigned long t0 = millis();
  while (client.available() == 0 && millis() - t0 < 2000) delay(10);
  while (client.available()) {
    bodyResp += client.readString();
  }

  if (bodyResp.length() > 0) {
    Serial.println("Corpo:");
    Serial.println("==========");
    Serial.println(bodyResp);
    Serial.println("==========");
  } else {
    Serial.println("Nenhum corpo na resposta.");
  }

  if (statusLine.indexOf("200") >= 0 || statusLine.indexOf("201") >= 0) {
    Serial.println("Envio OK.");
  } else {
    Serial.println("Envio falhou (veja status acima).");
  }

  client.stop();
}
