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
  const ROW_HEIGHT = 40;
  const TABLE_WIDTH = 400;

  // Frame 생성 (컴포넌트로 만들어질 부모 프레임)
  const tableFrame = figma.createFrame();
  tableFrame.name = 'Table Component';
  tableFrame.resize(TABLE_WIDTH, (keys.length + 2) * ROW_HEIGHT); // +2 for the title and headers

  // 제목 추가
  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Regular" };
  title.fontSize = 18;
  title.characters = 'Table';
  title.x = 10;
  title.y = 10;
  tableFrame.appendChild(title);

  // 헤더 추가
  const headerField = figma.createText();
  headerField.fontName = { family: "Inter", style: "Regular" };
  headerField.fontSize = 16;
  headerField.characters = 'Field';
  headerField.x = 10;
  headerField.y = ROW_HEIGHT;
  tableFrame.appendChild(headerField);

  const headerType = figma.createText();
  headerType.fontName = { family: "Inter", style: "Regular" };
  headerType.fontSize = 16;
  headerType.characters = 'Type';
  headerType.x = TABLE_WIDTH / 2; // 중간 위치
  headerType.y = ROW_HEIGHT;
  tableFrame.appendChild(headerType);

  // 각 키와 그에 해당하는 타입을 행으로 추가
  keys.forEach((key, index) => {
    const yPosition = (index + 2) * ROW_HEIGHT;

    const keyText = figma.createText();
    keyText.fontName = { family: "Inter", style: "Regular" };
    keyText.fontSize = 14;
    keyText.characters = key;
    keyText.x = 10;
    keyText.y = yPosition;
    tableFrame.appendChild(keyText);

    const typeText = figma.createText();
    typeText.fontName = { family: "Inter", style: "Regular" };
    typeText.fontSize = 14;
    typeText.characters = getType(data[key]);
    typeText.x = TABLE_WIDTH / 2; // 중간 위치
    typeText.y = yPosition;
    tableFrame.appendChild(typeText);
  });

  // 프레임을 figma의 현재 페이지에 추가
  figma.currentPage.appendChild(tableFrame);

  // 사용자가 테이블을 쉽게 볼 수 있게 확대/이동
  figma.viewport.scrollAndZoomIntoView([tableFrame]);
}
