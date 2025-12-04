import * as assert from 'assert';
import { before } from 'mocha';
import * as path from 'path';
import { Orchestra } from '../../fixOrchestra';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

import { parseMessage, fixFormatPrintMessage, parsePrettyPrintedMessage, prettyPrintMessage } from '../../fixProtocol';

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

    test('fixFormatPrintMessage outputs raw FIX format', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let text = "8=FIX.4.4\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";
        let message = parseMessage(text);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        let output = fixFormatPrintMessage("", message, orchestra, null, 0);
        // Remove the trailing newline for comparison
        output = output.trimEnd();
        assert.equal(text, output);
    });

    test('fixFormatPrintMessage with context prefix', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let text = "8=FIX.4.4\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";
        let message = parseMessage(text);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        let context = "2024-01-15 10:30:45.123";
        let output = fixFormatPrintMessage(context, message, orchestra, null, 0);
        // Check that context appears at the beginning
        assert.ok(output.startsWith(context + " "));
        // Check that the FIX message follows
        assert.ok(output.includes("8=FIX.4.4"));
    });

    test('fixFormatPrintMessage with NewOrderSingle', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let text = "8=FIX.4.4\u00019=140\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2282\u000152=20190929-04:51:00.849\u000111=50\u000170=49\u0001100=AUTO\u000155=WTF\u000154=1\u000160=20190929-04:35:33.562\u000138=10000\u000140=1\u000159=1\u000110=129\u0001";
        let message = parseMessage(text);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        let output = fixFormatPrintMessage("", message, orchestra, null, 0);
        output = output.trimEnd();
        assert.equal(text, output);
    });

    test('fixFormatPrintMessage with data field decodes base64', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let originalText = "8=FIX.4.4\u00019=167\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2752\u000152=20200114-08:13:20.041\u000111=61\u000170=60\u0001100=AUTO\u000155=BHP.AX\u000154=1\u000160=20200114-08:12:59.397\u000138=10000\u000140=2\u000144=20\u000159=1\u000193=20\u000189=ABCDEF\u0001ABCDEFABC\u0001DEF\u000110=220\u0001";
        let message = parseMessage(originalText, orchestra);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        let output = fixFormatPrintMessage("", message, orchestra, null, 0);
        output = output.trimEnd();
        // The output should match the original since data fields are decoded from base64
        assert.equal(originalText, output);
    });

    test('fixFormatPrintMessage round-trip preserves message', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let originalText = "8=FIX.4.4\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";

        // Parse the message
        let message = parseMessage(originalText);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }

        // Convert back to FIX format
        let output = fixFormatPrintMessage("", message, orchestra, null, 0);
        output = output.trimEnd();

        // Parse again
        let reparsed = parseMessage(output);
        if (!reparsed) {
            assert.fail("reparsed message failed to parse");
            return;
        }

        // Check that field counts match
        assert.equal(message.fields.length, reparsed.fields.length);

        // Check that all field values match
        for (let i = 0; i < message.fields.length; i++) {
            assert.equal(message.fields[i].tag, reparsed.fields[i].tag);
            assert.equal(message.fields[i].value, reparsed.fields[i].value);
        }
    });

    test('parsePrettyPrintedMessage parses basic message', () => {
        let prettyText = `Logon
{
    BeginString (8) FIX.4.4
    BodyLength (9) 72
       MsgType (35) A
  SenderCompID (49) ACCEPTOR
  TargetCompID (56) INITIATOR
     MsgSeqNum (34) 1
   SendingTime (52) 20190816-10:34:27.742
  EncryptMethod (98) 0
 HeartBtInt (108) 30
      CheckSum (10) 012
}`;
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(10, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("FIX.4.4", message.fields[0].value);
        assert.equal(35, message.fields[2].tag);
        assert.equal("A", message.fields[2].value);
        assert.equal("A", message.msgType);
    });

    test('parsePrettyPrintedMessage handles enumerated values', () => {
        let prettyText = `NewOrderSingle
{
    BeginString (8) FIX.4.4
       MsgType (35) D - NewOrderSingle
          Side (54) 1 - Buy
       OrdType (40) 2 - Limit
}`;
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(4, message.fields.length);
        // Check that enumerated values are parsed correctly (should extract "1" from "1 - Buy")
        let sideField = message.fields.find(f => f.tag === 54);
        assert.ok(sideField);
        assert.equal("1", sideField.value);

        let ordTypeField = message.fields.find(f => f.tag === 40);
        assert.ok(ordTypeField);
        assert.equal("2", ordTypeField.value);
    });

    test('parsePrettyPrintedMessage handles NewOrderSingle', () => {
        let prettyText = `NewOrderSingle
{
    BeginString (8) FIX.4.4
       MsgType (35) D - NewOrderSingle
  SenderCompID (49) INITIATOR
  TargetCompID (56) ACCEPTOR
       ClOrdID (11) ORDER123
          Side (54) 1 - Buy
        Symbol (55) AAPL
      OrderQty (38) 100
       OrdType (40) 2 - Limit
         Price (44) 150.50
}`;
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(10, message.fields.length);
        assert.equal("D", message.msgType);

        let clOrdIdField = message.fields.find(f => f.tag === 11);
        assert.ok(clOrdIdField);
        assert.equal("ORDER123", clOrdIdField.value);

        let priceField = message.fields.find(f => f.tag === 44);
        assert.ok(priceField);
        assert.equal("150.50", priceField.value);
    });

    test('parsePrettyPrintedMessage returns null for empty input', () => {
        let prettyText = ``;
        let message = parsePrettyPrintedMessage(prettyText);
        assert.equal(null, message);
    });

    test('parsePrettyPrintedMessage returns null for no fields', () => {
        let prettyText = `NewOrderSingle
{
}`;
        let message = parsePrettyPrintedMessage(prettyText);
        assert.equal(null, message);
    });

    test('parsePrettyPrintedMessage handles message without header', () => {
        let prettyText = `{
    BeginString (8) FIX.4.4
       MsgType (35) A
}`;
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        assert.equal(2, message.fields.length);
        assert.equal("A", message.msgType);
    });

    test('parsePrettyPrintedMessage ignores non-field lines', () => {
        let prettyText = `NewOrderSingle
{
    This is a comment line
    BeginString (8) FIX.4.4
    Another comment
       MsgType (35) D - NewOrderSingle
    More comments here
          Side (54) 1 - Buy
}`;
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }
        // Should only parse lines with (tag) pattern
        assert.equal(3, message.fields.length);
        assert.equal("D", message.msgType);
    });

    test('parsePrettyPrintedMessage round-trip with prettyPrintMessage', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let originalRaw = "8=FIX.4.4\u00019=72\u000135=A\u000149=ACCEPTOR\u000156=INITIATOR\u000134=1\u000152=20190816-10:34:27.742\u000198=0\u0001108=30\u000110=012\u0001";

        // Parse raw message
        let originalMessage = parseMessage(originalRaw);
        if (!originalMessage) {
            assert.fail("original message failed to parse");
            return;
        }

        // Convert to pretty print
        let prettyText = prettyPrintMessage("", originalMessage, orchestra, null, 0);

        // Parse pretty printed back to message
        let reparsedMessage = parsePrettyPrintedMessage(prettyText);
        if (!reparsedMessage) {
            assert.fail("reparsed message failed to parse");
            return;
        }

        // Check that field counts match
        assert.equal(originalMessage.fields.length, reparsedMessage.fields.length);

        // Check that all field values match
        for (let i = 0; i < originalMessage.fields.length; i++) {
            assert.equal(originalMessage.fields[i].tag, reparsedMessage.fields[i].tag);
            assert.equal(originalMessage.fields[i].value, reparsedMessage.fields[i].value);
        }
    });

    test('parsePrettyPrintedMessage full round-trip: raw -> pretty -> parse -> raw', () => {
        let orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
        let originalRaw = "8=FIX.4.4\u00019=140\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2282\u000152=20190929-04:51:00.849\u000111=50\u000170=49\u0001100=AUTO\u000155=WTF\u000154=1\u000160=20190929-04:35:33.562\u000138=10000\u000140=1\u000159=1\u000110=129\u0001";

        // Step 1: Parse raw FIX
        let step1 = parseMessage(originalRaw);
        if (!step1) {
            assert.fail("step 1 failed");
            return;
        }

        // Step 2: Convert to pretty print
        let prettyText = prettyPrintMessage("", step1, orchestra, null, 0);

        // Step 3: Parse pretty printed
        let step3 = parsePrettyPrintedMessage(prettyText);
        if (!step3) {
            assert.fail("step 3 failed");
            return;
        }

        // Step 4: Convert back to raw FIX
        let finalRaw = fixFormatPrintMessage("", step3, orchestra, null, 0);
        finalRaw = finalRaw.trimEnd();

        // Verify: original raw should equal final raw
        assert.equal(originalRaw, finalRaw);
    });

    test('parsePrettyPrintedMessage handles fields with special characters', () => {
        let prettyText = `NewOrderSingle
{
    BeginString (8) FIX.4.4
       MsgType (35) D - NewOrderSingle
        Symbol (55) ABC.XYZ
          Text (58) Test order with spaces and symbols!
}`;
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse");
            return;
        }

        let symbolField = message.fields.find(f => f.tag === 55);
        assert.ok(symbolField);
        assert.equal("ABC.XYZ", symbolField.value);

        let textField = message.fields.find(f => f.tag === 58);
        assert.ok(textField);
        assert.equal("Test order with spaces and symbols!", textField.value);
    });

    test('parsePrettyPrintedMessage normalizes Windows line endings (CRLF)', () => {
        // Use \r\n (Windows) line endings
        let prettyText = "NewOrderSingle\r\n{\r\n    BeginString (8) FIX.4.4\r\n       MsgType (35) D - NewOrderSingle\r\n          Side (54) 1 - Buy\r\n}";
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse with Windows line endings");
            return;
        }
        assert.equal(3, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("FIX.4.4", message.fields[0].value);
        assert.equal(35, message.fields[1].tag);
        assert.equal("D", message.fields[1].value);
        assert.equal(54, message.fields[2].tag);
        assert.equal("1", message.fields[2].value);
        assert.equal("D", message.msgType);
    });

    test('parsePrettyPrintedMessage normalizes old Mac line endings (CR)', () => {
        // Use \r (old Mac) line endings
        let prettyText = "NewOrderSingle\r{\r    BeginString (8) FIX.4.4\r       MsgType (35) D - NewOrderSingle\r          Side (54) 1 - Buy\r}";
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse with old Mac line endings");
            return;
        }
        assert.equal(3, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("FIX.4.4", message.fields[0].value);
        assert.equal(35, message.fields[1].tag);
        assert.equal("D", message.fields[1].value);
        assert.equal(54, message.fields[2].tag);
        assert.equal("1", message.fields[2].value);
        assert.equal("D", message.msgType);
    });

    test('parsePrettyPrintedMessage normalizes mixed line endings', () => {
        // Mix of \r\n (Windows), \r (old Mac), and \n (Unix)
        let prettyText = "NewOrderSingle\r\n{\r    BeginString (8) FIX.4.4\n       MsgType (35) D - NewOrderSingle\r\n          Side (54) 1 - Buy\r}";
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse with mixed line endings");
            return;
        }
        assert.equal(3, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("FIX.4.4", message.fields[0].value);
        assert.equal(35, message.fields[1].tag);
        assert.equal("D", message.fields[1].value);
        assert.equal(54, message.fields[2].tag);
        assert.equal("1", message.fields[2].value);
        assert.equal("D", message.msgType);
    });

    test('parsePrettyPrintedMessage with Windows line endings round-trip', () => {
        // Verify Windows line endings work with full message parsing
        let prettyText = "Logon\r\n{\r\n    BeginString (8) FIX.4.4\r\n    BodyLength (9) 72\r\n       MsgType (35) A\r\n  SenderCompID (49) ACCEPTOR\r\n  TargetCompID (56) INITIATOR\r\n     MsgSeqNum (34) 1\r\n   SendingTime (52) 20190816-10:34:27.742\r\n  EncryptMethod (98) 0\r\n HeartBtInt (108) 30\r\n      CheckSum (10) 012\r\n}";
        let message = parsePrettyPrintedMessage(prettyText);
        if (!message) {
            assert.fail("message failed to parse with Windows line endings");
            return;
        }
        assert.equal(10, message.fields.length);
        assert.equal(8, message.fields[0].tag);
        assert.equal("FIX.4.4", message.fields[0].value);
        assert.equal(35, message.fields[2].tag);
        assert.equal("A", message.fields[2].value);
        assert.equal("A", message.msgType);
    });
});
