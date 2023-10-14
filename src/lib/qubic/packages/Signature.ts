import { IQubicBuildPackage } from "./IQubicPackage";
import { QubicDefinitions } from "./QubicDefinitions";

export class Signature implements IQubicBuildPackage {
    private bytes: Uint8Array = new Uint8Array(QubicDefinitions.SIGNATURE_SIZE).fill(0);

    setSignature(bytes: Uint8Array) {
        this.bytes = bytes;
    }

    getPackageData() {
        return this.bytes;
    }

    getPackageSize(): number {
        return this.bytes.length;
    }
}