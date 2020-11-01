import { Orchestra } from './fixOrchestra';
import { OrderBook } from './orderBook';
import { Report, ColumnJustification } from './report';
import { MessageField } from './definitions';
import { Order } from './order';
import * as FIX from  './fixProtocol';

export class OrderReport
{
    public constructor(readonly orchestra: Orchestra, readonly orderBook: OrderBook, readonly fields: MessageField[]) {
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
            var values = new Array(this._fields.length).fill(null);
            var index = 0;
            this._fields.forEach(definition => {
                let field = order.fields[definition.field.tag];
                if (field) {
                    let pending = order.pendingFields[definition.field.tag];
                    var name = this.orchestra.symbolicNameOfValue(field.tag, field.value, undefined);
                    var value = name || field.value;
                    if (pending && pending.value !== field.value &&
                        // identity fields change with ExecutionReports and OrderCancelReplace etc but we don't need or want to
                        // see those changes.
                        !Order.isIdentityField(field.tag)) 
                    {
                        var pendingName = this.orchestra.symbolicNameOfValue(pending.tag, pending.value, undefined);
                        value += ` (${pendingName || pending.value})`;
                    }
                    values[index] = value;
                }    
                ++index;
            });

            this._report.addRow(...values);
        }

        return this._report.toString();
    };

    private _report: Report = new Report();
    private _fields: MessageField[];
    
}