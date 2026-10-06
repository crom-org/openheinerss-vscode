# 🎼 Openheinerss para Visual Studio Code

Extensão oficial do **Openheinerss** (OpenHarness) para o Visual Studio Code, desenvolvida pela organização [crom-org](https://github.com/crom-org).

Integre e orquestre qualquer motor de agente de codificação (**Claude Code**, **OpenCode**, **Aider**, **Codex**, **AGY**, **Mock**) diretamente na barra lateral do VS Code via protocolo JSON-RPC 2.0 / STDIO.

---

## ⚡ Recursos

- **Barra Lateral Nativa com Chat**: Envie instruções, acompanhe o raciocínio em tempo real (*deliberation stream*) e veja o código gerado.
- **Alternância Instantânea de Motores**: Troque facilmente entre Claude Code, OpenCode, Aider, Codex e modelos locais (Ollama).
- **Segurança com Diálogo Nativo do VS Code**: Comandos de terminal perigosos (`rm -rf`, migrações, scripts) exibem pop-ups nativos do editor com botões `[Permitir]` e `[Negar]`.
- **Hub Centralizado de MCP**: Compartilha todas as ferramentas e servidores definidos em `.openheinerss/mcp.json`.
- **Status Bar Interativo**: Mostra o status do agente (*Pronto*, *Pensando*, *Executando Ferramenta*).

---

## 🚀 Requisitos

É necessário ter o binário do **Openheinerss** instalado no sistema:

```bash
# Instalação rápida do Openheinerss Core:
curl -fsSL https://raw.githubusercontent.com/crom-org/openheinerss/main/install.sh | bash
```

---

## ⚙️ Configurações

Acesse as configurações do VS Code (`Ctrl+,` ou `Cmd+,`) e procure por **Openheinerss**:

- `openheinerss.binaryPath`: Caminho do executável (padrão: `openheinerss`).
- `openheinerss.defaultHarness`: Motor padrão (`claude-code`, `opencode`, `aider`, `codex`, `agy`, `mock`).
- `openheinerss.defaultModel`: Nome do modelo específico.
- `openheinerss.permissionMode`: Modo de permissões (`prompt`, `auto_allow`, `deny`).

---

## 📄 Licença

Distribuído sob a licença MIT pela organização [crom-org](https://github.com/crom-org).
