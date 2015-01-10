<?php
/**
 * Test_Customize_Pane_Resizer
 *
 * @package CustomizePaneResizer
 */

namespace CustomizePaneResizer;

/**
 * Class Test_Customize_Pane_Resizer
 *
 * @package CustomizePaneResizer
 */
class Test_Customize_Pane_Resizer extends \WP_UnitTestCase {

	/**
	 * Test _customize_pane_resizer_php_version_error().
	 *
	 * @see _customize_pane_resizer_php_version_error()
	 */
	public function test_customize_pane_resizer_php_version_error() {
		ob_start();
		_customize_pane_resizer_php_version_error();
		$buffer = ob_get_clean();
		$this->assertContains( '<div class="error">', $buffer );
	}

	/**
	 * Test _customize_pane_resizer_php_version_text().
	 *
	 * @see _customize_pane_resizer_php_version_text()
	 */
	public function test_customize_pane_resizer_php_version_text() {
		$this->assertContains( 'Customize Pane Resizer plugin error:', _customize_pane_resizer_php_version_text() );
	}
}
