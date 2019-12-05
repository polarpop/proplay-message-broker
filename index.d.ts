import { ClientOpts } from 'redis';
export interface SetterOpts {
    keyId: string;
}
export declare class Broker<Model> {
    private client;
    private options?;
    constructor(options?: ClientOpts);
    scan(pattern: string): Promise<Model[]>;
    set(instance: Model, options?: SetterOpts): Promise<undefined>;
    retrieve(key: string): Promise<Model>;
    destroy(key: string): Promise<undefined>;
    private scanAsync;
    private serialize;
    private deserialize;
}
