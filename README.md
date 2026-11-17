# GdI – Assembler-Simulator

Ein Simulator für einen einfachen 8-Bit-Prozessor im Browser, mit vereinfachter Assembler-Syntax (angelehnt an NASM)
und x86-ähnlichem Befehlssatz. Er wird in der Lehrveranstaltung **Grundlagen der Informatik (GdI)** eingesetzt und
per iframe in Moodle eingebettet.

**Direkt ausprobieren:** [https://flennartz.github.io/assembler-simulator/](https://flennartz.github.io/assembler-simulator/)

## Funktionen

- 8-Bit-Prozessor mit vier Registern (`A`–`D`), Stackpointer `SP`, Befehlszeiger `IP` und den Flags Zero, Carry und Fault
- 256 Byte Speicher als 16×16-Tabelle (hexadezimal oder dezimal); Programm, Stack und Ausgabe sind farbig markiert
- Ausgabe über die Speicheradressen 232–255 (`E8`–`FF`)
- Ausführung schrittweise, automatisch mit 1–256 Hz oder sofort bis `HLT`; die aktuelle Codezeile wird markiert
- Beispielprogramme, Labels-Übersicht und eingebaute Befehlsreferenz (aufklappbar unter dem Simulator)

## In Moodle einbetten

```html
<iframe src="https://flennartz.github.io/assembler-simulator/" width="100%" height="1400"
        style="border:0" title="GdI – Assembler-Simulator"></iframe>
```

Bei etwa 1000 px Breite und mehr stehen Programm und Ausführung nebeneinander; dafür reichen rund 1400 px Höhe.
In schmaleren Kursbereichen werden die Spalten untereinander angeordnet und die Seite wird entsprechend höher.

## Entwicklung

Der Quellcode liegt in `src/`; `index.html` lädt die daraus gebaute Datei `assets/asmsimulator.js`.
Nach Änderungen in `src/` neu bauen:

```bash
npm install
npm run build
```

## Hintergrund

Der Simulator basiert auf dem Projekt von Marco Schweighauser.
