import { Message } from './definitions';
import { Repository } from './fixRepository';
import { Version } from './fixRepositoryXml';
import { Uri } from 'vscode';

export function definitionHtmlForMessage(msgTypeOrName: string, repository: Repository, stylesheetPath: Uri, scriptPath: Uri) {

    var messages: [Version, Message][] = [];

    var html = '';

    html += '<!DOCTYPE html>';
    html += '<html lang="en">';
    html += '<head>';
    html += '<link rel="stylesheet" type="text/css" href="' + stylesheetPath + '">';
    html += '<script src="' + scriptPath + '"></script>';
    html += '</head>';
    html += '<body">';

    html += '<br>';
    html += '<div class="tab">';
    for (const version of repository.versions) {
        // TODO - add name lookup
        const message = version.messages[msgTypeOrName];
        if (message) {
            messages.push([version, message]);
        }
        html += `<button class="tablinks" onclick="selectVersion(event, '${version.beginString}')"'`;
        html += `>${version.beginString}</button>`;
    }

    if (messages.length === 0) {
        return null;
    }

    html += '</div>';
    
    const name = messages[0][1].name;

    for (const [version, message] of messages) {
        html += `<div id="${version.beginString}" class="tabcontent">`;
        html += '<br>';
        html += '<table border="1">';
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