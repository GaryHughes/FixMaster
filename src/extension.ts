import * as vscode from 'vscode';
import { fixMessagePrefix, parseMessage, prettyPrintMessage } from './fixProtcol';

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.registerCommand('extension.format', () => {
	
		const {activeTextEditor} = vscode.window;
	
		if (activeTextEditor) {
	
			const {document} = activeTextEditor;
	
			const edit = new vscode.WorkspaceEdit();

			for (var index = 0; index < document.lineCount; ++index) {
	
				const line = document.lineAt(index);
				
				// TODO - support multiple configurable prefixes 
				const fixMessageIndex = line.text.indexOf(fixMessagePrefix); 
	
				if (fixMessageIndex < 0) {
					continue;
				}
	
				// TODO - support configurable field delimiters incase messages are not raw
				const message = parseMessage(line.text.substr(fixMessageIndex));	
	
				if (!message) {
					continue;
				}
	
				const pretty = prettyPrintMessage(message);
				
				edit.replace(document.uri, line.range, pretty);
			}

			vscode.workspace.applyEdit(edit)
		}
    });
}
