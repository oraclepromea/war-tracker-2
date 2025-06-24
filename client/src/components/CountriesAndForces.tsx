import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { WikipediaImageService } from '@/services/wikipediaImageService';

// Define weapon interface
interface Weapon {
  name: string;
  cost: number;
  quantity: number;
  speed: number;
  range: number;
  description: string;
  imageUrl: string;
}


const countries = [
  {
    id: 'israel',
    name: 'Israel',
    flag: '🇮🇱',
    casualties: 1247,
    economicImpact: 89.4,
    forces: {
      air: 340,
      naval: 65,
      ground: 168000,
      specialOps: 5000
    },
    weapons: {
      aircraft: [
        { 
          name: 'F-35I Adir', 
          cost: 110000000, 
          quantity: 50, 
          speed: 1960, 
          range: 2220, 
          description: 'Stealth multirole fighter',
          imageUrl: ''
        },
        { 
          name: 'F-16I Sufa', 
          cost: 34000000, 
          quantity: 175, 
          speed: 2120, 
          range: 4220, 
          description: 'Multirole fighter',
          imageUrl: ''
        },
        { 
          name: 'F-15I Ra\'am', 
          cost: 43000000, 
          quantity: 25, 
          speed: 2650, 
          range: 4815, 
          description: 'Strike fighter',
          imageUrl: ''
        },
        { 
          name: 'AH-64 Apache', 
          cost: 52000000, 
          quantity: 48, 
          speed: 365, 
          range: 476, 
          description: 'Attack helicopter',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'Iron Dome', 
          cost: 50000, 
          quantity: 2000, 
          speed: 850, 
          range: 70, 
          description: 'Air defense interceptor',
          imageUrl: ''
        },
        { 
          name: 'David\'s Sling', 
          cost: 1000000, 
          quantity: 300, 
          speed: 1400, 
          range: 300, 
          description: 'Medium-range air defense',
          imageUrl: ''
        },
        { 
          name: 'Jericho III', 
          cost: 50000000, 
          quantity: 50, 
          speed: 24000, 
          range: 6500, 
          description: 'Intercontinental ballistic missile',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Shavit_3rd_stage.JPG'
        },
        { 
          name: 'Spike NLOS', 
          cost: 400000, 
          quantity: 500, 
          speed: 180, 
          range: 50, 
          description: 'Anti-tank missile',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'Merkava Mk.4', 
          cost: 6000000, 
          quantity: 360, 
          speed: 64, 
          range: 500, 
          description: 'Main battle tank',
          imageUrl: ''
        },
        { 
          name: 'Merkava Mk.3', 
          cost: 4500000, 
          quantity: 780, 
          speed: 60, 
          range: 500, 
          description: 'Main battle tank',
          imageUrl: ''
        },
        { 
          name: 'Namer APC', 
          cost: 3000000, 
          quantity: 200, 
          speed: 60, 
          range: 500, 
          description: 'Heavy armored personnel carrier',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Namer-APC-01.jpg'
        }
      ],
      ships: [
        { 
          name: 'Sa\'ar 6 Corvette', 
          cost: 480000000, 
          quantity: 4, 
          speed: 57, 
          range: 4630, 
          description: 'Naval corvette',
          imageUrl: ''
        },
        { 
          name: 'Dolphin Submarine', 
          cost: 500000000, 
          quantity: 6, 
          speed: 46, 
          range: 8000, 
          description: 'Attack submarine',
          imageUrl: ''
        },
        { 
          name: 'Sa\'ar 4.5 Missile Boat', 
          cost: 50000000, 
          quantity: 8, 
          speed: 58, 
          range: 4000, 
          description: 'Fast attack craft',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'palestine',
    name: 'Palestine',
    flag: '🇵🇸',
    casualties: 11206,
    economicImpact: 15.2,
    forces: {
      air: 0,
      naval: 0,
      ground: 25000,
      specialOps: 1200
    },
    weapons: {
      missiles: [
        { 
          name: 'Qassam Rocket', 
          cost: 800, 
          quantity: 15000, 
          speed: 300, 
          range: 40, 
          description: 'Short-range rocket',
          imageUrl: ''
        },
        { 
          name: 'Grad Rocket', 
          cost: 15000, 
          quantity: 3000, 
          speed: 700, 
          range: 40, 
          description: 'Artillery rocket',
          imageUrl: ''
        },
        { 
          name: 'M-75 Rocket', 
          cost: 25000, 
          quantity: 500, 
          speed: 800, 
          range: 75, 
          description: 'Medium-range rocket',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'Improvised Vehicle', 
          cost: 50000, 
          quantity: 200, 
          speed: 40, 
          range: 300, 
          description: 'Modified civilian vehicle',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'lebanon',
    name: 'Lebanon',
    flag: '🇱🇧',
    casualties: 542,
    economicImpact: 8.9,
    forces: {
      air: 12,
      naval: 15,
      ground: 72000,
      specialOps: 800
    },
    weapons: {
      aircraft: [
        { 
          name: 'Hawker Hunter', 
          cost: 5000000, 
          quantity: 8, 
          speed: 1150, 
          range: 2965, 
          description: 'Fighter-bomber aircraft',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'AT-3 Sagger', 
          cost: 25000, 
          quantity: 300, 
          speed: 120, 
          range: 3, 
          description: 'Anti-tank missile',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'iran',
    name: 'Iran',
    flag: '🇮🇷',
    casualties: 89,
    economicImpact: 45.7,
    forces: {
      air: 550,
      naval: 398,
      ground: 350000,
      specialOps: 15000
    },
    weapons: {
      aircraft: [
        { 
          name: 'F-14 Tomcat', 
          cost: 38000000, 
          quantity: 40, 
          speed: 2485, 
          range: 3200, 
          description: 'Interceptor fighter',
          imageUrl: ''
        },
        { 
          name: 'F-4 Phantom II', 
          cost: 18500000, 
          quantity: 60, 
          speed: 2370, 
          range: 2600, 
          description: 'Multirole fighter',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'Shahab-3', 
          cost: 5000000, 
          quantity: 50, 
          speed: 2100, 
          range: 1300, 
          description: 'Medium-range ballistic missile',
          imageUrl: ''
        },
        { 
          name: 'Fateh-110', 
          cost: 500000, 
          quantity: 500, 
          speed: 1020, 
          range: 300, 
          description: 'Short-range ballistic missile',
          imageUrl: ''
        }
      ],
      ships: [
        { 
          name: 'Jamaran Frigate', 
          cost: 300000000, 
          quantity: 3, 
          speed: 55, 
          range: 5000, 
          description: 'Guided missile frigate',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'usa',
    name: 'United States',
    flag: '🇺🇸',
    casualties: 12,
    economicImpact: 150.2,
    forces: {
      air: 13400,
      naval: 490,
      ground: 485000,
      specialOps: 70000
    },
    weapons: {
      aircraft: [
        { 
          name: 'F-22 Raptor', 
          cost: 150000000, 
          quantity: 195, 
          speed: 2410, 
          range: 2960, 
          description: 'Air superiority stealth fighter',
          imageUrl: ''
        },
        { 
          name: 'F-35A Lightning II', 
          cost: 89000000, 
          quantity: 450, 
          speed: 1930, 
          range: 2220, 
          description: 'Multirole stealth fighter',
          imageUrl: ''
        },
        { 
          name: 'B-2 Spirit', 
          cost: 2100000000, 
          quantity: 20, 
          speed: 1010, 
          range: 11100, 
          description: 'Stealth strategic bomber',
          imageUrl: ''
        },
        { 
          name: 'AH-64 Apache', 
          cost: 52000000, 
          quantity: 800, 
          speed: 365, 
          range: 476, 
          description: 'Attack helicopter',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'Patriot PAC-3', 
          cost: 3000000, 
          quantity: 1500, 
          speed: 1700, 
          range: 160, 
          description: 'Air defense interceptor',
          imageUrl: ''
        },
        { 
          name: 'Tomahawk Block V', 
          cost: 2000000, 
          quantity: 4000, 
          speed: 880, 
          range: 1600, 
          description: 'Land attack cruise missile',
          imageUrl: ''
        },
        { 
          name: 'Minuteman III', 
          cost: 7000000, 
          quantity: 400, 
          speed: 23000, 
          range: 13000, 
          description: 'Intercontinental ballistic missile',
          imageUrl: ''
        },
        { 
          name: 'Javelin', 
          cost: 175000, 
          quantity: 45000, 
          speed: 300, 
          range: 5, 
          description: 'Anti-tank missile',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'M1A2 Abrams', 
          cost: 9000000, 
          quantity: 2500, 
          speed: 72, 
          range: 426, 
          description: 'Main battle tank',
          imageUrl: ''
        },
        { 
          name: 'M2 Bradley', 
          cost: 3200000, 
          quantity: 6000, 
          speed: 66, 
          range: 483, 
          description: 'Infantry fighting vehicle',
          imageUrl: ''
        }
      ],
      ships: [
        { 
          name: 'Gerald R. Ford-class', 
          cost: 13300000000, 
          quantity: 2, 
          speed: 56, 
          range: 18520, 
          description: 'Aircraft carrier',
          imageUrl: ''
        },
        { 
          name: 'Arleigh Burke-class', 
          cost: 1840000000, 
          quantity: 73, 
          speed: 56, 
          range: 8050, 
          description: 'Guided missile destroyer',
          imageUrl: ''
        },
        { 
          name: 'Virginia-class', 
          cost: 3400000000, 
          quantity: 22, 
          speed: 46, 
          range: 18520, 
          description: 'Attack submarine',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'yemen',
    name: 'Yemen',
    flag: '🇾🇪',
    casualties: 377000,
    economicImpact: 2.1,
    forces: {
      air: 18,
      naval: 25,
      ground: 66700,
      specialOps: 500
    },
    weapons: {
      aircraft: [
        { 
          name: 'MiG-21', 
          cost: 3000000, 
          quantity: 12, 
          speed: 2175, 
          range: 1210, 
          description: 'Supersonic fighter',
          imageUrl: ''
        },
        { 
          name: 'Su-22', 
          cost: 8000000, 
          quantity: 6, 
          speed: 2230, 
          range: 1400, 
          description: 'Fighter-bomber',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'Scud-B', 
          cost: 1000000, 
          quantity: 30, 
          speed: 1500, 
          range: 300, 
          description: 'Short-range ballistic missile',
          imageUrl: ''
        },
        { 
          name: 'Katyusha', 
          cost: 5000, 
          quantity: 500, 
          speed: 350, 
          range: 20, 
          description: 'Rocket artillery',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'T-55', 
          cost: 500000, 
          quantity: 150, 
          speed: 50, 
          range: 500, 
          description: 'Soviet main battle tank',
          imageUrl: ''
        },
        { 
          name: 'T-62', 
          cost: 800000, 
          quantity: 100, 
          speed: 50, 
          range: 450, 
          description: 'Soviet main battle tank',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'saudi',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    casualties: 234,
    economicImpact: 67.6,
    forces: {
      air: 848,
      naval: 158,
      ground: 75000,
      specialOps: 3000
    },
    weapons: {
      aircraft: [
        { 
          name: 'F-15SA Eagle', 
          cost: 87000000, 
          quantity: 84, 
          speed: 2650, 
          range: 4815, 
          description: 'Advanced multirole fighter',
          imageUrl: ''
        },
        { 
          name: 'Eurofighter Typhoon', 
          cost: 124000000, 
          quantity: 72, 
          speed: 2495, 
          range: 2900, 
          description: 'Multirole fighter',
          imageUrl: ''
        },
        { 
          name: 'AH-64 Apache', 
          cost: 52000000, 
          quantity: 36, 
          speed: 365, 
          range: 476, 
          description: 'Attack helicopter',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'Patriot PAC-3', 
          cost: 3000000, 
          quantity: 400, 
          speed: 1700, 
          range: 160, 
          description: 'Air defense system',
          imageUrl: ''
        },
        { 
          name: 'THAAD', 
          cost: 12900000, 
          quantity: 44, 
          speed: 2800, 
          range: 200, 
          description: 'Terminal High Altitude Area Defense',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'M1A2S Abrams', 
          cost: 9500000, 
          quantity: 373, 
          speed: 72, 
          range: 426, 
          description: 'Main battle tank',
          imageUrl: ''
        },
        { 
          name: 'AMX-30', 
          cost: 1500000, 
          quantity: 290, 
          speed: 65, 
          range: 600, 
          description: 'Main battle tank',
          imageUrl: ''
        }
      ],
      ships: [
        { 
          name: 'Al Riyadh-class', 
          cost: 1200000000, 
          quantity: 3, 
          speed: 52, 
          range: 7400, 
          description: 'Frigate',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'jordan',
    name: 'Jordan',
    flag: '🇯🇴',
    casualties: 28,
    economicImpact: 1.9,
    forces: {
      air: 132,
      naval: 0,
      ground: 88000,
      specialOps: 14000
    },
    weapons: {
      aircraft: [
        { 
          name: 'F-16 Fighting Falcon', 
          cost: 29000000, 
          quantity: 57, 
          speed: 2120, 
          range: 4220, 
          description: 'Multirole fighter',
          imageUrl: ''
        },
        { 
          name: 'AH-1F Cobra', 
          cost: 10700000, 
          quantity: 25, 
          speed: 315, 
          range: 507, 
          description: 'Attack helicopter',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'Patriot PAC-2', 
          cost: 2000000, 
          quantity: 100, 
          speed: 1200, 
          range: 100, 
          description: 'Air defense missile',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'Challenger 1', 
          cost: 4200000, 
          quantity: 390, 
          speed: 56, 
          range: 450, 
          description: 'Main battle tank',
          imageUrl: ''
        },
        { 
          name: 'M60A3', 
          cost: 1500000, 
          quantity: 300, 
          speed: 48, 
          range: 500, 
          description: 'Main battle tank',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'syria',
    name: 'Syria',
    flag: '🇸🇾',
    casualties: 580000,
    economicImpact: 8.7,
    forces: {
      air: 452,
      naval: 75,
      ground: 154000,
      specialOps: 8000
    },
    weapons: {
      aircraft: [
        { 
          name: 'MiG-29', 
          cost: 11000000, 
          quantity: 40, 
          speed: 2400, 
          range: 1430, 
          description: 'Air superiority fighter',
          imageUrl: ''
        },
        { 
          name: 'Su-24', 
          cost: 15000000, 
          quantity: 20, 
          speed: 1700, 
          range: 2850, 
          description: 'Strike aircraft',
          imageUrl: ''
        },
        { 
          name: 'Mi-25 Hind', 
          cost: 18500000, 
          quantity: 30, 
          speed: 335, 
          range: 450, 
          description: 'Attack helicopter',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'S-300', 
          cost: 500000, 
          quantity: 200, 
          speed: 1800, 
          range: 150, 
          description: 'Surface-to-air missile',
          imageUrl: ''
        },
        { 
          name: 'Scud-C', 
          cost: 1200000, 
          quantity: 50, 
          speed: 1600, 
          range: 500, 
          description: 'Ballistic missile',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'T-72', 
          cost: 1200000, 
          quantity: 1600, 
          speed: 60, 
          range: 460, 
          description: 'Main battle tank',
          imageUrl: ''
        },
        { 
          name: 'T-90', 
          cost: 2500000, 
          quantity: 30, 
          speed: 65, 
          range: 550, 
          description: 'Main battle tank',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'egypt',
    name: 'Egypt',
    flag: '🇪🇬',
    casualties: 45,
    economicImpact: 12.4,
    forces: {
      air: 1132,
      naval: 319,
      ground: 310000,
      specialOps: 1000
    },
    weapons: {
      aircraft: [
        { 
          name: 'F-16C/D Fighting Falcon', 
          cost: 34000000, 
          quantity: 220, 
          speed: 2120, 
          range: 4220, 
          description: 'Multirole fighter',
          imageUrl: ''
        },
        { 
          name: 'Rafale', 
          cost: 85000000, 
          quantity: 24, 
          speed: 1912, 
          range: 3700, 
          description: 'Multirole fighter',
          imageUrl: ''
        },
        { 
          name: 'AH-64 Apache', 
          cost: 52000000, 
          quantity: 46, 
          speed: 365, 
          range: 476, 
          description: 'Attack helicopter',
          imageUrl: ''
        }
      ],
      missiles: [
        { 
          name: 'MICA', 
          cost: 1200000, 
          quantity: 200, 
          speed: 1200, 
          range: 80, 
          description: 'Air-to-air missile',
          imageUrl: ''
        }
      ],
      tanks: [
        { 
          name: 'M1A1 Abrams', 
          cost: 6200000, 
          quantity: 1130, 
          speed: 67, 
          range: 426, 
          description: 'Main battle tank',
          imageUrl: ''
        },
        { 
          name: 'T-80', 
          cost: 3000000, 
          quantity: 260, 
          speed: 70, 
          range: 335, 
          description: 'Main battle tank',
          imageUrl: ''
        }
      ],
      ships: [
        { 
          name: 'FREMM Frigate', 
          cost: 670000000, 
          quantity: 2, 
          speed: 52, 
          range: 11110, 
          description: 'Multipurpose frigate',
          imageUrl: ''
        }
      ]
    }
  },
  {
    id: 'china',
    name: 'China',
    flag: '🇨🇳',
    casualties: 5000,
    economicImpact: 100,
    forces: {
      air: 3000,
      naval: 500,
      ground: 200000,
      specialOps: 30000
    },
    weapons: {
      tanks: [
        { name: 'Type 99A', cost: 2500000, quantity: 600, speed: 80, range: 600, description: 'Main battle tank', imageUrl: '' },
        { name: 'Type 96B', cost: 2000000, quantity: 2500, speed: 65, range: 500, description: 'Main battle tank', imageUrl: '' }
      ],
      aircraft: [
        { name: 'J-20', cost: 120000000, quantity: 200, speed: 2100, range: 2000, description: 'Stealth fighter', imageUrl: '' },
        { name: 'J-16', cost: 70000000, quantity: 300, speed: 2200, range: 3900, description: 'Multirole fighter', imageUrl: '' }
      ],
      ships: [
        { name: 'Type 055', cost: 900000000, quantity: 8, speed: 55, range: 7000, description: 'Guided missile destroyer', imageUrl: '' },
        { name: 'Type 052D', cost: 500000000, quantity: 25, speed: 52, range: 4500, description: 'Guided missile destroyer', imageUrl: '' }
      ],
      missiles: [
        { name: 'DF-41', cost: 80000000, quantity: 100, speed: 25000, range: 15000, description: 'Intercontinental ballistic missile', imageUrl: '' },
        { name: 'DF-21D', cost: 15000000, quantity: 200, speed: 10000, range: 1500, description: 'Anti-ship ballistic missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'Type 08', cost: 800000, quantity: 1200, speed: 100, range: 800, description: 'Infantry fighting vehicle', imageUrl: '' },
        { name: 'ZBD-04A', cost: 1200000, quantity: 800, speed: 65, range: 500, description: 'Infantry fighting vehicle', imageUrl: '' }
      ]
    }
  },
  {
    id: 'russia',
    name: 'Russia',
    flag: '🇷🇺',
    casualties: 15000,
    economicImpact: 80,
    forces: {
      air: 4000,
      naval: 600,
      ground: 250000,
      specialOps: 35000
    },
    weapons: {
      tanks: [
        { name: 'T-14 Armata', cost: 8000000, quantity: 100, speed: 80, range: 500, description: 'Next-generation main battle tank', imageUrl: '' },
        { name: 'T-90M', cost: 4500000, quantity: 400, speed: 60, range: 550, description: 'Main battle tank', imageUrl: '' }
      ],
      aircraft: [
        { name: 'Su-57', cost: 100000000, quantity: 76, speed: 2100, range: 3500, description: 'Stealth fighter', imageUrl: '' },
        { name: 'Su-35', cost: 85000000, quantity: 120, speed: 2500, range: 3600, description: 'Air superiority fighter', imageUrl: '' }
      ],
      ships: [
        { name: 'Admiral Gorshkov', cost: 500000000, quantity: 3, speed: 56, range: 4500, description: 'Guided missile frigate', imageUrl: '' },
        { name: 'Slava-class', cost: 750000000, quantity: 3, speed: 59, range: 9000, description: 'Guided missile cruiser', imageUrl: '' }
      ],
      missiles: [
        { name: 'RS-28 Sarmat', cost: 100000000, quantity: 50, speed: 20000, range: 18000, description: 'Heavy intercontinental ballistic missile', imageUrl: '' },
        { name: 'Kinzhal', cost: 10000000, quantity: 100, speed: 12000, range: 2000, description: 'Hypersonic missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'BMP-3', cost: 1500000, quantity: 600, speed: 70, range: 600, description: 'Infantry fighting vehicle', imageUrl: '' },
        { name: 'BTR-82A', cost: 700000, quantity: 1000, speed: 80, range: 600, description: 'Armored personnel carrier', imageUrl: '' }
      ]
    }
  },
  {
    id: 'india',
    name: 'India',
    flag: '🇮🇳',
    casualties: 500,
    economicImpact: 50,
    forces: {
      air: 2000,
      naval: 300,
      ground: 150000,
      specialOps: 20000
    },
    weapons: {
      tanks: [
        { name: 'Arjun Mk 1A', cost: 8400000, quantity: 124, speed: 60, range: 450, description: 'Main battle tank', imageUrl: '' },
        { name: 'T-90S Bhishma', cost: 4200000, quantity: 1000, speed: 60, range: 550, description: 'Main battle tank', imageUrl: '' }
      ],
      aircraft: [
        { name: 'Rafale', cost: 240000000, quantity: 36, speed: 1900, range: 3700, description: 'Multirole fighter', imageUrl: '' },
        { name: 'Su-30MKI', cost: 73000000, quantity: 272, speed: 2100, range: 3000, description: 'Air superiority fighter', imageUrl: '' }
      ],
      ships: [
        { name: 'INS Vikrant', cost: 3100000000, quantity: 1, speed: 52, range: 7500, description: 'Aircraft carrier', imageUrl: '' },
        { name: 'Kolkata-class', cost: 1000000000, quantity: 3, speed: 56, range: 8000, description: 'Guided missile destroyer', imageUrl: '' }
      ],
      missiles: [
        { name: 'Agni-V', cost: 15000000, quantity: 50, speed: 24000, range: 5500, description: 'Intercontinental ballistic missile', imageUrl: '' },
        { name: 'BrahMos', cost: 3000000, quantity: 300, speed: 3000, range: 400, description: 'Supersonic cruise missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'BMP-2 Sarath', cost: 800000, quantity: 1200, speed: 65, range: 500, description: 'Infantry fighting vehicle', imageUrl: '' },
        { name: 'Abhay IFV', cost: 1200000, quantity: 200, speed: 70, range: 600, description: 'Infantry fighting vehicle', imageUrl: '' }
      ]
    }
  },
  {
    id: 'pakistan',
    name: 'Pakistan',
    flag: '🇵🇰',
    casualties: 300,
    economicImpact: 30,
    forces: {
      air: 1500,
      naval: 250,
      ground: 100000,
      specialOps: 15000
    },
    weapons: {
      tanks: [
        { name: 'Al-Khalid', cost: 4500000, quantity: 320, speed: 70, range: 450, description: 'Main battle tank', imageUrl: '' },
        { name: 'T-80UD', cost: 3000000, quantity: 320, speed: 70, range: 500, description: 'Main battle tank', imageUrl: '' }
      ],
      aircraft: [
        { name: 'JF-17 Thunder', cost: 25000000, quantity: 138, speed: 1800, range: 1352, description: 'Multirole fighter', imageUrl: '' },
        { name: 'F-16 Fighting Falcon', cost: 30000000, quantity: 75, speed: 2100, range: 4220, description: 'Multirole fighter', imageUrl: '' }
      ],
      ships: [
        { name: 'Zulfiquar-class', cost: 350000000, quantity: 4, speed: 55, range: 4500, description: 'Guided missile frigate', imageUrl: '' },
        { name: 'Agosta 90B', cost: 500000000, quantity: 3, speed: 37, range: 8500, description: 'Attack submarine', imageUrl: '' }
      ],
      missiles: [
        { name: 'Shaheen-III', cost: 10000000, quantity: 50, speed: 18000, range: 2750, description: 'Medium-range ballistic missile', imageUrl: '' },
        { name: 'Babur', cost: 1000000, quantity: 100, speed: 880, range: 700, description: 'Cruise missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'Saad APC', cost: 400000, quantity: 300, speed: 80, range: 500, description: 'Armored personnel carrier', imageUrl: '' },
        { name: 'M113A2', cost: 300000, quantity: 600, speed: 67, range: 480, description: 'Armored personnel carrier', imageUrl: '' }
      ]
    }
  },
  {
    id: 'north-korea',
    name: 'North Korea',
    flag: '🇰🇵',
    casualties: 10000,
    economicImpact: 10,
    forces: {
      air: 500,
      naval: 100,
      ground: 120000,
      specialOps: 10000
    },
    weapons: {
      tanks: [
        { name: 'Pokpung-ho', cost: 3000000, quantity: 200, speed: 60, range: 500, description: 'Main battle tank', imageUrl: '' },
        { name: 'T-62', cost: 1000000, quantity: 800, speed: 50, range: 450, description: 'Main battle tank', imageUrl: '' }
      ],
      aircraft: [
        { name: 'MiG-29', cost: 25000000, quantity: 40, speed: 2400, range: 1430, description: 'Air superiority fighter', imageUrl: '' },
        { name: 'MiG-21', cost: 8000000, quantity: 120, speed: 2175, range: 1210, description: 'Fighter aircraft', imageUrl: '' }
      ],
      ships: [
        { name: 'Sinpo-class', cost: 200000000, quantity: 1, speed: 37, range: 9000, description: 'Ballistic missile submarine', imageUrl: '' },
        { name: 'Najin-class', cost: 50000000, quantity: 2, speed: 55, range: 4000, description: 'Frigate', imageUrl: '' }
      ],
      missiles: [
        { name: 'Hwasong-17', cost: 50000000, quantity: 20, speed: 24000, range: 15000, description: 'Intercontinental ballistic missile', imageUrl: '' },
        { name: 'KN-23', cost: 3000000, quantity: 100, speed: 6000, range: 690, description: 'Short-range ballistic missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'M-2010', cost: 500000, quantity: 200, speed: 60, range: 400, description: 'Infantry fighting vehicle', imageUrl: '' },
        { name: 'BTR-80', cost: 400000, quantity: 300, speed: 80, range: 600, description: 'Armored personnel carrier', imageUrl: '' }
      ]
    }
  },
  {
    id: 'south-korea',
    name: 'South Korea',
    flag: '🇰🇷',
    casualties: 500,
    economicImpact: 40,
    forces: {
      air: 1500,
      naval: 200,
      ground: 120000,
      specialOps: 15000
    },
    weapons: {
      tanks: [
        { name: 'K2 Black Panther', cost: 8500000, quantity: 260, speed: 70, range: 450, description: 'Main battle tank', imageUrl: '' },
        { name: 'K1A1', cost: 4000000, quantity: 484, speed: 65, range: 500, description: 'Main battle tank', imageUrl: '' }
      ],
      aircraft: [
        { name: 'KF-21 Boramae', cost: 65000000, quantity: 40, speed: 1800, range: 2900, description: 'Multirole fighter', imageUrl: '' },
        { name: 'F-35A Lightning II', cost: 80000000, quantity: 40, speed: 1900, range: 2220, description: 'Stealth fighter', imageUrl: '' }
      ],
      ships: [
        { name: 'Sejong the Great-class', cost: 1200000000, quantity: 3, speed: 56, range: 5500, description: 'Guided missile destroyer', imageUrl: '' },
        { name: 'Incheon-class', cost: 230000000, quantity: 6, speed: 56, range: 4500, description: 'Guided missile frigate', imageUrl: '' }
      ],
      missiles: [
        { name: 'Hyunmoo-3', cost: 1500000, quantity: 200, speed: 900, range: 1500, description: 'Cruise missile', imageUrl: '' },
        { name: 'Hyunmoo-2C', cost: 800000, quantity: 300, speed: 7000, range: 800, description: 'Ballistic missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'K21', cost: 2400000, quantity: 466, speed: 70, range: 500, description: 'Infantry fighting vehicle', imageUrl: '' },
        { name: 'K200A1', cost: 800000, quantity: 2000, speed: 75, range: 480, description: 'Armored personnel carrier', imageUrl: '' }
      ]
    }
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    casualties: 300,
    economicImpact: 35,
    forces: {
      air: 1500,
      naval: 200,
      ground: 100000,
      specialOps: 15000
    },
    weapons: {
      tanks: [
        { name: 'Leclerc', cost: 9300000, quantity: 222, speed: 71, range: 550, description: 'Main battle tank', imageUrl: '' },
        { name: 'AMX-10 RC', cost: 2000000, quantity: 248, speed: 85, range: 800, description: 'Armored reconnaissance vehicle', imageUrl: '' }
      ],
      aircraft: [
        { name: 'Rafale', cost: 240000000, quantity: 102, speed: 1900, range: 3700, description: 'Multirole fighter', imageUrl: '' },
        { name: 'Mirage 2000', cost: 30000000, quantity: 55, speed: 2200, range: 1500, description: 'Multirole fighter', imageUrl: '' }
      ],
      ships: [
        { name: 'Charles de Gaulle', cost: 3300000000, quantity: 1, speed: 50, range: 9600, description: 'Nuclear aircraft carrier', imageUrl: '' },
        { name: 'Horizon-class', cost: 1200000000, quantity: 2, speed: 52, range: 7000, description: 'Air defense destroyer', imageUrl: '' }
      ],
      missiles: [
        { name: 'M51 SLBM', cost: 60000000, quantity: 48, speed: 25000, range: 9000, description: 'Submarine-launched ballistic missile', imageUrl: '' },
        { name: 'SCALP', cost: 1000000, quantity: 200, range: 560, speed: 1000, description: 'Cruise missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'VBCI', cost: 3500000, quantity: 630, speed: 100, range: 750, description: 'Infantry fighting vehicle', imageUrl: '' },
        { name: 'VAB', cost: 800000, quantity: 4000, speed: 92, range: 1000, description: 'Armored personnel carrier', imageUrl: '' }
      ]
    }
  },
  {
    id: 'united-kingdom',
    name: 'United Kingdom',
    flag: '🇬🇧',
    casualties: 200,
    economicImpact: 30,
    forces: {
      air: 1500,
      naval: 200,
      ground: 100000,
      specialOps: 15000
    },
    weapons: {
      tanks: [
        { name: 'Challenger 2', cost: 6000000, quantity: 227, speed: 59, range: 550, description: 'Main battle tank', imageUrl: '' },
        { name: 'Ajax', cost: 4200000, quantity: 589, speed: 70, range: 500, description: 'Armored reconnaissance vehicle', imageUrl: '' }
      ],
      aircraft: [
        { name: 'F-35B Lightning II', cost: 115000000, quantity: 48, speed: 1900, range: 1670, description: 'Stealth fighter', imageUrl: '' },
        { name: 'Eurofighter Typhoon', cost: 124000000, quantity: 107, speed: 2495, range: 2900, description: 'Multirole fighter', imageUrl: '' }
      ],
      ships: [
        { name: 'Queen Elizabeth-class', cost: 4200000000, quantity: 2, speed: 45, range: 10000, description: 'Aircraft carrier', imageUrl: '' },
        { name: 'Type 45', cost: 1050000000, quantity: 6, speed: 52, range: 7000, description: 'Air defense destroyer', imageUrl: '' }
      ],
      missiles: [
        { name: 'Trident II D5', cost: 37000000, quantity: 58, speed: 28000, range: 12000, description: 'Submarine-launched ballistic missile', imageUrl: '' },
        { name: 'Storm Shadow', cost: 1000000, quantity: 1000, speed: 1000, range: 560, description: 'Cruise missile', imageUrl: '' }
      ],
      vehicles: [
        { name: 'Warrior', cost: 2000000, quantity: 789, speed: 75, range: 660, description: 'Infantry fighting vehicle', imageUrl: '' },
        { name: 'Foxhound', cost: 1500000, quantity: 400, speed: 110, range: 700, description: 'Protected patrol vehicle', imageUrl: '' }
      ]
    }
  }
];

export function CountriesAndForces() {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [selectedWeaponType, setSelectedWeaponType] = useState<string>('all');
  const [weaponImages, setWeaponImages] = useState<Map<string, string>>(new Map());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  // Load weapon images when component mounts or country expands
  useEffect(() => {
    if (expandedCountry) {
      loadWeaponImages(expandedCountry);
    }
  }, [expandedCountry]);

  const loadWeaponImages = async (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    if (!country) return;

    const allWeapons: Array<{ name: string; category: string }> = [];
    Object.entries(country.weapons).forEach(([category, weapons]) => {
      weapons.forEach((weapon: any) => {
        allWeapons.push({ name: weapon.name, category });
      });
    });

    // Set loading state for all weapons
    setLoadingImages(new Set(allWeapons.map(w => w.name)));

    try {
      const imageResults = await WikipediaImageService.getMultipleWeaponImages(allWeapons);
      
      const newImageMap = new Map(weaponImages);
      imageResults.forEach(result => {
        newImageMap.set(result.name, result.imageUrl);
      });
      
      setWeaponImages(newImageMap);
      setLoadingImages(new Set()); // Clear loading state
    } catch (error) {
      console.error('Failed to load weapon images:', error);
      setLoadingImages(new Set());
    }
  };

  const toggleCountryExpansion = (countryId: string) => {
    setExpandedCountry(expandedCountry === countryId ? null : countryId);
  };

  const expandAllCountries = () => {
    setAllExpanded(true);
    // Load images for all countries
    countries.forEach(country => {
      const firstAircraftName = country.weapons.aircraft?.[0]?.name;
      if (firstAircraftName && !weaponImages.has(firstAircraftName)) {
        loadWeaponImages(country.id);
      }
    });
  };

  const collapseAllCountries = () => {
    setAllExpanded(false);
    setExpandedCountry(null);
  };

  const formatCost = (cost: number) => {
    if (cost >= 1000000000) return `$${(cost / 1000000000).toFixed(1)}B`;
    if (cost >= 1000000) return `$${(cost / 1000000).toFixed(1)}M`;
    if (cost >= 1000) return `$${(cost / 1000).toFixed(0)}K`;
    return `$${cost}`;
  };

  const getWeaponsByType = (country: any, weaponType: string): Array<Weapon & { category: string }> => {
    if (weaponType === 'all') {
      const allWeapons: Array<Weapon & { category: string }> = [];
      Object.entries(country.weapons).forEach(([category, weapons]) => {
        (weapons as Weapon[]).forEach(weapon => {
          allWeapons.push({ ...weapon, category });
        });
      });
      return allWeapons;
    }
    return (country.weapons[weaponType] || []).map((weapon: Weapon) => ({ ...weapon, category: weaponType }));
  };

  const getAllWeaponTypes = (country: any) => {
    return ['all', ...Object.keys(country.weapons)];
  };

  const getTotalArsenalValue = (country: any, weaponType: string) => {
    if (weaponType === 'all') {
      return Object.values(country.weapons).reduce((total: number, weapons: any) => {
        return total + weapons.reduce((subTotal: number, weapon: any) => subTotal + (weapon.cost * weapon.quantity), 0);
      }, 0);
    }
    return getWeaponsByType(country, weaponType).reduce(
      (total, weapon) => total + (weapon.cost * weapon.quantity), 0
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-tactical font-bold text-neon-400">
          Countries & Forces
        </h2>
        
        {/* Expand/Collapse All Controls */}
        <div className="flex space-x-2">
          <button
            onClick={expandAllCountries}
            className="px-4 py-2 bg-neon-400/20 text-neon-400 border border-neon-400/50 rounded font-mono text-sm hover:bg-neon-400/30 transition-all"
          >
            EXPAND ALL
          </button>
          <button
            onClick={collapseAllCountries}
            className="px-4 py-2 bg-tactical-panel text-tactical-muted border border-tactical-border rounded font-mono text-sm hover:text-neon-400 hover:border-neon-400/50 transition-all"
          >
            COLLAPSE ALL
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {countries.map((country, index) => (
          <motion.div
            key={country.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full"
          >
            <Card className="neon-border">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleCountryExpansion(country.id)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{country.flag}</span>
                    <div>
                      <div className="text-neon-400">{country.name}</div>
                      <div className="text-sm text-tactical-muted font-mono">
                        COMBAT STATUS: ACTIVE
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-tactical-muted text-xs font-mono">CASUALTIES</div>
                      <div className="text-red-400 font-tactical">
                        {country.casualties.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-tactical-muted text-xs font-mono">ECONOMIC HIT</div>
                      <div className="text-orange-400 font-tactical">
                        ${country.economicImpact}B
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-tactical-muted text-xs font-mono">GROUND FORCES</div>
                      <div className="text-neon-400 font-tactical">
                        {country.forces.ground.toLocaleString()}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedCountry === country.id ? 180 : 0 }}
                      className="text-neon-400"
                    >
                      ▼
                    </motion.div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              {(expandedCountry === country.id || allExpanded) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="space-y-6">
                    {/* Weapon Type Selector */}
                    <div className="flex space-x-2 border-b border-tactical-border pb-4">
                      {getAllWeaponTypes(country).map((weaponType) => (
                        <button
                          key={weaponType}
                          onClick={() => setSelectedWeaponType(weaponType)}
                          className={`px-4 py-2 rounded font-mono text-sm transition-all ${
                            selectedWeaponType === weaponType
                              ? 'bg-neon-400/20 text-neon-400 border border-neon-400/50'
                              : 'bg-tactical-panel text-tactical-muted hover:text-neon-400'
                          }`}
                        >
                          {weaponType === 'all' ? 'ALL WEAPONS' : weaponType.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {/* Weapon Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {getWeaponsByType(country, selectedWeaponType).map((weapon, idx) => (
                        <motion.div
                          key={`${weapon.category}-${idx}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="tactical-panel p-4 rounded neon-border"
                        >
                          <div className="space-y-3">
                            {/* Weapon Image */}
                            <div className="w-full h-64 rounded overflow-hidden bg-tactical-bg/50 flex items-center justify-center border border-tactical-border/30">
                              {loadingImages.has(weapon.name) ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-tactical-muted bg-tactical-panel/80 rounded">
                                  <div className="animate-spin text-2xl mb-2">⚙️</div>
                                  <div className="text-xs text-center font-mono px-2 text-neon-400">LOADING IMAGE...</div>
                                </div>
                              ) : (
                                <img 
                                  src={weaponImages.get(weapon.name) || `https://via.placeholder.com/800x600/1a1a1a/00ff88?text=${encodeURIComponent(weapon.name)}`}
                                  alt={weapon.name}
                                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const container = target.parentElement;
                                    if (container) {
                                      const emoji = weapon.category === 'aircraft' ? '✈️' : 
                                                   weapon.category === 'missiles' ? '🚀' : 
                                                   weapon.category === 'tanks' ? '🚗' : 
                                                   weapon.category === 'ships' ? '🚢' : '⚔️';
                                      container.innerHTML = `
                                        <div class="w-full h-full flex flex-col items-center justify-center text-tactical-muted bg-tactical-panel/80 rounded">
                                          <div class="text-4xl mb-2">${emoji}</div>
                                          <div class="text-xs text-center font-mono px-2 text-neon-400">${weapon.name}</div>
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              )}
                            </div>

                            <div className="text-center">
                              <div className="text-neon-400 font-tactical text-lg mb-1">
                                {weapon.name}
                              </div>
                              <div className="text-xs text-tactical-muted mb-1">
                                {weapon.description}
                              </div>
                              {selectedWeaponType === 'all' && (
                                <div className="inline-block px-2 py-1 bg-neon-400/20 text-neon-400 text-xs rounded font-mono">
                                  {weapon.category.toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-tactical-muted text-xs">COST:</span>
                                <span className="text-orange-400 font-mono text-xs">
                                  {formatCost(weapon.cost)}
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-tactical-muted text-xs">QUANTITY:</span>
                                <span className="text-neon-400 font-mono text-xs">
                                  {weapon.quantity.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-tactical-muted text-xs">
                                  {selectedWeaponType === 'ships' ? 'SPEED (knots):' : 'SPEED (km/h):'}
                                </span>
                                <span className="text-blue-400 font-mono text-xs">
                                  {weapon.speed.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-tactical-muted text-xs">RANGE (km):</span>
                                <span className="text-green-400 font-mono text-xs">
                                  {weapon.range.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-tactical-muted text-xs">TOTAL VALUE:</span>
                                <span className="text-yellow-400 font-mono text-xs">
                                  {formatCost(weapon.cost * weapon.quantity)}
                                </span>
                              </div>
                            </div>

                            {/* Status Indicator */}
                            <div className="pt-2 border-t border-tactical-border/50">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-xs font-mono">OPERATIONAL</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Total Arsenal Value */}
                    <div className="tactical-panel p-4 rounded bg-tactical-bg/50">
                      <div className="text-center">
                        <div className="text-tactical-muted text-xs font-mono mb-2">
                          TOTAL {selectedWeaponType === 'all' ? 'ARSENAL' : selectedWeaponType.toUpperCase()} VALUE
                        </div>
                        <div className="text-2xl font-tactical text-neon-400">
                          {formatCost(Number(getTotalArsenalValue(country, selectedWeaponType)))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}