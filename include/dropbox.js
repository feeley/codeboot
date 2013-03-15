function cb_refresh2(){
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
	console.log('Ready state : ' + http.readyState);
	console.log('http status : ' + http.status);
	if (http.readyState == 4) {
            if (http.status == 200) {
		console.log('WORKED');
		
		console.log('Response text : ' + http.responseText);
		console.log(http);
            }
	
	}
    }
}

function cb_refreshing(){
    var file;
    // $.ajax({
    // 	url: "http://localhost:3000/test/get",
    // 	type: "GET",
    // 	async: false,
    // 	success: function(data){
    // 	    file = data;
    // 	}
    // });
    // console.log(file);
    $.get(
        'http://localhost:3000/test/get',
        function(data, status, http) {
	    console.log("data " + data);
	    console.log("status " + status);
	    console.log("http " + http);
            // $.post(
            //     '/auth_validate_username/', 
            //     { 'username': username }, 
            //     function(data) { 
            //         $('.error_message').html(data); 
            //     }
            // );
        },
	"text"
    );


}


function cb_refresh() {
    $.ajax({
        url: "http://localhost:3000/test/get",
        type: "GET",
        async: true,
        success: function(data){
            alert("Success! " + data);
	    refresh_local_files("testfact.js", data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Failed! " + textStatus + " (" + errorThrown + ")");
        }
    });
}

function refresh_local_files(filename, content){
    // var filename = "testfact.js";
    var file = new CPFile(filename, content);

    cb.fs.addFile(file);

    cb.addFileToMenu(file);
    cb.newTab(file);
    return filename;

}