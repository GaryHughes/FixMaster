import * as fs from 'fs';
import * as xml2js from 'xml2js';
import * as path from 'path';

export class Enum {
    
    constructor(tag: number, value: string, symbolicName: string, description: string, added: string) {
        this.tag = tag;
        this.value = value;
        this.symbolicName = symbolicName;
        this.description = description;
        this.added = added;
    }

    readonly tag: number;
    readonly value: string;
    readonly symbolicName: string;
    readonly description: string;
    readonly added: string;
}

//
// This is the generic description of a field for a given FIX version.
//
export class Field {
    
    constructor(tag: number, name: string, type: string, notReqXML: string, description: string, added: string) {
        this.tag = tag;
        this.name = name;
        this.type = type;
        this.notReqXML = notReqXML;
        this.description = description;
        this.added = added;
    }

    readonly tag: number;
    readonly name: string;
    readonly type: string;
    readonly notReqXML: string;
    readonly description: string;
    readonly added: string;
}

// 
// This is the specific description of a field for a particular message.
//
export class MessageField {
    
}

export class Message {
    
    constructor(componentID: string, msgType: string, name: string, categoryID: string, sectionID: string, notReqXML: string, description: string, added: string)
    {
        this.componentID = componentID;
        this.msgType = msgType;
        this.name = name;
        this.categoryID = categoryID;
        this.sectionID = sectionID;
        this.notReqXML = notReqXML;
        this.description = description;
        this.added = added;
    }

    readonly componentID: string;
    readonly msgType: string;
    readonly name: string;
    readonly categoryID: string;
    readonly sectionID: string;
    readonly notReqXML: string;
    readonly description: string;
    readonly added: string;
} 

export class Version {

    loadEnums(versionPath: string) {
    
        let enumsPath = path.join(versionPath, "Enums.xml");
        let buffer = fs.readFileSync(enumsPath);
        let parser = new xml2js.Parser();
        var enums: Enum[] = [];
    
        parser.parseString(buffer, function (err:any, result:any) {
            result.Enums.Enum.forEach((element:any) => {
                    enums.push(
                        new Enum(
                            element.Tag[0], 
                            element.Value[0],
                            element.SymbolicName[0], 
                            element.Description[0], 
                            element.Added ? element.Added[0] : "" 
                        )
                    );
                }
            );
        });

        return enums;
    }

    loadMessages(versionPath: string) {

        let messagesPath = path.join(versionPath, "Messages.xml");
        let buffer = fs.readFileSync(messagesPath);
        let parser = new xml2js.Parser();
        var messages: Message[] = [];
    
        parser.parseString(buffer, function (err:any, result:any) {
            result.Messages.Message.forEach((element:any) => {
                    messages.push(
                        new Message(
                            element.ComponentID[0], 
                            element.MsgType[0],
                            element.Name[0], 
                            element.CategoryID[0], 
                            element.SectionID[0],
                            element.NotReqXML[0],
                            element.Description[0], 
                            element.Added ? element.Added[0] : "" 
                        )
                    );
                }
            );
        });

        return messages;
    }

    loadFields(versionPath: string) {

        let fieldsPath = path.join(versionPath, "Fields.xml");
        let buffer = fs.readFileSync(fieldsPath);
        let parser = new xml2js.Parser();
        var fields: Field[] = [];
    
        // Field tags are 1 based and there are gaps in the sequence, we want to be able to
        // do constant time lookup using the tag value so insert dummies where required.
        var index: number = -1;

        parser.parseString(buffer, function (err:any, result:any) {
            result.Fields.Field.forEach((element:any) => {
                    let tag = element.Tag[0];
                    while (index < tag - 1) {
                        // TODO - what is the canonical way of handling a null object?
                        //        maybe one static object?
                        fields.push(new Field(0, "", "", "", "", ""));
                        ++index;
                    }
                    ++index;
                    fields.push(
                        new Field(
                            element.Tag[0], 
                            element.Name[0],
                            element.Type[0], 
                            element.NotReqXML[0], 
                            element.Description[0], 
                            element.Added ? element.Added[0] : "" 
                        )
                    );
                }
            );
        });

        return fields;
    }

    constructor(repositoryPath: string) {

        this.beginString = path.basename(repositoryPath);

        // TODO - handle EPs
        let versionPath = path.join(repositoryPath, "Base");
    
        this.enums = this.loadEnums(versionPath);
        this.fields = this.loadFields(versionPath);
        this.messages = this.loadMessages(versionPath);
    
        this.enums.forEach(entry => {
            if (this.enumeratedTags[entry.tag]) {
                this.enumeratedTags[entry.tag].push(entry);
            }
            else {
                this.enumeratedTags[entry.tag] = [entry];
            }
        });
    }

    readonly beginString: string;
    readonly enums: Enum[];
    readonly fields: Field[];
    readonly messages: Message[];
    readonly enumeratedTags: Record<number, Enum[]> = {}; 

}
