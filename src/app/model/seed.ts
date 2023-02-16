export interface ISeed {
    alias: string;
    publicId: string;
    // publicKey: Uint8Array; // currently not used
    encryptedSeed: string;
}
export interface IDecodedSeed extends ISeed {
    seed: string;
}