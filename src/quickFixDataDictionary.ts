import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { Enum, Field, MessageField, Message } from './definitions';

/*

<fix major="4" minor="4">
    <header>
        <field name="BeginString" required="Y"/>
        <group name="NoHops" required="N">
            <field name="HopCompID" required="N"/>
        </group>
    </header>
    <trailer>
        <field name="SignatureLength" required="N"/>
        <group/>
    </trailer>
    <messages>
        <message name="Heartbeat" msgtype="0" msgcat="admin">
            <field name="TestReqID" required="N"/>
            <component name="Instrument" required="Y"/>
            <group name="NoMsgTypes" required="N">
                <field name="RefMsgType" required="N"/>
                <component name="UnderlyingInstrument" required="N"/>
            </group>
        </message>
    </messages>
    <components>
        <component name="Instrument">
            <field name="Symbol" required="Y"/>
            <group name="NoSecurityAltID" required="N">
                <field name="SecurityAltID" required="N"/>
            <group>
            <component/>
        </component>
    </components>
    <fields>
        <field number="4" name="AdvSide" type="CHAR">
            <value enum="B" description="BUY"/>
        </field>
    </fields>
</fix>

*/

export class DataDictionary {

    constructor(readonly type: string,
                readonly major: number,
                readonly minor: number,
                readonly servicePack: number,
                readonly fields: Field[],
                readonly fieldsByName: Record<string, Field>,
                enums: Enum[],
                messages: Message[]) {
        this.type = type;
        this.major = major;
        this.minor = minor;
        this.servicePack = servicePack;
        this.beginString = `${this.type}.${this.major}.${this.minor}SP${this.servicePack}`;
        this.fields = fields;
        this.fieldsByName = fieldsByName;
        
        enums.forEach(entry => {
            if (this.enums[entry.tag]) {
                this.enums[entry.tag].push(entry);
            }
            else {
                this.enums[entry.tag] = [entry];
            }
        });

        messages.forEach(message => this.messages[message.msgType] = message);
    }

    readonly beginString: string;
    readonly enums: Record<number, Enum[]> = {};
    readonly messages: Record<string, Message> = {};
   
    definitionOfField(tag: number, beginString: string | undefined, message: Message | undefined) {
        if (tag > 0 && tag < this.fields.length) {
            const field = this.fields[tag];
            return new MessageField(field, false, "", 0);
        }
        return new MessageField(new Field(NaN, "", "", undefined, undefined, undefined), false, "", 0);
    }

    definitionOfMessage(msgType: string) {
        
        const message = this.messages[msgType];
        if (message) {
            return message;
        }

        // Always return a valid object to simplify calling code.
        return new Message("", msgType, "", "", "", "", "", "", []);
    }

    descriptionOfValue(tag: number, value: string) {
        
        const enums = this.enums[tag];

        if (enums) {
            const definition = enums.find(e => e.value === value);
            if (definition) {
                return definition.symbolicName;
            }
        }

        return "";
    }

    static async parse(filename: string) {

        const json = await xml2json(filename);
    
        const type = json.fix.$.type;
        const major = Number(json.fix.$.major);
        const minor = Number(json.fix.$.minor);
        const servicePack = Number(json.fix.$.servicepack);
        let fields: Field[] = [];
        let fieldsByName: Record<string, Field> = {};
        let enums: Enum[] = [];
        let messages: Message[] = [];
       
        // Field tags are 1 based and there are gaps in the sequence, we want to be able to
        // do constant time lookup using the tag value so insert dummies where required.
        var index: number = -1;

        json.fix.fields[0].field.forEach((element: any) => {
            const tag = Number(element.$.number);
            if (element.value) {
                element.value.forEach((value: any) => {
                    enums.push(new Enum(
                        tag,
                        value.$.enum,
                        value.$.description,
                    ));
                });
            }
            const field = new Field(
                tag,
                element.$.name,
                element.$.type
            );
            if (field.tag < index) {
                // field elements are not always sorted and we may have generated nulls for a gap
                // so go back and fill in.
                fields[field.tag] = field;    
            }
            else {
                while (index < field.tag - 1) {
                    fields.push(new Field(0, "", ""));
                    ++index;
                }
                ++index;
                fields.push(field);
            }
        });

        fields.forEach(field => {
            fieldsByName[field.name] = field;
        });

        var componentsByName: Record<string, any> = {};

        json.fix.components[0].component.forEach((element:any) => {
            componentsByName[element.$.name] = element;
        });
    
        json.fix.messages[0].message.forEach((element:any) => {
        
            var fields: MessageField[] = [];
           
            let processChildren = (children: any[], indent: number, fieldsByName: Record<string, Field>) => {
                children.forEach((child: any) => {
                    switch (child["#name"]) {
                        case "field": {
                            const name = child.$.name;    
                            const required = child.$.required === 'Y';
                            const field = fieldsByName[name];
                            if (field) {
                                fields.push(new MessageField(field, required, "", indent));
                            }                            
                            break;
                        }
                        case "component": {
                            const name = child.$.name;
                            const component = componentsByName[name];
                            if (component) {
                                processChildren(component.$$, indent, fieldsByName);
                            }
                            break;
                        }
                        case "group": {
                            processChildren(child.$$, indent + 1, fieldsByName);
                            break;
                        }
                    }
                });
            };

            processChildren(element.$$, 0, fieldsByName);

            const message = new Message(
                "",
                element.$.msgtype,
                element.$.name,
                element.$.msgcat,
                "",
                "",
                "",
                "",
                fields);
        
                messages.push(message);
        
        });

        return new DataDictionary(
            type,
            major,
            minor,
            servicePack,
            fields,
            fieldsByName,
            enums,
            messages
        );
    
    }

}

async function xml2json(filename: string) {
    return new Promise<any>((resolve, reject) => {
        let xml = fs.readFileSync(filename);
        let parser = new xml2js.Parser({
            explicitChildren: true, 
            preserveChildrenOrder: true 
        });
        parser.parseString(xml, function (err: any, json: any) {
            if (err) {
                reject(err);
            }
            else {
                resolve(json);
            }
        });
    });
}
