cb.output = {};

(function (exports) {

    var defaults = {
        rows: 10,
        cols: 10,
        pixelSize: 10,
        borderWidth: 1
    };

	function PixelGrid(container, opts) {
	    this.container = container;
	    this.rows = opts.rows || defaults.rows;
	    this.cols = opts.cols || defaults.cols;
	    this.pixelSize = opts.pixelSize || defaults.pixelSize;
	    this.borderWidth = (opts.borderWidth !== void 0) ? opts.borderWidth : defaults.borderWidth;
	    this.pixels = [];
	    
	    for(var i = 0; i<this.rows; i++) {
            this.pixels.push([]);
	        for(var j = 0; j<this.cols; j++) {
	            this.pixels[i].push(this.black);
            }
        }

		this._draw();
	}

	PixelGrid.prototype._draw = function () {
	    var $table = $('<table/>').addClass("pixelGrid");

	    $table.css("height", (this.rows * this.pixelSize + this.rows * this.borderWidth) + "px");
	    $table.css("padding", "0");
	    $table.css("margin", "0");
	    $table.css("border-collapse", "collapse");

	    this.$pixels = [];
	    for (var i = 0; i < this.rows; i++) {
			var $row = $("<tr/>");
			$table.append($row);

			this.$pixels.push([]);
			for (var j = 0; j < this.cols; j++) {
			    var $pixel = $("<td/>");
			    $pixel.css("padding", "0");
			    $pixel.css("margin", "0");
			    $pixel.css("width", this.pixelSize + "px");
			    $pixel.css("height", this.pixelSize + "px");
			    $pixel.css("border", this.borderWidth + "px solid #c0c0c0");

				$row.append($pixel);
				this.$pixels[i].push($pixel);
			}
		}

		$(this.container).append($table);
	};

	PixelGrid.prototype.each = function (fn) {
		for (var i = 0; i < this.rows; i++) {
			for (var j = 0; j < this.cols; j++) {
				fn(this.$pixels[i][j]);
			}
		}
	};

	PixelGrid.prototype.clear = function (color) {
        if (color === void 0) {
            color = this.black;
        }
	    this.each(function ($e) {
		    $e.css('background-color', color);
	    });
		for (var i = 0; i < this.rows; i++) {
			for (var j = 0; j < this.cols; j++) {
				this.pixels[i][j] = color;
			}
		}
	}

	PixelGrid.prototype.setPixel = function (col, row, color) {
        if (color === void 0) {
            color = this.black;
        }
        
        this.pixels[row][col] = color;
	    this.$pixels[row][col].css('background-color', color);
	};
	
	PixelGrid.prototype.black = '#000000';

    exports.PixelGrid = PixelGrid;

})(cb.output);
