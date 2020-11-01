import { MessageField } from './definitions';
import { Orchestra } from './fixOrchestra';
import { Uri } from 'vscode';

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

export function definitionHtmlForField(definition: MessageField, orchestra: Orchestra, stylesheetPaths: Uri[], scriptPaths: Uri[], preferedBeginString: string | undefined = undefined) {

    if (!preferedBeginString) {
        preferedBeginString = orchestra.latestOrchestration.version;
    }

    // The requested field might not be available in the preferred version and we don't
    // want that tab to be selected so find a version it is available in.
    const preferredVersion = orchestra.orchestrations.find(orchestration => orchestration.version === preferedBeginString);
    if (preferredVersion) {
        var preferredDefinition = preferredVersion.fields[definition.field.tag];
        if (isNaN(preferredDefinition.tag)) {
            for (const orchestration of orchestra.orchestrations.slice().reverse()) {
                preferredDefinition = orchestration.fields[definition.field.tag];    
                if (!isNaN(preferredDefinition.tag)) {
                    preferedBeginString = orchestration.version;
                    break;
                }   
            }
        }
    }

    var html = htmlHead(stylesheetPaths, scriptPaths);
    html += '<body>';
    html += '<div>';
    html += '<br>';
    html += '<ul class="nav nav-pills">';
    for (const orchestration of orchestra.orchestrations) {
        var style = 'nav-link';
      
        const versionDefinition = orchestration.fields[definition.field.tag];
        if (!versionDefinition || isNaN(versionDefinition.tag)) {
            style += ' disabled';
        }
        else if (orchestration.version === preferedBeginString) {
            style += ' active';
        }

        html += '<li class="nav-item">';
        html += `   <a class="${style}" href="#${normaliseId(orchestration.version)}" data-toggle="pill">${orchestration.version}`;
        // TODO
        // if (version.extensionPack) {
        //     html += "/EP" + version.extensionPack;
        // }
        html += '</a>';
        html += '</li>';
    }
    html += '</ul>';
    html += '<br>';
    html += '</div>';
    html += '<div class="tab-content">';

    for (const orchestration of orchestra.orchestrations) {
        const codeSet = orchestration.codeSetsById[definition.field.tag];
        style = 'tab-pane';
        if (orchestration.version === preferedBeginString) {
            style += ' active';
        }
        html += `   <div class="${style}" id="${normaliseId(orchestration.version)}">`;

        const versionDefinition = orchestration.fields[definition.field.tag];
        if (versionDefinition) {
            html += '       <p>' + versionDefinition.description.split('\n').join('<br>') + '</p>';
        }

        if (codeSet && codeSet.codes.length > 0) {
            /* we shouldn't add table-dark here but I don't know how to do this dynamically based on the theme and it looks ok
               in both themes anyway because we explicitly override the background and text colors in the css. */
            html += '       <table class="table table-dark table-sm">';
            html += '           <thead>';
            html += '               <trow><th class="text-center">Value</th><th>Name</th><th>Description</th><th>Added</th><th>Updated</th><th>Deprecated</th></trow>';
            html += '           </thead>';
            html += '           <tbody>';
            for (const code of codeSet.codes) {
                html += '   <tr>';
                html += '   <td class="text-center">' + code.value + '</td>';
                html += '   <td>' + code.name + '</td>';
                html += '   <td>' + code.synopsis + '</td>';
                if (code.addedEP && code.addedEP.length > 0) {
                    html += '   <td>' + code.added + "/EP" + code.addedEP + '</td>';
                }
                else {
                    html += '   <td>' + (code.added ?? '') + '</td>';
                }
                if (code.updatedEP && code.updatedEP.length > 0) {
                    html += '   <td>' + code.updated + "/EP" + code.updatedEP + '</td>';
                }
                else {
                    html += '   <td>' + (code.updated ?? '') + '</td>';
                }
                if (code.deprecatedEP && code.deprecatedEP.length > 0) {
                    html += '   <td>' + code.deprecated + "/EP" + code.deprecatedEP + '</td>';
                }
                else {
                    html += '   <td>' + (code.deprecated ?? '') + '</td>';
                }
                html += '   </tr>';
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
