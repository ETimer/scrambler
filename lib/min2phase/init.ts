import {
    CCombPConj,
    CCombPMove,
    ckmv2bit,
    Cnk, CPermMove, EPermCCombPPrun,
    EPermMove,
    EPermR2S,
    EPermS2R,
    fact,
    FlipMove,
    FlipR2S,
    FlipS2R,
    FlipS2RF, MCPermPrun,
    moveCube, MPermConj, MPermMove, N_COMB,
    N_FLIP,
    N_FLIP_SYM,
    N_MOVES,
    N_MOVES2, N_MPERM,
    N_PERM,
    N_PERM_SYM, N_SLICE,
    N_TWIST,
    N_TWIST_SYM, P2_PARITY_MOVE, PARTIAL_INIT_LEVEL,
    Perm2CombP,
    PermInvEdgeSym,
    std2ud,
    Sym8Move,
    SymCube,
    SymMove,
    SymMoveUD,
    SymMult,
    SymMultInv,
    SymStateFlip,
    SymStatePerm,
    SymStateTwist, TwistFlipPrun,
    TwistMove,
    TwistR2S,
    TwistS2R,
    ud2std, UDSliceConj, UDSliceFlipPrun, UDSliceMove, UDSliceTwistPrun,
    USE_COMBP_PRUN,
    USE_TWIST_FLIP_PRUN
} from "./constants";
import CubieCube from "./CubieCube";
import {getComb, getNParity, getPruning, hasZero, setNPerm, setPruning} from "./tools";

//init pruning tables
let InitPrunProgress: number = -1;

export let TwistFlipPrunMax: number = 15;
export let UDSliceTwistPrunMax: number = 15;
export let UDSliceFlipPrunMax: number = 15;
export let MCPermPrunMax: number = 15;
export let EPermCCombPPrunMax: number = 15;

export function initUtil(): void { // init util
    for (let k: number = 0; k < 18; k++) {
        std2ud[ud2std[k]] = k;
    }
    for (let i = 0; i < 10; i++) {
        const ix = ~~(ud2std[i] / 3);
        ckmv2bit[i] = 0;
        for (let j: number = 0; j < 10; j++) {
            const jx: number = ~~(ud2std[j] / 3);
            ckmv2bit[i] |= ((ix === jx) || ((ix % 3 === jx % 3) && (ix >= jx)) ? 1 : 0) << j;
        }
    }
    ckmv2bit[10] = 0;
    for (let m: number = 0; m < 13; m++) {
        Cnk[m] = [];
        fact[m + 1] = fact[m] * (m + 1);
        Cnk[m][0] = Cnk[m][m] = 1;
        for (let n: number = 1; n < 13; n++) {
            Cnk[m][n] = n <= m ? Cnk[m - 1][n - 1] + Cnk[m - 1][n] : 0;
        }
    }
}

function initBasic(): void {
    initSymCubes();
    initTables();
    initCoordTables();

    function initSymCubes(): void {
        // init sym cubes
        const c: CubieCube = new CubieCube();
        const d: CubieCube = new CubieCube();

        const f2: CubieCube = new CubieCube().initCoord(28783, 0, 259268407, 0);
        const u4: CubieCube = new CubieCube().initCoord(15138, 0, 119765538, 7);
        const lr2: CubieCube = new CubieCube().initCoord(5167, 0, 83473207, 0);
        for (let j: number = 0; j < 8; j++) {
            lr2.ca[j] |= 3 << 3;
        }
        for (let i: number = 0; i < 16; i++) {
            SymCube[i] = new CubieCube().init(c.ca, c.ea);
            CubieCube.CornMultFull(c, u4, d);
            CubieCube.EdgeMult(c, u4, d);
            c.init(d.ca, d.ea);
            if (i % 4 === 3) {
                CubieCube.CornMultFull(c, lr2, d);
                CubieCube.EdgeMult(c, lr2, d);
                c.init(d.ca, d.ea);
            }
            if (i % 8 === 7) {
                CubieCube.CornMultFull(c, f2, d);
                CubieCube.EdgeMult(c, f2, d);
                c.init(d.ca, d.ea);
            }
        }
    }

    function initTables(): void { // gen sym tables
        for (let i: number = 0; i < 16; i++) {
            SymMult[i] = [];
            SymMultInv[i] = [];
            SymMove[i] = [];
            SymMoveUD[i] = [];
        }
        for (let j: number = 0; j < 16; j++) {
            for (let k = 0; k < 16; k++) {
                SymMult[j][k] = j ^ k ^ (0x14ab4 >> k & j << 1 & 2); // SymMult[i][j] = (i ^ j ^ (0x14ab4 >> j & i << 1 & 2)));
                SymMultInv[SymMult[j][k]][k] = j;
            }
        }

        const c: CubieCube = new CubieCube();
        for (let s: number = 0; s < 16; s++) {
            for (let l: number = 0; l < 18; l++) {
                CubieCube.CornConjugate(moveCube[l], SymMultInv[0][s], c);
                outLoop: for (let m: number = 0; m < 18; m++) {
                    for (let t: number = 0; t < 8; t++) {
                        if (moveCube[m].ca[t] !== c.ca[t]) {
                            continue outLoop;
                        }
                    }
                    SymMove[s][l] = m;
                    SymMoveUD[s][std2ud[l]] = std2ud[m];
                    break;
                }
                if (s % 2 === 0) {
                    Sym8Move[l << 3 | s >> 1] = SymMove[s][l];
                }
            }
        }

        // init sym 2 raw tables
        function initSym2Raw(
            N_RAW: number,
            Sym2Raw: Array<number>,
            Raw2Sym: Array<number>,
            SymState: Array<number>,
            coord: number,
            setFunc: Function,
            getFunc: Function
        ): number {
            const c: CubieCube = new CubieCube();
            const d: CubieCube = new CubieCube();
            let count: number = 0;
            const sym_inc: number = coord >= 2 ? 1 : 2;
            const conjFunc: Function = coord !== 1 ? CubieCube.EdgeConjugate : CubieCube.CornConjugate;

            for (let i: number = 0; i < N_RAW; i++) {
                if (Raw2Sym[i] !== undefined) {
                    continue;
                }
                setFunc.call(c, i);
                for (let s: number = 0; s < 16; s += sym_inc) {
                    conjFunc(c, s, d);
                    const idx: number = getFunc.call(d);
                    if (USE_TWIST_FLIP_PRUN && coord === 0) {
                        FlipS2RF[count << 3 | s >> 1] = idx;
                    }
                    if (idx === i) {
                        SymState[count] |= 1 << (s / sym_inc);
                    }
                    Raw2Sym[idx] = (count << 4 | s) / sym_inc;
                }
                Sym2Raw[count++] = i;
            }
            return count;
        }

        initSym2Raw(N_FLIP, FlipS2R, FlipR2S, SymStateFlip, 0, CubieCube.prototype.setFlip, CubieCube.prototype.getFlip);
        initSym2Raw(N_TWIST, TwistS2R, TwistR2S, SymStateTwist, 1, CubieCube.prototype.setTwist, CubieCube.prototype.getTwist);
        initSym2Raw(N_PERM, EPermS2R, EPermR2S, SymStatePerm, 2, CubieCube.prototype.setEPerm, CubieCube.prototype.getEPerm);

        const cc: CubieCube = new CubieCube();
        for (let o: number = 0; o < N_PERM_SYM; o++) {
            setNPerm(cc.ea, EPermS2R[o], 8, true);
            Perm2CombP[o] = getComb(cc.ea, 0, true) + (USE_COMBP_PRUN ? getNParity(EPermS2R[o], 8) * 70 : 0);
            c.invFrom(cc);
            PermInvEdgeSym[o] = EPermR2S[c.getEPerm()];
        }
    }

    function initCoordTables() {
        // init coord tables
        const c: CubieCube = new CubieCube();
        const d: CubieCube = new CubieCube();

        function initSymMoveTable(
            moveTable: Array<Array<number>>,
            SymS2R: Array<number>,
            N_SIZE: number,
            N_MOVES: number,
            setFunc: Function,
            getFunc: Function,
            multFunc: Function,
            ud2std: Array<number> = null
        ): void {
            for (let i: number = 0; i < N_SIZE; i++) {
                moveTable[i] = [];
                setFunc.call(c, SymS2R[i]);
                for (let j: number = 0; j < N_MOVES; j++) {
                    multFunc(c, moveCube[ud2std ? ud2std[j] : j], d);
                    moveTable[i][j] = getFunc.call(d);
                }
            }
        }

        initSymMoveTable(FlipMove, FlipS2R, N_FLIP_SYM, N_MOVES,
            CubieCube.prototype.setFlip, CubieCube.prototype.getFlipSym, CubieCube.EdgeMult);
        initSymMoveTable(TwistMove, TwistS2R, N_TWIST_SYM, N_MOVES,
            CubieCube.prototype.setTwist, CubieCube.prototype.getTwistSym, CubieCube.CornMult);
        initSymMoveTable(EPermMove, EPermS2R, N_PERM_SYM, N_MOVES2,
            CubieCube.prototype.setEPerm, CubieCube.prototype.getEPermSym, CubieCube.EdgeMult, ud2std);
        initSymMoveTable(CPermMove, EPermS2R, N_PERM_SYM, N_MOVES2,
            CubieCube.prototype.setCPerm, CubieCube.prototype.getCPermSym, CubieCube.CornMult, ud2std);

        for (let i: number = 0; i < N_SLICE; i++) {
            UDSliceMove[i] = [];
            UDSliceConj[i] = [];
            c.setUDSlice(i);
            for (let j: number = 0; j < N_MOVES; j++) {
                CubieCube.EdgeMult(c, moveCube[j], d);
                UDSliceMove[i][j] = d.getUDSlice();
            }
            for (let k: number = 0; k < 16; k += 2) {
                CubieCube.EdgeConjugate(c, SymMultInv[0][k], d);
                UDSliceConj[i][k >> 1] = d.getUDSlice();
            }
        }

        for (let l: number = 0; l < N_MPERM; l++) {
            MPermMove[l] = [];
            MPermConj[l] = [];
            c.setMPerm(l);
            for (let m = 0; m < N_MOVES2; m++) {
                CubieCube.EdgeMult(c, moveCube[ud2std[m]], d);
                MPermMove[l][m] = d.getMPerm();
            }
            for (let n = 0; n < 16; n++) {
                CubieCube.EdgeConjugate(c, SymMultInv[0][n], d);
                MPermConj[l][n] = d.getMPerm();
            }
        }

        for (let o = 0; o < N_COMB; o++) {
            CCombPMove[o] = [];
            CCombPConj[o] = [];
            c.setCComb(o % 70);
            for (let p = 0; p < N_MOVES2; p++) {
                CubieCube.CornMult(c, moveCube[ud2std[p]], d);
                CCombPMove[o][p] = d.getCComb() + 70 * ((P2_PARITY_MOVE >> p & 1) ^ ~~(o / 70));
            }
            for (let q = 0; q < 16; q++) {
                CubieCube.CornConjugate(c, SymMultInv[0][q], d);
                CCombPConj[o][q] = d.getCComb() + 70 * ~~(q / 70);
            }
        }
    }
}

export function initRawSymPrun(
    PrunTable: Array<number>,
    N_RAW: number,
    N_SYM: number,
    RawMove: Array<Array<number>>,
    RawConj: Array<Array<number>>,
    SymMove: Array<Array<number>>,
    SymState: Array<number>,
    PrunFlag: number
): number {
    const SYM_SHIFT: number = PrunFlag & 0xf;
    const SYM_E2C_MAGIC: number = ((PrunFlag >> 4) & 1) === 1 ? 0x00DDDD00 : 0x00000000;
    const IS_PHASE2: boolean = ((PrunFlag >> 5) & 1) === 1;
    const INV_DEPTH: number = PrunFlag >> 8 & 0xf;
    const MAX_DEPTH: number = PrunFlag >> 12 & 0xf;
    const MIN_DEPTH: number = PrunFlag >> 16 & 0xf;

    const SYM_MASK: number = (1 << SYM_SHIFT) - 1;
    const ISTFP: boolean = RawMove == null;
    const N_SIZE: number = N_RAW * N_SYM;
    const N_MOVES: number = IS_PHASE2 ? 10 : 18;
    const NEXT_AXIS_MAGIC: number = N_MOVES === 10 ? 0x42 : 0x92492;

    let depth: number = getPruning(PrunTable, N_SIZE) - 1;

    if (depth === -1) {
        for (let k: number = 0; k < (N_SIZE >> 3) + 1; k++) {
            PrunTable[k] = 0xffffffff;
        }
        setPruning(PrunTable, 0, 0 ^ 0xf);
        depth = 0;
    } else {
        setPruning(PrunTable, N_SIZE, 0xf ^ (depth + 1));
    }

    const SEARCH_DEPTH: number = PARTIAL_INIT_LEVEL > 0 ?
        Math.min(Math.max(depth + 1, MIN_DEPTH), MAX_DEPTH) : MAX_DEPTH;

    while (depth < SEARCH_DEPTH) {
        const inv: boolean = depth > INV_DEPTH;
        const select: number = inv ? 0xf : depth;
        const selArrMask: number = select * 0x11111111;
        const check: number = inv ? depth : 0xf;
        depth++;
        InitPrunProgress++;
        const xorVal: number = depth ^ 0xf;
        let val: number = 0;
        for (let i: number = 0; i < N_SIZE; i++, val >>= 4) {
            if ((i & 7) === 0) {
                val = PrunTable[i >> 3];
                if (!hasZero(val ^ selArrMask)) {
                    i += 7;
                    continue;
                }
            }
            if ((val & 0xf) !== select) {
                continue;
            }
            const raw: number = i % N_RAW;
            const sym: number = ~~(i / N_RAW);
            let flip: number = 0,
                fsym: number = 0;
            if (ISTFP) {
                flip = FlipR2S[raw];
                fsym = flip & 7;
                flip >>= 3;
            }

            for (let m: number = 0; m < N_MOVES; m++) {
                let symx: number = SymMove[sym][m];
                let rawx;
                if (ISTFP) {
                    rawx = FlipS2RF[
                    FlipMove[flip][Sym8Move[m << 3 | fsym]] ^
                    fsym ^ (symx & SYM_MASK)];
                } else {
                    rawx = RawConj[RawMove[raw][m]][symx & SYM_MASK];
                }
                symx >>= SYM_SHIFT;
                const idx: number = symx * N_RAW + rawx;
                const prun: number = getPruning(PrunTable, idx);
                if (prun !== check) {
                    if (prun < depth - 1) {
                        m += NEXT_AXIS_MAGIC >> m & 3;
                    }
                    continue;
                }
                if (inv) {
                    setPruning(PrunTable, i, xorVal);
                    break;
                }
                setPruning(PrunTable, idx, xorVal);
                for (let j: number = 1, symState = SymState[symx];
                     (symState >>= 1) !== 0; j++) {
                    if ((symState & 1) !== 1) {
                        continue;
                    }
                    let idxx: number = symx * N_RAW;
                    if (ISTFP) {
                        idxx += FlipS2RF[FlipR2S[rawx] ^ j];
                    } else {
                        idxx += RawConj[rawx][j ^ (SYM_E2C_MAGIC >> (j << 1) & 3)];
                    }
                    if (getPruning(PrunTable, idxx) === check) {
                        setPruning(PrunTable, idxx, xorVal);
                    }
                }
            }
        }
    }
    setPruning(PrunTable, N_SIZE, (depth + 1) ^ 0xf);
    return depth + 1;
}

export function doInitPrunTables(targetProgress: number): void {
    if (USE_TWIST_FLIP_PRUN) {
        TwistFlipPrunMax = initRawSymPrun(
            TwistFlipPrun, 2048, 324,
            null, null,
            TwistMove, SymStateTwist, 0x19603
        );
    }
    if (InitPrunProgress > targetProgress) {
        return;
    }
    UDSliceTwistPrunMax = initRawSymPrun(
        UDSliceTwistPrun, 495, 324,
        UDSliceMove, UDSliceConj,
        TwistMove, SymStateTwist, 0x69603
    );
    if (InitPrunProgress > targetProgress) {
        return;
    }
    UDSliceFlipPrunMax = initRawSymPrun(
        UDSliceFlipPrun, 495, 336,
        UDSliceMove, UDSliceConj,
        FlipMove, SymStateFlip, 0x69603
    );
    if (InitPrunProgress > targetProgress) {
        return;
    }
    MCPermPrunMax = initRawSymPrun(
        MCPermPrun, 24, 2768,
        MPermMove, MPermConj,
        CPermMove, SymStatePerm, 0x8ea34
    );
    if (InitPrunProgress > targetProgress) {
        return;
    }
    EPermCCombPPrunMax = initRawSymPrun(
        EPermCCombPPrun, N_COMB, 2768,
        CCombPMove, CCombPConj,
        EPermMove, SymStatePerm, 0x7d824
    );
}

export function initPrunTables(): boolean {
    if (InitPrunProgress < 0) {
        initBasic();
        InitPrunProgress = 0;
    }
    if (InitPrunProgress === 0) {
        doInitPrunTables(99);
    } else if (InitPrunProgress < 54) {
        doInitPrunTables(InitPrunProgress);
    } else {
        return true;
    }
    return false;
}

export function randomCube(): string {
    let ep: number, cp: number;
    const eo: number = ~~(Math.random() * 2048);
    const co: number = ~~(Math.random() * 2187);
    do {
        ep = ~~(Math.random() * fact[12]);
        cp = ~~(Math.random() * fact[8]);
    } while (getNParity(cp, 8) !== getNParity(ep, 12));
    const cc: CubieCube = new CubieCube().initCoord(cp, co, ep, eo);

    return cc.toFaceCube();
}

export function fromScramble(s): string {
    let axis: number = -1;
    const c1: CubieCube = new CubieCube();
    const c2: CubieCube = new CubieCube();
    for (let i: number = 0; i < s.length; i++) {
        switch (s[i]) {
            case 'U':
            case 'R':
            case 'F':
            case 'D':
            case 'L':
            case 'B':
                axis = "URFDLB".indexOf(s[i]) * 3;
                break;
            case ' ':
                if (axis !== -1) {
                    CubieCube.CornMult(c1, moveCube[axis], c2);
                    CubieCube.EdgeMult(c1, moveCube[axis], c2);
                    c1.init(c2.ca, c2.ea);
                }
                axis = -1;
                break;
            case '2':
                axis++;
                break;
            case '\'':
                axis += 2;
                break;
        }
    }
    if (axis !== -1) {
        CubieCube.CornMult(c1, moveCube[axis], c2);
        CubieCube.EdgeMult(c1, moveCube[axis], c2);
        c1.init(c2.ca, c2.ea);
    }

    return c2.toFaceCube();
}

export function initMoveCubes(): void { //init move cubes
    for (let i: number = 0; i < 18; i++) {
        moveCube[i] = new CubieCube()
    }
    moveCube[0].initCoord(15120, 0, 119750400, 0);
    moveCube[3].initCoord(21021, 1494, 323403417, 0);
    moveCube[6].initCoord(8064, 1236, 29441808, 550);
    moveCube[9].initCoord(9, 0, 5880, 0);
    moveCube[12].initCoord(1230, 412, 2949660, 0);
    moveCube[15].initCoord(224, 137, 328552, 137);
    for (let a: number = 0; a < 18; a += 3) {
        for (let p: number = 0; p < 2; p++) {
            CubieCube.EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
            CubieCube.CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
        }
    }
    CubieCube.urf1 = new CubieCube().initCoord(2531, 1373, 67026819, 1367);
    CubieCube.urf2 = new CubieCube().initCoord(2089, 1906, 322752913, 2040);
}