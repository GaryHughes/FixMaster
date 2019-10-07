import * as fs from 'fs';
import * as path from 'path';
import * as xml from './fixRepositoryXml';
import { NameLookup } from './options';

export class Repository {

    constructor(root: string, preload: boolean = false) {

        let directories = fs.readdirSync(root, { withFileTypes: true })
                            .filter(entry => entry.isDirectory() && entry.name.startsWith("FIX."))
                            .map(entry => entry.name);

        this.versions = directories.map(entry => new xml.Version(path.join(root, entry)));   
        this.latestVersion = this.versions[this.versions.length - 1];

        if (preload) {
            for (let version of this.versions) {
                const _ = version.fields;
            }
        }
    }   

    readonly versions: xml.Version[];
    readonly latestVersion: xml.Version;
    nameLookup: NameLookup = NameLookup.Promiscuous;

    definitionOfField(tag: number, version: xml.Version | undefined, message: xml.Message | undefined) {

        if (message) {
            const field = message.fields.find(f => f.field.tag === tag);
            if (field) {
                // Best case scenario, we found the requested field on the specified message.
                return field;
            }
        }

        if (this.nameLookup === NameLookup.Promiscuous) {

            if (version && tag < version.fields.length) {
                // Next best case, this field is not defined for this specified message but it is a valid
                // field for this version.
                const field = version.fields[tag];
                if (field) {
                    return new xml.MessageField(field, false, "", 0);
                }
            }

            // Last chance.
            // TODO - improve this to check all versions if necessary.
            if (tag < this.latestVersion.fields.length) {
                const field = this.latestVersion.fields[tag];
                if (field) {
                    return new xml.MessageField(field, false, "", 0);
                }
            }
        }

        // Always return a valid object to simplify calling code.
        const field = new xml.Field(tag, "", "", "", "", "");
        return new xml.MessageField(field, false, "", 0);
    }
   
    definitionOfMessage(msgType: string, version: xml.Version | undefined) {
        
        if (version) {
            const message = version.messages[msgType];
            if (message) {
                return message;
            }
        } 

        if (this.nameLookup === NameLookup.Promiscuous) {
            return this.latestVersion.messages[msgType]; 
        }

        // Always return a valid object to simplify calling code.
        const fields: xml.MessageField[] = [];
        return new xml.Message("", msgType, "", "", "", "", "", "", fields);
    }

    descriptionOfValue(tag: number, value:string, version: xml.Version | undefined) {
        
        if (version) {
            const enums = version.enumeratedTags[tag];
            if (enums) {
                let definition = enums.find(entry => entry.value === value);
                if (definition) {
                    return definition.description;
                }
            }
        }

        if (this.nameLookup === NameLookup.Promiscuous) {
            const enums = this.latestVersion.enumeratedTags[tag];
            if (enums) {
                let definition = enums.find(entry => entry.value === value);
                if (definition) {
                    return definition.description;
                }
            }
        }
        
        return "";
    }
}


