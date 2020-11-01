import * as fs from 'fs';
import * as path from 'path';
import * as xml from './fixOrchestraXml';
import * as fix from './definitions';
import { NameLookup } from './options';
import { print } from 'util';

export class Orchestra
{
    constructor(root: string) {
    
        let filenames = fs.readdirSync(root, { withFileTypes: true })
                          .filter(entry => entry.isFile() && entry.name.endsWith(".xml"))
                          .map(entry => entry.name);

        this.orchestrations = filenames.map(entry => new xml.Orchestration(path.join(root, entry)));  
        // TODO 
        this.latestOrchestration = this.orchestrations[this.orchestrations.length - 2];
    }

    orchestrations: xml.Orchestration[];
    readonly latestOrchestration: xml.Orchestration;

    nameLookup: NameLookup = NameLookup.Promiscuous;

    definitionOfField(tagOrName: number | string, orchestration: xml.Orchestration | undefined = undefined, message: fix.Message | undefined = undefined) : fix.MessageField | undefined 
    {
        var tag = Number(tagOrName);
        
        if (isNaN(tag)) {
            var o = orchestration ?? this.latestOrchestration;
            if (o) {
                const field = o.fieldsByName[tagOrName.toString().toUpperCase()];
                if (field) {
                    tag = field.tag;
                }
            }
        }

        if (!isNaN(tag)) {
            
            if (message) {
                const field = message.fields.find(f => f.field.tag === tag);
                if (field) {
                    // Best case scenario, we found the requested field on the specified message.
                    return field;
                }
            }
           
            if (this.nameLookup === NameLookup.Promiscuous) {

                if (orchestration && tag < orchestration.fields.length) {
                    // Next best case, this field is not defined for this specified message but it is a valid
                    // field for this version.
                    const field = orchestration?.fields[tag];
                    if (field) {
                        return new fix.MessageField(field, false, "", 0);
                    }
                }

                // Last chance, check all versions.
                for (const orchestration of this.orchestrations) {
                    if (tag < orchestration.fields.length) {
                        const field = orchestration.fields[tag];
                        if (field && !isNaN(field.tag)) {
                            return new fix.MessageField(field, false, "", 0);
                        }
                    }
                }
            }
        }

        // Always return a valid object to simplify calling code.
        // TODO - change this to return tag === NaN
        const field = new fix.Field(tag, "", "", "", "", "");
        return new fix.MessageField(field, false, "", 0);
    }
 
    definitionOfMessage(msgType: string, orchestratation: xml.Orchestration | undefined = undefined) 
    {
         // TODO - name lookups

         if (orchestratation) {
            const message = orchestratation.messages[msgType];
            if (message) {
                return message;
            }
        } 

        if (this.nameLookup === NameLookup.Promiscuous) {
            return this.latestOrchestration.messages[msgType]; 
        }

        // Always return a valid object to simplify calling code.
        const fields: fix.MessageField[] = [];
        return new fix.Message("", msgType, "", "", "", "", "", "", fields);
    }

    descriptionOfValue(tag: number, value:string, orchestratation: xml.Orchestration | undefined) 
    {
        if (orchestratation) {
            const codeset = orchestratation.codeSetsById[tag];
            if (codeset) {
                const code = codeset.codes.find(entry => entry.value === value);
                if (code) {
                    return code.synopsis;
                }
            }
        }

        if (this.nameLookup === NameLookup.Promiscuous) {
            const codeset = this.latestOrchestration.codeSetsById[tag];
            if (codeset) {
                const code = codeset.codes.find(entry => entry.value === value);
                if (code) {
                    return code.synopsis;
                }
            }        
        }

        return "";
    }

    symbolicNameOfValue(tag: number, value:string, orchestratation: xml.Orchestration | undefined) 
    {
    
    }


}