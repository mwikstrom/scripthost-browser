import { BrowserSandbox } from "../src";

describe("BrowserSandbox", () => {
    it("can be constructed and disposed twice", () => {
        const sandbox = new BrowserSandbox();
        expect(sandbox).toBeInstanceOf(BrowserSandbox);
        sandbox.dispose();
        sandbox.dispose();
    });

    it("can evaluate basic expression", async () => {
        const sandbox = new BrowserSandbox();
        const output = new Promise(resolve => sandbox.listen(resolve));
        sandbox.post({
            type: "eval",
            messageId: "msg-123",
            script: "'foobar'.length * 2",
        });
        expect(await output).toEqual({
            type: "result",
            messageId: "sandbox-1",
            inResponseTo: "msg-123",
            result: 12,
            vars: undefined,
        });
        sandbox.dispose();
    });
});
