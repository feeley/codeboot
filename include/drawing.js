function dom_create_canvas(cls, width, height) {
    var c = document.createElement('canvas');
    c.className = cls;
    c.width = width;
    c.height = height;
    c.style.border = '2px solid #eef';
    c.style.padding = '1px';
    var ctx = c.getContext('2d');
    ctx.lineCap = 'butt';
    ctx.font = '10px Courier';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    return c;
}

function dom_create_canvas_cartesian(cls, width, height) {
    var c = dom_create_canvas(cls, width, height);
    var ctx = c.getContext('2d');
    ctx.translate(width/2, height/2);
    ctx.scale(1, -1);
    return c;
}

function dom_set_scale(context, x, y) {
    context.scale(x, y);
}

function dom_set_rotation(context, angle) {
  context.rotate(angle);
}

function dom_reset_transform(context, x, y) {
    context.setTransform(1, 0, 0, 1, x, y);
}

function dom_set_translation(context, x, y) {
    context.translate(x, y);
}

function dom_canvas_context(canvas) {
    return canvas.getContext('2d');
}

function dom_save(context) {
    context.save();
}

function dom_restore(context) {
    context.restore();
}

function dom_line_to(context, x0, y0, x1, y1) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
}

function dom_fill_rect(context, x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

function dom_set_color(context, color) {
    context.strokeStyle = color;
}

function dom_set_thickness(context, width) {
    context.lineWidth = width;
}

function dom_clear(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(-canvas.width, -canvas.height, 2 * canvas.width, 2 * canvas.height);
}

function dom_canvas_width(canvas) {
    return canvas.width;
}

function dom_canvas_height(canvas) {
    return canvas.height;
}

function dom_set_font(context, font) {
    context.font = font;
}

function dom_set_text_baseline(context, baseline) {
    context.textBaseline = baseline;
}

function dom_set_text_align(context, align) {
    context.textAlign = align;
}

function dom_fill_text(context, text, x, y) {
    context.fillText(text, x, y);
}

function dom_measure_text(context, text) {
    var box = context.measureText(text);
    return [box.width, box.height];
}

function dom_remove_children(parent) {
    while (parent.hasChildNodes()) {
        parent.removeChild(parent.firstChild);
    }
}

function DrawingWindow(vm, width, height) {

    var dw = this;

    dw.vm = vm;
    dw.width = width;
    dw.height = height;

    dw.turtle_canvas = dom_create_canvas_cartesian('cb-turtle', width, height);
    dw.turtle_context = dom_canvas_context(dw.turtle_canvas);

    dw.drawing_canvas = dom_create_canvas_cartesian('cb-drawing', width, height);
    dw.drawing_context = dom_canvas_context(dw.drawing_canvas);

    dw.grid_canvas = dom_create_canvas_cartesian('cb-grid', width, height);
    dw.grid_context = dom_canvas_context(dw.grid_canvas);

    dom_set_color(dw.grid_context, '#eef');

    var w2 = width/2;
    var h2 = height/2;
    var grid_step = 10;

    for (var x=0; x<=w2; x+=grid_step) {
        var i = (x/grid_step)%10;
        dom_set_thickness(dw.grid_context, (i===0 ? 1.5 : i===5 ? 1 : 0.5));
        dom_line_to(dw.grid_context, x, -h2, x, h2);
        if (x>0)
            dom_line_to(dw.grid_context, -x, -h2, -x, h2);
    }

    for (var y=0; y<=h2; y+=grid_step) {
        var i = (y/grid_step)%10;
        dom_set_thickness(dw.grid_context, (i===0 ? 1.5 : i===5 ? 1 : 0.5));
        dom_line_to(dw.grid_context, -w2, y, w2, y);
        if (y>0)
            dom_line_to(dw.grid_context, -w2, -y, w2, -y);
    }

    dw.init();

    drawing_window = dw;//TODO: remove
}

var drawing_window;

DrawingWindow.prototype.toDataURL = function (noDecoration, noBackground) {

    var dw = this;
    var w = dw.drawing_canvas.width;
    var h = dw.drawing_canvas.height;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d');

    if (!noBackground) {
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0,0,w,h);
    }

    if (!noDecoration) {
        ctx.drawImage(dw.grid_canvas, 0, 0);
    }

    ctx.drawImage(dw.drawing_canvas, 0, 0);

    if (!noDecoration) {
        ctx.drawImage(dw.turtle_canvas, 0, 0);
    }

    return c.toDataURL();
};

DrawingWindow.prototype.screenshot = function (event) {
    var dw = this;
    var dataURL = dw.toDataURL(event.shiftKey, event.altKey);
    openDataURL(dataURL);
};

function openDataURL(dataURL){
    var win = window.open();
    win.document.write('<iframe src="' + dataURL  +'" frameborder="0" style="border:0; width:100%; height:100%;"></iframe>');
}

DrawingWindow.prototype.excursion = function (thunk) {
    var dw = this;
    var result;
    var pos = dw.pos;
    var orient = dw.orientation;
    dom_save(dw.drawing_context);
    dw.turtle_height++;
    result = thunk();
    dom_restore(dw.drawing_context);
    --dw.turtle_height;
    dw.orientation = orient;
    dw.pos = pos;
    return result;
};

DrawingWindow.prototype.init = function () {
    var dw = this;
    dom_clear(dw.drawing_canvas);
    dw.turtle_height = 0;
    dw.pen_height = 0;
    dw.orientation = 0;
    dw.pos = { x:0, y:0 };
    dw.draw_turtle();
    dw.set_color('#000');
    dw.set_thickness(1);
};

DrawingWindow.prototype.cs = function () {
    var dw = this;
    dw.init();
};

DrawingWindow.prototype.fd = function (xdistance, ydistance) {
    var dw = this;
    if (ydistance === void 0) ydistance = 0;
    var rad = Math.PI * (dw.orientation / 180);
    var x0 = dw.pos.x;
    var y0 = dw.pos.y;
    var x1 = x0 + xdistance * Math.cos(rad) - ydistance * Math.sin(rad);
    var y1 = y0 + xdistance * Math.sin(rad) + ydistance * Math.cos(rad);
    dw.mv(x1, y1);
};

DrawingWindow.prototype.bk = function (xdistance, ydistance) {
    var dw = this;
    if (ydistance === void 0) ydistance = 0;
    dw.fd(-xdistance,-ydistance);
};

DrawingWindow.prototype.mv = function (x, y) {
    var dw = this;
    var x0 = dw.pos.x;
    var y0 = dw.pos.y;
    var x1 = x;
    var y1 = y;
    if (dw.pen_height === 0) {
        dom_line_to(dw.drawing_context, x0, y0, x1, y1);
    }
    dw.pos = { x:x1, y:y1 };
    if (dw.turtle_height === 0) {
        dw.draw_turtle();
    }
};

DrawingWindow.prototype.set_color = function (color) {
    var dw = this;
    dom_set_color(dw.drawing_context, color);
};

DrawingWindow.prototype.set_thickness = function (width) {
    var dw = this;
    var ctx = dw.drawing_context;
    dom_set_font(ctx, (9+width) + 'px Courier');
    dom_set_thickness(ctx, width);
};

DrawingWindow.prototype.pu = function () {
    var dw = this;
    dw.pen_height++;
};

DrawingWindow.prototype.pd = function () {
    var dw = this;
    if (--dw.pen_height <= 0) {
        dw.pen_height = 0;
    }
};

DrawingWindow.prototype.triangle = function (h, base) {
    var dw = this;
    var x = base/2;
    var y = Math.sqrt(x*x + h*h);
    var alpha = 180 * Math.asin(h/y) / Math.PI;
    var beta = 2 * (90 - alpha);
    dw.lt(90);
    dw.pu(); dw.fd(x); dw.pd();
    dw.rt(180 - alpha);
    dw.fd(y);
    dw.rt(180 - beta);
    dw.fd(y);
    dw.rt(180 - alpha);
    dw.fd(2*x);
};

DrawingWindow.prototype.draw_turtle = function () {
    var dw = this;
    dw.excursion(function () {
        var save_canvas = dw.drawing_canvas;
        var save_context = dw.drawing_context;
        var save_pen = dw.pen_height;
        dw.pen_height = 0;
        dw.drawing_canvas = dw.turtle_canvas;
        dw.drawing_context = dw.turtle_context;
        dom_clear(dw.drawing_canvas);
        dw.set_color('#f00');
        dw.set_thickness(2);
        dw.triangle(15, 10);
        dw.drawing_canvas = save_canvas;
        dw.drawing_context = save_context;
        dw.pen_height = save_pen;
    });
};

DrawingWindow.prototype.ht = function () {
    var dw = this;
    if (dw.turtle_height++ === 0) {
        dom_clear(dw.turtle_canvas);
    }
};

DrawingWindow.prototype.st = function () {
    var dw = this;
    if (--dw.turtle_height <= 0) {
        dw.turtle_height = 0;
        dw.draw_turtle();
    }
};

DrawingWindow.prototype.lt = function (angle) {
    var dw = this;
    dw.orientation += angle;
    if (dw.turtle_height === 0) {
        dw.draw_turtle();
    }
};

DrawingWindow.prototype.rt = function (angle) {
    var dw = this;
    dw.orientation -= angle;
    if (dw.turtle_height === 0) {
        dw.draw_turtle();
    }
};

DrawingWindow.prototype.setpc = function (r, g, b) {
    var dw = this;
    var color = convertRGB4({r:Math.floor(r*15),g:Math.floor(g*15),b:Math.floor(b*15)});
    dw.set_color(color || blackRGB);
};

DrawingWindow.prototype.setpw = function (width) {
    var dw = this;
    dw.set_thickness(width);
};

DrawingWindow.prototype.drawtext = function (text) {
    var dw = this;
    var ctx = dw.drawing_context;
    ctx.save();
    ctx.translate(dw.pos.x, dw.pos.y);
    ctx.rotate(Math.PI*(dw.orientation/180));
    ctx.scale(1, -1);
    dom_fill_text(ctx, text+'', 0, 0);
    ctx.restore();
};

DrawingWindow.prototype.pageToRelative = function (coord, clamp) {
    var dw = this;
    var rect = getCoords(dw.drawing_canvas);
    var w = dw.drawing_canvas.width;
    var h = dw.drawing_canvas.height;
    var x = coord.x - rect.x - 3;
    var y = coord.y - rect.y - 3;
    if (clamp) {
        x = Math.max(0, Math.min(w, x));
        y = Math.max(0, Math.min(h, y));
    }
    return { x: x - w/2, y: h/2 - y };
};

function getCoords(elem) {
    var rect = elem.getBoundingClientRect();
    return { x: rect.left + pageXOffset, y: rect.top + pageYOffset };
}

DrawingWindow.prototype.prepareToShow = function () {

    var dw = this;
    var vm = dw.vm;

    vm.setPlaygroundToShow('drawing');
};

DrawingWindow.prototype.setShow = function (show) {

    var dw = this;
    var vm = dw.vm;

    vm.setCheckmark('data-cb-setting-playground', 'show-drawing-window', show);

    if (show) {
        $('.cb-html-window').css('display', 'none');
        $('.cb-pixels-window').css('display', 'none');
        $('.cb-drawing-window').css('display', 'inline');
        var parent = vm.root.querySelector('.cb-drawing-window');
        dom_remove_children(parent);
        parent.appendChild(drawing_window.grid_canvas);
        parent.appendChild(drawing_window.drawing_canvas);
        parent.appendChild(drawing_window.turtle_canvas);
    } else {
        var parent = vm.root.querySelector('.cb-drawing-window');
        dom_remove_children(parent);
        $('.cb-drawing-window').css('display', 'none');
    }
};

DrawingWindow.prototype.showing = function () {
    return $('.cb-drawing-window').is(':visible');
}

function builtin_cs(width, height) {
    var dw = drawing_window;
    var vm = dw.vm;
    if (width !== void 0 || height !== void 0) {
        if (width === void 0 || height === void 0)
            throw 'cs expects 0 or 2 parameters';
        if (typeof width !== 'number')
            throw 'width parameter of cs must be a number';
        if (typeof height !== 'number')
            throw 'height parameter of cs must be a number';
        dw = new DrawingWindow(vm, Math.max(50, Math.min(500, width)), Math.max(50, Math.min(500, height)));
        vm.ui.playground_showing = undefined;
    }
    dw.cs();
    dw.prepareToShow();
}

function builtin_st() {
    var dw = drawing_window;
    dw.st();
    dw.prepareToShow();
}

function builtin_ht() {
    var dw = drawing_window;
    dw.ht();
    dw.prepareToShow();
}

function builtin_pu() {
    var dw = drawing_window;
    dw.pu();
    dw.prepareToShow();
}

function builtin_pd() {
    var dw = drawing_window;
    dw.pd();
    dw.prepareToShow();
}

function builtin_fd(xdistance, ydistance) {
    var dw = drawing_window;
    if (xdistance === void 0)
        throw 'fd expects at least 1 parameter';
    if (typeof xdistance !== 'number')
        throw 'xdistance parameter of fd must be a number';
    if (ydistance !== void 0 && typeof ydistance !== 'number')
        throw 'ydistance parameter of fd must be a number';
    dw.fd(xdistance, ydistance);
    dw.prepareToShow();
}

function builtin_bk(xdistance, ydistance) {
    var dw = drawing_window;
    if (xdistance === void 0)
        throw 'bk expects at least 1 parameter';
    if (typeof xdistance !== 'number')
        throw 'xdistance parameter of bk must be a number';
    if (ydistance !== void 0 && typeof ydistance !== 'number')
        throw 'ydistance parameter of bk must be a number';
    dw.bk(xdistance, ydistance);
    dw.prepareToShow();
}

function builtin_mv(x, y) {
    var dw = drawing_window;
    if (x === void 0 || y === void 0)
        throw 'mv expects 2 parameters';
    if (typeof x !== 'number')
        throw 'x parameter of mv must be a number';
    if (typeof y !== 'number')
        throw 'y parameter of mv must be a number';
    dw.mv(x, y);
    dw.prepareToShow();
}

function builtin_lt(angle) {
    var dw = drawing_window;
    if (angle === void 0)
        throw 'lt expects 1 parameter';
    if (typeof angle !== 'number')
        throw 'angle parameter of lt must be a number';
    dw.lt(angle);
    dw.prepareToShow();
}

function builtin_rt(angle) {
    var dw = drawing_window;
    if (angle === void 0)
        throw 'rt expects 1 parameter';
    if (typeof angle !== 'number')
        throw 'angle parameter of rt must be a number';
    dw.rt(angle);
    dw.prepareToShow();
}

function builtin_setpc(r, g, b) {
    var dw = drawing_window;
    if (r === void 0 || g === void 0 || b === void 0)
        throw 'setpc expects 3 parameters';
    if (typeof r !== 'number')
        throw 'r parameter of setpc must be a number';
    if (typeof g !== 'number')
        throw 'g parameter of setpc must be a number';
    if (typeof b !== 'number')
        throw 'b parameter of setpc must be a number';
    dw.setpc(r, g, b);
    dw.prepareToShow();
}

function builtin_setpw(width) {
    var dw = drawing_window;
    if (width === void 0)
        throw 'setpw expects 1 parameter';
    if (typeof width !== 'number')
        throw 'width parameter of setpw must be a number';
    dw.setpw(width);
    dw.prepareToShow();
}

function builtin_drawtext(text) {
    var dw = drawing_window;
    if (text === void 0)
        throw 'drawtext expects 1 parameter';
    dw.drawtext(text);
    dw.prepareToShow();
}

function PixelsWindow(vm, width, height, scale) {

    var pw = this;
    var grid_thickness = (scale >= 5) ? 1 : 0;

    pw.vm = vm;
    pw.width = width;
    pw.height = height;
    pw.scale = scale;

    pw.pixels_canvas = dom_create_canvas('cb-pixels', width*scale, height*scale);
    pw.pixels_context = dom_canvas_context(pw.pixels_canvas);

    pw.grid_canvas = dom_create_canvas('cb-grid', width*scale, height*scale);
    pw.grid_context = dom_canvas_context(pw.grid_canvas);

    if (grid_thickness > 0) {

        dom_set_color(pw.grid_context, '#eef');
        dom_set_thickness(pw.grid_context, grid_thickness);

        for (var x=0; x<=width; x++) {
            dom_line_to(pw.grid_context, x*scale, 0, x*scale, height*scale);
        }

        for (var y=0; y<=height; y++) {
            dom_line_to(pw.grid_context, 0, y*scale, width*scale, y*scale);
        }
    }

    pw.pixels = [];

    for (var i=0; i<height; i++) {
        pw.pixels[i] = Array(width).fill(blackRGB);
    }

    pw.clear();

    pixels_window = pw;//TODO: remove
    if (vm.ui !== void 0) {
        vm.ui.pw = pw;
    }
}

var pixels_window;

PixelsWindow.prototype.toDataURL = function (noDecoration, noBackground) {

    var pw = this;
    var w = pw.pixels_canvas.width;
    var h = pw.pixels_canvas.height;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d');

    if (!noBackground) {
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0,0,w,h);
    }

    ctx.drawImage(pw.pixels_canvas, 0, 0);

    if (!noDecoration) {
        ctx.drawImage(pw.grid_canvas, 0, 0);
    }

    return c.toDataURL();
};

PixelsWindow.prototype.screenshot = function (event) {
    var pw = this;
    var dataURL = pw.toDataURL(event.shiftKey, event.altKey);
    openDataURL(dataURL);
};

PixelsWindow.prototype.fill_rect = function (x, y, w, h, color) {
    var pw = this;
    var ctx = pw.pixels_context;
    var scale = pw.scale;
    dom_fill_rect(ctx, x*scale, y*scale, w*scale, h*scale, color);
    for (var i=0; i<h; i++) {
        var row = pw.pixels[y+i];
        for (var j=0; j<w; j++) {
            row[x+j] = color;
        }
    }
};

PixelsWindow.prototype.clear = function () {
    var pw = this;
    pw.fill_rect(0, 0, pw.width, pw.height, blackRGB);
};

PixelsWindow.prototype.setScreenMode = function (width, height, scale) {
    var pw = this;
    var vm = pw.vm;
    if (scale === void 0) scale = 1;
    pw = new PixelsWindow(vm, width, height, scale);
    vm.ui.playground_showing = undefined;
    pw.prepareToShow();
};

PixelsWindow.prototype.fillRectangle = function (x, y, w, h, color) {
    var pw = this;
    pw.fill_rect(x, y, w, h, color);
    pw.prepareToShow();
};

PixelsWindow.prototype.clearScreen = function () {
    var pw = this;
    pw.fillRectangle(0, 0, pw.width, pw.height, blackRGB);
};

PixelsWindow.prototype.setPixel = function (x, y, color) {
    var pw = this;
    pw.fillRectangle(x, y, 1, 1, color);
};

PixelsWindow.prototype.exportScreen = function () {
    var pw = this;
    return pw.pixels.map(function (row) { return row.join(''); }).join('\n');
};

PixelsWindow.prototype.showing = function () {
    return $('.cb-pixels-window').is(':visible');
}

PixelsWindow.prototype.prepareToShow = function () {

    var pw = this;
    var vm = pw.vm;

    vm.setPlaygroundToShow('pixels');
};

PixelsWindow.prototype.setShow = function (show) {

    var pw = this;
    var vm = pw.vm;

    vm.setCheckmark('data-cb-setting-playground', 'show-pixels-window', show);

    if (show) {
        $('.cb-html-window').css('display', 'none');
        $('.cb-drawing-window').css('display', 'none');
        $('.cb-pixels-window').css('display', 'inline');
        var parent = document.querySelector('.cb-pixels-window');
        dom_remove_children(parent);
        parent.appendChild(pixels_window.pixels_canvas);
        parent.appendChild(pixels_window.grid_canvas);
    } else {
        var parent = document.querySelector('.cb-pixels-window');
        dom_remove_children(parent);
        $('.cb-pixels-window').css('display', 'none');
    }
};

PixelsWindow.prototype.pageToRelative = function (coord, clamp) {
    var pw = this;
    var rect = getCoords(pw.pixels_canvas);
    var scale = pw.scale;
    var x = Math.floor((coord.x - rect.x - 3)/scale);
    var y = Math.floor((coord.y - rect.y - 3)/scale);
    if (clamp) {
        x = Math.max(0, Math.min(pw.width-1, x));
        y = Math.max(0, Math.min(pw.height-1, y));
    }
    return { x: x, y: y };
};

function getCoords(elem) {
    var rect = elem.getBoundingClientRect();
    return { x: rect.left + pageXOffset, y: rect.top + pageYOffset };
}

CodeBootVM.prototype.getMouse = function () {

    var vm = this;

    var mouse = vm.cb.mouse;
    var state;

    if (vm.ui.dw.showing()) {
        state = vm.ui.dw.pageToRelative(mouse, false);
    } else if (vm.ui.pw.showing()) {
        state = vm.ui.pw.pageToRelative(mouse, true);
    } else {
        state = { x: mouse.x, y: mouse.y };
    }

    state.x = Math.round(state.x);
    state.y = Math.round(state.y);

    state.button = mouse.button;
    state.shift  = mouse.shift;
    state.ctrl   = mouse.ctrl;
    state.alt    = mouse.alt;

    return state;
}

function convertRGB4(rgb) {

    if (typeof rgb !== 'object' ||
        rgb === null ||
        !('r' in rgb) ||
        typeof rgb.r !== 'number' ||
        Math.floor(rgb.r) !== rgb.r ||
        rgb.r < 0 || rgb.r > 15 ||
        !('g' in rgb) ||
        typeof rgb.g !== 'number' ||
        Math.floor(rgb.g) !== rgb.g ||
        rgb.g < 0 || rgb.g > 15 ||
        !('b' in rgb) ||
        typeof rgb.b !== 'number' ||
        Math.floor(rgb.b) !== rgb.b ||
        rgb.b < 0 || rgb.b > 15) {
        return null;
    }

    return '#' + ((((((1<<4)+rgb.r)<<4)+rgb.g)<<4)+rgb.b).toString(16).slice(1);
}

var blackRGB = convertRGB4({r:0,g:0,b:0});
