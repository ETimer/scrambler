import Search from "./Search";
import {initUtil, initMoveCubes, fromScramble, initPrunTables, randomCube} from "./init";

// init
initUtil();
initMoveCubes();

export default {
    // Search,
    solve(facelet) {
        return new Search().solution(facelet);
    },
    randomCube,
    // fromScramble,
    // initFull() {
    //     initPrunTables();
    // }
};