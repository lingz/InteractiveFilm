(function($){
    $.interludeslideshow = function(el, options) {
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;
        
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        
        // Add a reverse reference to the DOM object
        base.$el.data("interludeslideshow", base);
        
        base.init = function(){
            base.options = $.extend({},$.interludeslideshow.defaultOptions, options);
            // setup inner state
            base.currentSlide = 0;
            base.slides = base.$el.find(base.options.slideSelector);
            base.numOfSlides = base.slides.length;
            
            // setup css for the slide elements
            base.slides.css('position', 'absolute').css('top', 0).css('right', 0).css('left', 0).css('bottom', 0).css('background-color', base.options.slideBackground);
            
            base.update();
        };
        
		base.update = function() {
			base.slides.css('z-index', 0);
			base.slides.eq(base.currentSlide).css('z-index', 1);
		}

		base.getCurrentSlideIndex = function() {
			return base.currentSlide;
		}
		
		base.getCurrentSlide = function() {
			return base.slides.eq(base.currentSlide);
		}

        base.next = function() {
        	if (base.currentSlide < base.numOfSlides-1) {
        		base.currentSlide++;
        	}
        	else {
        		base.currentSlide = 0;
        	}
        	
        	base.update();
        	return base.currentSlide;
        };
        
        base.prev = function() {
        	if (base.currentSlide > 0) {
        		base.currentSlide--;
        	}
        	else {
        		base.currentSlide = base.numOfSlides-1;
        	}
        	
        	base.update();
        	return base.currentSlide;
        };
        
        base.to = function(slideIndex) {
        	if (slideIndex >=0 && slideIndex<base.numOfSlides) {
        		base.currentSlide = slideIndex;
        	}
        	
        	base.update();
        	return base.currentSlide;
        };
        
        // run initializer
        base.init();
    };
    
    $.interludeslideshow.defaultOptions = {
        slideSelector: ".slide",
        slideBackground: 'white'
    };
    
    $.fn.interludeslideshow = function(options) {
        return this.each(function(){
            (new $.interludeslideshow(this, options));
        });
    };
    
})(jQuery);
