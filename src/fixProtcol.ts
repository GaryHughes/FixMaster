import * as FIX from './fixRepository';

export const fixMessagePrefix = "8=FIX.";
export const fieldDelimiter = '\x01';
export const fieldValueSeparator = '=';
export const beginStringTag = 8;
export const checkSumTag = 10;
export const msgTypeTag = 35;

export class FieldDescription {

    readonly tag: number;
    readonly value: string;
    readonly name: string;
    readonly valueDescription: string;
    
    constructor(tag: number, value: string, name: string, valueDescription: string) {
        this.tag = tag;
        this.value = value;
        this.name = name;
        this.valueDescription = valueDescription;
    }
}

export class MessageDescription {
    
    readonly msgType: string;
    readonly messageName: string;
    readonly fields: FieldDescription[];

    constructor(msgType: string, messageName: string, fields : FieldDescription[]) {
        this.msgType = msgType;
        this.messageName = messageName;
        this.fields = fields;
    }
}

export class Field {

    readonly tag: number;
    readonly value: string;
    
    constructor(tag: number, value: string) {
        this.tag = tag;
        this.value = value;
    }
}

export class Message {

    fields: Field[];

    constructor(fields : Field[]) {
        this.fields = fields;
    }

    describe(repository: FIX.Repository) {
        
        const beginString = this.fields.find(field => field.tag === beginStringTag);
        const msgType = this.fields.find(field => field.tag === msgTypeTag);
    
        // TODO - keep going if promiscuous?
        if (!beginString || !msgType) {
            const fieldDescriptions = this.fields.map(field => new FieldDescription(field.tag, field.value, "", ""));       
            return new MessageDescription("", "", fieldDescriptions);
        }

        const version = repository.versions.find(v => v.beginString === beginString.value);        

        if (!version) {
            // TODO - keep going if promiscuous?
            const fieldDescriptions = this.fields.map(field => new FieldDescription(field.tag, field.value, "", ""));      
            return new MessageDescription(msgType.value, "", fieldDescriptions);
        }

        const fieldDescriptions = this.fields.map(field => {
            const name = repository.nameOfFieldWithTag(field.tag, version);
            const valueDescription = repository.descriptionOfValue(field.tag, field.value, version);
            return new FieldDescription(field.tag, field.value, name, valueDescription);
        });

        const messageName = repository.nameOfMessageWithMsgType(msgType.value, version);

        return new MessageDescription(msgType.value, messageName, fieldDescriptions);
    }
}

export function parseMessage(text:string) {

    var fields : Field[] = [];
    
    let length = text.length;

    for (var index = 0; index < length;) {

        var tag : string = "";
        var value : string = "";

        for (; index < length; ++index) {
            let token = text[index];
            if (token === fieldValueSeparator || token === fieldDelimiter) {
                ++index;
                break;
            }
            tag += token;
        }

        for (; index < length; ++index) {
            let token = text[index];
            if (token === fieldDelimiter) {
                ++index;
                break;
            }
            value += token;
        }

        let intTag = parseInt(tag);

        if (isNaN(intTag)) {
            continue;
        }

        let field = new Field(intTag, value);

        fields.push(field);

        if (field.tag === checkSumTag) {
            break;
        }
    }

    var message = new Message(fields);

    return message;
}

export function prettyPrintMessage(message:Message, repository:FIX.Repository) {
    
    var buffer: string = "";
    var widestFieldName: number = 0;
 
    const description = message.describe(repository);

    description.fields.forEach(field => {
        if (field.name.length > widestFieldName) {
            widestFieldName = field.name.length;
        }
    });

    if (description.messageName && description.messageName.length > 0) {
        buffer += description.messageName + "\n";
    }  

    buffer += "{\n";

    description.fields.forEach(field => {
        buffer += `${field.name}`.padStart(widestFieldName, ' ') + ` (${field.tag})`.padStart(6, ' ') + ` = ${field.value}`; 
        if (field.valueDescription && field.valueDescription.length > 0) {
            buffer +=  " - " + field.valueDescription; 
        }
        buffer += "\n";
    });
    
    buffer += "}\n";
    
    return buffer;
}