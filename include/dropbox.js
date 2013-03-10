function cb_refresh(){
    console.log('refreshing');
    var http =new XMLHttpRequest();
    // http.onreadystatechange = function(){
    // 	if(http.readyState == 4){
    // 	    console.log(http.responseText);
    // 	}
    // }

    http.open("GET","http://localhost:3000/test/get",true);
    // http.open("GET", "http://127.0.0.1:3000/test/get", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  
    http.onreadystatechange = handleReadyStateChange;
    http.send(null);
    console.log('refreshed');
    console.log(http);

    function handleReadyStateChange() {
	console.log('on ready state change');
	console.log('ready state changed : ' + http.readyState);
	// document.getElementById("response").innerHTML = http.responseText;
	
	if (http.readyState == 4) {
            if (http.status == 200) {
		document.getElementById("response").innerHTML=http.responseText;
		console.log('ready state changed');
		
		console.log('Response text : ' + http.responseText);
		console.log(http);
            }
	    else
		console.log('wrong status' + http.status);
	}
	else
	    console.log('wrong state' + http.readyState);
	
    }
}

function cb_refreshing(){
    var file;
    $.ajax({
	url: "http://localhost:3000/test/get",
	type: "GET",
	async: false,
	success: function(data){
	    file = data;
	}
    });
    console.log(file);


}