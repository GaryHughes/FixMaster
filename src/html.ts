import { Message } from './definitions';
import { Repository } from './fixRepository';
import { Version } from './fixRepositoryXml';

export function definitionHtmlForMessage(msgTypeOrName: string, preferredVersion:string, repository: Repository) {

    var messages: [Version, Message][] = [];

    var html = '';

    html += '<!DOCTYPE html>';
    html += '<html lang="en">';
    html += '<head>';
    html += '<style>';
    html += '.tab {';
    html += '   overflow: hidden;';
    html += '}';
    html += '.tab button {';
    html += '   background-color: #1D62C4;';
    html += '   border: none;';
    html += '   color: white;';
    html += '   padding: 5px 5px;';
    html += '   margin: 0px 5px;';
    html += '   text-align: center;';
    html += '   text-decoration: none;';
    html += '   display: inline-block;';
    html += '}';
    html += '.tab button.active {';
    html += '   background-color: #ccc;';
    html += '   color: black;';
    html += '}';
    html += '</style>';
    html += '<script>';
    html += 'function selectVersion(evt, beginString) {';
    html += '   var i, tabcontent, tablinks;';
    html += '   tabcontent = document.getElementsByClassName("tabcontent");';
    html += '   for (i = 0; i < tabcontent.length; i++) {';
    html += '       tabcontent[i].style.display = "none";';
    html += '   }';
    html += '   tablinks = document.getElementsByClassName("tablinks");';
    html += '   for (i = 0; i < tablinks.length; i++) {';
    html += '       tablinks[i].className = tablinks[i].className.replace(" active", "");';
    html += '   }';
    html += '   document.getElementById(beginString).style.display = "block";';
    html += '   evt.currentTarget.className += " active";';
    html += '}';
    html += 'function selectDefaultVersion() {';
    html += '    console.log("ONLOAD");';
    html += '    document.getElementById("defaultVersion").click();';
    html += '}';
    html += 'window.onload = selectDefaultVersion;';
    html += '</script>';
    html += '</head>';
    html += '<body">';

    html += '<div class="tab">';
    for (const version of repository.versions) {
        // TODO - add name lookup
        const message = version.messages[msgTypeOrName];
        if (message) {
            messages.push([version, message]);
        }
        html += `<button class="tablinks" onclick="selectVersion(event, '${version.beginString}')"'`;
        if (version.beginString === preferredVersion) {
            html += 'id="defaultVersion"';
        }
        html += `>${version.beginString}</button>`;
    }

    if (messages.length === 0) {
        return null;
    }

    html += '</div>';
    
    const name = messages[0][1].name;

    for (const [version, message] of messages) {
        html += `<div id="${version.beginString}" class="tabcontent">`;
        html += '<table>';
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

    return { name: name, html: html };
}