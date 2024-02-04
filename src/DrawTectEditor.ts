import * as vscode from 'vscode';
import * as fs from "fs";

import {DEV_MODE, EXTENSION_COMMANDS, PREPROCESSOR_EXPORT_FOLDER, WHITEBOARD_FOLDER} from './defines';
import { Preprocessor } from './preprocessor';

interface DT_DocumentEdit{

}



export class DT_EditorProvider implements vscode.CustomTextEditorProvider {
    
    preprocessed: boolean; 
    static viewType = 'DrawTect.draw';


    constructor(
		private readonly context: vscode.ExtensionContext
	) {
        this.preprocessed = false;
    }



    public static testCommand(): boolean{
        console.log("Test command executed");
        return true;
    }

    public static async openFileCommand(relativePath: string){
        if (!relativePath){
            console.error("No file opened");
            return;
        }

        const workspaces = vscode.workspace.workspaceFolders;
        if (!workspaces){
            console.error("No workspace opened");
            return;
        }

        const baseUri = workspaces[0].uri;
        const filePath = `${baseUri.fsPath}/${relativePath}`;

        if (!fs.existsSync(filePath)){
            console.error(`${filePath} doesn't seem to exist.`);
            return;
        }

        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
        console.log(`[DRAWTECT] File ${filePath} opened`);
        console.log("Test open command executed");
        return true;
    }




    public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new DT_EditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(DT_EditorProvider.viewType, provider);
        vscode.commands.registerCommand(EXTENSION_COMMANDS.test, this.testCommand);
        vscode.commands.registerCommand(EXTENSION_COMMANDS.open, this.openFileCommand);
        
        return providerRegistration;
	}


    resolveCustomTextEditor(document: vscode.TextDocument, 
                            webviewPanel: vscode.WebviewPanel, 
                            token: vscode.CancellationToken
    ): Thenable<void> | void{

        webviewPanel.webview.options = {
            enableScripts: true,
        };
        
        
        if (DEV_MODE && !this.preprocessed){
            const preprocessor = new Preprocessor(this.context.extensionPath, webviewPanel.webview);
            preprocessor.preprocessDir(WHITEBOARD_FOLDER);
            this.preprocessed = true;
        }
        
        webviewPanel.webview.html = this.getFileContent(
            `${this.context.extensionPath}/${PREPROCESSOR_EXPORT_FOLDER}/whiteboard.html`
        );
        
        
        vscode.workspace.onDidChangeTextDocument(e => {
            // if the document with the changes is the same as this document
            if (e.document.uri.toString() === document.uri.toString()){
                // update webview 
                const docInfo = this.getDocumentAsJson(document);

                this.sendMessageToWebview(webviewPanel.webview, "update", docInfo);
            }
        });

        // receive message from webview
        webviewPanel.webview.onDidReceiveMessage((e) => {
            this.handleMessageFromWebview(document, e);
        });

        const docInfo = this.getDocumentAsJson(document);

        this.sendMessageToWebview(webviewPanel.webview, "update", docInfo);
        

    }

    getFileContent(absPath: string): string{
        if (!fs.existsSync(absPath))
            return "";
        
        let str = fs.readFileSync(absPath, 'utf-8');
        return str;
    }


    sendMessageToWebview(webview: vscode.Webview, type: string, data: any){
        webview.postMessage({
            type: type,
            data: data 
        });
    }

    getDocumentAsJson(document: vscode.TextDocument): any {
		const text = document.getText();
		if (text.trim().length == 0) {
			return {strokes: []};
		}

		try {
			return JSON.parse(text);
		} catch {
			console.log('Content is not valid json');
            return {strokes: []};
		}
	}


    handleMessageFromWebview(document: vscode.TextDocument, event: any){
        switch (event.type){
            case "stroke-add":{
                this.docAddNewStroke(document, event.data);
                break;
            }
            case "stroke-remove":{
                console.log("Stroke removed");
                break;
            }
        }
    }

    docAddNewStroke(document: vscode.TextDocument, strokeData: any){
        const docContent = this.getDocumentAsJson(document);
        docContent.strokes.push(strokeData);

        console.log(docContent);

        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            JSON.stringify(docContent)
        );

        vscode.workspace.applyEdit(edit);
    }


}