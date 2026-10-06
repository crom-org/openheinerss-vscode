import * as vscode from "vscode";
import { OpenheinerssClient } from "./process";
import { ChatSidebarProvider } from "./sidebarProvider";

let client: OpenheinerssClient | null = null;
let currentSessionId: string | null = null;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("openheinerss");
  const binPath = config.get<string>("binaryPath") || "openheinerss";
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

  client = new OpenheinerssClient(binPath, cwd);

  // Status Bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "openheinerss.focusChat";
  statusBarItem.text = "$(symbol-event) Openheinerss";
  statusBarItem.tooltip = "Clique para abrir o Openheinerss Maestro";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  let currentHarness: string | null = null;

  // Sidebar Provider
  const sidebarProvider = new ChatSidebarProvider(context.extensionUri, async (text, harness, model) => {
    try {
      statusBarItem.text = "$(sync~spin) Openheinerss: Pensando...";

      const targetHarness = harness || config.get<string>("defaultHarness") || "claude-code";

      // Se não há sessão aberta ou mudou o harness, cria nova sessão
      if (!currentSessionId || currentHarness !== targetHarness) {
        const createRes = await client!.sendRequest("session.create", {
          harness: targetHarness,
          model: model || config.get<string>("defaultModel") || undefined,
          cwd: cwd,
          options: {
            permissionMode: config.get<string>("permissionMode") || "prompt",
          },
        });
        currentSessionId = createRes.sessionId;
        currentHarness = targetHarness;
      }

      await client!.sendRequest("session.prompt", {
        sessionId: currentSessionId,
        text: text,
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Erro no Openheinerss: ${err.message}`);
      statusBarItem.text = "$(alert) Openheinerss: Erro";
      sidebarProvider.postMessage({ type: "error", message: err.message });
    }
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatSidebarProvider.viewType, sidebarProvider)
  );

  // Escuta eventos streaming do Openheinerss
  client.onNotification((notif) => {
    switch (notif.method) {
      case "agent.thinking":
        sidebarProvider.postMessage({ type: "thinking", delta: notif.params.delta });
        statusBarItem.text = "$(sync~spin) Openheinerss: Deliberando...";
        break;
      case "agent.text":
        sidebarProvider.postMessage({ type: "text", delta: notif.params.delta });
        statusBarItem.text = "$(sync~spin) Openheinerss: Gerando código...";
        break;
      case "agent.tool_call":
        sidebarProvider.postMessage({
          type: "tool",
          name: notif.params.toolName,
          args: notif.params.arguments,
        });
        statusBarItem.text = `$(tools) Openheinerss: ${notif.params.toolName}`;
        break;
      case "agent.complete":
        sidebarProvider.postMessage({ type: "complete" });
        statusBarItem.text = "$(check) Openheinerss: Pronto";
        break;
      case "agent.error":
        sidebarProvider.postMessage({ type: "error", message: notif.params.message });
        statusBarItem.text = "$(alert) Openheinerss: Falha";
        break;
    }
  });

  // Comandos
  context.subscriptions.push(
    vscode.commands.registerCommand("openheinerss.doctor", async () => {
      try {
        const res = await client!.sendRequest("doctor.check", {});
        const summary = res.summary || "Ambiente validado com sucesso!";
        vscode.window.showInformationMessage(`Openheinerss Doctor: ${summary}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Falha no Doctor: ${err.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openheinerss.stop", async () => {
      if (currentSessionId && client) {
        await client.sendRequest("session.abort", { sessionId: currentSessionId });
        currentSessionId = null;
        statusBarItem.text = "$(symbol-event) Openheinerss: Parado";
        vscode.window.showInformationMessage("Sessão do agente encerrada com sucesso.");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openheinerss.selectHarness", async () => {
      const items = [
        { label: "claude-code", description: "Claude Code oficial (Anthropic Claude 3.5/3.7)" },
        { label: "opencode", description: "OpenCode Interpreter (Ollama, DeepSeek, Groq)" },
        { label: "aider", description: "Aider Pair Programming (Git auto-commit & Ollama)" },
        { label: "codex", description: "OpenAI Codex / Assistants API (o3-mini, GPT-4o)" },
        { label: "agy", description: "Google Antigravity Suite (Gemini Pro/Flash)" },
        { label: "mock", description: "Mock Engine (Testes determinísticos sem tokens)" },
      ];
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Selecione o motor de agente (Harness) para o projeto",
      });
      if (selected) {
        await config.update("defaultHarness", selected.label, vscode.ConfigurationTarget.Workspace);
        currentSessionId = null; // Reinicia a sessão com o novo harness
        vscode.window.showInformationMessage(`Motor padrão alterado para: ${selected.label}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openheinerss.focusChat", () => {
      vscode.commands.executeCommand("openheinerss.chatView.focus");
    })
  );
}

export function deactivate() {
  if (client) {
    client.stop();
    client = null;
  }
}
