import * as fs from 'fs';
import * as xml2js from 'xml2js';

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

export class FieldValue {

    constructor(readonly value: string, readonly description: string) {
        this.value = value;
        this.description = description;
    }

}

export class Field {

    constructor(readonly number: number, 
                readonly name: string, 
                readonly type: string, 
                readonly values: FieldValue[]) {
        this.number = number;
        this.name = name;
        this.type = type;
        this.values = values;
    }

}

export class MessageField {

}

export class Message {

}

export class DataDictionary {

    constructor(readonly type: string,
                readonly major: number,
                readonly minor: number,
                readonly servicePack: number,
                readonly messages: Message[],
                readonly fields: Field[]) {
        this.type = type;
        this.major = major;
        this.minor = minor;
        this.servicePack = servicePack;
        this.messages = messages;
        this.fields = fields;
    }

    static async parse(filename: string) {

        const json = await xml2json(filename);
    
        const type = json.fix.$.type;
        const major = Number(json.fix.$.major);
        const minor = Number(json.fix.$.minor);
        const servicePack = Number(json.fix.$.servicepack);
        let fields: Field[] = [];
        let messages: Message[] = [];
       
        json.fix.fields[0].field.forEach((element: any) => {
            const values: FieldValue[] = [];
            if (element.value) {
                element.value.forEach((value: any) => {
                    values.push(new FieldValue(
                        value.$.enum,
                        value.$.description
                    ));
                });
            }
            fields.push(
                new Field(
                    Number(element.number),
                    element.name,
                    element.type,
                    values
                )
            );
        });
    
        json.fix.messages[0].message.forEach((element:any) => {
    
        });
    
        return new DataDictionary(
            type,
            major,
            minor,
            servicePack,
            messages,
            fields
        );
    
    }

}

async function xml2json(filename: string) {
    return new Promise<any>((resolve, reject) => {
        let xml = fs.readFileSync(filename);
        let parser = new xml2js.Parser();
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
