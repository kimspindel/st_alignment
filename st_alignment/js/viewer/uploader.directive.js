'use strict';

function getImages(zoomOutLevel) {
    var images = [];
    var photoWidth  = 20000;
    var photoHeight = 20000;
    var imageWidth  = 1024;
    var imageHeight = 1024;

    var tileMapWidth  = Math.trunc((photoWidth  / zoomOutLevel) / imageWidth)  + 1;
    var tileMapHeight = Math.trunc((photoHeight / zoomOutLevel) / imageHeight) + 1;

    for(var x = 0; x < tileMapWidth; ++x) {
        var imageRow = [];
        for(var y = 0; y < tileMapHeight; ++y) {
            var image = new Image();
            image.src = "img/zoom" + zoomOutLevel + "_x" + x + "_y" + y + ".jpg";
            imageRow.push(image);
        }
        images.push(imageRow);
    }

    images.width  = tileMapWidth;
    images.height = tileMapHeight;

    return images;
}

function renderImages(ctx, camera, scale, position, images) {
    camera.moveTo(position[0], position[1]);
    camera.zoomTo(scale);
    camera.begin();
        ctx.fillStyle = "khaki";
        ctx.fillRect(-1024, -1024, 21504, 21504);
        for(var i = 0; i < images.length; ++i) {
            console.log(i + ": " + images[i].renderPosition[0] + ", " + images[i].renderPosition[1]);
            ctx.drawImage(images[i], images[i].renderPosition[0], images[i].renderPosition[1]);
        }
    camera.end();
}

function grabRenderableImages(tilePosition, tiledImages) {
    var tilePositions = getSurroundingTilePositions(tilePosition, tiledImages.width, tiledImages.height);
    var images = [];
    for(var i = 0; i < tilePositions.length; ++i) {
        var tileX = tilePositions[i][0];
        var tileY = tilePositions[i][1];
        var image = tiledImages[tileX][tileY];
        image.renderPosition = [tileX * 1024, tileY * 1024];
        images.push(image);
    }
    return images;
}

function getSurroundingTilePositions(tilePosition, maxWidth, maxHeight) {
    var surroundingTilePositions = [];
    var i = 0;
    for(var y = -1; y < 2; ++y) {
        for(var x = -1; x < 2; ++x) {
            var xPos = tilePosition[0] + x;
            var yPos = tilePosition[1] + y;
            // make sure it is a valid tile
            if(!(xPos < 0 || xPos >= maxWidth ||
                 yPos < 0 || yPos >= maxHeight)) {
                console.log(i + ": adding tile " + xPos + ", " + yPos);
                surroundingTilePositions.push([xPos, yPos]);
                ++i;
            }
        }
    }
    return surroundingTilePositions;
}

function updateImagePosition(cameraPosition, zoomOutLevel) {
    var newImagePosition = [cameraPosition[0] * zoomOutLevel, cameraPosition[1] * zoomOutLevel];
    return newImagePosition;
}

function updateTilePosition(cameraPosition, zoomOutLevel) {
    var x = Math.trunc(cameraPosition[0] / 1024);
    var y = Math.trunc(cameraPosition[1] / 1024);
    console.log("tile " + x + ", " + y);
    return [x, y];
}

angular.module('viewer')
    .directive('stUploader', [
        '$rootScope',
        function($rootScope){
            var link = function(scope, element) {
                var canvas = element[0];
                var ctx = canvas.getContext('2d');

                var camera = new Camera(ctx);
                camera.begin();
                    ctx.fillStyle = "green";
                    ctx.fillRect(300, 300, 100, 100);
                camera.end();

                var zoomImages = [];
                zoomImages[1]  = getImages(1);
                zoomImages[2]  = getImages(2);
                zoomImages[3]  = getImages(3);
                zoomImages[5]  = getImages(5);
                zoomImages[10] = getImages(10);
                zoomImages[20] = getImages(20);

                var imagesToRender = [];

                /* https://css-tricks.com/snippets/javascript/javascript-keycodes/#article-header-id-1 */
                var keycodes_left  = [37, 72]; // left,  h
                var keycodes_up    = [38, 75]; // up,    k
                var keycodes_right = [39, 76]; // right, l
                var keycodes_down  = [40, 74]; // down,  j
                var keycodes_in    = [87]    ; // w
                var keycodes_out   = [83]    ; // s

                document.onkeydown = function(event) {
                    if(scope.imageLoaded) {
                        event = event || window.event;
                        if(keycodes_left.includes(event.which)) {
                            // left
                            scope.cameraPosition[0] -= scope.panFactor;
                        }
                        else if(keycodes_up.includes(event.which)) {
                            // up
                            scope.cameraPosition[1] -= scope.panFactor;
                        }
                        else if(keycodes_right.includes(event.which)) {
                            // right
                            scope.cameraPosition[0] += scope.panFactor;
                        }
                        else if(keycodes_down.includes(event.which)) {
                            // down
                            scope.cameraPosition[1] += scope.panFactor;
                        }
                        else if(keycodes_in.includes(event.which)) {
                            // in
                            scope.cameraScale /= scope.scaleFactor;
                        }
                        else if(keycodes_out.includes(event.which)) {
                            // out
                            scope.cameraScale *= scope.scaleFactor;
                        }

                        console.log("Camera at: " + scope.cameraPosition[0] + ", " + scope.cameraPosition[1]);
                        scope.imagePosition = updateImagePosition(scope.cameraPosition, scope.zoomOutLevel);
                        scope.tilePosition = updateTilePosition(scope.cameraPosition, scope.zoomOutLevel);
                        var imagesForRendering = grabRenderableImages(scope.tilePosition, zoomImages[scope.zoomOutLevel]);
                        renderImages(ctx, camera, scope.cameraScale, scope.cameraPosition, imagesForRendering);
                    }

                }

                $rootScope.$on('imageLoaded', function(event, data) {
                    scope.imageLoaded = true;
                    ctx.drawImage(zoomImages20[0][0], 0, 0);

                });
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
