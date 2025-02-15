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
    const line = content.split('\n')[cursor.line];
    const isNowInMathBlock = this.isInsideMathBlock(line, cursor.ch);
    
    if (isNowInMathBlock && !this.isInMathBlock) {
      this.switchToEnglishInput();
    } else if (!isNowInMathBlock && this.isInMathBlock) {
      this.switchToPreviousInputMethod();
    }
    this.isInMathBlock = isNowInMathBlock;
  }

  isInsideMathBlock(line, cursorPosition) {
    let start = -1;
    let end = -1;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '$') {
        if (start === -1) {
          start = i;
        } else {
          end = i;
          break;
        }
      }
    }
    return start !== -1 && end !== -1 && cursorPosition >= start && cursorPosition <= end;
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