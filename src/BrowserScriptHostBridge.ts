import { ScriptHostBridge, ScriptHostInputMessage, ScriptHostOutputMessage } from "scripthost";
import IFRAME_CODE from "scripthost-iframe/dist/scripthost-iframe.js";

/**
 * A script host brigde that runs code inside an IFRAME element
 * @public
 */
export class BrowserScriptHostBridge implements ScriptHostBridge {
    private readonly _global: typeof window;
    private readonly _iframe: HTMLIFrameElement;

    constructor(global = window) {
        const iframe = global.document.createElement("iframe");
        iframe.style.display = "none";
        iframe.sandbox.add("allow-scripts");
        iframe.srcdoc = `<html><head><script>${IFRAME_CODE};scripthostIFrame.setupIFrame();</script></head></html>`;
        global.document.body.appendChild(iframe);
        this._global = window;
        this._iframe = iframe;
    }

    dispose(): void {
        this._iframe.remove();
    }

    post(message: ScriptHostInputMessage): void {
        const { contentWindow } = this._iframe;
        if (contentWindow) {
            contentWindow.postMessage(message, "*");
        }
    }
    
    listen(handler: (message: ScriptHostOutputMessage) => void): () => void {
        const listener = (e: MessageEvent): void => {
            const { origin, source, data } = e;
            const { contentWindow } = this._iframe;
            if (origin === "null" && !!source && source === contentWindow) {
                handler(data);
            }
        };
        this._global.addEventListener("message", listener);
        return () => {
            this._global.removeEventListener("message", listener);
        };
    }
}
