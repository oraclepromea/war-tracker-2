// Get API base URL from environment variable
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://war-tracker-20-production.up.railway.app';

// console.log('🔗 API Base URL:', API_BASE_URL);

// FIXED: Update API configuration for production deployment
export const API_BASE_URL = import.meta.env.NODE_ENV === 'production' 
  ? 'https://war-tracker-20-production.up.railway.app'
  : 'http://localhost:8000';

// FIXED: Add proper CORS headers and error handling
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...options.headers,
      },
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// FIXED: Add fallback data for when API is unavailable
export const getFallbackData = () => ({
  articles: [],
  events: [],
  weapons: [],
  status: 'offline'
});

// export const api = {
//   // Health check
//   async checkHealth() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/health`);
//       return response.ok;
//     } catch (error) {
//       console.error('Health check failed:', error);
//       return false;
//     }
//   },

//   // News endpoints
//   async getNews() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/news`);
//       if (!response.ok) throw new Error(`HTTP ${response.status}`);
//       return await response.json();
//     } catch (error) {
//       console.error('Failed to fetch news:', error);
//       throw error;
//     }
//   },

//   // Events endpoint
//   async getEvents() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/events`);
//       if (!response.ok) throw new Error(`HTTP ${response.status}`);
//       return await response.json();
//     } catch (error) {
//       console.error('Failed to fetch events:', error);
//       throw error;
//     }
//   },

//   // Conflicts endpoint
//   async getConflicts() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/conflicts`);
//       if (!response.ok) throw new Error(`HTTP ${response.status}`);
//       return await response.json();
//     } catch (error) {
//       console.error('Failed to fetch conflicts:', error);
//       throw error;
//     }
//   },

//   // Sources endpoint
//   async getSources() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/sources`);
//       if (!response.ok) throw new Error(`HTTP ${response.status}`);
//       return await response.json();
//     } catch (error) {
//       console.error('Failed to fetch sources:', error);
//       throw error;
//     }
//   },

//   // Sync RSS feeds
//   async syncRSS() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/sync-rss`, {
//         method: 'POST'
//       });
//       if (!response.ok) throw new Error(`HTTP ${response.status}`);
//       return await response.json();
//     } catch (error) {
//       console.error('Failed to sync RSS:', error);
//       throw error;
//     }
//   }
// };

// Enhanced RSS sources with international feeds and translation support
export const RSS_SOURCES = [
  // English Language Sources
  {
    name: 'Reuters World News',
    url: 'https://feeds.reuters.com/reuters/worldNews',
    category: 'international',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'BBC World News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'international',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'Associated Press',
    url: 'https://feeds.apnews.com/rss/apf-topnews',
    category: 'breaking',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'CNN World',
    url: 'http://rss.cnn.com/rss/edition.rss',
    category: 'international',
    language: 'en',
    priority: 'medium'
  },
  {
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'middle_east',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'Times of Israel',
    url: 'https://www.timesofisrael.com/feed/',
    category: 'middle_east',
    language: 'en',
    priority: 'high'
  },

  // Government & Military Sources
  {
    name: 'Pentagon News',
    url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10',
    category: 'military',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'NATO News',
    url: 'https://www.nato.int/cps/en/natohq/news.rss',
    category: 'military',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'US State Department',
    url: 'https://www.state.gov/rss-feeds/',
    category: 'diplomatic',
    language: 'en',
    priority: 'medium'
  },

  // Ukrainian Sources (with translation)
  {
    name: 'Ukraine Ministry of Defence',
    url: 'https://www.mil.gov.ua/news/rss.xml',
    category: 'ukraine',
    language: 'uk',
    priority: 'high',
    needsTranslation: true
  },
  {
    name: 'Kyiv Independent',
    url: 'https://kyivindependent.com/rss',
    category: 'ukraine',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'Ukrainska Pravda',
    url: 'https://www.pravda.com.ua/rss/',
    category: 'ukraine',
    language: 'uk',
    priority: 'high',
    needsTranslation: true
  },

  // Russian Sources (with translation)
  {
    name: 'RT News',
    url: 'https://www.rt.com/rss/',
    category: 'russia',
    language: 'en',
    priority: 'medium',
    note: 'State-controlled media'
  },
  {
    name: 'TASS',
    url: 'https://tass.ru/rss/v2.xml',
    category: 'russia',
    language: 'ru',
    priority: 'medium',
    needsTranslation: true,
    note: 'State news agency'
  },

  // Middle East Sources (with translation)
  {
    name: 'Al Arabiya',
    url: 'https://www.alarabiya.net/rss.xml',
    category: 'middle_east',
    language: 'ar',
    priority: 'high',
    needsTranslation: true
  },
  {
    name: 'Haaretz',
    url: 'https://www.haaretz.com/cmlink/1.628752',
    category: 'israel',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'Jerusalem Post',
    url: 'https://www.jpost.com/rss/rssfeedsheadlines.aspx',
    category: 'israel',
    language: 'en',
    priority: 'high'
  },
  {
    name: 'Ynet News',
    url: 'https://www.ynetnews.com/Integration/StoryRss3082.xml',
    category: 'israel',
    language: 'he',
    priority: 'medium',
    needsTranslation: true
  },

  // European Sources
  {
    name: 'Deutsche Welle',
    url: 'https://rss.dw.com/xml/rss-en-all',
    category: 'europe',
    language: 'en',
    priority: 'medium'
  },
  {
    name: 'France 24',
    url: 'https://www.france24.com/en/rss',
    category: 'europe',
    language: 'en',
    priority: 'medium'
  },

  // Specialized Military & Intelligence
  {
    name: 'Defense News',
    url: 'https://www.defensenews.com/arc/outboundfeeds/rss/',
    category: 'military',
    language: 'en',
    priority: 'medium'
  },
  {
    name: 'Military Times',
    url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/',
    category: 'military',
    language: 'en',
    priority: 'medium'
  },
  {
    name: 'ISW Institute',
    url: 'https://www.understandingwar.org/rss.xml',
    category: 'analysis',
    language: 'en',
    priority: 'high'
  }
];

// Social Media OSINT Sources (Twitter/X accounts to monitor)
export const OSINT_TWITTER_SOURCES = [
  // Military & Intelligence
  '@OfficialDGISPR', // Pakistan Military
  '@thestudyofwar', // Institute for Study of War
  '@UAWeapons', // Ukraine Weapons Tracker
  '@GeoConfirmed', // Geolocation verification
  '@IntelCrab', // OSINT analyst
  '@Archer83Able', // Military analyst
  '@WarMonitor3', // Conflict monitoring
  '@Conflicts', // Armed Conflicts Location
  '@calibreobscura', // Weapons identification
  '@CITeam_en', // Cyber Threat Intelligence

  // Ukraine Conflict
  '@DefenceU', // Ukraine Defense Ministry
  '@ArmedForcesUkr', // Ukrainian Armed Forces
  '@GeneralStaffUA', // General Staff of Ukraine
  '@ZelenskyyUa', // President Zelensky
  '@KyivIndependent', // Kyiv Independent
  '@IAPonomarenko', // Military correspondent
  '@ChristopherJM', // Military analyst
  '@RALee85', // Russia/Ukraine analyst
  '@oryxspioenkop', // Equipment losses tracker
  '@Blue_Sauron', // OSINT analyst

  // Middle East
  '@IDFSpokesperson', // Israel Defense Forces
  '@manniefabian', // Times of Israel military
  '@ElintNews', // Intelligence news
  '@ShehabAgency', // Palestinian news
  '@NotWoofers', // OSINT Middle East

  // Russian Sources
  '@mod_russia', // Russian MoD
  '@mfa_russia' // Russian Foreign Ministry
];

// Telegram Channels for Intelligence
export const TELEGRAM_INTELLIGENCE_CHANNELS = [
  // Ukraine Intelligence
  '@ukraine_now',
  '@suspilne_news',
  '@truexanewsua',
  '@dsszzi_official', // Ukraine State Security
  '@ukraine_defence_intelligence',

  // Russian Channels
  '@rian_ru',
  '@tass_agency',
  '@mod_russia_en',

  // OSINT & Analysis
  '@rybar_en', // Military analysis
  '@intel_slava_z',
  '@warmonitors',
  '@militarylandnet',
  '@intelslava',

  // Middle East
  '@almanarnews',
  '@palestineonlineee',
  '@PresidencyZA' // South Africa presidency (neutral perspective)
];

// Translation service configuration
export const TRANSLATION_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY,
  endpoint: 'https://translation.googleapis.com/language/translate/v2',
  supportedLanguages: {
    'ar': 'Arabic',
    'he': 'Hebrew', 
    'uk': 'Ukrainian',
    'ru': 'Russian',
    'fa': 'Persian/Farsi',
    'tr': 'Turkish',
    'de': 'German',
    'fr': 'French'
  },
  targetLanguage: 'en',
  cacheEnabled: true,
  cacheDuration: 24 * 60 * 60 * 1000 // 24 hours
};
