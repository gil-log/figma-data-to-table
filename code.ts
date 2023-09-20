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
      createTableFromKeys(keys, data);  // 데이터도 인수로 전달
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Failed to load the font.' });
    }

  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

function getType(value: any): string {
  if (typeof value === 'string') return 'String';
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') return 'Number';
  if (Array.isArray(value)) return 'Object Array';
  if (typeof value === 'object') return 'Object';
  return 'Unknown';
}

function createTableFromKeys(keys: string[], data: any) {
  const ROW_HEIGHT = 50;
  const TABLE_WIDTH = 400;
  const CELL_WIDTH = TABLE_WIDTH / 2;  // 우리가 2개의 셀만 가지고 있기 때문에
  const TITLE_COLOR: RGB = { r: 0xD9 / 0xFF, g: 0xD9 / 0xFF, b: 0xD9 / 0xFF };
  const ROW_COLOR: RGB = { r: 0xDB / 0xFF, g: 0xE3 / 0xFF, b: 0x88 / 0xFF };

  const tableFrame = figma.createFrame();
  tableFrame.resize(TABLE_WIDTH, (keys.length + 2) * ROW_HEIGHT);  // +2는 제목 행과 전체 테이블의 제목을 위함
  tableFrame.cornerRadius = 5;
  tableFrame.fills = [];
  tableFrame.name = "Table";

  // 제목 추가
  const titleFieldCell = createCell(CELL_WIDTH, ROW_HEIGHT, TITLE_COLOR, 'Field', 16);
  titleFieldCell.x = 0;
  titleFieldCell.y = ROW_HEIGHT;
  tableFrame.appendChild(titleFieldCell);

  const titleTypeCell = createCell(CELL_WIDTH, ROW_HEIGHT, TITLE_COLOR, 'Type', 16);
  titleTypeCell.x = CELL_WIDTH;
  titleTypeCell.y = ROW_HEIGHT;
  tableFrame.appendChild(titleTypeCell);

  // 각 키와 그에 해당하는 타입을 행으로 추가
  keys.forEach(async (key, index) => {
    const yPosition = (index + 2) * ROW_HEIGHT;

    const keyCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, key, 14);
    keyCell.x = 0;
    keyCell.y = yPosition;
    tableFrame.appendChild(keyCell);

    const typeCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, await getType(data[key]), 14);
    typeCell.x = CELL_WIDTH;
    typeCell.y = yPosition;
    tableFrame.appendChild(typeCell);
  });

  figma.currentPage.appendChild(tableFrame);
  figma.viewport.scrollAndZoomIntoView([tableFrame]);
}

function createCell(width: number, height: number, color: RGB, textValue: string, fontSize: number): FrameNode {
  const cellFrame = figma.createFrame();
  cellFrame.resize(width, height);
  cellFrame.backgrounds = [{ type: 'SOLID', color }];
  cellFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];

  const cellText = figma.createText();
  cellText.fontName = { family: "Inter", style: "Regular" };
  cellText.fontSize = fontSize;
  cellText.characters = textValue;
  cellText.resize(width, height);
  cellText.textAlignHorizontal = 'CENTER';
  cellText.textAlignVertical = 'CENTER';

  cellFrame.appendChild(cellText);

  return cellFrame;
}
