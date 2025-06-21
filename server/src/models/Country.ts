import mongoose, { Schema, Document } from 'mongoose';

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

const CountrySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  flag: { type: String, required: true },
  region: { type: String, required: true },
  population: { type: Number, required: true },
  militaryBudget: { type: Number, default: 0 },
  forces: {
    active: { type: Number, default: 0 },
    reserves: { type: Number, default: 0 },
    airForce: { type: Number, default: 0 },
    navy: { type: Number, default: 0 },
    groundForces: { type: Number, default: 0 }
  },
  coordinates: { type: [Number], required: true }
}, {
  timestamps: true
});

export const Country = mongoose.model<ICountry>('Country', CountrySchema);