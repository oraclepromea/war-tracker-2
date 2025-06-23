import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import configManager from './config.js';

/**
 * Levenshtein distance implementation for similarity detection
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Distance between strings
 */
function levenshteinDistance(str1, str2) {
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;

    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + indicator // substitution
            );
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Article validation configuration
 */
const VALIDATION_CONFIG = {
    MIN_TITLE_LENGTH: 3,
    MAX_TITLE_LENGTH: 500,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 2000,
    SIMILARITY_THRESHOLD: 0.85, // 85% similarity threshold
    URL_TIMEOUT_MS: 5000,
    VALIDATION_CACHE_TTL: 3600, // 1 hour cache
    BATCH_SIZE: 50,
    MAX_VALIDATION_ERRORS: 5
};

/**
 * URL validation regex patterns
 */
const URL_PATTERNS = {
    HTTP: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    SUSPICIOUS: /\.(exe|zip|rar|dmg|pkg|apk|bat|cmd|scr|vbs)$/i,
    SOCIAL_MEDIA: /\.(facebook|twitter|instagram|tiktok|linkedin|youtube)\.com/i,
    BLACKLISTED_DOMAINS: [
        'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
        'spam.com', 'malware.com', 'phishing.com'
    ]
};

/**
 * Content normalization patterns
 */
const NORMALIZATION_PATTERNS = {
    WHITESPACE: /\s+/g,
    HTML_TAGS: /<[^>]*>/g,
    HTML_ENTITIES: /&[^;]+;/g,
    SPECIAL_CHARS: /[^\w\s\-.,!?()]/g,
    MULTIPLE_PUNCTUATION: /[.!?]{2,}/g,
    QUOTES: /["""'']/g
};

class ArticleValidator {
    constructor() {
        this.supabase = null;
        this.validationCache = new Map();
        this.similarityCache = new Map();
        this.urlValidationCache = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await configManager.initialize();
            const supabaseConfig = configManager.getSupabaseConfig();
            this.supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
            
            this.initialized = true;
            console.log('Article Validator initialized successfully');
        } catch (error) {
            throw new Error(`Article Validator initialization failed: ${error.message}`);
        }
    }

    /**
     * Normalizes text content for consistent processing
     * @param {string} text - Text to normalize
     * @returns {string} Normalized text
     */
    normalizeContent(text) {
        if (!text || typeof text !== 'string') return '';

        return text
            .replace(NORMALIZATION_PATTERNS.HTML_TAGS, ' ')
            .replace(NORMALIZATION_PATTERNS.HTML_ENTITIES, ' ')
            .replace(NORMALIZATION_PATTERNS.QUOTES, '"')
            .replace(NORMALIZATION_PATTERNS.SPECIAL_CHARS, ' ')
            .replace(NORMALIZATION_PATTERNS.MULTIPLE_PUNCTUATION, '.')
            .replace(NORMALIZATION_PATTERNS.WHITESPACE, ' ')
            .trim()
            .toLowerCase();
    }

    /**
     * Generates SHA-256 hash for article content
     * @param {Object} article - Article object
     * @returns {string} SHA-256 hash
     */
    generateContentHash(article) {
        const normalizedTitle = this.normalizeContent(article.title);
        const normalizedDescription = this.normalizeContent(article.description || '');
        const normalizedUrl = (article.link || '').toLowerCase().trim();
        const publishDate = article.pubDate ? new Date(article.pubDate).toISOString().split('T')[0] : '';

        const contentString = `${normalizedTitle}|${normalizedDescription}|${normalizedUrl}|${publishDate}`;
        
        return crypto
            .createHash('sha256')
            .update(contentString, 'utf8')
            .digest('hex');
    }

    /**
     * Validates URL format and safety
     * @param {string} url - URL to validate
     * @returns {Object} Validation result
     */
    async validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return { valid: false, reason: 'URL is required and must be a string' };
        }

        // Check cache first
        const cacheKey = url.toLowerCase();
        if (this.urlValidationCache.has(cacheKey)) {
            const cached = this.urlValidationCache.get(cacheKey);
            if (Date.now() - cached.timestamp < VALIDATION_CONFIG.VALIDATION_CACHE_TTL * 1000) {
                return cached.result;
            }
        }

        const result = await this._performUrlValidation(url);
        
        // Cache result
        this.urlValidationCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });

        // Limit cache size
        if (this.urlValidationCache.size > 1000) {
            const oldestKey = this.urlValidationCache.keys().next().value;
            this.urlValidationCache.delete(oldestKey);
        }

        return result;
    }

    async _performUrlValidation(url) {
        try {
            // Basic format validation
            if (!URL_PATTERNS.HTTP.test(url)) {
                return { valid: false, reason: 'Invalid URL format' };
            }

            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();

            // Check blacklisted domains
            if (URL_PATTERNS.BLACKLISTED_DOMAINS.some(domain => hostname.includes(domain))) {
                return { valid: false, reason: 'Blacklisted domain' };
            }

            // Check for suspicious file extensions
            if (URL_PATTERNS.SUSPICIOUS.test(url)) {
                return { valid: false, reason: 'Suspicious file extension' };
            }

            // Check for social media redirects (optional warning)
            const isSocialMedia = URL_PATTERNS.SOCIAL_MEDIA.test(hostname);

            // Validate URL accessibility (with timeout)
            const isAccessible = await this._checkUrlAccessibility(url);

            return {
                valid: isAccessible,
                reason: isAccessible ? null : 'URL not accessible',
                warnings: isSocialMedia ? ['Social media link detected'] : [],
                hostname,
                protocol: urlObj.protocol
            };

        } catch (error) {
            return { valid: false, reason: `URL validation error: ${error.message}` };
        }
    }

    async _checkUrlAccessibility(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), VALIDATION_CONFIG.URL_TIMEOUT_MS);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'War Tracker RSS Validator v2.0'
                }
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false; // Consider inaccessible URLs as invalid for safety
        }
    }

    /**
     * Calculates similarity between two articles
     * @param {Object} article1 - First article
     * @param {Object} article2 - Second article
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(article1, article2) {
        const title1 = this.normalizeContent(article1.title);
        const title2 = this.normalizeContent(article2.title);
        const desc1 = this.normalizeContent(article1.description || '');
        const desc2 = this.normalizeContent(article2.description || '');

        if (!title1 || !title2) return 0;

        // Calculate title similarity
        const titleDistance = levenshteinDistance(title1, title2);
        const maxTitleLength = Math.max(title1.length, title2.length);
        const titleSimilarity = maxTitleLength > 0 ? 1 - (titleDistance / maxTitleLength) : 0;

        // Calculate description similarity if both exist
        let descSimilarity = 0;
        if (desc1 && desc2) {
            const descDistance = levenshteinDistance(desc1, desc2);
            const maxDescLength = Math.max(desc1.length, desc2.length);
            descSimilarity = maxDescLength > 0 ? 1 - (descDistance / maxDescLength) : 0;
        }

        // Weight title more heavily than description
        return (titleSimilarity * 0.7) + (descSimilarity * 0.3);
    }

    /**
     * Validates article content
     * @param {Object} article - Article to validate
     * @returns {Object} Validation result
     */
    async validateContent(article) {
        const errors = [];
        const warnings = [];

        // Title validation
        if (!article.title || typeof article.title !== 'string') {
            errors.push('Title is required and must be a string');
        } else {
            const titleLength = article.title.trim().length;
            if (titleLength < VALIDATION_CONFIG.MIN_TITLE_LENGTH) {
                errors.push(`Title too short (${titleLength} chars, minimum ${VALIDATION_CONFIG.MIN_TITLE_LENGTH})`);
            }
            if (titleLength > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
                errors.push(`Title too long (${titleLength} chars, maximum ${VALIDATION_CONFIG.MAX_TITLE_LENGTH})`);
            }
        }

        // URL validation
        const urlValidation = await this.validateUrl(article.link);
        if (!urlValidation.valid) {
            errors.push(`Invalid URL: ${urlValidation.reason}`);
        }
        if (urlValidation.warnings) {
            warnings.push(...urlValidation.warnings);
        }

        // Description validation
        if (article.description) {
            const descLength = article.description.trim().length;
            if (descLength < VALIDATION_CONFIG.MIN_DESCRIPTION_LENGTH) {
                warnings.push(`Description short (${descLength} chars)`);
            }
            if (descLength > VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH) {
                warnings.push(`Description long (${descLength} chars)`);
            }
        }

        // Date validation
        if (article.pubDate) {
            const pubDate = new Date(article.pubDate);
            if (isNaN(pubDate.getTime())) {
                warnings.push('Invalid publication date format');
            } else {
                const now = new Date();
                const daysDiff = (now - pubDate) / (1000 * 60 * 60 * 24);
                if (daysDiff > 365) {
                    warnings.push(`Article is ${Math.round(daysDiff)} days old`);
                }
                if (pubDate > now) {
                    warnings.push('Publication date is in the future');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            contentHash: this.generateContentHash(article),
            urlValidation
        };
    }

    /**
     * Checks for duplicate articles in database
     * @param {Object} article - Article to check
     * @param {string} contentHash - Article content hash
     * @returns {Object} Duplicate check result
     */
    async checkForDuplicates(article, contentHash) {
        this.ensureInitialized();

        try {
            // Check by content hash first (exact duplicates)
            const { data: hashMatches, error: hashError } = await this.supabase
                .from('articles')
                .select('id, title, link, created_at, content_hash')
                .eq('content_hash', contentHash)
                .limit(5);

            if (hashError) {
                console.warn('Hash-based duplicate check failed:', hashError.message);
            }

            // Check by URL (same article from different sources)
            const { data: urlMatches, error: urlError } = await this.supabase
                .from('articles')
                .select('id, title, link, created_at, source')
                .eq('link', article.link)
                .limit(5);

            if (urlError) {
                console.warn('URL-based duplicate check failed:', urlError.message);
            }

            // Check for similar articles by title (fuzzy matching)
            const similarArticles = await this._findSimilarArticles(article);

            return {
                exactDuplicates: hashMatches || [],
                urlDuplicates: urlMatches || [],
                similarArticles: similarArticles || [],
                isDuplicate: (hashMatches && hashMatches.length > 0) || (urlMatches && urlMatches.length > 0),
                hasSimilar: similarArticles && similarArticles.length > 0
            };

        } catch (error) {
            console.error('Duplicate check failed:', error.message);
            return {
                exactDuplicates: [],
                urlDuplicates: [],
                similarArticles: [],
                isDuplicate: false,
                hasSimilar: false,
                error: error.message
            };
        }
    }

    async _findSimilarArticles(article) {
        // Get recent articles with similar titles for comparison
        const titleWords = this.normalizeContent(article.title).split(' ').filter(word => word.length > 3);
        if (titleWords.length === 0) return [];

        try {
            // Use basic text search for similar titles
            const searchQuery = titleWords.slice(0, 3).join(' | '); // Use first 3 significant words
            
            const { data: candidates, error } = await this.supabase
                .from('articles')
                .select('id, title, description, link, created_at')
                .textSearch('title', searchQuery)
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
                .limit(20);

            if (error || !candidates) return [];

            // Calculate similarity for each candidate
            const similarArticles = [];
            for (const candidate of candidates) {
                const similarity = this.calculateSimilarity(article, candidate);
                if (similarity >= VALIDATION_CONFIG.SIMILARITY_THRESHOLD) {
                    similarArticles.push({
                        ...candidate,
                        similarity
                    });
                }
            }

            return similarArticles.sort((a, b) => b.similarity - a.similarity);

        } catch (error) {
            console.warn('Similar articles search failed:', error.message);
            return [];
        }
    }

    /**
     * Logs validation error to database
     * @param {Object} article - Article that failed validation
     * @param {Array} errors - Validation errors
     * @param {string} source - RSS source
     */
    async logValidationError(article, errors, source) {
        try {
            const { error } = await this.supabase
                .from('validation_errors')
                .insert({
                    article_title: article.title || 'Unknown',
                    article_url: article.link || null,
                    source: source,
                    errors: errors,
                    validation_timestamp: new Date().toISOString(),
                    content_hash: this.generateContentHash(article)
                });

            if (error) {
                console.error('Failed to log validation error:', error.message);
            }
        } catch (dbError) {
            console.error('Validation error logging failed:', dbError.message);
        }
    }

    /**
     * Validates batch of articles
     * @param {Array} articles - Articles to validate
     * @param {string} source - RSS source
     * @returns {Object} Batch validation results
     */
    async validateBatch(articles, source) {
        const validArticles = [];
        const invalidArticles = [];
        const duplicateArticles = [];
        const processingErrors = [];

        console.log(`🔍 Validating batch of ${articles.length} articles from ${source}...`);

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            
            try {
                // Content validation
                const validation = await this.validateContent(article);
                
                if (!validation.valid) {
                    invalidArticles.push({
                        article,
                        errors: validation.errors,
                        warnings: validation.warnings
                    });
                    
                    await this.logValidationError(article, validation.errors, source);
                    continue;
                }

                // Duplicate checking
                const duplicateCheck = await this.checkForDuplicates(article, validation.contentHash);
                
                if (duplicateCheck.isDuplicate) {
                    duplicateArticles.push({
                        article,
                        duplicateInfo: duplicateCheck
                    });
                    continue;
                }

                // Article is valid and not a duplicate
                validArticles.push({
                    ...article,
                    contentHash: validation.contentHash,
                    isValid: true,
                    validationWarnings: validation.warnings,
                    similarArticles: duplicateCheck.similarArticles
                });

            } catch (error) {
                processingErrors.push({
                    article,
                    error: error.message
                });
                console.warn(`Validation error for article "${article.title}":`, error.message);
            }
        }

        const summary = {
            total: articles.length,
            valid: validArticles.length,
            invalid: invalidArticles.length,
            duplicates: duplicateArticles.length,
            errors: processingErrors.length
        };

        console.log(`✅ Validation complete: ${summary.valid} valid, ${summary.invalid} invalid, ${summary.duplicates} duplicates, ${summary.errors} errors`);

        return {
            validArticles,
            invalidArticles,
            duplicateArticles,
            processingErrors,
            summary
        };
    }

    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ArticleValidator not initialized. Call initialize() first.');
        }
    }

    /**
     * Cleanup method
     */
    cleanup() {
        this.validationCache.clear();
        this.similarityCache.clear();
        this.urlValidationCache.clear();
        console.log('Article Validator cleaned up');
    }
}

// Export singleton instance
const articleValidator = new ArticleValidator();

export default articleValidator;
export { ArticleValidator, VALIDATION_CONFIG, levenshteinDistance };