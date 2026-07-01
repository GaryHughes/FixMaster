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

// Typed shapes for the xml2js-parsed QuickFIX XML data dictionary.
// xml2js is configured with explicitChildren:true and preserveChildrenOrder:true.

interface QfAttrs {
    [key: string]: string;
}

interface QfValue {
    $: QfAttrs & { enum: string; description: string };
}

interface QfField {
    $: QfAttrs & { number: string; name: string; type: string };
    value?: QfValue[];
}

// A child element inside a message, component, or group (field/component/group refs).
interface QfChild {
    $: QfAttrs & { name?: string; required?: string };
    '#name': string;
    $$?: QfChild[];
}

interface QfComponent {
    $: QfAttrs & { name: string };
    $$?: QfChild[];
}

interface QfMessage {
    $: QfAttrs & { msgtype: string; name: string; msgcat: string };
    $$?: QfChild[];
}

interface QfJson {
    fix: {
        $: QfAttrs & { type: string; major: string; minor: string; servicepack: string };
        fields: [{ field: QfField[] }];
        components: [{ component?: QfComponent[] }];
        messages: [{ message: QfMessage[] }];
    };
}

export class DataDictionary {

    constructor(readonly type: string,
                readonly major: number,
                readonly minor: number,
                readonly servicePack: number,
                readonly fields: Field[],
                readonly fieldsByName: Record<string, Field>,
                enums: Enum[],
                messages: Message[]) {
        this.beginString = `${this.type}.${this.major}.${this.minor}SP${this.servicePack}`;

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

    definitionOfField(tag: number, _beginString: string | undefined, _message: Message | undefined) {
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
        const fields: Field[] = [];
        const fieldsByName: Record<string, Field> = {};
        const enums: Enum[] = [];
        const messages: Message[] = [];

        // Field tags are 1 based and there are gaps in the sequence, we want to be able to
        // do constant time lookup using the tag value so insert dummies where required.
        let index: number = -1;

        json.fix.fields[0].field.forEach((element: QfField) => {
            const tag = Number(element.$.number);
            if (element.value) {
                element.value.forEach((value: QfValue) => {
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

        const componentsByName: Record<string, QfComponent> = {};

        const component = json.fix.components[0].component;
        if (component) {
            component.forEach((element: QfComponent) => {
                componentsByName[element.$.name] = element;
            });
        }

        json.fix.messages[0].message.forEach((element: QfMessage) => {

            const messageFields: MessageField[] = [];

            const processChildren = (children: QfChild[] | undefined | null, indent: number, fieldsByName: Record<string, Field>) => {
                if (children === undefined || children === null) {
                    return;
                }
                children.forEach((child: QfChild) => {
                    switch (child["#name"]) {
                        case "field": {
                            const name = child.$.name;
                            const required = child.$.required === 'Y';
                            const field = name ? fieldsByName[name] : undefined;
                            if (field) {
                                messageFields.push(new MessageField(field, required, "", indent));
                            }
                            break;
                        }
                        case "component": {
                            const name = child.$.name;
                            const comp = name ? componentsByName[name] : undefined;
                            if (comp) {
                                processChildren(comp.$$, indent, fieldsByName);
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
                messageFields);

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

async function xml2json(filename: string): Promise<QfJson> {
    return new Promise<QfJson>((resolve, reject) => {
        const xml = fs.readFileSync(filename);
        const parser = new xml2js.Parser({
            explicitChildren: true,
            preserveChildrenOrder: true
        });
        parser.parseString(xml, function (err: unknown, json: QfJson) {
            if (err) {
                reject(err);
            }
            else {
                resolve(json);
            }
        });
    });
}
