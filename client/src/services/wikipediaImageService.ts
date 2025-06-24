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
