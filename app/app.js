"use strict";

// Einträge bleiben im Browser (Speicherschlüssel kleider-v1). Die Frage im Kasten geht an die Funktion /api/frage.
var SPEICHER = "kleider-v1";
var WER = ["Familie 01", "Familie 02", "Familie 03", "Familie 04"];
var WANN = ["Dienstag 14 Uhr", "Donnerstag 16 Uhr", "Samstag 10 Uhr"];
var liste = [];
try { liste = JSON.parse(localStorage.getItem(SPEICHER) || "[]"); } catch (e) { liste = []; }

function zeichne() {
  var ul = document.getElementById("liste");
  ul.innerHTML = "";
  liste.forEach(function (e) {
    var li = document.createElement("li");
    li.textContent = e.wer + ": " + e.wann;
    ul.appendChild(li);
  });
}
function fuelle(id, werte) {
  var sel = document.getElementById(id);
  werte.forEach(function (x, i) { var o = document.createElement("option"); o.value = String(i); o.textContent = x; sel.appendChild(o); });
}
fuelle("wer", WER); fuelle("wann", WANN);
document.getElementById("eintragen").addEventListener("click", function () {
  liste.push({ wer: WER[Number(document.getElementById("wer").value)], wann: WANN[Number(document.getElementById("wann").value)] });
  try { localStorage.setItem(SPEICHER, JSON.stringify(liste)); } catch (e) { /* egal */ }
  zeichne();
});
zeichne();

if (location.protocol === "http:" || location.protocol === "https:") {
  fetch("/api/frage").then(function (r) { return r.json(); }).then(function (d) {
    if (d && d.eingerichtet) document.getElementById("kasten").hidden = false;
  }).catch(function () { /* bleibt unsichtbar */ });
}
document.getElementById("senden").addEventListener("click", function () {
  var ziel = document.getElementById("antwort");
  var text = document.getElementById("frage").value;
  ziel.textContent = "…";
  if (!text.trim()) { ziel.textContent = "Bitte gib zuerst eine Frage ein."; return; }
  fetch("/api/frage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frage: text }) })
    .then(function (r) { return r.json(); })
    .then(function (d) { ziel.textContent = d.antwort || d.fehler || "Keine Antwort."; })
    .catch(function () { ziel.textContent = "Keine Verbindung."; });
});
