<?php
/**
 * Instantiates the Customize Pane Resizer plugin
 *
 * @package CustomizePaneResizer
 */

namespace CustomizePaneResizer;

global $customize_pane_resizer_plugin;

require_once __DIR__ . '/php/class-plugin-base.php';
require_once __DIR__ . '/php/class-plugin.php';

$customize_pane_resizer_plugin = new Plugin();

/**
 * Customize Pane Resizer Plugin Instance
 *
 * @return Plugin
 */
function get_plugin_instance() {
	global $customize_pane_resizer_plugin;
	return $customize_pane_resizer_plugin;
}
