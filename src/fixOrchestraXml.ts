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
    constructor(readonly field_id: string, 
                readonly group_id: string, 
                readonly component_id: string, 
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
                readonly references: string)
    {
    }
}

class Group
{
    constructor(readonly id: string, 
                readonly name: string, 
                readonly added: string, 
                readonly category: string, 
                readonly references: string)
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
               readonly references: string)
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

    }

    load_components(repository: any)
    {

    }

    load_groups(repository: any)
    {

    }

    load_messages(repository: any)
    {

    }

}