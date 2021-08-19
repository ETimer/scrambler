import min2phase from "./min2phase/index"

export default {
    get333Scramble() {
        return min2phase.solve(min2phase.randomCube())
    }
};