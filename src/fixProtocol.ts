import * as FIX from './fixOrchestra';
import * as xml from './fixOrchestraXml';
import { DataDictionary } from './quickFixDataDictionary';
import { stringify } from 'csv-stringify/sync';
import base64 = require('base-64');

export const fixMessagePrefix = "8=FIX";
export const fieldDelimiter = '\x01';
export const fieldValueSeparator = '=';

export const avgPxTag = 6;
export const beginStringTag = 8;
export const checkSumTag = 10;
export const cumQtyTag = 14;
export const msgTypeTag = 35;
export const senderCompIdTag = 49;
export const targetCompIdTag = 56;
export const clOrdIdTag = 11;
export const orderQtyTag = 38;
export const ordStatusTag = 39;
export const origClOrdIdTag = 41;
export const priceTag = 44; 
export const sideTag = 54; 
export const symbolTag = 55;
export const execTypeTag = 150; 

export const msgTypeHeartbeat = "0";
export const msgTypeTestRequest = "1";
export const msgTypeResendRequest = "2";
export const msgTypeReject = "3";
export const msgTypeSequenceReset = "4";
export const msgTypeLogout = "5";
export const msgTypeExecutionReport = "8";
export const msgTypeOrderCancelReject = "9";
export const msgTypeLogon = "A";
export const msgTypeNewOrderSingle = "D";
export const msgTypeOrderCancelRequest = "F";
export const msgTypeOrderCancelReplaceRequest = "G";

export const ordStatusNew = '0';
export const ordStatusPartiallyFilled = '1';
export const ordStatusFilled = '2';
export const ordStatusDoneForDay = '3';
export const ordStatusCanceled = '4';
export const ordStatusReplaced = '5';
export const ordStatusPendingCancel = '6';
export const ordStatusPendingReplace = 'E';

export const execTypeReplace = "5";

export enum Direction {
    Incoming,
    Outgoing
}

export class FieldDescription {
    
    constructor(readonly tag: number, 
                readonly value: string, 
                readonly name: string, 
                readonly valueDescription: string, 
                readonly required: boolean, 
                readonly indent: number,
                readonly type: string) {
        this.tag = tag;
        this.value = value;
        this.name = name;
        this.valueDescription = valueDescription;
        this.required = required;
        this.indent = indent;
        this.type = type;
    }

}

export class MessageDescription {
    
    constructor(readonly msgType: string, 
                readonly messageName: string, 
                readonly fields : FieldDescription[]) {
        this.msgType = msgType;
        this.messageName = messageName;
        this.fields = fields;
    }

}

export class Field {

    constructor(readonly tag: number, 
                readonly value: string) {
        this.tag = tag;
        this.value = value;
    }
    
}

export class Message {

    constructor(readonly msgType: string |  null, readonly fields : Field[]) {
        this.msgType = msgType;
        this.fields = fields;
    }

    describe(orchestra: FIX.Orchestra, quickFix: DataDictionary | null) {
        // TODO - This is all a bit messier than I'd like - review.
        const beginString = this.fields.find(field => field.tag === beginStringTag);
     
        var version: xml.Orchestration | undefined;

        if (beginString) {
            version = orchestra.orchestrations.find(v => v.version === beginString.value);        
        }
     
        const msgTypeField = this.fields.find(field => field.tag === msgTypeTag);
        
        if (msgTypeField && msgTypeField.value.length > 0) {
            const msgType = msgTypeField.value;
            const messageDefinition = orchestra.definitionOfMessage(msgType, version);
            const fieldDescriptions = this.fields.map(field => {
                var definition = orchestra.definitionOfField(field.tag, version, messageDefinition);
                // TODO - change this to return tag === NaN 
                if (definition?.field.description.length === 0 && quickFix) {
                    definition = quickFix.definitionOfField(field.tag, undefined, undefined);
                }
                var valueDescription = orchestra.descriptionOfValue(field.tag, field.value, version);
                if (valueDescription.length === 0 && quickFix) {
                    valueDescription = quickFix.descriptionOfValue(field.tag, field.value);
                }
                return new FieldDescription(field.tag, 
                                            field.value, 
                                            definition ? definition.field.name : "", 
                                            valueDescription, 
                                            definition ? definition.required : false,
                                            definition ? definition.indent : 0,
                                            definition ? definition.field.type : "");          
            });
            return new MessageDescription(msgType, 
                                          messageDefinition ? messageDefinition.name : "", 
                                          fieldDescriptions);
        }

        // This is a fallback, we don't have a MsgType or can't find a definition for it in the repository. Just try
        // and lookup the fields in isolation, this means we don't have required or indent properties but still better
        // than nothing.
        const fieldDescriptions = this.fields.map(field => {
            var definition = orchestra.definitionOfField(field.tag, version, undefined);
            // TODO - change this to return tag === NaN
            if (definition?.field.description.length === 0 && quickFix) {
                definition = quickFix.definitionOfField(field.tag, undefined, undefined);
            }
            const valueDescription = orchestra.descriptionOfValue(field.tag, field.value, version);
            return new FieldDescription(field.tag, 
                                        field.value, 
                                        definition ? definition.field.name : "", 
                                        valueDescription, 
                                        definition ? definition.required : false,
                                        definition ? definition.indent : 0,
                                        definition ? definition.field.type : "");
            }
        );

        return new MessageDescription("", "", fieldDescriptions);
    }


    isAdministrative() {
        switch (this.msgType) {
            case msgTypeHeartbeat:
            case msgTypeTestRequest:
            case msgTypeResendRequest:
            case msgTypeReject:
            case msgTypeSequenceReset:
            case msgTypeLogout:
            case msgTypeLogon:
                return true;

        }
        return false;
    }

    serialise() : string {
        return this.fields
            .map(field => `${field.tag}${fieldValueSeparator}${field.value}`)
            .join(fieldDelimiter);
    }
}

export function parseMessage(text: string, orchestra: FIX.Orchestra | null = null, separator: string | undefined = undefined) {

    if (!separator) {
        separator = fieldDelimiter;
    }

    var msgType = null;
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

        let intTag = parseInt(tag);

        if (isNaN(intTag)) {
            continue;
        }

        let definition = orchestra?.definitionOfField(tag);
        
        if (definition?.field.type === 'data') {
            if (fields.length === 0) {
                // We need the previous field to read the expected length
                return null;
            }    
            let length = parseInt(fields[fields.length - 1].value);
            if (isNaN(length)) {
                // Previous field is not an int so this message is malformed
                return null;
            }
            if (index + length >= text.length) {
                // Incorrect length or some of the message is missing
                return null;
            }
            value = base64.encode(text.substr(index, length));
            index += length;
            if (text[index] !== separator) {
                return null;
            }
        }
        else {

            for (; index < length; ++index) {
                let token = text[index];
                if (token === separator) {
                    ++index;
                    break;
                }
                value += token;
            }
        }

        let field = new Field(intTag, value);

        fields.push(field);

        if (field.tag === msgTypeTag) {
            msgType = field.value;
        }

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

    var message = new Message(msgType, fields);

    return message;
}

export function prettyPrintMessage(context: string, message: Message, orchestra: FIX.Orchestra, quickFix: DataDictionary | null, nestedFieldIndent: number) {
    
    var buffer: string = "";
    var widestFieldName: number = 0;
 
    const description = message.describe(orchestra, quickFix);
    
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
        buffer += `${field.name}`.padStart(widestFieldName, ' ') + ` (${field.tag})`.padStart(7, ' ');
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

export function csvPrintMessage(context: string, message: Message, orchestra: FIX.Orchestra, quickFix: DataDictionary | null, _: number) {

    var buffer: string = "";
    const description = message.describe(orchestra, quickFix);

    if (context && context.length > 0) {
        buffer += context + " ";
    }

    if (description.messageName && description.messageName.length > 0) {
        buffer += description.messageName + "\n";
    }

    buffer += "{\n";

    description.fields.forEach(field => {
        const record = {
            tag: field.tag,
            name: field.name,
            value: field.value,
            description: field.valueDescription,
            type: field.type
        };
        buffer += "  " + stringify([record]);
    });

    buffer += "}\n";

    return buffer;
}

export function parsePrettyPrintedField(text: string, orchestra: FIX.Orchestra, quickFix: DataDictionary | null): Field | null {
    //
    // BodyLength    (9) 0858
    //    MsgType   (35) X - MarketDataIncrementalRefresh
    //
  
    // First try and extract the tag in parenthesis
    const fieldPattern = /^\s*\w+\s+\((\d+)\)\s+(.+)/;

    const match = fieldPattern.exec(text);

    if (!match) {
        return null;
    }

    const tag = parseInt(match[1]);
    let value = match[2].trim();

    // If this is an enumerated field drop the description if there is one.
    if (orchestra.isFieldEnumerated(tag, undefined)) {
        let separatorIndex = value.lastIndexOf(" - ");
        if (separatorIndex >= 0) {
            value = value.substring(0, separatorIndex);
        }
    }

    return new Field(tag, value);
}

