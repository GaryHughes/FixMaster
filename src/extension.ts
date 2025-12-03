import { window, ProgressLocation, ExtensionContext, commands, workspace, WorkspaceEdit, TextDocument, ViewColumn, Uri, languages, Hover, MarkdownString, Position, Range, TextEditor, TextEditorEdit } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Orchestra } from './fixOrchestra';
import { DataDictionary } from './quickFixDataDictionary';
import { fixMessagePrefix, parseMessage, prettyPrintMessage, msgTypeHeartbeat, msgTypeTestRequest, csvPrintMessage, fixFormatPrintMessage, parsePrettyPrintedMessage, Message } from './fixProtocol';
import { AdministrativeMessageBehaviour, CommandScope, EditorReuse, NameLookup } from './options';
import { definitionHtmlForField } from './html';
import { OrderBook } from './orderBook';
import { OrderReport } from './orderReport';
import { MessageField } from './definitions';

export function activate(context: ExtensionContext) {

	var orchestra: Orchestra | null = null;
	var dataDictionary: DataDictionary | null = null;
	var orderBook = new OrderBook();
	var orderBookFields: MessageField[] = [];

	const getWorkspaceFolder = () : string | undefined => {
		
		if (!workspace.workspaceFolders) {
			window.showErrorMessage("Unable to resolve ${workspaceFolder} - there are no workspaces available");
		  	return undefined;
		}

		return workspace.workspaceFolders[0].uri.path;
	}

	const resolvePathVariables = (path: string, context: string) : string | undefined => {
	
		if (path.search(/\${workspaceFolder}/g) == -1) {
			return path;
		}

		let workspaceFolder = getWorkspaceFolder();

		if (workspaceFolder == undefined) {
			window.showErrorMessage("Unable to determine ${workspaceFolder} when resolving the " + context + " path.");
			return undefined;
		}

		return path.replace(/\${workspaceFolder}/g, workspaceFolder)
	}

	const loadOrchestra = () => {
		
		const configuration = workspace.getConfiguration();
		
		var orchestraPath = configuration.get('fixmaster.orchestraPath') as string | undefined;
		
		if (!orchestraPath) {
			orchestraPath = "./orchestrations";
		}
		
		orchestraPath = resolvePathVariables(orchestraPath, "orchestra");
		
		if (orchestraPath == undefined) {
			return;
		}
		
		if (!path.isAbsolute(orchestraPath)) {
			orchestraPath = path.join(context.extensionPath, orchestraPath);
		}
		
		if (!fs.existsSync(orchestraPath)) {
			window.showErrorMessage("The orchestra path '" + orchestraPath + "' cannot be found.");
			return
		}

		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Loading the FIX orchestra...",
			cancellable: false
		}, (progress, token) => {
			return new Promise(resolve => {
				setTimeout(() => {
					try {
						orchestra = new Orchestra(orchestraPath as string);
						loadOrderBookTags();
					} catch (err) {
						window.showErrorMessage("Unable to load an orchestra from '" + orchestraPath + "' - " + err);
					}
					resolve(undefined);
				}, 0);
			});
		});
	};

	const loadDataDictionary = () => {
		
		dataDictionary = null;
		const configuration = workspace.getConfiguration();
		var path = configuration.get('fixmaster.quickFixDataDictionaryPath') as string | undefined;
		
		if (!path) {
			return;
		}
		
		path = resolvePathVariables(path, "QuickFix data dictionary");
		
		if (path == undefined) {
			return;
		}

		if (!fs.existsSync(path as string)) {
			window.showErrorMessage("The QuickFix data dictionary path '" + path + "' cannot be found.");
			return;
		}

		window.withProgress({
			location: ProgressLocation.Notification,
			title: "Loading the QuickFix data dictionary...",
			cancellable: false
		}, (progress, token) => {
			return new Promise(resolve => {
				setTimeout(async () => {
					try {
						dataDictionary = await DataDictionary.parse(path as string);
					} catch (err) {
						window.showErrorMessage("Unable to load a QuickFix data dictionary from '" + path + "' - " + err);
					}
					resolve(undefined);
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

	let getDocument = async (editorReuse:EditorReuse) : Promise<TextDocument> => {

		if (editorReuse != EditorReuse.New) {
			const document = workspace.textDocuments.find(document => { return document.languageId === 'FIX' })
			if (document) {
				if (editorReuse === EditorReuse.Replace) {
					let edit = new WorkspaceEdit();
					var firstLine = document.lineAt(0);
					var lastLine = document.lineAt(document.lineCount - 1);
					var textRange = new Range(firstLine.range.start, lastLine.range.end);
					edit.delete(document.uri, textRange)
					await workspace.applyEdit(edit);
				}
				await window.showTextDocument(document)
				return document
			}
		}

		return  await workspace.openTextDocument({ language: 'FIX' })
			.then(document => window.showTextDocument(document))
			.then(editor => editor.document);
	};

	let format = async (printer: (context: string, message:Message, orchestra:Orchestra, dataDictionary: DataDictionary | null, nestedFieldIndent: number) => string, 
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

		const sourceDocument = activeTextEditor.document;

		const configuration = workspace.getConfiguration();
		const editorReuse = EditorReuse[configuration.get("fixmaster.editorReuse") as keyof typeof EditorReuse];

		let document = await getDocument(editorReuse)
		
		let edit = new WorkspaceEdit();

		var index = 0;

		if (editorReuse === EditorReuse.Append) {
			index = document.lineCount - 1			
		}
		
		if (scope == CommandScope.Document) {
			edit.insert(document.uri, new Position(index, 0), sourceDocument.getText());
		}
		else {
			const selection = activeTextEditor.selection;
			if (selection) {
				const range = new Range(selection.start, selection.end); 	
				const text = activeTextEditor.document.getText(range);
				edit.insert(document.uri, new Position(index, 0), text);
			}
		}

		await workspace.applyEdit(edit);

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
						resolve(undefined);
						return;
					}

					const edit = new WorkspaceEdit();

					var lastLineWasAMessage = false;

					var maxIndex = document.lineCount;
					
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
					
					resolve(undefined);
				}, 0);
			});
		});
	};

	commands.registerCommand('extension.format-pretty', async () => {
		await format(prettyPrintMessage, CommandScope.Document);
	});

	commands.registerCommand('extension.format-pretty-with-order-book', async () => {
		await format(prettyPrintMessage, CommandScope.Document, orderBook);
	});

	commands.registerCommand('extension.format-csv', async () => {
		await format(csvPrintMessage, CommandScope.Document);
	});

	commands.registerCommand('extension.format-pretty-selection', async () => {
		await format(prettyPrintMessage, CommandScope.Selection);
	});

	commands.registerCommand('extension.format-pretty-selection-with-order-book', async () => {
		await format(prettyPrintMessage, CommandScope.Selection, orderBook);
	});

	commands.registerCommand('extension.format-csv-selection', async () => {
		await format(csvPrintMessage, CommandScope.Selection);
	});

	commands.registerCommand('extension.format-raw-fix', async () => {
		await formatRawFix(CommandScope.Document);
	});

	commands.registerCommand('extension.format-raw-fix-selection', async () => {
		await formatRawFix(CommandScope.Selection);
	});

	let formatRawFix = async (scope: CommandScope) => {
		if (!orchestra) {
			window.showErrorMessage('The orchestra has not been loaded - check the orchestraPath setting.');
			return;
		}

		const {activeTextEditor} = window;

		if (!activeTextEditor) {
			window.showErrorMessage('No document is open or the file is too large.');
			return;
		}

		const sourceDocument = activeTextEditor.document;
		let text: string;

		if (scope === CommandScope.Document) {
			text = sourceDocument.getText();
		} else {
			const selection = activeTextEditor.selection;
			if (!selection) {
				window.showErrorMessage('No text selected.');
				return;
			}
			const range = new Range(selection.start, selection.end);
			text = sourceDocument.getText(range);
		}

		// Parse pretty-printed messages and convert to raw FIX
		const lines = text.split('\n');
		let output = '';
		let currentMessageLines: string[] = [];
		let inMessage = false;

		for (const line of lines) {
			if (line.trim() === '{') {
				inMessage = true;
				currentMessageLines = [line];
			} else if (line.trim() === '}') {
				currentMessageLines.push(line);
				inMessage = false;

				// Parse this message block
				const messageText = currentMessageLines.join('\n');
				const message = parsePrettyPrintedMessage(messageText);

				if (message) {
					const rawFix = fixFormatPrintMessage('', message, orchestra, dataDictionary, 0);
					output += rawFix;
				}

				currentMessageLines = [];
			} else if (inMessage) {
				currentMessageLines.push(line);
			} else if (!inMessage && line.trim().length > 0) {
				// Preserve non-message lines (like headers, timestamps, etc.)
				output += line + '\n';
			}
		}

		// Create a new document with the raw FIX output
		const document = await workspace.openTextDocument({ content: output, language: 'plaintext' });
		await window.showTextDocument(document, ViewColumn.Beside);
	};

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
