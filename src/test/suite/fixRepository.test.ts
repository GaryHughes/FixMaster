import * as assert from 'assert';
import { before } from 'mocha';
import * as path from 'path';
import * as vscode from 'vscode';
import { Repository, NameLookup } from '../../fixRepository';

suite('FIX Repository Test Suite', () => {

    var repository = new Repository(path.join(__dirname, "../../../repository"), true);
   
  	test('Strict field name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_1 = repository.versions[1];
        const quoteRequest = repository.definitionOfMessage("R", FIX_4_0);
        const quote = repository.definitionOfMessage("S", FIX_4_1);
        repository.nameLookup = NameLookup.Strict;
        assert.equal("PrevClosePx", repository.definitionOfField(140, FIX_4_0, quoteRequest).field.name);
        assert.equal("", repository.definitionOfField(200, FIX_4_0, quoteRequest).field.name);
        assert.equal("MaturityMonthYear", repository.definitionOfField(200, FIX_4_1, quote).field.name);
    });

    test('Promiscuous field name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_1 = repository.versions[1];
        const message = repository.definitionOfMessage("X", FIX_4_0);
        repository.nameLookup = NameLookup.Promiscuous;
        assert.equal("PrevClosePx", repository.definitionOfField(140, FIX_4_0, message).field.name);
        assert.equal("MaturityMonthYear", repository.definitionOfField(200, FIX_4_0, message).field.name);
        assert.equal("MaturityMonthYear", repository.definitionOfField(200, FIX_4_1, message).field.name);
    });

    test('Strict message name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_2 = repository.versions[2];
        repository.nameLookup = NameLookup.Strict;
        assert.equal("Logon", repository.definitionOfMessage("A", FIX_4_0).name);
        assert.equal("", repository.definitionOfMessage("Z", FIX_4_0).name);
        assert.equal("QuoteCancel", repository.definitionOfMessage("Z", FIX_4_2).name);
    });
   
    test('Promiscuous message name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_2 = repository.versions[2];
        repository.nameLookup = NameLookup.Promiscuous;
        assert.equal("Logon", repository.definitionOfMessage("A", FIX_4_0).name);
        assert.equal("QuoteCancel", repository.definitionOfMessage("Z", FIX_4_0).name);
        assert.equal("QuoteCancel", repository.definitionOfMessage("Z", FIX_4_2).name);
    });

    test('Strict value description lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_2 = repository.versions[2];
        repository.nameLookup = NameLookup.Strict;
        assert.equal("Filled", repository.descriptionOfValue(39, "2", FIX_4_0));
        assert.equal("", repository.descriptionOfValue(39, "D", FIX_4_0));
        assert.equal("Accepted for bidding", repository.descriptionOfValue(39, "D", FIX_4_2));
    });
   
    test('Promiscuous value description lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_2 = repository.versions[2];
        repository.nameLookup = NameLookup.Promiscuous;
        assert.equal("Filled", repository.descriptionOfValue(39, "2", FIX_4_0));
        assert.equal("Accepted for Bidding", repository.descriptionOfValue(39, "D", FIX_4_0));
        assert.equal("Accepted for bidding", repository.descriptionOfValue(39, "D", FIX_4_2));
    });

    test('Field name lookup from extension pack', () => {
        const FIX_5_0SP2 = repository.versions.find(version => version.beginString === "FIX.5.0SP2");
        if (!FIX_5_0SP2) {
            assert.fail("can't find FIX version FIX.5.0SP2");
            return;
        }
        repository.nameLookup = NameLookup.Promiscuous;
        const message = repository.definitionOfMessage("R", FIX_5_0SP2);
        assert.equal("SideTradeReportingIndicator", repository.definitionOfField(2671, FIX_5_0SP2, message).field.name);
    });

});
