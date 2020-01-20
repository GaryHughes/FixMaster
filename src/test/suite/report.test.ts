import * as assert from 'assert';
import { Report } from '../../report';

suite('Report Test Suite', () => {

    test('Basic report test', () => {

        let report = new Report();

        report.addColumn("Value");
        report.addColumn("Name");
        report.addColumn("Description");
        report.addColumn("Added");

        report.addRow("0", "New", "New", "FIX.2.7");		
        report.addRow("1", "PartiallyFilled", "Partially filled", "FIX.2.7");		
        report.addRow("2", "Filled", "Filled", "FIX.2.7");		
        report.addRow("3", "DoneForDay", "Done for day", "FIX.2.7");		
        report.addRow("4", "Canceled", "Canceled", "FIX.2.7");	

        const expected = `Value  Name             Description       Added  
―――――――――――――――――――――――――――――――――――――――――――――――――
0      New              New               FIX.2.7
1      PartiallyFilled  Partially filled  FIX.2.7
2      Filled           Filled            FIX.2.7
3      DoneForDay       Done for day      FIX.2.7
4      Canceled         Canceled          FIX.2.7
―――――――――――――――――――――――――――――――――――――――――――――――――`;

        assert.equal(expected, report.toString());
    });

});
