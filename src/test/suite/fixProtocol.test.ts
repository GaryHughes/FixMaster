import * as assert from 'assert';
import { before } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

import { fixMessagePrefix, parseMessage, prettyPrintMessage } from '../../fixProtcol';

suite('FIX Protocol Test Suite', () => {

    before(() => {
		vscode.window.showInformationMessage('Start all tests.');
	});

	test('Parse Message', () => {
        let text = "8=FIX.4.4\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";
        let message = parseMessage(text, undefined);
        assert.equal(10, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("INITIATOR", message.fields[4].value);
    });

    test('Parse Message Wtih Custom Field Delimiter', () => {
        let text = "8=FIX.4.4|9=72|35=A|49=ACCEPTOR|56=INITIATOR|34=1|52=20190816-10:34:27.742|98=0|108=30|10=012|";
        let message = parseMessage(text, "|");
        assert.equal(10, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("INITIATOR", message.fields[4].value);
    });
});
