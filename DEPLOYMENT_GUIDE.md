# 🧲 MagneticFieldCalc - Deployment Guide

Vollständige Anleitung für das Deployment deiner Web-App ohne extra Server.

---

## 🎯 Deployment-Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Dein Browser                          │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
    ┌───▼────────────┐        ┌─────────▼─────────┐
    │ Frontend       │        │ Backend (API)     │
    │ React/Vite    │        │ Node.js + Python  │
    │               │        │                   │
    │ Vercel 🟢     │        │ Railway 🟢        │
    └───────────────┘        └─────────┬─────────┘
                                      │
                          ┌───────────┴──────────┐
                          │                      │
                      ┌───▼────┐           ┌────▼────┐
                      │ Node.js│           │ Python  │
                      │ Server │           │ Magpylib│
                      └────────┘           └─────────┘
```

---

## 📋 Step-by-Step Deployment

### **Phase 1: Backend auf Railway deployen** ⚙️

#### 1.1 Railway Account erstellen
- Gehe zu https://railway.app
- Klick "Start New Project"
- Melde dich mit **GitHub** an
- Autorisiere Railway

#### 1.2 Projekt connecten
1. Im Railway Dashboard: "New Project" → "Deploy from GitHub repo"
2. Wähle: `Diditbr/MagneticFieldCalc-1`
3. Railway erkennt automatisch die Konfiguration

#### 1.3 Environment Variablen setzen
Im Railway Dashboard → Settings → Environment Variables:
```
NODE_ENV=production
PORT=5000
VITE_API_URL=http://localhost:5000
```

#### 1.4 Deployment starten
- Railway baut automatisch: `npm run build`
- Startet mit: `npm run start`
- Warte auf "✓ Success" Meldung

#### 1.5 Railway-URL notieren
Nach erfolgreichem Deployment siehst du eine URL wie:
```
https://magneticfieldcalc-production.up.railway.app
```
**→ Das ist dein Backend API-Server** 🟢

---

### **Phase 2: Frontend auf Vercel deployen** 🎨

#### 2.1 Vercel Account erstellen
- Gehe zu https://vercel.com
- Klick "Sign Up"
- Melde dich mit **GitHub** an

#### 2.2 Projekt erstellen
1. Im Vercel Dashboard: "New Project"
2. Wähle: `Diditbr/MagneticFieldCalc-1` (GitHub Repo)
3. Framework: Auto-Detect (Vite)
4. Klick "Deploy"

#### 2.3 Environment Variable für API
Im Vercel Dashboard:
- Project Settings → Environment Variables
- Hinzufügen:
  ```
  Name: VITE_API_URL
  Value: https://magneticfieldcalc-production.up.railway.app
  ```

#### 2.4 Deploy starten
Vercel deployt automatisch. Nach ~2-3 Minuten:
```
✓ Deployment successful!
Your frontend is live at: https://magneticfieldcalc-1.vercel.app
```

---

## 🔧 Im Frontend Code verwenden

Damit dein React-Code auf den Railway-Backend zugreift:

**`client/src/api.ts` oder ähnlich:**
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function calculateField(params) {
  const response = await fetch(`${API_BASE}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}
```

---

## ✅ Alles verbunden?

Teste deine App:

1. **Öffne Vercel URL** in Browser:
   ```
   https://magneticfieldcalc-1.vercel.app
   ```

2. **Starte eine Berechnung** (z.B. Magnetfeld berechnen)

3. **Prüfe Railway Logs**:
   - Railway Dashboard → Deployments → Logs
   - Du solltest sehen: `POST /api/calculate 200 in XXXms`

4. **Falls Error**: 
   - Prüfe ob `VITE_API_URL` richtig gesetzt ist
   - Prüfe Railway Logs für Python-Fehler
   - Browser Console (F12) für Network-Fehler

---

## 💡 Troubleshooting

### ❌ "Cannot reach backend"
**Lösung:**
1. Vercel → Environment Variables → `VITE_API_URL` prüfen
2. Redeploy Vercel: Settings → "Redeploy"
3. Browser Cache löschen (Ctrl+Shift+Del)

### ❌ "Python script not found"
**Lösung:**
1. Railway Logs prüfen
2. Stelle sicher dass `server/magpylib_calculator.py` in Git ist
3. Railway neudeployen: Dashboard → Redeploy

### ❌ "Calculation timeout"
**Lösung:**
- Railway Server upgraden (kostet $5-10/Monat)
- Oder: Komplexität der Berechnung reduzieren

---

## 🎉 Fertig!

Deine Web-App läuft jetzt in der Cloud:
- **Frontend**: Vercel (USA, schnell weltweit)
- **Backend**: Railway (Python + Node.js)
- **Kosten**: ~$5-10/Monat (oder kostenlos mit Limits)

**URL zum Teilen:**
```
https://magneticfieldcalc-1.vercel.app
```

---

## 📚 Weitere Ressourcen

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Vite Guide](https://vitejs.dev/guide/)
- [Express Basics](https://expressjs.com)

---

Fragen? Frag mich! 🚀
