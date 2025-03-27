const { Plugin, PluginSettingTab, Setting } = require("obsidian");
const { exec } = require("child_process");
var import_view = require("@codemirror/view");
var import_language = require("@codemirror/language");

module.exports = class AutoSwitchInputPlugin extends Plugin {
  async onload() {
    const DEFAULT_SETTINGS = {
      switchToEnglish: "com.apple.keylayout.ABC",
      switchToPrevious: "com.tencent.inputmethod.wetype.pinyin",
      imeSelectorPath: "/opt/homebrew/bin/macism",
      changed: false,
    };

    this.settings = Object.assign({}, DEFAULT_SETTINGS);

    await this.loadSettings();

    this.registerEditorExtension(
      import_view.ViewPlugin.fromClass(createExtension(this.settings))
    );
    this.addSettingTab(new AutoSwitchInputSettingTab(this.app, this));

    this.previousInputMethod = "";
    this.isInMathBlock = false;
  }

  async loadSettings() {
    this.settings = Object.assign({}, this.settings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

function createExtension(settings) {
  return class {
    constructor(view) {
      this.previousInputMethodCode = `${settings.imeSelectorPath} ${settings.switchToPrevious}`;
      this.englishInputMethodCode = `${settings.imeSelectorPath} ${settings.switchToEnglish}`;
      this.isInsideMathBlock = isInsideMathBlock(view);
      this.switchIME();
    }
    update(update) {
      if (update.docChanged || update.selectionSet) {
        const currentInMath = isInsideMathBlock(update.view);
        if (this.isInsideMathBlock != currentInMath) {
          this.isInsideMathBlock = currentInMath;
          this.switchIME();
        }
      }
    }
    switchIME() {
      if (settings.changed) {
        settings.changed = false;
        this.previousInputMethodCode = `${settings.imeSelectorPath} ${settings.switchToPrevious}`;
        this.englishInputMethodCode = `${settings.imeSelectorPath} ${settings.switchToEnglish}`;
      }
      if (this.isInsideMathBlock) {
        this.switchToEnglishInput();
      } else {
        this.switchToPreviousInputMethod();
      }
    }
    switchToPreviousInputMethod() {
      exec(this.previousInputMethodCode, (err, stdout, stderr) => {
        if (err) {
          console.error("Error switching to previous input method:", err);
        } else {
          console.log("Switched back to previous input method");
        }
      });
    }
    switchToEnglishInput() {
      exec(this.englishInputMethodCode, (err, stdout, stderr) => {
        if (err) {
          console.error("Error switching to English input method:", err);
        } else {
          console.log("Switched to English input method");
        }
      });
    }
  };
}
function isInsideMathBlock(view) {
  const state = view.state;
  const pos = state.selection.main.to;
  const tree = (0, import_language.syntaxTree)(state);
  let syntaxNode = tree.resolveInner(pos, -1);

  while (syntaxNode) {
    if (syntaxNode.name.includes("math")) {
      if (syntaxNode.name.includes("math-end") && pos > syntaxNode.to) {
        return false;
      }
      if (syntaxNode.name.includes("math-begin") && pos < syntaxNode.from) {
        return false;
      }
      return true;
    }
    syntaxNode = syntaxNode.parent;
  }

  const text = state.doc.toString();
  let i = 0;
  while (i < text.length) {
    if (text[i] === "$") {
      if (i + 1 < text.length && text[i + 1] === "$") {
        const blockStart = i;
        i += 2;
        let blockEnd = -1;
        while (i + 1 < text.length) {
          if (text[i] === "$" && text[i + 1] === "$") {
            blockEnd = i + 1;
            break;
          }
          i++;
        }
        if (blockEnd !== -1 && pos > blockStart && pos <= blockEnd) {
          return true;
        }
        if (blockEnd === -1 && pos > blockStart) {
          return true;
        }
        i = blockEnd !== -1 ? blockEnd + 1 : i;
      } else {
        const inlineStart = i;
        i++;
        let inlineEnd = -1;
        while (i < text.length) {
          if (
            text[i] === "$" &&
            (i + 1 >= text.length || text[i + 1] !== "$")
          ) {
            inlineEnd = i;
            break;
          }
          i++;
        }
        if (inlineEnd !== -1 && pos > inlineStart && pos <= inlineEnd) {
          return true;
        }
        if (inlineEnd === -1 && pos > inlineStart) {
          return true;
        }
        i = inlineEnd !== -1 ? inlineEnd + 1 : i;
      }
    } else {
      i++;
    }
  }

  return false;
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
      .setName("Switch to English IME command args")
      .setDesc("Enter the command to switch to English input method")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.switchToEnglish)
          .onChange(async (value) => {
            this.plugin.settings.switchToEnglish = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Switch to previous IME command args")
      .setDesc("Enter the command to switch back to the previous input method")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.switchToPrevious)
          .onChange(async (value) => {
            this.plugin.settings.changed = true;
            this.plugin.settings.switchToPrevious = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("IME selector command path args")
      .setDesc("Enter the path to the command")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.imeSelectorPath)
          .onChange(async (value) => {
            this.plugin.settings.changed = true;
            this.plugin.settings.imeSelectorPath = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
