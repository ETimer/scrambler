import min2phase from "../min2phase"

export default class Scrambler {

    get333Scramble():String {
        return new min2phase.Search()
            .solution(
                min2phase.randomCube(),
                21, 1e9, 50, 2)
    }
}