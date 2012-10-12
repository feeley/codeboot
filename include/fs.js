function makeCloseButton() {
	return $("<button/>").addClass("close").append("&times;");
}

cp.newTab = function (title) {
	/*
     * <div class="row">
     *   <ul class="nav nav-tabs">
     *     <li class="active"><a href="#">Untitled.js<button class="close">&times;</button></a></li>        
     *   </ul>
     *   <div class="tab-content">
     *     <div class="tab-pane active" id="home">...</div>
     *   </div>
     * </div> 
    */
    
	var $row = $('<div class="row"/>');
	var $nav = $('<ul class="nav nav-tabs"/>');
	
	$tab_label = $('<a href="#"/>').text(title).append(makeCloseButton());
	$nav.append($('<li class="active"/>').append($tab_label));
	$row.append($nav);
	
	var $contents = $('<div class="tab-content"/>');
	$contents.append($('<div class="tab-pane active"/>').text('...'));
	$row.append($contents);
	
	$("#contents").prepend($row);
};

cp.newFile = function () {
    cp.newTab("untitled.js");
};