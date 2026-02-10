# TOU Prototype (Mac)

Ein spielbarer **Tunnels of the Underworld**-Prototyp als schnelles 2D-Arcade-Actionspiel.

## Features

- Bis zu **64 Einheiten** gleichzeitig (max. 4 Menschen + Bots).
- Sehr schnelle Bewegung mit Trägheit/Beschleunigung.
- Prozedural erzeugte Tunnel-, Höhlen- und Arena-Level.
- **47 Waffen** in Kategorien (Energy, Ballistic, Rocket, Explosive, Special).
- Spielmodi: Deathmatch und Team Deathmatch.
- Skalierbare KI (harmlos bis aggressiv).
- Fokus: kurze, chaotische, intensive Matches.

## Installation auf deinem MacBook (Schritt für Schritt)

### 1) Terminal öffnen
- `cmd + space` drücken
- `Terminal` tippen und öffnen

### 2) In einen Zielordner wechseln (Beispiel)
```bash
mkdir -p ~/Games
cd ~/Games
```

### 3) Projekt holen

#### Variante A: Du hast bereits den Projektordner
Kopiere den Ordner nach `~/Games/tou` und gehe hinein:
```bash
cd ~/Games/tou
```

#### Variante B: Du lädst das Repo per Git
```bash
git clone <REPO_URL> tou
cd tou
```

> Danach sollten `tou.py`, `requirements.txt` und `README.md` im Ordner liegen.

### 4) Python prüfen
```bash
python3 --version
```
Empfohlen: Python 3.10+.

Falls `python3` fehlt:
```bash
xcode-select --install
```

### 5) Virtuelle Umgebung anlegen
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 6) Abhängigkeiten installieren
```bash
pip install -r requirements.txt
```

### 7) Spiel starten
```bash
python3 tou.py
```

## Schnellstart (Kurzfassung)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 tou.py
```

## Steuerung

### Allgemein
- `ESC`: Beenden
- `F1`: Modus wechseln (DM/TDM)
- `F2/F3`: Anzahl menschlicher Spieler erhöhen/verringern (max. 4)
- `F4/F5`: Bots +4/-4
- `F6/F7`: KI-Schwierigkeit +/−
- `F8`: Neues prozedurales Level

### Spieler 1
- Bewegung: `WASD`
- Feuer: `SPACE`
- Waffe wechseln: `Q`

### Spieler 2
- Bewegung: Pfeiltasten
- Feuer: `Right Ctrl`
- Waffe wechseln: `Right Shift`

### Spieler 3
- Bewegung: `TFGH`
- Feuer: `Y`
- Waffe wechseln: `R`

### Spieler 4
- Bewegung: `IJKL`
- Feuer: `O`
- Waffe wechseln: `U`

## Troubleshooting (Mac)

### `ModuleNotFoundError: No module named 'pygame'`
Die virtuelle Umgebung ist nicht aktiv oder `pygame` wurde nicht installiert:
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### Fenster startet nicht / schließt sofort
Starte aus dem Projektordner:
```bash
cd ~/Games/tou
source .venv/bin/activate
python3 tou.py
```

### `pip` ist veraltet
```bash
python3 -m pip install --upgrade pip
```

## Hinweise

- Das ist ein fokussierter Arcade-Prototyp ohne Story/Kampagne.
- Für LAN-/Party-Feeling: erhöhe Bots, setze KI hoch, spiele Team-Deathmatch.
