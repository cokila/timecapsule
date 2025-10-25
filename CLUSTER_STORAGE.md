# 📦 Time Capsule - Cluster Storage System

## 🎯 Overview

Sistema di storage scalabile per predizioni organizzate per **lingua**, **categoria** e **data di rivelazione**.

**Limite:** 100 MB
**Capacità stimata:** ~2000 predizioni (50KB ciascuna)

---

## 🗂️ Struttura Directory

```
data/
├── predictions/
│   ├── [language]/              # Lingua (it, en, es, fr, de, pt, zh, ja, ko)
│   │   ├── [category]/          # Categoria (crypto, ai, politics, tech, etc.)
│   │   │   ├── [year]/          # Anno (2025, 2026, 2027, ...)
│   │   │   │   ├── Q1/          # Trimestre 1 (Gen-Mar)
│   │   │   │   ├── Q2/          # Trimestre 2 (Apr-Giu)
│   │   │   │   ├── Q3/          # Trimestre 3 (Lug-Set)
│   │   │   │   └── Q4/          # Trimestre 4 (Ott-Dic)
│   │   │   └── index.json       # Indice categoria
│   │   └── index.json           # Indice lingua
│   └── CLUSTER_SCHEMA.json      # Schema globale
│
├── cache/
│   ├── hot.json                 # Predizioni trending
│   ├── by_language/             # Cache per lingua
│   │   └── [lang].json
│   └── by_category/             # Cache per categoria
│       └── [category].json
│
└── indices/
    ├── global_index.json        # Indice globale
    ├── by_reveal_date.json      # Ordinato per data reveal
    ├── by_created_date.json     # Ordinato per data creazione
    └── stats.json               # Statistiche globali
```

---

## 🔑 Cluster Path Logic

### Path Generation

```javascript
function getClusterPath(prediction) {
  const { language, category, revealDate } = prediction;

  // Calcola anno e trimestre dalla data di reveal
  const date = new Date(revealDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const quarter = `Q${Math.ceil(month / 3)}`; // Q1, Q2, Q3, Q4

  return `data/predictions/${language}/${category}/${year}/${quarter}/`;
}

// Esempio
const pred = {
  language: "it",
  category: "crypto",
  revealDate: 1743465600000 // 2026-01-15
};

// Path: data/predictions/it/crypto/2026/Q1/
```

### File Naming

```
Format: pred_[id]_[timestamp].json

Esempi:
- pred_btc_001_1729785600000.json
- pred_ai_gpt5_1729785600000.json
- pred_election_1729785600000.json
```

---

## 📄 Schemas

### Prediction Schema

```json
{
  "id": "pred_btc_001",
  "author": "user_id",
  "username": "Display Name",
  "title": "Prediction title (max 200 chars)",
  "category": "crypto",
  "language": "it",
  "tags": ["bitcoin", "price"],
  "created": 1729785600000,
  "revealDate": 1743465600000,
  "commitHash": "sha256_hash",
  "encrypted": "AES_encrypted_content",
  "revealed": false,
  "revealNonce": null,
  "revealContent": null,
  "metadata": {
    "views": 0,
    "comments": 0,
    "upvotes": 0,
    "shares": 0,
    "clusterPath": "data/predictions/it/crypto/2026/Q1/"
  }
}
```

### Index Schema (Cluster Level)

```json
{
  "language": "it",
  "category": "crypto",
  "totalPredictions": 42,
  "lastUpdated": 1729785600000,
  "byYear": {
    "2025": {"Q1": 5, "Q2": 8, "Q3": 3, "Q4": 10},
    "2026": {"Q1": 12, "Q2": 4, "Q3": 0, "Q4": 0}
  },
  "recentPredictions": [
    {
      "id": "pred_btc_001",
      "title": "Bitcoin $150K",
      "author": "Expert",
      "created": 1729785600000,
      "revealDate": 1743465600000,
      "path": "data/predictions/it/crypto/2026/Q1/pred_btc_001.json"
    }
  ]
}
```

### Global Index

```json
{
  "version": "1.0.0",
  "lastUpdated": 1729785600000,
  "totalPredictions": 1234,
  "byLanguage": {
    "it": 450,
    "en": 600,
    "es": 184
  },
  "byCategory": {
    "crypto": 400,
    "ai": 350,
    "politics": 200,
    "tech": 284
  },
  "byYear": {
    "2025": 800,
    "2026": 400,
    "2027": 34
  },
  "metadata": {
    "totalSize": "45MB",
    "maxSize": "100MB",
    "usagePercent": 45
  }
}
```

---

## 🚀 Query Strategies

### 1. Query by Language

```javascript
// Direct path access
const language = "it";
const indexPath = `data/predictions/${language}/index.json`;
const index = await fetch(indexPath).then(r => r.json());

// Get all Italian predictions
const predictions = index.recentPredictions;
```

### 2. Query by Category

```javascript
// Direct path access
const language = "en";
const category = "ai";
const indexPath = `data/predictions/${language}/${category}/index.json`;
const index = await fetch(indexPath).then(r => r.json());
```

### 3. Query by Date Range

```javascript
// Use reveal date index
const dateIndex = await fetch('data/indices/by_reveal_date.json').then(r => r.json());

// Filter by date range
const startDate = new Date('2025-01-01').getTime();
const endDate = new Date('2025-12-31').getTime();

const predictions = dateIndex.predictions.filter(p =>
  p.revealDate >= startDate && p.revealDate <= endDate
);
```

### 4. Multi-Criteria Query

```javascript
// Use global index + cache
const globalIndex = await fetch('data/indices/global_index.json').then(r => r.json());

// Filter by multiple criteria
const results = globalIndex.clusters
  .filter(c => c.language === "it" && c.category === "crypto")
  .flatMap(c => c.predictions);
```

---

## ⚡ Cache Strategy

### Hot Cache (`data/cache/hot.json`)

- Top 100 trending predictions
- Updated every hour
- Sorted by: views + upvotes + recency

### Language Cache (`data/cache/by_language/[lang].json`)

- Top 50 predictions per language
- TTL: 1 hour
- Used for language-specific feeds

### Category Cache (`data/cache/by_category/[category].json`)

- Top 50 predictions per category
- TTL: 1 hour
- Used for category pages

---

## 📊 Scalability Estimates

| Storage | Predictions | Notes |
|---------|------------|-------|
| 100 MB  | ~2,000     | Current limit |
| 1 GB    | ~20,000    | Easy to scale |
| 10 GB   | ~200,000   | Enterprise scale |

### Per-Cluster Limits

- **Max files per quarter:** 1,000 predictions
- **Max file size:** 50 KB per prediction
- **Max quarter size:** ~50 MB

**Overflow strategy:** Create new sub-clusters (e.g., Q1a, Q1b)

---

## 🛠️ Implementation Examples

### Create Prediction

```javascript
async function createPrediction(data) {
  // Generate cluster path
  const path = getClusterPath(data);
  const filename = `pred_${data.id}_${Date.now()}.json`;
  const fullPath = `${path}${filename}`;

  // Add cluster path to metadata
  data.metadata.clusterPath = path;

  // Save prediction
  await savePrediction(fullPath, data);

  // Update indices
  await updateClusterIndex(data.language, data.category);
  await updateGlobalIndex();
  await updateCache(data);
}
```

### Read Predictions (Language + Category)

```javascript
async function getPredictions(language, category, year, quarter) {
  const path = `data/predictions/${language}/${category}/${year}/${quarter}/`;

  // List all files in cluster
  const files = await listFiles(path);

  // Load predictions
  const predictions = await Promise.all(
    files.map(f => fetch(`${path}${f}`).then(r => r.json()))
  );

  return predictions;
}
```

### Update Indices

```javascript
async function updateIndices() {
  // 1. Update cluster indices
  for (const lang of LANGUAGES) {
    for (const cat of CATEGORIES) {
      await updateClusterIndex(lang, cat);
    }
  }

  // 2. Update global index
  await updateGlobalIndex();

  // 3. Rebuild caches
  await rebuildCache();
}
```

---

## 🔄 Maintenance Scripts

### Generate Cache

```bash
node scripts/generate-cache.js
```

Updates all cache files based on current predictions.

### Rebuild Indices

```bash
node scripts/rebuild-indices.js
```

Scans all clusters and rebuilds all index files.

### Check Storage

```bash
node scripts/check-storage.js
```

Reports storage usage and identifies large clusters.

---

## 📈 Performance Tips

1. **Always query through indices first** - Don't scan all files
2. **Use cache for hot data** - Cache is updated hourly
3. **Batch reads** - Load multiple predictions in parallel
4. **Lazy load** - Load only visible predictions
5. **Pre-generate summaries** - Store in indices for quick access

---

## 🚧 Migration Guide

### From Old Structure

```bash
# Old: data/predictions/2025/example_pred.json
# New: data/predictions/[lang]/[cat]/2025/[Q]/pred_[id]_[ts].json

node scripts/migrate-to-clusters.js
```

Script reads old predictions and moves them to new cluster structure.

---

## ✅ Advantages

- ✅ **Scalable**: Up to 100MB (2000 predictions) easily
- ✅ **Fast queries**: Direct path access by lang/cat/date
- ✅ **Organized**: Clear hierarchy for humans and machines
- ✅ **Cacheable**: Multiple cache layers for performance
- ✅ **Maintainable**: Easy to backup/restore specific clusters
- ✅ **Flexible**: Easy to add new languages/categories

---

## 🎯 Next Steps

1. Implement JavaScript helpers in `index.html`
2. Create migration script from old structure
3. Setup GitHub Actions for auto-indexing
4. Add cache warming on deploy
5. Implement search functionality across clusters

---

**Made with ❤️ for scalable prediction storage**

⏰ Time Capsule - Built to scale
