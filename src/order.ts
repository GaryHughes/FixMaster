import * as FIX from './fixProtocol';
import * as clone from 'clone';

export class Order {

    constructor(readonly message: FIX.Message) {
        this.beginString = this.extractFieldAsString(FIX.beginStringTag);
        this.senderCompId = this.extractFieldAsString(FIX.senderCompIdTag);
        this.targetCompId = this.extractFieldAsString(FIX.targetCompIdTag);
        this.clOrdId = this.extractFieldAsString(FIX.clOrdIdTag);
        this.origClOrdId = this.extractFieldAsString(FIX.origClOrdIdTag);
        this.update(message);
    }

    public update(message: FIX.Message) {
        this.previousFields = this.fields;
        this.fields = {};
        for (const tag in this.previousFields) {
            this.fields[tag] = this.previousFields[tag];
        }
        message.fields.forEach((field, _) => this.fields[field.tag] = field);
        if (message.msgType === FIX.msgTypeOrderCancelReplaceRequest) {
            this._newClOrdId = message.fields.find(field => field.tag === FIX.clOrdIdTag);
        }
       
        // This breaks the auto handling above so maybe just leave it out
        // if (message.msgType === FIX.msgTypeOrderCancelRequest) {
        //     this.fields[FIX.ordStatusTag] = new FIX.Field(FIX.ordStatusTag, FIX.ordStatusPendingCancel);
        // }
        // else if (message.msgType === FIX.msgTypeOrderCancelReplaceRequest) {
        //     this.fields[FIX.ordStatusTag] = new FIX.Field(FIX.ordStatusTag, FIX.ordStatusPendingReplace);
        // }
    }

    public rollback() {
        this.fields = this.previousFields;
        this.previousFields = {};    
    }

    extractFieldAsString(tag: number) : string {
        let field = this.message.fields.find(field => field.tag === tag);
        if (!field) {
            return "";
        }
        return field.value;
    }
  
    public replace(executionReport:FIX.Message) {
        var replacement = clone<Order>(this);
        replacement.update(executionReport);
        if (this.newClOrdId) {
            replacement.fields[FIX.clOrdIdTag] = this.newClOrdId;
            replacement.origClOrdId = replacement.clOrdId;
            replacement.clOrdId = this.newClOrdId.value;
            
        } else {
            const clOrdId = executionReport.fields.find(field => field.tag === FIX.clOrdIdTag);
            if (clOrdId) {
                replacement.fields[FIX.clOrdIdTag] = clOrdId;
                replacement.origClOrdId = replacement.clOrdId;
                replacement.clOrdId = clOrdId.value;
            }
        }
        replacement.fields[FIX.ordStatusTag] = new FIX.Field(FIX.ordStatusTag, FIX.ordStatusNew);
        this.fields[FIX.ordStatusTag] = new FIX.Field(FIX.ordStatusTag, FIX.ordStatusReplaced);
        return replacement;
    }

    // Store the fields that comprise the order book id directly.
    public readonly beginString: string;
    public readonly senderCompId: string;
    public readonly targetCompId: string;
    public clOrdId: string;
    // This isn't a part of the id but it's important for tacking cancel replace chains so track it directly.
    public origClOrdId: string;
    // This is for replaced orders. 
    // 1. When we see the OrderCancelReplaceRequest we have ClOrdId=1 and OrigClOrdID=2  
    // 2. When we get the Pending ExecutionReport   we have ClOrdId=1 and OrigClOrdID=2
    // 3. When we get the Replaced ExecutionReport  we have ClOrdId=1 and OrigClOrdID=1
    // 4. At this point we want to set the previous order to Replaced and we want to clone it
    //    and give the new order ClOrdID=2. We walk back through the order list to find this
    //    ClOrdId in newClOrdId.
    private _newClOrdId : FIX.Field | undefined;
    public get newClOrdId() : FIX.Field | undefined {
        return this._newClOrdId;
    }
   
    public fields: Record<number, FIX.Field> = {};
    previousFields: Record<number, FIX.Field> = {};
}