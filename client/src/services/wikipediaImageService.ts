export interface WikipediaImage {
  url: string;
  title: string;
  description?: string;
}

export class WikipediaImageService {
  private static readonly BASE_URL = 'https://en.wikipedia.org/api/rest_v1';

  static async searchImages(query: string, limit = 10): Promise<WikipediaImage[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/page/media-list/${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.items
        ?.filter((item: any) => item.type === 'image')
        ?.slice(0, limit)
        ?.map((item: any) => ({
          url: item.srcset?.[0]?.src || item.original?.source,
          title: item.title,
          description: item.description
        })) || [];
    } catch (error) {
      console.error('Error fetching Wikipedia images:', error);
      return [];
    }
  }

  static async getCountryFlag(countryName: string): Promise<string | null> {
    try {
      const images = await this.searchImages(`Flag of ${countryName}`, 1);
      return images[0]?.url || null;
    } catch (error) {
      console.error('Error fetching country flag:', error);
      return null;
    }
  }

  
  static async getMultipleWeaponImages(weapons: string[]): Promise<WikipediaImage[]> {
    try {
      const imagePromises = weapons.map(weapon => this.searchImages(weapon, 1));
      const results = await Promise.all(imagePromises);
      return results.flat();
    } catch (error) {
      console.error('Error fetching multiple weapon images:', error);
      return [];
    }
  }

  static async getMultipleWeaponImagesFromObjects(weapons: { name: string; category: string; }[]): Promise<WikipediaImage[]> {
    try {
      const weaponNames = weapons.map(weapon => weapon.name);
      const imagePromises = weaponNames.map(name => this.searchImages(name, 1));
      const results = await Promise.all(imagePromises);
      return results.flat();
    } catch (error) {
      console.error('Error fetching multiple weapon images from objects:', error);
      return [];
    }
  }
}

export const fetchWeaponImage = async (weaponName: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(weaponName)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.thumbnail?.source || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching weapon image:', error);
    return null;
  }
};
