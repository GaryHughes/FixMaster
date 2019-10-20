import * as fs from 'fs';
import * as path from 'path';
import * as xml from './fixRepositoryXml';
import { Field, MessageField, Message } from './definitions';
import { NameLookup } from './options';

export class Repository {

    constructor(root: string, preload: boolean = false) {

        let directories = fs.readdirSync(root, { withFileTypes: true })
                            .filter(entry => entry.isDirectory() && entry.name.startsWith("FIX"))
                            .map(entry => entry.name);

        this.versions = directories.map(entry => new xml.Version(path.join(root, entry)));   
        // FIXT would end up being last but we don't want that because it is a subset.
        this.latestVersion = this.versions[this.versions.length - 2];

        if (preload) {
            for (let version of this.versions) {
                const _ = version.fields;
            }
        }
    }   

    readonly versions: xml.Version[];
    readonly latestVersion: xml.Version;
    nameLookup: NameLookup = NameLookup.Promiscuous;

    definitionOfField(tagOrName: number | string, version: xml.Version | undefined = undefined, message: Message | undefined = undefined) : MessageField {

        var tag = Number(tagOrName);
        
        if (isNaN(tag)) {
            var v = version;
            if (!version) {
                v = this.latestVersion;
            }
            if (v) {
                const field = v.fields.find(f => f.name.toUpperCase() === tagOrName.toString().toUpperCase());
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

                if (version && tag < version.fields.length) {
                    // Next best case, this field is not defined for this specified message but it is a valid
                    // field for this version.
                    const field = version.fields[tag];
                    if (field) {
                        return new MessageField(field, false, "", 0);
                    }
                }

                // Last chance.
                // TODO - improve this to check all versions if necessary.
                if (tag < this.latestVersion.fields.length) {
                    const field = this.latestVersion.fields[tag];
                    if (field) {
                        return new MessageField(field, false, "", 0);
                    }
                }
            }
        }

        // Always return a valid object to simplify calling code.
        const field = new Field(tag, "", "", "", "", "");
        return new MessageField(field, false, "", 0);
    }

    definitionOfMessage(msgType: string, version: xml.Version | undefined = undefined) {
        
        // TODO - name lookups

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
        const fields: MessageField[] = [];
        return new Message("", msgType, "", "", "", "", "", "", fields);
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


