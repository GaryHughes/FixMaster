import * as fs from 'fs';
import * as path from 'path';
import * as xml from './fixOrchestraXml';
import * as fix from './definitions';
import { NameLookup } from './options';

export class Orchestra
{
    constructor(root: string) {
    
        let directories = fs.readdirSync(root, { withFileTypes: true })
                            .filter(entry => entry.isFile() && entry.name.endsWith(".xml"))
                            .map(entry => entry.name);

        this.orchestrations = directories.map(entry => new xml.Orchestration(path.join(root, entry)));   
        this.latestOrchestration = this.orchestrations[this.orchestrations.length - 2];

        for (let orchestratation of this.orchestrations) {
            // TODO - force load
            //const _ = orchestratation.fields;
        }
    }

    orchestrations: xml.Orchestration[];
    readonly latestOrchestration: xml.Orchestration;

    nameLookup: NameLookup = NameLookup.Promiscuous;

    definitionOfField(tagOrName: number | string, orchestratation: xml.Orchestration | undefined = undefined, message: fix.Message | undefined = undefined) : fix.MessageField | undefined {
        return undefined;
    }
 
    definitionOfMessage(msgType: string, orchestratation: xml.Orchestration | undefined = undefined) {
    
    }

    descriptionOfValue(tag: number, value:string, orchestratation: xml.Orchestration | undefined) {
    
    }

    symbolicNameOfValue(tag: number, value:string, orchestratation: xml.Orchestration | undefined) {
    
    }


}