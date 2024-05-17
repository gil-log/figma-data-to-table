figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async msg => {
  if (msg.type === 'get-keys') {
    let data;
    let fromJson = true;
    const xmlPattern = /^<[?\w+]/;
    if (xmlPattern.test(msg.data)) {
      data = parseNode(msg.data);
      fromJson = false;
    } else {
      data = JSON.parse(removeControlCharacters(msg.data));
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        figma.ui.postMessage({ type: 'error', message: 'Invalid JSON or XML data. Make sure it is an object.' });
        return;
      }
    }
    const keys = Object.keys(data);
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      createTableFromKeys(keys, data, fromJson);
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Failed to load the font.' });
    }
  } else if (msg.type === 'view-data') {
    const nodes = figma.currentPage.selection;
    if (nodes.length > 0) {
      const node = nodes[0];
      let jsonData = node.getPluginData("myJsonData");
      if (!jsonData) {
        jsonData = node.getPluginData("myXmlData");
      }
      if (jsonData) {
        figma.ui.postMessage({ type: 'display-data', data: jsonData });
      }
    }
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

const currentXPositions: number[] = [];
let lastYPosition = 0;
const GAP_BETWEEN_TABLES = 100;

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

function createTableFromKeys(keys: string[], data: any, fromJson: boolean = true, tableName: string = "Table", depth: number = 0): void {
  const ROW_HEIGHT = 50;
  const TABLE_WIDTH = 800;
  const CELL_WIDTH = TABLE_WIDTH / 5;
  const TITLE_COLOR: RGB = { r: 0x98 / 0xFF, g: 0xAE / 0xFF, b: 0xFE / 0xFF };
  const ROW_COLOR: RGB = { r: 0xDB / 0xFF, g: 0xE3 / 0xFF, b: 0x88 / 0xFF };
  const FIELD_COLOR: RGB = { r: 0xD9 / 0xFF, g: 0xD9 / 0xFF, b: 0xD9 / 0xFF };

  if (currentXPositions[depth] === undefined) {
    currentXPositions[depth] = (currentXPositions[depth - 1] || 0) + TABLE_WIDTH + 50;
  }

  const tableFrame = figma.createFrame();
  tableFrame.resize(TABLE_WIDTH, (keys.length + 2) * ROW_HEIGHT);
  tableFrame.cornerRadius = 5;
  tableFrame.fills = [];

  tableFrame.y = lastYPosition;

  figma.currentPage.appendChild(tableFrame);
  figma.viewport.scrollAndZoomIntoView([tableFrame]);

  lastYPosition = tableFrame.y + tableFrame.height + GAP_BETWEEN_TABLES;

  if (depth > 0) {
    tableFrame.x = currentXPositions[depth - 1] + TABLE_WIDTH + 50;
    currentXPositions[depth] = tableFrame.x;
  } else {
    tableFrame.x = currentXPositions[depth];
    currentXPositions[depth] += TABLE_WIDTH + 50;
  }

  tableFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  tableFrame.strokeWeight = 1;
  tableFrame.strokeAlign = "OUTSIDE";

  tableFrame.name = tableName;

  tableFrame.layoutMode = "VERTICAL";
  tableFrame.primaryAxisAlignItems = "CENTER";
  tableFrame.counterAxisAlignItems = "CENTER";
  tableFrame.itemSpacing = 0;
  tableFrame.paddingTop = 0;
  tableFrame.paddingBottom = 0;
  tableFrame.paddingLeft = 0;
  tableFrame.paddingRight = 0;

  const tableTitleRow = createRow(TABLE_WIDTH, ROW_HEIGHT, TITLE_COLOR, tableName, 16);
  tableTitleRow.y = 0;
  tableFrame.appendChild(tableTitleRow);

  const headerRowFrame = figma.createFrame();
  headerRowFrame.resize(TABLE_WIDTH, ROW_HEIGHT);
  headerRowFrame.backgrounds = [];
  headerRowFrame.layoutMode = "HORIZONTAL";
  headerRowFrame.primaryAxisAlignItems = "CENTER";
  headerRowFrame.counterAxisAlignItems = "CENTER";
  headerRowFrame.itemSpacing = 0;
  headerRowFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.5 }];
  headerRowFrame.strokeWeight = 1;
  tableFrame.appendChild(headerRowFrame);

  if(fromJson) {
    tableFrame.setPluginData("myJsonData", JSON.stringify(data));
  } else {
    const xmlData = data.xml === undefined ? "" : data.xml;
    tableFrame.setPluginData("myXmlData", xmlData);
  }

  const titleFieldCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Field', 16);
  headerRowFrame.appendChild(titleFieldCell);

  const titleTypeCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Type', 16);
  headerRowFrame.appendChild(titleTypeCell);

  const titleMandatoryCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Mandatory', 16);
  headerRowFrame.appendChild(titleMandatoryCell);

  const titleDescriptionCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Description', 16);
  headerRowFrame.appendChild(titleDescriptionCell);

  const titleExampleCell = createCell(CELL_WIDTH, ROW_HEIGHT, FIELD_COLOR, 'Example', 16);
  headerRowFrame.appendChild(titleExampleCell);

  keys = keys.filter(key => key !== 'xml');

  keys.forEach((key, index) => {
    const yPosition = (index + 2) * ROW_HEIGHT;
    const rowFrame = figma.createFrame();

    rowFrame.resize(TABLE_WIDTH, ROW_HEIGHT);
    rowFrame.x = 0;
    rowFrame.y = yPosition;
    rowFrame.fills = [];
    rowFrame.layoutMode = "HORIZONTAL";
    rowFrame.primaryAxisAlignItems = "CENTER";
    rowFrame.counterAxisAlignItems = "CENTER";
    rowFrame.itemSpacing = 0;
    rowFrame.counterAxisSizingMode = "AUTO";

    tableFrame.appendChild(rowFrame);

    const keyCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, key, 14);
    rowFrame.appendChild(keyCell);

    let typeValue = getType(data[key]);
    if (typeValue === 'Object') {
      typeValue = toCamelCase(key);
    } else if (typeValue === 'Object Array') {
      typeValue = toCamelCase(key) + '[]';
    }
    const typeCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, typeValue, 14);
    rowFrame.appendChild(typeCell);

    const mandatoryCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, '', 14);
    rowFrame.appendChild(mandatoryCell);

    const descriptionCell = createCell(CELL_WIDTH , ROW_HEIGHT, ROW_COLOR, '', 14);
    rowFrame.appendChild(descriptionCell);

    const exampleText = typeof data[key] === 'object' ? `"${key}": -` : fromJson ? `"${key}": "${data[key]}"` : `"${data[key]}"`;
    const exampleCell = createCell(CELL_WIDTH, ROW_HEIGHT, ROW_COLOR, exampleText, 14);
    rowFrame.appendChild(exampleCell);

    if (!fromJson && key === "attributes" && typeof data[key] === 'object') {
      const attributesData = data[key];
      const ATTRIBUTE_ROW_COLOR = { r: 0x78 / 0xFF, g: 0xDD / 0xFF, b: 0xAC / 0xFF };
      Object.keys(attributesData).forEach((attributeKey, attributeIndex) => {
        const attributeYPosition = (index + 2 + attributeIndex) * ROW_HEIGHT;
        const attributeRowFrame = figma.createFrame();
        attributeRowFrame.resize(TABLE_WIDTH, ROW_HEIGHT);
        attributeRowFrame.x = 0;
        attributeRowFrame.y = attributeYPosition;
        attributeRowFrame.fills = [];
        attributeRowFrame.layoutMode = "HORIZONTAL";
        attributeRowFrame.primaryAxisAlignItems = "CENTER";
        attributeRowFrame.counterAxisAlignItems = "CENTER";
        attributeRowFrame.itemSpacing = 0;
        attributeRowFrame.counterAxisSizingMode = "AUTO";

        tableFrame.appendChild(attributeRowFrame);

        const attributeKeyCell = createCell(CELL_WIDTH, ROW_HEIGHT, ATTRIBUTE_ROW_COLOR, attributeKey, 14);
        attributeRowFrame.appendChild(attributeKeyCell);

        const attributeTypeCell = createCell(CELL_WIDTH, ROW_HEIGHT, ATTRIBUTE_ROW_COLOR, 'Attribute', 14);
        attributeRowFrame.appendChild(attributeTypeCell);

        const attributeMandatoryCell = createCell(CELL_WIDTH, ROW_HEIGHT, ATTRIBUTE_ROW_COLOR, '', 14);
        attributeRowFrame.appendChild(attributeMandatoryCell);

        const attributeDescriptionCell = createCell(CELL_WIDTH, ROW_HEIGHT, ATTRIBUTE_ROW_COLOR, '', 14);
        attributeRowFrame.appendChild(attributeDescriptionCell);

        const attributeExampleText = `"${attributeKey}"="${attributesData[attributeKey]}"`;
        const attributeExampleCell = createCell(CELL_WIDTH, ROW_HEIGHT, ATTRIBUTE_ROW_COLOR, attributeExampleText, 14);
        attributeRowFrame.appendChild(attributeExampleCell);
      });
      rowFrame.y += (Object.keys(attributesData).length) * ROW_HEIGHT;
    }

    if (typeValue === toCamelCase(key) || typeValue === toCamelCase(key) + '[]') {
      const subData = Array.isArray(data[key]) ? data[key][0] : data[key];
      const subKeys = Object.keys(subData);
      const subTableName = toCamelCase(key);
      if(key !== "attributes") {
        createTableFromKeys(subKeys, subData, fromJson, subTableName, depth + 1);
      }
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
  rowFrame.minHeight = 50;
  rowFrame.counterAxisSizingMode = "AUTO";


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
  cellFrame.layoutMode = "VERTICAL";
  cellFrame.primaryAxisAlignItems = "CENTER";
  cellFrame.counterAxisAlignItems = "CENTER";
  cellFrame.itemSpacing = 0;
  cellFrame.minHeight = 50;
  cellFrame.counterAxisSizingMode = "FIXED";
  cellFrame.counterAxisAlignItems = "CENTER";

  cellFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  cellFrame.strokeWeight = 1;
  cellFrame.strokeAlign = "OUTSIDE";

  const cellText = figma.createText();
  cellText.fontName = { family: "Inter", style: "Regular" };
  cellText.fontSize = fontSize;
  cellText.characters = textValue;
  cellText.textAlignHorizontal = 'CENTER';
  cellText.textAlignVertical = 'CENTER';

  cellText.x = (width - cellText.width) / 2;
  cellText.y = (height - cellText.height) / 2;

  cellFrame.appendChild(cellText);

  return cellFrame;
}

type XmlNode = {
  attributes?: { [key: string]: string };
  value?: string;
  [key: string]: any;
  xml?: string;
};

function parseNode(xml: string, parentXml = ""): XmlNode {
  xml = xml.replace(/<!\[CDATA\[(.*?)]]>/g, "$1");
  const attributesPattern = /(\w+)=["'](.*?)["']/g;
  const nodePattern = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>|<(\w+)([^>]*)\/>/g;
  let match;
  const result: XmlNode = {};

  while ((match = nodePattern.exec(xml))) {
    let tagName = match[1] || match[4];
    let innerAttributes = match[2] || match[5];
    let innerContent = match[3] || "";
    const attributes: { [key: string]: string } = {};
    let attributesMatch;

    while ((attributesMatch = attributesPattern.exec(innerAttributes))) {
      attributes[attributesMatch[1]] = attributesMatch[2];
    }
    const node: XmlNode = { xml: match[0] };
    if (innerContent && /<.*>/.test(innerContent)) {
      Object.assign(node, parseNode(innerContent, match[0]));
    } else if (innerContent.trim()) {
      node.value = innerContent.trim();
    }
    if (Object.keys(attributes).length) {
      node.attributes = attributes;
    }
    if (result[tagName]) {
      if (Array.isArray(result[tagName])) {
        result[tagName].push(node);
      } else {
        result[tagName] = [result[tagName], node];
      }
    } else {
      result[tagName] = node;
    }
  }
  if (parentXml) {
    result.xml = parentXml;
  }
  return result;
}

function removeControlCharacters(str: string): string {
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}
