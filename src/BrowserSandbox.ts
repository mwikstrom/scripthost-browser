import { ScriptSandbox, ScriptValue } from "scripthost-core";
import IFRAME_CODE from "scripthost-iframe/dist/scripthost-iframe.js";

/**
 * A script host brigde that runs code inside an IFRAME element
 * @public
 */
export class BrowserSandbox implements ScriptSandbox {
    private _iframePromise: Promise<HTMLIFrameElement> | null;
    private _disposed;

    constructor() {
        this._iframePromise = null;
        this._disposed = false;
    }

    async ready(): Promise<void> {
        await this._getIFrame();
    }

    async dispose(): Promise<void> {
        if (this._iframePromise !== null) {
            (await this._iframePromise).remove();
        }
        this._iframePromise = null;
        this._disposed = true;
    }

    post(message: ScriptValue): void {
        this._getIFrame().then(
            ({contentWindow}) => {
                if (contentWindow) {
                    contentWindow.postMessage(message, "*");
                } else {
                    console.error("Cannot post message to browser sandbox, because it does not have a content window");
                }
            },
            error => console.error("Browser sandbox is not available:", error),
        );
    }
    
    listen(handler: (message: ScriptValue) => void): () => void {
        let active = true;
        let listener: ((e: MessageEvent) => void) | null = null;
        this._getIFrame().then(
            ({contentWindow}) => active && window.addEventListener("message", listener = (e: MessageEvent): void => {
                const { origin, source, data } = e;
                if (origin !== "null") {
                    console.warn(`Browser sandbox: Rejecting message with invalid origin: ${origin}`);
                } else if (!source) {
                    console.warn("Browser sandbox: Rejecting message without source");
                } else if (source !== contentWindow) {
                    console.warn("Browser sandbox: Rejecting message with invalid source");
                } else {
                    try {
                        handler(data);
                    } catch (error) {
                        console.error("Browser sandbox: Listener threw exception:", error);
                    }
                }
            }),
            error => console.error("Browser sandbox is not available:", error),
        );
        return () => {
            active = false;
            if (listener !== null) {
                window.removeEventListener("message", listener);
            }
        };
    }

    private _getIFrame(): Promise<HTMLIFrameElement> {
        if (this._iframePromise === null) {
            if (this._disposed) {
                this._iframePromise = new Promise<HTMLIFrameElement>((_, reject) => reject(new Error(
                    "Browser sandbox is disposed"
                )));
            } else {
                this._iframePromise = setupIFrame();
            }
        }
        return this._iframePromise;
    }
}

const setupIFrame = (): Promise<HTMLIFrameElement> => new Promise((resolve, reject) => {
    try {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.sandbox.add("allow-scripts");
        iframe.srcdoc = `
            <html><head><script>\n
            ${IFRAME_CODE}\n
            scripthostIFrame.setupIFrame();\n
            </script></head></html>
        `;
        document.body.appendChild(iframe);
        const timeoutId = setTimeout(
            () => reject(new Error("Browser sandbox IFRAME element did not load")),
            3000
        );
        iframe.addEventListener("load", () => {
            clearTimeout(timeoutId);
            resolve(iframe);
        });
    } catch (err) {
        reject(err);
    }
});
