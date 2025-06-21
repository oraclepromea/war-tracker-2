import mongoose, { Document } from 'mongoose';
export interface ICountry extends Document {
    name: string;
    code: string;
    flag: string;
    region: string;
    population: number;
    militaryBudget: number;
    forces: {
        active: number;
        reserves: number;
        airForce: number;
        navy: number;
        groundForces: number;
    };
    coordinates: [number, number];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Country: mongoose.Model<ICountry, {}, {}, {}, mongoose.Document<unknown, {}, ICountry, {}> & ICountry & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
