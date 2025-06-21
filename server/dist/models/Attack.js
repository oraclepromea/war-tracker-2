"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attack = void 0;
const typeorm_1 = require("typeorm");
const Weapon_1 = require("./Weapon");
let Attack = class Attack {
};
exports.Attack = Attack;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Attack.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Attack.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Attack.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Attack.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Attack.prototype, "attackerCountry", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Attack.prototype, "defenderCountry", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Attack.prototype, "locationName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Attack.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Attack.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Weapon_1.Weapon),
    (0, typeorm_1.JoinTable)({
        name: 'attack_weapons',
        joinColumn: { name: 'attackId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'weaponId', referencedColumnName: 'id' }
    }),
    __metadata("design:type", Array)
], Attack.prototype, "weaponsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Attack.prototype, "fatalities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Attack.prototype, "injuries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], Attack.prototype, "costOfDamageUsd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], Attack.prototype, "sourceUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'unknown' }),
    __metadata("design:type", String)
], Attack.prototype, "attackType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Attack.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'medium' }),
    __metadata("design:type", String)
], Attack.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Attack.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Attack.prototype, "updatedAt", void 0);
exports.Attack = Attack = __decorate([
    (0, typeorm_1.Entity)('attacks'),
    (0, typeorm_1.Index)(['date', 'attackerCountry', 'defenderCountry']),
    (0, typeorm_1.Index)(['source', 'sourceId'], { unique: true })
], Attack);
//# sourceMappingURL=Attack.js.map