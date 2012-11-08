<?php
    if ($_POST["url"]) {
        $url = $_POST["url"];
    } else {
        $url = urldecode($_GET["url"]);
    }

    $request = '{"longUrl": "' . $url . '"}';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyBgiTFwHKgxC9xmrVzBqG4JjG_MlT260T8");
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $request);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));

    $output = curl_exec($ch);
    curl_close($ch);

	header("Content-Type", "application/json");
    header("Content-Length: " . strlen($output));
    echo $output;
?>
