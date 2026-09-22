import { Menu, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';

/**
 * Menú contextual del composer. Chromium ya subraya el error de ortografía,
 * pero sin este handler la sugerencia del diccionario (`dictionarySuggestions`)
 * nunca llega a la pantalla: el aprendiz veía la marca roja y no cómo se
 * escribe bien. Etiquetas en español (andamiaje de UI, Artículo 9).
 */

/** Subconjunto de `ContextMenuParams` que el menú necesita: mantiene el builder testeable. */
export interface SpellCheckParams {
  isEditable: boolean;
  misspelledWord: string;
  dictionarySuggestions: string[];
  editFlags: { canCut: boolean; canCopy: boolean; canPaste: boolean };
}

export interface SpellCheckActions {
  replaceMisspelling: (word: string) => void;
  addToDictionary: (word: string) => void;
}

/** Un menú más largo tapa el composer entero en la ventana mínima (640px de alto). */
const MAX_SUGGESTIONS = 5;

export function buildContextMenuTemplate(
  params: SpellCheckParams,
  actions: SpellCheckActions
): MenuItemConstructorOptions[] {
  if (!params.isEditable) return [];

  const template: MenuItemConstructorOptions[] = [];

  if (params.misspelledWord) {
    const suggestions = params.dictionarySuggestions.slice(0, MAX_SUGGESTIONS);
    if (suggestions.length > 0) {
      for (const suggestion of suggestions) {
        template.push({ label: suggestion, click: () => actions.replaceMisspelling(suggestion) });
      }
    } else {
      // Silenciar el caso vacío dejaba el mismo menú que sin error: hay que decirlo.
      template.push({ label: 'Sin sugerencias', enabled: false });
    }
    template.push({ type: 'separator' });
    template.push({
      label: 'Agregar al diccionario',
      click: () => actions.addToDictionary(params.misspelledWord),
    });
    template.push({ type: 'separator' });
  }

  template.push(
    { label: 'Cortar', role: 'cut', enabled: params.editFlags.canCut },
    { label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy },
    { label: 'Pegar', role: 'paste', enabled: params.editFlags.canPaste },
    { label: 'Seleccionar todo', role: 'selectAll' }
  );

  return template;
}

/** Cablea el menú a la ventana: sin esto el template no se dibuja nunca. */
export function wireSpellCheckContextMenu(win: BrowserWindow): void {
  const webContents = win.webContents;
  webContents.on('context-menu', (_event, params) => {
    const template = buildContextMenuTemplate(params, {
      replaceMisspelling: (word) => webContents.replaceMisspelling(word),
      addToDictionary: (word) => webContents.session.addWordToSpellCheckerDictionary(word),
    });
    if (template.length === 0) return;
    Menu.buildFromTemplate(template).popup({ window: win });
  });
}
