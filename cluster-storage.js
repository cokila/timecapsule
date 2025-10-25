/**
 * Time Capsule - Cluster Storage System
 * Scalable storage organized by language, category, and reveal date
 * Max 100MB capacity (~2000 predictions)
 */

// ==================== CONFIG ====================

const CLUSTER_CONFIG = {
    languages: ['it', 'en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko'],
    categories: ['crypto', 'ai', 'politics', 'tech', 'sports', 'economy', 'science', 'health', 'climate', 'space'],
    basePath: 'data/predictions/',
    maxFileSize: 50 * 1024, // 50KB
    maxPredictionsPerQuarter: 1000
};

// ==================== PATH GENERATION ====================

/**
 * Generate cluster path for a prediction based on language, category, and reveal date
 * Example: data/predictions/it/crypto/2026/Q1/
 */
function getClusterPath(prediction) {
    const { language, category, revealDate } = prediction;

    // Validate inputs
    if (!CLUSTER_CONFIG.languages.includes(language)) {
        throw new Error(`Invalid language: ${language}`);
    }
    if (!CLUSTER_CONFIG.categories.includes(category)) {
        throw new Error(`Invalid category: ${category}`);
    }

    // Calculate year and quarter from reveal date
    const date = new Date(revealDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const quarter = `Q${Math.ceil(month / 3)}`; // Q1, Q2, Q3, Q4

    return `${CLUSTER_CONFIG.basePath}${language}/${category}/${year}/${quarter}/`;
}

/**
 * Generate filename for a prediction
 * Format: pred_[id]_[timestamp].json
 */
function getPredictionFilename(prediction) {
    return `pred_${prediction.id}_${prediction.created}.json`;
}

/**
 * Get full path for a prediction file
 */
function getPredictionPath(prediction) {
    const clusterPath = getClusterPath(prediction);
    const filename = getPredictionFilename(prediction);
    return clusterPath + filename;
}

/**
 * Get quarter from date
 */
function getQuarter(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = `Q${Math.ceil(month / 3)}`;
    return { year, quarter };
}

// ==================== STORAGE OPERATIONS ====================

/**
 * Push prediction to GitHub repository
 */
async function pushPredictionToGitHub(prediction, fullPath) {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');

    if (!token || !repo) {
        console.log('GitHub not configured - skipping push');
        return false;
    }

    try {
        const filename = fullPath;

        // Get current file SHA if exists (for updates)
        let sha = null;
        try {
            const getResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${filename}`, {
                headers: { Authorization: `token ${token}` }
            });
            if (getResponse.ok) {
                const data = await getResponse.json();
                sha = data.sha;
            }
        } catch (e) {
            // File doesn't exist yet, that's ok
        }

        // Push file to GitHub
        const predictionJSON = JSON.stringify(prediction, null, 2);
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filename}`, {
            method: 'PUT',
            headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add prediction: ${prediction.title}`,
                content: btoa(unescape(encodeURIComponent(predictionJSON))), // UTF-8 safe base64
                sha: sha
            })
        });

        if (response.ok) {
            console.log(`✅ Prediction pushed to GitHub: ${filename}`);
            return true;
        } else {
            const errorData = await response.json();
            console.error('GitHub API error:', errorData);
            return false;
        }
    } catch (error) {
        console.error('Error pushing to GitHub:', error);
        return false;
    }
}

/**
 * Save prediction to cluster storage
 */
async function savePredictionToCluster(prediction) {
    try {
        // Add cluster path to metadata
        const clusterPath = getClusterPath(prediction);
        prediction.metadata = prediction.metadata || {};
        prediction.metadata.clusterPath = clusterPath;

        // Get full path
        const fullPath = getPredictionPath(prediction);

        // Save to localStorage (always, for immediate access)
        const storageKey = `prediction_${prediction.id}`;
        localStorage.setItem(storageKey, JSON.stringify(prediction));

        console.log(`Prediction saved to localStorage: ${fullPath}`);

        // Auto-push to GitHub if configured
        const pushed = await pushPredictionToGitHub(prediction, fullPath);
        if (pushed) {
            console.log('🚀 Prediction also pushed to GitHub!');
        }

        // Update indices
        await updateClusterIndex(prediction.language, prediction.category);
        await updateGlobalIndex();

        return fullPath;
    } catch (error) {
        console.error('Error saving prediction to cluster:', error);
        throw error;
    }
}

/**
 * Load all predictions from GitHub repository
 */
async function loadAllPredictionsFromGitHub() {
    const token = localStorage.getItem('githubToken');
    const repo = localStorage.getItem('githubRepo');

    if (!token || !repo) {
        console.log('GitHub not configured - skipping remote load');
        return [];
    }

    try {
        console.log('📡 Loading predictions from GitHub...');

        // Use GitHub Tree API to get all files recursively
        const response = await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`, {
            headers: { Authorization: `token ${token}` }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const tree = data.tree || [];

        // Filter prediction files (data/predictions/**/pred_*.json)
        const predictionFiles = tree.filter(item =>
            item.path.startsWith('data/predictions/') &&
            item.path.includes('/pred_') &&
            item.path.endsWith('.json') &&
            item.type === 'blob'
        );

        console.log(`Found ${predictionFiles.length} prediction files on GitHub`);

        // Download all predictions in parallel
        const predictions = await Promise.all(
            predictionFiles.map(async (file) => {
                try {
                    const fileResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}`, {
                        headers: { Authorization: `token ${token}` }
                    });

                    if (!fileResponse.ok) return null;

                    const fileData = await fileResponse.json();
                    const content = decodeURIComponent(escape(atob(fileData.content)));
                    return JSON.parse(content);
                } catch (e) {
                    console.error(`Error loading ${file.path}:`, e);
                    return null;
                }
            })
        );

        // Filter out nulls and save to localStorage for cache
        const validPredictions = predictions.filter(p => p !== null);

        // Cache in localStorage
        validPredictions.forEach(pred => {
            const storageKey = `prediction_${pred.id}`;
            localStorage.setItem(storageKey, JSON.stringify(pred));
        });

        console.log(`✅ Loaded ${validPredictions.length} predictions from GitHub`);
        return validPredictions;

    } catch (error) {
        console.error('Error loading from GitHub:', error);
        return [];
    }
}

/**
 * Load prediction from cluster storage
 */
async function loadPredictionFromCluster(predictionId) {
    try {
        // Try localStorage first
        const storageKey = `prediction_${predictionId}`;
        const data = localStorage.getItem(storageKey);

        if (data) {
            return JSON.parse(data);
        }

        // In real implementation, would fetch from GitHub
        console.warn(`Prediction ${predictionId} not found in storage`);
        return null;
    } catch (error) {
        console.error('Error loading prediction:', error);
        return null;
    }
}

/**
 * Load predictions from cluster (language + category)
 */
async function loadPredictionsFromCluster(language, category, year = null, quarter = null) {
    try {
        // In real implementation, would fetch from cluster path
        // For now, scan localStorage
        const predictions = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('prediction_')) {
                const data = localStorage.getItem(key);
                const pred = JSON.parse(data);

                // Filter by language and category
                if (pred.language === language && pred.category === category) {
                    // Filter by year/quarter if specified
                    if (year || quarter) {
                        const { year: predYear, quarter: predQuarter } = getQuarter(pred.revealDate);
                        if (year && predYear !== year) continue;
                        if (quarter && predQuarter !== quarter) continue;
                    }
                    predictions.push(pred);
                }
            }
        }

        return predictions;
    } catch (error) {
        console.error('Error loading predictions from cluster:', error);
        return [];
    }
}

/**
 * Load all predictions (from GitHub, cache, or localStorage)
 */
async function loadAllPredictions() {
    try {
        // Check if we should load from GitHub
        const hasGitHub = localStorage.getItem('githubToken') && localStorage.getItem('githubRepo');

        if (hasGitHub) {
            // Try to load from GitHub first
            const githubPredictions = await loadAllPredictionsFromGitHub();

            if (githubPredictions.length > 0) {
                // Sort by created date (newest first)
                githubPredictions.sort((a, b) => b.created - a.created);

                // Update hot cache
                await updateHotCache(githubPredictions);

                return githubPredictions;
            }
        }

        // Fallback 1: Try to load from hot cache
        const cached = await loadFromCache('hot');
        if (cached && cached.predictions && cached.predictions.length > 0) {
            console.log(`📦 Loaded ${cached.predictions.length} predictions from cache`);
            return cached.predictions;
        } else if (cached && cached.predictions && cached.predictions.length === 0) {
            console.log('⚠️ Cache exists but is empty - skipping to localStorage scan');
        }

        // Fallback 2: scan all predictions in localStorage
        const predictions = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('prediction_')) {
                const data = localStorage.getItem(key);
                predictions.push(JSON.parse(data));
            }
        }

        // Sort by created date (newest first)
        predictions.sort((a, b) => b.created - a.created);

        console.log(`💾 Loaded ${predictions.length} predictions from localStorage`);
        return predictions;
    } catch (error) {
        console.error('Error loading all predictions:', error);
        return [];
    }
}

// ==================== CACHE MANAGEMENT ====================

/**
 * Load from cache
 */
async function loadFromCache(cacheType) {
    try {
        let cacheKey;

        switch (cacheType) {
            case 'hot':
                cacheKey = 'cache_hot';
                break;
            case 'language':
                cacheKey = 'cache_language_' + arguments[1];
                break;
            case 'category':
                cacheKey = 'cache_category_' + arguments[1];
                break;
            default:
                return null;
        }

        const data = localStorage.getItem(cacheKey);
        if (!data) return null;

        const cached = JSON.parse(data);

        // Check TTL (1 hour)
        const age = Date.now() - cached.lastUpdated;
        if (age > 3600000) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return cached;
    } catch (error) {
        console.error('Error loading cache:', error);
        return null;
    }
}

/**
 * Update hot cache with trending predictions
 */
async function updateHotCache(predictions) {
    try {
        // Sort by trending score (views + upvotes + recency)
        const scored = predictions.map(p => ({
            ...p,
            score: (p.metadata?.views || 0) + (p.metadata?.upvotes || 0) * 2 +
                   (Date.now() - p.created < 86400000 * 7 ? 100 : 0) // Bonus for new predictions
        }));

        scored.sort((a, b) => b.score - a.score);

        const hot = {
            lastUpdated: Date.now(),
            ttl: 3600,
            predictions: scored.slice(0, 100) // Top 100
        };

        localStorage.setItem('cache_hot', JSON.stringify(hot));
        console.log('Hot cache updated');
    } catch (error) {
        console.error('Error updating hot cache:', error);
    }
}

// ==================== INDEX MANAGEMENT ====================

/**
 * Update cluster index (language + category level)
 */
async function updateClusterIndex(language, category) {
    try {
        const predictions = await loadPredictionsFromCluster(language, category);

        // Count by year/quarter
        const byYear = {};
        predictions.forEach(p => {
            const { year, quarter } = getQuarter(p.revealDate);
            if (!byYear[year]) {
                byYear[year] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
            }
            byYear[year][quarter]++;
        });

        // Recent predictions (last 10)
        const recent = predictions
            .sort((a, b) => b.created - a.created)
            .slice(0, 10)
            .map(p => ({
                id: p.id,
                title: p.title,
                author: p.author,
                created: p.created,
                revealDate: p.revealDate,
                path: getPredictionPath(p)
            }));

        const index = {
            language,
            category,
            totalPredictions: predictions.length,
            lastUpdated: Date.now(),
            byYear,
            recentPredictions: recent
        };

        const indexKey = `index_${language}_${category}`;
        localStorage.setItem(indexKey, JSON.stringify(index));

        console.log(`Cluster index updated: ${language}/${category}`);
    } catch (error) {
        console.error('Error updating cluster index:', error);
    }
}

/**
 * Update global index
 */
async function updateGlobalIndex() {
    try {
        const allPredictions = await loadAllPredictions();

        // Count by language
        const byLanguage = {};
        CLUSTER_CONFIG.languages.forEach(lang => byLanguage[lang] = 0);

        // Count by category
        const byCategory = {};
        CLUSTER_CONFIG.categories.forEach(cat => byCategory[cat] = 0);

        // Count by year
        const byYear = {};

        allPredictions.forEach(p => {
            if (p.language) byLanguage[p.language]++;
            if (p.category) byCategory[p.category]++;

            const { year } = getQuarter(p.revealDate);
            byYear[year] = (byYear[year] || 0) + 1;
        });

        // Calculate storage usage
        const totalSize = allPredictions.reduce((sum, p) => {
            return sum + JSON.stringify(p).length;
        }, 0);
        const maxSize = 100 * 1024 * 1024; // 100MB
        const usagePercent = Math.round((totalSize / maxSize) * 100);

        const globalIndex = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalPredictions: allPredictions.length,
            byLanguage,
            byCategory,
            byYear,
            metadata: {
                totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
                maxSize: '100MB',
                usagePercent
            }
        };

        localStorage.setItem('index_global', JSON.stringify(globalIndex));
        console.log('Global index updated:', globalIndex);

        return globalIndex;
    } catch (error) {
        console.error('Error updating global index:', error);
    }
}

/**
 * Get global index
 */
async function getGlobalIndex() {
    try {
        const data = localStorage.getItem('index_global');
        if (!data) {
            return await updateGlobalIndex();
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error getting global index:', error);
        return null;
    }
}

// ==================== QUERY HELPERS ====================

/**
 * Search predictions by criteria
 */
async function searchPredictions(criteria) {
    try {
        let predictions = [];

        // If specific language/category, use cluster
        if (criteria.language && criteria.category) {
            predictions = await loadPredictionsFromCluster(
                criteria.language,
                criteria.category,
                criteria.year,
                criteria.quarter
            );
        } else {
            // Load all and filter
            predictions = await loadAllPredictions();
        }

        // Apply filters
        if (criteria.language && !criteria.category) {
            predictions = predictions.filter(p => p.language === criteria.language);
        }
        if (criteria.category && !criteria.language) {
            predictions = predictions.filter(p => p.category === criteria.category);
        }
        if (criteria.author) {
            predictions = predictions.filter(p => p.author === criteria.author);
        }
        if (criteria.revealed !== undefined) {
            predictions = predictions.filter(p => p.revealed === criteria.revealed);
        }
        if (criteria.tags) {
            predictions = predictions.filter(p =>
                p.tags && criteria.tags.some(tag => p.tags.includes(tag))
            );
        }

        return predictions;
    } catch (error) {
        console.error('Error searching predictions:', error);
        return [];
    }
}

// ==================== EXPORTS ====================

// Export functions for use in index.html
window.ClusterStorage = {
    // Path generation
    getClusterPath,
    getPredictionFilename,
    getPredictionPath,
    getQuarter,

    // Storage operations
    savePredictionToCluster,
    loadPredictionFromCluster,
    loadPredictionsFromCluster,
    loadAllPredictions,

    // Cache management
    loadFromCache,
    updateHotCache,

    // Index management
    updateClusterIndex,
    updateGlobalIndex,
    getGlobalIndex,

    // Query helpers
    searchPredictions,

    // Config
    config: CLUSTER_CONFIG
};

console.log('Cluster Storage System loaded');
