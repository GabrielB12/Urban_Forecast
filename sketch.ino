// esp8266_sketch.ino
// Substitua os PLACEHOLDER abaixo:
//   - SUPABASE_HOST    : "SEU_PROJETO.supabase.co" (sem https)
//   - SUPABASE_ANON_KEY: chave anon do Supabase
//   - SENSOR_ID        : id único para cada ESP (ex: "Lixeira-A1")
// Atenção: não coloque a service_role key aqui.

#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>

const char* ssid = "Tricolor";
const char* password = "trimundial";

const char* SUPABASE_HOST = "SEU_PROJETO.supabase.co"; // <<-- substitua
const int HTTPS_PORT = 443;
const String SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";  // <<-- substitua
const String SENSOR_ID = "Lixeira-A1";                // <<-- altere por dispositivo

WiFiClientSecure client;

// Pinos do HC-SR04 (ajuste conforme seu wiring)
const int trigP = D4; // por exemplo D4 (GPIO2)
const int echoP = D3; // D3 (GPIO0)

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000; // ms (altere para 30000 ou mais em produção)

void setup() {
  Serial.begin(115200);
  delay(10);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi conectado: " + WiFi.localIP().toString());

  pinMode(trigP, OUTPUT);
  pinMode(echoP, INPUT);
}

void loop() {
  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL) {
    int distance = readDistance();
    Serial.println("Distance: " + String(distance));
    sendReading(distance);
    lastSend = now;
  }
}

int readDistance() {
  long duration;
  int distanceCm;
  digitalWrite(trigP, LOW);
  delayMicroseconds(2);
  digitalWrite(trigP, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigP, LOW);

  duration = pulseIn(echoP, HIGH, 30000); // timeout 30ms
  if (duration == 0) {
    return -1; // sem leitura válida
  }
  distanceCm = duration * 0.034 / 2;
  return distanceCm;
}

void sendReading(int distance) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado");
    return;
  }

  client.setInsecure(); // OK para protótipo; para produção valide certificado
  if (!client.connect(SUPABASE_HOST, HTTPS_PORT)) {
    Serial.println("Conexão HTTPS falhou");
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

  // ler headers
  while (client.connected()) {
    String line = client.readStringUntil('\n');
    if (line == "\r") break;
  }

  // ler corpo (opcional)
  String resp = client.readString();
  Serial.println("Resposta Supabase:");
  Serial.println(resp);
  client.stop();
}
