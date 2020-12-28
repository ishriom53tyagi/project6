(function($) {
  'use strict';
  
  jQuery(document).ready(function(){

    /*--
    Menu Stick
    -----------------------------------*/
    var header = $('.transparent-bar');
    var win = $(window);

    win.on('scroll', function() {
      var scroll = win.scrollTop();
      if (scroll < 200) {
        header.removeClass('stick');
      } else {
        header.addClass('stick');
      }
    });


    /* jQuery MeanMenu */
    $('#mobile-menu-active').meanmenu({
      meanScreenWidth: "991",
      meanMenuContainer: ".mobile-menu-area .mobile-menu",
    });

    /* Cart */
    $(".language-click , .icon-cart , .icon-setting").on("click", function() {
      $(this).parent().find('.language-dropdown , .shopping-cart-content , .setting-wrapper').slideToggle('medium');
    })





    /* Best selling active */
    $('.best-selling-active').owlCarousel({
      loop: true,
      nav: true,
      
      autoplay: false,
      autoplayTimeout: 5000,
      navText: ['<i class="ion-ios-arrow-back"></i>', '<i class="ion-ios-arrow-forward"></i>'],
      item: 1,
      responsive: {
        0: {
          items: 1
        },
        768: {
          items: 1
        },
        992: {
          items: 1
        },
        1100: {
          items: 1
        },
        1200: {
          items: 1
        }
      }
    })
    
    
    
    /* Best selling active */
    $('.wishlist_loop_active').owlCarousel({
      loop: true,
      nav: true,
      dots: false,
      
      autoplay: false,
      autoplayTimeout: 5000,
      navText: ['<i class="ion-android-arrow-back"></i>', '<i class="ion-android-arrow-forward"></i>'],
      item: 1,
       margin: 15,
      responsive: {
        0: {
          items: 1
        },
        768: {
          items: 3
        },
        992: {
          items: 3
        },
        1100: {
          items: 4
        },
        1200: {
          items: 4
        }
      }
    })
    
    

    /* Best selling active */
    $('.product-thumb-active').owlCarousel({
      loop: true,
      nav: true,
      
      autoplay: false,
      autoplayTimeout: 5000,
      navText: ['<i class="ion-ios-arrow-back"></i>', '<i class="ion-ios-arrow-forward"></i>'],
      item: 5,
      responsive: {
        0: {
          items: 2
        },
        768: {
          items: 2
        },
        992: {
          items: 4
        },
        1100: {
          items: 4
        },
        1200: {
          items: 4
        }
      }
    })


    
    
    /* Best selling active 2 */
    $('.best-selling-active-2').owlCarousel({
      loop: true,
      
      nav: false,
      item: 1,
      responsive: {
        0: {
          items: 1
        },
        768: {
          items: 1
        },
        992: {
          items: 1
        },
        1100: {
          items: 1
        },
        1200: {
          items: 1
        }
      }
    })




    /*---------------------
        Countdown
    --------------------- */
    $('[data-countdown]').each(function() {
      var $this = $(this),
          finalDate = $(this).data('countdown');
      $this.countdown(finalDate, function(event) {
        $this.html(event.strftime('<span class="cdown day">%-D <p>Days</p></span> <span class="cdown hour">%-H <p>Hour</p></span> <span class="cdown minutes">%M <p>Min</p></span class="cdown second"> <span>%S <p>Sec</p></span>'));
      });
    });


    /* Hover 3d init for tilt */
    if ($('.tilter').length > 0) {
      $('.tilter').tilt({
        maxTilt: 40,
        perspective: 800,
        easing: "cubic-bezier(.03,.98,.52,.99)",
        scale: 1,
        speed: 800,
        transition: true,
      });
    }

    /*--------------------------
        ScrollUp
    ---------------------------- */
    $.scrollUp({
      scrollText: '<i class="fa fa-angle-double-up"></i>',
      easingType: 'linear',
      scrollSpeed: 900,
      animation: 'fade'
    });


    /*---------------------
        Product dec slider
    --------------------- */
    $('.product-dec-slider').slick({
      infinite: true,
      slidesToShow: 4,
      slidesToScroll: 1,
      centerPadding: '60px',
      prevArrow: '<span class="product-dec-icon product-dec-prev"><i class="fa fa-angle-left"></i></span>',
      nextArrow: '<span class="product-dec-icon product-dec-next"><i class="fa fa-angle-right"></i></span>',
      responsive: [{
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      },
                   {
                     breakpoint: 480,
                     settings: {
                       slidesToShow: 3,
                       slidesToScroll: 1
                     }
                   },
                   {
                     breakpoint: 479,
                     settings: {
                       slidesToShow: 2,
                       slidesToScroll: 1
                     }
                   }
                  ]
    });

    /*------ Wow Active ----*/
    new WOW().init();

    /* counterUp */
    $('.count').counterUp({
      delay: 10,
      time: 1000
    });


    /* Best selling active */
    $('.featured-product-active').owlCarousel({
        loop: true,
        nav: false,
        autoplay: false,
        
        autoplayTimeout: 5000,
        navText: ['<i class="ion-ios-arrow-back"></i>', '<i class="ion-ios-arrow-forward"></i>'],
        item: 4,
        margin: 30,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 2
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            },
            1100: {
                items: 3
            },
            1200: {
                items: 4
            }
        }
    })
    
    
    /*----------  magnific popup  ----------*/

    $('.popup-video').magnificPopup({
      type: 'iframe',
      mainClass: 'mfp-fade',
      removalDelay: 160,
      preloader: false,
      fixedContentPos: false
    });

    
    

    /* blog gallery slider */
    $('.blog-gallery-slider').owlCarousel({
      loop: true,
      nav: true,
      autoplay: true,
      
      autoplayTimeout: 5000,
      animateOut: 'fadeOut',
      animateIn: 'fadeIn',
      navText:['<i class="ion-chevron-left"></i>','<i class="ion-chevron-right"></i>'],
      item: 1,
      responsive: {
        0: {
          items: 1
        },
        768: {
          items: 1
        },
        1000: {
          items: 1
        }
      }
    })

    /* isotop active */
    // filter items on button click
    $('.blog-area').imagesLoaded(function() {
      $('.portfolio-menu-active').on('click', 'button', function() {
        var filterValue = $(this).attr('data-filter');
        $grid.isotope({
          filter: filterValue
        });
      });
      // init Isotope
      var $grid = $('.blog-grid').isotope({
        itemSelector: '.blog-grid-item',
        percentPosition: true,
        masonry: {
          // use outer width of grid-sizer for columnWidth
          columnWidth: '.blog-grid-item',
        }
      });
    });


    $('.testimonial-2-active').owlCarousel({
      loop: true,
      margin:20,
      
      nav:true,
      navText: [ '<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>' ],
      items:2,
      responsive:{
        0:{
          items:1
        },
        600:{
          items:1
        },
        800:{
          items:1
        },
        992:{
          items:2
        },
        1024:{
          items:2
        },
        1200:{
          items:2
        },
        1400:{
          items:2
        },
        1920:{
          items:2
        }
      }
    });

  });     
})(jQuery);