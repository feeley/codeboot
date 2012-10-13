function makeCloseButton() {
	return $("<button/>").addClass("close").append("&times;");
}

cp.newTab = function (title) {
	/*
     * <div class="row">
     *   <ul class="nav nav-tabs">
     *     <li class="active"><a href="#">Untitled.js<button class="close">&times;</button></a></li>
     *   </ul>
     *   <pre class="tab-content"></pre>
     * </div>
    */

	var $row = $('<div class="row"/>');
	var $nav = $('<ul class="nav nav-tabs"/>');

	$tab_label = $('<a href="#"/>').text(title).append(makeCloseButton());
	$nav.append($('<li class="active"/>').append($tab_label));
	$row.append($nav);

	var $pre = $('<pre class="tab-content"/>');
	$row.append($pre);

	$("#contents").prepend($row);

	var editor = createCodeEditor($pre.get(0));
	cp.fileEditors.unshift(editor);

	var $file_item = $('<li/>');
	var $file_link = $('<a href="#"/>');
	$file_link.text(title);
	$file_item.append($file_link);
	$("#file-list").prepend($file_item);
};

cp.newFile = function () {
    cp.newTab("untitled.js");
};