declare module "argon2-browser" {
  interface HashParams {
    pass: string | Uint8Array;
    salt: string | Uint8Array;
    type?: number;
    hashLen?: number;
    parallelism?: number;
    mem?: number;
    time?: number;
  }

  interface HashResult {
    hash: Uint8Array;
    encoded: string;
  }

  export function hash(params: HashParams): Promise<HashResult>;
  export function verify(params: { pass: string | Uint8Array; encoded: string }): Promise<boolean>;
  
  export enum ArgonType {
    Argon2d = 0,
    Argon2i = 1,
    Argon2id = 2
  }
}
