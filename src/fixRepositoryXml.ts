import * as fs from 'fs';
import * as xml2js from 'xml2js';
import * as path from 'path';
import { Enum, Field, MessageField, Message } from './definitions';

export class MsgContent {

    constructor(readonly componentID: string, 
                readonly tagText: string, 
                readonly indent: number, 
                readonly position: string, 
                readonly reqd: boolean, 
                readonly description: string, 
                readonly added: string) {
        this.componentID = componentID;
        this.tagText = tagText;
        this.indent = indent;
        this.position = position;
        this.reqd = reqd;
        this.description = description;
        this.added = added;
    }

}

export class Component {

    constructor(readonly componentID: string, 
                readonly componentType: string, 
                readonly categoryID: string, 
                readonly name: string, 
                readonly notReqXML: string, 
                readonly description: string, 
                readonly added: string) {
        this.componentID = componentID;
        this.componentType = componentType;
        this.categoryID = categoryID;
        this.name = name;
        this.notReqXML = notReqXML;
        this.description = description;
        this.added = added;
    }

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

    populateFieldsForComponent(fields:MessageField[], componentID: string, outerIndent: number) {

        const msgContents = this._msgContents[componentID];
        
        if (!msgContents) {
            return;
        }

        msgContents.forEach(content => {
            // If TagText is an int the content is a field, otherwise it is a component.
            const tag = Number(content.tagText);
            if (isNaN(tag)) {
                const component = this._components[content.tagText];
                if (component) {
                    this.populateFieldsForComponent(fields, component.componentID, content.indent);
                }
            }
            else {
                if (tag < this._fields.length) {
                    const field = this._fields[tag];
                    fields.push(
                        new MessageField(
                            field,
                            content.reqd,
                            content.added,
                            outerIndent + content.indent
                        )
                    ); 
                }
            }
        });
    }

    fieldsForMessage(componentID: string) : MessageField[] {
        var fields: MessageField[] = [];
        this.populateFieldsForComponent(fields, componentID, 0);
        return fields;
    }

    loadMessages(versionPath: string) {

        let messagesPath = path.join(versionPath, "Messages.xml");
        let buffer = fs.readFileSync(messagesPath);
        let parser = new xml2js.Parser();
        var messages: Message[] = [];
        const version = this;

        parser.parseString(buffer, function (err:any, result:any) {
            result.Messages.Message.forEach((element:any) => {
                    const componentID = element.ComponentID[0];
                    const fields = version.fieldsForMessage(componentID);
                    messages.push(
                        new Message(
                            componentID, 
                            element.MsgType[0],
                            element.Name[0], 
                            element.CategoryID[0], 
                            element.SectionID[0],
                            element.NotReqXML[0],
                            element.Description[0], 
                            element.Added ? element.Added[0] : "", 
                            fields
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
                    let tag = Number(element.Tag[0]);
                    let field = new Field(
                        tag, 
                        element.Name[0],
                        element.Type[0], 
                        element.NotReqXML[0], 
                        element.Description[0], 
                        element.$.added ? element.$.added : "" 
                    );
                    if (tag < index) {
                        // field elements are not always sorted and we may have generated nulls for a gap
                        // so go back and fill in.
                        fields[tag] = field;    
                    }
                    else {
                        while (index < tag - 1) {
                            fields.push(new Field(0, "", "", "", "", ""));
                            ++index;
                        }
                        ++index;
                        fields.push(field);
                    }
                }
            );
        });

        return fields;
    }

    loadMsgContents(versionPath: string) {

        let msgContentsPath = path.join(versionPath, "MsgContents.xml");
        let buffer = fs.readFileSync(msgContentsPath);
        let parser = new xml2js.Parser();
        var contents: MsgContent[] = [];
    
        parser.parseString(buffer, function (err:any, result:any) {
            result.MsgContents.MsgContent.forEach((element:any) => {
                    contents.push(
                        new MsgContent(
                            element.ComponentID[0], 
                            element.TagText ? element.TagText[0] : "",
                            Number(element.Indent[0]),
                            element.Position[0], 
                            element.Reqd[0] === "1" ? true : false,
                            element.Description ? element.Description[0] : "", 
                            element.Added ? element.Added[0] : "" 
                        )
                    );
                }
            );
        });

        return contents;
    }

    loadComponents(versionPath: string) {

        let componentsPath = path.join(versionPath, "Components.xml");
        let buffer = fs.readFileSync(componentsPath);
        let parser = new xml2js.Parser();
        var components: Component[] = [];
    
        parser.parseString(buffer, function (err:any, result:any) {
            result.Components.Component.forEach((element:any) => {
                    components.push(
                        new Component(
                            element.ComponentID[0], 
                            element.ComponentType[0],
                            element.CategoryID[0], 
                            element.Name[0], 
                            element.NotReqXML[0],
                            element.Description ? element.Description[0] : "",
                            element.Added ? element.Added[0] : "" 
                        )
                    );
                }
            );
        });

        return components;
    }

    constructor(private readonly versionPath: string) {

        this.versionPath = versionPath;
       
        var baseOrEpDirectory = "Base";

        let directories = fs.readdirSync(versionPath, { withFileTypes: true })
                            .filter(entry => entry.isDirectory() && entry.name.startsWith("EP"))
                            .sort(entry => Number(entry.name.substr(2)));

        if (directories.length > 0) {
            baseOrEpDirectory = directories[0].name;
        }

        this.versionPath = path.join(this.versionPath, baseOrEpDirectory);
        this.beginString = path.basename(versionPath);
        this.loaded = false;
        this.loadedEnums = false;
    }

    private forceLoad() {
        
        this.forceLoadEnums();

        if (this.loaded) {
            return;
        }

        this._fields = this.loadFields(this.versionPath);
        
        this.loadComponents(this.versionPath).forEach(component => {
            this._components[component.name] = component;
        });
    
        this.loadMsgContents(this.versionPath).forEach(content => {
            if (this._msgContents[content.componentID]) {
                this._msgContents[content.componentID].push(content);
            }
            else {
                this._msgContents[content.componentID] = [content];
            }
        });

        this.loadMessages(this.versionPath).forEach(message => {
            this._messages[message.msgType] = message;
        });

        this.loaded = true;
    }

    private forceLoadEnums() {
        
        if (this.loadedEnums) {
            return;
        }
        
        this._enums = this.loadEnums(this.versionPath);
        
        this._enums.forEach(entry => {
            if (this._enumeratedTags[entry.tag]) {
                this._enumeratedTags[entry.tag].push(entry);
            }
            else {
                this._enumeratedTags[entry.tag] = [entry];
            }
        });

        this.loadedEnums = true;
    }

    private loaded: boolean;
    private loadedEnums: boolean;

    readonly beginString: string;
    _enums: Enum[] = [];
    _fields: Field[] = [];
    _messages: Record<string, Message> = {};
    _enumeratedTags: Record<number, Enum[]> = {};
    _components: Record<string, Component> = {};
    _msgContents: Record<string, MsgContent[]> = {};

    get enums(): Enum[] {
        this.forceLoadEnums();
        return this._enums;
    }

    get fields(): Field[] {
        this.forceLoad();
        return this._fields;
    }

    get messages(): Record<string, Message> {
        this.forceLoad();
        return this._messages;
    }

    get enumeratedTags(): Record<string, Enum[]> {
        this.forceLoadEnums();
        return this._enumeratedTags;
    }

    get components(): Record<string, Component> {
        this.forceLoad();
        return this._components;
    }

    get msgContents(): Record<string, MsgContent[]> {
        this.forceLoad();
        return this._msgContents;
    }

}
