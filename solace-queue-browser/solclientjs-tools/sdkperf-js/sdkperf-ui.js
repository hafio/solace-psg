////////////////////////  UI /////////////////////////////////////////////////

// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.PubSubTools = solace.PubSubTools || {};


(function() {

    solace.PubSubTools.webBuilder = (function () {

        var onCreateSaveLoad = function (tabId) {
            var html = "";

            html += '<br/>';
            html += '<button id="button-save" title="Configuration from forms is recorded below">Save</button>';
            html += '<button id="button-load" title="Configuration from below is loaded into forms">Load</button>';
            html += '<label id="save-load-summary"></label>';
            html += '<br/>';
            html += '<textarea style="font-family: monospace; font-size: 1.5em; width:815px" id="save-load-textarea" wrap="on" rows="25" class="ui-widget-content ui-corner-all">';
            html += '</textarea>';
            html += '<br/>';
            html += '<strong>Link:</strong> <div id="save-load-link"></div>';

            $('#' + tabId).append(html);
            $('#save-load-textarea').removeClass('ui-widget textarea');

            $('#button-save').button({
                text: true
            }).click(function () {

                    solace.PubSubTools.webEngine.saveInputs();

                    solace.PubSubTools.utils.setLabelText("save-load-summary", "   Saving");
                    $('#save-load-summary').fadeIn();
                    $('#save-load-summary').fadeOut();
                });

            $('#button-load').button({
                text: true
            }).click(function () {
                    solace.PubSubTools.webEngine.loadInputs();

                    solace.PubSubTools.utils.setLabelText("save-load-summary", "   Loading");
                    $('#save-load-summary').fadeIn();
                    $('#save-load-summary').fadeOut();
                });

            $('#save-load-summary').fadeOut();
            solace.PubSubTools.webProperties.disableAtRuntime('button-load');
        };

        var onCreateStartStop = function (tabId) {
            var html = "";

            html += '<span id="' + tabId + '-toolbar" class="toolbar ui-widget-header ui-corner-all">';
            html += '  <button id="' + tabId + '-reset">Reset</button>';
            html += '  <button id="' + tabId + '-stop">Stop</button>';
            html += '  <button id="' + tabId + '-start">Start</button>';
            html += '</span>';
            html += '<br/>';
            html += '<br/>';

            $('#' + tabId).prepend(html);

            $('#' + tabId + '-reset').button({
                text: true
            }).click(function () {
                    solace.PubSubTools.webEngine.reset();
                });

            $('#' + tabId + '-stop').button({
                text: true
            }).click(function () {
                    solace.PubSubTools.webEngine.stop();
                });

            $('#' + tabId + '-start').button({
                text: true
            }).click(function () {
                    solace.PubSubTools.webEngine.start();
                });

            solace.PubSubTools.webProperties.disableAtRuntime(tabId + '-reset');
            solace.PubSubTools.webProperties.disableAtRuntime(tabId + '-start');
        };


        var onCreateTest = function (tabId) {
            var html = "";

            html += '<div id="test-progressbar" class="progressbar"></div>';

            $('#' + tabId).append(html);

            $('#test-progressbar').progressbar({value: 0});
        };

        var onCreateAbout = function (tabId) {
            var html = "";

            html += '==================================================<br/>';
            html += '<strong>' + solace.PubSubTools.Title + ' Version Information:</strong><br/>';

            if (typeof(solace.PubSubTools.Version) !== 'undefined') {
                html += '<div id="about" class="div-table">';
                html += '  <div class="div-table-row">';
                html += '    <div class="div-table-col">Version:</div>';
                html += '    <div class="div-table-col">' + solace.PubSubTools.Version.version + '</div>';
                html += '  </div>';
                html += '  <div class="div-table-row">';
                html += '    <div class="div-table-col">Build Date:</div>';
                html += '    <div class="div-table-col">' + solace.PubSubTools.Version.date + '</div>';
                html += '  </div>';
                html += '</div>';
            } else {
                html += 'Version information not available.';
            }

            html += '<br/><br/>';
            html += '==================================================<br/>';
            html += '<strong>Dependency Build Information:</strong><br/><br/>';
            html += '<strong>' + solace.PubSubTools.ApiName + ' Version Information:</strong><br/>';

            if (typeof(solace.Version) !== 'undefined') {
                html += '<div id="about" class="div-table">';
                html += '  <div class="div-table-row">';
                html += '    <div class="div-table-col">Version:</div>';
                html += '    <div class="div-table-col">' + solace.Version.version + '</div>';
                html += '  </div>';
                html += '  <div class="div-table-row">';
                html += '    <div class="div-table-col">Build Date:</div>';
                html += '    <div class="div-table-col">' + solace.Version.date + '</div>';
                html += '  </div>';
                html += '  <div class="div-table-row">';
                html += '    <div class="div-table-col">Build Variant:</div>';
                html += '    <div class="div-table-col">' + solace.Version.mode + '</div>';
                html += '  </div>';
                html += '</div>';
            } else {
                html += 'Version information not available.';
            }

            html += '</div>';

            $('#' + tabId).append(html);
        };

        var inputId = 0;
        var generateInputId = function (inputIdPrefix) {
            return inputIdPrefix + (inputId++);
        };

        var tabs = [
            {
                id:     "tabs-direct-messaging",
                label:  "Direct Messaging",
                blocks: [
                    solace.PubSubTools.blocks.clientControl,
                    solace.PubSubTools.blocks.clientAckOptionsControl,
                    solace.PubSubTools.blocks.assuredDeliveryControl,
                    solace.PubSubTools.blocks.subControl,
                    solace.PubSubTools.blocks.pubControl,
                    solace.PubSubTools.blocks.messageControl,
                    solace.PubSubTools.blocks.integrityControl,
                    solace.PubSubTools.blocks.cacheControl,
                    solace.PubSubTools.blocks.authentication,                  
                    solace.PubSubTools.blocks.generalSettings
                ],
                onCreate:   [onCreateStartStop]
            },
            {
                id:         "tabs-save-load",
                label:      "Save / Load",
                blocks:     [],
                onCreate:   [onCreateStartStop,
                             onCreateSaveLoad]
            },
            {
                id:         "tabs-test",
                label:      "Test",
                blocks:     [],
                onCreate:   [onCreateStartStop,
                             onCreateTest]
            },
            {
                id:         "tabs-about",
                label:      "About",
                blocks:     [],
                onCreate:   [onCreateAbout]
            }
        ];
        
        var addPageHeader = function (rootDiv) {
            var html = '';

            html += '<div class="page-title">';
            html += '    <img src="../images/solace-logo.png"/>';
            html += '    <div>' + solace.PubSubTools.Title + '</div>';
            html += '    <hr/>';
            html += '</div>';

            $('#' + rootDiv).append(html);
        };

        var createTabs = function (rootDiv) {
            var html = '';

            html += '<div id="tabs">';
            html += '    <ul>';

            for (t = 0; t < tabs.length; ++t) {
                html += '        <li><a href="#' + tabs[t].id + '">' + tabs[t].label + '</a></li>';
            }
            html += '    </ul>';

            for (t = 0; t < tabs.length; ++t) {
                html += '<div id="' + tabs[t].id + '"></div>';
            }

            html += '</div>';
            $('#' + rootDiv).append(html);

            $('#tabs').tabs();
        };

        var addTrafficSummary = function (rootDiv) {
            var html = '';

            html += '<div class="demoHeaders">Traffic  <label id="stats-traffic-summary"></label></div>';

            $('#' + rootDiv).append(html);
        };

        var addConsole = function (rootDiv) {

            var html = '';

            html += '<div class="div-table">';
            html += '    <div class="div-table-row">';
            html += '        <div class="demoHeaders div-table-col">Console</div>';
            html += '        <div id="console-toolbar" class="ui-corner-all div-table-col">';
            html += '            <button id="log-clear" style="float:right">Clear</button>';
            html += '            <button id="log-scroll-lock" style="float:right">Scroll Lock</button>';
            html += '        </div>';
            html += '    </div>';
            html += '</div>';
            html += '<textarea style="font-family: monospace; width:100%;" readonly="true" id="pub-sub-tools-log" wrap="on"';
            html += 'rows="25"';
            html += 'class="ui-widget-content ui-corner-all"></textarea>';

            $('#' + rootDiv).append(html);
        };

        var addMessages = function (rootDiv) {

            var html = '';

            html += '<div class="div-table">';
            html += '    <div class="div-table-row">';
            html += '        <div class="demoHeaders div-table-col">Messages</div>';
            html += '        <div id="messages-toolbar" class="ui-corner-all div-table-col">';
            html += '            <button id="messages-clear" style="float:right">Clear</button>';
            html += '            <button id="messages-scroll-lock" style="float:right">Scroll Lock</button>';
            html += '        </div>';
            html += '    </div>';
            html += '</div>';
            html += '<textarea style="font-family: monospace; width: 100%" readonly="true" id="pub-sub-tools-messages" wrap="on"';
            html += 'rows="25"';
            html += 'class="ui-widget-content ui-corner-all"></textarea>';

            $('#' + rootDiv).append(html);
        };

        var generateTextInput = function (inputId, propName, propLabel, propValue, propDescription) {

            var html = "";

            html += '<div class="div-table-row" title="' + propDescription + '">';
            html += '  <div class="div-table-col">';
            html += '    <strong>' + propLabel + ':</strong>';
            html += '  </div>';
            html += '  <div class="div-table-col">';
            html += '    <input type="input" id="' + inputId + '"';
            html += '           onfocus="solace.PubSubTools.webProperties.updateProperty(\'' + propName + '\',\'' + inputId + '\')"';
            html += '           onblur="solace.PubSubTools.webProperties.updateProperty(\'' + propName + '\',\'' + inputId + '\')"';
            html += '           value="' + propValue + '"';
            html += '           size="50" value="" style="border: 1px solid #dddddd;" class="ui-corner-all">';
            html += '  </div>';
            html += '</div>';

            return html;
        };

        var generateBooleanInput = function (inputId, propName, propLabel, propValue, propDescription) {

            var checked = (propValue ? "checked" : "");

            var html = "";

            html += '<div class="div-table-row" title="' + propDescription + '">';
            html += '  <div class="div-table-col">';
            html += '    <strong>' + propLabel + ':</strong>';
            html += '  </div>';
            html += '  <div class="div-table-col">';
            html += '    <input type="checkbox" id="' + inputId + '" ' + (propValue ? "checked" : "");
            html += '           onclick="solace.PubSubTools.webProperties.updateProperty(\'' + propName + '\',\'' + inputId + '\')" />';
            html += '  </div>';
            html += '</div>';

            return html;
        };

        var generateSelectInput = function (inputId, propName, propLabel, propValues, propDescription) {
            var key;
            var html = "";

            html += '<div class="div-table-row" title="' + propDescription + '">';
            html += '  <div class="div-table-col">';
            html += '    <strong>' + propLabel + ':</strong>';
            html += '  </div>';
            html += '  <div class="div-table-col">';
            html += '    <select id="' + inputId + '" onchange="solace.PubSubTools.webProperties.updateProperty(\'' + propName + '\',\'' + inputId + '\')" >';

            for (key in propValues) {
                if (propValues.hasOwnProperty(key)) {
                    html += '      <option value="' + propValues[key].value + '">' + propValues[key].label + '</option>';
                }
            }

            html += '    </select>';
            html += '  </div>';
            html += '</div>';

            return html;
        };

        return {
            buildWebpage: function (rootDiv) {
                var i, t, b, p, inputId, propName, propLabel, propValue, propDescription, propType, html;

                var webProperties = solace.PubSubTools.webProperties.getRuntimeProperties();

                addPageHeader(rootDiv);
                createTabs(rootDiv);
                addTrafficSummary(rootDiv);
                addConsole(rootDiv);
                addMessages(rootDiv);

                // Fill in all the tabs with with their blocks
                for (t = 0; t < tabs.length; ++t) {

                    html = "";

                    for (b = 0; b < tabs[t].blocks.length; ++b) {

                        // Not all blocks apply to all languages.  Skip those that aren't defined.
                        if (tabs[t].blocks[b] === undefined) {
                            continue;
                        }

                        html += '<br>';
                        html += '<div class="control-block">';
                        html += '  <div class="control-block-header">' + tabs[t].blocks[b].label + '</div>';
                        html += '  <div class="div-table-row control-block-content">';
                        html += '    <div class="div-table-col" id="' + tabs[t].id + '-' + tabs[t].id + '-basic">';
                        html += '      <div class="div-table">';

                        for (p = 0; p < tabs[t].blocks[b].basicProps.length; ++p) {

                            propName        = tabs[t].blocks[b].basicProps[p];
                            propLabel       = webProperties[propName].label;
                            propValue       = webProperties[propName].value;
                            propDescription = webProperties[propName].description;
                            propType        = webProperties[propName].type;
                            inputId         = generateInputId(propType);

                            webProperties[propName].idList.push(inputId);

                            if (propType === "string" || propType === "number" || propType === "float") {
                                html += generateTextInput(inputId, propName, propLabel, propValue, propDescription);
                            } else if (propType === "boolean") {
                                html += generateBooleanInput(inputId, propName, propLabel, propValue, propDescription);
                            } else if (propType === "select") {
                                html += generateSelectInput(inputId, propName, propLabel, webProperties[propName].options, propDescription);
                            }
                        }

                        html += '      </div>';
                        html += '    </div>';
                        html += '    <div class="div-table-col control-block-content-adv" id="' + tabs[t].id + '-' + tabs[t].id + '-adv">';
                        html += '      <div class="div-table">';

                        for (p = 0; p < tabs[t].blocks[b].advProps.length; ++p) {

                            propName        = tabs[t].blocks[b].advProps[p];
                            propLabel       = webProperties[propName].label;
                            propValue       = webProperties[propName].value;
                            propDescription = webProperties[propName].description;
                            propType        = webProperties[propName].type;
                            inputId         = generateInputId(propType);

                            webProperties[propName].idList.push(inputId);

                            if (propType === "string" || propType === "number" || propType === "float") {
                                html += generateTextInput(inputId, propName, propLabel, propValue, propDescription);
                            } else if (propType === "boolean") {
                                html += generateBooleanInput(inputId, propName, propLabel, propValue, propDescription);
                            } else if (propType === "select") {
                                html += generateSelectInput(inputId, propName, propLabel, webProperties[propName].options, propDescription);
                            }
                        }

                        html += '      </div>';
                        html += '    </div>';
                        html += '  </div>';
                        html += '</div>';
                    }

                    $('#' + tabs[t].id).append(html);

                    for (i = 0; i < (tabs[t].onCreate.length || 0); ++i) {
                        if (typeof(tabs[t].onCreate[i]) === "function") {
                            tabs[t].onCreate[i](tabs[t].id);
                        }
                    }
                }
            }
        };
    }());

}.apply(solace.PubSubTools));


/**
 * jquery initialize page function
 */
$(document).ready(function() {

    var urlVars;
    var param;

    // The webpage must be built first so that jQuery has something to work with.
    solace.PubSubTools.webBuilder.buildWebpage("container");

    // Buttons

    $('#log-scroll-lock').button({
        text: false,
        icons: {
            primary: "ui-icon-unlocked"
        }
    }).click(function () {
        solace.PubSubTools.webEngine.toggleScrollLock("log-scroll-lock");
    });

    $('#log-clear').button({
        text: false,
        icons: {
            primary: "ui-icon-closethick"
        }
    }).click(function () {
        solace.PubSubTools.webEngine.clearTextArea("pub-sub-tools-log");
    });

    $('#messages-scroll-lock').button({
        text: false,
        icons: {
            primary: "ui-icon-unlocked"
        }
    }).click(function () {
        solace.PubSubTools.webEngine.toggleScrollLock("messages-scroll-lock");
    });

    $('#messages-clear').button({
        text: false,
        icons: {
            primary: "ui-icon-closethick"
        }
    }).click(function () {
        solace.PubSubTools.webEngine.clearTextArea("pub-sub-tools-messages");
    });


    // Control blocks

    $( ".control-block" ).addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )
			.find( ".control-block-header" )
				.addClass( "ui-widget-header ui-corner-all" )
				.prepend( "<span class='ui-icon ui-icon-plusthick'></span>")
				.end()
			.find( ".control-block-content" );

    $( ".control-block-header" ).click(function() {
        $( this ).find(".ui-icon").toggleClass( "ui-icon-minusthick" ).toggleClass( "ui-icon-plusthick" );
        $( this ).parents( ".control-block:first" ).find( ".control-block-content-adv" ).toggle();
    });

    $( ".control-block-header" ).hover(
        function() {document.body.style.cursor='pointer'},
        function() {document.body.style.cursor='default'}
    );

    solace.PubSubTools.webProperties.reset();

    // The following will cause a key press event such that the 'Enter' key will
    // trigger the webEngine.start().
    $('*:not(* *)').keypress(function(e) {
        if(e.which === 13 &&
                ($(document.activeElement).attr("id") !== "save-load-textarea")) {
            solace.PubSubTools.webEngine.start();
        }
    });

    urlVars = solace.PubSubTools.utils.getUrlVars();

    for (param in urlVars) {
        if (solace.PubSubTools.webProperties.getProperty(param) !== 'undefined') {
            solace.PubSubTools.webProperties.setProperty(param, urlVars[param]);
        }
    }

    solace.PubSubTools.webEngine.saveInputs();
    if (solace.PubSubTools.webProperties.getProperty("autoStart") === true) {
        solace.PubSubTools.webEngine.start();
    }

});


$(window).unload(function() {
    // Nothing to do.
});

(function($) {
    var map = [];
    $.Watermark = {
        ShowAll:function() {
            for (var i = 0; i < map.length; i++) {
                if (map[i].obj.val() === "") {
                    map[i].obj.val(map[i].text);
                    map[i].obj.css("color", map[i].WatermarkColor);
                } else {
                    map[i].obj.css("color", map[i].DefaultColor);
                }
            }
        },
        HideAll:function() {
            for (var i = 0; i < map.length; i++) {
                if (map[i].obj.val() === map[i].text) {
                    map[i].obj.val("");
                }
            }
        }
    };

    $.fn.Watermark = function(text, color) {
        if (!color) {
            color = "#aaa";
        }
        return this.each(
            function() {
                var input = $(this);
                var defaultColor = input.css("color");
                map[map.length] = {text:text,obj:input,DefaultColor:defaultColor,WatermarkColor:color};
                function clearMessage() {
                    if (input.val() === text) {
                        input.val("");
                    }
                    input.css("color", defaultColor);
                }

                function insertMessage() {
                    if (input.val().length === 0 || input.val() === text) {
                        input.val(text);
                        input.css("color", color);
                    } else {
                        input.css("color", defaultColor);
                    }
                }

                input.focus(clearMessage);
                input.blur(insertMessage);
                input.change(insertMessage);

                insertMessage();
            }
        );
    };
}(jQuery));