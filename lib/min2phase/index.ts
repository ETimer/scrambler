import Search from "./Search";
import {initUtil, initMoveCubes, fromScramble, initPrunTables, randomCube} from "./init";

// init
initUtil();
initMoveCubes();



export default {
    Search,
    randomCube,
    // fromScramble,
    // initFull() {
    //     initPrunTables();
    // }
};