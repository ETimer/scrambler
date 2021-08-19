import {
    FlipMove,
    FlipS2RF,
    N_SLICE, Sym8Move, SymMove,
    TwistFlipPrun, TwistMove,
    UDSliceConj,
    UDSliceFlipPrun, UDSliceMove,
    UDSliceTwistPrun,
    USE_CONJ_PRUN, USE_TWIST_FLIP_PRUN
} from "./constants";
import {getPruningMax} from "./tools";
import CubieCube from "./CubieCube";
import {TwistFlipPrunMax, UDSliceTwistPrunMax, UDSliceFlipPrunMax} from "./init";

export default class CoordCube {
    twist: number = 0;
    tsym: number = 0;
    flip: number = 0;
    fsym: number = 0;
    slice: number = 0;
    prun: number = 0;
    twistc: number = 0;
    flipc: number = 0;

    // set(node: CoordCube): void {
    //     this.twist = node.twist;
    //     this.tsym = node.tsym;
    //     this.flip = node.flip;
    //     this.fsym = node.fsym;
    //     this.slice = node.slice;
    //     this.prun = node.prun;
    //     if (USE_CONJ_PRUN) {
    //         this.twistc = node.twistc;
    //         this.flipc = node.flipc;
    //     }
    // }
    //
    // calcPruning(): void {
    //     this.prun = Math.max(
    //         Math.max(
    //             getPruningMax(UDSliceTwistPrunMax, UDSliceTwistPrun,
    //                 this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]),
    //             getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun,
    //                 this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])),
    //         Math.max(
    //             USE_CONJ_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
    //                 (this.twistc >> 3) << 11 | FlipS2RF[this.flipc ^ (this.twistc & 7)]) : 0,
    //             USE_TWIST_FLIP_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
    //                 this.twist << 11 | FlipS2RF[this.flip << 3 | (this.fsym ^ this.tsym)]) : 0));
    // }

    setWithPrun(cc: CubieCube, depth: number): boolean {
        this.twist = cc.getTwistSym();
        this.flip = cc.getFlipSym();
        this.tsym = this.twist & 7;
        this.twist = this.twist >> 3;
        this.prun = USE_TWIST_FLIP_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
            this.twist << 11 | FlipS2RF[this.flip ^ this.tsym]) : 0;
        if (this.prun > depth) {
            return false;
        }
        this.fsym = this.flip & 7;
        this.flip = this.flip >> 3;
        this.slice = cc.getUDSlice();
        this.prun = Math.max(this.prun, Math.max(
            getPruningMax(UDSliceTwistPrunMax, UDSliceTwistPrun,
                this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]),
            getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun,
                this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])));
        if (this.prun > depth) {
            return false;
        }
        if (USE_CONJ_PRUN) {
            const pc: CubieCube = new CubieCube();
            CubieCube.CornConjugate(cc, 1, pc);
            CubieCube.EdgeConjugate(cc, 1, pc);
            this.twistc = pc.getTwistSym();
            this.flipc = pc.getFlipSym();
            this.prun = Math.max(this.prun,
                getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
                    (this.twistc >> 3) << 11 | FlipS2RF[this.flipc ^ (this.twistc & 7)]));
        }
        return this.prun <= depth;
    }

    doMovePrun(cc: CoordCube, m: number): number {
        this.slice = UDSliceMove[cc.slice][m];
        this.flip = FlipMove[cc.flip][Sym8Move[m << 3 | cc.fsym]];
        this.fsym = (this.flip & 7) ^ cc.fsym;
        this.flip >>= 3;
        this.twist = TwistMove[cc.twist][Sym8Move[m << 3 | cc.tsym]];
        this.tsym = (this.twist & 7) ^ cc.tsym;
        this.twist >>= 3;
        this.prun = Math.max(
            Math.max(
                getPruningMax(UDSliceTwistPrunMax, UDSliceTwistPrun,
                    this.twist * N_SLICE + UDSliceConj[this.slice][this.tsym]),
                getPruningMax(UDSliceFlipPrunMax, UDSliceFlipPrun,
                    this.flip * N_SLICE + UDSliceConj[this.slice][this.fsym])),
            USE_TWIST_FLIP_PRUN ? getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
                this.twist << 11 | FlipS2RF[this.flip << 3 | (this.fsym ^ this.tsym)]) : 0);
        return this.prun;
    }

    doMovePrunConj(cc: CoordCube, m: number): number {
        m = SymMove[3][m];
        this.flipc = FlipMove[cc.flipc >> 3][Sym8Move[m << 3 | cc.flipc & 7]] ^ (cc.flipc & 7);
        this.twistc = TwistMove[cc.twistc >> 3][Sym8Move[m << 3 | cc.twistc & 7]] ^ (cc.twistc & 7);
        return getPruningMax(TwistFlipPrunMax, TwistFlipPrun,
            (this.twistc >> 3) << 11 | FlipS2RF[this.flipc ^ (this.twistc & 7)]);
    }
}
