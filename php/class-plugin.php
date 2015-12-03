<?php
/**
 * Bootstraps the Customize Pane Resizer plugin.
 *
 * @package CustomizePaneResizer
 */

namespace CustomizePaneResizer;

/**
 * Main plugin bootstrap file.
 */
class Plugin extends Plugin_Base {

	/**
	 * Conditionally minified prefix.
	 *
	 * @var string
	 */
	public $min;

	/**
	 * Class constructor.
	 */
	public function __construct() {
		parent::__construct();

		$priority = 9; // Because WP_Customize_Widgets::register_settings() happens at after_setup_theme priority 10.
		add_action( 'after_setup_theme', array( $this, 'init' ), $priority );
	}

	/**
	 * Initiate the plugin resources.
	 *
	 * @action after_setup_theme
	 */
	public function init() {
		$this->config = apply_filters( 'customize_pane_resizer_plugin_config', $this->config, $this );
		$this->min = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		// add_action( 'wp_default_scripts', array( $this, 'register_scripts' ), 11 );
		// add_action( 'wp_default_styles', array( $this, 'register_styles' ), 11 );
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'enqeue_scripts_styles' ) );
	}

	/**
	 * Register scripts.
	 *
	 * @action wp_default_scripts
	 */
	public function register_scripts() {
	}

	/**
	 * Register styles.
	 *
	 * @action wp_default_styles
	 */
	public function register_styles() {
	}

	/**
	 * Enqueue our script to be loaded when the customizer is loaded.
	 *
	 * @action customize_controls_enqueue_scripts
	 */
	public function enqeue_scripts_styles() {
		wp_register_script( 'customizer-resizer', "{$this->dir_url}js/customizer-resizer{$this->min}.js", array( 'customize-controls', 'jquery-ui-resizable' ), time(), 1 );

		wp_register_style( 'customizer-resizer', "{$this->dir_url}css/customizer-resizer{$this->min}.css", array( 'customize-controls' ), time() );

		wp_enqueue_script( 'customizer-resizer' );
		wp_enqueue_style( 'customizer-resizer' );
	}

}
