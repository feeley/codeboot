<?php
    if ($_POST["filename"]) {
        $filename = $_POST["filename"];
        $content = $_POST["content"];
    } else {
        $filename = $_GET["filename"];
        $content = $_GET["content"];
    }

    header('Content-Type: application/download');
    header('Content-Disposition: attachment; filename="' . $filename. '"');
    header("Content-Length: " . strlen($content));

    echo $content;
?>
