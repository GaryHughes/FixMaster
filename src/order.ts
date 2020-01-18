import * as FIX from './fixProtocol';

const identityTags: number[] = [ 
    FIX.beginStringTag, 
    FIX.senderCompIdTag, 
    FIX.targetCompIdTag, 
    FIX.clOrdIdTag 
];
export class Order {

    constructor(readonly message: FIX.Message, tags: number[]) {
        this._tags = tags.filter(tag => !identityTags.find(entry => entry === tag));     
        this.beginString = this.extractFieldAsString(FIX.beginStringTag);
        this.senderCompId = this.extractFieldAsString(FIX.senderCompIdTag);
        this.targetCompId = this.extractFieldAsString(FIX.targetCompIdTag);
        this.clOrdId = this.extractFieldAsString(FIX.clOrdIdTag);
        this.update(message);
    }

    public update(message: FIX.Message) {
        for (let tag of this._tags) {
            let field = message.fields.find(field => field.tag === tag);
            if (field) {
                this.fields.set(tag, field);
            }
        }
    }

    extractFieldAsString(tag: number) : string
    {
        let field = this.message.fields.find(field => field.tag === tag);
        if (!field) {
            throw Error("");
        }
        return field.value;
    }

    // Store the fields that comprise the order book id directly.
    public readonly beginString: string;
    public readonly senderCompId: string;
    public readonly targetCompId: string;
    public readonly clOrdId: string;
    
    // Anything else goes in the configurable property bag.
    public readonly fields: Map<number, FIX.Field> = new Map<number, FIX.Field>();

    private _tags: number[];
}