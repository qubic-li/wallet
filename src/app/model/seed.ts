export interface ISeed {
    alias: string;
    publicId: string;
    // publicKey: Uint8Array; // currently not used
    encryptedSeed: string;
    balance: number;
    balanceTick: number;
    lastUpdate?: Date;
}
export interface IDecodedSeed extends ISeed {
    seed: string;
}