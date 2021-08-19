const {get333Scramble} = require("../dist/index")

describe("Screambler Test", () => {
    it('333', () => {
        const scramble = get333Scramble();
        expect(scramble).toMatch(/(U|R|L|D|B|F)/);
        expect(scramble.split(' ').filter(i => i).length).toBeGreaterThanOrEqual(15);
    });
})