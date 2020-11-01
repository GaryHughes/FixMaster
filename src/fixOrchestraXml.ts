import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { setFlagsFromString } from 'v8';
import { Repository } from './fixRepository';

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
               readonly synopsis: string)
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

class Field
{
    constructor(readonly id: string, 
                readonly name: string, 
                readonly type: string, 
                readonly added: string, 
                readonly synopsis: string)
    {
    }
}

class Reference
{
    constructor(readonly field_id: string | undefined, 
                readonly group_id: string | undefined, 
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
    constructor(readonly id: string, 
                readonly name: string, 
                readonly added: string, 
                readonly category: string, 
                readonly references: Reference[])
    {
    }
}

class Message
{
   constructor(readonly id: string, 
               readonly name: string, 
               readonly msg_type: string, 
               readonly category: string, 
               readonly added: string, 
               readonly synopsis: string, 
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
        parseString(buffer, { tagNameProcessors: [stripNS, nameToLowerCase] }, function (err:any, result:any) {
            orc.load_data_types(result.repository);
            orc.load_code_sets(result.repository);
            orc.load_fields(result.repository);
            orc.load_components(result.repository);
            orc.load_groups(result.repository);
            orc.load_messages(result.repository);
        });
    }

    data_types: DataType[] = [];
    code_sets: CodeSet[] = [];
    fields: Field[] = [];
    components: Component[] = [];
    groups: Group[] = [];
    messages: Message[] = [];

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
        
        for (const item of documentation) {
            if (item[0].$.purpose === 'SYNOPSIS') {
                return item[0]['_'];
            }
        }  

        return '';
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
            this.data_types.push(data_type);
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
                    this.extract_synopsis(codeElement)
                )); 
            });
            let codeset = new CodeSet(
                element.$.id,
                element.$.name,
                element.$.type,
                this.extract_synopsis(element),
                codes
            );
            this.code_sets.push(codeset);
            // self.code_sets[code_set.name] = code_set
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
        repository.fields[0].field.forEach((element:any) => {
            let field = new Field(
                element.$.id,
                element.$.name,
                element.$.type,
                element.$.added,
                this.extract_synopsis(element)
            );
            this.fields.push(field);
            // self.fields[field.id] = field
        });
    }

    extract_references(element: any)
    {
        let references: Reference[] = [];

        element.fieldref?.forEach((refElement:any) => {
            references.push(new Reference(
                refElement.$.id,
                undefined,
                undefined,
                refElement.$.presence,
                refElement.$.added
            ));  
        });

        element.groupref?.forEach((refElement:any) => {
            references.push(new Reference(
                undefined,
                refElement.$.id,
                undefined,
                refElement.$.presence,
                refElement.$.added
            ));  
        });

        element.componentref?.forEach((refElement:any) => {
            references.push(new Reference(
                undefined,
                undefined,
                refElement.$.id,
                refElement.$.presence,
                refElement.$.added
            ));  
        });

        return references;
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
            this.components.push(component);
            // self.fields[field.id] = field
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
        repository.groups[0].group.forEach((element:any) => {
            let group = new Group(
                element.$.id,
                element.$.name,
                element.$.added,
                element.$.category,
                this.extract_references(element)
            );
            this.groups.push(group);
            // self.groups[group.id] = group
        });
    }

    load_messages(repository: any)
    {
        
    }

}