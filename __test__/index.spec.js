const Scrambler = require("../dist/index")

const scrambler = new Scrambler;

describe("Screambler Test", () => {
    it('333', () => {
        const scramble = scrambler.get333Scramble();
        expect(scramble).toMatch(/(U|R|L|D|B|F)/);
        expect(scramble.split(' ').filter(i => i).length).toBeGreaterThanOrEqual(15);
    });
})