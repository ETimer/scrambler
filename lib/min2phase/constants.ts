import CubieCube from "./CubieCube";

export const USE_TWIST_FLIP_PRUN: boolean = true;
export const PARTIAL_INIT_LEVEL: number = 2;

export const MAX_PRE_MOVES: number = 20;
export const TRY_INVERSE: boolean = true;
export const TRY_THREE_AXES: boolean = true;

export const USE_COMBP_PRUN: boolean = true; //USE_TWIST_FLIP_PRUN;
export const USE_CONJ_PRUN: boolean = USE_TWIST_FLIP_PRUN;
export const MIN_P1LENGTH_PRE: number = 7;
export const MAX_DEPTH2: number = 13;

export const INVERSE_SOLUTION: number = 0x2;

export const Ux1: number = 0;
export const Ux2: number = 1;
export const Ux3: number = 2;
export const Rx1: number = 3;
export const Rx2: number = 4;
export const Rx3: number = 5;
export const Fx1: number = 6;
export const Fx2: number = 7;
export const Fx3: number = 8;
export const Dx1: number = 9;
export const Dx2: number = 10;
export const Dx3: number = 11;
export const Lx1: number = 12;
export const Lx2: number = 13;
export const Lx3: number = 14;
export const Bx1: number = 15;
export const Bx2: number = 16;
export const Bx3: number = 17;

export const N_MOVES: number = 18;
export const N_MOVES2: number = 10;
export const N_FLIP: number = 2048;
export const N_FLIP_SYM: number = 336;
export const N_TWIST: number = 2187;
export const N_TWIST_SYM: number = 324;
export const N_PERM: number = 40320;
export const N_PERM_SYM: number = 2768;
export const N_MPERM: number = 24;
export const N_SLICE: number = 495;
export const N_COMB: number = USE_COMBP_PRUN ? 140 : 70;
export const P2_PARITY_MOVE: number = USE_COMBP_PRUN ? 0xA5 : 0;

export const SYM_E2C_MAGIC: number = 0x00DDDD00;
export const Cnk: Array<Array<number>> = [];
export const fact: Array<number> = [1];
export const move2str = [
    "U ", "U2", "U'", "R ", "R2", "R'", "F ", "F2", "F'",
    "D ", "D2", "D'", "L ", "L2", "L'", "B ", "B2", "B'"
];
export const ud2std: Array<number> = [Ux1, Ux2, Ux3, Rx2, Fx2, Dx1, Dx2, Dx3, Lx2, Bx2, Rx1, Rx3, Fx1, Fx3, Lx1, Lx3, Bx1, Bx3];
export const std2ud: Array<number> = [];
export const ckmv2bit: Array<number> = [];
export const urfMove: Array<Array<number>> = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    [6, 7, 8, 0, 1, 2, 3, 4, 5, 15, 16, 17, 9, 10, 11, 12, 13, 14],
    [3, 4, 5, 6, 7, 8, 0, 1, 2, 12, 13, 14, 15, 16, 17, 9, 10, 11],
    [2, 1, 0, 5, 4, 3, 8, 7, 6, 11, 10, 9, 14, 13, 12, 17, 16, 15],
    [8, 7, 6, 2, 1, 0, 5, 4, 3, 17, 16, 15, 11, 10, 9, 14, 13, 12],
    [5, 4, 3, 8, 7, 6, 2, 1, 0, 14, 13, 12, 17, 16, 15, 11, 10, 9]
];

export const cornerFacelet: Array<Array<number>> = [
    [8, 9, 20],
    [6, 18, 38],
    [0, 36, 47],
    [2, 45, 11],
    [29, 26, 15],
    [27, 44, 24],
    [33, 53, 42],
    [35, 17, 51]
];
export const edgeFacelet: Array<Array<number>> = [
    [5, 10],
    [7, 19],
    [3, 37],
    [1, 46],
    [32, 16],
    [28, 25],
    [30, 43],
    [34, 52],
    [23, 12],
    [21, 41],
    [50, 39],
    [48, 14]
];

export const moveCube: Array<CubieCube> = [];
export const SymCube: Array<CubieCube> = [];
export const SymMult: Array<Array<number>> = [];
export const SymMultInv: Array<Array<number>> = [];
export const SymMove: Array<Array<number>> = [];
export const SymMoveUD: Array<Array<number>> = [];
export const Sym8Move: Array<number> = [];
export const FlipS2R: Array<number> = [];
export const FlipR2S: Array<number> = [];
export const TwistS2R: Array<number> = [];
export const TwistR2S: Array<number> = [];
export const EPermS2R: Array<number> = [];
export const EPermR2S: Array<number> = [];
export const SymStateFlip: Array<number> = [];
export const SymStateTwist: Array<number> = [];
export const SymStatePerm: Array<number> = [];
export const FlipS2RF: Array<number> = [];
export const Perm2CombP: Array<number> = [];
export const PermInvEdgeSym: Array<number> = [];
export const UDSliceMove: Array<Array<number>> = [];
export const TwistMove: Array<Array<number>> = [];
export const FlipMove: Array<Array<number>> = [];
export const UDSliceConj: Array<Array<number>> = [];
export const UDSliceTwistPrun: Array<number> = [];
export const UDSliceFlipPrun: Array<number> = [];
export const TwistFlipPrun: Array<number> = [];

//phase2
export const CPermMove: Array<Array<number>> = [];
export const EPermMove: Array<Array<number>> = [];
export const MPermMove: Array<Array<number>> = [];
export const MPermConj: Array<Array<number>> = [];
export const CCombPMove: Array<Array<number>> = []; // = new char[N_COMB][N_MOVES2];
export const CCombPConj: Array<Array<number>> = [];
export const MCPermPrun: Array<number> = [];
export const EPermCCombPPrun: Array<number> = [];
