'use strict';

(function (angular,buildfire) {
  angular
    .module('googleAppsPresentationWidget')
    .controller('WidgetHomeCtrl', ['$scope', 'Buildfire', 'DataStore', 'TAG_NAMES', '$rootScope', 'STATUS_CODE',
      function ($scope, Buildfire, DataStore, TAG_NAMES, $rootScope, STATUS_CODE) {
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        var isAndroid = /(android)/i.test(navigator.userAgent);
        var WidgetHome = this,isInFullScreen=false;
        var frame,fullScreen;
        var browserResized=false,listeners=false;
        var innitOffsetTop=0,innitOffsetLeft=0;
        var titleBarLoaded=true,disableAutoRotate=false,innitHeight;
        /*
         * Fetch user's data from datastore
         */
        WidgetHome.init = function () {
          WidgetHome.success = function (result) {
            if(result.data && result.id) {
              WidgetHome.data = result.data;
              if (!WidgetHome.data.content)
                WidgetHome.data.content = {};
              if (WidgetHome.data.content.mode && WidgetHome.data.content.url && WidgetHome.data.content.mode == 'preview'){
                WidgetHome.data.content.url = WidgetHome.data.content.url.replace('/edit', '/preview');
              }
              else if ((WidgetHome.data.content.mode && WidgetHome.data.content.url && WidgetHome.data.content.mode == 'editable')){
                WidgetHome.data.content.url = WidgetHome.data.content.url.replace('/preview', '/edit');
              }
              WidgetHome.hideShowRotation();
              console.log(">>>>>", WidgetHome.data);
            }
            else
            {
              WidgetHome.data = {
                content: {}
              };
              var dummyData = {url: "https://docs.google.com/presentation/d/1GajPA3eOHYT39vkDj_NX8v0FjiumnBgGtOyIHROyhd8/preview#slide=id.gc6fa3c898_0_0"};
              WidgetHome.data.content.url = dummyData.url;
              WidgetHome.hideShowRotation();
            }
          };
          WidgetHome.error = function (err) {
            if (err && err.code !== STATUS_CODE.NOT_FOUND) {
              console.error('Error while getting data', err);
            }
          };
          DataStore.get(TAG_NAMES.GOOGLE_APPS_PRESENTATION_INFO).then(WidgetHome.success, WidgetHome.error);
        };



        //Refresh web page on pulling the tile bar

        buildfire.datastore.onRefresh(function () {
          var iFrame = document.getElementById("slideFrame"),
            url = iFrame.src,
            hashIndex = url.indexOf("#");

          if(hashIndex !== -1) {
            url = url.substr(0, hashIndex) + "?v=test" + url.substr(hashIndex);
          }
          iFrame.src = url + "";
        });

        window.oniFrameLoad = function(){
          var previousOrientation=2;//2 portrait, 1 landscape
          window.addEventListener("deviceorientation", function(event){
            var xAxis = event.alpha;
            var yAxis = event.beta;
            var oTime;
            console.log(xAxis,yAxis);
            if(xAxis!=null&&yAxis!=null&&!disableAutoRotate)
            if (((yAxis <= 25) && (yAxis >= -25) && (xAxis >= -160)) || (yAxis < -25) && (xAxis >= -20)) {
        
                if (previousOrientation != 1){
                    previousOrientation = 1;
                    clearTimeout(oTime);
                    if(!isInFullScreen)
                      oTime = setTimeout(function(){ WidgetHome.rotate(); }, 200);
                }
        
            } else if ((yAxis > 25) && (xAxis >= -20)){
        
                if (previousOrientation != 2){
                    previousOrientation = 2;
                    clearTimeout(oTime);
                    if(isInFullScreen)
                      oTime = setTimeout(function(){WidgetHome.rotate();}, 200);
                }
            }
          }, true);


            frame= document.getElementById("slideFrame");
            innitOffsetTop=frame.offsetTop;
            innitOffsetLeft=frame.offsetLeft;
            fullScreen = document.getElementById("containerFS");
            fullScreen.style.left = innitOffsetLeft+((isIOS)?300:270)+((isAndroid)?5:0)+"px";
            innitHeight=innitOffsetTop+frame.getBoundingClientRect().height+((isIOS)?0:3)-30+"px"
            fullScreen.style.top = innitHeight;
            //fullScreen.style.visibility="visible";
            var rotatedWidth;
            var rotatedHeight;
            var time;

            if(!listeners)
            window.addEventListener("resize",function(){
              if(titleBarLoaded){
                document.body.style.setProperty("background-color", "323232", "important");
                if(isInFullScreen){
                  browserResized=true;
                  fullScreen.style.visibility="hidden";
          
                  rotatedWidth = window.innerHeight;
                  rotatedHeight = window.innerWidth;
                  frame.style.width = (rotatedWidth+5)+"px";
                  frame.style.maxWidth = (rotatedWidth+5)+"px";
                  frame.style.height = rotatedHeight+"px";
                  
                  frame.style.left = (((rotatedHeight/2)-rotatedWidth/2)-2)+"px";
                  frame.style.top = ((rotatedHeight/2)-rotatedWidth/2)*(-1)+"px";

                  fullScreen.style.left = innitOffsetLeft-((isAndroid)?0:1)+"px";
                  fullScreen.style.top = innitOffsetTop+((isIOS)?300:268)+((isAndroid)?5:0)+"px";
                  clearTimeout(time);
                  time = setTimeout(function(){ fullScreen.style.visibility="visible"; }, 500);
                  
                }else{
                  fullScreen.style.left = innitOffsetLeft+((isIOS)?300:270)+((isAndroid)?5:0)+"px";
                  innitHeight=frame.offsetTop+frame.getBoundingClientRect().height-30+"px";
                  fullScreen.style.top = innitHeight;  
                }
            }
            },true);

            if(!listeners)
            fullScreen.addEventListener('click', function(){
              disableAutoRotate=true;
              WidgetHome.rotate();
            });
            listeners=true;
        }


        WidgetHome.hideShowRotation = function()
        {
          var xmlHttp = new XMLHttpRequest();
          var time;
          xmlHttp.onreadystatechange = function() { 
            if(xmlHttp.status==200&&WidgetHome.data.content.url.includes('/preview')){
              time = setTimeout(function(){ document.getElementById("containerFS").style.visibility="visible"; }, 400);
              
            }else if(xmlHttp.status>=400||WidgetHome.data.content.url.includes('edit')){
              if(isInFullScreen){WidgetHome.rotate();isInFullScreen=false;}
              time = setTimeout(function(){ document.getElementById("containerFS").style.visibility="hidden"; }, 400);
            }
          }
          try{
            xmlHttp.open("GET", WidgetHome.data.content.url, true); // true for asynchronous 
            xmlHttp.send(null);
          }catch(err){
            if(isInFullScreen){WidgetHome.rotate();isInFullScreen=false;}
            document.getElementById("containerFS").style.visibility="hidden";
          }
        }

        var goBack = buildfire.navigation.onBackButtonClick ;
        buildfire.navigation.onBackButtonClick = function(){
          if(isInFullScreen){WidgetHome.rotate();disableAutoRotate=true;}
          else goBack();
        }
        WidgetHome.rotate = function(){
          var rotatedWidth;
          var rotatedHeight;
          document.body.style.setProperty("background-color", "black", "important");
            if(!isInFullScreen){
              buildfire.appearance.titlebar.hide();
              fullScreen.style.paddingLeft="3px";
              document.getElementById("fullScreen").classList.remove("fullScreen");
              document.getElementById("fullScreen").classList.add("exitFullScreen");
              rotatedWidth = window.innerHeight;
              rotatedHeight = window.innerWidth;
              frame.style.webkitTransform = 'rotate(90deg)'; 
              frame.style.mozTransform = 'rotate(90deg)'; 
              frame.style.msTransform = 'rotate(90deg)'; 
              frame.style.oTransform = 'rotate(90deg)'; 
              frame.style.transform = "rotate(90deg)";
              fullScreen.style.visibility="hidden";
      
              frame.style.width = (rotatedWidth+5)+"px";
              frame.style.maxWidth = (rotatedWidth+5)+"px";
              frame.style.height = rotatedHeight+"px";
              frame.style.position = "absolute";
              frame.style.left = (((rotatedHeight/2)-rotatedWidth/2)-2)+"px";
              frame.style.top = ((rotatedHeight/2)-rotatedWidth/2)*(-1)+"px";

              fullScreen.style.left = innitOffsetLeft-((isAndroid)?0:1)+"px";
              fullScreen.style.top = innitOffsetTop+((isIOS)?300:268)+((isAndroid)?5:0)+"px";
              fullScreen.style.bottom = "";
              fullScreen.style.right = "";
              isInFullScreen=true;
            }else{
              titleBarLoaded=false;
              buildfire.appearance.titlebar.show();
              fullScreen.style.paddingLeft="";
              document.getElementById("fullScreen").classList.remove("exitFullScreen");
              document.getElementById("fullScreen").classList.add("fullScreen");
              frame.style.webkitTransform = 'rotate(0deg)'; 
              frame.style.mozTransform = 'rotate(0deg)'; 
              frame.style.msTransform = 'rotate(0deg)'; 
              frame.style.oTransform = 'rotate(0deg)'; 
              frame.style.transform = "rotate(0deg)";
              fullScreen.style.visibility="hidden";
              setTimeout(function(){fullScreen.style.visibility="visible"; titleBarLoaded=true;}, 500);
      
              frame.style.width = "100%";
              frame.style.maxWidth = "100%";
              frame.style.height = "100%";
              frame.style.position = "relative";
              frame.style.left = "";
              frame.style.top = "";

              fullScreen.style.left = innitOffsetLeft+((isIOS)?300:270)+((isAndroid)?5:0)+"px";
              if(browserResized){
                innitHeight=frame.offsetTop+frame.getBoundingClientRect().height-80+"px";
                browserResized=false;
              }
              fullScreen.style.top = innitHeight;
              fullScreen.style.bottom = "";
              fullScreen.style.right = "";
              isInFullScreen=false;
            }
        }

        WidgetHome.onUpdateCallback = function (event) {
          if (event && event.tag === TAG_NAMES.GOOGLE_APPS_PRESENTATION_INFO) {
            WidgetHome.data = event.data;
            if (WidgetHome.data && !WidgetHome.data.content)
              WidgetHome.data.content = {};
            if (WidgetHome.data.content.mode && WidgetHome.data.content.url && WidgetHome.data.content.mode == 'preview')
              {
                WidgetHome.data.content.url = WidgetHome.data.content.url.replace('/edit', '/preview');
              }
            else if ((WidgetHome.data.content.mode && WidgetHome.data.content.url && WidgetHome.data.content.mode == 'editable')){
              WidgetHome.data.content.url = WidgetHome.data.content.url.replace('/preview', '/edit');
            }
            WidgetHome.hideShowRotation();
          }
        };

        DataStore.onUpdate().then(null, null, WidgetHome.onUpdateCallback);

        WidgetHome.init();

      }])
    .filter('returnUrl', ['$sce', function ($sce) {
      return function (url) {
        return $sce.trustAsResourceUrl(url);
      }
    }]);

})(window.angular, window.buildfire);
