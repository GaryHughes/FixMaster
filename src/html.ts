import { Message, MessageField } from './definitions';
import { Repository } from './fixRepository';
import { Version } from './fixRepositoryXml';
import { Uri } from 'vscode';
import { fieldValueSeparator } from './fixProtcol';

function htmlHead(stylesheetPaths: Uri[], scriptPaths: Uri[]) {
    var html = '';
    html += '<!DOCTYPE html>';
    html += '<html lang="en">';
    html += '<head>';
    for (const path of stylesheetPaths) {
        html += '<link rel="stylesheet" type="text/css" href="' + path + '">';
    }
    for (const path of scriptPaths) {
        html += '<script src="' + path + '"></script>';
    }
    html += '</head>';
    return html;
}

function normaliseId(value: string) {
    // id attributes are suppose to allow periods but they don't work in here.
    return value.split(".").join("");
}

export function definitionHtmlForField(definition: MessageField, repository: Repository, stylesheetPaths: Uri[], scriptPaths: Uri[], prefferedVersion: string | undefined = undefined) {

    if (!prefferedVersion) {
        prefferedVersion = repository.latestVersion.beginString;
    }

    var html = htmlHead(stylesheetPaths, scriptPaths);
    html += '<body>';
    html += '<div>';
    html += '<br>';
    html += '<ul class="nav nav-pills">';
    for (const version of repository.versions) {
        const values = version.enumeratedTags[definition.field.tag];
        var style = 'nav-link';
        if (version.beginString === prefferedVersion) {
            style += ' active';
        }
        
        const versionDefinition = version.fields[definition.field.tag];
        if (!versionDefinition) {
            style += ' disabled';
        }

        html += '<li class="nav-item">';
        html += `   <a class="${style}" href="#${normaliseId(version.beginString)}" data-toggle="pill">${version.beginString}</a>`;
        html += '</li>';
    }
    html += '</ul>';
    html += '<br>';
    html += '</div>';
    html += '<div class="tab-content">';

    for (const version of repository.versions) {
        const values = version.enumeratedTags[definition.field.tag];
        style = 'tab-pane';
        if (version.beginString === prefferedVersion) {
            style += ' active';
        }
        html += `   <div class="${style}" id="${normaliseId(version.beginString)}">`;

        const versionDefinition = version.fields[definition.field.tag];
        if (versionDefinition) {
            html += '       <p>' + versionDefinition.description.split('\n').join('<br>') + '</p>';
        }

        if (values && values.length > 0) {
            html += '       <table class="table table-sm">';
            html += '           <thead>';
            html += '               <trow><th class="text-center">Value</th><th>Name</th><th>Description</th><th>Added</th><th>Updated</th><th>Deprecated</th></trow>';
            html += '           </thead>';
            html += '           <tbody>';
            if (values) {
                for (const enumValue of values) {
                    html += '   <tr>';
                    html += '   <td class="text-center">' + enumValue.value + '</td>';
                    html += '   <td>' + enumValue.symbolicName + '</td>';
                    html += '   <td>' + enumValue.description + '</td>';
                    if (enumValue.addedEP && enumValue.addedEP.length > 0) {
                        html += '   <td>' + enumValue.added + "/EP" + enumValue.addedEP + '</td>';
                    }
                    else {
                        html += '   <td>' + enumValue.added + '</td>';
                    }
                    if (enumValue.updatedEP && enumValue.updatedEP.length > 0) {
                        html += '   <td>' + enumValue.updated + "/EP" + enumValue.updatedEP + '</td>';
                    }
                    else {
                        html += '   <td>' + enumValue.updated + '</td>';
                    }
                    if (enumValue.deprecatedEP && enumValue.deprecatedEP.length > 0) {
                        html += '   <td>' + enumValue.deprecated + "/EP" + enumValue.deprecatedEP + '</td>';
                    }
                    else {
                        html += '   <td>' + enumValue.deprecated + '</td>';
                    }
                    html += '   </tr>';
                }
            }
            html += '           </tbody>';
            html += '       </table>';
        }
        html += '   </div>';
    }

    html += '</div>';
    html += '</body>';
    html += '</html>';

    return html;
}

/*
export function definitionHtmlForMessage(definition: Message, repository: Repository, stylesheetPaths: Uri[], scriptPaths: Uri[]) {

    var html = htmlHead(stylesheetPaths, scriptPaths);

    html += '<br>';
    html += '<div class="tab">';
  
    var messages: [Version, Message][] = [];
    //html += '<ul class="nav nav-pills">';
  
    for (const version of repository.versions) {
        // TODO - add name lookup
        const message = version.messages[definition.msgType];
        if (message) {
            messages.push([version, message]);
        }
        // html += '<li class="nav-item">';
        // html += '<a class="nav-link" href="' + version.beginString + '">' + version.beginString + '</a>';
        // html += '</li>';

        html += `<button class="tablinks" onclick="selectVersion(event, '${version.beginString}')"'`;
        html += `>${version.beginString}</button>`;
    }

    if (messages.length === 0) {
        return null;
    }

    html += '</div>';
    //html += '</ul>';

    //const name = messages[0][1].name;

    for (const [version, message] of messages) {
        html += `<div id="${version.beginString}" class="tabcontent">`;
        html += '<br>';
        html += '<table class="table table-dark table-sm">';
        html += '<thead>';
        html += '<trow><th>Tag</th><th>Name</th><th>Type</th><th>Description</th><th>Added</th></trow>';
        html += '</thead>';
        html += '<tbody>';
        for (const field of message.fields) {
            html += '<tr>';
            html += '<td>' + field.field.tag + '</td>';
            html += '<td>' + field.field.name + '</td>';
            html += '<td>' + field.field.type + '</td>';
            html += '<td>' + field.field.description + '</td>';
            html += '<td>' + field.field.added + '</td>';
            html += '</tr>';
        }
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
    }

    html += '</body>';
    html += '</html>';

    return html;
}
*/