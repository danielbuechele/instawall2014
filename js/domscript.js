var server;
var reload_timer;
var animation_timer;
var displayed = [];
var fromTop10 = false;
var newImageTime = 3000;
var feed = new Instafeed({
    get: 'tagged',
    tagName: 'kult2014',
    clientId: 'f277c99d618f4baf863906716c305c83',
    resolution: 'standard_resolution',
    useHttp: true,
    sortBy: 'most-recent',
    mock: true,
    limit: 60,
    success: function (data) {loadImages(data);}
});

$(function(){
	
	db.open( {
	    server: 'instawall',
	    version: 1,
	    schema: {
	        images: {
	            key: { keyPath: 'id'},
	            // Optionally add indexes
	            indexes: {
	                created_time: { }
	            }
	        }
	    }
	} ).done( function ( s ) {
	    server = s;
	    triggerAnimation();
	} );
	
	feed.run();
	reload_timer = setInterval(function () {
    	feed.run();
	}, 30000);

});

function triggerAnimation() {
    console.log("trigger animation");
    
    if (typeof animation_timer=="undefined") {
        animation_timer = setInterval(function () {
            triggerAnimation();
        }, newImageTime);
    }
    
    if (displayed.length==0) {
        server.images.query('created_time')
                     .lowerBound( 0 )
                     .desc()
                     .execute()
                     .done( function ( results ) {
            for (i=0;i<$(".photo").length;i++) {
                setPhoto(results[i], i);
            }
        }); 
    }
    
    frames = $(".photo").sort(function() { return 0.5 - Math.random() });
        
    server.images.query('created_time')
    .lowerBound( 0 )
    .desc()
    .filter(function (image) { 
        for (i=0;i<displayed.length;i++) {
            if (displayed[i]==image.id) return false;
        }
        return true;
    })
    .execute()
    .done( function ( results ) {
        if (fromTop10) {
            i = getRandomInt(0,9);
            j = getRandomInt(0,9);
        } else {
            i = getRandomInt(0,results.length);
            j = getRandomInt(0,9);
        }
        setPhoto(results[i],j); 
    });
    
    fromTop10 = !fromTop10;
}

function loadImages(data) {
    console.log("load from instagram");
    for (var i = 0; i < data.data.length; i++) {
        /*
        modulo = data.data[i].created_time.slice(-1)%2;
        if (modulo==1) getBase64FromImage(data.data[i]);
        */
        getBase64FromImage(data.data[i]);
    }
}

function getBase64FromImage(obj) {
    server.get('images',obj.id).done( function ( results ) {
        if(typeof results != 'undefined') {
            console.log("image already in cache");
        } else {
            //load iamge
            var img = new Image();
            img.crossOrigin = "anonymous";
            //img.src = obj.images.standard_resolution.url;
            img.src = "http://www.corsproxy.com/"+obj.images.standard_resolution.url.replace(/.*?:\/\//g, "");
            
            img.onload = function () {
                var canvas = document.createElement("canvas");
                canvas.width = this.width;
                canvas.height = this.height;
                
                var ctx = canvas.getContext("2d");
                ctx.drawImage(this, 0, 0);
                
                var dataURL = canvas.toDataURL("image/jpg").replace(/^data:image\/(png|jpg);base64,/, "");
                obj.images.standard_resolution.data = dataURL;
                
                //$("div").append('<img src="data:image/png;base64,' + dataURL + '" />');
                
                server.images.add( obj ).done( function ( item ) {
                    // item stored
                    console.log("new image stored to cache");
                }); 
            }
        }
    });
}

function setPhoto(obj,position) {
    if (!obj) return;
    displayed[position] = obj.id;
        
    tile = $("#photo"+position);
    size = Math.max(tile.width(), tile.height());
    tile.find("canvas").css("z-index","2");
    tile.append('<canvas style="z-index:1" width="'+size+'" height="'+size+'"  id="'+obj.id+'"></canvas>');
    var canvas = document.getElementById(obj.id);
    var ctx = canvas.getContext("2d");
    
    var image = new Image();
    image.src = "data:image/png;base64,"+obj.images.standard_resolution.data;
    image.onload = function() {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = 'white';
        ctx.fillText("@"+obj.user.username, 5, 15);
        //obj.likes.count
        if (tile.find("canvas").length>1) {
            $(tile.find("canvas")[0]).fadeOut(function () {
                $(this).remove();
            });
        }
    };
    
}

function clearCache() {
    server.images.clear()
    .done(function() {
        console.log("cache cleared");
    })
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
