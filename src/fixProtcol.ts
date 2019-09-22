import * as FIX from './fixRepository'

export const fixMessagePrefix = "8=FIX."
export const fieldDelimiter = '\x01'
export const fieldValueSeparator = '='
export const checkSumTag = 10
export const msgTypeTag = 35

export class Field {

    tag : number
    value : string
    name : string
    
    constructor(tag : number, value : string) {
        this.tag = tag
        this.value = value
        this.name = ""
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

    for (var index = 0; index < length;) {

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

        if (isNaN(intTag)) {
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

export function prettyPrintMessage(message:Message, repository:FIX.Repository) {
    
    var buffer : string = ""
    var field : any
    var widestFieldName : number = 0
    var msgType : null;

    message.fields.forEach(field => {
        field.name = repository.nameOfFieldWithTag(field.tag)
        if (field.name.length > widestFieldName) {
            widestFieldName = field.name.length
        }
        if (field.tag == msgTypeTag) {
            msgType = field.value;
        }
    });

    if (msgType != null) {
        let message = repository.messageWithMsgType(msgType);
        buffer += message.name + "\n";
    }

    buffer += "{\n";

    message.fields.forEach(field => {
        buffer += `${field.name}`.padStart(widestFieldName, ' ') + ` (${field.tag})`.padStart(6, ' ') + ` = ${field.value}\n` 
    });
    
    buffer += "}\n"
    
    return buffer;
}