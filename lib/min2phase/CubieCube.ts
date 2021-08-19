import {cornerFacelet, edgeFacelet, EPermR2S, FlipR2S, SymCube, SymMultInv, TwistR2S} from "./constants";
import {ESym2CSym, getComb, getNPerm, getNPermFull, setComb, setNPerm, setNPermFull} from "./tools";

export default class CubieCube {
    ca: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7]
    ea: Array<number> = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

    static urf1: CubieCube
    static urf2: CubieCube

    static EdgeMult(a: CubieCube, b: CubieCube, prod: CubieCube): void {
        for (let ed: number = 0; ed < 12; ed++) {
            prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
        }
    }

    static CornMult(a: CubieCube, b: CubieCube, prod: CubieCube): void {
        for (let corn: number = 0; corn < 8; corn++) {
            const ori: number = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
            prod.ca[corn] = a.ca[b.ca[corn] & 7] & 7 | ori << 3;
        }
    }

    static CornMultFull(a: CubieCube, b: CubieCube, prod: CubieCube): void {
        for (let corn: number = 0; corn < 8; corn++) {
            const oriA: number = a.ca[b.ca[corn] & 7] >> 3;
            const oriB: number = b.ca[corn] >> 3;
            let ori: number = oriA + ((oriA < 3) ? oriB : 6 - oriB);
            ori = ori % 3 + ((oriA < 3) === (oriB < 3) ? 0 : 3);
            prod.ca[corn] = a.ca[b.ca[corn] & 7] & 7 | ori << 3;
        }
    }

    static CornConjugate(a, idx, b): void {
        const sinv: CubieCube = SymCube[SymMultInv[0][idx]];
        const s: CubieCube = SymCube[idx];
        for (let corn = 0; corn < 8; corn++) {
            const oriA: number = sinv.ca[a.ca[s.ca[corn] & 7] & 7] >> 3;
            const oriB: number = a.ca[s.ca[corn] & 7] >> 3;
            const ori: number = (oriA < 3) ? oriB : (3 - oriB) % 3;
            b.ca[corn] = sinv.ca[a.ca[s.ca[corn] & 7] & 7] & 7 | ori << 3;
        }
    }

    static EdgeConjugate(a, idx, b): void {
        const sinv: CubieCube = SymCube[SymMultInv[0][idx]];
        const s: CubieCube = SymCube[idx];
        for (let ed: number = 0; ed < 12; ed++) {
            b.ea[ed] = sinv.ea[a.ea[s.ea[ed] >> 1] >> 1] ^ (a.ea[s.ea[ed] >> 1] & 1) ^ (s.ea[ed] & 1);
        }
    }

    init(ca: Array<number>, ea: Array<number>): CubieCube {
        this.ca = ca.slice();
        this.ea = ea.slice();
        return this;
    }

    initCoord(cperm: number, twist: number, eperm: number, flip: number): CubieCube {
        setNPerm(this.ca, cperm, 8, false);
        this.setTwist(twist);
        setNPermFull(this.ea, eperm, 12, true);
        this.setFlip(flip);
        return this;
    }

    isEqual(c: CubieCube): boolean {
        for (let i: number = 0; i < 8; i++) {
            if (this.ca[i] !== c.ca[i]) {
                return false;
            }
        }
        for (let j: number = 0; j < 12; j++) {
            if (this.ea[j] !== c.ea[j]) {
                return false;
            }
        }
        return true;
    }

    setFlip(idx: number): void {
        let parity: number = 0, val;
        for (let i: number = 10; i >= 0; i--, idx >>= 1) {
            parity ^= (val = idx & 1);
            this.ea[i] = this.ea[i] & 0xfe | val;
        }
        this.ea[11] = this.ea[11] & 0xfe | parity;
    }

    getFlip(): number {
        let idx: number = 0;
        for (let i: number = 0; i < 11; i++) {
            idx = idx << 1 | this.ea[i] & 1;
        }
        return idx;
    }

    getFlipSym(): number {
        return FlipR2S[this.getFlip()];
    }

    setTwist(idx: number): void {
        let twst: number = 15,
            val: number;
        for (let i: number = 6; i >= 0; i--, idx = ~~(idx / 3)) {
            twst -= (val = idx % 3);
            this.ca[i] = this.ca[i] & 0x7 | val << 3;
        }
        this.ca[7] = this.ca[7] & 0x7 | (twst % 3) << 3;
    }

    getTwist(): number {
        let idx: number = 0;
        for (let i: number = 0; i < 7; i++) {
            idx += (idx << 1) + (this.ca[i] >> 3);
        }
        return idx;
    }

    getTwistSym(): number {
        return TwistR2S[this.getTwist()];
    }

    setCPerm(idx: number): void {
        setNPerm(this.ca, idx, 8, false);
    }

    getCPerm(): number {
        return getNPerm(this.ca, 8, false);
    }

    getCPermSym(): number {
        return ESym2CSym(EPermR2S[getNPerm(this.ca, 8, false)]);
    }

    setEPerm(idx: number): void {
        setNPerm(this.ea, idx, 8, true);
    }

    getEPerm(): number {
        return getNPerm(this.ea, 8, true);
    }

    getEPermSym(): number {
        return EPermR2S[getNPerm(this.ea, 8, true)];
    }

    getUDSlice(): number {
        return 494 - getComb(this.ea, 8, true);
    }

    setUDSlice(idx: number): void {
        setComb(this.ea, 494 - idx, 8, true);
    }

    getMPerm(): number {
        return getNPermFull(this.ea, 12, true) % 24;
    }

    setMPerm(idx: number): void {
        setNPermFull(this.ea, idx, 12, true);
    }

    getCComb(): number {
        return getComb(this.ca, 0, false);
    }

    setCComb(idx: number): void {
        setComb(this.ca, idx, 0, false);
    }

    URFConjugate() {
        const temps: CubieCube = new CubieCube();
        CubieCube.CornMult(CubieCube.urf2, this, temps);
        CubieCube.CornMult(temps, CubieCube.urf1, this);
        CubieCube.EdgeMult(CubieCube.urf2, this, temps);
        CubieCube.EdgeMult(temps, CubieCube.urf1, this);
    }

    toFaceCube(cFacelet: Array<Array<number>> = cornerFacelet, eFacelet: Array<Array<number>> = edgeFacelet): string {
        const ts: string = "URFDLB";
        const f: Array<string> = [];
        for (let i: number = 0; i < 54; i++) {
            f[i] = ts[~~(i / 9)];
        }
        for (let c: number = 0; c < 8; c++) {
            const j: number = this.ca[c] & 0x7; // cornercubie with index j is at
            const ori: number = this.ca[c] >> 3; // Orientation of this cubie
            for (let m = 0; m < 3; m++)
                f[cFacelet[c][(m + ori) % 3]] = ts[~~(cFacelet[j][m] / 9)];
        }
        for (let e: number = 0; e < 12; e++) {
            const k: number = this.ea[e] >> 1; // edgecubie with index k is at edgeposition
            const ori1: number = this.ea[e] & 1; // Orientation of this cubie
            for (let n: number = 0; n < 2; n++)
                f[eFacelet[e][(n + ori1) % 2]] = ts[~~(eFacelet[k][n] / 9)];
        }
        return f.join("");
    }

    invFrom(cc: CubieCube): CubieCube {
        for (let edge: number = 0; edge < 12; edge++) {
            this.ea[cc.ea[edge] >> 1] = edge << 1 | cc.ea[edge] & 1;
        }
        for (let corn: number = 0; corn < 8; corn++) {
            this.ca[cc.ca[corn] & 0x7] = corn | 0x20 >> (cc.ca[corn] >> 3) & 0x18;
        }
        return this;
    }

    fromFacelet(facelet, cFacelet: Array<Array<number>> = cornerFacelet, eFacelet: Array<Array<number>> = edgeFacelet) {
        let count: number = 0;
        const f: Array<number> = [];
        const centers: string = facelet[4] + facelet[13] + facelet[22] + facelet[31] + facelet[40] + facelet[49];
        for (let i: number = 0; i < 54; ++i) {
            f[i] = centers.indexOf(facelet[i]);
            if (f[i] === -1) {
                return -1;
            }
            count += 1 << (f[i] << 2);
        }
        if (count !== 0x999999) {
            return -1;
        }
        let col1: number, col2: number, j: number, k: number, ori: number;
        for (j = 0; j < 8; ++j) {
            for (ori = 0; ori < 3; ++ori)
                if (f[cFacelet[j][ori]] === 0 || f[cFacelet[j][ori]] === 3)
                    break;
            col1 = f[cFacelet[j][(ori + 1) % 3]];
            col2 = f[cFacelet[j][(ori + 2) % 3]];
            for (k = 0; k < 8; ++k) {
                if (col1 === ~~(cFacelet[k][1] / 9) && col2 === ~~(cFacelet[k][2] / 9)) {
                    this.ca[j] = k | ori % 3 << 3;
                    break;
                }
            }
        }
        for (j = 0; j < 12; ++j) {
            for (k = 0; k < 12; ++k) {
                if (f[eFacelet[j][0]] === ~~(eFacelet[k][0] / 9) && f[eFacelet[j][1]] === ~~(eFacelet[k][1] / 9)) {
                    this.ea[j] = k << 1;
                    break;
                }
                if (f[eFacelet[j][0]] === ~~(eFacelet[k][1] / 9) && f[eFacelet[j][1]] === ~~(eFacelet[k][0] / 9)) {
                    this.ea[j] = k << 1 | 1;
                    break;
                }
            }
        }
    }
}