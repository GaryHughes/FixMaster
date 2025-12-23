import * as assert from 'assert';
import { before } from 'mocha';
import * as path from 'path';
import { Orchestra } from '../../fixOrchestra';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

import { parseMessage, parsePrettyPrintedField, prettyPrintMessage } from '../../fixProtocol';

suite('FIX Protocol Test Suite', () => {

    before(() => {
		vscode.window.showInformationMessage('Start all tests.');
	});

	test('Parse Message', () => {
        let text = "8=FIX.4.4\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";
        let message = parseMessage(text);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(10, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("INITIATOR", message.fields[4].value);
    });

    test('Parse Message Wtih Custom Field Delimiter', () => {
        let text = "8=FIX.4.4|9=72|35=A|49=ACCEPTOR|56=INITIATOR|34=1|52=20190816-10:34:27.742|98=0|108=30|10=012|";
        let message = parseMessage(text, null, "|");
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(10, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("INITIATOR", message.fields[4].value);
    });

    test('Parse Message Wtih Wrong Field Delimiter', () => {
        let text = "8=FIX.4.4|9=72|35=A|49=ACCEPTOR|56=INITIATOR|34=1|52=20190816-10:34:27.742|98=0|108=30|10=012|";
        let message = parseMessage(text);
        assert.equal(undefined, message);
    });
  
    test('Parse FIXT.1.1 Message', () => {
        let text = "8=FIXT.1.1\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";
        let message = parseMessage(text);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(10, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("INITIATOR", message.fields[4].value);
    });

    test('isAdministrative is true for Logon', () => {
        let text = "8=FIX.4.4\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";
        let message = parseMessage(text);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(true, message.isAdministrative());
    });

    test('isAdministrative is false for NewOrderSingle', () => {
        let text = "8=FIX.4.49=14035=D49=INITIATOR56=ACCEPTOR34=228252=20190929-04:51:00.84911=5070=49100=AUTO55=WTF54=160=20190929-04:35:33.56238=1000040=159=110=129";
        let message = parseMessage(text);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(false, message.isAdministrative());
    });

    test('Parse message with a data field', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let text = "8=FIX.4.4\u00019=167\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2752\u000152=20200114-08:13:20.041\u000111=61\u000170=60\u0001100=AUTO\u000155=BHP.AX\u000154=1\u000160=20200114-08:12:59.397\u000138=10000\u000140=2\u000144=20\u000159=1\u000193=20\u000189=ABCDEF\u0001ABCDEFABC\u0001DEF\u000110=220\u0001";
        let message = parseMessage(text, orchestra);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(20, message.fields.length);
        let signature = message.fields[18];
        assert.equal('QUJDREVGAUFCQ0RFRkFCQwFERUY=', signature.value);
    });

    test('Parse pretty printed field without enumerated value', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let field = parsePrettyPrintedField("      BeginString    (8) FIX.4.4", orchestra, null);
        assert(field);
        assert.equal(8, field.tag);
        assert.equal("FIX.4.4", field.value);
    });

    test('Parse pretty printed field with a none enumerated value that looks like a pretty printed enumerated value', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let field = parsePrettyPrintedField("      BeginString    (8) 1 - Change", orchestra, null);
        assert(field);
        assert.equal(8, field.tag);
        assert.equal("1 - Change", field.value);
    });

    test('Parse pretty printed field with enumerated value that has a description', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let field = parsePrettyPrintedField("   MDUpdateAction  (279) 1 - Change", orchestra, null);
        assert(field);
        assert.equal(279, field.tag);
        assert.equal("1", field.value);
    });

    test('Parse pretty printed field with enumerated value that does not have a description', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let field = parsePrettyPrintedField("   MDUpdateAction  (279) 1", orchestra, null);
        assert(field);
        assert.equal(279, field.tag);
        assert.equal("1", field.value);
    });

});
