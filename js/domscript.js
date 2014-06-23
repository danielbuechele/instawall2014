var server;
var reload_timer;
var animation_timer;
var feed = new Instafeed({
    get: 'tagged',
    tagName: 'kulturspektakel',
    clientId: 'f277c99d618f4baf863906716c305c83',
    resolution: 'standard_resolution',
    useHttp: true,
    sortBy: 'most-recent',
    mock: true,
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
	} );
	
	triggerAnimation();
	
	animation_timer = setInterval(function () {
    	console.log("trigger animation");
    	triggerAnimation();
    }, 30000);
	
	feed.run();
	
	reload_timer = setInterval(function () {
    	console.log("reload from instagram");
    	feed.run();
	}, 30000);

});

function triggerAnimation() {
    
    squares = $(".square").length;
    doors = $(".door").length;
    
    
    
    
}

function loadImages(data) {
    for (var i = 0; i < data.data.length; i++) {
        getBase64FromImage(data.data[i]);
    }
}

function getBase64FromImage(obj) {
    server.get('images',obj.id).done( function ( results ) {
        if(typeof results != 'undefined') {
            console.log("image from cache");
            addImage(results);
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
                
                var dataURL = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");
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

function addImage(obj) {
    
    tile = $($(".photo")[Math.floor(Math.random() * 10)]);
    size = Math.max(tile.width(), tile.height());
    tile.html('<canvas width="'+size+'" height="'+size+'"  id="'+obj.id+'"></canvas>');
    var canvas = document.getElementById(obj.id);
    var ctx = canvas.getContext("2d");
    
    var image = new Image();
    image.src = "data:image/png;base64,"+obj.images.standard_resolution.data;
    image.onload = function() {
        ctx.drawImage(image, 0, 0, canvas.height, canvas.height);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = 'white';
        ctx.fillText("@"+obj.user.username, 5, 15);
        //obj.likes.count
    };
}

function clearCache() {
    server.images.clear()
    .done(function() {
        console.log("cache cleared");
    })
}
