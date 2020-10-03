import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { setFlagsFromString } from 'v8';
import * as fix from './definitions';

// "@typescript-eslint/class-name-casing": "warn",

class DataType
{
    constructor(readonly name: string, 
                readonly baseType: string, 
                readonly added: string, 
                readonly synopsis: string)
    {
    }
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
                readonly deprecatedEP: string)
    {
    }
}

class CodeSet
{
    constructor(readonly id: string, 
                readonly name: string, 
                readonly type: string, 
                readonly synopsis: string, 
                readonly codes: Code[])
    {
    }
}

class Reference
{
    constructor(readonly field_id: number | undefined, 
                readonly group_id: number | undefined, 
                readonly component_id: string | undefined, 
                readonly presence: string, 
                readonly added: string)
    {
    }
}

class Component
{
    constructor(readonly id: string, 
                readonly name: string, 
                readonly category: string, 
                readonly added: string, 
                readonly references: Reference[])
    {
    }
}

class Group
{
    constructor(readonly id: number,
                readonly name: string, 
                readonly added: string, 
                readonly category: string, 
                readonly references: Reference[])
    {
    }
}

export class Orchestration
{
    constructor(filename: string) {
        let buffer = fs.readFileSync(filename);
        var orc = this;
        var parseString = require('xml2js').parseString;
        var stripNS = require('xml2js').processors.stripPrefix;
        function nameToLowerCase(name: string){
            return name?.toLowerCase();
        }
        parseString(buffer, { tagNameProcessors: [stripNS, nameToLowerCase], explicitChildren: true, preserveChildrenOrder: true }, function (err:any, result:any) {
            orc.version = result.repository.$.version;
            orc.load_data_types(result.repository);
            orc.load_code_sets(result.repository);
            orc.load_fields(result.repository);
            orc.load_components(result.repository);
            orc.load_groups(result.repository);
            orc.load_messages(result.repository);
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

    extract_synopsis(element: any)
    {
        //  <element>
        //    <fixr:annotation>
        //        <fixr:documentation purpose="SYNOPSIS">
        //            int field representing the number of entries in a repeating group. Value must be positive.
        //        </fixr:documentation>
        //    </fixr:annotation>
        var documentation: any[] = [];

        let search = function recursive_search(obj: any)
        {
            for (var key in obj) {
                
                const value = obj[key];
                
                if (!value) {
                    continue;
                }
                
                if (typeof value === "object") 
                {
                    if (key === "documentation") {
                        documentation.push(value);
                    }
                    else {
                        recursive_search(value);
                    }
                }
            }
        };

        search(element);
        
        var result: string | undefined = undefined;

        for (const item of documentation) {
            if (item[0].$.purpose === 'SYNOPSIS') {
                result = item[0]['_'];
            }
        }

        if (!result) {
            result = documentation[0];
        }

        return result ?? ' ';
    }

    load_data_types(repository: any)
    {
        /*
        <fixr:datatypes>
            <fixr:datatype name="NumInGroup" baseType="int" added="FIX.4.3">
                <fixr:mappedDatatype standard="XML" base="xs:positiveInteger" builtin="0">
                    <fixr:annotation>
                        <fixr:documentation purpose="SYNOPSIS">
                            int field representing the number of entries in a repeating group. Value must be positive.
                        </fixr:documentation>
                    </fixr:annotation>
                </fixr:mappedDatatype>
                <fixr:annotation>
                    <fixr:documentation purpose="SYNOPSIS">
                        int field representing the number of entries in a repeating group. Value must be positive.
                    </fixr:documentation>
                </fixr:annotation>
            </fixr:datatype>
        </fixr:datatypes>
        */
        repository.datatypes[0].datatype.forEach((element:any) => {
            let data_type = new DataType(
                element.$.name,
                element.$.baseType,
                element.$.added,
                this.extract_synopsis(element)
            ); 
            this.dataTypes.push(data_type);
            // self.data_types[dataType.name] = dataType
        });
    }

    load_code_sets(repository: any)
    {
        /*
        <fixr:codeSets>
            <fixr:codeSet name="AdvSideCodeSet" id="4" type="char">
                <fixr:code name="Buy" id="4001" value="B" sort="1" added="FIX.2.7">
                    <fixr:annotation>
                        <fixr:documentation purpose="SYNOPSIS">
                            Buy
                        </fixr:documentation>
                    </fixr:annotation>
                </fixr:code>
        */
        repository.codesets[0].codeset.forEach((element:any) => {
            let codes: Code[] = [];
            element.code.forEach((codeElement:any) => {
                codes.push(new Code(
                    codeElement.$.id,
                    codeElement.$.name,
                    codeElement.$.value,
                    codeElement.$.added,
                    this.extract_synopsis(codeElement),
                    codeElement.$.addedEP,
                    codeElement.$.updated,
                    codeElement.$.updatedEP,
                    codeElement.$.deprecated,
                    codeElement.$.deprecatedEP
                )); 
            });
            let codeset = new CodeSet(
                element.$.id,
                element.$.name,
                element.$.type,
                this.extract_synopsis(element),
                codes
            );
            this.codeSets.push(codeset);
            this.codeSetsById[codeset.id] = codeset;
        });
    }

    load_fields(repository: any)
    {
        /*
        <fixr:fields>
		  <fixr:field id="1" name="Account" type="String" added="FIX.2.7" abbrName="Acct">
			    <fixr:annotation>
				    <fixr:documentation purpose="SYNOPSIS">
                      Account mnemonic as agreed between buy and sell sides, e.g. broker and institution or investor/intermediary and fund manager.
                  </fixr:documentation>
			    </fixr:annotation>
          </fixr:field>
        */
        var maxTag = Number(0);
        repository.fields[0].field.forEach((element:any) => {
            let field = new fix.Field(
                Number(element.$.id),
                element.$.name,
                element.$.type,
                '', // TODO - remove this when we've ripped out th repository
                this.extract_synopsis(element),
                element.$.added,
            );
            this.fieldsByName[field.name.toUpperCase()] = field;
            if (field.tag > maxTag) {
                maxTag = field.tag;
            }
        });
        this.fields = new Array(maxTag);
        for (let name in this.fieldsByName) {
            const field = this.fieldsByName[name];
            this.fields[field.tag] = this.fieldsByName[name];
        }
    }

    extract_references(element: any)
    {
        let references: Reference[] = [];

        // TOOD - these have documentation as well

        element.$$.forEach((refElement:any) => {
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
                    refElement.$.id,
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

    references_to_fields(references: Reference[], depth: number)
    {
        var result: fix.MessageField[] = [];
        for (const reference of references) {
            if (reference.field_id) {
                const source = this.fields[reference.field_id];
                result.push(new fix.MessageField(source, reference.presence === 'required', reference.added, depth));    
            }
            else if (reference.group_id) {
               try {
                    const group = this.groups[reference.group_id];
                    result = result.concat(this.references_to_fields(group.references, depth + 1));
               }
               catch (Exception) {
                    // Broken groupRef in FIX44
                    // https://github.com/FIXTradingCommunity/orchestrations/issues/11
               }
            }
            else if (reference.component_id) {
                const component = this.components[reference.component_id];
                result = result.concat(this.references_to_fields(component.references, depth));
            }
        }
        return result;
    }

    load_components(repository: any)
    {
        /*
        <fixr:component name="DiscretionInstructions" id="1001" category="Common" added="FIX.4.4" abbrName="DiscInstr">
          <fixr:fieldRef id="388" added="FIX.4.4">
              <fixr:annotation>
                  <fixr:documentation>
                      What the discretionary price is related to (e.g. primary price, display price etc)
                  </fixr:documentation>
              </fixr:annotation>
          </fixr:fieldRef>
        */
        repository.components[0].component.forEach((element:any) => {
            let component = new Component(
                element.$.id,
                element.$.name,
                element.$.category,
                element.$.added,
                this.extract_references(element)
            );
            this.components[component.id] = component;
        });
    }

    load_groups(repository: any)
    {
        /*
        <fixr:groups>
          <fixr:group id="1007" added="FIX.4.4" name="LegStipulations" category="Common" abbrName="Stip">
              <fixr:numInGroup id="683"/>
              <fixr:fieldRef id="688" added="FIX.4.4">
                  <fixr:annotation>
                      <fixr:documentation>
                          Required if NoLegStipulations &gt;0
                      </fixr:documentation>
                  </fixr:annotation>
              </fixr:fieldRef>
              <fixr:fieldRef id="689" added="FIX.4.4">
                  <fixr:annotation>
                      <fixr:documentation/>
                  </fixr:annotation>
              </fixr:fieldRef>
              <fixr:annotation>
                  <fixr:documentation/>
              </fixr:annotation>
           </fixr:group>
        */
        repository.groups[0].group?.forEach((element:any) => {
            let group = new Group(
                Number(element.$.id),
                element.$.name,
                element.$.added,
                element.$.category,
                this.extract_references(element)
            );
            this.groups[group.id] = group;
        });
    }

    load_messages(repository: any)
    {
        /*
        <fixr:messages>
          <fixr:message name="Heartbeat" id="1" msgType="0" category="Session" added="FIX.2.7" abbrName="Heartbeat">
              <fixr:structure>
                  <fixr:componentRef id="1024" presence="required" added="FIX.2.7">
                      <fixr:annotation>
                          <fixr:documentation>
                              MsgType = 0
                          </fixr:documentation>
                      </fixr:annotation>
                  </fixr:componentRef>
        */
        repository.messages[0].message.forEach((element:any) => {
            let references = this.extract_references(element.structure[0]);
            let fields = this.references_to_fields(references, 0);
            let message = new fix.Message(
                element.$.id,
                element.$.msgType,
                element.$.name,
                element.$.category,
                '', // TODO get rid of this when we drop the repository
                '', // TODO get rid of this when we drop the repository
                '', //this.extract_synopsis(element),
                element.$.added,
                fields
            );
            this.messages[message.msgType] = message;
        });
    }
}