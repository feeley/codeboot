cp.output = {};
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
	    this.borderWidth = opts.borderWidth || defaults.borderWidth;

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
			    $pixel.css("border", this.borderWidth + "px solid #a0a0a0");

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

	PixelGrid.prototype.clear = function () {
		this.each(function ($e) {
			$e.css('background-color', 'transparent');
		});
	}

	PixelGrid.prototype.setPixel = function (row, col, color) {
        if (!color) color = "black";
		this.$pixels[row][col].css('background-color', color);
	};

	PixelGrid.prototype.clearPixel = function (row, col, color) {
		this.$pixels[row][col].css('background-color', 'transparent');
	};

    exports.PixelGrid = PixelGrid;
})(cp.output);
