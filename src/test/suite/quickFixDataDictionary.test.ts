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

  	test('Fields parse', () => {
      assert.equal(1618, dictionary.fields.length);
    });
  
    test('Value description lookup', () => {
      assert.equal("FILLED", dictionary.descriptionOfValue(39, "2"));
      assert.equal("ACCEPTED_FOR_BIDDING", dictionary.descriptionOfValue(39, "D"));
      assert.equal("ACCEPTED_FOR_BIDDING", dictionary.descriptionOfValue(39, "D"));
    });
    
    test('Message lookup', () => {
      const message = dictionary.definitionOfMessage("D");
      assert.equal("NewOrderSingle", message.name);
      assert.equal("app", message.categoryID);
    });


});