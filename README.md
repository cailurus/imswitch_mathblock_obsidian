# Obsidian Auto Switch Input Plugin

This Obsidian plugin automatically switches input methods when writing mathematical formulas to improve writing efficiency. When the cursor enters a math formula area (between $ symbols), it automatically switches to English input; when the cursor leaves the formula area, it switches back to the previous input method.

## Features

- Automatic detection of math formula areas (between $ symbols)
- Automatically switches to English input when entering formula areas
- Automatically returns to the previous input method when leaving formula areas
- Customizable input method switching commands

## Installation

1. Open Obsidian Settings
2. Go to "Third-party plugins" and disable "Safe mode"
3. Click "Browse" and search for "Auto Switch Input"
4. Click Install
5. Enable the plugin

## Configuration

The plugin provides two configurable commands:

1. Command to switch to English input method
   - Default value: `macism com.apple.keylayout.ABC`
2. Command to switch back to previous input method
   - Default value: `macism com.tencent.inputmethod.wetype.pinyin`

You can modify these commands in the plugin settings according to your system and input method preferences.

## System Requirements

- macOS: Requires [macism](https://github.com/laishulu/macism) to be installed
- Other systems: Requires appropriate command-line tools for switching input methods

## Important Notes

1. Default configuration is for macOS
2. For other operating systems, modify the commands in settings accordingly
3. Ensure input method switching tools are properly installed and configured

## Troubleshooting

Q: Why isn't the plugin switching input methods correctly?  
A: Please ensure:

1. macism other input method switching tool is properly installed
2. Correct commands are configured in plugin settings
3. The command-line tool works properly in terminal

## Contributing

Issues and Pull Requests are welcome to help improve this plugin.

## License

MIT License
