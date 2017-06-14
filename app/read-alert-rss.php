<?php

include '/web/gamut/kint/Kint.php';

// Get RAVE RSS/XML feed
//$xml = ("http://www.getrave.com/rss/vassar/channel2");
$xml = ("/web/sites/depts/alert/web/app/xml/alert.xml");

//d($xml);

$timeForAllClear = 60 * 60 * 2; 
$timeForAllClear = 60; 

//$writeToArchive = false;

//do{
//for ($i=0; $i < 12; $i++) {

    // Convert feed into object
    $RAVERSS = getRAVERSS($xml);

    // Show feed data
    /*
    echo <<<HTML
        <h3>RAVE feed</h3><p><a href="{$RAVERSS->link}">{$RAVERSS->title}</a><br>{$RAVERSS->description}<br>{$RAVERSS->pubDate}<br>{$RAVERSS->dcDate}</p>
HTML;
*/
    // Get incident file
    $fileAlertIncident = new SplFileInfo(__DIR__ . '/json/alert.json');
    $fileAlertArchive = new SplFileInfo(__DIR__ . '/json/alert-archive.json');

    $now = new DateTime();
    $timeZone = new DateTimeZone('America/New_York');
    $now->setTimezone($timeZone);    
    $now = intval($now->format('U'));

    // If we have a new alert
    if(isNewAlert(getFileContents($fileAlertIncident), $RAVERSS->unixDate)){
        //d("IS NEW ALERT");
        echo "<p>IS NEW ALERT\n";
        // Construct JSON string
        $RSSContent = <<<JSON
        [{"title":"{$RAVERSS->title}","description":"{$RAVERSS->description}","link":"{$RAVERSS->link}","unixDate":"{$RAVERSS->unixDate}","pubDate":"{$RAVERSS->pubDate}","dcDate":"{$RAVERSS->dcDate}","date":"{$RAVERSS->date}","time":"{$RAVERSS->time}"}]
JSON;

        $RSSContent = trim($RSSContent);
        
       // d($RSSContent);
    //    d($fileAlertIncident);
        
//        echo "NOW = " . $now . "\n";
        
        d($RAVERSS->title);
        d(stripos(strtolower($RAVERSS->title),'campus emergency has passed'));
        d($now);
        d($RAVERSS->unixDate);
        d($now - $RAVERSS->unixDate);
        d("RAVERSS->unixDate");
        d(date('D, j M Y  g:i:s a', $RAVERSS->unixDate));
        d("NOW");
        d(date('D, j M Y  g:i:s a', $now));
        d($timeForAllClear);
        /*
        if(
            stripos(strtolower($RAVERSS->title),'campus emergency has passed') !== false &&
            $now - $RAVERSS->unixDate > $timeForAllClear
          ){
            //d(getFileContents($fileAlertIncident));
            writeToArchiveFile($fileAlertArchive, getFileContents($fileAlertIncident));
            file_put_contents($fileAlertIncident->getRealPath(), '');
        }
        else{
        */
        if(
            stripos( strtolower( $RAVERSS->title ), 'campus emergency has passed' ) === false ||
            stripos( strtolower( $RAVERSS->title ), 'campus emergency has passed' ) !== false &&
            ($now - $RAVERSS->unixDate) < $timeForAllClear
        ){  
            d("Write to file");
            writeToIncidentFile($fileAlertIncident, $RSSContent);
            //$writeToArchive = true;
        }
    }
 else{
    // d("ELSE");
    
    /*
    d("ELSE");
     d($timeForAllClear);
     d($now);
     d($RAVERSS->unixDate);
     d(($now - $RAVERSS->unixDate));
     d($RAVERSS->title);
     d($writeToArchive);
    */
     /*
    echo "ELSE\n";
     echo "timeForAllClear = " .$timeForAllClear . "\n";
     echo "now = " . $now . "\n";
     echo "RAVERSS->unixDate = " . $RAVERSS->unixDate . "\n";
     echo "now - $RAVERSS->unixDate = " . ($now - $RAVERSS->unixDate) . "\n";
     echo "$RAVERSS->title = " . $RAVERSS->title;
     echo "writeToArchive = " . $writeToArchive . "\n";
    */
     if(
        stripos( strtolower( $RAVERSS->title ), 'campus emergency has passed' ) !== false &&
        ($now - $RAVERSS->unixDate) > $timeForAllClear //&&
        //$writeToArchive
     ){
        // d("HERE");
        // echo "HERE\n";
        // d("ARCHIVE");
        //d(getFileContents($fileAlertIncident));
        $incidentCantents = getFileContents( $fileAlertIncident );
        if($incidentCantents !== ''){
            writeToArchiveFile( $fileAlertArchive, $incidentCantents);
            file_put_contents( $fileAlertIncident->getRealPath(), '' );
        }
        //$writeToArchive = false;
    }    
}
    //sleep(5);
//}
//} while (true);

function getNodeValue ($node, $element)
{
    $node = $node->getElementsByTagName($element)->item(0);
    if ($node->hasChildNodes()){
        return $node->childNodes->item(0)->nodeValue;
    }
    else{
        return '';   
    }
}

function getRAVERSS($xml)
{
    $xmlDoc = new DOMDocument();
    $xmlDoc->load($xml);

    $channel = $xmlDoc->getElementsByTagName('channel')->item(0);
    $item = $xmlDoc->getElementsByTagName('item');
    
    /*
    $channelTitle = getNodeValue ($channel, 'title');
    $channelLink = getNodeValue ($channel, 'link');
    $channelDesc = getNodeValue ($channel, 'description');
*/
    $itemTitle = getNodeValue ($item->item(0), 'title');
    $itemLink = getNodeValue ($item->item(0), 'link');
    $itemDesc = getNodeValue ($item->item(0), 'description');
    
    $itemDate = null;
    $dcDate = null;
    foreach($xmlDoc->getElementsByTagName('date') as $d){
        $dcDate = $d->nodeValue;
    }
    
    $newDate = new DateTime($dcDate);
    $timeZone = new DateTimeZone('America/New_York');
    $newDate->setTimezone($timeZone);    
    $itemDate = $newDate->format('D, j M Y  g:i:s a');
    
    echo $itemTitle . "\n" . $itemDesc . "\n" . $itemDate . "\n\n";

    return new RAVERSS ($itemTitle, $itemLink, $itemDesc, $itemDate, $dcDate);
}

class RAVERSS
{
    public function __construct ($title, $link, $description, $pubDate, $dcDate)
    {
        $this->title = $title;
        $this->link = $link;
        $this->description = $description;
        $this->pubDate = $pubDate;
        $this->unixDate = strtotime($pubDate);
        $this->dcDate = $dcDate;
        $this->time = date('g:i:s a', $this->unixDate);
        $this->date = date('M j, Y', $this->unixDate);
        $this->date = date('M j, Y', $this->unixDate);
    }
}

function getFileContents($file)
{
    if($file->isReadable()){
       return trim(file_get_contents($file->getRealPath()));
    }
    else{
        return '';
    }
}

function isNewAlert($content, $date)
{        
    // $date integer — unix date from feed
    // $content string — content of incident file
    // Compare date of alert in feed with latest alert in incident file ($fileAlertIncident)
    if ($content !== ''){
        $content = json_decode($content, true);
        //d($content);
        foreach($content as $a){
            //d(intval($a['unixDate']));
            if(intval($a['unixDate']) === $date){
                return false;
            }
        }
        return true;
    }
    return true;
}

function writeToIncidentFile($fileWrite, $content)
{
    //d("WRITE TO FILE " . $fileWrite);
    //d($content);
   // d($fileWrite->isWritable());
    if($fileWrite->isWritable()){
        $readContent = trim($content, '[]');
        $writeContent = getFileCOntents($fileWrite);
        //d($writeContent);
        $comma = ($writeContent === '')
            ? ''
            : $comma = ',';
        $writeContent = trim($writeContent, '[]');
        $writeContent = "[" . $readContent . $comma . $writeContent ."]";
      //  d("1");
        //d($writeContent);
        $writeContent = preg_replace(array('/[\t\r\n]+/','/ {2,}/'), '', $writeContent);
        //d("2");
       // d($writeContent);
    //    d($fileWrite->getRealPath());
        $test = file_put_contents($fileWrite->getRealPath(), $writeContent);
      //  d($test);
    }
}

function writeToArchiveFile($fileWrite, $content)
{
    if($content !== ''){
        if($fileWrite->isWritable()){
            $writeContent = getFileCOntents($fileWrite);

            $writeContentJSON = json_decode($writeContent);
            $contentJSON = json_decode($content);

            $index = count((array)$writeContentJSON) + 1;
            if ($writeContentJSON === null){
                $content = array($index => $contentJSON);
            }
            else{
                $writeContentJSON->$index = $contentJSON;
                $content = $writeContentJSON;
            }
            file_put_contents($fileWrite->getRealPath(), json_encode($content));
        }
    }
}


/*
function writeToIncidentFile($fileWrite, $content)
{
    if($fileWrite->isWritable()){
        $writeContent = getFileCOntents($fileWrite);

        $writeContentJSON = json_decode($writeContent);
        $contentJSON = json_decode($content);

        
        file_put_contents($fileWrite,json_encode($content));
    }
}
*/
