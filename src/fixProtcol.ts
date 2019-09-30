import * as FIX from './fixRepository';
import * as xml from './fixRepositoryXml';
import { deflate } from 'zlib';

export const fixMessagePrefix = "8=FIX";
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
    readonly required: boolean;
    readonly indent: number;
    
    constructor(tag: number, value: string, name: string, valueDescription: string, required: boolean, indent: number) {
        this.tag = tag;
        this.value = value;
        this.name = name;
        this.valueDescription = valueDescription;
        this.required = required;
        this.indent = indent;
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
        // TODO - This is all a bit messier than I'd like - review.
        const beginString = this.fields.find(field => field.tag === beginStringTag);
     
        var version: xml.Version | undefined;

        if (beginString) {
            version = repository.versions.find(v => v.beginString === beginString.value);        
        }
     
        const msgTypeField = this.fields.find(field => field.tag === msgTypeTag);
        
        if (msgTypeField && msgTypeField.value.length > 0) {
            const msgType = msgTypeField.value;
            const messageDefinition = repository.definitionOfMessage(msgType, version);
            const fieldDescriptions = this.fields.map(field => {
                const definition = repository.definitionOfField(field.tag, version, messageDefinition);
                const valueDescription = repository.descriptionOfValue(field.tag, field.value, version);
                return new FieldDescription(field.tag, 
                                            field.value, 
                                            definition ? definition.field.name : "", 
                                            valueDescription, 
                                            definition.required,
                                            definition.indent);          
            });
            return new MessageDescription(msgType, 
                                          messageDefinition ? messageDefinition.name : "", 
                                          fieldDescriptions);
        }

        // This is a fallback, we don't have a MsgType or can't find a definition for it in the repository. Just try
        // and lookup the fields in isolation, this means we don't have required or indent properties but still better
        // than nothing.
        const fieldDescriptions = this.fields.map(field => {
            const definition = repository.definitionOfField(field.tag, version, undefined);
            const valueDescription = repository.descriptionOfValue(field.tag, field.value, version);
            return new FieldDescription(field.tag, 
                                        field.value, 
                                        definition ? definition.field.name : "", 
                                        valueDescription, 
                                        definition.required,
                                        definition.indent);
        });

        return new MessageDescription("", "", fieldDescriptions);
    }
}

export function parseMessage(text: string, separator: string | undefined) {

    if (!separator) {
        separator = fieldDelimiter;
    }

    var fields: Field[] = [];
    let length = text.length;

    for (var index = 0; index < length;) {

        var tag: string = "";
        var value: string = "";

        for (; index < length; ++index) {
            let token = text[index];
            if (token === fieldValueSeparator || token === separator) {
                ++index;
                break;
            }
            tag += token;
        }

        for (; index < length; ++index) {
            let token = text[index];
            if (token === separator) {
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

    if (fields.length === 1) {
        // The most likely case for this is that we have the wrong field delimiter. We found a
        // prefix 8=FIX and correctly parsed 8 as the tag but then just read the rest of the message
        // as the value.
        return null;
    }

    var message = new Message(fields);

    return message;
}

export function prettyPrintMessage(context: string, message:Message, repository:FIX.Repository, nestedFieldIndent: number) {
    
    var buffer: string = "";
    var widestFieldName: number = 0;
 
    const description = message.describe(repository);
    
    description.fields.forEach(field => {
        if (field.name.length > widestFieldName) {
            widestFieldName = field.name.length;
        }
    });

    if (context && context.length > 0) {
        buffer += context + " ";
    }

    if (description.messageName && description.messageName.length > 0) {
        buffer += description.messageName + "\n";
    }  

    buffer += "{\n";

    description.fields.forEach(field => {
        buffer += `${field.name}`.padStart(widestFieldName, ' ') + ` (${field.tag})`.padStart(6, ' ');
        if (nestedFieldIndent) {
            buffer += "".padStart(field.indent * nestedFieldIndent, " ");
        }
        buffer += " ";
        buffer += `${field.value}`; 
        if (field.valueDescription && field.valueDescription.length > 0) {
            buffer +=  " - " + field.valueDescription; 
        }
        buffer += "\n";
    });
    
    buffer += "}\n";
    
    return buffer;
}