//
// This is a single value for an enumerated field. e.g. OrdStatus.New
// 
export class Enum {
    
    constructor(readonly tag: number, 
                readonly value: string, 
                readonly symbolicName: string, 
                readonly description: string = "", 
                readonly added: string = "") {
        this.tag = tag;
        this.value = value;
        this.symbolicName = symbolicName;
        this.description = description;
        this.added = added;
    }
}

//
// This is the generic description of a field for a given FIX version.
//
export class Field {
    
    constructor(readonly tag: number, 
                readonly name: string, 
                readonly type: string, 
                readonly notReqXML: string = "", 
                readonly description: string = "", 
                readonly added: string = "") {
        this.tag = tag;
        this.name = name;
        this.type = type;
        this.notReqXML = notReqXML;
        this.description = description;
        this.added = added;
    }
}

// 
// This is the specific description of a field for a particular message.
//
export class MessageField {

    constructor(readonly field: Field, 
                readonly required: boolean, 
                readonly added: string, 
                readonly indent: number) {
        this.field = field;
        this.required = required;
        this.added = added;
        this.indent = indent;
    }

}

//
// This is the definition of a Message for a specific FIX version.
//
export class Message {
    
    constructor(readonly componentID: string, 
                readonly msgType: string, 
                readonly name: string, 
                readonly categoryID: string, 
                readonly sectionID: string, 
                readonly notReqXML: string, 
                readonly description: string, 
                readonly added: string, 
                readonly fields: MessageField[])
    {
        this.componentID = componentID;
        this.msgType = msgType;
        this.name = name;
        this.categoryID = categoryID;
        this.sectionID = sectionID;
        this.notReqXML = notReqXML;
        this.description = description;
        this.added = added;
        this.fields = fields;
    }

}
