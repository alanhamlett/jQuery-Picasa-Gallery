// #Copyright (c) 2011 Alan Hamlett <alan.hamlett@gmail.com>
// #
// # Permission is hereby granted, free of charge, to any person obtaining a copy
// # of this software and associated documentation files (the "Software"), to deal
// # in the Software without restriction, including without limitation the rights
// # to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// # copies of the Software, and to permit persons to whom the Software is
// # furnished to do so, subject to the following conditions:
// #
// # The above copyright notice and this permission notice shall be included in
// # all copies or substantial portions of the Software.
// #
// # THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// # IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// # FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// # AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// # LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// # OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// # THE SOFTWARE.

(function( $ ){
    
    var busy = false;

    // Private methods
    
    var picasagallery_load_albums = function() {
        if(busy) {
            return;
        }
        busy = true;

        var $this = $(this); // save this DOM element so we can see it inside the ajax callback
        var data = $this.data('picasagallery'); // original options passed to picasagallery()
        if(!data) {
            $this = $(this).parent();
            data = $this.data('picasagallery');
        }

        // restore album list from hidden div if exists
        if(data.loaded) {
            $this.children('div:last').html('loading...').hide();
            $this.children('p:first').text('Photo Gallery');
            $this.children('div:first').show();
            busy = false;
            return;
        }
        
        var protocol = document.location.protocol == 'http:' ? 'http:' : 'https:';
        var url	= protocol + '//picasaweb.google.com/data/feed/api/user/' + data.username + '?kind=album&access=public&alt=json';
        
        // print loading message
        $this.html("loading...");

        // make ajax call to get public picasaweb albums
        $.getJSON(url, 'callback=?', function(json) {
            
            // initialize album html content
            $this.html("<p class='picasagallery_header'>Photo Gallery</p><div></div><div></div>");
            $this.children('div:last').hide();
            $this.children('p:first').click(picasagallery_load_albums);
            
            // loop through albums
            for(i = 0; i < json.feed.entry.length; i++) {
                var album_title = json.feed.entry[i].title.$t;
                
                // skip this album if in hide_albums array
                if($.inArray(album_title, data.hide_albums) > -1) {
                    continue;
                }

                // append html for this album
                $this.children('div:first').append(
                    "<div class='picasagallery_album'><img src='" +
                    json.feed.entry[i].media$group.media$thumbnail[0].url +
                    "' alt='" + json.feed.entry[i].gphoto$name.$t + "' title='" + album_title +
                    "'/><p><strong>" + album_title + "</strong></p><p>" +
                    json.feed.entry[i].gphoto$numphotos.$t +
                    " photos</p></div>"
                );
                $this.children('div:first').children('div:last').children('img:first').click(picasagallery_load_album);
            }

            // append blank div to resize parent elements
            $this.children('div:first').append('<div style="clear:both"></div>');
            
            data.loaded = true;
            busy = false;
        });
    };

    var picasagallery_load_album = function(album) {
        if(busy) {
            return;
        }
        busy = true;

        var dom = $(this).parent().parent().parent(); // original album element
        var data = dom.data('picasagallery'); // original options passed to picasagallery()
        var album = $(this).attr('alt');
        var protocol = document.location.protocol == 'http:' ? 'http:' : 'https:';
        var url	= protocol + '//picasaweb.google.com/data/feed/api/user/' + data.username + '/album/' + album + '?kind=photo&alt=json';

        // initialize album html content
        dom.children('div:last').html('loading...').show();
        dom.children('div:first').hide();
        dom.children('p:first').text('Back To Album List');
        
        // make ajax call to get album's images
        $.getJSON(url, 'callback=?', function(json) {
            
            // add html for album's title
            dom.children('div:last').html(
                "<p class='picasagallery_title'><strong>Album:</strong> " +
                json.feed.title.$t +
                "</p>"
            );
            
            // loop through album's images
            for(i = 0; i < json.feed.entry.length; i++) {
                
                // add html for this image
                dom.children('div:last').append(
                    "<a rel='picasagallery_thumbnail' class='picasagallery_thumbnail' href='" +
                    json.feed.entry[i].content.src +
                    "'><img src='" +
                    json.feed.entry[i].media$group.media$thumbnail[1].url +
                    "' alt='" +
                    json.feed.entry[i].title.$t +
                    "'/></a>"
                );
            }

            // append blank div to resize parent elements
            dom.children('div:last').append('<div style="clear:both"></div>');
            
            // setup fancybox to show larger images
            $("a[rel=picasagallery_thumbnail]").fancybox({
                'transitionIn'		: 'none',
                'transitionOut'		: 'none',
                'titlePosition' 	: 'outside',
                'titleFormat'       : function(title, currentArray, currentIndex, currentOpts) {
                    return '<span id="fancybox-title-outside">Image ' +  (currentIndex + 1) + ' / ' + currentArray.length + '<br>Hint: Use the mouse scroll wheel</span>';
                }
            });

            busy = false;
        });
    };

    var picasagallery_error = function(msg) {
        if (typeof console === "undefined" || typeof console.error === "undefined") {
            if( typeof console.log === "undefined" ) {
                alert('Picasa Gallery Error: ' + msg);
            } else {
                console.log('Picasa Gallery Error: ' + msg);
            }
        } else {
            console.error('Picasa Gallery Error: ' + msg);
        }
    }

    
    // Public methods

    $.fn.picasagallery = function(options) {
        this.data('picasagallery', $.extend({
            'username'      : '',
            'hide_albums'   : ['Profile Photos', 'Scrapbook Photos', 'Instant Upload', 'Photos from posts'],
            'loaded'        : false
        }, options));
        var data = this.data('picasagallery');
        if(data === undefined) {
            picasagallery_error('Cannot call method \'picasagallery\' of undefined');
            return;
        }
        if( !data.username ) {
            picasagallery_error('missing username');
            return;
        }
        this.addClass('picasagallery');
        picasagallery_load_albums.apply(this);
        return this;
    };

}) ( jQuery );

