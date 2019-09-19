import * as vscode from 'vscode';
import { fixMessagePrefix, parseMessage, prettyPrintMessage } from './fixProtcol';

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.registerCommand('extension.format', () => {
		const {activeTextEditor} = vscode.window;
		if (activeTextEditor) {
			const {document} = activeTextEditor;
			for (var index = 0; index < document.lineCount; ++index) {
				const line = document.lineAt(index);
				const fixMessageIndex = line.text.indexOf(fixMessagePrefix); 
				if (fixMessageIndex < 0) {
					continue;
				}
				const message = parseMessage(line.text.substr(fixMessageIndex));	
				if (!message) {
					continue;
				}
				const pretty = prettyPrintMessage(message);
				const edit = new vscode.WorkspaceEdit();
				edit.replace(document.uri, line.range, pretty);
				return vscode.workspace.applyEdit(edit);
			}
		}
    });
}
