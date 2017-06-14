(function()
{   
    "use strict";
    
    // determine server environment
    var 
        URL = window.location.href,
        vassarDomain = 'vassar.edu',
        environment = getEnvironment(),
        // Get alert site’s subdomain
        alertURL = 'alert.' + vassarDomain + environment,
        // Get HTTP request Object
        httpRequest = new XMLHttpRequest(),
        // initialize timestamp to zero — always check for an alert on first call
        dateOfAlertCached = unixToDateTime(new Date(0).getTime()/1000),
        // Check if we are on the alerts home page
        currentTime = Math.round(new Date().getTime()/1000),
        //timeForAllClear = 60 * 60 * 2,
        timeForAllClear = 60,
        alertPath = '//' + alertURL,
        replace = '(http(s)?:' + alertPath + '(\/index.html|\/)?)',
        re = new RegExp(replace,"g"),
        alertHomePage = (URL.replace(re, '') === ('')) ? true
            : false;
                         
        console.log("environment = " + environment);
        console.log("alertURL = " + alertURL);
        console.log("alertPath = " + alertPath);
        console.log("URL = " + URL);
        console.log("alertHomePage = " + alertHomePage);
//                                    (URL.indexOf('/' + alertURL + '/') !== -1) ? true
  //              : false,

    // Check for alert on page load
    makeRequest();

    // Now check for alert every 5 seconds
    setInterval(function() {
        makeRequest();
    }, 5000);

    function getEnvironment()
    {
        var findString = '.' + vassarDomain + '.';
        
        environment = URL.indexOf(findString);

        // This is Production
        if(environment === -1){
            environment = '';
        }
        // This is NOT Production
        else{
            // Grab URL after vassar.edu
            environment = URL.substr(environment + findString.length - 1);

            // If a forward slash exists, use URL up to that
            // Otherwise, we already have the URL we need
            var slash = environment.indexOf('/');
            if(slash !== -1){
                environment = environment.substring(0, slash);
            }
        }
        return environment;
    }
    
    // Check contents of alert.json
    function makeRequest()
    {        
        // If request object creation failed
        if (!httpRequest) {
            //alert('Giving up :( Cannot create an XMLHTTP instance');
            return false;
        }
        else{
            // set callback for request
            httpRequest.onreadystatechange = checkForNewAlert;
            // initialize request 
            httpRequest.open('GET', alertPath + '/app/json/alert.json?' + currentTime);
            // send request
            httpRequest.send();
        }
    }

    
    function checkForNewAlert()
    {                
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {                
                var 
                    dateOfAlert = unixToDateTime(Date.parse(httpRequest.getResponseHeader("Last-Modified"))/1000),
                    DOMAlert = document.getElementsByClassName('alert')[0],
                    //bodyContainer = document.getElementsByClassName('bodyContainer')[0],
                    body = document.body;

                // First, check for a new alert according to date of JSON file
                // We fall into this case on page load since dateOfAlertCached is initialized to “0” 
                if(dateOfAlert > dateOfAlertCached){
                    var 
                        // Create link element for alert CSS
                        alertCSS = document.createElement('link'),
                        // Find first existing CSS link tag
                        existingCSS = document.getElementsByTagName('link')[0];
                    // Assign values to alert CSS link attributes
                    alertCSS.rel = "stylesheet";
                    alertCSS.href = alertPath + "/app/alert.css";
                    // inject alert CSS before existing CSS
                    existingCSS.parentNode.insertBefore(alertCSS, existingCSS);

                    // reset cached date to date of current alert 
                    dateOfAlertCached = dateOfAlert;
                  
                    // check if we have a JSON string
                    if(IsJsonString(httpRequest.responseText)){
                        
                        // get JSON string
                        var data = JSON.parse(httpRequest.responseText);
                        
                        // If there is content
                        if(data){
                            var 
                                // Get the first - and only - node
                                myAlert = data[0],
                                // Initialize content for new alert
                                newAlertContent = '',
                                // define class for current alert
                                currentClass = 'u-AlertListItem--current',
                                // get current alert from DOM
                                currentAlert = document.getElementsByClassName(currentClass)[0],
                                // create a div for the new alert
                                newAlert = document.createElement("div"),
                                currentTime = Math.round(new Date().getTime()/1000),
                                timeSinceLastAlert = currentTime - myAlert.unixDate;
                                //myAlertUnixDate = myAlert.unixDate;
                                                        
                            /*
                            console.log("myAlert = " + myAlert);
                            console.log("myAlert.unixDate = " + myAlert.unixDate);
                            console.log("unixToDateTime(myAlert.unixDate) = " + unixToDateTime(myAlert.unixDate));
                            console.log("currentTime = " + currentTime);
                            console.log("unixToDateTime(currentTime) = " + unixToDateTime(currentTime));
                            console.log("timeSinceLastAlert = " + timeSinceLastAlert);
                            console.log("timeForAllClear = " + timeForAllClear);
                            */
                            
                            if(
                                myAlert.title.toLowerCase().indexOf('campus emergency has passed') !== -1 &&
                                timeSinceLastAlert > timeForAllClear
                              ){
                                emptyOrReset(alertHomePage);
                            }
                            else{
                                // If we’re not on the Alert home page
                                if(!alertHomePage){
                                    // assign class of “alert” the div containing the alert
                                    // Alert hompage has a div with this class already 
                                    newAlert.classList.add('alert');
                                }

                                // Get first time element - from current alert
                                var updated = document.getElementsByClassName('updated')[0];

                                console.log("typeof updated = " + typeof updated);
                                // get the datetime attribute of the current alert
                                var currentAlertTime = 
                                    (typeof updated !== 'undefined') ? Date.parse(updated.getAttribute('datetime'))
                                    : Math.round(new Date().getTime()/1000);
                                /*
                                console.log("currentAlertTime = " + currentAlertTime);
                                console.log("myAlert.dcDate = " + myAlert.dcDate);
                                console.log("Date.parse(myAlert.dcDate) = " + Date.parse(myAlert.dcDate));
                                */
                                // If the current alert has the same datetime stamp as the “new” alert
                                if(currentAlertTime === Date.parse(myAlert.dcDate)){
                                    // We already are displaying this alert, stop execution
                                    // This is not a new alert according to the datetime stamp of the alert
                                    return;
                                }

                                // Content of new alert
                                //newAlert.classList.add('article', 'hentry', 'hnews', 'item', 'u-AlertListItem', currentClass)
                            
                                var link = (alertHomePage) ? ''
                                    : '<p class="Alert__siteLinkC"><a class="Alert__siteLink" href="' + alertPath + '">See all updates</a></p>';
                                newAlertContent += '<div class="article hentry hnews item u-AlertListItem ' + currentClass + '">\n';
                                newAlertContent += 
                                '<article>\n' + 
                                    '<h3 class="entry-title u-AlertListItem__title">' + myAlert.title + '</h3>\n' +
                                    '<p class="entry-summary u-AlertListItem__summary">' + myAlert.description + '</p>\n' +
                                    '<b class="u-AlertListItem__label u-AlertListItem__label--dateline">\n' +
                                        '<b class="time u-AlertListItem__label--dateline__postedDate">\n' +
                                        '<time class="updated" datetime="' + myAlert.dcDate + '" pubdate="">\n' + myAlert.time + '<br>' + myAlert.date + '</time></b>\n' +
                                    '</b>\n' +
                                    link +
                                '</article>\n';
                                newAlertContent += '</div>\n';

                                newAlertContent = 
                                '<div class="u-AlertGroup"><div class="u-AlertList" id="AlertList">' + newAlertContent + '</div></div>';

                                // For pages other than the alert home page, we need a banner for the alert
                                if(!alertHomePage){
                                    newAlertContent = '<div class="u-lHeaderAlert"><b class="u-Masthead__vassarAlert"><b class="u-Masthead__IDAlert"><img src="' + alertPath + '/assets/images/vassar-logo.png" width="2337" height="416" alt="Vassar College"></b></b><b class="u-Masthead__siteNameAlert">Emergency Alert</b></div>' +
                                    newAlertContent;
                                }

                                // Set content of new alert
                                newAlert.innerHTML = newAlertContent; 

                                // If there is an alert already displayed and we’re on the alert site’s home page
                                if(currentAlert && alertHomePage){
                                    console.log("currentAlert && alertHomePage");
                                    currentAlert.classList.remove(currentClass);   
                                    currentAlert.parentNode.insertBefore(newAlert, currentAlert);
                                }
                                // This is the first alert to be listed
                                else{
                                    // alert’s home page
                                    if(alertHomePage){
                                        //var articleList = 'alert';
                                        
                                        // Append alert to alert div
                                        var articleList = document.getElementsByClassName('alert')[0];                         
                                        if(typeof articleList !== 'undefined'){
                                            articleList.appendChild(newAlert);
                                        }
                                    }
                                    // Not alert’s home page
                                    else{
                                        var 
                                            uArticleGroup = document.createElement('div'),
                                            //articleList =  'bodyContainer',
                                            wrapper = document.createElement('div'), 
                                            children = body.children;

                                        // If alert exists, remove it
                                        DOMAlert = document.getElementsByClassName('alert')[0];                             
                                        if(typeof DOMAlert !== 'undefined'){
                                            body.removeChild(DOMAlert);
                                            DOMAlert = document.createElement('div');
                                        }

                                        uArticleGroup.classList.add('u-AlertGroup');

                                        wrapper.setAttribute('class','bodyContainer');
                                        body.appendChild(wrapper);

                                        while(children.length > 1){
                                            wrapper.appendChild(children[0]);
                                            children = body.children;
                                        }
                                        // insert new alert above bodyContainer
                                        //articleList = document.getElementsByClassName(currentClass)[0];                 
                                        var articleList2 = document.getElementsByClassName('bodyContainer')[0];
                                        //console.log("articleList2 = " + articleList2);
                                        if(typeof articleList2 !== 'undefined'){
                                            articleList2.parentNode.insertBefore(newAlert, articleList2);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // We could archive in this case
                    // NOT a JSON string
                    else{                        
                        emptyOrReset(alertHomePage);
                    }
                }
                else{
                    var updated = document.getElementsByClassName('updated')[0];
                    console.log("typeof updated = " + typeof updated);
                    
                    // If there is already an alert showing
                    if(typeof updated !== 'undefined'){
                        var 
                            currentTime = Math.round(new Date().getTime()/1000),
                            currentAlertTime = Math.round(Date.parse(updated.getAttribute('datetime'))/1000),
                            timeSinceLastAlert = currentTime - currentAlertTime;
                        
                        console.log("currentTime = " + currentTime);
                        console.log("currentAlertTime = " + currentAlertTime);
                        console.log("timeSinceLastAlert = " + timeSinceLastAlert);
                        var title = document.getElementsByClassName('u-AlertListItem__title')[0];
                        console.log("title.innerHTML = " + title.innerHTML);
                        if(typeof title !== 'undefined'){
                            if(
                                title.innerHTML.toLowerCase().indexOf('campus emergency has passed') !== -1 &&
                                timeSinceLastAlert > timeForAllClear
                            ){
                                emptyOrReset(alertHomePage);
                            }
                        }
                    }
                }
            } 
            else {
                //alert('There was a problem with the request.');
            }
        }
    }

    function emptyOrReset(alertHomePage)
    {
        var articleList = (alertHomePage) ? 'alert'
            : 'bodyContainer';

        articleList = document.getElementsByClassName(articleList)[0];

        if(!alertHomePage){
            var DOMAlert = document.getElementsByClassName('alert')[0];
            if(typeof DOMAlert !== 'undefined'){
                DOMAlert.parentNode.removeChild(DOMAlert);
            }
            if(articleList){
                var children = articleList.children;
                if(typeof children !== 'undefined'){
                    while(children.length > 0){
                        document.body.appendChild(children[0]);
                        children = articleList.children;
                    }
                }
                if(typeof articleList !== 'undefined'){
                    articleList.parentNode.removeChild(articleList);
                }
            }
        }
        else{
            articleList.innerHTML = '';
        }
    }
        
    function IsJsonString(str) {
        try {
            JSON.parse(str);
        } 
        catch (e) {
            return false;
        }
        return true;
    }

    function unixToDateTime(unixTimeStamp)
    {
        var 
            //ESTOffset = -5,
            //offsetDate = unixTimeStamp/1000 + (ESTOffset * 3600), 
            months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            date = new Date(unixTimeStamp*1000),
            year = date.getFullYear(),
            month = months_arr[date.getMonth()],
            day = date.getDate(),
            hours = date.getHours(),
            minutes = "0" + date.getMinutes(),
            seconds = "0" + date.getSeconds(),
            meridian = 'pm';
            
        if(hours - 12 > 0){
            hours = hours - 12;
        }
        else{
            meridian = 'am';    
        }
         // Display date time in MM-dd-yyyy h:m:s format
         return month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)+' '+meridian;
    }
})();
/*
    //timeSinceLastAlert = Math.round(currentTime - pageLoadTime);

/* 
var 
    domtimeSinceLastAlert = document.getElementById('timeSinceLastAlert'),
    seconds = timeSinceLastAlert,
    minutes = Math.floor(timeSinceLastAlert/60),
    hours = Math.floor(minutes/60);

console.log("seconds = " + seconds);
console.log("minutes = " + minutes);

if(seconds === 0 || seconds > 59){
    seconds = '';
}
else if(seconds === 1){
    seconds = ' 1 second';
}
else{
    seconds = ' ' + seconds + ' seconds';
}

switch(minutes){ 
    case 0:
        minutes = '';
        break;
    case 1:
        minutes = ' 1 minute';
        break;
    default:
        minutes = minutes + ' minutes';
}

switch(hours){ 
    case 0:
        hours = '';
        break;
    case 1:
        hours = ' 1 hours';
        break;
    default:
        hours = hours + ' hours';
}

domtimeSinceLastAlert.innerHTML = hours + minutes + seconds + ' ago';  
*/