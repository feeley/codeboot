function CBResize () {

  this.body = $( 'body' );
  this.bodyRect = this.body[0].getBoundingClientRect();

  this.repl = $( '#cb-repl-container' );
  this.replRect = this.repl[0].getBoundingClientRect();
  this.replStyle = window.getComputedStyle( this.repl[0] );
  this.replMargin = parseInt( this.replStyle.marginRight, 10 );
  this.replPadding = parseInt( this.replStyle.paddingRight, 10 );

  this.console = $( '#cb-console' );
  this.editor = $( '#cb-editors' );
  this.play = $( '#cb-playground' );

  this.navH = $( '#cb-navbar' ).height();
  this.footH = $( '#cb-footer' ).height();

  this.resizeIcon = $( '<div>', { id: "cb-resize-icon" } );

  this.resizeIcon.css({
    width: this.replMargin,
    height: this.replMargin,
    position: "absolute",
    borderRadius: "50%",
    backgroundColor: "#7db6d5",
    cursor: "pointer",
    right: -this.replMargin,
    bottom: -this.replMargin
  });

  this.repl.append( this.resizeIcon );

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

CBResize.prototype.playVisible = function () {
  return this.play.is( ':visible' );
};

CBResize.prototype.replHeight = function () {
  return this.repl.innerHeight();
};

CBResize.prototype.getBodyRect = function () {
  return this.bodyRect;
};

CBResize.prototype.playWidth = function () {
  return this.play.width();
};

CBResize.prototype.getMargins = function () {
  return 4 * this.replMargin;
};

CBResize.prototype.getPaddings = function () {
  return 2 * this.replPadding;
};

CBResize.prototype.updateColor = function ( color ) {
  this.resizeIcon.css({ backgroundColor: color });
};

CBResize.prototype.initEvents = function () {

  this.resizeIcon.on( 'mousedown', event => {

    this.updateZone( event );

    $(document).on( 'mousemove', startResizing );

    $(document).on( 'mouseup', removeEvents );

  });

};

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

CBResize.prototype.updateView = function () {

  this.updateRepl();

  this.updateEditor();

  if ( this.playVisible() ) {

    this.updatePlay();

  }

};

CBResize.prototype.updateRepl = function () {

  let width = this.zone.x - this.zone.dX - this.replMargin;
  let height = this.zone.y - this.zone.dY - this.navH - this.replMargin;

  updateCSS( this.repl, width, height );

};

CBResize.prototype.updateEditor = function () {

  let width = "auto";
  let height = this.zone.height - this.console.height();

  console.log( this.zone.height, this.console.height() );

  updateCSS( this.editor, width, height );

};

CBResize.prototype.updatePlay = function () {

  let margins = 4 * this.replMargin;
  let paddings = 2 * this.replPadding;

  let width = this.zone.width - this.repl.width() - margins - paddings;
  let height = this.repl.innerHeight();

  updateCSS( this.play, width, height );

};

var cbR = new CBResize();

function startResizing ( event ) {

  cbR.updatePosition( event );

  cbR.updateView();

}

function removeEvents () {

  $(document).off( 'mousemove', startResizing );

  $(document).off( 'mouseup', removeEvents );

}

function updateCSS ( element, width, height ) {

  element.css({
    width: width,
    height: height
  });

}
