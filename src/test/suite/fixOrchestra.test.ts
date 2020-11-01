import * as assert from 'assert';
import * as path from 'path';
import { Orchestra } from '../../fixOrchestra';
import { NameLookup } from '../../options';

suite('FIX Orchestra Test Suite', () => {

    var orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations"));
 
    test('Strict field name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        assert.strictEqual("FIX.4.2", FIX_4_2.version);
        assert.strictEqual("FIX.4.4", FIX_4_4.version);
        const quoteRequest = orchestra.definitionOfMessage("R", FIX_4_2);
        const quote = orchestra.definitionOfMessage("S", FIX_4_4);
        orchestra.nameLookup = NameLookup.Strict;
        assert.strictEqual("PrevClosePx", orchestra.definitionOfField(140, FIX_4_2, quoteRequest)?.field.name);
        assert.strictEqual("", orchestra.definitionOfField(525, FIX_4_2, quoteRequest)?.field.name);
        assert.strictEqual("NestedPartyIDSource", orchestra.definitionOfField(525, FIX_4_4, quote)?.field.name);
        assert.strictEqual("FIX.4.3", orchestra.definitionOfField(525, FIX_4_4, quote)?.field.added);
    });
   
    test('Promiscuous field name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        assert.strictEqual("FIX.4.2", FIX_4_2.version);
        assert.strictEqual("FIX.4.4", FIX_4_4.version);
        const message = orchestra.definitionOfMessage("X", FIX_4_2);
        orchestra.nameLookup = NameLookup.Promiscuous;
        assert.strictEqual("PrevClosePx", orchestra.definitionOfField(140, FIX_4_2, message)?.field.name);
        assert.strictEqual("MaturityMonthYear", orchestra.definitionOfField(200, FIX_4_2, message)?.field.name);
        assert.strictEqual("MaturityMonthYear", orchestra.definitionOfField(200, FIX_4_4, message)?.field.name);
    });

    test('Strict message name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        assert.strictEqual("FIX.4.2", FIX_4_2.version);
        assert.strictEqual("FIX.4.4", FIX_4_4.version);
        orchestra.nameLookup = NameLookup.Strict;
        assert.strictEqual("Logon", orchestra.definitionOfMessage("A", FIX_4_2).name);
        assert.strictEqual("", orchestra.definitionOfMessage("AK", FIX_4_2).name);
        assert.strictEqual("Confirmation", orchestra.definitionOfMessage("AK", FIX_4_4).name);
    });
   
    test('Promiscuous message name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        assert.strictEqual("FIX.4.2", FIX_4_2.version);
        assert.strictEqual("FIX.4.4", FIX_4_4.version);
        orchestra.nameLookup = NameLookup.Promiscuous;
        assert.strictEqual("Logon", orchestra.definitionOfMessage("A", FIX_4_2).name);
        assert.strictEqual("QuoteCancel", orchestra.definitionOfMessage("Z", FIX_4_2).name);
        assert.strictEqual("QuoteCancel", orchestra.definitionOfMessage("Z", FIX_4_4).name);
    });

    test('Strict value description lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        assert.strictEqual("FIX.4.2", FIX_4_2.version);
        assert.strictEqual("FIX.4.4", FIX_4_4.version);
        orchestra.nameLookup = NameLookup.Strict;
        assert.strictEqual("PartiallyFilled", orchestra.descriptionOfValue(39, "1", FIX_4_2));
        assert.strictEqual("", orchestra.descriptionOfValue(937, "1", FIX_4_2));
        assert.strictEqual("Full", orchestra.descriptionOfValue(937, "1", FIX_4_4));
    });
   
    test('Promiscuous value description lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        assert.strictEqual("FIX.4.2", FIX_4_2.version);
        assert.strictEqual("FIX.4.4", FIX_4_4.version);
        orchestra.nameLookup = NameLookup.Promiscuous;
        assert.strictEqual("PartiallyFilled", orchestra.descriptionOfValue(39, "1", FIX_4_2));
        assert.strictEqual("Full", orchestra.descriptionOfValue(937, "1", FIX_4_2));
        assert.strictEqual("Full", orchestra.descriptionOfValue(937, "1", FIX_4_4));
    });

    test('Field name lookup from extension pack', () => {
        const FIX_5_0SP2 = orchestra.orchestrations.find(orchestration => orchestration.version === "FIX.5.0SP2");
        if (!FIX_5_0SP2) {
            assert.fail("can't find FIX version FIX.5.0SP2");
            return;
        }
        orchestra.nameLookup = NameLookup.Promiscuous;
        const message = orchestra.definitionOfMessage("R", FIX_5_0SP2);
        assert.equal("SideTradeReportingIndicator", orchestra.definitionOfField(2671, FIX_5_0SP2, message)?.field.name);
    });
    

    test('Field lookup by name', () => {
        assert.equal(59, orchestra.definitionOfField('TimeInForce')?.field.tag);    
    });

    test('Field lookup by name is not case sensitive', () => {
        assert.equal(59, orchestra.definitionOfField('timeinforce')?.field.tag);    
    });
   
    test('Lookup removed field', () => {
        assert.equal('ExecTransType', orchestra.definitionOfField(20)?.field.name);
    });

    test('symbolic name lookup', () => {
        orchestra.nameLookup = NameLookup.Promiscuous;
        assert.equal('PartiallyFilled', orchestra.symbolicNameOfValue(39, "1", undefined));
    });
   
});
