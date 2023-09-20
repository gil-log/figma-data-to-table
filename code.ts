figma.showUI(__html__, { width: 300, height: 150 });

figma.ui.onmessage = async msg => {
  if (msg.type === 'get-keys') {
    const data = JSON.parse(msg.data);

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      figma.ui.postMessage({ type: 'error', message: 'Invalid JSON data. Make sure it is an object.' });
      return;
    }

    const keys = Object.keys(data);

    // 폰트 로드
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      createTableFromKeys(keys);
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Failed to load the font.' });
    }

  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

function createTableFromKeys(keys: string[]) {
  const tableHeight = 30;
  const tableWidth = 150;

  keys.forEach((key, index) => {
    const rect = figma.createRectangle();
    rect.x = 0;
    rect.y = index * tableHeight;
    rect.resize(tableWidth, tableHeight);
    rect.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];

    const text = figma.createText();
    text.x = 10;
    text.y = index * tableHeight + 5;
    text.characters = key;

    figma.currentPage.appendChild(rect);
    figma.currentPage.appendChild(text);
  });

  figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
}
