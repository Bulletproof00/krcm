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

## Installation (macOS)

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

## Hinweise

- Das ist ein fokussierter Arcade-Prototyp ohne Story/Kampagne.
- Für LAN-/Party-Feeling: erhöhe Bots, setze KI hoch, spiele Team-Deathmatch.
