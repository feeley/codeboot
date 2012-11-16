(function ($) {
    function getElementBounds($element) {
        var offset = $element.offset();
        return {
            left: offset.left,
            top: offset.top,
            right: offset.left + $element.width(),
            bottom: offset.top + $element.height()
        };
    }

    function overlap(b1, b2) {
        if (b1.right < b2.left) return false;
        if (b1.left > b2.right) return false;
        if (b1.top > b2.bottom) return false;
        if (b1.bottom < b2.top) return false;

        return true;
    }

    $.fn.getBounds = function () {
        return getElementBounds(this);
    };

    $.fn.isInView = function($container) {
        if (!$container) $container = $("body");
        var $child = this;

        if (!$child.is(":visible")) {
            return false;
        }

        var $parent = $child.parent();
        while (true) {
            if (!$parent) break;

            var cBounds = getElementBounds($child);
            var pBounds = getElementBounds($parent);
            if (!overlap(cBounds, pBounds)) {
                return false;
            }

            if ($parent.get(0) === $container.get(0)) break;

            $parent = $parent.parent();
        }

        return true;
    };
})(jQuery);