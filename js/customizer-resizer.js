window.wp = window.wp || {};
window.wp.customize = window.wp.customize || {};

( function( window, document, $, wp, undefined ) {
	'use strict';
	var app = {};
	wp.customize.resizer = app;
	var mouseLeft = 0;

	app.cache = function() {
		app.$ = {};
		app.$.customizer = $( document.getElementById( 'customize-controls' ) );
		app.$.overlay = $( '.wp-full-overlay.expanded' );
		app.$.collapser = $( '.collapse-sidebar-label' );
	};

	app.init = function() {
		app.cache();
		app.events();
	};

	app.events = function() {
		app.$.customizer.append( '<div class="customizer-resizer"></div>' );

		app.$.resizer = $( '.customizer-resizer' )
			.on( 'mousedown', app.clicked );

		app.$.collapser.on( 'click', app.snapDefault );

		app.initIframeMouseEvents();
	};

	app.clicked = function( evt ) {

		app.$.customizer.addClass( 'no-animation' );

		$( document ).on( 'mousemove', app.mousemove );
		$( document ).on( 'mouseup', app.mouseup );

		evt.preventDefault();
	};

	app.mousemove = function( evt ) {
		var expanding = mouseLeft < evt.pageX;
		mouseLeft = evt.pageX;

		// TODO: If iframe width < 300, snap to mobile view
		// TODO: If mobile view triggered, reset all hard-coded margins/widths
		// TODO: Grabber should be hidden if mobile view
		if ( mouseLeft >= 320 ) {
			return app.sizeCustomizer( mouseLeft );
		}

		if ( ! expanding && mouseLeft > 270 && mouseLeft < 320 ) {
			return app.snapDefault();
		}

		if ( mouseLeft < 270 ) {
			app.snapDefault();
			$( document ).trigger( 'mouseup' );
			app.$.collapser.trigger( 'click' );
		}
	};

	app.mouseup = function() {
		$( document ).off( 'mousemove', app.mousemove );
		$( document ).off( 'mouseup', app.mouseup );

		app.$.customizer.removeClass( 'no-animation' );
	};

	app.snapDefault = function() {
		app.sizeCustomizer( 300 );
	};

	app.sizeCustomizer = function( size ) {
		app.$.overlay.css({ 'margin-left' : size });
		app.$.resizer.css({ 'margin-left' : size - 5 });
		app.$.customizer.width( size );
	};

	app.initIframeMouseEvents = function() {
		setTimeout( function() {
			var $iframe = app.$.overlay.find( 'iframe' );

			if ( $iframe.length ) {
				// Setup iframe bubbling
				app.bubbleMouseEvent( $iframe[0], 'mousemove' );
				app.bubbleMouseEvent( $iframe[0], 'mouseup' );
			} else {
				app.initIframeMouseEvents();
			}
		}, 500 );
	};

	app.bubbleMouseEvent = function( iframe, evtName ) {
		var longName = 'on' + evtName;
		// Save any previous handler
		var existingMouseEvt = iframe.contentWindow[ longName ];

		// Attach a new listener
		iframe.contentWindow[ longName ] = function( evt ){
			// Fire existing listener
			if ( existingMouseEvt ) {
				existingMouseEvt( evt );
			}

			// Create a new event for the this window
			var newEvt = document.createEvent( 'MouseEvents' );

			// We'll need this to offset the mouse appropriately
			var boundingClientRect = iframe.getBoundingClientRect();

			// Initialize the event, copying exiting event values
			// for the most part
			newEvt.initMouseEvent(
				evtName,
				true, // bubbles
				false, // not cancelable
				window,
				evt.detail,
				evt.screenX,
				evt.screenY,
				evt.clientX + boundingClientRect.left,
				evt.clientY + boundingClientRect.top,
				evt.ctrlKey,
				evt.altKey,
				evt.shiftKey,
				evt.metaKey,
				evt.button,
				null // no related element
			);

			// Dispatch the event on the iframe element
			iframe.dispatchEvent( newEvt );
		};
	};

	wp.customize.bind( 'ready', app.init );

} )( window, document, jQuery, window.wp );
