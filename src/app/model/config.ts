import { ISeed } from "./seed";

export interface IConfig {
    seeds: ISeed[];
    publicKey?: JsonWebKey;
}