# ⏰ Time Capsule

**Le tue predizioni, criptate e permanenti**

Time Capsule è un'app open source per creare predizioni verificabili cryptograficamente. Commitment immutabile, reveal temporizzato, permanent storage.

## 🎯 Features

- ✅ **Crypto Commitment**: Hash immutabile delle predizioni
- ⏰ **Time-Lock**: Contenuto nascosto fino alla data di reveal
- 🔓 **Verifiable**: Proof cryptografico che non hai modificato
- ♾️ **Permanent**: Storage su Arweave/GitHub
- 🆓 **Free Forever**: Zero costi, always free
- 🌍 **Open Source**: MIT License

## 🚀 Quick Start

1. **Apri l'app**: [timecapsule.app](https://timecapsule.app)
2. **Crea predizione**: Scrivi cosa prevedi
3. **Imposta data reveal**: Quando vuoi rivelare
4. **Aspetta**: La predizione è criptata
5. **Reveal**: Alla scadenza, rivela e verifica!

## 💻 Sviluppo Locale

```bash
# Clone
git clone https://github.com/TUO-USERNAME/timecapsule.git
cd timecapsule

# Serve locale
python -m http.server 8000
# oppure
npx serve

# Apri http://localhost:8000
```

## 📦 Deploy

L'app è hostata gratuitamente su GitHub Pages:

1. Fork questo repo
2. Settings → Pages → Enable (branch: main)
3. Done! Disponibile su `username.github.io/timecapsule`

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (zero dependencies!)
- **Storage**: Cluster Storage System (scalable to 100MB)
  - Organized by: Language / Category / Year / Quarter
  - Smart caching and indexing
  - Support for 9 languages, 10 categories
- **Crypto**: Web Crypto API (SHA-256, AES-GCM)
- **Hosting**: GitHub Pages (free CDN)
- **PWA**: Service Worker per offline

## 📦 Cluster Storage

Le predizioni sono organizzate in cluster per massima scalabilità:

```
data/predictions/
├── [language]/      # it, en, es, fr, de, pt, zh, ja, ko
│   ├── [category]/  # crypto, ai, politics, tech, sports, etc.
│   │   ├── [year]/  # 2025, 2026, 2027...
│   │   │   └── [quarter]/  # Q1, Q2, Q3, Q4
│   │   │       └── pred_[id]_[timestamp].json
│   │   └── index.json
│   └── cache/       # Hot cache, language cache, category cache
└── indices/         # Global index, stats, etc.
```

**Capacity:** ~2,000 predizioni (50KB each) con limite 100MB

Vedi [CLUSTER_STORAGE.md](./CLUSTER_STORAGE.md) per dettagli completi.

## 🤝 Contributing

Contributi benvenuti! Apri issue o PR.

## 📄 License

MIT License - Free forever

## 🌟 Star History

Se ti piace, lascia una ⭐!

---

Made with ❤️ for humanity's calibration
