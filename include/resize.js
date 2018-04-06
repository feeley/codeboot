/**
 * Represent a resizable zone inside codeBoot interface
 * @constructor
 * @TODO add requestAnimationFrame to update resizing
 */
function CBResize () {

  // Page body information
  this.body = $( 'body' );
  this.bodyRect = this.body[0].getBoundingClientRect();

  // Codeboot repl container information
  this.repl = $( '#cb-repl-container' );
  this.replRect = this.repl[0].getBoundingClientRect();
  this.replStyle = window.getComputedStyle( this.repl[0] );
  this.replMargin = parseInt( this.replStyle.marginRight, 10 );
  this.replPadding = parseInt( this.replStyle.paddingRight, 10 );

  // Codeboot console, editor and playground DOM
  this.console = $( '#cb-console' );
  this.editor = $( '#cb-editors' );
  this.play = $( '#cb-playground' );

  // CodeBoot navbar and footer height
  this.navH = $( '#cb-navbar' ).height();
  this.footH = $( '#cb-footer' ).height();

  // Division representing the resize icon
  this.resizeIcon = $( '<div>', { id: "cb-resize-icon" } );

  // Resize icon styles
  this.resizeIcon.css({
    width: this.replMargin,
    height: this.replMargin,
    position: "absolute",
    borderRadius: "50%",
    cursor: "pointer",
    right: -this.replMargin,
    bottom: -this.replMargin
  });

  this.repl.append( this.resizeIcon );

  // CodeBoot resize zone information
  this.zone = {
    width: null,
    height: null,
    minW: 200,
    minH: 150,
    maxW: null,
    maxH: null,
    x: null,
    y: null,
    dX: null,
    dY: null
  };

  this.initEvents();

}

/**
 * Returns if playground division is visible
 * @return {boolean}
 */
CBResize.prototype.playVisible = function () {
  return this.play.is( ':visible' );
};

/**
 * Returns repl container height
 * @return {number}
 */
CBResize.prototype.replHeight = function () {
  return this.repl.innerHeight();
};

/**
 * Returns page body rect
 * @return {DOMRect}
 */
CBResize.prototype.getBodyRect = function () {
  return this.bodyRect;
};

/**
 * Returns playground width
 * @return {number}
 */
CBResize.prototype.playWidth = function () {
  return this.play.width();
};

/**
 * Returns the total margins
 * @return {number}
 */
CBResize.prototype.getMargins = function () {
  return 4 * this.replMargin;
};

/**
 * Returns the total paddings
 * @return {number}
 */
CBResize.prototype.getPaddings = function () {
  return 2 * this.replPadding;
};

/**
 * Update resize icon background color
 * @param {string} color
 */
CBResize.prototype.updateColor = function ( color ) {
  this.resizeIcon.css({ backgroundColor: color });
};

/**
 * Initialize event listeners on resize icon and page document
 * Update resizable zone information
 */
CBResize.prototype.initEvents = function () {

  this.resizeIcon.on( 'mousedown', event => {

    this.updateZone( event );

    $(document).on( 'mousemove', startResizing );

    $(document).on( 'mouseup', removeEvents );

  });

};

/**
 * Update resizable zone information
 */
CBResize.prototype.updateZone = function ( event ) {

  this.bodyRect = this.body[0].getBoundingClientRect();
  this.replRect = this.repl[0].getBoundingClientRect();

  this.zone.width = this.bodyRect.width;
  this.zone.height = this.bodyRect.height - this.navH - this.footH;

  this.zone.maxW = this.zone.width;

  if ( this.playVisible() ) {

    this.zone.maxW -= this.zone.minW;

  }

  this.zone.maxH = this.zone.height - this.zone.minH;

  this.zone.x = event.pageX;
  this.zone.y = event.pageY;

  this.zone.dX = this.zone.x - this.replRect.right;
  this.zone.dY = this.zone.y - this.replRect.bottom;

};

/**
 * Update resizable zone x and y value
 */
CBResize.prototype.updatePosition = function ( event ) {

  let x = event.pageX;
  let y = event.pageY;

  if ( this.playVisible() ) {

    if ( x >= this.zone.minW && x <= this.zone.maxW ) {

      this.zone.x = x;

    }

  } else {

    this.zone.x = this.zone.maxW;

  }

  if ( y >= this.zone.minH && y <= this.zone.maxH ) {

    this.zone.y = y;

  }

};

/**
 * Update resizable zone elements
 */
CBResize.prototype.updateView = function () {

  this.updateRepl();

  this.updateEditor();

  if ( this.playVisible() ) {

    this.updatePlay();

  }

};

/**
 * Update repl container size
 */
CBResize.prototype.updateRepl = function () {

  let width = this.zone.x - this.zone.dX - this.replMargin;
  let height = this.zone.y - this.zone.dY - this.navH - this.replMargin;

  updateCSS( this.repl, width, height );

};

/**
 * Update editor size
 */
CBResize.prototype.updateEditor = function () {

  let width = "auto";
  let height = this.zone.height - this.console.height();

  updateCSS( this.editor, width, height );

};

/**
 * Update playground size
 */
CBResize.prototype.updatePlay = function () {

  let margins = this.getMargins();
  let paddings = this.getPaddings();

  let width = this.zone.width - this.repl.width() - margins - paddings;
  let height = this.repl.innerHeight();

  updateCSS( this.play, width, height );

};

var cbR = new CBResize();

/**
 * Resizing function, update resizable zone and view
 */
function startResizing ( event ) {

  cbR.updatePosition( event );

  cbR.updateView();

}

/**
 * Remove event listeners on page document
 */
function removeEvents () {

  $(document).off( 'mousemove', startResizing );

  $(document).off( 'mouseup', removeEvents );

}

/**
 * Update DOM element css properties width and height
 */
function updateCSS ( element, width, height ) {

  element.css({
    width: width,
    height: height
  });

}
