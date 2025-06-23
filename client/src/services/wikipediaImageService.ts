interface WikipediaImageResponse {
  query?: {
    pages?: {
      [key: string]: {
        title?: string;
        pageimage?: string;
        thumbnail?: {
          source: string;
          width: number;
          height: number;
        };
        original?: {
          source: string;
        };
      };
    };
  };
}

interface WeaponImageResult {
  name: string;
  imageUrl: string;
  success: boolean;
}

export class WikipediaImageService {
  private static readonly BASE_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
  private static readonly API_URL = 'https://en.wikipedia.org/w/api.php';

  static async getWeaponImage(weaponName: string): Promise<WeaponImageResult> {
    try {
      // Clean weapon name for Wikipedia search
      const cleanName = this.cleanWeaponName(weaponName);
      
      // First try to get the page summary with image
      const summaryUrl = `${this.BASE_URL}${encodeURIComponent(cleanName)}`;
      const summaryResponse = await fetch(summaryUrl);
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        if (summaryData.thumbnail?.source) {
          return {
            name: weaponName,
            imageUrl: summaryData.thumbnail.source.replace(/\/\d+px-/, '/800px-'),
            success: true
          };
        }
      }

      // Fallback: Search for the page and get image from infobox
      const searchResult = await this.searchWikipediaPage(cleanName);
      if (searchResult) {
        return {
          name: weaponName,
          imageUrl: searchResult,
          success: true
        };
      }

      // If no image found, return fallback
      return {
        name: weaponName,
        imageUrl: this.getFallbackImage(weaponName),
        success: false
      };

    } catch (error) {
      console.error(`Error fetching image for ${weaponName}:`, error);
      return {
        name: weaponName,
        imageUrl: this.getFallbackImage(weaponName),
        success: false
      };
    }
  }

  private static async searchWikipediaPage(weaponName: string): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        titles: weaponName,
        prop: 'pageimages|pageterms',
        pithumbsize: '800',
        origin: '*'
      });

      const response = await fetch(`${this.API_URL}?${params}`);
      const data: WikipediaImageResponse = await response.json();

      if (data.query?.pages) {
        const pages = Object.values(data.query.pages);
        const page = pages[0];
        
        if (page?.thumbnail?.source) {
          return page.thumbnail.source;
        }
      }

      return null;
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return null;
    }
  }

  private static cleanWeaponName(name: string): string {
    // Remove variant designations and clean up the name for better Wikipedia matches
    const cleanName = name
      .replace(/Mk\.\d+/, '') // Remove Mk.4, Mk.3 etc
      .replace(/\bI\b|\bII\b|\bIII\b/, '') // Remove Roman numerals
      .replace(/\(.*\)/, '') // Remove parenthetical info
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Handle special cases
    const specialCases: { [key: string]: string } = {
      'F-35I Adir': 'Lockheed Martin F-35 Lightning II',
      'F-16I Sufa': 'General Dynamics F-16 Fighting Falcon',
      'F-15I Ra\'am': 'McDonnell Douglas F-15 Eagle',
      'AH-64 Apache': 'Boeing AH-64 Apache',
      'Iron Dome': 'Iron Dome',
      'David\'s Sling': 'David\'s Sling',
      'Jericho III': 'Intermediate-range ballistic missile',
      'Spike NLOS': 'Spike (missile)',
      'Merkava Mk.4': 'Merkava',
      'Merkava Mk.3': 'Merkava',
      'Namer APC': 'Namer',
      'Sa\'ar 6 Corvette': 'Sa\'ar 6-class corvette',
      'Dolphin Submarine': 'Dolphin-class submarine',
      'Qassam Rocket': 'Qassam rocket',
      'Grad Rocket': 'BM-21 Grad',
      'M-75 Rocket': 'Fajr-5',
      'F-14 Tomcat': 'Grumman F-14 Tomcat',
      'F-4 Phantom II': 'McDonnell Douglas F-4 Phantom II',
      'Shahab-3': 'Shahab-3',
      'Fateh-110': 'Fateh-110',
      'Hawker Hunter': 'Hawker Hunter',
      'AT-3 Sagger': '9M14 Malyutka',
      'Sa\'ar 4.5 Missile Boat': 'Sa\'ar 4.5-class missile boat',
      'Improvised Vehicle': 'Improvised fighting vehicle',
      'Jamaran Frigate': 'IRIS Jamaran (76)',
      'F-35A Lightning II': 'Lockheed Martin F-35 Lightning II',
      'Mi-25 Hind': 'Mil Mi-24',
      'Tomahawk Block V': 'BGM-109 Tomahawk',
      'Minuteman III': 'LGM-30 Minuteman',
      'Javelin': 'FGM-148 Javelin',
      'Gerald R. Ford-class': 'Gerald R. Ford-class aircraft carrier',
      'Katyusha': 'Katyusha rocket launcher',
      'F-15SA Eagle': 'McDonnell Douglas F-15 Eagle',
      'M1A2S Abrams': 'M1 Abrams',
      'Al Riyadh-class': 'Al Riyadh-class frigate',
      'Patriot PAC-2': 'MIM-104 Patriot',
      'S-300': 'S-300 missile system',
      'MICA': 'MICA (missile)',
      'FREMM Frigate': 'FREMM multipurpose frigate',
      'Type 99A': 'Type 99 tank',
      'Type 96B': 'Type 96 tank',
      'J-20': 'Chengdu J-20',
      'Type 055-class': 'Type 055 destroyer',
      'Type 055': 'Type 055-class destroyer',
      'Type 052D': 'Type 052D destroyer',
      'DF-41': 'Dongfeng-41',
      'Admiral Gorshkov': 'Project 22350 frigate',
      'Kinzhal': 'Kh-47M2 Kinzhal',
      'Arjun Mk 1A': 'Arjun (tank)',
      'T-90S Bhishma': 'T-90',
      'INS Vikrant': 'INS Vikrant (2013)',
      'Kolkata-class': 'Kolkata-class destroyer',
      'BMP-2 Sarath': 'BMP-2',
      'Zulfiquar-class': 'Zulfiquar-class frigate',
      'Agosta 90B': 'Agosta 90B-class submarine',
      'Shaheen-III': 'Shaheen-III',
      'Babur': 'Babur cruise missile',
      'SAAD APC': 'SAAD armored personnel carrier',
      'M113A2': 'M113 armored personnel carrier',
      'Sinpo-class': 'Submarine',
      'Najin-class': 'Najin-class frigate',
      'Hwasong-17': 'Hwasong-17',
      'KN-23': 'Hwasong-11A',
      'M-2010': 'Infantry fighting vehicle',
      'Sejong the Great-class': 'Sejong the Great-class destroyer',
      'Incheon-class': 'Incheon-class frigate',
      'Hyunmoo-2C': 'Hyunmoo',
      'K200A1': 'K200 KIFV',
      'Leclerc': 'Leclerc (tank)',
      'Charles de Gaulle': 'French aircraft carrier Charles de Gaulle',
      'Horizon-class': 'Horizon-class frigate',
      'M51 SLBM': 'M51 (missile)',
      'SCALP': 'Storm Shadow',
      'VAB': 'Véhicule de l\'Avant Blindé',
      'Ajax': 'General Dynamics Ajax',
      'F-35B Lightning II': 'Lockheed Martin F-35 Lightning II',
      'Queen Elizabeth-class': 'Queen Elizabeth-class aircraft carrier',
      'Type 45': 'Type 45 destroyer',
      'Warrior': 'Warrior tracked armoured vehicle',
      'Foxhound': 'Ocelot (vehicle)',
      'Virginia-class': 'Virginia-class submarine',
 


    };

    return specialCases[name] || cleanName;
  }

  private static getFallbackImage(weaponName: string): string {
    // Generate a placeholder image with weapon-specific styling
    const encodedName = encodeURIComponent(weaponName);
    return `https://via.placeholder.com/800x600/1a1a1a/00ff88?text=${encodedName}`;
  }

  static async getMultipleWeaponImages(weapons: Array<{ name: string }>): Promise<WeaponImageResult[]> {
    const promises = weapons.map(weapon => this.getWeaponImage(weapon.name));
    return await Promise.all(promises);
  }
}