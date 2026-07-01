import { Orchestra } from './fixOrchestra';
import { OrderBook } from './orderBook';
import { Report, ColumnJustification } from './report';
import { MessageField } from './definitions';
import { Order } from './order';

export class OrderReport
{
    public constructor(readonly orchestra: Orchestra, readonly orderBook: OrderBook, readonly fields: MessageField[]) {
        this._fields = fields;
        for (const definition of this._fields) {
            let justification = ColumnJustification.Left;
            if (definition.field.isNumeric) {
                justification = ColumnJustification.Right;
            }
            this._report.addColumn(definition.field.name, justification);
        }
    }

    public toString = () : string => {

        this._report.clear();

        for (const order of this.orderBook.orders.values()) {
            const values = new Array(this._fields.length).fill(null);
            let index = 0;
            this._fields.forEach(definition => {
                const field = order.fields[definition.field.tag];
                if (field) {
                    const pending = order.pendingFields[definition.field.tag];
                    const name = this.orchestra.symbolicNameOfValue(field.tag, field.value, undefined);
                    let value = name || field.value;
                    if (pending && pending.value !== field.value &&
                        // identity fields change with ExecutionReports and OrderCancelReplace etc but we don't need or want to
                        // see those changes.
                        !Order.isIdentityField(field.tag))
                    {
                        const pendingName = this.orchestra.symbolicNameOfValue(pending.tag, pending.value, undefined);
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