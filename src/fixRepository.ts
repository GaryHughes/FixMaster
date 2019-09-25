import * as fs from 'fs';
import * as path from 'path';
import * as xml from './fixRepositoryXml';

export enum NameLookup {
    Strict,
    Promiscuous
}

export class Repository {

    constructor(root: string) {

        let directories = fs.readdirSync(root, { withFileTypes: true })
                            .filter(entry => entry.isDirectory() && entry.name.startsWith("FIX."))
                            .map(entry => entry.name);

        this.versions = directories.map(entry => new xml.Version(path.join(root, entry)));   
        this.latestVersion = this.versions[this.versions.length - 1];
    }   

    readonly versions: xml.Version[];
    readonly latestVersion: xml.Version;
    nameLookup: NameLookup = NameLookup.Promiscuous;

    nameOfFieldWithTag(tag: number, version: xml.Version) {
        var name = "";
        if (!isNaN(tag) && tag > 0 && tag < version.fields.length) {
            name = version.fields[tag].name;
        }
        if ((!name || name.length === 0) && this.nameLookup === NameLookup.Promiscuous) {
            // Just look at the most recent version for now, we could do an exhaustive search if that fails.
            name = this.latestVersion.fields[tag].name;
        }
        return name;
    }

    nameOfMessageWithMsgType(msgType: string, version: xml.Version) {
        var message = version.messages.find(message => message.msgType === msgType);
        if (!message) {
            if (this.nameLookup === NameLookup.Promiscuous) {
                message = this.latestVersion.messages.find(message => message.msgType === msgType);    
            }
        }
        if (message) {
            return message.name;
        }
        return "";
    }

    descriptionOfValue(tag: number, value:string, version: xml.Version) {
        const enums = version.enumeratedTags[tag];
        if (enums) {
            let definition = enums.find(entry => entry.value === value);
            if (definition) {
                return definition.description;
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


