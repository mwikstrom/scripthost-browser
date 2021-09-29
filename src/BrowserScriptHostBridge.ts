import { ScriptHostBridge } from "scripthost";
import IFRAME_CODE from "scripthost-iframe/dist/scripthost-iframe.js";

/**
 * A script host brigde that runs code inside an IFRAME element
 * @public
 */
export class BrowserScriptHostBridge implements ScriptHostBridge {
    constructor(global = window) {
        const iframe = global.document.createElement("iframe");
        iframe.sandbox.add("allow-scripts");
        iframe.srcdoc = `<html><head><script>${IFRAME_CODE};scripthostIFrame.setupIFrame();</script></head></html>`;
        global.document.body.appendChild(iframe);
    }

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    post(): void {
        throw new Error("Method not implemented.");
    }
    
    listen(): () => void {
        throw new Error("Method not implemented.");
    }
}
