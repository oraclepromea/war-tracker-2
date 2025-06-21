import { Weapon } from './Weapon';
export declare class Attack {
    id: string;
    source: string;
    sourceId: string;
    date: Date;
    attackerCountry: string;
    defenderCountry: string;
    locationName: string;
    latitude: number;
    longitude: number;
    weaponsUsed: Weapon[];
    fatalities: number;
    injuries: number;
    costOfDamageUsd: number;
    sourceUrls: string[];
    attackType: string;
    description: string;
    severity: string;
    createdAt: Date;
    updatedAt: Date;
}
