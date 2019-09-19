
export const fixMessagePrefix = "8=FIX."
export const fieldDelimiter = '\x01'
export const fieldValueSeparator = '='
export const checkSumTag = 10

export class Field {

    tag : number;
    value : string;
    
    constructor(tag: number, value: string) {
        this.tag = tag;
        this.value = value;
    }
}

export class Message {

    fields : Field[]

    constructor(fields : Field[]) {
        this.fields = fields;
    }

}

export function parseMessage(text:string) {

    var fields : Field[] = [];
    
    let length = text.length;

    for (var index = 0; index < length; ++index) {

        var tag : string = ""
        var value : string = ""

        for (; index < length; ++index) {
            let token = text[index];
            if (token == fieldValueSeparator || token == fieldDelimiter) {
                ++index;
                break;
            }
            tag += token;
        }

        for (; index < length; ++index) {
            let token = text[index];
            if (token == fieldDelimiter) {
                ++index;
                break;
            }
            value += token;
        }

        let intTag = parseInt(tag);

        if (intTag == NaN) {
            continue;
        }

        let field = new Field(intTag, value);

        fields.push(field);

        if (field.tag == checkSumTag) {
            break;
        }
    }

    var message = new Message(fields);

    return message;
}

export function prettyPrintMessage(message:Message) {
    var buffer : string = ""
    var field : any
    for (var index = 0; index < message.fields.length; ++index) {
        let field = message.fields[index]
        buffer += `(${field.tag}) - ${field.value}\n` 
    }
    buffer += "\n"
    return buffer;
}