# 🚀 Quick Reference - Cluster Storage

## 📍 Supporto Lingue

```
it = Italiano
en = English
es = Español
fr = Français
de = Deutsch
pt = Português
zh = 中文
ja = 日本語
ko = 한국어
```

## 📂 Categorie

```
crypto    = Criptovalute, blockchain
ai        = Intelligenza Artificiale
politics  = Politica, elezioni
tech      = Tecnologia, startup
sports    = Sport, competizioni
economy   = Economia, mercati
science   = Scienza, ricerca
health    = Salute, medicina
climate   = Clima, ambiente
space     = Spazio, astronomia
```

## 📅 Trimestri (Quarters)

```
Q1 = Gennaio-Marzo    (01-03)
Q2 = Aprile-Giugno    (04-06)
Q3 = Luglio-Settembre (07-09)
Q4 = Ottobre-Dicembre (10-12)
```

## 🔑 Path Examples

```
Italiana, Crypto, Reveal in Q1 2026:
→ data/predictions/it/crypto/2026/Q1/

English, AI, Reveal in Q4 2025:
→ data/predictions/en/ai/2025/Q4/

Español, Politics, Reveal in Q2 2025:
→ data/predictions/es/politics/2025/Q2/
```

## 📊 File Types

```
CLUSTER_SCHEMA.json          = Schema globale del sistema
global_index.json            = Indice di tutte le predizioni
stats.json                   = Statistiche aggregate
hot.json                     = Cache predizioni trending
by_language/[lang].json      = Cache per lingua
by_category/[cat].json       = Cache per categoria
[cluster]/index.json         = Indice cluster specifico
pred_[id]_[timestamp].json   = Singola predizione
```

## ⚡ Quick Actions

### Creare una predizione

```javascript
// 1. Determina cluster path
const path = `data/predictions/${lang}/${cat}/${year}/${quarter}/`;

// 2. Crea file
const filename = `pred_${id}_${Date.now()}.json`;

// 3. Salva predizione
await savePrediction(path + filename, predictionData);

// 4. Aggiorna indici
await updateIndex(lang, cat);
await updateGlobalIndex();
```

### Leggere predizioni

```javascript
// By Language + Category
const predictions = await fetch(
  `data/predictions/${lang}/${cat}/index.json`
).then(r => r.json());

// By Cache (Hot)
const hot = await fetch('data/cache/hot.json').then(r => r.json());

// By Global Index
const all = await fetch('data/indices/global_index.json').then(r => r.json());
```

### Cercare per data

```javascript
// Converti data in Quarter
function getQuarter(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = `Q${Math.ceil(month / 3)}`;
  return { year, quarter };
}

// Cerca
const { year, quarter } = getQuarter(revealDate);
const path = `data/predictions/${lang}/${cat}/${year}/${quarter}/`;
```

## 📏 Limiti

```
Max storage totale:        100 MB
Max predizioni (50KB/ea):  ~2000
Max file per quarter:      1000
Max dimensione file:       50 KB
Cache TTL:                 1 ora
Hot cache entries:         100
Language cache entries:    50
Category cache entries:    50
```

## 🔧 Manutenzione

```bash
# Rebuild cache
node scripts/generate-cache.js

# Rebuild indices
node scripts/rebuild-indices.js

# Check storage
node scripts/check-storage.js

# Migrate old data
node scripts/migrate-to-clusters.js
```

## ✅ Checklist Nuova Predizione

- [ ] Lingua valida (it, en, es, ...)
- [ ] Categoria valida (crypto, ai, ...)
- [ ] Reveal date > created date
- [ ] ID univoco
- [ ] Hash commitment generato
- [ ] Contenuto criptato
- [ ] File < 50 KB
- [ ] Path corretto generato
- [ ] Indici aggiornati
- [ ] Cache aggiornata

## 📈 Storage Usage

```bash
# Check current size
du -sh data/

# Check by cluster
du -sh data/predictions/*/

# Count predictions
find data/predictions -name "pred_*.json" | wc -l
```

## 🎯 Best Practices

1. **Usa sempre gli indici** per query
2. **Carica dalla cache** quando possibile
3. **Aggiorna cache** dopo ogni scrittura
4. **Batch operations** per performance
5. **Monitora dimensioni** cluster (max 50MB/quarter)
6. **Backup regolari** su GitHub/Arweave

---

**Per dettagli completi:** Leggi `CLUSTER_STORAGE.md`
