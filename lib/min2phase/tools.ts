import {Cnk, fact, PermInvEdgeSym, SYM_E2C_MAGIC, SymMult} from "./constants";

export function setVal(val0: number, val: number, isEdge: boolean): number {
    return isEdge ? (val << 1 | val0 & 1) : (val | val0 & 0xf8);
}

export function getVal(val0: number, isEdge: boolean): number {
    return isEdge ? val0 >> 1 : val0 & 7;
}

export function setPruning(table: Array<number>, index: number, value: number) {
    table[index >> 3] ^= value << (index << 2); // index << 2 <=> (index & 7) << 2
}

export function getPruning(table: Array<number>, index: number): number {
    return table[index >> 3] >> (index << 2) & 0xf; // index << 2 <=> (index & 7) << 2
}

export function getPruningMax(maxValue: number, table: Array<number>, index: number): number {
    return Math.min(maxValue, table[index >> 3] >> (index << 2) & 0xf);
}

export function hasZero(val: number): boolean {
    return ((val - 0x11111111) & ~val & 0x88888888) !== 0;
}

export function ESym2CSym(idx: number): number {
    return idx ^ (SYM_E2C_MAGIC >> ((idx & 0xf) << 1) & 3);
}

export function getPermSymInv(idx: number, sym: number, isCorner: boolean): number {
    let idxi: number = PermInvEdgeSym[idx];
    if (isCorner) {
        idxi = ESym2CSym(idxi);
    }
    return idxi & 0xfff0 | SymMult[idxi & 0xf][sym];
}

export function setNPerm(arr: Array<number>, idx: number, n: number, isEdge: boolean) {
    n--;
    let val: number = 0x76543210;
    for (let i: number = 0; i < n; ++i) {
        let p: number = fact[n - i];
        let v: number = ~~(idx / p);
        idx %= p;
        v <<= 2;
        arr[i] = setVal(arr[i], val >> v & 0xf, isEdge);
        let m: number = (1 << v) - 1;
        val = (val & m) + (val >> 4 & ~m);
    }
    arr[n] = setVal(arr[n], val & 0xf, isEdge);
}

export function getNPerm(arr: Array<number>, n: number, isEdge: boolean): number {
    let idx: number = 0,
        val: number = 0x76543210;
    for (let i: number = 0; i < n - 1; ++i) {
        let v: number = getVal(arr[i], isEdge) << 2;
        idx = (n - i) * idx + (val >> v & 0xf);
        val -= 0x11111110 << v;
    }
    return idx;
}

export function setNPermFull(arr: Array<number>, idx: number, n: number, isEdge: boolean): void {
    arr[n - 1] = setVal(arr[n - 1], 0, isEdge);

    for (let i: number = n - 2; i >= 0; --i) {
        arr[i] = setVal(arr[i], idx % (n - i), isEdge);
        idx = ~~(idx / (n - i));
        for (let j: number = i + 1; j < n; ++j) {
            if (getVal(arr[j], isEdge) >= getVal(arr[i], isEdge)) {
                arr[j] = setVal(arr[j], getVal(arr[j], isEdge) + 1, isEdge);
            }
        }
    }
}

export function getNPermFull(arr: Array<number>, n: number, isEdge: boolean): number {
    let idx: number = 0;
    for (let i: number = 0; i < n; ++i) {
        idx *= n - i;
        for (let j: number = i + 1; j < n; ++j) {
            if (getVal(arr[j], isEdge) < getVal(arr[i], isEdge)) {
                ++idx;
            }
        }
    }
    return idx;
}

export function getComb(arr: Array<number>, mask: number, isEdge: boolean): number {
    let end: number = arr.length - 1;
    let idxC: number = 0,
        r: number = 4;
    for (let i = end; i >= 0; i--) {
        let perm: number = getVal(arr[i], isEdge);
        if ((perm & 0xc) === mask) {
            idxC += Cnk[i][r--];
        }
    }
    return idxC;
}

export function setComb(arr: Array<number>, idxC: number, mask: number, isEdge: boolean): void {
    let end: number = arr.length - 1;
    let r: number = 4,
        fill: number = end;
    for (let i: number = end; i >= 0; i--) {
        if (idxC >= Cnk[i][r]) {
            idxC -= Cnk[i][r--];
            arr[i] = setVal(arr[i], r | mask, isEdge);
        } else {
            if ((fill & 0xc) === mask) {
                fill -= 4;
            }
            arr[i] = setVal(arr[i], fill--, isEdge);
        }
    }
}

export function getNParity(idx: number, n: number): number {
    let p: number = 0;
    for (let i: number = n - 2; i >= 0; i--) {
        p ^= idx % (n - i);
        idx = ~~(idx / (n - i));
    }
    return p & 1;
}