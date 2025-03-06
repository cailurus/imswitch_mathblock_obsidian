const { Plugin, PluginSettingTab, Setting } = require('obsidian');
const { exec } = require('child_process');

module.exports = class AutoSwitchInputPlugin extends Plugin {
    async onload() {
        // 添加默认设置
        const DEFAULT_SETTINGS = {
            switchToEnglish: 'macism com.apple.keylayout.ABC',
            switchToPrevious: 'macism com.tencent.inputmethod.wetype.pinyin',
            imeSelectorPath: '/opt/homebrew/bin',  // 默认路径
        };

        // 初始化设置
        this.settings = Object.assign({}, DEFAULT_SETTINGS);

        // 加载存储的设置
        await this.loadSettings();

        this.registerEvent(this.app.workspace.on('editor-change', this.handleEditorChange.bind(this)));
        this.addSettingTab(new AutoSwitchInputSettingTab(this.app, this));

        this.previousInputMethod = '';
        this.isInMathBlock = false;
    }

    async loadSettings() {
        this.settings = Object.assign({}, this.settings, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    handleEditorChange(editor, change) {
        const content = editor.getValue();
        const cursor = editor.getCursor();
        const isNowInMathBlock = this.isInsideMathBlock(content, cursor.line, cursor.ch);

        if (isNowInMathBlock && !this.isInMathBlock) {
            this.switchToEnglishInput();
        } else if (!isNowInMathBlock && this.isInMathBlock) {
            this.switchToPreviousInputMethod();
        }

        this.isInMathBlock = isNowInMathBlock;
    }

    isInsideMathBlock(content, lineNum, cursorPosition) {
        const lines = content.split('\n');
        const line = lines[lineNum];

        if (line.includes('$') && line.indexOf('$') !== line.lastIndexOf('$')) {
            const startPos = line.indexOf('$');
            const endPos = line.lastIndexOf('$');
            if (cursorPosition >= startPos && cursorPosition <= endPos) {
                return true;
            }
        }

        let mathBlockStartLine = -1;
        let mathBlockEndLine = -1;

        for (let i = lineNum; i >= 0; i--) {
            if (lines[i].includes('$$') && mathBlockStartLine === -1) {
                mathBlockStartLine = i;
                break;
            }
        }

        for (let i = lineNum; i < lines.length; i++) {
            if (lines[i].includes('$$') && i !== mathBlockStartLine) {
                mathBlockEndLine = i;
                break;
            }
        }

        if (mathBlockStartLine !== -1 && mathBlockEndLine !== -1) {
            const startLine = lines[mathBlockStartLine];
            const endLine = lines[mathBlockEndLine];

            const startPos = startLine.indexOf('$$');
            const endPos = endLine.lastIndexOf('$$');

            if (mathBlockStartLine === mathBlockEndLine) {
                return cursorPosition >= startPos && cursorPosition <= endPos;
            } else {
                if (lineNum === mathBlockStartLine) {
                    return cursorPosition >= startPos;
                } else if (lineNum === mathBlockEndLine) {
                    return cursorPosition <= endPos;
                } else {
                    return true;
                }
            }
        }

        return false;
    }

    switchToEnglishInput() {
        const switchCammand = `${this.settings.imeSelectorPath}/${this.settings.switchToEnglish}`
        console.log(switchCammand)
        exec(switchCammand, (err, stdout, stderr) => {
            if (err) {
                console.error('Error switching to English input method:', err);
            } else {
                console.log('Switched to English input method');
            }
        });
    }

    switchToPreviousInputMethod() {
        const switchCammand = `${this.settings.imeSelectorPath}/${this.settings.switchToPrevious}`
        console.log(switchCammand)
        exec(switchCammand, (err, stdout, stderr) => {
            if (err) {
                console.error('Error switching to previous input method:', err);
            } else {
                console.log('Switched back to previous input method');
            }
        });
    }
};

class AutoSwitchInputSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Switch to English Command')
            .setDesc('Enter the command to switch to English input method')
            .addText(text => text
                .setValue(this.plugin.settings.switchToEnglish)
                .onChange(async (value) => {
                    this.plugin.settings.switchToEnglish = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Switch to Previous Command')
            .setDesc('Enter the command to switch back to the previous input method')
            .addText(text => text
                .setValue(this.plugin.settings.switchToPrevious)
                .onChange(async (value) => {
                    this.plugin.settings.switchToPrevious = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('IME Selector Command Path')
            .setDesc('Enter the path to the command')
            .addText(text => text
                .setValue(this.plugin.settings.imeSelectorPath)
                .onChange(async (value) => {
                    this.plugin.settings.imeSelectorPath = value;
                    await this.plugin.saveSettings();
                }));
    }
}
