const { Plugin, PluginSettingTab, Setting } = require('obsidian');
const { exec } = require('child_process');

module.exports = class AutoSwitchInputPlugin extends Plugin {
    async onload() {
        // 添加默认设置
        const DEFAULT_SETTINGS = {
            switchToEnglish: 'im-select com.apple.keylayout.ABC',
            switchToPrevious: 'im-select com.tencent.inputmethod.wetype.pinyin'
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

        // 检查光标是否在数学块内
        const isNowInMathBlock = this.isInsideMathBlock(content, cursor.line, cursor.ch);

        // 只有在进入或离开数学块时才进行输入法切换
        if (isNowInMathBlock && !this.isInMathBlock) {
            this.switchToEnglishInput();
        } else if (!isNowInMathBlock && this.isInMathBlock) {
            this.switchToPreviousInputMethod();
        }

        // 更新当前是否在数学块内的状态
        this.isInMathBlock = isNowInMathBlock;
    }

    isInsideMathBlock(content, lineNum, cursorPosition) {
        const lines = content.split('\n');
        const line = lines[lineNum];

        // 检查行内数学块 $...$
        if (line.includes('$') && line.indexOf('$') !== line.lastIndexOf('$')) {
            const startPos = line.indexOf('$');
            const endPos = line.lastIndexOf('$');

            if (cursorPosition >= startPos && cursorPosition <= endPos) {
                return true;
            }
        }

        // 检查块级数学块 $$...$$，处理多行
        let mathBlockStartLine = -1;
        let mathBlockEndLine = -1;

        // 向上查找块级数学块的起始位置
        for (let i = lineNum; i >= 0; i--) {
            if (lines[i].includes('$$') && mathBlockStartLine === -1) {
                mathBlockStartLine = i;
                break;
            }
        }

        // 向下查找块级数学块的结束位置
        for (let i = lineNum; i < lines.length; i++) {
            if (lines[i].includes('$$') && i !== mathBlockStartLine) {
                mathBlockEndLine = i;
                break;
            }
        }

        // 如果找到了块级数学块的开始和结束行，检查光标是否在范围内
        if (mathBlockStartLine !== -1 && mathBlockEndLine !== -1) {
            // 获取开始行和结束行中 $$ 的位置
            const startLine = lines[mathBlockStartLine];
            const endLine = lines[mathBlockEndLine];

            const startPos = startLine.indexOf('$$');
            const endPos = endLine.lastIndexOf('$$');

            // 检查光标是否在数学块的范围内
            if (mathBlockStartLine === mathBlockEndLine) {
                // 如果开始行和结束行在同一行，检查该行范围内
                return cursorPosition >= startPos && cursorPosition <= endPos;
            } else {
                // 跨行数学块，检查开始行到结束行之间的区域
                if (lineNum === mathBlockStartLine) {
                    return cursorPosition >= startPos; // 在起始行的 $$ 之后
                } else if (lineNum === mathBlockEndLine) {
                    return cursorPosition <= endPos; // 在结束行的 $$ 之前
                } else {
                    return true; // 在中间行时，直接属于数学块
                }
            }
        }

        return false;
    }


    switchToEnglishInput() {
        exec(this.settings.switchToEnglish, (err, stdout, stderr) => {
            if (err) {
                console.error('Error switching to English input method:', err);
            } else {
                console.log('Switched to English input method');
            }
        });
    }

    switchToPreviousInputMethod() {
        exec(this.settings.switchToPrevious, (err, stdout, stderr) => {
            if (err) {
                console.error('Error switching to previous input method:', err);
            } else {
                console.log('Switched back to previous input method');
            }
        });
    }
}

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
    }
}