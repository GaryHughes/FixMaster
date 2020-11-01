import * as assert from 'assert';
import * as path from 'path';
import { Orchestra } from '../../fixOrchestra';
import { NameLookup } from '../../options';

suite('FIX Orchestra Test Suite', () => {

    var orchestra = new Orchestra(path.join(__dirname, "../../../orchestrations/FIX Standard"));
   
    /*
    test('Strict field name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        const quoteRequest = orchestra.definitionOfMessage("R", FIX_4_2);
        const quote = orchestra.definitionOfMessage("S", FIX_4_4);
        orchestra.nameLookup = NameLookup.Strict;
        assert.equal("PrevClosePx", orchestra.definitionOfField(140, FIX_4_2, quoteRequest).field.name);
        assert.equal("", orchestra.definitionOfField(200, FIX_4_2, quoteRequest).field.name);
        assert.equal("MaturityMonthYear", orchestra.definitionOfField(200, FIX_4_4, quote).field.name);
        assert.equal("FIX.4.1", orchestra.definitionOfField(200, FIX_4_4, quote).field.added);
    });

    test('Promiscuous field name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        const message = orchestra.definitionOfMessage("X", FIX_4_2);
        orchestra.nameLookup = NameLookup.Promiscuous;
        assert.equal("PrevClosePx", orchestra.definitionOfField(140, FIX_4_2, message).field.name);
        assert.equal("MaturityMonthYear", orchestra.definitionOfField(200, FIX_4_2, message).field.name);
        assert.equal("MaturityMonthYear", orchestra.definitionOfField(200, FIX_4_4, message).field.name);
    });

    test('Strict message name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        orchestra.nameLookup = NameLookup.Strict;
        assert.equal("Logon", orchestra.definitionOfMessage("A", FIX_4_2).name);
        assert.equal("", orchestra.definitionOfMessage("Z", FIX_4_4).name);
        assert.equal("QuoteCancel", orchestra.definitionOfMessage("Z", FIX_4_2).name);
    });
   
    test('Promiscuous message name lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        orchestra.nameLookup = NameLookup.Promiscuous;
        assert.equal("Logon", orchestra.definitionOfMessage("A", FIX_4_2).name);
        assert.equal("QuoteCancel", orchestra.definitionOfMessage("Z", FIX_4_2).name);
        assert.equal("QuoteCancel", orchestra.definitionOfMessage("Z", FIX_4_4).name);
    });

    test('Strict value description lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        orchestra.nameLookup = NameLookup.Strict;
        assert.equal("Filled", orchestra.descriptionOfValue(39, "2", FIX_4_2));
        assert.equal("", orchestra.descriptionOfValue(39, "D", FIX_4_4));
        assert.equal("Accepted for bidding", orchestra.descriptionOfValue(39, "D", FIX_4_2));
    });
   
    test('Promiscuous value description lookup', () => {
        const FIX_4_2 = orchestra.orchestrations[0];
        const FIX_4_4 = orchestra.orchestrations[1];
        orchestra.nameLookup = NameLookup.Promiscuous;
        assert.equal("Filled", orchestra.descriptionOfValue(39, "2", FIX_4_2));
        assert.equal("Accepted for Bidding", orchestra.descriptionOfValue(39, "D", FIX_4_2));
        assert.equal("Accepted for bidding", orchestra.descriptionOfValue(39, "D", FIX_4_4));
    });

    test('Field name lookup from extension pack', () => {
        const FIX_5_0SP2 = orchestra.orchestrations.find(orchestration => orchestration.beginString === "FIX.5.0SP2");
        if (!FIX_5_0SP2) {
            assert.fail("can't find FIX version FIX.5.0SP2");
            return;
        }
        orchestra.nameLookup = NameLookup.Promiscuous;
        const message = orchestra.definitionOfMessage("R", FIX_5_0SP2);
        assert.equal("SideTradeReportingIndicator", orchestra.definitionOfField(2671, FIX_5_0SP2, message).field.name);
    });

    test('Field lookup by name', () => {
        assert.equal(59, orchestra.definitionOfField('TimeInForce').field.tag);    
    });

    test('Field lookup by name is not case sensitive', () => {
        assert.equal(59, orchestra.definitionOfField('timeinforce').field.tag);    
    });
    */

    test('Lookup removed field', () => {
        let o = orchestra.definitionOfField(20);
        //assert.equal('ExecTransType', orchestra.definitionOfField(20).field.name);
    });
  
});
