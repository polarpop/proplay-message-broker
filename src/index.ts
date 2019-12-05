import redis, { RedisClient, ClientOpts } from 'redis';


export interface SetterOpts {
  keyId: string;
}

export class Broker<Model> {
  private client: RedisClient;

  private options?: ClientOpts;

  constructor(options?: ClientOpts) {
    this.options = options;

    this.client = redis.createClient(this.options);
  }

  async scan(pattern: string): Promise<Model[]> {
    const found: any[] = [];
    let cursor = '0';
    do {
      try {
        const res = await this.scanAsync(cursor, 'MATCH', pattern);
        cursor = res[0];
        found.push(...res[1]);
      } catch (e) {
        cursor = '0';
        return Promise.reject(e);
      }
    } while (cursor !== '0');
    return found.map(this.deserialize);
  }

  async set(instance: Model, options: SetterOpts = { keyId: 'id'}): Promise<undefined> {
    return await new Promise((resolve, reject) => {
      // @ts-ignore
      let id = instance[`${options.keyId}`];

      let serialized = this.serialize(instance);

      this.client.set(`${id}`, serialized, (err: Error|null) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async retrieve(key: string): Promise<Model> {
    return await new Promise((resolve, reject) => {
      this.client.get(`${key}`, (err: Error|null, res: string) => {
        if (err) reject(err);

        let instance = this.deserialize(res);

        resolve(instance);
      })
    });
  }

  async destroy(key: string): Promise<undefined> {
    return await new Promise((resolve, reject) => {
      this.client.del(`${key}`, (err: Error|null, res: number) => {
        if (err) reject(err);

        if (res === 1) resolve();
        reject(res);
      })
    })
  }

  private async scanAsync(cursor: string, type: string, pattern: string): Promise<any[]> {
    return await new Promise((resolve, reject) => {
      this.client.scan(cursor, type, pattern, (err: Error | null, res: any[]) => {
        if (err) reject(err);

        resolve(res);
      });
    })
  }

  private serialize(model: Model): string {
    return JSON.stringify(model);
  }

  private deserialize(serialized: string): Model {
    return JSON.parse(serialized);
  }
}