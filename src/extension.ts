import { window, ProgressLocation, ExtensionContext, commands, workspace, WorkspaceEdit, TextDocument, ViewColumn, Uri, languages, Hover, MarkdownString, Position, Range } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Orchestra } from './fixOrchestra';
import { DataDictionary } from './quickFixDataDictionary';
import { fixMessagePrefix, parseMessage, prettyPrintMessage, msgTypeHeartbeat, msgTypeTestRequest, csvPrintMessage, Message } from './fixProtocol';
import { AdministrativeMessageBehaviour, CommandScope, NameLookup } from './options';
import { definitionHtmlForField } from './html';
import { OrderBook } from './orderBook';
import { OrderReport } from './orderReport';
import { MessageField } from './definitions';

export function activate(context: ExtensionContext) {

	var orchestra: Orchestra | null = null;
	var dataDictionary: DataDictionary | null = null;
	var orderBook = new OrderBook();
	var orderBookFields: MessageField[] = [];

	const loadOrchestra = () => {

		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Loading the FIX orchestra...",
			cancellable: false
		}, (progress, token) => {
			return new Promise(resolve => {
				setTimeout(() => {
					const configuration = workspace.getConfiguration();
					var orchestraPath = configuration.get('fixmaster.orchestraPath') as string;
					if (!orchestraPath) {
						orchestraPath = "./orchestrations";
					}
					if (!path.isAbsolute(orchestraPath)) {
						orchestraPath = path.join(context.extensionPath, orchestraPath);
					}
					if (!fs.existsSync(orchestraPath)) {
						window.showErrorMessage("The orchestra path '" + orchestraPath + "' cannot be found.");
					}
					else {
						orchestra = new Orchestra(orchestraPath);
						loadOrderBookTags();
					}
					resolve();
				}, 0);
			});
		});
	};

	const loadDataDictionary = () => {
		dataDictionary = null;
		const configuration = workspace.getConfiguration();
		var path = configuration.get('fixmaster.quickFixDataDictionaryPath') as string;
		if (!path) {
			return;
		}
		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Loading the QuickFix data dictionary...",
			cancellable: false
		}, (progress, token) => {
			return new Promise(resolve => {
				setTimeout(async () => {
					if (!fs.existsSync(path)) {
						window.showErrorMessage("The QuickFix data dictionary path '" + path + "' cannot be found.");
					}
					else {
						dataDictionary = await DataDictionary.parse(path);
					}
					resolve();
				}, 0);
			});
		});	
	};

	const loadOrderBookTags = () => {
		if (!orchestra) {
			return;
		}
		const configuration = workspace.getConfiguration();
		var orderBookFieldsString = configuration.get('fixmaster.orderBookFields') as string;
		if (!orderBookFieldsString) {
			return;
		}
		orderBookFields = [];
		let fields = orderBookFieldsString.split(","); 
		for (let field of fields) {
			let definition = orchestra.definitionOfField(field);
			if (definition) {
				// The order book ins only intended to display a high level summary of the order state so we don't support repeating fields.
				if (!orderBookFields.find(field => field.field.tag === definition?.field.tag)) {
					orderBookFields.push(definition);
				}
			}
			else {
				window.showErrorMessage(`Unable to find a field with name or tag '${field}'`);
			}
		}
	};

	loadOrchestra();
	loadDataDictionary();

	workspace.onDidChangeConfiguration(evt => {
		if (evt.affectsConfiguration('fixmaster.orchestraPath')) {
			loadOrchestra();
		}
		else if (evt.affectsConfiguration('fixmaster.quickFixDataDictionaryPath')) {
			loadDataDictionary();
		}
		else if (evt.affectsConfiguration('fixmaster.orderBookFields')) {
			loadOrderBookTags();
		}
	});

	languages.registerHoverProvider(
		{ pattern: '**/*.*' }, 
		{ provideHover(document: TextDocument, position: Position) {
			const configuration = workspace.getConfiguration();
			const hoversEnabled = configuration.get("fixmaster.hoversEnabled") as boolean;
			if (!hoversEnabled) {
				return;
			}
			if (!orchestra) {
				window.showErrorMessage('The orchestra has not been loaded - check the orchestraPath setting.');
				return;
			}
			const line = document.lineAt(position);	
			const fixMessageIndex = line.text.indexOf(fixMessagePrefix); 
			if (fixMessageIndex < 0) {
				return;
			}
			const fieldSeparator = configuration.get("fixmaster.fieldSeparator") as string;
			const nestedFieldIndent = configuration.get("fixmaster.nestedFieldIndent") as number;
			const rawText = line.text.substr(fixMessageIndex);
			const message = parseMessage(rawText, orchestra, fieldSeparator);	
			if (!message) {
				return;
			}
			const start = new Position(position.line, fixMessageIndex);
			const end = new Position(position.line, fixMessageIndex + rawText.length);
			const range = new Range(start, end);
			const text = prettyPrintMessage('', message, orchestra, dataDictionary, nestedFieldIndent);
			const markdown = new MarkdownString();
			markdown.appendCodeblock(text);
			return new Hover(markdown, range);
		}
	});

	let format = (printer: (context: string, message:Message, orchestra:Orchestra, dataDictionary: DataDictionary | null, nestedFieldIndent: number) => string, 
				  scope: CommandScope,
				  orderBook: OrderBook | null = null) => {

		if (!orchestra) {
			window.showErrorMessage('The orchestra has not been loaded - check the orchestraPath setting.');
			return;
		}

		const {activeTextEditor} = window;
			
		if (!activeTextEditor) {
			window.showErrorMessage('No document is open or the file is too large.');
			return;
		}

		if (orderBook) {
			orderBook.clear();
		}

		const {document} = activeTextEditor;

		const edit = new WorkspaceEdit();

		const configuration = workspace.getConfiguration();
		const prefixPattern = configuration.get("fixmaster.prefixPattern") as string;
		const fieldSeparator = configuration.get("fixmaster.fieldSeparator") as string;
		const nestedFieldIndent = configuration.get("fixmaster.nestedFieldIndent") as number;
		const administrativeMessageBehaviour = AdministrativeMessageBehaviour[configuration.get("fixmaster.administrativeMessageBehaviour") as keyof typeof AdministrativeMessageBehaviour];

		orchestra.nameLookup = NameLookup[configuration.get('fixmaster.nameLookup') as keyof typeof NameLookup];

		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Finding and formatting FIX messages...",
			// The parsing is very fast so it doesn't appear worth supporting cancellation.
			// Almost makes the use of this API pointless but lets see how we go. Needs some
			// testing on slower machines.
			cancellable: false
		}, (progress, token) => {

			return new Promise(resolve => {

				setTimeout(() => {

					if (!orchestra) {
						// We should never get here but but the compiler complains orchestra might be undefined
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

						const message = parseMessage(line.text.substr(fixMessageIndex), orchestra, fieldSeparator);	

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
								var pretty = printer(messageContext, message, orchestra, dataDictionary, nestedFieldIndent);
								if (!lastLineWasAMessage) {
									pretty = "\n" + pretty;
									lastLineWasAMessage = true;
								}

								if (orderBook) {
									if (orderBook.process(message)) {
										let orderReport = new OrderReport(orchestra, orderBook, orderBookFields);
										pretty += "\n" + orderReport.toString() + "\n";			
									}
								}	
						
								edit.replace(document.uri, line.range, pretty);
							}
							else {
								// Leave the message in the output as is.
								lastLineWasAMessage = false;
							}
						}
						else {
							let nextLineIndex = index + 1;
							if (nextLineIndex >= document.lineCount) {
								// If we try and delete using the next line start index as the end range when we are deleting
								// the last line in the document the editor dies.
								edit.delete(document.uri, line.range.with(undefined, document.lineAt(index).range.end));
							}
							else {
								// Specifying the start of the next line as the end of the range to delete includes the newline
								// terminator. Just using the end of the current line leaves extra new lines in the output.
								edit.delete(document.uri, line.range.with(undefined, document.lineAt(nextLineIndex).range.start));
							}
						}
					}

					workspace.applyEdit(edit);
					
					resolve();
				}, 0);
			});
		});
	};

	commands.registerCommand('extension.format-pretty', () => {
		format(prettyPrintMessage, CommandScope.Document);
	});

	commands.registerCommand('extension.format-pretty-with-order-book', () => {
		format(prettyPrintMessage, CommandScope.Document, orderBook);
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
					
	commands.registerCommand('extension.show-field', async () => {

		if (!orchestra) {
			return;
		}

		const fieldTagOrName = await window.showInputBox({ prompt: "Enter a Tag or Name. e.g. 40 or OrdType" });

		if (!fieldTagOrName) {
			return;
		}

		const definition = orchestra.definitionOfField(fieldTagOrName);

		if (!definition || isNaN(definition.field.tag)) {
			window.showErrorMessage(`Can't find a field with Tag or Name '${fieldTagOrName}'`);
			return;
		}

		const panel = window.createWebviewPanel(
			'FIX Master - Field Definition',
			definition.field.tag + ' - ' + definition.field.name,
			ViewColumn.One, 
			{ 
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					Uri.file(path.join(context.extensionPath, 'css')),
					Uri.file(path.join(context.extensionPath, 'js'))
				] 
			}
		);

		var scriptPaths: Uri[] = [];
		for (const source of ['jquery.slim.min.js', 'bootstrap.bundle.min.js']) {
			scriptPaths.push(panel.webview.asWebviewUri(Uri.file(path.join(context.extensionPath, 'js', source))));
		}

		var stylesheetPaths: Uri[] = [];
		for (const source of ['repository.css', 'bootstrap.min.css']) {
			stylesheetPaths.push(panel.webview.asWebviewUri(Uri.file(path.join(context.extensionPath, 'css', source))));
		} 

		const html = definitionHtmlForField(definition, orchestra, stylesheetPaths, scriptPaths);

		if (!html) {
			return;
		}

		panel.webview.html = html;
	});
}
