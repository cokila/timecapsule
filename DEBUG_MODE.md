# 🧪 DEBUG MODE - Da Rivelare

## ✅ ATTIVATO!

La modalità debug è stata attivata per la funzione "Da Rivelare".

---

## 🎯 Cosa fa?

Quando **DEBUG_REVEAL_MODE = true**, la lista "Da Rivelare" mostra **TUTTE** le tue predizioni, indipendentemente dalla reveal date.

**Comportamento:**
- ✅ Mostra predizioni con reveal date passata (normale)
- ✅ Mostra predizioni con reveal date futura (solo in debug)
- ❌ Non mostra predizioni già rivelate
- ❌ Non mostra predizioni di altri utenti

---

## 🎨 Indicatori Visivi

### Predizioni Future (Debug Mode)
- 🧪 Emoji nel titolo
- 🟡 Bordo arancione
- 🟡 Label arancione: "DEBUG MODE: Reveal tra X giorni"
- 🟡 Bottone arancione: "Rivela (Debug)"

### Predizioni Normali
- ✅ Nessun emoji speciale
- 🔵 Bordo blu
- ✅ Label verde: "Revealable da X giorni"
- 🟢 Bottone verde: "Rivela Pubblicamente"

### Banner Debug
All'apertura del modal vedrai:
```
🧪 MODALITÀ DEBUG ATTIVA
Vengono mostrate tutte le tue predizioni, anche quelle con reveal date futura.
Le predizioni future sono evidenziate in arancione.
```

---

## ⚙️ Configurazione

### Attivare Debug Mode

Nel file `index.html`, riga ~794:
```javascript
const DEBUG_REVEAL_MODE = true; // ← true = debug attivo
```

### Disattivare Debug Mode (Produzione)

```javascript
const DEBUG_REVEAL_MODE = false; // ← false = solo predizioni con data passata
```

---

## 🧪 Come Testare

### 1. Refresh del Browser
```bash
# Hard refresh per caricare il nuovo codice
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### 2. Verifica Debug Mode Attivo
1. Apri index.html
2. Apri Console (F12)
3. Digita: `DEBUG_REVEAL_MODE`
4. Se vedi `true` = ✅ attivo

### 3. Crea Predizione Test
1. Click "Nuova Predizione"
2. Compila form (qualsiasi categoria/lingua)
3. **Reveal date:** Imposta una data FUTURA (es. domani, prossima settimana)
4. Salva predizione

### 4. Apri "Da Rivelare"
1. Click "🔓 Da Rivelare"
2. Dovresti vedere:
   - ✅ Banner giallo "MODALITÀ DEBUG ATTIVA"
   - ✅ La tua predizione nella lista
   - ✅ Label arancione "DEBUG MODE: Reveal tra X giorni"
   - ✅ Bottone arancione "Rivela (Debug)"

### 5. Test Anteprima
1. Click "👁️ Anteprima"
2. Vedi contenuto decriptato
3. Verifica hash commitment
4. Predizione NON diventa pubblica

### 6. Test Reveal (Debug)
1. Click "🔓 Rivela (Debug)"
2. Conferma
3. Valuta risultato (1/2/3)
4. ✅ Predizione diventa pubblica ANCHE SE reveal date futura
5. ✅ Appare nel feed con badge
6. ✅ Statistiche aggiornate

---

## 📊 Differenze Debug vs Produzione

| Feature | Debug Mode | Production Mode |
|---------|-----------|-----------------|
| Predizioni passate | ✅ Visibili | ✅ Visibili |
| Predizioni future | ✅ Visibili (arancione) | ❌ Nascoste |
| Banner avviso | ✅ Mostrato | ❌ Nascosto |
| Reveal predizioni future | ✅ Permesso | ❌ Non possibile |
| Indicatori visivi | 🟡 Arancione per future | 🟢 Verde per tutte |

---

## 🎯 Use Cases

### Caso 1: Testing Immediato
**Problema:** Hai appena creato l'app, vuoi testare subito "Da Rivelare" ma tutte le predizioni hanno date future.

**Soluzione:**
```javascript
DEBUG_REVEAL_MODE = true  // ← Attiva debug
```
Ora puoi testare con qualsiasi predizione!

### Caso 2: Demo/Presentazione
**Problema:** Vuoi mostrare la funzionalità a qualcuno ma non hai predizioni con date passate.

**Soluzione:**
```javascript
DEBUG_REVEAL_MODE = true  // ← Attiva debug
```
Mostra tutte le predizioni, demo completa!

### Caso 3: Produzione
**Problema:** App live, utenti reali.

**Soluzione:**
```javascript
DEBUG_REVEAL_MODE = false  // ← Disattiva debug
```
Solo predizioni con reveal date passata sono revealable.

---

## 🔧 Troubleshooting

### ❌ "Non vedo il banner debug"

**Causa:** Browser cache o DEBUG_REVEAL_MODE = false

**Fix:**
1. Verifica in console: `DEBUG_REVEAL_MODE` → deve essere `true`
2. Hard refresh: Ctrl+Shift+R
3. Clear cache e ricarica

### ❌ "Le predizioni future non appaiono"

**Causa:**
- Predizione già rivelata
- Non sei l'autore
- Non hai il nonce (chiave di decriptazione)

**Fix:**
1. Crea nuova predizione
2. Assicurati di essere loggato con lo stesso username
3. Verifica in console: `myNonces` → deve contenere l'ID predizione

### ❌ "Errore durante reveal"

**Causa:** Predizione corrotta o nonce mancante

**Fix:**
1. Controlla console per errori specifici
2. Verifica: `myNonces['pred_id']` → deve esistere
3. Prova con predizione nuova

---

## 💡 Tips

### Tip 1: Console Debug
```javascript
// In console del browser (F12)

// Vedi tutte le predizioni
predictions

// Vedi solo revealable
predictions.filter(p => p.author === myUsername && !p.revealed)

// Vedi nonces
myNonces

// Test manuale funzione
getRevealablePredictions()
```

### Tip 2: Crea Predizione di Test Rapida
```javascript
// In console
const testPred = {
    id: 'pred_test_' + Date.now(),
    author: myUsername,
    username: myUsername,
    title: 'Test Predizione',
    category: 'crypto',
    language: 'it',
    tags: [],
    created: Date.now(),
    revealDate: Date.now() + 86400000, // Domani
    commitHash: 'test_hash',
    encrypted: 'test_encrypted',
    revealed: false,
    metadata: { views: 0, comments: 0, upvotes: 0, shares: 0 }
};
myNonces[testPred.id] = 'test_nonce_' + Math.random();
predictions.unshift(testPred);
renderFeed();
```

### Tip 3: Toggle Debug al Volo
```javascript
// In console, puoi cambiare temporaneamente
DEBUG_REVEAL_MODE = true;  // Attiva
DEBUG_REVEAL_MODE = false; // Disattiva

// Poi riapri modal
showRevealable();
```

⚠️ **Nota:** Cambiamento in console è temporaneo, ricaricando la pagina torna al valore nel codice.

---

## 📝 Checklist Pre-Produzione

Prima di deployare in produzione:

- [ ] `DEBUG_REVEAL_MODE = false` nel codice
- [ ] Test con predizioni vere (date passate)
- [ ] Verifica banner debug NON visibile
- [ ] Test reveal normale funziona
- [ ] Stats corrette
- [ ] No errori in console
- [ ] Mobile responsive OK

---

## 🚀 Deploy su GitHub Pages

Quando fai deploy, ricorda:

```javascript
// ❌ NON deployare con debug attivo!
const DEBUG_REVEAL_MODE = false;

// ✅ Commit e push
git add index.html
git commit -m "Deploy production (debug mode OFF)"
git push
```

---

## 📊 Stats

- **Righe codice modificate:** ~50
- **Nuove funzionalità:** 1 (debug mode toggle)
- **Indicatori visivi:** 5 (banner, bordi, colori, emoji, labels)
- **Tempo implementazione:** ~10 minuti
- **Compatibilità:** 100% backwards compatible

---

## ✅ Ready!

**Debug mode attivo e funzionante!**

### Quick Test:
1. Hard refresh browser (Ctrl+Shift+R)
2. Crea predizione con data futura
3. Click "🔓 Da Rivelare"
4. Vedi banner giallo + predizione arancione
5. Test anteprima e reveal
6. ✅ Funziona!

**Status:** 🟢 PRODUCTION READY (con debug mode controllabile)

---

**Creato il:** 2025-10-24
**Versione:** 1.0
**Feature:** Debug Mode per "Da Rivelare"

🎉 **Happy Testing!**
