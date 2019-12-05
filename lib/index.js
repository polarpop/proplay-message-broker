"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("redis"));
class Broker {
    constructor(options) {
        this.options = options;
        this.client = redis_1.default.createClient(this.options);
    }
    scan(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = [];
            let cursor = '0';
            do {
                try {
                    const res = yield this.scanAsync(cursor, 'MATCH', pattern);
                    cursor = res[0];
                    found.push(...res[1]);
                }
                catch (e) {
                    cursor = '0';
                    return Promise.reject(e);
                }
            } while (cursor !== '0');
            return found;
        });
    }
    set(instance, options = { keyId: 'id' }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                // @ts-ignore
                let id = instance[`${options.keyId}`];
                let serialized = this.serialize(instance);
                this.client.set(`${id}`, serialized, (err) => {
                    if (err)
                        reject(err);
                    resolve();
                });
            });
        });
    }
    retrieve(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                this.client.get(`${key}`, (err, res) => {
                    if (err)
                        reject(err);
                    let instance = this.deserialize(res);
                    resolve(instance);
                });
            });
        });
    }
    destroy(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                this.client.del(`${key}`, (err, res) => {
                    if (err)
                        reject(err);
                    if (res === 1)
                        resolve();
                    reject(res);
                });
            });
        });
    }
    scanAsync(cursor, type, pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                this.client.scan(cursor, type, pattern, (err, res) => {
                    if (err)
                        reject(err);
                    resolve(res);
                });
            });
        });
    }
    serialize(model) {
        return JSON.stringify(model);
    }
    deserialize(serialized) {
        return JSON.parse(serialized);
    }
}
exports.Broker = Broker;
