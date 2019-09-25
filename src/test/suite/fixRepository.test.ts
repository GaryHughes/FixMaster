import * as assert from 'assert';
import { before } from 'mocha';
import * as path from 'path';
import * as vscode from 'vscode';
import { Repository, NameLookup } from '../../fixRepository';

suite('FIX Repository Test Suite', () => {

    var repository = new Repository(path.join(__dirname, "../../../repository"));

    before(() => {
		vscode.window.showInformationMessage('Start all tests.');
    });

	test('Strict field name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_1 = repository.versions[1];
        repository.nameLookup = NameLookup.Strict;
        assert.equal("PrevClosePx", repository.nameOfFieldWithTag(140, FIX_4_0));
        assert.equal("", repository.nameOfFieldWithTag(200, FIX_4_0));
        assert.equal("MaturityMonthYear", repository.nameOfFieldWithTag(200, FIX_4_1));
    });

    test('Promiscuous field name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_1 = repository.versions[1];
        repository.nameLookup = NameLookup.Promiscuous;
        assert.equal("PrevClosePx", repository.nameOfFieldWithTag(140, FIX_4_0));
        assert.equal("MaturityMonthYear", repository.nameOfFieldWithTag(200, FIX_4_0));
        assert.equal("MaturityMonthYear", repository.nameOfFieldWithTag(200, FIX_4_1));
    });

    test('Strict message name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_2 = repository.versions[2];
        repository.nameLookup = NameLookup.Strict;
        assert.equal("Logon", repository.nameOfMessageWithMsgType("A", FIX_4_0));
        assert.equal("", repository.nameOfMessageWithMsgType("Z", FIX_4_0));
        assert.equal("QuoteCancel", repository.nameOfMessageWithMsgType("Z", FIX_4_2));
    });
   
    test('Promiscuous message name lookup', () => {
        const FIX_4_0 = repository.versions[0];
        const FIX_4_2 = repository.versions[2];
        repository.nameLookup = NameLookup.Promiscuous;
        assert.equal("Logon", repository.nameOfMessageWithMsgType("A", FIX_4_0));
        assert.equal("QuoteCancel", repository.nameOfMessageWithMsgType("Z", FIX_4_0));
        assert.equal("QuoteCancel", repository.nameOfMessageWithMsgType("Z", FIX_4_2));
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

});
