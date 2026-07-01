import * as fs from 'fs';
import * as xml2js from 'xml2js';
import * as fix from './definitions';

// Typed shapes for the xml2js-parsed fixtrading.org Orchestration XML.
// xml2js is configured with explicitChildren:true and preserveChildrenOrder:true,
// so named children appear as arrays under their tag name and in order via $$.

interface XmlAttrs {
    [key: string]: string;
}

interface XmlNode {
    $?: XmlAttrs;
    $$?: XmlNode[];
    _?: string;
    [key: string]: unknown;
}

interface XmlDocumentation {
    $?: { purpose?: string };
    _?: string;
}

interface XmlDataType extends XmlNode {
    $: XmlAttrs & { name: string; baseType: string; added: string };
}

interface XmlCode extends XmlNode {
    $: XmlAttrs & {
        id: string; name: string; value: string; added: string;
        addedEP: string; updated: string; updatedEP: string;
        deprecated: string; deprecatedEP: string;
    };
}

interface XmlCodeSet extends XmlNode {
    $: XmlAttrs & { id: string; name: string; type: string };
    code: XmlCode[];
}

interface XmlField extends XmlNode {
    $: XmlAttrs & { id: string; name: string; type: string; added: string };
}

// A child element within a structure, component, or group — e.g. fieldRef, groupRef, componentRef.
interface XmlRef extends XmlNode {
    $: XmlAttrs & { id: string; presence: string; added: string };
    '#name': string;
}

// Any element whose ordered children ($$ ) are XmlRef entries.
interface XmlHasRefs extends XmlNode {
    $$: XmlRef[];
}

interface XmlComponent extends XmlHasRefs {
    $: XmlAttrs & { id: string; name: string; category: string; added: string };
}

interface XmlGroup extends XmlHasRefs {
    $: XmlAttrs & { id: string; name: string; added: string; category: string };
}

interface XmlStructure extends XmlHasRefs {}

interface XmlMessage extends XmlNode {
    $: XmlAttrs & { id: string; msgType: string; name: string; category: string; added: string };
    structure: [XmlStructure];
}

interface XmlRepository {
    $: XmlAttrs & { version: string };
    datatypes: [{ datatype: XmlDataType[] }];
    codesets:  [{ codeset:  XmlCodeSet[]  }];
    fields:    [{ field:    XmlField[]    }];
    components:[{ component:XmlComponent[]}];
    groups:    [{ group?:   XmlGroup[]    }];
    messages:  [{ message:  XmlMessage[]  }];
}

interface XmlParseResult {
    repository: XmlRepository;
}

class DataType
{
    constructor(readonly name: string,
                readonly baseType: string,
                readonly added: string,
                readonly synopsis: string) {}
}

class Code
{
    constructor(readonly id: string,
                readonly name: string,
                readonly value: string,
                readonly added: string,
                readonly synopsis: string,
                readonly addedEP: string,
                readonly updated: string,
                readonly updatedEP: string,
                readonly deprecated: string,
                readonly deprecatedEP: string) {}
}

class CodeSet
{
    constructor(readonly id: string,
                readonly name: string,
                readonly type: string,
                readonly synopsis: string,
                readonly codes: Code[]) {}
}

class Reference
{
    constructor(readonly field_id: number | undefined,
                readonly group_id: number | undefined,
                readonly component_id: string | undefined,
                readonly presence: string,
                readonly added: string) {}
}

class Component
{
    constructor(readonly id: string,
                readonly name: string,
                readonly category: string,
                readonly added: string,
                readonly references: Reference[]) {}
}

class Group
{
    constructor(readonly id: number,
                readonly name: string,
                readonly added: string,
                readonly category: string,
                readonly references: Reference[]) {}
}

export class Orchestration
{
    constructor(filename: string) {
        const buffer = fs.readFileSync(filename);
        const stripNS = xml2js.processors.stripPrefix;
        const nameToLowerCase = (name: string) => name?.toLowerCase();
        xml2js.parseString(buffer, { tagNameProcessors: [stripNS, nameToLowerCase], explicitChildren: true, preserveChildrenOrder: true }, (err: unknown, result: XmlParseResult) => {
            this.version = result.repository.$.version;
            this.loadDataTypes(result.repository);
            this.loadCodeSets(result.repository);
            this.loadFields(result.repository);
            this.loadComponents(result.repository);
            this.loadGroups(result.repository);
            this.loadMessages(result.repository);
        });
    }

    public version: string = "";

    public dataTypes: DataType[] = [];
    public codeSets: CodeSet[] = [];
    public codeSetsById: Record<string, CodeSet> = {};

    public fields: fix.Field[] = [];
    public fieldsByName: Record<string, fix.Field> = {};

    public components: Record<string, Component> = {};
    public groups: Record<number, Group> = {};
    public messages: Record<string, fix.Message> = {};

    extractSynopsis(element: XmlNode): string
    {
        //  <element>
        //    <fixr:annotation>
        //        <fixr:documentation purpose="SYNOPSIS">
        //            int field representing the number of entries in a repeating group. Value must be positive.
        //        </fixr:documentation>
        //    </fixr:annotation>
        const documentation: XmlDocumentation[][] = [];

        const search = (obj: Record<string, unknown>) => {
            for (const key in obj) {
                const value = obj[key];
                if (!value) {
                    continue;
                }
                if (typeof value === "object") {
                    if (key === "documentation") {
                        documentation.push(value as XmlDocumentation[]);
                    }
                    else {
                        search(value as Record<string, unknown>);
                    }
                }
            }
        };

        search(element as Record<string, unknown>);

        let result: string | undefined = undefined;

        for (const item of documentation) {
            if (item[0].$?.purpose === 'SYNOPSIS') {
                result = item[0]._;
            }
        }

        return result ?? ' ';
    }

    loadDataTypes(repository: XmlRepository)
    {
        /*
        <fixr:datatypes>
            <fixr:datatype name="NumInGroup" baseType="int" added="FIX.4.3">
                ...
            </fixr:datatype>
        </fixr:datatypes>
        */
        repository.datatypes[0].datatype.forEach((element: XmlDataType) => {
            const dataType = new DataType(
                element.$.name,
                element.$.baseType,
                element.$.added,
                this.extractSynopsis(element)
            );
            this.dataTypes.push(dataType);
        });
    }

    loadCodeSets(repository: XmlRepository)
    {
        /*
        <fixr:codeSets>
            <fixr:codeSet name="AdvSideCodeSet" id="4" type="char">
                <fixr:code name="Buy" id="4001" value="B" sort="1" added="FIX.2.7">
                    ...
                </fixr:code>
        */
        repository.codesets[0].codeset.forEach((element: XmlCodeSet) => {
            const codes: Code[] = [];
            element.code.forEach((codeElement: XmlCode) => {
                codes.push(new Code(
                    codeElement.$.id,
                    codeElement.$.name,
                    codeElement.$.value,
                    codeElement.$.added,
                    this.extractSynopsis(codeElement),
                    codeElement.$.addedEP,
                    codeElement.$.updated,
                    codeElement.$.updatedEP,
                    codeElement.$.deprecated,
                    codeElement.$.deprecatedEP
                ));
            });
            const codeset = new CodeSet(
                element.$.id,
                element.$.name,
                element.$.type,
                this.extractSynopsis(element),
                codes
            );
            this.codeSets.push(codeset);
            this.codeSetsById[codeset.id] = codeset;
        });
    }

    loadFields(repository: XmlRepository)
    {
        /*
        <fixr:fields>
          <fixr:field id="1" name="Account" type="String" added="FIX.2.7" abbrName="Acct">
              ...
          </fixr:field>
        */
        let maxTag = Number(0);
        repository.fields[0].field.forEach((element: XmlField) => {
            const field = new fix.Field(
                Number(element.$.id),
                element.$.name,
                element.$.type,
                '', // TODO - remove this when we've ripped out the repository
                this.extractSynopsis(element),
                element.$.added,
            );
            this.fieldsByName[field.name.toUpperCase()] = field;
            if (field.tag > maxTag) {
                maxTag = field.tag;
            }
        });
        this.fields = new Array(maxTag);
        for (const name in this.fieldsByName) {
            const field = this.fieldsByName[name];
            this.fields[field.tag] = this.fieldsByName[name];
        }
    }

    extractReferences(element: XmlHasRefs): Reference[]
    {
        const references: Reference[] = [];

        element.$$.forEach((refElement: XmlRef) => {
            if (refElement['#name'] === 'fieldref') {
                references.push(new Reference(
                    Number(refElement.$.id),
                    undefined,
                    undefined,
                    refElement.$.presence,
                    refElement.$.added
                ));
            }
            else if (refElement['#name'] === 'groupref') {
                references.push(new Reference(
                    undefined,
                    Number(refElement.$.id),
                    undefined,
                    refElement.$.presence,
                    refElement.$.added
                ));
            }
            else if (refElement['#name'] === 'componentref') {
                references.push(new Reference(
                    undefined,
                    undefined,
                    refElement.$.id,
                    refElement.$.presence,
                    refElement.$.added
                ));
            }
        });

        return references;
    }

    referencesToFields(references: Reference[], depth: number)
    {
        let result: fix.MessageField[] = [];
        for (const reference of references) {
            if (reference.field_id) {
                const source = this.fields[reference.field_id];
                result.push(new fix.MessageField(source, reference.presence === 'required', reference.added, depth));
            }
            else if (reference.group_id) {
                const group = this.groups[reference.group_id];
                result = result.concat(this.referencesToFields(group.references, depth + 1));
            }
            else if (reference.component_id) {
                const component = this.components[reference.component_id];
                result = result.concat(this.referencesToFields(component.references, depth));
            }
        }
        return result;
    }

    loadComponents(repository: XmlRepository)
    {
        /*
        <fixr:component name="DiscretionInstructions" id="1001" category="Common" added="FIX.4.4" abbrName="DiscInstr">
          <fixr:fieldRef id="388" added="FIX.4.4">
              ...
          </fixr:fieldRef>
        */
        repository.components[0].component.forEach((element: XmlComponent) => {
            const component = new Component(
                element.$.id,
                element.$.name,
                element.$.category,
                element.$.added,
                this.extractReferences(element)
            );
            this.components[component.id] = component;
        });
    }

    loadGroups(repository: XmlRepository)
    {
        /*
        <fixr:groups>
          <fixr:group id="1007" added="FIX.4.4" name="LegStipulations" category="Common" abbrName="Stip">
              ...
          </fixr:group>
        */
        repository.groups[0].group?.forEach((element: XmlGroup) => {
            const group = new Group(
                Number(element.$.id),
                element.$.name,
                element.$.added,
                element.$.category,
                this.extractReferences(element)
            );
            this.groups[group.id] = group;
        });
    }

    loadMessages(repository: XmlRepository)
    {
        /*
        <fixr:messages>
          <fixr:message name="Heartbeat" id="1" msgType="0" category="Session" added="FIX.2.7" abbrName="Heartbeat">
              <fixr:structure>
                  ...
              </fixr:structure>
        */
        repository.messages[0].message.forEach((element: XmlMessage) => {
            const references = this.extractReferences(element.structure[0]);
            const fields = this.referencesToFields(references, 0);
            const message = new fix.Message(
                element.$.id,
                element.$.msgType,
                element.$.name,
                element.$.category,
                '', // TODO get rid of this when we drop the repository
                '', // TODO get rid of this when we drop the repository
                '', //this.extractSynopsis(element),
                element.$.added,
                fields
            );
            this.messages[message.msgType] = message;
        });
    }
}
