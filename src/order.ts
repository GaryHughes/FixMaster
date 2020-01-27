import * as FIX from './fixProtocol';

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
    }

    public rollback() {
        this.fields = this.previousFields;
        this.previousFields = {};    
    }

    extractFieldAsString(tag: number) : string
    {
        let field = this.message.fields.find(field => field.tag === tag);
        if (!field) {
            return "";
        }
        return field.value;
    }

    // Store the fields that comprise the order book id directly.
    public readonly beginString: string;
    public readonly senderCompId: string;
    public readonly targetCompId: string;
    public readonly clOrdId: string;
    // This isn't a part of the id but it's important for tacking cancel replace chains so track it directly.
    public readonly origClOrdId: string;
    
    public fields: Record<number, FIX.Field> = {};
    previousFields: Record<number, FIX.Field> = {};
}