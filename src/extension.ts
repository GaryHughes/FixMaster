import { window, ProgressLocation, ExtensionContext, commands, workspace, WorkspaceEdit, Command } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as FIX from './fixRepository';
import * as QuickFix from './quickFixDataDictionary';
import { fixMessagePrefix, parseMessage, prettyPrintMessage, msgTypeHeartbeat, msgTypeTestRequest, csvPrintMessage, Message } from './fixProtcol';
import { AdministrativeMessageBehaviour, CommandScope, NameLookup } from './options';


export function activate(context: ExtensionContext) {

	var repository: FIX.Repository | null = null;
	var dataDictionary: QuickFix.DataDictionary | null = null;

	const loadRepository = () => {
		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Loading the FIX repository...",
			cancellable: false
		}, (progress, token) => {
			return new Promise(resolve => {
				const configuration = workspace.getConfiguration();
				var repositoryPath = configuration.get('fixmaster.repositoryPath') as string;
				
				if (!repositoryPath) {
					repositoryPath = "./repository";
				}
				
				if (!path.isAbsolute(repositoryPath)) {
					repositoryPath = path.join(context.extensionPath, repositoryPath);
				}
				
				if (!fs.existsSync(repositoryPath)) {
					window.showErrorMessage("The repository path '" + repositoryPath + "' cannot be found.");
				}
				else {
					repository = new FIX.Repository(repositoryPath, true);
				}

				resolve();
			});
		});
	};

	const loadDataDictionary = () => {
		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Loading the QuickFix data dictionary...",
			cancellable: false
		}, (progress, token) => {
			return new Promise(async resolve => {
				dataDictionary = null;
				const configuration = workspace.getConfiguration();
				var path = configuration.get('fixmaster.quickFixDataDictionaryPath') as string;
				
				if (!path) {
					return;
				}
				
				if (!fs.existsSync(path)) {
					window.showErrorMessage("The QuickFix data dictionary path '" + path + "' cannot be found.");
				}
				else {
					dataDictionary = await QuickFix.DataDictionary.parse(path);
				}

				resolve();
			});
		});	
	};

	loadRepository();
	loadDataDictionary();

	workspace.onDidChangeConfiguration(evt => {
		if (evt.affectsConfiguration('fixmaster.repositoryPath')) {
			loadRepository();
		}
		else if (evt.affectsConfiguration('fixmaster.quickFixDataDictionaryPath')) {
			loadDataDictionary();
		}
	
	});

	let format = (printer: (context: string, message:Message, repository:FIX.Repository, nestedFieldIndent: number) => string, scope: CommandScope) => {

		if (!repository) {
			window.showErrorMessage('The repository has not been loaded - check the repositoryPath setting.');
			return;
		}

		const {activeTextEditor} = window;
			
		if (!activeTextEditor) {
			window.showErrorMessage('No document is open or the file is too large.');
			return;
		}

		const {document} = activeTextEditor;

		const edit = new WorkspaceEdit();

		const configuration = workspace.getConfiguration();
		const prefixPattern = configuration.get("fixmaster.prefixPattern") as string;
		const fieldSeparator = configuration.get("fixmaster.fieldSeparator") as string;
		const nestedFieldIndent = configuration.get("fixmaster.nestedFieldIndent") as number;
		const administrativeMessageBehaviour = AdministrativeMessageBehaviour[configuration.get("fixmaster.administrativeMessageBehaviour") as keyof typeof AdministrativeMessageBehaviour];

		repository.nameLookup = NameLookup[configuration.get('fixmaster.nameLookup') as keyof typeof NameLookup];

		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Finding and formatting FIX messages...",
			// The parsing is very fast so it doesn't appear worth supporting cancellation.
			// Almost makes the use of this API pointless but lets see how we go. Needs some
			// testing on slower machines.
			cancellable: false
		}, (progress, token) => {

			return new Promise(resolve => {

				if (!repository) {
					// We should never get here but but the compiler complains repository migth be undefined
					// in the call to printer below.
					resolve();
					return;
				}

				var lastLineWasAMessage = false;

				var index = 0;
				var maxIndex = document.lineCount;
				
				if (scope === CommandScope.Selection) {
					if (activeTextEditor.selection) {
						index = activeTextEditor.selection.start.line;
						maxIndex = activeTextEditor.selection.end.line + 1;
					}
				}

				for (; index < maxIndex; ++index) {

					const line = document.lineAt(index);
					
					const fixMessageIndex = line.text.indexOf(fixMessagePrefix); 

					if (fixMessageIndex < 0) {
						lastLineWasAMessage = false;
						continue;
					}
					
					const linePrefix = line.text.substr(0, fixMessageIndex);
					const regex = new RegExp(prefixPattern);
					let match = regex.exec(linePrefix);
					var messageContext: string = "";
					if (match) {
						messageContext = match[0];	
					}

					const message = parseMessage(line.text.substr(fixMessageIndex), fieldSeparator);	

					if (!message) {
						lastLineWasAMessage = false;
						continue;
					}

					var prettyPrint = true;
					var include = true;

					if (message.isAdministrative()) {
						if (administrativeMessageBehaviour === AdministrativeMessageBehaviour.DeleteAll) {
							include = false;
						}
						else if (administrativeMessageBehaviour === AdministrativeMessageBehaviour.DeleteHeartbeatsAndTestRequests &&
								(message.msgType === msgTypeHeartbeat || message.msgType === msgTypeTestRequest)) {
							include = false;
						}
						else if (administrativeMessageBehaviour === AdministrativeMessageBehaviour.IgnoreAll) {
							prettyPrint = false;
							continue;
						}
						else if (administrativeMessageBehaviour === AdministrativeMessageBehaviour.IgnoreHeartbeatsAndTestRequests &&
								(message.msgType === msgTypeHeartbeat || message.msgType === msgTypeTestRequest)) {
							prettyPrint = false;
							continue;
						}
					}

					if (include) {
						if (prettyPrint) {
							var pretty = printer(messageContext, message, repository, nestedFieldIndent);
							if (!lastLineWasAMessage) {
								pretty = "\n" + pretty;	
								lastLineWasAMessage = true;
							}
							edit.replace(document.uri, line.range, pretty);
						}
						else {
							// Leave the message in the output as is.
							lastLineWasAMessage = false;
						}
					}
					else {
						edit.delete(document.uri, line.range.with(undefined, document.lineAt(index + 1).range.start));
					}
				}

				workspace.applyEdit(edit);
				
				resolve();
			});
		});
	};

	commands.registerCommand('extension.format-pretty', () => {
		format(prettyPrintMessage, CommandScope.Document);
	});

	commands.registerCommand('extension.format-csv', () => {
		format(csvPrintMessage, CommandScope.Document);
	});

	commands.registerCommand('extension.format-pretty-selection', () => {
		format(prettyPrintMessage, CommandScope.Selection);
	});

	commands.registerCommand('extension.format-csv-selection', () => {
		format(csvPrintMessage, CommandScope.Selection);
	});

	commands.registerCommand('extension.show-message', async () => {

		const input = await window.showInputBox({ prompt: "Enter a MsgType or Name. e.g. D or NewOrderSingle" });

		if (input) {
						
		}

	});
}
