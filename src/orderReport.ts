import { Repository } from './fixRepository';
import { OrderBook } from './orderBook';
import { Order } from './order';
import { Report, ColumnJustification } from './report';
import { reporters } from 'mocha';

export class OrderReport
{
    public constructor(repository: Repository, readonly orderBook: OrderBook, readonly tags: number[]) {
        this._report.addColumn("BeginString");
        this._report.addColumn("SenderCompID");
        this._report.addColumn("TargetCompID");
        this._report.addColumn("ClOrdID");
        var index = this._report.columns.length;
        for (let tag of tags) {
            let definition = repository.definitionOfField(tag);
            if (!definition) {
                throw new Error(`Unknown field tag ${tag}`);
            }
            let justification = ColumnJustification.Left;
            if (definition.field.isNumeric) {
                justification = ColumnJustification.Right;
            }
            this._report.addColumn(definition.field.name, justification);
            this._fieldIndexes.set(tag, index++);
        }
    }
    
    public toString = () : string => {

        this._report.clear();

        for (let order of this.orderBook.orders) {
            
            var values = new Array(4 + this._fieldIndexes.size).fill(null);
            
            values[0] = order.beginString; 
            values[1] = order.senderCompId;
            values[2] = order.targetCompId;
            values[3] = order.clOrdId;
            
            this._fieldIndexes.forEach((index, tag) => {
                let field = order.fields.get(tag);
                if (field) {
                    values[index] = field.value;
                }    
            });

            this._report.addRow(...values);
        }

        return this._report.toString();
    }

    private _report: Report = new Report();
    private _fieldIndexes: Map<number, number> = new Map<number, number>();
    
}