figma.showUI(__html__, { width: 400, height: 600 });

const currentXPositions: number[] = [];
let lastYPosition = 0; // 마지막으로 생성된 테이블의 Y 위치를 저장하기 위한 전역 변수
const GAP_BETWEEN_TABLES = 100; // 테이블 간의 간격

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

  } else if (msg.type === 'view-json') {
    const nodes = figma.currentPage.selection;
    if (nodes.length > 0) {
      const node = nodes[0];
      const jsonData = node.getPluginData("myJsonData");
      if (jsonData) {
        figma.ui.postMessage({ type: 'display-json', data: jsonData });
      }
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

function toCamelCase(str: string): string {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function createTableFromKeys(keys: string[], data: any, tableName: string = "Table", depth: number = 0): void {
  const ROW_HEIGHT = 50;
  const TABLE_WIDTH = 800;  // 전체 테이블 너비 (예시로 800을 설정했지만 원하는대로 조정할 수 있습니다.)
  const CELL_WIDTH = TABLE_WIDTH / 5;
  const TITLE_COLOR: RGB = { r: 0x98 / 0xFF, g: 0xAE / 0xFF, b: 0xFE / 0xFF };
  const ROW_COLOR: RGB = { r: 0xDB / 0xFF, g: 0xE3 / 0xFF, b: 0x88 / 0xFF };
  const FIELD_COLOR: RGB = { r: 0xD9 / 0xFF, g: 0xD9 / 0xFF, b: 0xD9 / 0xFF };

  // x 좌표 초기화
  if (currentXPositions[depth] === undefined) {
    currentXPositions[depth] = (currentXPositions[depth - 1] || 0) + TABLE_WIDTH + 50;
  }

  const tableFrame = figma.createFrame();
  tableFrame.resize(TABLE_WIDTH, (keys.length + 2) * ROW_HEIGHT);
  tableFrame.cornerRadius = 5;
  tableFrame.fills = [];



  // 테이블의 위치 조정
  tableFrame.y = lastYPosition;

  figma.currentPage.appendChild(tableFrame);
  figma.viewport.scrollAndZoomIntoView([tableFrame]);

  // 마지막 테이블의 Y 위치 업데이트
  lastYPosition = tableFrame.y + tableFrame.height + GAP_BETWEEN_TABLES;

  if (depth > 0) {
    tableFrame.x = currentXPositions[depth - 1] + TABLE_WIDTH + 50; // 부모 테이블의 오른쪽에 자식 테이블 배치
    currentXPositions[depth] = tableFrame.x; // 현재 depth의 x 좌표 업데이트
  } else {
    tableFrame.x = currentXPositions[depth];
    currentXPositions[depth] += TABLE_WIDTH + 50;
  }

  // 최상단 Frame에 Stroke 추가
  tableFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  tableFrame.strokeWeight = 1;
  tableFrame.strokeAlign = "OUTSIDE";

  tableFrame.name = tableName;

  tableFrame.layoutMode = "VERTICAL";  // Vertical Auto Layout 설정
  tableFrame.primaryAxisAlignItems = "CENTER";  // 중앙 정렬
  tableFrame.counterAxisAlignItems = "CENTER";  // 중앙 정렬
  tableFrame.itemSpacing = 0;  // 아이템 간격 설정
  tableFrame.paddingTop = 0;  // 패딩 제거
  tableFrame.paddingBottom = 0;
  tableFrame.paddingLeft = 0;
  tableFrame.paddingRight = 0;

  // Table 제목
  const tableTitleRow = createRow(TABLE_WIDTH, ROW_HEIGHT, TITLE_COLOR, tableName, 16);
  tableTitleRow.y = 0;
  tableFrame.appendChild(tableTitleRow);

  // Header Row Frame 생성
  const headerRowFrame = figma.createFrame();
  headerRowFrame.resize(TABLE_WIDTH, ROW_HEIGHT);
  headerRowFrame.backgrounds = [];
  headerRowFrame.layoutMode = "HORIZONTAL";  // Horizontal Auto Layout 설정
  headerRowFrame.primaryAxisAlignItems = "CENTER";  // 중앙 정렬
  headerRowFrame.counterAxisAlignItems = "CENTER";  // 중앙 정렬
  headerRowFrame.itemSpacing = 0;  // 아이템 간격 설정
  headerRowFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.5 }];  // 테두리 설정
  headerRowFrame.strokeWeight = 1;  // 테두리 두께
  tableFrame.appendChild(headerRowFrame);

  tableFrame.setPluginData("myJsonData", JSON.stringify(data));


// Field 제목 셀
  const titleFieldCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Field', 16);
  headerRowFrame.appendChild(titleFieldCell);

// Type 제목 셀
  const titleTypeCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Type', 16);
  headerRowFrame.appendChild(titleTypeCell);

// Mandatory 제목 셀
  const titleMandatoryCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Mandatory', 16);
  headerRowFrame.appendChild(titleMandatoryCell);

// Description 제목 셀
  const titleDescriptionCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Description', 16);
  headerRowFrame.appendChild(titleDescriptionCell);

// Example 제목 셀
  const titleExampleCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Example', 16);
  headerRowFrame.appendChild(titleExampleCell);


  // 각 키와 그에 해당하는 타입, 예시를 행으로 추가
  keys.forEach((key, index) => {
    const yPosition = (index + 2) * ROW_HEIGHT;

    // Row Frame
    const rowFrame = figma.createFrame();
    rowFrame.resize(TABLE_WIDTH, ROW_HEIGHT);
    rowFrame.x = 0;
    rowFrame.y = yPosition;
    rowFrame.fills = [];
    rowFrame.layoutMode = "HORIZONTAL";
    rowFrame.primaryAxisAlignItems = "CENTER";
    rowFrame.counterAxisAlignItems = "CENTER";
    rowFrame.itemSpacing = 0;
    rowFrame.counterAxisSizingMode = "AUTO";  // 세로 크기를 "Fill container"로 설정

    tableFrame.appendChild(rowFrame);

    // Key 셀
    const keyCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, key, 14);
    rowFrame.appendChild(keyCell);

    // Type 셀
    let typeValue = getType(data[key]);
    if (typeValue === 'Object') {
      typeValue = toCamelCase(key);
    } else if (typeValue === 'Object Array') {
      typeValue = toCamelCase(key) + '[]';
    }
    const typeCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, typeValue, 14);
    rowFrame.appendChild(typeCell);

// Mandatory 셀
    const mandatoryCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, '', 14);  // 너비를 기본 셀 너비의 반으로 줄임
    rowFrame.appendChild(mandatoryCell);

// Description 셀
    const descriptionCell = createCell(CELL_WIDTH , ROW_HEIGHT, ROW_COLOR, '', 14);  // 너비를 기본 셀 너비의 2배로 설정
    rowFrame.appendChild(descriptionCell);

// Example 셀
    const exampleText = typeof data[key] === 'object' ? `"${key}": -` : `"${key}": "${data[key]}"`;
    const exampleCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, exampleText, 14);
    rowFrame.appendChild(exampleCell);

    // Check if the type is Object or Object Array and create a subtable if so
    if (typeValue === toCamelCase(key) || typeValue === toCamelCase(key) + '[]') {
      const subData = Array.isArray(data[key]) ? data[key][0] : data[key];
      const subKeys = Object.keys(subData);
      const subTableName = toCamelCase(key);
      createTableFromKeys(subKeys, subData, subTableName, depth + 1);
    }
  });

  figma.currentPage.appendChild(tableFrame);
  figma.viewport.scrollAndZoomIntoView([tableFrame]);
}

function createRow(width: number, height: number, color: RGB, textValue: string, fontSize: number): FrameNode {
  const rowFrame = figma.createFrame();
  rowFrame.resize(width, height);
  rowFrame.backgrounds = [{ type: 'SOLID', color }];
  rowFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.5 }];
  rowFrame.strokeWeight = 1;
  rowFrame.strokeAlign = 'OUTSIDE';
  rowFrame.clipsContent = true;
  rowFrame.name = "Row";
  rowFrame.layoutMode = "HORIZONTAL";
  rowFrame.primaryAxisAlignItems = "CENTER";
  rowFrame.counterAxisAlignItems = "CENTER";
  rowFrame.minHeight = 50;                  // 최소 높이를 50으로 설정
  rowFrame.counterAxisSizingMode = "AUTO";  // 세로 크기를 "Fill container"로 설정


  const cellText = figma.createText();
  cellText.fontName = { family: "Inter", style: "Regular" };
  cellText.fontSize = fontSize;
  cellText.characters = textValue;
  cellText.resize(width, height);
  cellText.textAlignHorizontal = 'CENTER';
  cellText.textAlignVertical = 'CENTER';

  rowFrame.appendChild(cellText);

  return rowFrame;
}

function createCell(width: number, height: number, color: RGB, textValue: string, fontSize: number): FrameNode {
  const cellFrame = figma.createFrame();
  cellFrame.resize(width, height);
  cellFrame.backgrounds = [{ type: 'SOLID', color: color }];

  // Auto Layout 설정 추가
  cellFrame.layoutMode = "VERTICAL";  // Vertical Auto Layout 설정
  cellFrame.primaryAxisAlignItems = "CENTER";  // 중앙 정렬
  cellFrame.counterAxisAlignItems = "CENTER";  // 중앙 정렬
  cellFrame.itemSpacing = 0;  // 아이템 간격 설정
  cellFrame.minHeight = 50;                  // 최소 높이를 50으로 설정
  cellFrame.counterAxisSizingMode = "FIXED";  // 세로 크기를 "Fill container"로 설정
  cellFrame.counterAxisAlignItems = "CENTER";  // 세로 크기를 부모 프레임에 맞게 확장

  // Stroke를 추가해 셀을 구분합니다.
  cellFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  cellFrame.strokeWeight = 1;
  cellFrame.strokeAlign = "OUTSIDE";

  const cellText = figma.createText();
  cellText.fontName = { family: "Inter", style: "Regular" };
  cellText.fontSize = fontSize;
  cellText.characters = textValue;
  cellText.textAlignHorizontal = 'CENTER';
  cellText.textAlignVertical = 'CENTER';

  // 텍스트를 셀 프레임의 중앙에 배치합니다.
  cellText.x = (width - cellText.width) / 2;
  cellText.y = (height - cellText.height) / 2;

  cellFrame.appendChild(cellText);

  return cellFrame;
}
