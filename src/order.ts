import * as FIX from './fixProtocol';

export class Order {

    constructor(readonly message: FIX.Message) {
        this.message = message;
        this.beginString = this.stringValueForField(message, FIX.beginStringTag);
        this.senderCompId = this.stringValueForField(message, FIX.senderCompIdTag);
        this.targetCompId = this.stringValueForField(message, FIX.targetCompIdTag);
    }

    public update(message: FIX.Message) {

    }

    private stringValueForField(message: FIX.Message, tag: number) {
        const field =  message.fields.find(field => field.tag === 0);
        if (field) {
            return field.value;
        }
        return "";
    }

    public readonly beginString: string | undefined;
    public readonly senderCompId: string | undefined;
    public readonly targetCompId: string | undefined;
    
}