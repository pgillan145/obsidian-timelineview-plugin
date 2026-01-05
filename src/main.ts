import {App, Editor, MarkdownView, Modal, Notice, Plugin} from 'obsidian';
import {BasesView, parsePropertyId, Keymap} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab} from "./settings";


export const TimelineViewType = 'timeline-view';

export default class TimelinePlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Timeline View 9');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

        this.registerBasesView(TimelineViewType, {
              name: 'Timeline',
              icon: 'lucide-calendar',
              factory: (controller, containerEl) => new TimelineBasesView(controller, containerEl), // #FIX
              options: () => ([
                        {
                          // The type of option. 'text' is a text input.
                          type: 'text',
                          // The name displayed in the settings menu.
                          displayName: 'Property separator',
                          // The value saved to the view settings.
                          key: 'separator',
                          // The default value for this option.
                          default: ' - ',
                        },
                ]),
        });
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// https://github.com/fastrick/Obsidian-Task-Genius/blob/9e9af7f4840eea2929198933395e36de347dfeb7/src/pages/BaseTaskBasesView.ts#L68
export class TimelineBasesView extends BasesView implements HoverParent {
  readonly type = TimelineViewType;
  parentEl: HTMLElement;
  containerEl: HTMLElement;
  hoverPopover: HoverPopover | null;

  constructor(controller: QueryController, parentEl: HTMLElement) {
    super(controller);
    this.parentEl = parentEl;
    //this.containerEl = parentEl.createEl('div', {cls:'bases-timeline-view-container', stl:'width: 586px; height: 240px;'}).createDiv('bases-table-container').createDiv('bases-table').createDiv('bases-tbody');
    //this.containerEl = parentEl.createDiv('bases-timeline-view-container').createEl('table').createEl('body');
    this.containerEl = parentEl.createDiv('bases-timeline-view-container');
  }

  public onDataUpdated(): void {
    const { app } = this;

    // Retrieve the user configured order set in the Properties menu.
    const order = this.config.getOrder()

    // Clear entries created by previous iterations. Remember, you should
    // instead attempt element reuse when possible.
    this.containerEl.empty();

    // The property separator configured by the ViewOptions above can be
    // retrieved from the view config. Be sure to set a default value.
    const propertySeparator = String(this.config.get('separator')) || ' - ';

    // this.data contains both grouped and ungrouped versions of the data.
    // If it's appropriate for your view type, use the grouped form.
    for (const entry of this.data.data) {
      //const entryEl = this.containerEl.createEl('tr');
      const entryEl = this.containerEl.createEl('div');

      // Each entry in the group is a separate file in the vault matching
      // the Base filters. For list view, each entry is a separate line.
      //const propEl = entryEl.createEl('td'); //.createDiv('bases-table-cell bases-rendered-value markdown-rendered');
      //const propEl = entryEl.createEl('div'); //.createDiv('bases-table-cell bases-rendered-value markdown-rendered');
      let firstProp = true;
      for (const propertyName of order) {
            // Properties in the order can be parsed to determine what type
            // they are: formula, note, or file.
            const { type, name } = parsePropertyId(propertyName); // #FIX
  
            // `entry.getValue` returns the evaluated result of the property
            // in the context of this entry.
            const value = entry.getValue(propertyName);
  
            // Skip rendering properties which have an empty value.
            // The list items for each file may have differing length.
            if (value.isEmpty) continue; // #FIX
  
            if (!firstProp) {
              entryEl.createSpan({
                cls: 'bases-list-separator',
                text: propertySeparator
              });
            }
            firstProp = false;
  
            // If the `file.name` property is included in the order, render
            // it specially so that it links to that file.
            if (name === 'name' && type === 'file') {
              const fileName = String(entry.file.name);
              const filePath = String(entry.file.path);
              const linkEl = entryEl.createEl('a', { text: fileName, href:fileName, cls:'internal-link' });
              linkEl.onClickEvent((evt) => {
                if (evt.button !== 0 && evt.button !== 1) return;
                evt.preventDefault();
                const path = entry.file.path;
                const modEvent = Keymap.isModEvent(evt);
                void app.workspace.openLinkText(path, '', modEvent);
              });
  
              //linkEl.addEventListener('mouseover', (evt) => {
              //  app.workspace.trigger('hover-link', {
              //    event: evt,
              //    source: 'bases',
              //    hoverParent: this,
              //    targetEl: linkEl,
              //    linktext: entry.file.path,
              //  });
              //});
            }
            // For all other properties, just display the value as text.
            // In your view you may also choose to use the `Value.renderTo`
            // API to better support photos, links, icons, etc.
            else {
              entryEl.createSpan({
                cls: 'bases-list-entry-property',
                text: value.toString()
              });
            }
          }
      }
    }
}

