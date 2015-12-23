window.wp = window.wp || {};
window.wp.customize = window.wp.customize || {};

( function( window, document, $, wp, undefined ) {
	'use strict';

	var app = { size : 0 };

	// Keeps track of the current left position of mouse when clicking resizer.
	var mouseLeft = 0;

	// Stores customizer-expanded status.
	var expanded = false;

	// Whether browser supports sessionStorage.
	var hasStorage = null;

	// Whether browser supports sessionStorage.
	var width = null;

	// Bind resizer to namespaced object on the customizer object.
	wp.customize.resizer = app;

	app.cache = function() {
		app.cache.cached = true;

		app.$ = {
			window     : window,
			body       : document.body,
			customizer : document.getElementById( 'customize-controls' ),
			overlay    : '.wp-full-overlay.expanded',
			collapser  : '.collapse-sidebar-label'
		};

		$.each( app.$, function( index, selector ) {
			app.$[ index ] = $( selector );
			if ( app.$[ index ].length < 1 ) {
				app.cache.cached = false;
			}
		} );
	};

	app.asap = function() {
		// Cache selectors used.
		app.cache();

		// Don't continue if our elements are not available.
		if ( ! app.cache.cached ) {
			return;
		}

		// Add resizer.
		app.$.customizer.append( '<div class="customizer-resizer"></div>' );

		// Cache default customizer width
		width = app.$.customizer.outerWidth();

		// Cache selector.
		app.$.resizer = $( '.customizer-resizer' );

		// Checks window width to determine if customizer is resizable
		app.checkWindowWidth();

		// Disable customizer sizing animation.
		app.$.customizer.addClass( 'no-animation' );
		app.snapToStored();

		// Re-enable customizer sizing animation.
		app.$.customizer.removeClass( 'no-animation' );

		app.asap.done = true;
	};

	app.init = function() {
		// If elements were not available previously, re-initiate the caching/sizing.
		if ( ! app.cache.cached ) {
			app.asap();
		}

		// We need the iframe to bubble up mouse events.
		app.initIframeMouseEvents();

		app.$.resizer.on( 'mousedown', app.resizerEngage );

		$( window ).resize( _.debounce( app.checkWindowWidth, 50 ) );
	};

	app.toggleExpansion = function() {
		var isExpanded = 'true' === $( this ).attr( 'aria-expanded' );
		if ( isExpanded ) {
			app.snapToStored();
		} else {
			app.snapToDefault( true );
		}
	};

	app.checkWindowWidth = function() {
		var winWidth = app.$.window.width();

		// The breakpoint where mobile view is triggered.
		if ( winWidth < 640 ) {
			expanded = false;
			app.$.body.removeClass( 'resizable' );
			return app.snapToDefault();
		}

		if ( ! expanded ) {
			app.$.body.addClass( 'resizable' );
			expanded = true;
		}
	};

	app.resizerEngage = function( evt ) {
		if ( 1 !== evt.which ) {
			return;
		}

		var winWidth    = app.$.window.width();
		var iframeWidth = winWidth - app.$.customizer.width();

		evt.preventDefault();

		if ( iframeWidth < 100 ) {

			// Decrease customizer width below threshold where it snaps to full-width.
			app.sizeCustomizer( winWidth - 320 );
			app.fullWidth( 'no' );
		} else {

			// Disable customizer sizing animation.
			app.$.customizer.addClass( 'no-animation' );

			// Add event listeners for the dragging duration.
			$( document ).on( 'mousemove', app.resizerMovement );
			$( document ).on( 'mouseup', app.resizerDisengage );
		}
	};

	app.resizerMovement = function( evt ) {

		// Check if the customizer is expanding (vs shrinking).
		var expanding = mouseLeft < evt.pageX;

		// Re-cache mouseLeft.
		mouseLeft = evt.pageX;

		var iframeWidth = app.$.window.width() - mouseLeft;

		// If iframe width is less than a workable width, snap full-screen.
		if ( iframeWidth < 290 && iframeWidth > 100 ) {
			app.snapToDefault();
			app.resizerDisengage();

			return app.fullWidth( 'yes' );
		}

		app.fullWidth( 'no' );

		// If we're expanding larger than default, increae the width.
		if ( mouseLeft >= ( width + 20 ) || mouseLeft >= width && expanding ) {

			// Offset by 3 pixels to put the cursor in the middle of the resizer bar.
			return app.sizeCustomizer( mouseLeft - 3 );
		}

		// If we're condensing, and close to our default, snap to it.
		if ( ! expanding && mouseLeft > ( width - 30 ) && mouseLeft < ( width + 20 ) ) {
			return app.snapToDefault();
		}

		// If we're condensing past our default, just trigger the collapse.
		if ( mouseLeft < ( width - 30 ) ) {
			app.snapToDefault();
			app.resizerDisengage();
			app.$.collapser.trigger( 'click' );
		}
	};

	app.resizerDisengage = function() {

		// Remove temp. event listeners.
		$( document ).off( 'mousemove', app.resizerMovement );
		$( document ).off( 'mouseup', app.resizerDisengage );

		// Re-enable customizer sizing animation.
		app.$.customizer.removeClass( 'no-animation' );
	};

	app.fullWidth = function( makeFull ) {
		var method = 'yes' === makeFull ? 'addClass' : 'removeClass';
		app.$.body[ method ]( 'fullwidth-customizer' );
	};

	app.snapToStored = function() {

		// If we have sessionStorage and a stored size, load that.
		if ( app.getStorage() ) {
			app.sizeCustomizer( app.size, true );
		}
	};

	app.snapToDefault = function( bypassStore ) {
		app.sizeCustomizer( '', bypassStore );
	};

	app.sizeCustomizer = function( size, bypassStore ) {
		bypassStore = bypassStore || false;
		app.size = size ? parseInt( size, 10 ) : '';

		// Overlay margin needs to be nudged (give more space).
		app.$.overlay.css({ 'margin-left' : app.size });

		// And of course, resize the customizer.
		app.$.customizer.width( app.size );

		// Unless told not to:
		if ( ! bypassStore ) {

			// Store the new value (if we have sessionStorage).
			app.setStorage();
		}
	};

	app.initIframeMouseEvents = function() {

		// Will recursively check for existence of iframe.
		setTimeout( function() {
			var $iframe = app.$.overlay.find( 'iframe' );

			if ( $iframe.length ) {

				// Init iframe event bubbling.
				app.bubbleMouseEvent( $iframe[0], 'mousemove' );
				app.bubbleMouseEvent( $iframe[0], 'mouseup' );
			} else {
				app.initIframeMouseEvents();
			}
		}, 100 );
	};

	app.bubbleMouseEvent = function( iframe, evtName ) {
		var longName = 'on' + evtName;

		// Save any previous handler.
		var existingMouseEvt = iframe.contentWindow[ longName ];

		// Attach a new listener.
		iframe.contentWindow[ longName ] = function( evt ) {

			// Fire existing listener.
			if ( existingMouseEvt ) {
				existingMouseEvt( evt );
			}

			// Create a new event for the this window.
			var newEvt = document.createEvent( 'MouseEvents' );

			// We'll need this to offset the mouse appropriately.
			var boundingClientRect = iframe.getBoundingClientRect();

			// Initialize the event, copying exiting event values (for the most part).
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

			// Dispatch the event on the iframe element.
			iframe.dispatchEvent( newEvt );
		};
	};

	/**
	 * Check if the browser supports sessionStorage and it's not disabled.
	 *
	 * Storage methods stolen from wp-includes/js/autosave.js.
	 * We should consider globally accessible sessionStorage methods.
	 *
	 * @return {bool} Whether browser supports sessionStorage.
	 */
	app.checkStorage = function() {
		if ( null !== hasStorage ) {
			return hasStorage;
		}

		var test = Math.random().toString();
		hasStorage = false;

		try {
			window.sessionStorage.setItem( 'wp-test', test );
			hasStorage = window.sessionStorage.getItem( 'wp-test' ) === test;
			window.sessionStorage.removeItem( 'wp-test' );
		} catch(e) {}

		return hasStorage;
	};

	/**
	 * Initialize the local storage
	 *
	 * @return mixed False if no sessionStorage in the browser or an Object containing all postData for this blog
	 */
	app.getStorage = function() {

		// Separate local storage containers for each blog_id
		if ( app.checkStorage() ) {
			app.size = sessionStorage.getItem( 'wp-customizer-width' );
		}

		return app.size;
	};

	/**
	 * Set the storage for this blog
	 *
	 * Confirms that the data was saved successfully.
	 *
	 * @return bool
	 */
	app.setStorage = function() {
		if ( app.checkStorage() && app.size && 'NaN' !== app.size ) {
			sessionStorage.setItem( 'wp-customizer-width', app.size );
			return sessionStorage.getItem( 'wp-customizer-width' ) !== null;
		}

		return false;
	};

	// Run items which will benefit from asap loading (width of customizer from storage).
	app.asap();

	// Bind to customizer ready for the rest.
	wp.customize.bind( 'ready', app.init );

} )( window, document, jQuery, window.wp );
