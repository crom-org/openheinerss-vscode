import * as cp from "child_process";
import * as readline from "readline";
import * as vscode from "vscode";
import { JsonRpcRequest, JsonRpcResponse, JsonRpcNotification, PermissionRequestParams } from "./protocol";

export class OpenheinerssClient {
  private process: cp.ChildProcessWithoutNullStreams | null = null;
  private reqIdCounter = 1;
  private pendingRequests = new Map<string | number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private onNotificationEmitter = new vscode.EventEmitter<JsonRpcNotification>();
  public readonly onNotification = this.onNotificationEmitter.event;

  constructor(private binaryPath: string, private cwd: string) {}

  public async start(): Promise<void> {
    if (this.process) {
      return;
    }

    try {
      this.process = cp.spawn(this.binaryPath, ["serve", "--stdio"], {
        cwd: this.cwd,
        env: { ...process.env },
      });
    } catch (err: any) {
      throw new Error(`Falha ao iniciar Openheinerss (${this.binaryPath}): ${err.message}`);
    }

    this.process.on("error", (err) => {
      vscode.window.showErrorMessage(`Erro no processo Openheinerss: ${err.message}`);
      this.stop();
    });

    this.process.on("exit", (code) => {
      this.process = null;
    });

    const rl = readline.createInterface({ input: this.process.stdout });
    rl.on("line", (line) => {
      if (!line.trim()) {
        return;
      }
      try {
        const msg = JSON.parse(line);
        if ("id" in msg && msg.id !== null) {
          // Resposta JSON-RPC
          const pending = this.pendingRequests.get(msg.id);
          if (pending) {
            this.pendingRequests.delete(msg.id);
            if (msg.error) {
              pending.reject(new Error(msg.error.message || "Erro RPC"));
            } else {
              pending.resolve(msg.result);
            }
          }
        } else if ("method" in msg) {
          // Notificação de evento streaming
          this.handleNotification(msg as JsonRpcNotification);
        }
      } catch (e) {
        console.error("Falha ao analisar mensagem do Openheinerss:", line, e);
      }
    });
  }

  private async handleNotification(notif: JsonRpcNotification): Promise<void> {
    // Interceptação de permissões com diálogo nativo do VS Code
    if (notif.method === "agent.permission_request") {
      const params = notif.params as PermissionRequestParams;
      const cmdText = params.command || params.tool;
      const choice = await vscode.window.showWarningMessage(
        `🛡️ [Openheinerss] O agente deseja executar: ${cmdText}\nMotivo: ${params.reason || "Operação necessária"}`,
        { modal: params.severity === "high" },
        "Permitir",
        "Negar"
      );

      const allow = choice === "Permitir";
      await this.sendRequest("session.permission_respond", {
        sessionId: params.sessionId,
        requestId: params.requestId,
        allow,
      });
    }

    this.onNotificationEmitter.fire(notif);
  }

  public async sendRequest<T = any>(method: string, params: any = {}): Promise<T> {
    if (!this.process || !this.process.stdin.writable) {
      await this.start();
    }

    const id = this.reqIdCounter++;
    const req: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process!.stdin.write(JSON.stringify(req) + "\n");
    });
  }

  public stop(): void {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = null;
    }
  }
}
