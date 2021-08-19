import {
    CCombPConj, ckmv2bit, CPermMove,
    EPermCCombPPrun, EPermMove, INVERSE_SOLUTION, MAX_DEPTH2,
    MAX_PRE_MOVES,
    MCPermPrun,
    MIN_P1LENGTH_PRE, move2str,
    moveCube,
    MPermConj, MPermMove, N_COMB,
    N_MPERM, Perm2CombP, SymMoveUD, SymMult, SymMultInv,
    TRY_INVERSE,
    TRY_THREE_AXES, ud2std, urfMove, USE_CONJ_PRUN
} from "./constants";
import {getNParity, getNPermFull, getPermSymInv, getPruningMax} from "./tools";
import CubieCube from "./CubieCube";
import CoordCube from "./CoordCube";

import {initPrunTables, MCPermPrunMax, EPermCCombPPrunMax} from "./init";

export default class Search {
    move: Array<number> = []
    moveSol: Array<number> = []
    moveSolStr: string = ''

    nodeUD: Array<CoordCube> = []

    valid1: number = 0
    allowShorter: boolean = false
    cc: CubieCube = new CubieCube();
    urfCubieCube: Array<CubieCube> = []
    urfCoordCube: Array<CoordCube> = []
    phase1Cubie: Array<CubieCube> = []

    preMoveCubes: Array<CubieCube> = []
    preMoves: Array<number> = []
    preMoveLen: number = 0
    maxPreMoves: number = 0

    isRec: boolean = false;

    sol: number
    probe: number
    probeMax: number
    probeMin: number
    verbose: number
    conjMask: number
    depth1: number
    length1: number
    urfIdx: number

    constructor() {
        for (let i: number = 0; i < 21; i++) {
            this.nodeUD[i] = new CoordCube();
            this.phase1Cubie[i] = new CubieCube();
        }
        for (let j: number = 0; j < 6; j++) {
            this.urfCubieCube[j] = new CubieCube();
            this.urfCoordCube[j] = new CoordCube();
        }
        for (let k: number = 0; k < MAX_PRE_MOVES; k++) {
            this.preMoveCubes[k + 1] = new CubieCube();
        }
    }

    solution(facelets: string, maxDepth: number = 21, probeMax: number = 1e9, probeMin: number = 0, verbose: number = 0): string {
        initPrunTables();
        const check: number = this.verify(facelets);
        if (check !== 0) {
            return "Error " + Math.abs(check);
        }
        this.sol = maxDepth + 1;
        this.probe = 0;
        this.probeMax = probeMax;
        this.probeMin = Math.min(probeMin, probeMax);
        this.verbose = verbose;
        this.moveSol = null;
        this.moveSolStr = '';
        this.isRec = false;
        this.initSearch();
        return this.search();
    }

    initSearch() {
        this.conjMask = (TRY_INVERSE ? 0 : 0x38) | (TRY_THREE_AXES ? 0 : 0x36);
        this.maxPreMoves = this.conjMask > 7 ? 0 : MAX_PRE_MOVES;

        for (let i: number = 0; i < 6; i++) {
            this.urfCubieCube[i].init(this.cc.ca, this.cc.ea);
            this.urfCoordCube[i].setWithPrun(this.urfCubieCube[i], 20);
            this.cc.URFConjugate();
            if (i % 3 === 2) {
                const tmp: CubieCube = new CubieCube().invFrom(this.cc);
                this.cc.init(tmp.ca, tmp.ea);
            }
        }
    }

    next(probeMax: number = 1e9, probeMin: number = 0, verbose: number = 0): string {
        this.probe = 0;
        this.probeMax = probeMax;
        this.probeMin = Math.min(probeMin, probeMax);
        this.moveSol = null;
        this.moveSolStr = '';
        this.isRec = true;
        this.verbose = verbose;
        return this.search();
    }

    verify(facelets: string): number {
        if (this.cc.fromFacelet(facelets) === -1) {
            return -1;
        }
        let sum: number = 0;
        let edgeMask: number = 0;
        for (let e: number = 0; e < 12; e++) {
            edgeMask |= 1 << (this.cc.ea[e] >> 1);
            sum ^= this.cc.ea[e] & 1;
        }
        if (edgeMask !== 0xfff) {
            return -2; // missing edges
        }
        if (sum !== 0) {
            return -3;
        }
        let cornMask = 0;
        sum = 0;
        for (let c = 0; c < 8; c++) {
            cornMask |= 1 << (this.cc.ca[c] & 7);
            sum += this.cc.ca[c] >> 3;
        }
        if (cornMask !== 0xff) {
            return -4; // missing corners
        }
        if (sum % 3 !== 0) {
            return -5; // twisted corner
        }
        if ((getNParity(getNPermFull(this.cc.ea, 12, true), 12) ^ getNParity(this.cc.getCPerm(), 8)) !== 0) {
            return -6; // parity error
        }
        return 0; // cube ok
    }

    phase1PreMoves(maxl: number, lm: number, cc: CubieCube): number {
        this.preMoveLen = this.maxPreMoves - maxl;
        if (this.isRec ? (this.depth1 === this.length1 - this.preMoveLen) :
            (this.preMoveLen === 0 || (0x36FB7 >> lm & 1) === 0)) {
            this.depth1 = this.length1 - this.preMoveLen;
            this.phase1Cubie[0].init(cc.ca, cc.ea) /* = cc*/;
            this.allowShorter = this.depth1 === MIN_P1LENGTH_PRE && this.preMoveLen !== 0;

            if (this.nodeUD[this.depth1 + 1].setWithPrun(cc, this.depth1) &&
                this.phase1(this.nodeUD[this.depth1 + 1], this.depth1, -1) === 0) {
                return 0;
            }
        }

        if (maxl === 0 || this.preMoveLen + MIN_P1LENGTH_PRE >= this.length1) {
            return 1;
        }

        let skipMoves: number = 0;
        if (maxl === 1 || this.preMoveLen + 1 + MIN_P1LENGTH_PRE >= this.length1) { //last pre move
            skipMoves |= 0x36FB7; // 11 0110 1111 1011 0111
        }

        lm = ~~(lm / 3) * 3;
        for (let m: number = 0; m < 18; m++) {
            if (m === lm || m === lm - 9 || m === lm + 9) {
                m += 2;
                continue;
            }
            if (this.isRec && m !== this.preMoves[this.maxPreMoves - maxl] || (skipMoves & 1 << m) !== 0) {
                continue;
            }
            CubieCube.CornMult(moveCube[m], cc, this.preMoveCubes[maxl]);
            CubieCube.EdgeMult(moveCube[m], cc, this.preMoveCubes[maxl]);
            this.preMoves[this.maxPreMoves - maxl] = m;
            const ret: number = this.phase1PreMoves(maxl - 1, m, this.preMoveCubes[maxl]);
            if (ret === 0) {
                return 0;
            }
        }
        return 1;
    }

    search(): string {
        for (this.length1 = this.isRec ? this.length1 : 0; this.length1 < this.sol; this.length1++) {
            for (this.urfIdx = this.isRec ? this.urfIdx : 0; this.urfIdx < 6; this.urfIdx++) {
                if ((this.conjMask & 1 << this.urfIdx) !== 0) {
                    continue;
                }
                if (this.phase1PreMoves(this.maxPreMoves, -30, this.urfCubieCube[this.urfIdx]) === 0) {
                    return this.moveSol == null ? "Error 8" : this.moveSolStr;
                }
            }
        }
        return this.moveSol == null ? "Error 7" : this.moveSolStr;
    }

    initPhase2Pre(): number {
        this.isRec = false;
        if (this.probe >= (this.moveSol == null ? this.probeMax : this.probeMin)) {
            return 0;
        }
        ++this.probe;

        for (let i: number = this.valid1; i < this.depth1; i++) {
            CubieCube.CornMult(this.phase1Cubie[i], moveCube[this.move[i]], this.phase1Cubie[i + 1]);
            CubieCube.EdgeMult(this.phase1Cubie[i], moveCube[this.move[i]], this.phase1Cubie[i + 1]);
        }
        this.valid1 = this.depth1;

        let ret: number = this.initPhase2(this.phase1Cubie[this.depth1]);
        if (ret === 0 || this.preMoveLen === 0 || ret === 2) {
            return ret;
        }

        const m: number = ~~(this.preMoves[this.preMoveLen - 1] / 3) * 3 + 1;
        CubieCube.CornMult(moveCube[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);
        CubieCube.EdgeMult(moveCube[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);

        this.preMoves[this.preMoveLen - 1] += 2 - this.preMoves[this.preMoveLen - 1] % 3 * 2;
        ret = this.initPhase2(this.phase1Cubie[this.depth1 + 1]);
        this.preMoves[this.preMoveLen - 1] += 2 - this.preMoves[this.preMoveLen - 1] % 3 * 2;
        return ret;
    }

    initPhase2(phase2Cubie: CubieCube): number {
        let p2corn: number = phase2Cubie.getCPermSym();
        const p2csym: number = p2corn & 0xf;
        p2corn >>= 4;
        let p2edge: number = phase2Cubie.getEPermSym();
        const p2esym: number = p2edge & 0xf;
        p2edge >>= 4;
        const p2mid: number = phase2Cubie.getMPerm();
        const p2edgei: number = getPermSymInv(p2edge, p2esym, false);
        const p2corni: number = getPermSymInv(p2corn, p2csym, true);
        const prun: number = Math.max(
            getPruningMax(MCPermPrunMax, MCPermPrun,
                p2corn * N_MPERM + MPermConj[p2mid][p2csym]),
            getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
                p2edge * N_COMB + CCombPConj[Perm2CombP[p2corn] & 0xff][SymMultInv[p2esym][p2csym]]),
            getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
                (p2edgei >> 4) * N_COMB + CCombPConj[Perm2CombP[p2corni >> 4] & 0xff][SymMultInv[p2edgei & 0xf][p2corni & 0xf]])
        );
        let maxDep2: number = Math.min(MAX_DEPTH2, this.sol - this.length1);
        if (prun >= maxDep2) {
            return prun > maxDep2 ? 2 : 1;
        }
        let depth2: number;
        for (depth2 = maxDep2 - 1; depth2 >= prun; depth2--) {
            const ret1 = this.phase2(p2edge, p2esym, p2corn, p2csym, p2mid, depth2, this.depth1, 10);
            if (ret1 < 0) {
                break;
            }
            depth2 -= ret1;
            this.moveSol = [];
            for (let i: number = 0; i < this.depth1 + depth2; i++) {
                this.appendSolMove(this.move[i]);
            }
            for (let j: number = this.preMoveLen - 1; j >= 0; j--) {
                this.appendSolMove(this.preMoves[j]);
            }
            this.sol = this.moveSol.length;
            this.moveSolStr = this.solutionToString();
        }
        if (depth2 !== maxDep2 - 1) { //At least one solution has been found.
            return this.probe >= this.probeMin ? 0 : 1;
        } else {
            return 1;
        }
    }

    phase1(node: CoordCube, maxl: number, lm: number): number {
        if (node.prun === 0 && maxl < 5) {
            if (this.allowShorter || maxl === 0) {
                this.depth1 -= maxl;
                const ret: number = this.initPhase2Pre();
                this.depth1 += maxl;
                return ret;
            } else {
                return 1;
            }
        }
        for (let axis: number = 0; axis < 18; axis += 3) {
            if (axis === lm || axis === lm - 9) {
                continue;
            }
            for (let power: number = 0; power < 3; power++) {
                let m: number = axis + power;

                if (this.isRec && m !== this.move[this.depth1 - maxl]) {
                    continue;
                }

                let prun: number = this.nodeUD[maxl].doMovePrun(node, m);
                if (prun > maxl) {
                    break;
                } else if (prun === maxl) {
                    continue;
                }

                if (USE_CONJ_PRUN) {
                    prun = this.nodeUD[maxl].doMovePrunConj(node, m);
                    if (prun > maxl) {
                        break;
                    } else if (prun === maxl) {
                        continue;
                    }
                }
                this.move[this.depth1 - maxl] = m;
                this.valid1 = Math.min(this.valid1, this.depth1 - maxl);
                const ret1: number = this.phase1(this.nodeUD[maxl], maxl - 1, axis);
                if (ret1 === 0) {
                    return 0;
                } else if (ret1 === 2) {
                    break;
                }
            }
        }
        return 1;
    }

    appendSolMove(curMove: number): void {
        if (this.moveSol.length === 0) {
            this.moveSol.push(curMove);
            return;
        }
        const axisCur: number = ~~(curMove / 3);
        const axisLast: number = ~~(this.moveSol[this.moveSol.length - 1] / 3);
        if (axisCur === axisLast) {
            const pow1: number = (curMove % 3 + this.moveSol[this.moveSol.length - 1] % 3 + 1) % 4;
            if (pow1 === 3) {
                this.moveSol.pop();
            } else {
                this.moveSol[this.moveSol.length - 1] = axisCur * 3 + pow1;
            }
            return;
        }
        if (this.moveSol.length > 1 &&
            axisCur % 3 === axisLast % 3 &&
            axisCur === ~~(this.moveSol[this.moveSol.length - 2] / 3)) {
            const pow2: number = (curMove % 3 + this.moveSol[this.moveSol.length - 2] % 3 + 1) % 4;
            if (pow2 === 3) {
                this.moveSol[this.moveSol.length - 2] = this.moveSol[this.moveSol.length - 1];
                this.moveSol.pop();
            } else {
                this.moveSol[this.moveSol.length - 2] = axisCur * 3 + pow2;
            }
            return;
        }
        this.moveSol.push(curMove);
    }

    phase2(edge: number, esym: number, corn: number, csym: number, mid: number, maxl: number, depth: number, lm: number): number {
        if (edge === 0 && corn === 0 && mid === 0) {
            return maxl;
        }
        const moveMask: number = ckmv2bit[lm];
        for (let m: number = 0; m < 10; m++) {
            if ((moveMask >> m & 1) !== 0) {
                m += 0x42 >> m & 3;
                continue;
            }
            let midx: number = MPermMove[mid][m];
            let cornx: number = CPermMove[corn][SymMoveUD[csym][m]];
            let csymx: number = SymMult[cornx & 0xf][csym];
            cornx >>= 4;
            let edgex: number = EPermMove[edge][SymMoveUD[esym][m]];
            let esymx: number = SymMult[edgex & 0xf][esym];
            edgex >>= 4;
            let edgei: number = getPermSymInv(edgex, esymx, false);
            let corni: number = getPermSymInv(cornx, csymx, true);
            let prun: number = getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
                (edgei >> 4) * N_COMB + CCombPConj[Perm2CombP[corni >> 4] & 0xff][SymMultInv[edgei & 0xf][corni & 0xf]]);
            if (prun > maxl + 1) {
                break;
            } else if (prun >= maxl) {
                m += 0x42 >> m & 3 & (maxl - prun);
                continue;
            }
            prun = Math.max(
                getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun,
                    edgex * N_COMB + CCombPConj[Perm2CombP[cornx] & 0xff][SymMultInv[esymx][csymx]]),
                getPruningMax(MCPermPrunMax, MCPermPrun,
                    cornx * N_MPERM + MPermConj[midx][csymx])
            );
            if (prun >= maxl) {
                m += 0x42 >> m & 3 & (maxl - prun);
                continue;
            }
            const ret: number = this.phase2(edgex, esymx, cornx, csymx, midx, maxl - 1, depth + 1, m);
            if (ret >= 0) {
                this.move[depth] = ud2std[m];
                return ret;
            }
        }
        return -1;
    }

    solutionToString(): string {
        let sb: string = '';
        const urf: number = (this.verbose & INVERSE_SOLUTION) !== 0 ? (this.urfIdx + 3) % 6 : this.urfIdx;
        if (urf < 3) {
            for (let s: number = 0; s < this.moveSol.length; ++s) {
                sb += move2str[urfMove[urf][this.moveSol[s]]] + ' ';
            }
        } else {
            for (let s1: number = this.moveSol.length - 1; s1 >= 0; --s1) {
                sb += move2str[urfMove[urf][this.moveSol[s1]]] + ' ';
            }
        }
        return sb;
    }
}