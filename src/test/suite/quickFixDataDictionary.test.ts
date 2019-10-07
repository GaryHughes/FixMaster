import * as assert from 'assert';
import { before } from 'mocha';
import * as path from 'path';
import { DataDictionary } from '../../quickFixDataDictionary';
import { NameLookup } from '../../options';

suite('QuickFix XML Data Dictionary Test Suite', () => {

    var dictionary: DataDictionary;

    before(async () => {
      dictionary = await DataDictionary.parse(path.join(__dirname, '../../../src/test/suite/FIX50SP2.xml'));
    });
   
    test('Version', () => {
      assert.equal('FIX', dictionary.type);
      assert.equal(5, dictionary.major);
      assert.equal(0, dictionary.minor);
      assert.equal(2, dictionary.servicePack);
    });

  	test('Fields Parse', () => {
      assert.equal(1618, dictionary.fields.length);
    });
  
    test('Strict value description lookup', () => {
      dictionary.nameLookup = NameLookup.Strict;
      assert.equal("FILLED", dictionary.descriptionOfValue(39, "2", "FIX.5.0SP2"));
      assert.equal("", dictionary.descriptionOfValue(39, "D", "FIX.4.0"));
      assert.equal("ACCEPTED_FOR_BIDDING", dictionary.descriptionOfValue(39, "D", "FIX.5.0SP2"));
    });

    test('Promiscuous value description lookup', () => {
      dictionary.nameLookup = NameLookup.Promiscuous;
      assert.equal("FILLED", dictionary.descriptionOfValue(39, "2", "FIX.5.0SP2"));
      assert.equal("ACCEPTED_FOR_BIDDING", dictionary.descriptionOfValue(39, "D", "FIX.4.0SP2"));
      assert.equal("ACCEPTED_FOR_BIDDING", dictionary.descriptionOfValue(39, "D", "FIX.4.2SP2"));
    });
    

});