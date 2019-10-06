import * as assert from 'assert';
import { before } from 'mocha';
import * as path from 'path';
import { DataDictionary } from '../../quickFixDataDictionary';

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
      assert.equal(1452, dictionary.fields.length);

    });

});