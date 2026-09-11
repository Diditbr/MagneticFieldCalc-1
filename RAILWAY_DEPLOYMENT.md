# Railway Deployment Guide

Dieses Projekt wird auf **Railway** deployed, um die Python-Berechnungen (magpylib) laufen zu lassen.

## 🚀 Quick Start

### 1. Railway Account erstellen
- Gehe zu https://railway.app
- Melde dich mit GitHub an
- Authorisiere Railway für dein GitHub-Konto

### 2. Neues Projekt auf Railway erstellen
1. Klick auf "New Project"
2. Wähle "Deploy from GitHub repo"
3. Wähle `Diditbr/MagneticFieldCalc-1`
4. Railway erkennt automatisch `package.json` und deployt

### 3. Umgebungsvariablen setzen
In Railway Dashboard → Settings → Environment:
```
NODE_ENV=production
PORT=5000
```

### 4. Build- und Start-Befehle konfigurieren (optional)
Railway liest automatisch aus `package.json`:
- **Build**: `npm run build`
- **Start**: `npm run start`

---

## 📋 Was wird deployed?

✅ **Node.js Backend** (`server/index.ts`)
✅ **React Frontend** (gebaut zu `dist/public`)
✅ **Python Scripts** (für Magnetfeld-Berechnungen)
  - `magpylib_calculator.py`
  - `report_generator.py`
  - `documentation_generator.py`
  - `plotly_viz.py`

---

## 🔗 Nach dem Deployment

Railway gibt dir eine öffentliche URL, z.B.:
```
https://magneticfieldcalc-production.up.railway.app
```

Diese URL ist dein **Backend-Server**.

### Für Vercel Frontend:
Im Vercel Dashboard → Environment Variables:
```
VITE_API_URL=https://magneticfieldcalc-production.up.railway.app
```

Dann im Frontend (`client/src`) den API-Base-URL so konfigurieren:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## ✅ Python-Dependencies

Railway installiert automatisch:
- `python3` (für magpylib)
- Alle Node.js Dependencies aus `package.json`

Die Python-Libraries werden über die Server-Scripts aufgerufen.

---

## 🐛 Debugging

Falls etwas nicht funktioniert:
1. Im Railway Dashboard → Logs anschauen
2. Prüfen ob Python-Scripts gefunden werden
3. `npm run build` lokal testen: `npm run build`

---

## 💰 Kosten

Railway ist kostenlos für:
- Erste 500 Stunden/Monat
- Deine App läuft ca. 24/7 = 720 Stunden/Monat
- **Du brauchst also den kostenlosen Plan, wenn die App nicht immer läuft**
- Oder: **Pay-as-you-go** (~$5/Monat für 24/7 Betrieb)

---

Alle Fragen? 🚀
