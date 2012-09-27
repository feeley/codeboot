cp.outputPlugins = cp.outputPlugins || [];

// ----- Plugins ------

var NoOutput = {
    label: "No output",
    draw: undefined,
    builtins: {},
};
cp.outputPlugins.push(NoOutput);

var PlainTextOutput = {
    label: "Text",
    draw: function (container) {
        $(container).append($("<pre/>").attr("style", "height: 100%; border: none; overflow: scroll;"));
    },
    clear: function (container) {
        $(container).children("pre").empty();
    },
    builtins: {
        println: function (s) {
            $(cp.output).children("pre").append($("<span/>").text(s), "\n");
        },
    },
};
cp.outputPlugins.push(PlainTextOutput);

var PixelGridOutput = {
    label: "Grid",
    draw: function (container) {    
        var rows = 10;
        var columns = 10;
        var ROW_HEIGHT = 10;
        var BORDER_WIDTH = 1;
        var table = $('<table/>').addClass("pixelBox").css("height", (rows * ROW_HEIGHT + rows * BORDER_WIDTH) + "px");
        for (var i = 0; i < rows; i++) {
            var row = $("<tr/>");
            for (var j = 0; j < columns; j++) {
                row.append($("<td/>").attr("id", "pixel_" + i + "_" + j));
            }
            table.append(row);
        }
        $(container).append(table);
    },
    clear: function (container) {
        $(container).empty();
        this.draw(container);
    },
    builtins: {
        setPixel: function (r, c, color) {
            if (!color) color = "black";
            $("#pixel_" + r + "_" + c, cp.output).css('background-color', color);
        },
        clearPixel: function (r, c) {
            $("#pixel_" + r + "_" + c, cp.output).css('background-color', 'transparent');
        },
        resetPixels: function () {
            PixelGridOutput.clear(cp.output);
        },
        ROWS: 10,
        COLUMNS: 10,
    },
};
cp.outputPlugins.push(PixelGridOutput);

cp.clearOutput = function () {
    var p = cp.currentOutput;
    if (p && p.clear) {
        p.clear(cp.output);
    } else if (cp.output) {
        $(cp.output).empty();
    }
};

cp.onOutputKindClicked = function (outputPlugin) {
    var container = cp.output;
    $("[data-cp-role=outputKindLabel]", container.parentNode).text(outputPlugin.label);
    cp.currentOutput = outputPlugin;
    cp.builtins = outputPlugin.builtins || {};
    
    
    $(container).empty();
    if (outputPlugin.draw) {        
        outputPlugin.draw(container);
    }
};

cp.moveOutput = function (srcWindow, dstWindow, $) {
    var srcDocument = srcWindow.document;
    var dstDocument = dstWindow.document;

    // Move output box
    var newOutput = $(".outputBox", dstDocument).get(0);
    newOutput.innerHTML = cp.output.innerHTML;
    cp.output = newOutput;

    // Copy active plugin name
    var label_selector = "[data-cp-role=outputKindLabel]";
    $(label_selector, dstDocument).text($(label_selector, srcDocument).text());

    // Move dropdown items
    var dropdown_selector = "[data-cp-role=outputKindDropdown]";
    var dropdown = $(dropdown_selector, dstDocument).empty();
    $(dropdown_selector + " > li", srcDocument).remove().appendTo(dropdown);
}

cp.detachOutput = function () {
    var popup = window.open("popup.html", "", "width=420,height=375,location=no,status=no,toolbar=no,menubar=no");
    popup.focus();
    popup.cp = cp;

    $("#outputColumn").hide();
    $("#editorColumn").removeClass("span8").addClass("span12");
};

cp.attachOutput = function (popup) {
    cp.moveOutput(popup, popup.opener, popup.$);

    $("#outputColumn").show();
    $("#editorColumn").removeClass("span12").addClass("span8");
};

function cp_internal_populateOutputKinds(container) {
    var dropdown = $(container).empty();
    for (var i = 0; i < cp.outputPlugins.length; i++) {
        var p = cp.outputPlugins[i];
        var link = $('<a href="#"/>').click((function (thePlugin) {
            return function (event) {
                event.preventDefault(); // Don't navigate to "#"
                cp.onOutputKindClicked(thePlugin);
            };
        })(p)).text(p.label);
        dropdown.append($("<li/>").append(link));
    }
}

$(document).ready(function () {
    cp_internal_populateOutputKinds(document.getElementById("dropdownOutputKind"));
    cp.onOutputKindClicked(NoOutput);
});
