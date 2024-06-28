import * as path from "path";
import * as vscode from "vscode";
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from "vscode-languageclient/node";
import * as cp from "child_process";

const mainClass = "io.github.mattidragon.jsonpatcher.server.LangServerMain";

let client: LanguageClient | null = null;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("JsonPatcher Language Server");
	context.subscriptions.push(vscode.commands.registerCommand("jsonpatch.restart_server", () => {
		restart();
	}));
	restart();
}

async function restart() {
	const config = vscode.workspace.getConfiguration("jsonpatcher");
	if (client) {
		await client.stop();
		// Wait to make sure port gets freed
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	if (!config.get("server.enabled", true)) {
		client = null;
		return;
	}

	const { JAVA_HOME } = process.env;
	const homeJava: string | null = JAVA_HOME ? path.join(JAVA_HOME, "bin", "java") : null;
	const javaExecutable: string | null = config.get("java.location") || homeJava;

	const versionError = validateJava(javaExecutable);
	if (versionError !== null) {
		vscode.window.showErrorMessage("JsonPatcher failed to find a suitable java installation:\n" + versionError, "Open Settings", "Retry").then(option => {
			if (option === "Open Settings") {
				vscode.commands.executeCommand("workbench.action.openSettings", "jsonpatcher.java.location");
			} else if (option === "Retry") {
				restart();
			}
		});
		return;
	}

	let classPath: string = config.get("server.location") || path.join(__dirname, "..", "server", "server.jar");
	const args: string[] = ["-cp", classPath, ...(config.get<string[]>("java.options", []))];

	let serverOptions: ServerOptions = {
		command: javaExecutable as string,
		args: [...args, mainClass],
		transport: {
			kind: TransportKind.socket,
			port: config.get("server.port") || 18092
		},
		options: {},
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: "file", language: "jsonpatcher" }],
		synchronize: {
			configurationSection: 'jsonpatcher'
		},
		outputChannel
	};

	client = new LanguageClient(
		"jsonpatcher",
		"JsonPatcher Language Server",
		serverOptions,
		clientOptions
	);
	await (client.start().catch(error => {
		vscode.window.showErrorMessage("JsonPatcher language server failed to start:\n" + error, "Retry").then(option => {
			if (option === "Retry") {
				restart();
			}
		});
	}));
}

function validateJava(executable: string | null): string | null {
	if (!executable) {
		return "JAVA_HOME not set and no override specified";
	}

	const result = cp.spawnSync(executable, ["-version"]);
	if (result.error) {
		if ((result.error as any).code === "ENOENT") {
			return "Unable to find java runtime";
		}
		return "Unkown error while checking runtime version: " + result.error.message;
	}


	const match = result.stderr.toString().match(/^\w+ version "((\d+)(?:\.\d+)*).*"/);
	if (match === null) {
		return "Unable to determine java runtime version";
	}
	if (parseInt(match[2]) >= 21) {
		console.log(`Found java version ${match[1]} at ${executable}`);
		return null;
	}
	return "Expected java 21 or later, found java " + match[1];
}

export function deactivate() {
	if (client) {
		client.stop();
	}
	if (outputChannel) {
		outputChannel.dispose();
	}
}
