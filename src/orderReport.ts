import { Repository } from './fixRepository';
import { OrderBook } from './orderBook';
import { Report, ColumnJustification } from './report';
import { MessageField } from './definitions';

export class OrderReport
{
    public constructor(readonly repository: Repository, readonly orderBook: OrderBook, readonly fields: MessageField[]) {
        this._report.addColumn("BeginString");
        this._report.addColumn("SenderCompID");
        this._report.addColumn("TargetCompID");
        this._report.addColumn("ClOrdID");
        this._report.addColumn("OrigClOrdID");
        this._fields = fields;
        for (let definition of this._fields) {
            let justification = ColumnJustification.Left;
            if (definition.field.isNumeric) {
                justification = ColumnJustification.Right;
            }
            this._report.addColumn(definition.field.name, justification);
        }
    }

    public toString = () : string => {

        this._report.clear();

        for (let order of this.orderBook.orders.values()) {
            
            var values = new Array(5 + this._fields.length).fill(null);
            
            values[0] = order.beginString; 
            values[1] = order.senderCompId;
            values[2] = order.targetCompId;
            values[3] = order.clOrdId;
            values[4] = order.origClOrdId;
            
            var index = 5;
            this._fields.forEach(definition => {
                let field = order.fields[definition.field.tag];
                if (field) {
                    var name = this.repository.symbolicNameOfValue(field.tag, field.value, undefined);
                    values[index] = name || field.value;
                }    
                ++index;
            });

            this._report.addRow(...values);
        }

        return this._report.toString();
    }

    private _report: Report = new Report();
    private _fields: MessageField[];
    
}